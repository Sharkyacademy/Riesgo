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
            'component_diameter', 'heat_traced',
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
            
            # Inspection Fields
            'int_inspection_vol_mil', 'last_int_visual_inspection_date', 'service_years_since_last_int_visual_insp',
            'internal_lining_quality', 'internal_cracks_present', 'internal_crack_finding_capability',
            'internal_corrosion_finding_capability', 'ext_inspection_vol_mil', 'last_ext_visual_inspection_date',
            'service_years_since_last_ext_visual_insp', 'external_coating_quality', 'external_crack_finding_capability',
            'external_corrosion_finding_capability', 'thickness_nominal_mm', 'thickness_minimum_required_mm',
            'thickness_measured_mm', 'corrosion_rate_mm_year', 'inspection_summary',
            
            # New Design Fields (Imperial)
            'pfd_no', 'material_nominal_composition', 'material_specification_no', 'sulphur_bearing_compounds',
            'design_pressure_psi', 'design_temp_f', 'mdmt_f',
            'stress_strength_known', 'allowable_stress_psi', 'smys_yield_psi',
            'size_diameter_rating', 'nominal_thickness_known', 'nominal_thickness_in',
            'diameter_outside_in', 'diameter_inside_in',
            'safety_factor', 'design_code', 'joint_efficiency', 'pwht', 'heat_traced',
            'atmosphere_corrosivity', 'internal_cladding', 'internal_lining',
            'insulated', 'insulation_type', 'other_insulation',
            
            # Risk Probability Fields - SCC Caustic
            'mechanism_scc_caustic_active', 'scc_caustic_cracks_observed', 'scc_caustic_cracks_removed',
            'scc_caustic_stress_relieved', 'scc_caustic_naoh_conc_percent', 'scc_caustic_steamed_out_prior',
            'scc_caustic_inspection_count_a', 'scc_caustic_inspection_count_b', 'scc_caustic_inspection_count_c',
            'scc_caustic_inspection_count_d',
            
            # SCC Amine
            'mechanism_scc_amine_active', 'scc_amine_cracks_observed', 'scc_amine_cracks_removed',
            'scc_amine_stress_relieved', 'scc_amine_lean_amine', 'scc_amine_solution_type', 'scc_amine_steamed_out',
            'scc_amine_inspection_count_a', 'scc_amine_inspection_count_b', 'scc_amine_inspection_count_c',
            'scc_amine_inspection_count_d',
            
            # SCC SSC
            'mechanism_scc_ssc_active', 'scc_ssc_ph', 'scc_ssc_h2s_ppm', 'scc_ssc_hardness_hb',
            'scc_ssc_pwht', 'scc_ssc_cracks_observed', 'scc_ssc_cracks_removed',
            'scc_ssc_inspection_count_a', 'scc_ssc_inspection_count_b', 'scc_ssc_inspection_count_c',
            'scc_ssc_inspection_count_d',
            
            # SCC HIC/SOHIC
            'mechanism_scc_hic_h2s_active', 'scc_hic_h2s_ph', 'scc_hic_h2s_h2s_ppm',
            'scc_hic_h2s_cyanide_present', 'scc_hic_h2s_banding_severity',
            'scc_hic_h2s_cracks_observed', 'scc_hic_h2s_cracks_removed',
            'scc_hic_h2s_inspection_count_a', 'scc_hic_h2s_inspection_count_b', 'scc_hic_h2s_inspection_count_c',
            'scc_hic_h2s_inspection_count_d',
            
            # SCC ACSCC
            'mechanism_scc_acscc_active', 'scc_acscc_cracks_observed', 'scc_acscc_cracks_removed',
            'scc_acscc_stress_relieved', 'scc_acscc_co3_conc_percent',
            'scc_acscc_inspection_count_a', 'scc_acscc_inspection_count_b', 'scc_acscc_inspection_count_c',
            'scc_acscc_inspection_count_d',
            
            # SCC PASCC
            'mechanism_scc_pascc_active', 'scc_pascc_cracks_observed', 'scc_pascc_cracks_removed',
            'scc_pascc_sensitized', 'scc_pascc_sulfur_exposure', 'scc_pascc_downtime_protected',
            'scc_pascc_inspection_count_a', 'scc_pascc_inspection_count_b', 'scc_pascc_inspection_count_c',
            'scc_pascc_inspection_count_d',
            
            # SCC ClSCC
            'mechanism_scc_clscc_active', 'scc_clscc_cracks_observed', 'scc_clscc_cracks_removed',
            'scc_clscc_cl_conc_ppm', 'scc_clscc_deposits_present',
            'scc_clscc_inspection_count_a', 'scc_clscc_inspection_count_b', 'scc_clscc_inspection_count_c',
            'scc_clscc_inspection_count_d',
            
            # SCC HSC-HF
            'mechanism_scc_hsc_hf_active', 'scc_hsc_hf_cracks_observed', 'scc_hsc_hf_cracks_removed',
            'scc_hsc_hf_present', 'scc_hsc_hf_hf_conc_percent', 'scc_hsc_hf_hardness_hb',
            'scc_hsc_hf_inspection_count_a', 'scc_hsc_hf_inspection_count_b', 'scc_hsc_hf_inspection_count_c',
            'scc_hsc_hf_inspection_count_d',
            
            # Thinning (Metal Loss) Mechanisms
            'mech_thinning_co2_active', 'mech_thinning_hcl_active', 'mech_thinning_h2so4_active',
            'mech_thinning_hf_active', 'mech_thinning_amine_active', 'mech_thinning_alkaline_active',
            'mech_thinning_acid_active', 'mech_thinning_soil_active', 'mech_thinning_h2s_h2_active',
            'mech_thinning_sulfidic_active',
            
            # CO2 Corrosion Inputs
            'co2_concentration_mol_percent', 'co2_shear_stress_pa', 'co2_corrosion_rate_mpy',
            
            # HCl Corrosion Inputs
            'hcl_concentration_wt_percent', 'hcl_velocity_fps', 'hcl_corrosion_rate_mpy',
            
            # H2SO4 Corrosion Inputs
            'h2so4_concentration_wt_percent', 'h2so4_velocity_fps', 'h2so4_corrosion_rate_mpy',
            
            # HF Corrosion Inputs
            'hf_concentration_wt_percent', 'hf_velocity_fps', 'hf_corrosion_rate_mpy',
            
            # Amine Corrosion Inputs
            'amine_type', 'amine_concentration_wt_percent', 'amine_acid_gas_loading', 'amine_corrosion_rate_mpy',
            
            # Alkaline Water Corrosion
            'alkaline_water_velocity_fps', 'alkaline_water_corrosion_rate_mpy',
            
            # Acid Water Corrosion
            'acid_water_dissolved_o2_ppm', 'acid_water_corrosion_rate_mpy',
            
            # Soil Side Corrosion
            'soil_coating_condition', 'soil_cathodic_protection', 'soil_resistivity_ohm_cm', 'soil_corrosion_rate_mpy',
            
            # High Temp H2S/H2
            'ht_h2s_partial_pressure_psia', 'ht_h2_partial_pressure_psia', 'ht_h2s_h2_corrosion_rate_mpy',
            
            # Sulfidic/Naphthenic
            'sulfidic_tan', 'sulfidic_sulfur_wt_percent', 'sulfidic_velocity_fps', 'sulfidic_corrosion_rate_mpy',
            
            # Brittle Fracture
            'mechanism_brittle_fracture_active', 'brittle_admin_controls', 
            'brittle_min_operating_temp_f', 'brittle_delta_fatt', 
            'brittle_cet_f', 'brittle_pwht', 'brittle_damage_factor',
             'brittle_curve', 'brittle_yield_strength_ksi', 'brittle_material_type',
            
            # HTHA Fields
            'mechanism_htha_active', 'htha_material', 'htha_h2_partial_pressure_psia',
            'htha_exposure_time_years', 'htha_damage_observed',
            'htha_material_verification', 'htha_damage_factor',

            # POF Calculation Fields (GFF + FMS)
            'pof_category', 'gff_value', 'fms_factor', 'fms_pscore', 'final_pof',
            'gff_equipment_type', 'gff_component_type',
            
            # External Damage
            'mech_ext_corrosion_active', 'mech_cui_active', 'mech_ext_clscc_active', 'mech_cui_clscc_active',
            'external_driver', 'external_corrosion_rate_mpy',
            'cui_driver', 'insulation_condition', 'cui_corrosion_rate_mpy',
            'complexity',
            
            # Brittle Fracture Checkboxes (Duplicate lines removed for clarity if present, but keeping context correct)
            # Thinning Mechanism Active Checkboxes
            'mech_thinning_co2_active', 'mech_thinning_hcl_active', 'mech_thinning_h2so4_active', 
            'mech_thinning_hf_active', 'mech_thinning_amine_active', 'mech_thinning_alkaline_active',
            'mech_thinning_acid_active', 'mech_thinning_soil_active', 'mech_thinning_h2s_h2_active', 
            'mech_thinning_sulfidic_active',
            
            # Thinning DF Inputs (API 581)
            'min_required_thickness_in', 'future_corrosion_allowance_in',
            
            # Brittle Fracture (Duplicate lines from view removed)
            'mechanism_external_damage_active',
            


            'mechanism_external_damage_active',
            
            # COF Financial Fields
            'material_construction', 'cost_factor', 'equipment_cost_per_sqft',
            'production_cost_per_day', 'outage_multiplier', 'injury_cost_per_person',
            'environmental_cost_per_bbl'
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
            'material_construction': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'cost_factor': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '1.0'}),
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
            'rbix_fluid': forms.Select(attrs={'class': 'select select-bordered w-full'}),
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
            
            # Inspection Fields
            'int_inspection_vol_mil': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Mil'}),
            'last_int_visual_inspection_date': forms.DateInput(attrs={'class': 'input input-bordered w-full', 'type': 'date'}),
            'service_years_since_last_int_visual_insp': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Years'}),
            'internal_lining_quality': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'internal_cracks_present': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'internal_crack_finding_capability': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'internal_corrosion_finding_capability': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'ext_inspection_vol_mil': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Mil'}),
            'last_ext_visual_inspection_date': forms.DateInput(attrs={'class': 'input input-bordered w-full', 'type': 'date'}),
            'service_years_since_last_ext_visual_insp': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Years'}),
            'external_coating_quality': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'external_crack_finding_capability': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'external_corrosion_finding_capability': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'thickness_nominal_mm': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'mm'}),
            'thickness_minimum_required_mm': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'mm'}),
            'thickness_measured_mm': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'mm'}),
            'corrosion_rate_mm_year': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.0001', 'placeholder': 'mm/year'}),
            'inspection_summary': forms.Textarea(attrs={'class': 'textarea textarea-bordered w-full', 'rows': 6, 'placeholder': 'Inspection summary...'}),
            
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
            
            # --- RISK PROBABILITY WIDGETS ---
            'mechanism_scc_caustic_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_caustic_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_caustic_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_caustic_stress_relieved': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_caustic_naoh_conc_percent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'NaOH %'}),
            'scc_caustic_steamed_out_prior': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            
            'scc_caustic_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_caustic_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_caustic_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_caustic_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            # SCC Amine
            'mechanism_scc_amine_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_amine_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_amine_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_amine_stress_relieved': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_amine_solution_type': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'scc_amine_steamed_out': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_amine_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_amine_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_amine_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_amine_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            # SCC SSC
            'mechanism_scc_ssc_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_ssc_ph': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'pH'}),
            'scc_ssc_h2s_ppm': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'ppm'}),
            'scc_ssc_hardness_hb': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': 'HB'}),
            'scc_ssc_pwht': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_ssc_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_ssc_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_ssc_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_ssc_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_ssc_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_ssc_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            # SCC HIC/SOHIC
            'mechanism_scc_hic_h2s_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_hic_h2s_ph': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'pH'}),
            'scc_hic_h2s_h2s_ppm': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'ppm'}),
            'scc_hic_h2s_cyanide_present': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_hic_h2s_banding_severity': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'scc_hic_h2s_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_hic_h2s_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_hic_h2s_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_hic_h2s_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_hic_h2s_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_hic_h2s_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            # SCC ACSCC
            'mechanism_scc_acscc_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_acscc_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_acscc_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_acscc_stress_relieved': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_acscc_co3_conc_percent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'CO3 %'}),
            'scc_acscc_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_acscc_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_acscc_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_acscc_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            # SCC PASCC
            'mechanism_scc_pascc_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_pascc_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_pascc_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_pascc_sensitized': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_pascc_sulfur_exposure': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_pascc_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_pascc_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_pascc_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_pascc_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            # SCC ClSCC
            'mechanism_scc_clscc_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_clscc_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_clscc_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_clscc_cl_conc_ppm': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Cl ppm'}),
            'scc_clscc_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_clscc_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_clscc_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_clscc_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            # SCC HSC-HF
            'mechanism_scc_hsc_hf_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_hsc_hf_cracks_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_hsc_hf_cracks_removed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'scc_hsc_hf_hf_conc_percent': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'HF %'}),
            'scc_hsc_hf_hardness_hrc': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': 'HRC'}),
            'scc_hsc_hf_inspection_count_a': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_hsc_hf_inspection_count_b': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_hsc_hf_inspection_count_c': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'scc_hsc_hf_inspection_count_d': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            
            'mechanism_brittle_fracture_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'brittle_admin_controls': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'brittle_min_operating_temp_f': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': '°F'}),
            'brittle_delta_fatt': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'Delta FATT'}),
            'brittle_cet_f': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.01', 'placeholder': 'CET (°F)'}),
            'brittle_pwht': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'brittle_curve': forms.Select(attrs={'class': 'select select-bordered w-full'}, choices=[
                ('', '-- Select --'), ('A', 'Curve A'), ('B', 'Curve B'), ('C', 'Curve C'), ('D', 'Curve D')
            ]),
            'brittle_yield_strength_ksi': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': 'ksi'}),
            'brittle_material_type': forms.Select(attrs={'class': 'select select-bordered w-full'}, choices=[
                ('', '-- Select --'),
                ('Carbon Steel', 'Carbon Steel'),
                ('C-0.5Mo', 'C-0.5Mo (Annealed)'),
                ('C-0.5Mo Normalized', 'C-0.5Mo (Normalized)'),
                ('1Cr-0.5Mo', '1Cr-0.5Mo'),
                ('1.25Cr-0.5Mo', '1.25Cr-0.5Mo'),
                ('2.25Cr-1Mo', '2.25Cr-1Mo'),
                ('3Cr-1Mo', '3Cr-1Mo'),
                ('5Cr-0.5Mo', '5Cr-0.5Mo (Not subject to HTHA)'),
                ('7Cr-0.5Mo', '7Cr-0.5Mo (Not subject to HTHA)'),
            ]),
            
            # HTHA Widgets
            'mechanism_htha_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'htha_material': forms.Select(attrs={'class': 'select select-bordered w-full'}, choices=[
                ('', '-- Select --'),
                ('Carbon Steel', 'Carbon Steel'),
                ('C-0.5Mo', 'C-0.5Mo (Annealed)'),
                ('C-0.5Mo Normalized', 'C-0.5Mo (Normalized)'),
                ('1Cr-0.5Mo', '1Cr-0.5Mo'),
                ('1.25Cr-0.5Mo', '1.25Cr-0.5Mo'),
                ('2.25Cr-1Mo', '2.25Cr-1Mo'),
                ('3Cr-1Mo', '3Cr-1Mo'),
                ('Other', 'Other (Consult API 941)')
            ]),
            'htha_h2_partial_pressure_psia': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': 'psia'}),
            'htha_exposure_time_years': forms.NumberInput(attrs={'class': 'input input-bordered w-full', 'step': '0.1', 'placeholder': 'years'}),
            'htha_damage_observed': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'htha_material_verification': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
            'htha_damage_factor': forms.NumberInput(attrs={'class': 'input input-bordered w-full bg-gray-100', 'readonly': 'readonly'}),

            # POF Calculation Widgets
            'pof_category': forms.Select(attrs={'class': 'select select-bordered w-full'}, choices=[
                ('', '-- Auto --'), ('1', '1 - Very Low'), ('2', '2 - Low'), ('3', '3 - Medium'),
                ('4', '4 - High'), ('5', '5 - Very High')
            ]),
            'gff_value': forms.NumberInput(attrs={'class': 'input input-bordered w-full bg-gray-100', 'readonly': 'readonly', 'step': 'any'}),
            'fms_factor': forms.NumberInput(attrs={'class': 'input input-bordered w-full bg-gray-100', 'readonly': 'readonly', 'step': '0.001'}),
            'fms_pscore': forms.NumberInput(attrs={'class': 'input input-bordered w-full bg-gray-100', 'readonly': 'readonly', 'step': '0.01'}),
            'final_pof': forms.NumberInput(attrs={'class': 'input input-bordered w-full bg-gray-100', 'readonly': 'readonly', 'step': 'any'}),
            
            # GFF Equipment/Component Type
            'gff_equipment_type': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'gff_component_type': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            
            'mechanism_external_damage_active': forms.CheckboxInput(attrs={'class': 'checkbox checkbox-primary'}),
        }

    def __init__(self, user, *args, **kwargs):
        super(ComponentForm, self).__init__(*args, **kwargs)
        self.fields['equipment'].queryset = Equipment.objects.filter(system__unit__facility__owner=user)


