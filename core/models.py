# core/models.py
import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.utils import timezone
from django.core.validators import RegexValidator

# ---------------------------
# Constants / Choices
# ---------------------------
ROLE_CHOICES = [
    ("ESTUDIANTE", "Estudiante"),
    ("DOCENTE", "Docente"),
    ("COORDINADOR", "Coordinador"),
    ("SECRETARIA", "Secretaría"),
    ("ADMIN", "Administrador"),
]

ESTADO_CHOICES = [
    ("ACTIVO", "Activo"),
    ("INACTIVO", "Inactivo"),
    ("SUSPENDIDO", "Suspendido"),
]

JUSTIFICACION_ESTADO = [
    ("PENDIENTE", "Pendiente"),
    ("EN_REVISION", "En revisión"),
    ("APROBADO", "Aprobado"),
    ("RECHAZADO", "Rechazado"),
    ("OBSERVADO", "Observado"),
]

APROBACION_ESTADO = [
    ("APROBADO", "Aprobado"),
    ("RECHAZADO", "Rechazado"),
    ("OBSERVADO", "Observado"),
]

MOTIVO_CHOICES = [
    ("MED", "Médica"),
    ("DEP", "Deportiva"),
    ("OTR", "Otro"),
]


# ---------------------------
# Custom User Manager
# ---------------------------
class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, correo_institucional, cif_identificacion, password, **extra_fields):
        if not correo_institucional:
            raise ValueError("El correo institucional debe ser proporcionado")
        if not cif_identificacion:
            raise ValueError("El CIF/identificación debe ser proporcionado")

        correo_institucional = self.normalize_email(correo_institucional)
        user = self.model(
            correo_institucional=correo_institucional,
            cif_identificacion=cif_identificacion,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, correo_institucional, cif_identificacion, password=None, **extra_fields):
        extra_fields.setdefault("role", "ESTUDIANTE")
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(correo_institucional, cif_identificacion, password, **extra_fields)

    def create_superuser(self, correo_institucional, cif_identificacion, password=None, **extra_fields):
        extra_fields.setdefault("role", "ESTUDIANTE")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(correo_institucional, cif_identificacion, password, **extra_fields)


# ---------------------------
# User model (unificado)
# ---------------------------
class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    primer_nombre = models.CharField(max_length=100)
    segundo_nombre = models.CharField(max_length=100, blank=True, null=True)
    primer_apellido = models.CharField(max_length=100)
    segundo_apellido = models.CharField(max_length=100, blank=True, null=True)

    correo_institucional = models.EmailField(unique=True, max_length=255)
    telefono_celular = models.CharField(max_length=20, blank=True, null=True)
    telefono_oficina = models.CharField(max_length=20, blank=True, null=True)

    cif_identificacion = models.CharField(max_length=50, unique=True,
                                          validators=[RegexValidator(r'^[\w-]+$', 'Formato inválido para CIF')])

    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="ACTIVO")
    fecha_registro = models.DateTimeField(default=timezone.now)
    fecha_ultima_modificacion = models.DateTimeField(auto_now=True)

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="ESTUDIANTE")

    # fields required by AbstractBaseUser
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # password handled by AbstractBaseUser (set_password)
    # password_hash is stored in AbstractBaseUser.password

    objects = UserManager()

    USERNAME_FIELD = "correo_institucional"
    REQUIRED_FIELDS = ["cif_identificacion", "primer_nombre", "primer_apellido"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["cif_identificacion"], name="idx_users_cif"),
            models.Index(fields=["role"], name="idx_users_role"),
        ]
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.primer_nombre} {self.primer_apellido} <{self.correo_institucional}>"


# ---------------------------
# Facultad / Carrera / Asignatura
# ---------------------------
class Facultad(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="ACTIVO")
    codigo = models.CharField(max_length=20, null=False, default="SINCODIGO")    
    fecha_registro = models.DateTimeField(default=timezone.now)
    fecha_ultima_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "facultad"

    def __str__(self):
        return self.nombre


class Carrera(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="ACTIVO")
    facultad = models.ForeignKey(Facultad, on_delete=models.PROTECT, related_name="carreras")
    fecha_registro = models.DateTimeField(default=timezone.now)
    fecha_ultima_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carrera"

    def __str__(self):
        return self.nombre


