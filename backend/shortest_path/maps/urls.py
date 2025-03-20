from django.urls import path
from .views import shortest_path

urlpatterns = [
    path('shortest_path/', shortest_path),
]