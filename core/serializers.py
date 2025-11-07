# core/serializers.py
from rest_framework import serializers
from .models import User, Asignatura, MotivoAusencia, Documento, Justificacion, Aprobacion, Facultad, MotivoAusencia

class MotivoAusenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotivoAusencia
        fields = ['id', 'nombre', 'codigo', 'descripcion', 'activo']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','primer_nombre','segundo_nombre','primer_apellido','segundo_apellido',
                  'correo_institucional','cif_identificacion','role']

class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = ['id','codigo','nombre','facultad','docente']

class FacultadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facultad
        fields = ['id', 'nombre', 'descripcion', 'estado', 'codigo', 'fecha_registro', 'fecha_ultima_modificacion']

class DocumentoSerializer(serializers.ModelSerializer):
    # si cambias a FileField, usa serializers.FileField()
    class Meta:
        model = Documento
        fields = ['id','nombre_archivo','ruta_almacenamiento','mime_type','tamano_bytes','subido_por','fecha_subida']

class JustificacionSerializer(serializers.ModelSerializer):
    estudiante_detail = serializers.SerializerMethodField(read_only=True)
    #archivos = YourArchivoSerializer(many=True, read_only=True)

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
            'archivo_principal',
            'estado',
            'fecha_resolucion',
            'observaciones',
        ]

    def get_estudiante_detail(self, obj):
        if obj.estudiante:
            return {
                "id": obj.estudiante.id,
                "nombre": f"{obj.estudiante.primer_nombre} {obj.estudiante.primer_apellido}",
                "correo": obj.estudiante.correo_institucional,
                "role": obj.estudiante.role
            }
        return None
        
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