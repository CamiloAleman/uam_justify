# core/serializers.py
from rest_framework import serializers
from .models import User, Asignatura, MotivoAusencia, Documento, Justificacion, Aprobacion

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','primer_nombre','segundo_nombre','primer_apellido','segundo_apellido',
                  'correo_institucional','cif_identificacion','role']

class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = ['id','codigo','nombre','facultad','docente']

class DocumentoSerializer(serializers.ModelSerializer):
    # si cambias a FileField, usa serializers.FileField()
    class Meta:
        model = Documento
        fields = ['id','nombre_archivo','ruta_almacenamiento','mime_type','tamano_bytes','subido_por','fecha_subida']

class JustificacionSerializer(serializers.ModelSerializer):
    estudiante = UserSerializer(read_only=True)
    archivos = DocumentoSerializer(source='documentos', many=True, read_only=True)

    class Meta:
        model = Justificacion
        fields = [
            'id','estudiante','asignatura','fecha_ausencia_inicio','fecha_ausencia_fin',
            'fecha_solicitud','motivo','descripcion_detallada','archivo_principal','archivos',
            'estado','fecha_resolucion','observaciones'
        ]
        read_only_fields = ['estado','fecha_solicitud','fecha_resolucion']

    def create(self, validated_data):
        request = self.context.get('request')
        # assign estudiante automatically from request.user (si role ESTUDIANTE)
        if request and hasattr(request, 'user'):
            validated_data['estudiante'] = request.user
        just = super().create(validated_data)
        return just

class AprobacionSerializer(serializers.ModelSerializer):
    revisor = UserSerializer(read_only=True)
    class Meta:
        model = Aprobacion
        fields = ['id','justificacion','revisor','rol_revisor','fecha_revision','estado','comentario']
        read_only_fields = ['revisor','fecha_revision']
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['revisor'] = request.user
        return super().create(validated_data)
