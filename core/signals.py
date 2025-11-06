# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Justificacion, Aprobacion

@receiver(post_save, sender=Justificacion)
def crear_aprobacion_al_crear_justificacion(sender, instance, created, **kwargs):
    """
    Al crear una Justificacion, crear automáticamente una Aprobacion en estado PENDIENTE
    para que el coordinador la tome/revise posteriormente.
    Evitamos duplicados comprobando si ya existe alguna aprobacion para la justificacion.
    """
    if created:
        # Si ya existe una aprobación para esta justificación, no duplicar
        existe = Aprobacion.objects.filter(justificacion=instance).exists()
        if not existe:
            Aprobacion.objects.create(
                justificacion=instance,
                revisor=None,         # aún no hay revisor asignado
                rol_revisor="COORDINADOR",  # rol esperado para la aprobación final
                estado="PENDIENTE",
                comentario=""
            )
