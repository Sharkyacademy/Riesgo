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

    def __str__(self):
        return f"{self.rbix_component_type} - {self.equipment.number}"


