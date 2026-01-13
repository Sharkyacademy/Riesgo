from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.views.decorators.cache import never_cache

# Create your views here.
@never_cache
def index(request):

    if request.user.is_authenticated:
        return redirect('/formula_app/')

    # acciones cuando el formulario es enviado.
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        if not email or not password:
            messages.error(request, "Por favor ingresa email y/o contraseña.")

        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return redirect("/formula_app")
        else:
            messages.error(request, "Email o contraseña incorrectos.")
        
        return redirect('/')

    return render(request, 'core/index.html')
