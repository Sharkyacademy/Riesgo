from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .forms import FacilityForm
from django.contrib import messages
from django.shortcuts import render, redirect
from .models import Facility, Unit, System, Equipment, Component

@login_required
def dashboard(request):
    facilities_list = Facility.objects.filter(owner=request.user)
    facilities_count = facilities_list.count()

    units_list = Unit.objects.filter(facility__owner=request.user)
    units_count = units_list.count()

    systems_list = System.objects.filter(unit__facility__owner=request.user)
    systems_count = systems_list.count()

    equipment_list = Equipment.objects.filter(system__unit__facility__owner=request.user)
    equipment_count = equipment_list.count()

    components_list = Component.objects.filter(equipment__system__unit__facility__owner=request.user)
    components_count = components_list.count()
    return render(request, 'dashboard/dashboard.html', {
        'facilities_count': facilities_count,
        'units_count': units_count,
        'systems_count': systems_count,
        'equipment_count': equipment_count,
        'components_count': components_count
    })

@login_required
def facilities(request):
    if request.method == 'POST':
        form = FacilityForm(request.POST)
        if form.is_valid():
            facility = form.save(commit=False)
            facility.owner = request.user
            facility.save()
            messages.success(request, 'Facility created successfully!')
            return redirect('facilities_home')
    else:
        form = FacilityForm()

    facilities_list = Facility.objects.filter(owner=request.user)
    return render(request, 'dashboard/facilities.html', {
        'facilities': facilities_list,
        'form': form
    })

@login_required
def units(request):
    from .models import Unit
    from .forms import UnitForm

    if request.method == 'POST':
        form = UnitForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Unit created successfully!')
            return redirect('units_home')
        else:
            messages.error(request, 'Error creating unit.')
    else:
        form = UnitForm(request.user)

    # Filter facilities owned by the user and prefetch their units
    from .models import Facility
    facilities = Facility.objects.filter(owner=request.user).prefetch_related('unit_set')
    
    return render(request, 'dashboard/units.html', {
        'facilities': facilities,
        'form': form
    })

@login_required
def equipment(request):
    from .models import Facility, Equipment
    from .forms import EquipmentForm

    if request.method == 'POST':
        form = EquipmentForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Equipment created successfully!')
            return redirect('equipment_home')
        else:
            messages.error(request, 'Error creating equipment.')
    else:
        form = EquipmentForm(request.user)

    # Filter facilities owned by the user and prefetch units -> systems -> equipment
    facilities = Facility.objects.filter(owner=request.user).prefetch_related('unit_set__system_set__equipment_set')
    
    return render(request, 'dashboard/equipment.html', {
        'facilities': facilities,
        'form': form
    })

@login_required
def components(request):
    from .models import Facility
    
    # 5-level prefetching: Facility -> Unit -> System -> Equipment -> Component
    facilities = Facility.objects.filter(owner=request.user).prefetch_related(
        'unit_set__system_set__equipment_set__component_set'
    )
    
    return render(request, 'dashboard/components.html', {
        'facilities': facilities
    })

@login_required
def component_create(request):
    from .models import Component
    from .forms import ComponentForm
    
    if request.method == 'POST':
        form = ComponentForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Component created successfully!')
            return redirect('components_home')
        else:
            messages.error(request, 'Error creating component.')
    else:
        form = ComponentForm(request.user)
    
    return render(request, 'dashboard/component_form.html', {
        'form': form,
        'is_edit': False
    })

@login_required
def component_edit(request, pk):
    from .models import Component
    from .forms import ComponentForm
    from django.shortcuts import get_object_or_404
    
    component = get_object_or_404(Component, pk=pk, equipment__system__unit__facility__owner=request.user)
    
    if request.method == 'POST':
        form = ComponentForm(request.user, request.POST, instance=component)
        if form.is_valid():
            form.save()
            messages.success(request, 'Component updated successfully!')
            return redirect('components_home')
        else:
            messages.error(request, 'Error updating component.')
    else:
        form = ComponentForm(request.user, instance=component)
    
    return render(request, 'dashboard/component_form.html', {
        'form': form,
        'component': component,
        'is_edit': True
    })

