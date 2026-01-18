from django.db import models

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
    rbix_component_type = models.CharField(max_length=255, verbose_name="RBIX Component Type")
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

    def __str__(self):
        return f"{self.rbix_component_type} - {self.equipment.number}"


