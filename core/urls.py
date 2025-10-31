# core/urls.py
from rest_framework import routers
from django.urls import path, include
from .views import JustificacionViewSet, AprobacionViewSet, AsignaturaViewSet, DocumentoViewSet
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

router = routers.DefaultRouter()
router.register(r'justificaciones', JustificacionViewSet, basename='justificacion')
router.register(r'aprobaciones', AprobacionViewSet, basename='aprobacion')
router.register(r'asignaturas', AsignaturaViewSet, basename='asignatura')
router.register(r'documentos', DocumentoViewSet, basename='documento')

urlpatterns = [
    path('', include(router.urls)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
