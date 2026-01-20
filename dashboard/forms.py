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
            # Original fields
            'equipment', 'rbix_equipment_type', 'rbix_component_type', 'description',
            'p_and_id', 'p_and_id_other', 'other_drawings', 'commissioning_date',
            'rbi_calculation_date', 'design_life_years', 'component_life_years',
            'remaining_life_years', 'external_coating_date', 'material', 'rep_pipe_no',
            # COF Level 1 fields
            'representative_fluid', 'stored_phase', 'fluid_temperature',
            'component_diameter',
            'storage_pressure', 'atm_pressure', 'discharge_coeff', 'viscosity_correction', 'conversion_factor_c2',
            'inventory_group_mass', 'component_mass',
            'detection_class', 'isolation_class',
            'mitigation_system', 'toxic_mass_fraction',
            'material_construction', 'cost_factor',
            'equipment_cost_per_sqft', 'production_cost_per_day', 'outage_multiplier',
            'unit_area_safety', 'personnel_shift_1', 'time_present_shift_1',
            'personnel_shift_2', 'time_present_shift_2', 'personnel_maintenance',
            'time_present_maintenance', 'injury_cost_per_person', 'environmental_cost_per_bbl',
            
            # Operating & Process Fields (Imperial)
            'operating_temp_f', 'component_may_operate_below_mdmt', 'operating_pressure_psia',
            'flow_velocity_fts', 'inhibitor_efficiency_percent',
            'fluid_name', 'fluid_description', 'rbix_fluid', 'operational_fluid_phase',
            'component_fluid_mass_lb', 'component_group_fluid_mass_lb',
            'fluid_release_reduction_safety_effectiveness', 'fire_reduction_safety_effectiveness',
            'ph_value', 'contains_water', 'contains_h2s', 'contains_co2', 'contains_h2so4',
            'contains_hf', 'contains_amine', 'contains_hcl', 'contains_oxygen',
            'contains_sulphur', 'contains_chloride', 'contains_hydrogen', 'high_hydrogen_partial_pressure',
            'contains_oil', 'contains_caustic', 'underground', 'cooling_water_service',
            'h2s_concentration_wpercent', 'nh3_concentration_wpercent', 'co2_concentration_wpercent',
            'hno3_concentration_wpercent', 'h2o2_concentration_wpercent', 'cocl2_concentration_wpercent',
            'c2h4o3_concentration_wpercent', 'c3h6o2_concentration_wpercent', 'toluene_diisocynate_wpercent',
            'c3h8o2_concentration_wpercent', 'alcl3_concentration_wpercent', 'toxic_mass_fraction_wpercent',
            
            # New Design Fields (Imperial)
            'pfd_no', 'material_nominal_composition', 'material_specification_no', 'sulphur_bearing_compounds',
            'design_pressure_psi', 'design_temp_f', 'mdmt_f',
            'stress_strength_known', 'allowable_stress_psi', 'smys_yield_psi',
            'size_diameter_rating', 'nominal_thickness_known', 'nominal_thickness_in',
            'diameter_outside_in', 'diameter_inside_in',
            'safety_factor', 'design_code', 'joint_efficiency', 'pwht', 'heat_traced',
            'atmosphere_corrosivity', 'internal_cladding', 'internal_lining',
            'insulated', 'insulation_type', 'other_insulation'
        ]
        widgets = {
            # Original widgets
            'equipment': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'rbix_equipment_type': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'RBIX Equipment Type'}),
            'rbix_component_type': forms.Select(attrs={'class': 'select select-bordered w-full'}),
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
            
            # COF Level 1 widgets - Representative Fluids
            'representative_fluid': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'stored_phase': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'fluid_temperature': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Temperature (°F)'}),
            
            # COF Level 1 - Release Rate Parameters (Shared)
            'storage_pressure': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Ps (psia)'}),
            'atm_pressure': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': '14.7'}),
            'discharge_coeff': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'min': '0.60', 'max': '1.0', 'placeholder': '0.61'}),
            'viscosity_correction': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': '1.0'}),
            'conversion_factor_c2': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '1'}),
            
            # COF Level 1 - Fluid Inventory
            'inventory_group_mass': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Mass (lb)'}),
            'component_mass': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Mass (lb)'}),
            
            # COF Level 1 - Detection & Isolation
            'detection_class': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'isolation_class': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            
            # COF Level 1 - Flammable & Toxic
            'mitigation_system': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'toxic_mass_fraction': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'min': '0', 'max': '1', 'placeholder': '1.0'}),
            
            # COF Level 1 - Financial
            'material_construction': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'cost_factor': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': '1.0'}),
            'equipment_cost_per_sqft': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '$/ft²'}),
            'production_cost_per_day': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '$/day'}),
            'outage_multiplier': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': '1.0'}),
            
            'unit_area_safety': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '10000'}),
            'personnel_shift_1': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'placeholder': '2'}),
            'time_present_shift_1': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '100'}),
            'personnel_shift_2': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'placeholder': '0'}),
            'time_present_shift_2': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '0'}),
            'personnel_maintenance': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'placeholder': '0'}),
            'time_present_maintenance': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '0'}),
            'injury_cost_per_person': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '$/person'}),
            
            'environmental_cost_per_bbl': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '$/bbl'}),
            
            # Operating & Process Fields (Imperial) 
            'operating_temp_f': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '°F'}),
            'component_may_operate_below_mdmt': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'operating_pressure_psia': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'psia'}),
            'flow_velocity_fts': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'ft/s'}),
            'inhibitor_efficiency_percent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '%'}),
            'fluid_name': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Fluid Name'}),
            'fluid_description': forms.Textarea(attrs={'class': 'textarea textarea-bordered w-full', 'rows': 2, 'placeholder': 'Fluid Description'}),
            'rbix_fluid': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'RBIX Fluid'}),
            'operational_fluid_phase': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'component_fluid_mass_lb': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'lb'}),
            'component_group_fluid_mass_lb': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'lb'}),
            'fluid_release_reduction_safety_effectiveness': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'fire_reduction_safety_effectiveness': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'ph_value': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'min': '0', 'max': '14', 'placeholder': 'pH value'}),
            'contains_water': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_h2s': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_co2': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_h2so4': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_hf': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_amine': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_hcl': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_oxygen': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_sulphur': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_chloride': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_hydrogen': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'high_hydrogen_partial_pressure': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_oil': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'contains_caustic': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'underground': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'cooling_water_service': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'h2s_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'nh3_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'co2_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'hno3_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'h2o2_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'cocl2_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'c2h4o3_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'c3h6o2_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'toluene_diisocynate_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'c3h8o2_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'alcl3_concentration_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            'toxic_mass_fraction_wpercent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'W%'}),
            
            # New Design Fields (Imperial)
            'pfd_no': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'PFD'}),
            'material_nominal_composition': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'CS'}),
            'material_specification_no': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'A 516'}),
            'sulphur_bearing_compounds': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            
            'design_pressure_psi': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'psi'}),
            'design_temp_f': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '°F'}),
            'mdmt_f': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '°F'}),
            
            'stress_strength_known': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'allowable_stress_psi': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'psi'}),
            'smys_yield_psi': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'psi'}),
            
            'size_diameter_rating': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'nominal_thickness_known': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'nominal_thickness_in': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'inch'}),
            'diameter_outside_in': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'inch'}),
            'diameter_inside_in': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'inch'}),
            
            'safety_factor': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '0.6'}),
            'design_code': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'joint_efficiency': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '0.85'}),
            'pwht': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'heat_traced': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            
            'atmosphere_corrosivity': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'internal_cladding': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'internal_lining': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'insulated': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'insulation_type': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'other_insulation': forms.TextInput(attrs={'class': 'input input-bordered w-full', 'placeholder': 'Other'}),
        }

    def __init__(self, user, *args, **kwargs):
        super(ComponentForm, self).__init__(*args, **kwargs)
        self.fields['equipment'].queryset = Equipment.objects.filter(system__unit__facility__owner=user)


