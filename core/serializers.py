# core/serializers.py
from rest_framework import serializers
from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename
from django.contrib.auth.hashers import make_password

import hashlib

from .models import (
    User, Asignatura, MotivoAusencia, Documento,
    Justificacion, Aprobacion, Facultad, Carrera
)

# ---------- Catálogos ----------
class MotivoAusenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotivoAusencia
        fields = ['id', 'nombre', 'codigo', 'descripcion', 'activo']


class FacultadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facultad
        fields = ['id', 'nombre', 'descripcion', 'estado', 'codigo', 'fecha_registro', 'fecha_ultima_modificacion']

class CarreraSerializer(serializers.ModelSerializer):
    
    facultad = FacultadSerializer(read_only=True)          # nested read
    facultad_id = serializers.PrimaryKeyRelatedField(      # write-only PK
        source='facultad', queryset=Facultad.objects.all(), write_only=True, required=False, allow_null=True)

    class Meta:
        model = Carrera
        fields = ['id', 'nombre', 'descripcion', 'estado', 'facultad','facultad_id']


class UserSerializer(serializers.ModelSerializer):
    carrera = CarreraSerializer(read_only=True)
    carrera_id = serializers.PrimaryKeyRelatedField(source='carrera', queryset=Carrera.objects.all(), 
                                                    write_only=True, required=False, allow_null = True)
    
    facultad = FacultadSerializer(read_only=True)    
    facultad_id = serializers.PrimaryKeyRelatedField(
        source='facultad', queryset=Facultad.objects.all(),
        write_only=True, required=False, allow_null=True
    )

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido',
            'correo_institucional', 'cif_identificacion', 'role', 'carrera','carrera_id', 'facultad', 'facultad_id', 'password'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        """
        Validación cross-field:
        - DOCENTE: facultad obligatoria
        - COORDINADOR: carrera obligatoria
        - ESTUDIANTE: carrera obligatoria
        """
        # role puede venir en attrs (si se actualiza) o consultarse desde instance
        #role = attrs.get('role', getattr(self.instance, 'role', None))

        role = None
        if 'role' in attrs:
            role = attrs.get('role')
        elif self.instance:
            role = self.instance.role    

        # 'carrera' y 'facultad' vienen en attrs por source, o en la instancia
        carrera = attrs.get('carrera') if 'carrera' in attrs else getattr(self.instance, 'carrera', None)
        facultad = attrs.get('facultad') if 'facultad' in attrs else getattr(self.instance, 'facultad', None)

        role_str = str(role).upper() if role else None

        if role_str == 'DOCENTE' and not facultad:
            raise serializers.ValidationError({'facultad_id': 'La facultad es obligatoria para usuarios con rol DOCENTE.'})
        if role_str in ('COORDINADOR', 'ESTUDIANTE') and not carrera:
            raise serializers.ValidationError({'carrera_id': 'La carrera es obligatoria para el rol seleccionado.'})

        return super().validate(attrs)
    
    def create(self, validated_data):
        # validated_data puede contener 'carrera' y/o 'facultad' (objetos)
        carrera = validated_data.pop('carrera', None)
        facultad = validated_data.pop('facultad', None)

        # extraer password si fue provisto
        pwd = validated_data.pop('password', None)

        # regla: si es estudiante y carrera provista -> asignar facultad según carrera
        role = validated_data.get('role', None)
        role_str = str(role).upper() if role else None
        if role_str == 'ESTUDIANTE' and carrera and not facultad:
            facultad = carrera.facultad  # asignar FK de la carrera

        user = User.objects.create(**validated_data)
        # set relations afterwards to avoid PK problems
        if carrera:
            user.carrera = carrera
        if facultad:
            user.facultad = facultad

        if pwd:
            # si tu modelo hereda de AbstractBaseUser, usa set_password
            try:
                user.set_password(pwd)
            except Exception:
                # fallback si tu modelo usa campo password_hash
                user.password = make_password(pwd)

        user.save()

        return user

    def update(self, instance, validated_data):
        # similar a create: mantener coherencia en update
        carrera = validated_data.pop('carrera', None)
        facultad = validated_data.pop('facultad', None)            
        pwd = validated_data.pop('password', None)


        role = validated_data.get('role', getattr(instance, 'role', None))
        role_str = str(role).upper() if role else None

        # Si al actualizar se establece carrera para ESTUDIANTE, fijar facultad si no se pasó.
        if role_str == 'ESTUDIANTE' and carrera and not facultad:
            facultad = carrera.facultad

        # Aplicar otros cambios directos
        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        # relaciones
        if carrera is not None:
            instance.carrera = carrera
        if facultad is not None:
            instance.facultad = facultad

        if pwd:
            try:
                instance.set_password(pwd)
            except Exception:
                instance.password = make_password(pwd)

        instance.save()
        return instance

class AsignaturaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Asignatura
        fields = ['id', 'codigo', 'nombre', 'facultad', 'docente']


class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = [
            'id', 'nombre_archivo', 'ruta_almacenamiento', 'mime_type',
            'tamano_bytes', 'checksum_sha256', 'subido_por', 'fecha_subida', 'estado'
        ]


# ---------- Justificación ----------
class JustificacionSerializer(serializers.ModelSerializer):
    estudiante_detail = serializers.SerializerMethodField(read_only=True)
    estudiante = serializers.PrimaryKeyRelatedField(read_only=True)

    asignatura_nombre = serializers.SerializerMethodField(read_only=True)
    asignatura_detail = serializers.SerializerMethodField(read_only=True)

    motivo_nombre = serializers.SerializerMethodField(read_only=True)

    # frontend envía archivo; creamos Documento y lo enlazamos
    archivo_principal = serializers.FileField(write_only=True, required=False, allow_empty_file=False)
    archivo_principal_id = serializers.UUIDField(source='archivo_principal.id', read_only=True)
    archivo_principal_path = serializers.CharField(source='archivo_principal.ruta_almacenamiento', read_only=True)

    class Meta:
        model = Justificacion
        fields = [
            
            'id',
            'estudiante',
            'estudiante_detail',
            'asignatura',
            'asignatura_nombre',
            'asignatura_detail',
            'fecha_ausencia_inicio',
            'fecha_ausencia_fin',
            'fecha_solicitud',
            'motivo',
            'motivo_nombre',
            'descripcion_detallada',
            'archivo_principal',
            'archivo_principal_id',
            'estado',
            'fecha_resolucion',
            'observaciones',
            'archivo_principal_path',
        ]
        read_only_fields = [
            'id', 'estudiante', 'estado', 'fecha_solicitud',
            'fecha_resolucion', 'fecha_actualizacion'
        ]

    def get_motivo_nombre(self, obj):
        m = getattr(obj, 'motivo', None)
        if not m:
            return None
        # si motivo es FK a un modelo
        return getattr(m, 'nombre', str(m))

    def get_estudiante_detail(self, obj):
        u = getattr(obj, 'estudiante', None)
        if u:
            return {
                "id": u.id,
                "nombre": f"{u.primer_nombre} {u.primer_apellido}",
                "correo": u.correo_institucional,
                "role": u.role,
            }
        return None
    
    def get_asignatura_nombre(self, obj):
        a = getattr(obj, 'asignatura', None)
        if a:
            # Ajusta el campo si tu modelo usa otro nombre (ej.: 'nombre_asignatura')
            return getattr(a, 'nombre', str(a))
        return None

    def get_asignatura_detail(self, obj):
        a = getattr(obj, 'asignatura', None)
        if a:
            return {
                "id": a.id,
                "nombre": getattr(a, 'nombre', ''),
                # añade otros campos si conviene: "codigo": a.codigo, etc.
            }
        return None

    def _crear_documento_para(self, justificacion, file_obj, usuario):
        safe_name = get_valid_filename(file_obj.name)
        storage_path = default_storage.save(f'justificaciones/{justificacion.id}/{safe_name}', file_obj)
        sha256 = hashlib.sha256()
        with default_storage.open(storage_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return Documento.objects.create(
            nombre_archivo=safe_name,
            ruta_almacenamiento=storage_path,
            mime_type=getattr(file_obj, 'content_type', None),
            tamano_bytes=getattr(file_obj, 'size', None),
            checksum_sha256=sha256.hexdigest(),
            subido_por=usuario,
            justificacion=justificacion,
            estado='DISPONIBLE',
        )

    def create(self, validated_data):
        request = self.context.get('request')
        file_obj = validated_data.pop('archivo_principal', None)
        justificacion = Justificacion.objects.create(**validated_data)
        if file_obj:
            doc = self._crear_documento_para(justificacion, file_obj, request.user if request else None)
            justificacion.archivo_principal = doc
            justificacion.save(update_fields=['archivo_principal'])
        return justificacion

    def update(self, instance, validated_data):
        request = self.context.get('request')
        file_obj = validated_data.pop('archivo_principal', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if file_obj:
            doc = self._crear_documento_para(instance, file_obj, request.user if request else None)
            instance.archivo_principal = doc
        instance.save()
        return instance


# ---------- Aprobación ----------
class AprobacionSerializer(serializers.ModelSerializer):
    justificacion = JustificacionSerializer(read_only=True)
    revisor = UserSerializer(read_only=True)

    class Meta:
        model = Aprobacion
        fields = ['id', 'justificacion', 'revisor', 'rol_revisor', 'fecha_revision', 'estado', 'comentario']
        read_only_fields = ['revisor', 'fecha_revision']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['revisor'] = request.user
        return super().create(validated_data)
