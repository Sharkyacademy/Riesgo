from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard_home'),
    path('facilities', views.facilities, name='facilities_home'),
    path('facilities/<int:pk>/delete/', views.facility_delete, name='facility_delete'),
    path('units', views.units, name='units_home'),
    path('units/<int:pk>/delete/', views.unit_delete, name='unit_delete'),
    path('equipment', views.equipment, name='equipment_home'),
    path('equipment/<int:pk>/delete/', views.equipment_delete, name='equipment_delete'),
    path('components', views.components, name='components_home'),
    path('components/create/', views.component_create, name='component_create'),
    path('components/<int:pk>/edit/', views.component_edit, name='component_edit'),
    path('components/<int:pk>/delete/', views.component_delete, name='component_delete'),
    path('systems', views.systems, name='systems_home'),
    path('systems/<int:pk>/delete/', views.system_delete, name='system_delete'),
]

