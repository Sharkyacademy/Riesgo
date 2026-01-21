from django.db import models
from .data.representative_fluids import REPRESENTATIVE_FLUIDS
from .data.component_types import COMPONENT_TYPES
from .data.materials import MATERIAL_CHOICES


class Facility(models.Model):
    name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, null=True, blank=True)
    location = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=255, verbose_name="Type")
    owner = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Facilities"

class Unit(models.Model):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255, null=True, blank=True)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE)
    people_density = models.FloatField(default=0.0, verbose_name="People per Sq Ft")

    def __str__(self):
        return self.name

class System(models.Model):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Equipment(models.Model):
    number = models.CharField(max_length=255)
    plant_equipment_type = models.CharField(max_length=255, verbose_name="Plant Equipment Type")
    plant_equipment_desc = models.CharField(max_length=255, verbose_name="Plant Equipment Description", null=True, blank=True)
    system = models.ForeignKey(System, on_delete=models.CASCADE)

    def __str__(self):
        return self.number

class Component(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)
    rbix_equipment_type = models.CharField(max_length=255, verbose_name="RBIX Equipment Type")
    rbix_component_type = models.CharField(max_length=255, verbose_name="RBIX Component Type", choices=COMPONENT_TYPES)
    description = models.TextField(null=True, blank=True)
    p_and_id = models.CharField(max_length=255, verbose_name="P&ID", null=True, blank=True)
    p_and_id_other = models.CharField(max_length=255, verbose_name="P&ID Other", null=True, blank=True)
    other_drawings = models.CharField(max_length=255, null=True, blank=True)
    commissioning_date = models.DateField(null=True, blank=True)
    rbi_calculation_date = models.DateField(null=True, blank=True, verbose_name="RBI Calculation Date")
    design_life_years = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Design Life (years)")
    component_life_years = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Component Life (years)")
    remaining_life_years = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Remaining Life (years)")
    external_coating_date = models.DateField(null=True, blank=True, verbose_name="External Coating Installation Date")
    material = models.CharField(max_length=255, null=True, blank=True)
    rep_pipe_no = models.CharField(max_length=255, null=True, blank=True, verbose_name="Rep. Pipe No.")
    
    # COF Level 1 Fields - Representative Fluids & Properties (4.1)
    representative_fluid = models.CharField(max_length=255, null=True, blank=True, verbose_name="Representative Fluid", choices=REPRESENTATIVE_FLUIDS)
    stored_phase = models.CharField(max_length=50, null=True, blank=True, verbose_name="Stored Phase", 
                                    choices=[('Liquid', 'Liquid'), ('Vapor', 'Vapor / Gas')])
    fluid_temperature = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Temperature (°F)")
    
    # COF Level 1 - Release Hole Size & GFF (4.2)
    component_diameter = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Component Diameter (inches)")
    
    # COF Level 1 - Release Rate Parameters (4.3.2 & 4.3.3) - Shared
    storage_pressure = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Storage Pressure Ps (psia)")
    atm_pressure = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=14.7, verbose_name="Atm. Pressure (psi)")
    discharge_coeff = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0.61, verbose_name="Discharge Coeff. (Cd)")
    
    # COF Level 1 - Liquid Release Rate Specific (4.3.2)
    viscosity_correction = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=1.0, verbose_name="Viscosity Correction (Kvn)")
    
    # COF Level 1 - Vapor Release Rate Specific (4.3.3)
    conversion_factor_c2 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=1, verbose_name="Conversion Factor (C2)")
    
    # COF Level 1 - Fluid Inventory (4.4)
    inventory_group_mass = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name="Inventory Group Mass (lb)")
    component_mass = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name="Component Mass (lb)")
    
    # COF Level 1 - Detection & Isolation (4.6)
    detection_class = models.CharField(max_length=10, null=True, blank=True, verbose_name="Detection Classification",
                                       choices=[('A', 'A - Instrumentation (Auto)'), 
                                               ('B', 'B - Detectors (Remote)'), 
                                               ('C', 'C - Visual / Marginal')])
    isolation_class = models.CharField(max_length=10, null=True, blank=True, verbose_name="Isolation Classification",
                                       choices=[('A', 'A - Auto Isolation'), 
                                               ('B', 'B - Remote Manual'), 
                                               ('C', 'C - Manual Valves')])
    
    # COF Level 1 - Flammable Consequence (4.8)
    mitigation_system = models.CharField(max_length=100, null=True, blank=True, verbose_name="Mitigation System",
                                        choices=[('None', 'None/No Mitigation (0%)'),
                                                ('InventoryBlowdown', 'Inventory blowdown, coupled with isolation system (25%)'),
                                                ('FireWaterDeluge', 'Fire water deluge system and monitors (20%)'),
                                                ('FireWaterMonitors', 'Fire water monitors only (5%)'),
                                                ('FoamSpray', 'Foam spray system (15%)')])
    
    # COF Level 1 - Toxic Consequence (4.9) - Conditional
    toxic_mass_fraction = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=1.0, verbose_name="Toxic Mass Fraction")
    
    # COF Level 1 - Financial Consequence (4.12)
    # 4.12.2 Component Damage Cost
    material_construction = models.CharField(max_length=255, null=True, blank=True, verbose_name="Material of Construction", choices=MATERIAL_CHOICES)
    cost_factor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=1.0, verbose_name="Cost Factor")
    
    # 4.12.3 Affected Area Cost
    equipment_cost_per_sqft = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, default=0, verbose_name="Equipment Cost ($/ft²)")
    
    # 4.12.4 Production Loss
    production_cost_per_day = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, default=0, verbose_name="Production Cost ($/day)")
    outage_multiplier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=1.0, verbose_name="Outage Multiplier")
    
    # 4.12.5 Personnel Injury Cost
    unit_area_safety = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, default=10000, verbose_name="Unit Area (ft²)")
    personnel_shift_1 = models.IntegerField(null=True, blank=True, default=2, verbose_name="Personnel Shift 1")
    time_present_shift_1 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=100, verbose_name="Time Present Shift 1 (%)")
    personnel_shift_2 = models.IntegerField(null=True, blank=True, default=0, verbose_name="Personnel Shift 2")
    time_present_shift_2 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0, verbose_name="Time Present Shift 2 (%)")
    personnel_maintenance = models.IntegerField(null=True, blank=True, default=0, verbose_name="Personnel Maintenance")
    time_present_maintenance = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0, verbose_name="Time Present Maintenance (%)")
    injury_cost_per_person = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, default=0, verbose_name="Injury Cost ($/person)")
    
    # 4.12.6 Environmental Cost
    environmental_cost_per_bbl = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, default=0, verbose_name="Environmental Cost ($/bbl)")

    # Operating & Process Section Fields (Imperial Units Only)
    
    # Operating Temperature
    operating_temp_f = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Operating Temperature (deg F)")
    component_may_operate_below_mdmt = models.BooleanField(default=False, verbose_name="Component may operate at or below the MDMT")
    
    # Operating Pressure  
    operating_pressure_psia = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Operating Pressure (psia)")
    
    # Flow Properties
    flow_velocity_fts = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Flow Velocity (ft/s)")
    inhibitor_efficiency_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Inhibitor Efficiency (%)")
    
    # Fluid Information
    fluid_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Fluid Name")
    fluid_description = models.TextField(null=True, blank=True, verbose_name="Fluid Description")
    rbix_fluid = models.CharField(max_length=255, null=True, blank=True, verbose_name="RBIX Fluid")
    operational_fluid_phase = models.CharField(max_length=50, null=True, blank=True, verbose_name="Operational Fluid Phase",
                                               choices=[('Gas', 'Gas'), ('Liquid', 'Liquid'), ('Two-Phase', 'Two-Phase')])
    component_fluid_mass_lb = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name="Component Fluid Mass (lb)")
    component_group_fluid_mass_lb = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name="Component Group Fluid Mass (lb)")
    
    # Safety Systems Effectiveness
    fluid_release_reduction_safety_effectiveness = models.CharField(max_length=50, null=True, blank=True, 
                                                                    verbose_name="Fluid Release Reduction Safety Systems Effectiveness",
                                                                    choices=[('None', 'None'), ('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])
    fire_reduction_safety_effectiveness = models.CharField(max_length=50, null=True, blank=True,
                                                           verbose_name="Fire Reduction Safety Systems Effectiveness", 
                                                           choices=[('None', 'None'), ('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])
    
    # Chemical Properties
    ph_value = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, verbose_name="pH")
    contains_water = models.BooleanField(default=False, verbose_name="Water")
    contains_h2s = models.BooleanField(default=False, verbose_name="H₂S")
    contains_co2 = models.BooleanField(default=False, verbose_name="CO₂")
    contains_h2so4 = models.BooleanField(default=False, verbose_name="H₂SO₄")
    contains_hf = models.BooleanField(default=False, verbose_name="HF")
    contains_amine = models.BooleanField(default=False, verbose_name="Amine")
    contains_hcl = models.BooleanField(default=False, verbose_name="HCl")
    contains_oxygen = models.BooleanField(default=False, verbose_name="Oxygen")
    contains_sulphur = models.BooleanField(default=False, verbose_name="Sulphur")
    contains_chloride = models.BooleanField(default=False, verbose_name="Chloride")
    contains_hydrogen = models.BooleanField(default=False, verbose_name="Hydrogen")
    high_hydrogen_partial_pressure = models.BooleanField(default=False, verbose_name="Hydrogen partial pressure > 0.032 MPa [50 psi]")
    contains_oil = models.BooleanField(default=False, verbose_name="Oil")
    contains_caustic = models.BooleanField(default=False, verbose_name="Caustic")
    underground = models.BooleanField(default=False, verbose_name="Underground")
    cooling_water_service = models.BooleanField(default=False, verbose_name="Cooling Water Service")
    
    # Chemical Concentrations (Weight %)
    h2s_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="H₂S (Hydrogen sulfide)(W%)")
    nh3_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="NH₃, Ammonia (W%)")
    co2_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="CO₂ Carbon Monoxide (W%)")
    hno3_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="HNO₃, Nitric Acid (W%)")
    h2o2_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="H₂O₂, Nitrogen Dioxide (W%)")
    cocl2_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="COCl₂, Phosphine (W%)")
    c2h4o3_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="C₂H₄O₃, Ethylene Oxide (EO) (W%)")
    c3h6o2_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="C₃H₆O₂, Propylene Oxide (PO) (W%)")
    toluene_diisocynate_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="Toluene Diisocynate (TDI) (W%)")
    c3h8o2_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="C₃H₈O₂, Ethylene Glycol Monomethyl Ether (EE) (W%)")
    alcl3_concentration_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="AlCl₃, Aluminum Chloride (W%)")
    toxic_mass_fraction_wpercent = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="Toxic Mass Fraction")


    
    # New Design / Installation Fields (User Request 2026-01-19) - Imperial Units
    
    # General ID
    pfd_no = models.CharField(max_length=255, null=True, blank=True, verbose_name="PFD No")
    
    # Material Details
    material_nominal_composition = models.CharField(max_length=255, null=True, blank=True, verbose_name="Material Nominal Composition")
    material_specification_no = models.CharField(max_length=255, null=True, blank=True, verbose_name="Material Specification No")
    sulphur_bearing_compounds = models.BooleanField(default=False, verbose_name="Sulphur Bearing Compounds")
    
    # Design Conditions
    design_pressure_psi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Design Pressure (psi)")
    design_temp_f = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Design Temp. (°F)")
    mdmt_f = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="MDMT (°F)")
    
    # Stress / Strength
    stress_strength_known = models.BooleanField(default=False, verbose_name="Stress / Strength Known")
    allowable_stress_psi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Allowable Stress (psi)")
    smys_yield_psi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="SMYS (Yield) (psi)")
    
    # Dimensions
    size_diameter_rating = models.CharField(max_length=255, null=True, blank=True, verbose_name="Size Diameter Rating", 
                                          choices=[('Under 20', 'Under 20'), ('Over 20', 'Over 20')])
    nominal_thickness_known = models.BooleanField(default=False, verbose_name="Nominal Thickness Known")
    nominal_thickness_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="NT (inch)")
    diameter_outside_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="Outside Diameter (inch)")
    diameter_inside_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="Inside Diameter (inch)")
    
    # Codes & Factors
    safety_factor = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Safety Factor")
    design_code = models.CharField(max_length=255, null=True, blank=True, verbose_name="Design Code", 
                                 choices=[('ASME VIII Div 1', 'ASME VIII Div 1'), ('ASME VIII Div 2', 'ASME VIII Div 2'), ('API 650', 'API 650')])
    joint_efficiency = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=1.0, verbose_name="Joint Efficiency")
    pwht = models.BooleanField(default=False, verbose_name="PWHT")
    heat_traced = models.BooleanField(default=False, verbose_name="Heat Traced")
    
    # Corrosion & Insulation
    atmosphere_corrosivity = models.CharField(max_length=255, null=True, blank=True, verbose_name="Atmosphere Corrosivity",
                                            choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])
    internal_cladding = models.BooleanField(default=False, verbose_name="Internal Cladding")
    internal_lining = models.BooleanField(default=False, verbose_name="Internal Lining")
    insulated = models.BooleanField(default=False, verbose_name="Insulated")
    insulation_type = models.CharField(max_length=255, null=True, blank=True, verbose_name="Insulation Type",
                                     choices=[('Calcium Silicate', 'Calcium Silicate'), ('Mineral Wool', 'Mineral Wool'), 
                                             ('Fiberglass', 'Fiberglass'), ('Foam Glass', 'Foam Glass'), ('Other', 'Other')])
    other_insulation = models.CharField(max_length=255, null=True, blank=True, verbose_name="Other Insulation")

    # Inspection Section Fields
    
    # Internal Inspection
    int_inspection_vol_mil = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Int. Inspection (vol, Mil)")
    last_int_visual_inspection_date = models.DateField(null=True, blank=True, verbose_name="Last Int. Visual Inspection Date")
    service_years_since_last_int_visual_insp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Service Years Since Last Int. Visual Insp.")
    internal_lining_quality = models.CharField(max_length=50, null=True, blank=True, verbose_name="Internal Lining Quality",
                                               choices=[('', '-- Select Quality --'), ('Poor', 'Poor'), ('Fair', 'Fair'), ('Good', 'Good'), ('Excellent', 'Excellent')])
    internal_cracks_present = models.BooleanField(default=False, verbose_name="Internal Cracks Present")
    internal_crack_finding_capability = models.CharField(max_length=50, null=True, blank=True, verbose_name="Internal Crack Finding Capability",
                                                         choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])
    internal_corrosion_finding_capability = models.CharField(max_length=50, null=True, blank=True, verbose_name="Internal Corrosion Finding Capability",
                                                             choices=[('Low', 'Low'), ('Medium', 'Medium'), ('Medium-High', 'Medium-High'), ('High', 'High')])
    
    # External Inspection
    ext_inspection_vol_mil = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="External Inspection (vol, Mil)")
    last_ext_visual_inspection_date = models.DateField(null=True, blank=True, verbose_name="Last Ext. Visual Inspection Date")
    service_years_since_last_ext_visual_insp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Service Years Since Last Ext. Visual Insp.")
    external_coating_quality = models.CharField(max_length=50, null=True, blank=True, verbose_name="External Coating Quality",
                                                choices=[('', '-- Select Quality --'), ('Poor', 'Poor'), ('Fair', 'Fair'), ('Good', 'Good'), ('Excellent', 'Excellent')])
    external_crack_finding_capability = models.CharField(max_length=50, null=True, blank=True, verbose_name="External Crack Finding Capability",
                                                         choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])
    external_corrosion_finding_capability = models.CharField(max_length=50, null=True, blank=True, verbose_name="External Corrosion Finding Capability",
                                                             choices=[('Low', 'Low'), ('Medium', 'Medium'), ('Medium-High', 'Medium-High'), ('High', 'High')])
    
    # Thickness Inspection
    thickness_nominal_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Nominal Thickness (mm)")
    thickness_minimum_required_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Minimum Required Thickness (mm)")
    thickness_measured_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Measured Thickness (mm)")
    corrosion_rate_mm_year = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="Corrosion Rate (mm/year)")
    
    # Inspection Summary
    inspection_summary = models.TextField(null=True, blank=True, verbose_name="Inspection Summary")


    def __str__(self):
        return f"{self.rbix_component_type} - {self.equipment.number}"


