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
    path('components/<int:pk>/report/', views.component_report, name='component_report'),
    path('facility/<int:pk>/edit/', views.facility_edit, name='facility_edit'),
    path('unit/<int:pk>/edit/', views.unit_edit, name='unit_edit'),
    path('system/<int:pk>/edit/', views.system_edit, name='system_edit'),
    path('equipment/<int:pk>/edit/', views.equipment_edit, name='equipment_edit'),
    path('systems', views.systems, name='systems_home'),
    path('systems/<int:pk>/delete/', views.system_delete, name='system_delete'),
    
    # Inspection History AJAX URLs
    path('components/inspection-history/add/', views.add_inspection_history, name='add_inspection_history'),
    path('components/inspection-history/<int:pk>/delete/', views.delete_inspection_history, name='delete_inspection_history'),
    path('components/<int:component_id>/inspection-history/', views.get_inspection_history, name='get_inspection_history'),
    
    # GFF API
    path('api/get_gff/', views.api_get_gff, name='api_get_gff'),
    path('api/get_component_types/', views.api_get_component_types, name='api_get_component_types'),
]
