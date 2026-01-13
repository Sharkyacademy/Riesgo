from django.shortcuts import render,redirect
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as django_logout
from django.http import JsonResponse
from .models import EquipmentType, ComponentType, ComponentGff

# Create your views here.
@never_cache
@login_required
def home(request):

    # get all equipments
    equipments = EquipmentType.objects.all()

    context = {
        'equipments': equipments,
    }

    return render(request, 'formula_app/index.html', context=context)


# log_out
def logout_view(request):
    django_logout(request)
    return redirect("/")

@login_required
def get_components(request):
    try:
        equipment_id = request.GET.get("equipment_id")
        if not equipment_id:
             return JsonResponse({'error': 'No equipment_id provided'}, status=400)
             
        components = ComponentType.objects.filter(equipment_id=equipment_id).values('id', 'name')
        return JsonResponse(list(components), safe=False)
    except Exception as e:
        print(f"ERROR in get_components: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def load_step_content(request, step_number):
    template_name = f'formula_app/includes/thinningDF/steps_includes/step{step_number}.html'
    return render(request, template_name, {})

@login_required
def load_cr_snippets(request, snippet_name):
    template_name = f'formula_app/snippets_step2/{snippet_name}.html'
    return render(request, template_name, {})

@login_required
def gff_calculation_view(request):
    equipments = EquipmentType.objects.all()
    context = {
        'equipments': equipments
    }
    return render(request, 'formula_app/gff_calculation.html', context)

@login_required
def fms_calculation_view(request):
    return render(request, 'formula_app/fms_calculation.html')

@login_required
def pof_dashboard_view(request):
    return render(request, 'formula_app/pof_dashboard.html')

@login_required
def get_gff_value(request):
    component_id = request.GET.get('component_id')
    hole_size = request.GET.get('hole_size') # optional: small, medium, large, rupture
    
    if not component_id:
        return JsonResponse({'error': 'Component ID is required'}, status=400)
        
    try:
        gff = ComponentGff.objects.get(component_id=component_id)
        
        if hole_size:
            hole_size = hole_size.lower()
            selected_value = 0.0
            if hole_size == 'small':
                selected_value = gff.gff_small
            elif hole_size == 'medium':
                selected_value = gff.gff_medium
            elif hole_size == 'large':
                selected_value = gff.gff_large
            elif hole_size == 'rupture':
                selected_value = gff.gff_rupture
            else:
                 return JsonResponse({'error': 'Invalid hole size'}, status=400)
                 
            data = {
                'hole_size': hole_size,
                'selected_gff': selected_value,
                'gff_total': gff.gff_total
            }
        else:
            # Return all if no specific size requested (legacy buffer)
            data = {
                'small': gff.gff_small,
                'medium': gff.gff_medium,
                'large': gff.gff_large,
                'rupture': gff.gff_rupture,
                'gff_total': gff.gff_total
            }
            
        return JsonResponse(data)
    except ComponentGff.DoesNotExist:
        return JsonResponse({'error': 'GFF data not found for this component'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