class InspectionHistory(models.Model):
    """Model for tracking inspection history records"""
    component = models.ForeignKey(Component, on_delete=models.CASCADE, related_name='inspection_history')
    inspection_type = models.CharField(max_length=20, verbose_name="Method", 
                                       choices=[('Internal Visual', 'Internal Visual'), ('External Visual', 'External Visual')])
    date = models.DateField(verbose_name="Date")
    lining_quality = models.CharField(max_length=50, null=True, blank=True, verbose_name="Lining Quality",
                                      choices=[('Poor', 'Poor'), ('Fair', 'Fair'), ('Good', 'Good'), ('Excellent', 'Excellent'), ('Average', 'Average')])
    general_condition = models.CharField(max_length=50, verbose_name="General Condition",
                                        choices=[('Poor', 'Poor'), ('Fair', 'Fair'), ('Good', 'Good'), ('Excellent', 'Excellent'), ('Average', 'Average')])
    crack_finding_capability = models.CharField(max_length=50, verbose_name="Crack Finding Capability",
                                               choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])
    corrosion_finding_capability = models.CharField(max_length=50, verbose_name="Corrosion Finding Capability",
                                                   choices=[('Low', 'Low'), ('Medium', 'Medium'), ('Medium-High', 'Medium-High'), ('High', 'High')])
    comments = models.TextField(null=True, blank=True, verbose_name="Comments")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = "Inspection History"
        verbose_name_plural = "Inspection Histories"
    
    def __str__(self):
        return f"{self.inspection_type} - {self.component} - {self.date}"


