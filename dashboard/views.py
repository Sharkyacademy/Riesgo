from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .forms import FacilityForm
from django.contrib import messages
from django.shortcuts import render, redirect
from .models import Facility, Unit, System

@login_required
def dashboard(request):
    facilities_list = Facility.objects.filter(owner=request.user)
    facilities_count = facilities_list.count()

    units_list = Unit.objects.filter(facility__owner=request.user)
    units_count = units_list.count()

    systems_list = System.objects.filter(unit__facility__owner=request.user)
    systems_count = systems_list.count()

    return render(request, 'dashboard/dashboard.html', {
        'facilities_count': facilities_count,
        'units_count': units_count,
        'systems_count': systems_count
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