class Asignatura(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=30, blank=True, null=True)
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.PROTECT, related_name="asignaturas")
    docente = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                limit_choices_to={'role': 'DOCENTE'}, related_name="asignaturas")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="ACTIVO")
    fecha_registro = models.DateTimeField(default=timezone.now)
    fecha_ultima_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "asignatura"

    def __str__(self):
        return f"{self.nombre} ({self.codigo})" if self.codigo else self.nombre


# ---------------------------
# Motivo de ausencia (tabla de catálogo)
# ---------------------------
class MotivoAusencia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)    
    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "motivo_ausencia"

    def __str__(self):
        return f"{self.nombre}"


# ---------------------------
# Documentos (metadatos)
# ---------------------------
class Documento(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre_archivo = models.CharField(max_length=255)
    ruta_almacenamiento = models.CharField(max_length=1024)  # path o URL (firmada)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    tamano_bytes = models.BigIntegerField(blank=True, null=True)
    checksum_sha256 = models.CharField(max_length=128, blank=True, null=True)
    subido_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="documentos_subidos")
    fecha_subida = models.DateTimeField(default=timezone.now)
    encriptado = models.BooleanField(default=False)
    estado = models.CharField(max_length=30, default="DISPONIBLE")
    # relación opcional con justificación (si se desea)
    justificacion = models.ForeignKey("Justificacion", on_delete=models.SET_NULL, null=True, blank=True, related_name="documentos")

    class Meta:
        db_table = "documentos"

    def __str__(self):
        return self.nombre_archivo


# ---------------------------
# Justificación (principal)                                           
# ---------------------------
class Justificacion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estudiante = models.ForeignKey(User, on_delete=models.PROTECT, related_name="justificaciones",
                                   limit_choices_to={'role': 'ESTUDIANTE'})
    asignatura = models.ForeignKey(Asignatura, on_delete=models.SET_NULL, null=True, blank=True, related_name="justificaciones")
    fecha_ausencia_inicio = models.DateField()
    fecha_ausencia_fin = models.DateField()
    fecha_solicitud = models.DateTimeField(default=timezone.now)
    motivo = models.ForeignKey(MotivoAusencia, on_delete=models.SET_NULL, null=True, blank=True)
    descripcion_detallada = models.TextField(blank=True, null=True)
    archivo_principal = models.ForeignKey(Documento, on_delete=models.SET_NULL, null=True, blank=True,
                                         related_name="archivo_principal_de")
    estado = models.CharField(max_length=30, choices=JUSTIFICACION_ESTADO, default="PENDIENTE")
    fecha_resolucion = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "justificacion"
        indexes = [
            models.Index(fields=["estudiante"], name="idx_justificacion_estudiante"),
            models.Index(fields=["estado"], name="idx_justificacion_estado"),
            models.Index(fields=["fecha_solicitud"], name="idx_justificacion_f_solicitud"),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(fecha_ausencia_fin__gte=models.F('fecha_ausencia_inicio')),
                name="chk_fecha_ausencia"
            ),
        ]

    def __str__(self):
        return f"Justificación {self.id} - {self.estudiante}"


# ---------------------------
# Aprobacion (revisión por revisor: docente/coordinador)
# ---------------------------
class Aprobacion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    justificacion = models.ForeignKey(Justificacion, on_delete=models.CASCADE, related_name="aprobaciones")
    revisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="aprobaciones_realizadas")
    rol_revisor = models.CharField(max_length=30, choices=[("COORDINADOR","Coordinador"), ("DOCENTE","Docente")])
    fecha_revision = models.DateTimeField(default=timezone.now)
    estado = models.CharField(max_length=30, choices=APROBACION_ESTADO)
    comentario = models.TextField(blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "aprobacion"
        indexes = [
            models.Index(fields=["justificacion"], name="idx_aprob_justificacion"),
        ]

    def __str__(self):
        return f"Aprobación {self.id} - {self.justificacion.id} - {self.estado}"


# ---------------------------
# Historial / Auditoría
# ---------------------------
class HistorialAccion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="historiales")
    tipo_accion = models.CharField(max_length=100)
    descripcion_accion = models.TextField(blank=True, null=True)
    referencia_id = models.UUIDField(null=True, blank=True)  # id de justificacion, documento, etc.
    fecha_accion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "historial_accion"
        indexes = [
            models.Index(fields=["usuario"], name="idx_historial_usuario"),
        ]

    def __str__(self):
        return f"{self.tipo_accion} by {self.usuario} at {self.fecha_accion}"