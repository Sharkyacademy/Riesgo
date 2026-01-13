from django.db import models

# Create your models here.
class EquipmentType(models.Model):
    name = models.CharField(max_length= 30, unique=True)
    
    def __str__(self):
        return self.name

class ComponentType(models.Model):
    equipment = models.ForeignKey(EquipmentType, on_delete=models.CASCADE, related_name="components")
    name = models.CharField(max_length= 30)

    def __str__(self):
        return f"{self.name}"
    

class ComponentGff(models.Model):
    component = models.ForeignKey(ComponentType, on_delete=models.CASCADE, related_name="gffs")
    gff_small = models.FloatField()
    gff_medium = models.FloatField()
    gff_large = models.FloatField()
    gff_rupture = models.FloatField()
    gff_total = models.FloatField()

    def __str__(self):
        return f"GFF for {self.component.name}"