@login_required
def systems(request):
    from .models import Facility, System
    from .forms import SystemForm

    if request.method == 'POST':
        form = SystemForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'System created successfully!')
            return redirect('systems_home')
        else:
            messages.error(request, 'Error creating system.')
    else:
        form = SystemForm(request.user)

    # Filter facilities owned by the user and prefetch units and systems
    facilities = Facility.objects.filter(owner=request.user).prefetch_related('unit_set__system_set')
    
    return render(request, 'dashboard/systems.html', {
        'facilities': facilities,
        'form': form
    })

@login_required
def component_delete(request, pk):
    from .models import Component
    from django.urls import reverse
    from django.shortcuts import get_object_or_404
    
    component = get_object_or_404(Component, pk=pk, equipment__system__unit__facility__owner=request.user)
    
    if request.method == 'POST':
        component.delete()
        messages.success(request, 'Component deleted successfully!')
        return redirect('components_home')
    
    return render(request, 'dashboard/confirm_delete.html', {
        'object_type': 'Component',
        'object_name': component.rbix_component_type,
        'cancel_url': reverse('components_home')
    })

@login_required
def equipment_delete(request, pk):
    from .models import Equipment
    from django.urls import reverse
    from django.shortcuts import get_object_or_404
    
    equipment = get_object_or_404(Equipment, pk=pk, system__unit__facility__owner=request.user)
    
    if request.method == 'POST':
        equipment.delete()
        messages.success(request, 'Equipment deleted successfully!')
        return redirect('equipment_home')
    
    return render(request, 'dashboard/confirm_delete.html', {
        'object_type': 'Equipment',
        'object_name': equipment.number,
        'cancel_url': reverse('equipment_home')
    })

@login_required
def system_delete(request, pk):
    from .models import System
    from django.urls import reverse
    from django.shortcuts import get_object_or_404
    
    system = get_object_or_404(System, pk=pk, unit__facility__owner=request.user)
    
    if request.method == 'POST':
        system.delete()
        messages.success(request, 'System deleted successfully!')
        return redirect('systems_home')
    
    return render(request, 'dashboard/confirm_delete.html', {
        'object_type': 'System',
        'object_name': system.name,
        'cancel_url': reverse('systems_home')
    })

@login_required
def unit_delete(request, pk):
    from .models import Unit
    from django.urls import reverse
    from django.shortcuts import get_object_or_404
    
    unit = get_object_or_404(Unit, pk=pk, facility__owner=request.user)
    
    if request.method == 'POST':
        unit.delete()
        messages.success(request, 'Unit deleted successfully!')
        return redirect('units_home')
    
    return render(request, 'dashboard/confirm_delete.html', {
        'object_type': 'Unit',
        'object_name': unit.name,
        'cancel_url': reverse('units_home')
    })

@login_required
def facility_delete(request, pk):
    from .models import Facility
    from django.urls import reverse
    from django.shortcuts import get_object_or_404
    
    facility = get_object_or_404(Facility, pk=pk, owner=request.user)
    
    if request.method == 'POST':
        facility.delete()
        messages.success(request, 'Facility deleted successfully!')
        return redirect('facilities_home')
    
    return render(request, 'dashboard/confirm_delete.html', {
        'object_type': 'Facility',
        'object_name': facility.name,
        'cancel_url': reverse('facilities_home')
    })

@login_required
def facility_edit(request, pk):
    from .models import Facility
    from .forms import FacilityForm
    from django.shortcuts import get_object_or_404
    
    facility = get_object_or_404(Facility, pk=pk, owner=request.user)
    
    if request.method == 'POST':
        form = FacilityForm(request.POST, instance=facility)
        if form.is_valid():
            form.save()
            messages.success(request, 'Facility updated successfully!')
            # Redirect back to the page they came from, if possible
            next_url = request.POST.get('next')
            if next_url:
                return redirect(next_url)
            return redirect(request.META.get('HTTP_REFERER', 'facilities_home'))
        else:
            messages.error(request, 'Error updating facility.')
            return redirect(request.META.get('HTTP_REFERER', 'facilities_home'))
    
    return redirect('facilities_home')

