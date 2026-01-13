from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name="index"), # Keeping root as alias or redirect if needed, or we can just change it. The user wants the SPECIFIC url. 
    path('calculation-thinning-df/', views.home, name="calculation_thinning_df"),
    path('logout/', views.logout_view, name="logout"),
    path('get-components/', views.get_components, name="api_get_components"),
    path('load-step/<int:step_number>/', views.load_step_content, name="load_step_content"),
    path('load-cr-snippet/<str:snippet_name>/', views.load_cr_snippets, name="load_cr_snippets"),
    path('gff-calculation/', views.gff_calculation_view, name="gff_calculation"),
    path('api/get-gff/', views.get_gff_value, name="api_get_gff"),
    path('fms-calculation/', views.fms_calculation_view, name="fms_calculation"),
    path('pof-dashboard/', views.pof_dashboard_view, name="pof_dashboard"),

]
