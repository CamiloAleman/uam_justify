from django.shortcuts import render

# Create your views here.

# core/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Justificacion, Aprobacion, Documento, Asignatura, MotivoAusencia, Facultad, User, MotivoAusencia
from .serializers import JustificacionSerializer, AprobacionSerializer, DocumentoSerializer, AsignaturaSerializer, FacultadSerializer, UserSerializer, MotivoAusenciaSerializer

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

class JustificacionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Justificacion.objects.all().order_by('-fecha_solicitud')
    serializer_class = JustificacionSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_permissions(self):
        if self.action in ['create','my_requests']:
            permission_classes = [permissions.IsAuthenticated, IsEstudiante]
        elif self.action in ['list','retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [p() for p in permission_classes]

    def perform_create(self, serializer):
        # el serializer.create asigna estudiante si request.user
        #serializer.save()
        serializer.save(estudiante=self.request.user)

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
    queryset = Aprobacion.objects.all().order_by('-fecha_revision')
    serializer_class = AprobacionSerializer

    def get_permissions(self):
        # solo coordinador o docente puede crear aprobaciones
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [p() for p in permission_classes]

    def perform_create(self, serializer):
        # valida que user tenga rol apropiado (coordinador/docente)
        if self.request.user.role not in ['COORDINADOR','DOCENTE']:
            return Response({'detail':'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()

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

class AsignaturaViewSet(viewsets.ModelViewSet):
    #queryset = Asignatura.objects.filter(estado='ACTIVO')
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer

class FacultadViewSet(viewsets.ModelViewSet):
    #queryset = Facultad.objects.filter(estado='ACTIVO')
    queryset = Facultad.objects.all()
    serializer_class = FacultadSerializer
    permission_classes = [IsAdminOrReadOnly]

class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all().order_by('-fecha_subida')
    serializer_class = DocumentoSerializer
    # manejo de upload se puede hacer aquí