@login_required
def unit_edit(request, pk):
    from .models import Unit
    from .forms import UnitForm
    from django.shortcuts import get_object_or_404
    
    unit = get_object_or_404(Unit, pk=pk, facility__owner=request.user)
    
    if request.method == 'POST':
        form = UnitForm(request.user, request.POST, instance=unit)
        if form.is_valid():
            form.save()
            messages.success(request, 'Unit updated successfully!')
            next_url = request.POST.get('next')
            if next_url:
                return redirect(next_url)
            return redirect(request.META.get('HTTP_REFERER', 'units_home'))
        else:
            messages.error(request, 'Error updating unit.')
            return redirect(request.META.get('HTTP_REFERER', 'units_home'))
            
    return redirect('units_home')

@login_required
def system_edit(request, pk):
    from .models import System
    from .forms import SystemForm
    from django.shortcuts import get_object_or_404
    
    system = get_object_or_404(System, pk=pk, unit__facility__owner=request.user)
    
    if request.method == 'POST':
        form = SystemForm(request.user, request.POST, instance=system)
        if form.is_valid():
            form.save()
            messages.success(request, 'System updated successfully!')
            next_url = request.POST.get('next')
            if next_url:
                return redirect(next_url)
            return redirect(request.META.get('HTTP_REFERER', 'systems_home'))
        else:
            messages.error(request, 'Error updating system.')
            return redirect(request.META.get('HTTP_REFERER', 'systems_home'))
            
    return redirect('systems_home')

@login_required
def equipment_edit(request, pk):
    from .models import Equipment
    from .forms import EquipmentForm
    from django.shortcuts import get_object_or_404
    
    equipment = get_object_or_404(Equipment, pk=pk, system__unit__facility__owner=request.user)
    
    if request.method == 'POST':
        form = EquipmentForm(request.user, request.POST, instance=equipment)
        if form.is_valid():
            form.save()
            messages.success(request, 'Equipment updated successfully!')
            next_url = request.POST.get('next')
            if next_url:
                return redirect(next_url)
            return redirect(request.META.get('HTTP_REFERER', 'equipment_home'))
        else:
            messages.error(request, 'Error updating equipment.')
            return redirect(request.META.get('HTTP_REFERER', 'equipment_home'))
            
    return redirect('equipment_home')


@login_required
def add_inspection_history(request):
    from .models import Component, InspectionHistory
    from django.http import JsonResponse
    import json
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            component_id = data.get('component_id')
            
            if not component_id:
                 return JsonResponse({'success': False, 'error': 'Component ID required. Please save component first.'}, status=400)

            component = get_object_or_404(Component, pk=component_id, equipment__system__unit__facility__owner=request.user)
            
            history = InspectionHistory.objects.create(
                component=component,
                inspection_type=data.get('inspection_type'),
                date=data.get('date'),
                lining_quality=data.get('lining_quality'),
                general_condition=data.get('general_condition'),
                crack_finding_capability=data.get('crack_finding_capability'),
                corrosion_finding_capability=data.get('corrosion_finding_capability'),
                comments=data.get('comments')
            )
            
            return JsonResponse({
                'success': True,
                'id': history.id,
                'date': history.date,
                'method': history.inspection_type
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@login_required
def delete_inspection_history(request, pk):
    from .models import InspectionHistory
    from django.http import JsonResponse
    
    if request.method == 'POST':
        history = get_object_or_404(InspectionHistory, pk=pk, component__equipment__system__unit__facility__owner=request.user)
        history.delete()
        return JsonResponse({'success': True})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@login_required
def get_inspection_history(request, component_id):
    from .models import InspectionHistory
    from django.http import JsonResponse
    
    try:
        histories = InspectionHistory.objects.filter(
            component_id=component_id,
            component__equipment__system__unit__facility__owner=request.user
        ).order_by('-date')
        
        data = []
        for h in histories:
            data.append({
                'id': h.id,
                'inspection_type': h.inspection_type,
                'date': h.date,
                'lining_quality': h.lining_quality,
                'general_condition': h.general_condition,
                'crack_finding_capability': h.crack_finding_capability,
                'corrosion_finding_capability': h.corrosion_finding_capability,
                'comments': h.comments
            })
            
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


