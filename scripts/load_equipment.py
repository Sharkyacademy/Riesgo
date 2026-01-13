from formula_app.models import EquipmentType

# ARRAY WITH EQUIPMENT DATA
equipment_names = [
    'compressor',
    'heat exchanger',
    'pipe',
    'pump',
    'tank620',
    'tank650',
    'finfan',
    'vessel',
]

for name in equipment_names:
    EquipmentType.objects.get_or_create(name=name)

