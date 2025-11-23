from django.shortcuts import render

# Create your views here.

# core/views.py
from django.db import transaction
from django.conf import settings
import logging
from rest_framework.exceptions import PermissionDenied  
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Justificacion, Aprobacion, Documento, Asignatura, MotivoAusencia, Facultad, User, MotivoAusencia, Carrera
from .serializers import JustificacionSerializer, AprobacionSerializer, DocumentoSerializer, AsignaturaSerializer, FacultadSerializer, UserSerializer, MotivoAusenciaSerializer, CarreraSerializer

logger = logging.getLogger(__name__)

def send_decision_email(estudiante, justificacion, estado, comentario):
    """
    Función utilitaria para enviar email al estudiante.
    La dejamos a nivel módulo para poder reutilizarla y testearla.
    """
    if estudiante is None:
        return

    # asegúrate que estudiante tenga correo_institucional o email
    to = getattr(estudiante, 'correo_institucional', None) or getattr(estudiante, 'email', None)
    if not to:
        return

    subject = f"Resultado de la justificación: {estado}"
    body_lines = [
        f"Hola {getattr(estudiante, 'primer_nombre', '')},",
        "",
        f"Tu justificación para la asignatura: {getattr(justificacion, 'asignatura', '')} ha sido: {estado}.",
        f"Fechas: {getattr(justificacion, 'fecha_ausencia_inicio', '')} — {getattr(justificacion, 'fecha_ausencia_fin', '')}.",
    ]
    if comentario:
        body_lines += ["", "Comentario:", comentario]

    body_lines += ["", "Atentamente,", settings.DEFAULT_FROM_EMAIL or "Secretaría Académica"]
    body = "\n".join(body_lines)

    # En producción puedes querer fail_silently=True y loggear errores
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to],
        fail_silently=False,
    )

