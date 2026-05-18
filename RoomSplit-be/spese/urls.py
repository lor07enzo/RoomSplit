from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, GruppoSpesaViewSet, RimborsoViewSet, ListaSpesaViewSet, ArticoloViewSet

router = DefaultRouter()

router.register(r'spese', GruppoSpesaViewSet, basename='gruppospesa')
router.register(r'rimborsi', RimborsoViewSet, basename='rimborso')
router.register(r'liste', ListaSpesaViewSet, basename='listaspesa')
router.register(r'articoli', ArticoloViewSet, basename='articolo')
router.register(r'categorie', CategoriaViewSet, basename='categoria')


urlpatterns = [
    path('', include(router.urls)),
]