# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    User, Facultad, Carrera, Asignatura, MotivoAusencia,
    Documento, Justificacion, Aprobacion, HistorialAccion
)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    # Campos que se muestran en la lista
    list_display = ("primer_nombre", "primer_apellido", "correo_institucional", "role", "estado", "fecha_registro")
    list_filter = ("role", "estado")
    search_fields = ("correo_institucional", "primer_nombre", "primer_apellido", "cif_identificacion")
    ordering = ("primer_apellido", "primer_nombre")
    # Campos del formulario de edición (agrupados)
    fieldsets = (
        (None, {"fields": ("correo_institucional", "password")}),
        (_("Personal info"), {"fields": ("primer_nombre", "segundo_nombre", "primer_apellido", "segundo_apellido", "cif_identificacion")}),
        (_("Contactos"), {"fields": ("telefono_celular", "telefono_oficina")}),
        (_("Permisos"), {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Timestamps"), {"fields": ("fecha_registro", "fecha_ultima_modificacion")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("correo_institucional", "cif_identificacion", "primer_nombre", "primer_apellido", "password1", "password2", "role"),
        }),
    )


@admin.register(Facultad)
class FacultadAdmin(admin.ModelAdmin):
    list_display = ("nombre", "estado", "fecha_registro")
    search_fields = ("nombre",)


@admin.register(Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ("nombre", "facultad", "estado")
    list_filter = ("facultad", "estado")
    search_fields = ("nombre",)


@admin.register(Asignatura)
class AsignaturaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "codigo", "facultad", "docente", "estado")
    list_filter = ("facultad", "estado")
    search_fields = ("nombre", "codigo")


@admin.register(MotivoAusencia)
class MotivoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "activo")
    search_fields = ("codigo", "nombre")


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ("nombre_archivo", "subido_por", "fecha_subida", "estado")
    search_fields = ("nombre_archivo",)
    readonly_fields = ("fecha_subida",)


@admin.register(Justificacion)
class JustificacionAdmin(admin.ModelAdmin):
    list_display = ("id", "estudiante", "asignatura", "motivo", "estado", "fecha_solicitud")
    list_filter = ("estado", "motivo")
    search_fields = ("estudiante__correo_institucional", "estudiante__cif_identificacion", "asignatura__nombre")
    readonly_fields = ("fecha_solicitud", "fecha_actualizacion")
    raw_id_fields = ("estudiante", "asignatura", "archivo_principal")


@admin.register(Aprobacion)
class AprobacionAdmin(admin.ModelAdmin):
    list_display = ("id", "justificacion", "revisor", "rol_revisor", "estado", "fecha_revision")
    search_fields = ("justificacion__id", "revisor__correo_institucional")
    list_filter = ("rol_revisor", "estado")


@admin.register(HistorialAccion)
class HistorialAdmin(admin.ModelAdmin):
    list_display = ("tipo_accion", "usuario", "fecha_accion")
    search_fields = ("tipo_accion", "usuario__correo_institucional")
    readonly_fields = ("fecha_accion",)
