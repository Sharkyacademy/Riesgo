from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .forms import FacilityForm
from django.contrib import messages
from django.shortcuts import render, redirect
from .models import Facility

@login_required
def dashboard(request):
    facilities_list = Facility.objects.filter(owner=request.user)
    facilities_count = facilities_list.count()
    return render(request, 'dashboard/dashboard.html', {
        'facilities_count': facilities_count
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
    return render(request, 'dashboard/units.html')

@login_required
def equipment(request):
    return render(request, 'dashboard/equipment.html')

@login_required
def components(request):
    return render(request, 'dashboard/components.html')

@login_required
def systems(request):
    return render(request, 'dashboard/systems.html')

