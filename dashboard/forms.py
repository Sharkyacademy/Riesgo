from django import forms
from .models import Facility, Unit, System, Equipment, Component

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

class SystemForm(forms.ModelForm):
    class Meta:
        model = System
        fields = ['unit', 'name', 'description']
        widgets = {
            'unit': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'name': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'System Name'}),
            'description': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Description'}),
        }

    def __init__(self, user, *args, **kwargs):
        super(SystemForm, self).__init__(*args, **kwargs)
        self.fields['unit'].queryset = Unit.objects.filter(facility__owner=user)

class EquipmentForm(forms.ModelForm):
    class Meta:
        model = Equipment
        fields = ['system', 'number', 'plant_equipment_type', 'plant_equipment_desc']
        widgets = {
            'system': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'number': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Equipment Number'}),
            'plant_equipment_type': forms.Select(attrs={'class': 'select select-bordered w-full'}, choices=[('', 'Select Type (Placeholder)'), ('1', '1')]),
            'plant_equipment_desc': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Equipment Description'}),
        }

    def __init__(self, user, *args, **kwargs):
        super(EquipmentForm, self).__init__(*args, **kwargs)
        self.fields['system'].queryset = System.objects.filter(unit__facility__owner=user)

class ComponentForm(forms.ModelForm):
    class Meta:
        model = Component
        fields = [
            'equipment', 'rbix_equipment_type', 'rbix_component_type', 'description',
            'p_and_id', 'p_and_id_other', 'other_drawings', 'commissioning_date',
            'rbi_calculation_date', 'design_life_years', 'component_life_years',
            'remaining_life_years', 'external_coating_date', 'material', 'rep_pipe_no'
        ]
        widgets = {
            'equipment': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'rbix_equipment_type': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'RBIX Equipment Type'}),
            'rbix_component_type': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'RBIX Component Type'}),
            'description': forms.Textarea(attrs={'class': 'textarea textarea-bordered w-full', 'rows': 3, 'placeholder': 'Description'}),
            'p_and_id': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'P&ID'}),
            'p_and_id_other': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'P&ID Other'}),
            'other_drawings': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Other Drawings'}),
            'commissioning_date': forms.DateInput(attrs={'class': 'input input-bordered w-full', 'type': 'date'}),
            'rbi_calculation_date': forms.DateInput(attrs={'class': 'input input-bordered w-full', 'type': 'date'}),
            'design_life_years': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01'}),
            'component_life_years': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01'}),
            'remaining_life_years': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01'}),
            'external_coating_date': forms.DateInput(attrs={'class': 'input input-bordered w-full', 'type': 'date'}),
            'material': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Material'}),
            'rep_pipe_no': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Rep. Pipe No.'}),
        }

    def __init__(self, user, *args, **kwargs):
        super(ComponentForm, self).__init__(*args, **kwargs)
        self.fields['equipment'].queryset = Equipment.objects.filter(system__unit__facility__owner=user)


