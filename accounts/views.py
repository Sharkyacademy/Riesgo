from django.shortcuts import render, redirect
from django.contrib import messages
from .models import CustomUser
from django.contrib.auth import login

# Create your views here.
def register_view(request):
    if request.method == "POST":
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # New fields
        country = request.POST.get('country')
        city = request.POST.get('city')
        address = request.POST.get('address')
        birth_day = request.POST.get('birth_day')

        # Basic Validation
        if not email or not password or not first_name:
            messages.error(request, "Name, Email and Password are required.")
            return render(request, 'accounts/register.html')

        if CustomUser.objects.filter(email=email).exists():
            messages.error(request, "This email is already registered.")
            return render(request, 'accounts/register.html')

        try:
            # Create the user using the custom manager
            user = CustomUser.objects.create_user(
                email=email, 
                password=password,
                first_name=first_name,
                last_name=last_name,
                country=country if country else None,
                city=city if city else None,
                address=address if address else None,
                birth_day=birth_day if birth_day else None
            )
            
            login(request, user)
            messages.success(request, "Account created successfully!")
            return redirect('/formula_app/') # Redirect to main app after registration

        except Exception as e:
            messages.error(request, f"An error occurred: {str(e)}")
            return render(request, 'accounts/register.html')

    return render(request, 'accounts/register.html')
