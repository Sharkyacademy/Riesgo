from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def dashboard(request):
    return render(request, 'dashboard/dashboard.html')

@login_required
def facilities(request):
    return render(request, 'dashboard/facilities.html')

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

