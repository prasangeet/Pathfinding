from django.urls import path, include
from rest_framework.routers import DefaultRouter
from maps.views import NodeViewSet, EdgeViewSet

router = DefaultRouter()
router.register(r'nodes', NodeViewSet)
router.register(r'edges', EdgeViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
