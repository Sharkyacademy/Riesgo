from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard_home'),
    path('facilities', views.facilities, name='facilities_home'),
    path('units', views.units, name='units_home'),
    path('equipment', views.equipment, name='equipment_home'),
    path('components', views.components, name='components_home'),
    path('components/create/', views.component_create, name='component_create'),
    path('components/<int:pk>/edit/', views.component_edit, name='component_edit'),
    path('systems', views.systems, name='systems_home'),
]

