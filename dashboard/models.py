from django.db import models
from .data.representative_fluids import REPRESENTATIVE_FLUIDS
from .data.component_types import COMPONENT_TYPES
from .data.materials import MATERIAL_CHOICES
from .data.material_construction import MATERIAL_CONSTRUCTION_CHOICES


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
    heat_traced = models.BooleanField(default=False, verbose_name="Heat Traced")
    
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
    material_construction = models.CharField(max_length=255, null=True, blank=True, verbose_name="Material of Construction", choices=MATERIAL_CONSTRUCTION_CHOICES)
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
    rbix_fluid = models.CharField(max_length=255, null=True, blank=True, verbose_name="RBIX Fluid", choices=REPRESENTATIVE_FLUIDS)
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
    # =========================================================================
    # EXTERNAL DAMAGE MECHANISMS
    # =========================================================================
    
    # Mechanism Active Checkboxes
    mech_ext_corrosion_active = models.BooleanField(default=False, verbose_name="External Corrosion Active")
    mech_cui_active = models.BooleanField(default=False, verbose_name="CUI Active")
    mech_ext_clscc_active = models.BooleanField(default=False, verbose_name="External ClSCC Active")
    mech_cui_clscc_active = models.BooleanField(default=False, verbose_name="CUI ClSCC Active")
    
    # External Corrosion Inputs
    external_driver = models.CharField(max_length=50, null=True, blank=True, verbose_name="External Corrosion Driver",
                                      choices=[('None', 'None'), ('Marine', 'Marine'), ('Temperate', 'Temperate'), ('Arid/Dry', 'Arid/Dry'), ('Severe', 'Severe')])
    external_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="External Corrosion Rate (mpy)")
    
    # CUI Inputs
    cui_driver = models.CharField(max_length=50, null=True, blank=True, verbose_name="CUI Driver", 
                                 choices=[('None', 'None'), ('Mild', 'Mild'), ('Moderate', 'Moderate'), ('Severe', 'Severe')])
    insulation_condition = models.CharField(max_length=50, null=True, blank=True, verbose_name="Insulation Condition",
                                           choices=[('Good', 'Good'), ('Average', 'Average'), ('Poor', 'Poor')])
    cui_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="CUI Corrosion Rate (mpy)")
    
    # Complexity (for External DF adjustment)
    complexity = models.CharField(max_length=50, null=True, blank=True, verbose_name="Complexity",
                                 choices=[('High', 'High (Pipe, <1.5" OD)'), ('Medium', 'Medium'), ('Low', 'Low')])
    
    # =========================================================================
    # THINNING (METAL LOSS) MECHANISMS
    # =========================================================================
    
    # Mechanism Active Checkboxes (to persist UI state)
    mech_thinning_co2_active = models.BooleanField(default=False, verbose_name="CO2 Corrosion Active")
    mech_thinning_hcl_active = models.BooleanField(default=False, verbose_name="HCl Corrosion Active")
    mech_thinning_h2so4_active = models.BooleanField(default=False, verbose_name="H2SO4 Corrosion Active")
    mech_thinning_hf_active = models.BooleanField(default=False, verbose_name="HF Corrosion Active")
    mech_thinning_amine_active = models.BooleanField(default=False, verbose_name="Amine Corrosion Active")
    mech_thinning_alkaline_active = models.BooleanField(default=False, verbose_name="Alkaline Water Active")
    mech_thinning_acid_active = models.BooleanField(default=False, verbose_name="Acid Water Active")
    mech_thinning_soil_active = models.BooleanField(default=False, verbose_name="Soil Side Active")
    mech_thinning_h2s_h2_active = models.BooleanField(default=False, verbose_name="High Temp H2S/H2 Active")
    mech_thinning_sulfidic_active = models.BooleanField(default=False, verbose_name="Sulfidic/Naphthenic Active")
    
    # Shared Inputs (used across mechanisms)
    min_required_thickness_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="Min Required Thickness (in)")
    future_corrosion_allowance_in = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="Future Corrosion Allowance (in)")
    thickness_nominal_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Nominal Thickness (mm)")
    thickness_minimum_required_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Minimum Required Thickness (mm)")
    thickness_measured_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Measured Thickness (mm)")
    corrosion_rate_mm_year = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="Corrosion Rate (mm/year)")
    
    # Inspection Summary
    inspection_summary = models.TextField(null=True, blank=True, verbose_name="Inspection Summary")


    # --- RISK PROBABILITY CALCULATIONS (MIGRATION) ---
    
    # SCC - Caustic Cracking
    mechanism_scc_caustic_active = models.BooleanField(default=False, verbose_name="Mech. Active: SCC Caustic")
    scc_caustic_cracks_observed = models.BooleanField(default=False, verbose_name="Caustic Cracks Observed?")
    scc_caustic_cracks_removed = models.BooleanField(default=False, verbose_name="Caustic Cracks Removed?")
    scc_caustic_stress_relieved = models.BooleanField(default=False, verbose_name="Caustic Stress Relieved?")
    scc_caustic_naoh_conc_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="NaOH Concentration (%)")
    scc_caustic_steamed_out_prior = models.BooleanField(default=False, verbose_name="Steamed Out Prior to Service?")
    
    scc_caustic_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (Caustic)")
    scc_caustic_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (Caustic)")
    scc_caustic_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (Caustic)")
    scc_caustic_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (Caustic)")

    # SCC - Amine Cracking
    mechanism_scc_amine_active = models.BooleanField(default=False, verbose_name="Mech. Active: SCC Amine")
    scc_amine_cracks_observed = models.BooleanField(default=False, verbose_name="Amine Cracks Observed?")
    scc_amine_cracks_removed = models.BooleanField(default=False, verbose_name="Amine Cracks Removed?")
    scc_amine_stress_relieved = models.BooleanField(default=False, verbose_name="Amine Stress Relieved?")
    scc_amine_lean_amine = models.BooleanField(default=False, verbose_name="Exposed to Lean Amine?")
    scc_amine_solution_type = models.CharField(max_length=20, null=True, blank=True, verbose_name="Amine Solution Type",
                                               choices=[('MEA_DIPA', 'MEA or DIPA'), ('DEA_OTHER', 'DEA or Others')])
    scc_amine_steamed_out = models.BooleanField(default=False, verbose_name="Amine Steamed Out?")
    scc_amine_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (Amine)")
    scc_amine_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (Amine)")
    scc_amine_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (Amine)")
    scc_amine_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (Amine)")

    # SCC - SSC (Sulfide Stress Cracking)
    mechanism_scc_ssc_active = models.BooleanField(default=False, verbose_name="Mech. Active: SSC")
    scc_ssc_ph = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, verbose_name="pH")
    scc_ssc_h2s_ppm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="H2S Content (ppm)")
    scc_ssc_hardness_hb = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True, verbose_name="Max Hardness (HB)")
    scc_ssc_pwht = models.BooleanField(default=False, verbose_name="SSC PWHT?")
    scc_ssc_cracks_observed = models.BooleanField(default=False, verbose_name="SSC Cracks Observed?")
    scc_ssc_cracks_removed = models.BooleanField(default=False, verbose_name="SSC Cracks Removed?")
    scc_ssc_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (SSC)")
    scc_ssc_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (SSC)")
    scc_ssc_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (SSC)")
    scc_ssc_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (SSC)")

    # SCC - HIC/SOHIC-H2S
    mechanism_scc_hic_h2s_active = models.BooleanField(default=False, verbose_name="Mech. Active: HIC/SOHIC-H2S")
    scc_hic_h2s_ph = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, verbose_name="pH (HIC)")
    scc_hic_h2s_h2s_ppm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="H2S (ppm) (HIC)")
    scc_hic_h2s_cyanide_present = models.BooleanField(default=False, verbose_name="Cyanide Present?")
    BANDING_SEVERITY_CHOICES = [
        ('None', 'None'),
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    scc_hic_h2s_banding_severity = models.CharField(max_length=20, choices=BANDING_SEVERITY_CHOICES, default='None', verbose_name="Banding Severity")
    scc_hic_h2s_cracks_observed = models.BooleanField(default=False, verbose_name="HIC Cracks Observed?")
    scc_hic_h2s_cracks_removed = models.BooleanField(default=False, verbose_name="HIC Cracks Removed?")
    scc_hic_h2s_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (HIC)")
    scc_hic_h2s_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (HIC)")
    scc_hic_h2s_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (HIC)")
    scc_hic_h2s_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (HIC)")

    # SCC - ACSCC (Alkaline Carbonate)
    mechanism_scc_acscc_active = models.BooleanField(default=False, verbose_name="Mech. Active: ACSCC")
    scc_acscc_cracks_observed = models.BooleanField(default=False, verbose_name="ACSCC Cracks Observed?")
    scc_acscc_cracks_removed = models.BooleanField(default=False, verbose_name="ACSCC Cracks Removed?")
    scc_acscc_stress_relieved = models.BooleanField(default=False, verbose_name="ACSCC Stress Relieved?")
    scc_acscc_co3_conc_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="CO3 Concentration (%)")
    scc_acscc_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (ACSCC)")
    scc_acscc_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (ACSCC)")
    scc_acscc_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (ACSCC)")
    scc_acscc_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (ACSCC)")

    # SCC - PASCC (Polythionic Acid)
    mechanism_scc_pascc_active = models.BooleanField(default=False, verbose_name="Mech. Active: PASCC")
    scc_pascc_cracks_observed = models.BooleanField(default=False, verbose_name="PASCC Cracks Observed?")
    scc_pascc_cracks_removed = models.BooleanField(default=False, verbose_name="PASCC Cracks Removed?")
    scc_pascc_sensitized = models.BooleanField(default=False, verbose_name="Material Sensitized?")
    scc_pascc_sulfur_exposure = models.BooleanField(default=False, verbose_name="Sulfur Exposure?")
    scc_pascc_downtime_protected = models.BooleanField(default=False, verbose_name="Downtime Protection Used?")
    scc_pascc_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (PASCC)")
    scc_pascc_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (PASCC)")
    scc_pascc_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (PASCC)")
    scc_pascc_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (PASCC)")

    # SCC - ClSCC (Chloride)
    mechanism_scc_clscc_active = models.BooleanField(default=False, verbose_name="Mech. Active: ClSCC")
    scc_clscc_cracks_observed = models.BooleanField(default=False, verbose_name="ClSCC Cracks Observed?")
    scc_clscc_cracks_removed = models.BooleanField(default=False, verbose_name="ClSCC Cracks Removed?")
    scc_clscc_cl_conc_ppm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Cl Concentration (ppm)")
    scc_clscc_deposits_present = models.BooleanField(default=False, verbose_name="Deposits Present?")
    scc_clscc_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (ClSCC)")
    scc_clscc_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (ClSCC)")
    scc_clscc_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (ClSCC)")
    scc_clscc_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (ClSCC)")

    # SCC - HSC-HF (Hydrogen Stress Cracking - HF)
    mechanism_scc_hsc_hf_active = models.BooleanField(default=False, verbose_name="Mech. Active: HSC-HF")
    scc_hsc_hf_cracks_observed = models.BooleanField(default=False, verbose_name="HSC-HF Cracks Observed?")
    scc_hsc_hf_cracks_removed = models.BooleanField(default=False, verbose_name="HSC-HF Cracks Removed?")
    scc_hsc_hf_present = models.BooleanField(default=False, verbose_name="HF Present?")
    scc_hsc_hf_hf_conc_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="HF Concentration (%)")
    scc_hsc_hf_hardness_hb = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True, verbose_name="Hardness (HB)")
    scc_hsc_hf_inspection_count_a = models.IntegerField(default=0, verbose_name="Insp. Count Cat A (HSC-HF)")
    scc_hsc_hf_inspection_count_b = models.IntegerField(default=0, verbose_name="Insp. Count Cat B (HSC-HF)")
    scc_hsc_hf_inspection_count_c = models.IntegerField(default=0, verbose_name="Insp. Count Cat C (HSC-HF)")
    scc_hsc_hf_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (HSC-HF)")


    # Brittle Fracture
    mechanism_brittle_fracture_active = models.BooleanField(default=False, verbose_name="Mech. Active: Brittle Fracture")
    brittle_admin_controls = models.BooleanField(default=False, verbose_name="Admin Controls Prevent Pressurization?")
    brittle_min_operating_temp_f = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Min. Operating Temp (°F)")
    brittle_delta_fatt = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Delta FATT")
    brittle_cet_f = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Critical Exposure Temp (CET) (°F)")
    brittle_pwht = models.BooleanField(default=False, verbose_name="PWHT (Brittle Specific)")
    brittle_damage_factor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Brittle Fracture DF")
    brittle_curve = models.CharField(max_length=10, null=True, blank=True, verbose_name="Exemption Curve")
    brittle_yield_strength_ksi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Yield Strength (ksi)")
    brittle_material_type = models.CharField(max_length=50, null=True, blank=True, verbose_name="Material Type")

    # External Damage (Uses mostly existing fields, but might need a toggle)
    mechanism_external_damage_active = models.BooleanField(default=False, verbose_name="Mech. Active: External Damage")
    scc_hsc_hf_inspection_count_d = models.IntegerField(default=0, verbose_name="Insp. Count Cat D (HSC-HF)")

    # Thinning (Metal Loss) Mechanisms
    mech_thinning_co2_active = models.BooleanField(default=False, verbose_name="Mech. Active: CO2 Corrosion")
    mech_thinning_hcl_active = models.BooleanField(default=False, verbose_name="Mech. Active: HCl Corrosion")
    mech_thinning_h2so4_active = models.BooleanField(default=False, verbose_name="Mech. Active: H2SO4 Corrosion")
    mech_thinning_hf_active = models.BooleanField(default=False, verbose_name="Mech. Active: HF Corrosion")
    mech_thinning_amine_active = models.BooleanField(default=False, verbose_name="Mech. Active: Amine Corrosion")
    mech_thinning_alkaline_active = models.BooleanField(default=False, verbose_name="Mech. Active: Alkaline Water Corrosion")
    mech_thinning_acid_active = models.BooleanField(default=False, verbose_name="Mech. Active: Acid Water Corrosion")
    mech_thinning_soil_active = models.BooleanField(default=False, verbose_name="Mech. Active: Soil Side Corrosion")
    mech_thinning_h2s_h2_active = models.BooleanField(default=False, verbose_name="Mech. Active: High Temp H2S/H2")
    mech_thinning_sulfidic_active = models.BooleanField(default=False, verbose_name="Mech. Active: Sulfidic/Naphthenic")

    # CO2 Corrosion Inputs
    co2_concentration_mol_percent = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="CO2 Concentration (mol %)")
    co2_shear_stress_pa = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="CO2 Shear Stress (Pa)")
    co2_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="CO2 Corrosion Rate (mpy)")
    
    # HCl Corrosion Inputs
    hcl_concentration_wt_percent = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="HCl Concentration (wt %)")
    hcl_velocity_fps = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="HCl Velocity (ft/s)")
    hcl_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="HCl Corrosion Rate (mpy)")
    
    # H2SO4 Corrosion Inputs
    h2so4_concentration_wt_percent = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="H2SO4 Concentration (wt %)")
    h2so4_velocity_fps = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="H2SO4 Velocity (ft/s)")
    h2so4_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="H2SO4 Corrosion Rate (mpy)")
    
    # HF Corrosion Inputs
    hf_concentration_wt_percent = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="HF Concentration (wt %)")
    hf_velocity_fps = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="HF Velocity (ft/s)")
    hf_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="HF Corrosion Rate (mpy)")
    
    # Amine Corrosion Inputs
    AMINE_CHOICES = [
        ('MEA', 'Monoethanolamine (MEA)'),
        ('DEA', 'Diethanolamine (DEA)'),
        ('MDEA', 'Methyldiethanolamine (MDEA)'),
        ('DGA', 'Diglycolamine (DGA)'),
    ]
    amine_type = models.CharField(max_length=10, choices=AMINE_CHOICES, null=True, blank=True, verbose_name="Amine Type")
    amine_concentration_wt_percent = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="Amine Concentration (wt %)")
    amine_acid_gas_loading = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True, verbose_name="Acid Gas Loading (mol/mol)")
    amine_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Amine Corrosion Rate (mpy)")
    
    # Alkaline Water Corrosion Inputs (uses shared pH)
    alkaline_water_velocity_fps = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="Alkaline Water Velocity (ft/s)")
    alkaline_water_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Alkaline Water CR (mpy)")
    
    # Acid Water Corrosion Inputs
    acid_water_dissolved_o2_ppm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="Dissolved O2 (ppm)")
    acid_water_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Acid Water CR (mpy)")
    
    # Soil Side Corrosion Inputs
    COATING_CHOICES = [
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
        ('POOR', 'Poor'),
        ('NONE', 'No Coating'),
    ]
    soil_coating_condition = models.CharField(max_length=10, choices=COATING_CHOICES, null=True, blank=True, verbose_name="Coating Condition")
    soil_cathodic_protection = models.BooleanField(default=False, verbose_name="Cathodic Protection Active")
    soil_resistivity_ohm_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Soil Resistivity (ohm-cm)")
    soil_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Soil Side CR (mpy)")
    
    # High Temperature H2S/H2 Corrosion Inputs
    ht_h2s_partial_pressure_psia = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="H2S Partial Pressure (psia)")
    ht_h2_partial_pressure_psia = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="H2 Partial Pressure (psia)")
    ht_h2s_h2_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="HT H2S/H2 CR (mpy)")
    
    # Sulfidic/Naphthenic Acid Corrosion Inputs
    sulfidic_tan = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="TAN (Total Acid Number)")
    sulfidic_sulfur_wt_percent = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="Sulfur Content (wt %)")
    sulfidic_velocity_fps = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="Velocity (ft/s)")
    sulfidic_corrosion_rate_mpy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Sulfidic CR (mpy)")
    
    # Thinning Damage Factor Inputs (API 581 Section 4.4)
    min_required_thickness_in = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True, 
        verbose_name="Minimum Required Thickness (in)",
        help_text="Per ASME design calculation (t_min). If unknown, leave blank for simplified DF calculation."
    )
    future_corrosion_allowance_in = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True, 
        default=0.125,  # API 570 typical default: 1/8" for moderate corrosive service
        verbose_name="Future Corrosion Allowance (in)",
        help_text="FCA per API 570. Typical: 0.125\" (1/8\") for moderate service, 0.250\" (1/4\") for severe."
    )

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


