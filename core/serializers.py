# core/serializers.py
from rest_framework import serializers
from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename
import hashlib

from .models import (
    User, Asignatura, MotivoAusencia, Documento,
    Justificacion, Aprobacion, Facultad
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


class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = ['id', 'codigo', 'nombre', 'facultad', 'docente']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido',
            'correo_institucional', 'cif_identificacion', 'role'
        ]


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
            'fecha_ausencia_inicio',
            'fecha_ausencia_fin',
            'fecha_solicitud',
            'motivo',
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