class IsEstudiante(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ESTUDIANTE'

class IsSecretaria(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SECRETARIA'

class IsCoordinador(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'COORDINADOR'

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and (request.user.is_staff or request.user.role == 'ADMIN')

class MotivoAusenciaViewset(viewsets.ModelViewSet):
    queryset = MotivoAusencia.objects.all()
    serializer_class = MotivoAusenciaSerializer
    permission_classes = [IsAuthenticated]

class CarreraViewSet(viewsets.ModelViewSet):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer
    permission_classes = [permissions.IsAuthenticated]

class JustificacionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    #queryset = Justificacion.objects.all().order_by('-fecha_solicitud')
    queryset = Justificacion.objects.select_related('asignatura', 'estudiante', 'archivo_principal').all()

    
    serializer_class = JustificacionSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        qs = super().get_queryset()

        user = self.request.user

        # Si es estudiante → solo sus propias justificaciones
        if user.role == "ESTUDIANTE":
            return qs.filter(estudiante=user)

        # Si es docente → las que debe revisar
        if user.role == "DOCENTE":
            return qs.filter(aprobaciones__revisor=user).distinct()

        # Si es coordinador → las de su carrera
        if user.role == "COORDINADOR":
            return qs.filter(estudiante__carrera=user.carrera).distinct()

        # Si es admin → ve todo
        return qs

    def get_permissions(self):
        if self.action in ['create','my_requests']:
            permission_classes = [permissions.IsAuthenticated, IsEstudiante]
        elif self.action in ['list','retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [p() for p in permission_classes]

    def perform_create(self, serializer):
        """
        Guarda la justificacion y crea automáticamente las aprobaciones necesarias:
        - coordinadores de la carrera del estudiante (rol_revisor='COORDINADOR')
        - docente de la asignatura (si aplica) (rol_revisor='DOCENTE')
        """
        request = self.request
        user = request.user

        with transaction.atomic():
            # 1) guardar justificacion (estudiante = request.user)
            justificacion = serializer.save(estudiante=user)

            # 2) crear aprobaciones para coordinadores de la carrera del estudiante
            carrera = getattr(user, 'carrera', None)
            if carrera:
                coordinadores = User.objects.filter(role__iexact='COORDINADOR', carrera=carrera)
                for coord in coordinadores:
                    Aprobacion.objects.create(
                        justificacion=justificacion,
                        revisor=coord,
                        rol_revisor='COORDINADOR',
                        estado='PENDIENTE',
                        fecha_revision=timezone.now()
                    )

            # 3) crear aprobacion para docente de la asignatura (si tiene docente)
            asignatura = getattr(justificacion, 'asignatura', None)
            if asignatura:
                docente = getattr(asignatura, 'docente', None)
                if docente:
                    # Evitar duplicados si el docente también es coordinador ya añadido
                    exists = Aprobacion.objects.filter(justificacion=justificacion, revisor=docente).exists()
                    if not exists:
                        Aprobacion.objects.create(
                            justificacion=justificacion,
                            revisor=docente,
                            rol_revisor='DOCENTE',
                            estado='PENDIENTE',
                            fecha_revision=timezone.now()
                        )

            # opcional: registrar en historial_accion (si tienes ese modelo)
            try:
                from .models import HistorialAccion
                HistorialAccion.objects.create(
                    usuario=user,
                    tipo_accion='CREAR_JUSTIFICACION',
                    descripcion_accion=f'Justificación {justificacion.id} creada por {user.id}',
                    referencia_id=justificacion.id
                )
            except Exception:
                pass

            # se sale del atomic; si algo falla se hace rollback automáticamente


    @action(detail=False, methods=['get'], url_path='mine')
    def my_requests(self, request):
        qs = self.queryset.filter(estudiante=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)

class AprobacionViewSet(viewsets.ModelViewSet):
    serializer_class = AprobacionSerializer
    queryset = Aprobacion.objects.all().order_by('-fecha_revision')

    def get_permissions(self):
        # mantener autenticación mínima; ajusta según tus reglas
        permission_classes = [IsAuthenticated]
        return [p() for p in permission_classes]

    def get_queryset(self):
        # Mantén tu lógica general (si ya la tienes); este método puede coexistir con 'mine'
        user = self.request.user
        qs = super().get_queryset()
        if getattr(user, 'role', '').upper() in ('ADMIN',) or user.is_superuser:
            return qs
        return qs

    @action(detail=False, methods=['get'], url_path='mine', permission_classes=[IsAuthenticated])
    def mine(self, request):
        """
        GET /api/aprobaciones/mine/
        Devuelve las aprobaciones visibles para el usuario actual, filtrado por rol.
        """
        user = request.user
        qs = Aprobacion.objects.all()
        role = getattr(user, 'role', '').upper()

        if role == 'COORDINADOR':
            user_carrera = getattr(user, 'carrera', None)
            if user_carrera:
                qs = qs.filter(Q(justificacion__estudiante__carrera=user_carrera) | Q(revisor=user))
            else:
                qs = qs.filter(revisor=user)

        elif role == 'DOCENTE':
            qs = qs.filter(Q(revisor=user) | Q(justificacion__asignatura__docente=user))

        elif role == 'ESTUDIANTE':
            qs = qs.filter(justificacion__estudiante=user)

        else:
            qs = qs.filter(revisor=user)

        qs = qs.order_by('-fecha_revision')

        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)

        ser = self.get_serializer(qs, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='decide', permission_classes=[IsAuthenticated])
    def decide(self, request, pk=None):
        """
        POST /api/aprobaciones/{pk}/decide/
        Body: { "estado": "APROBADO" | "RECHAZADO", "comentario": "texto opcional" }
        """
        aprobacion = self.get_object()  # 404 si no existe

        # Opcional: chequear rol del usuario que decide
        user = request.user
        role = getattr(user, 'role', '').upper()
        if role not in ('COORDINADOR', 'ADMIN', 'DECANO') and not user.is_superuser:
            return Response({'detail': 'No autorizado para resolver aprobaciones.'}, status=status.HTTP_403_FORBIDDEN)

        estado = request.data.get('estado')
        comentario = request.data.get('comentario', '')

        if estado not in ('APROBADO', 'RECHAZADO'):
            return Response({'detail': 'Valor de estado inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # actualizar la aprobación
        aprobacion.estado = estado
        aprobacion.comentario = comentario
        aprobacion.fecha_resolucion = timezone.now()
        # opcional: guardamos quién resolvió si el modelo tiene campo (ej: 'resuelto_por')
        if hasattr(aprobacion, 'resuelto_por'):
            aprobacion.resuelto_por = user
        aprobacion.save()

        # actualizar la justificación relacionada si existe
        j = getattr(aprobacion, 'justificacion', None)
        if j:
            j.estado = estado
            j.fecha_resolucion = timezone.now()
            j.observaciones = comentario or j.observaciones
            j.save()

        # Enviar correo (síncrono). Recomiendo usar Celery en producción.
        try:
            estudiante = j.estudiante if j and getattr(j, 'estudiante', None) else None
            send_decision_email(estudiante, j, estado, comentario)
        except Exception as e:
            # no rompemos la respuesta si falla el correo; loguear en producción
            print("Error sending decision email:", e)

        ser = self.get_serializer(aprobacion)
        return Response(ser.data, status=status.HTTP_200_OK)

        @action(detail=True, methods=['post'], url_path='decide')
        def decide(self, request, pk=None):
            """
            Endpoint: POST /aprobaciones/{pk}/decide/
            Body: { "estado": "APROBADO" | "RECHAZADO", "comentario": "texto opcional" }
            """
            aprobacion = self.get_object()  # 404 si no existe
            estado = request.data.get('estado')
            comentario = request.data.get('comentario', '')

            if estado not in ('APROBADO', 'RECHAZADO'):
                return Response({'detail': 'Valor de estado inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            # actualizar la aprobación (o la justificación según tu modelo)
            aprobacion.estado = estado
            aprobacion.comentario = comentario
            aprobacion.fecha_resolucion = timezone.now()
            aprobacion.save()

            # también actualizar la justificación relacionada si hace falta
            j = getattr(aprobacion, 'justificacion', None)
            if j:
                j.estado = estado
                j.fecha_resolucion = timezone.now()
                j.observaciones = comentario or j.observaciones
                j.save()

            # preparar envío de correo (ver abajo: función send_decision_email)
            estudiante = None
            if j and getattr(j, 'estudiante', None):
                estudiante = j.estudiante

            # llama a función que envía email (sin bloquear idealmente)
            try:
                # opción simple (sin Celery): envío síncrono
                send_decision_email(estudiante, j, estado, comentario)
            except Exception as e:
                # no rompemos la respuesta por fallo en el correo
                # loggear el error en producción
                print("Error sending decision email:", e)

            serializer = self.get_serializer(aprobacion)
            return Response(serializer.data, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para usuarios.
    - List/create/update/delete: solo AdminUser (IsAdminUser).
    - GET /api/users/me/ : devuelve el perfil del usuario autenticado.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]  # protege operaciones administrativas

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        GET /api/users/me/  -> devuelve datos del usuario autenticado.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def get_queryset(self):
        """
        Sobrescribimos get_queryset para soportar:
        /api/usuarios/?role=DOCENTE  -> devolver sólo docentes.
        La comparación es case-insensitive.
        """
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            # Aceptamos role por nombre exacto (DOCENTE, ADMIN, ESTUDIANTE, etc.)
            return qs.filter(role__iexact=role)
        return qs
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='set-password')
    def set_password(self, request, pk=None):
        """
        Admin sets a temporary password for user. Body: {"password":"temporal123"}
        Returns 204 NO CONTENT.
        """
        user = self.get_object()
        new_password = request.data.get('password')
        if not new_password:
            return Response({'detail':'password required'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        # Opcional: crear historial_accion indicando el cambio
        # HistorialAccion.objects.create(usuario=request.user, tipo_accion='RESET_PASSWORD', descripcion_accion=f'Admin {request.user.id} cambió contraseña de {user.id}')
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def generate_temp_password(self, request, pk=None):
        user = self.get_object()
        temp = secrets.token_urlsafe(8)
        user.set_password(temp)
        user.save()
        # OPCIONAL: enviar correo
        # send_mail('UAM Justify - contraseña temporal', f'Tu contraseña temporal: {temp}', 'no-reply@uam.edu.ni', [user.correo_institucional])
        return Response({'temp_password': temp}, status=status.HTTP_200_OK)
    
    def create(self, request, *args, **kwargs):
         """
         Override temporal para debug: muestra exactamente request.data recibido
         al crear un usuario. El método delega luego en el comportamiento por
         defecto de ModelViewSet.create().
         """
         import logging, pprint
         logger = logging.getLogger(__name__)

         # muestra en logs (más limpio que print)
         logger.debug("DEBUG /api/usuarios/ CREATE request.data:\n%s", pprint.pformat(request.data))

         # tambien opcionalmente imprimir en consola para verlo sin buscar logs
         print("DEBUG /api/usuarios/ CREATE request.data:", request.data)

         return super().create(request, *args, **kwargs)

class AsignaturaViewSet(viewsets.ModelViewSet):
    #queryset = Asignatura.objects.filter(estado='ACTIVO')
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer
    permission_classes = [IsAuthenticated]

class FacultadViewSet(viewsets.ModelViewSet):
    #queryset = Facultad.objects.filter(estado='ACTIVO')
    queryset = Facultad.objects.all()
    serializer_class = FacultadSerializer
    permission_classes = [IsAdminOrReadOnly]

class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all().order_by('-fecha_subida')
    serializer_class = DocumentoSerializer
    # manejo de upload se puede hacer aquí