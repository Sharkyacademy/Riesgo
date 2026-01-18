from django import forms
from .models import Facility, Unit

class FacilityForm(forms.ModelForm):
    class Meta:
        model = Facility
        fields = ['company', 'name', 'location', 'facility_type']
        widgets = {
            'company': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Company'}),
            'name': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Facility Name'}),
            'location': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Location'}),
            'facility_type': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Type'}),
        }

class UnitForm(forms.ModelForm):
    class Meta:
        model = Unit
        fields = ['facility', 'name', 'description', 'people_density']
        widgets = {
            'facility': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'name': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Unit Name'}),
            'description': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Description'}),
            'people_density': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': '0.0'}),
        }

    def __init__(self, user, *args, **kwargs):
        super(UnitForm, self).__init__(*args, **kwargs)
        self.fields['facility'].queryset = Facility.objects.filter(owner=user)
