from formula_app.models import ComponentType, EquipmentType

# ARRAY WITH COMPONENT DATA
data = {
    'compressor': ['COMPC', 'COMPR'],
    'heat exchanger': ['HEXSS', 'HEXTS'],
    'pipe': ['PIPE-1', 'PIPE-2', 'PIPE-4', 'PIPE-6', 'PIPE-8', 'PIPE-10', 'PIPE-12', 'PIPE-16', 'PIPEGT16'],
    'pump': ['PUMP2S', 'PUMPR', 'PUMP1S'],
    'tank620': ['TANKBOTTOM', 'TANKBOTEDGE', 'COURSE-1-10'],
    'tank650': ['TANKBOTTOM', 'TANKBOTEDGE', 'COURSE-1-10'],
    'finfan': ['FINFAN TUBES', 'FINFAN HEADER'],
    'vessel': ['KODRUM', 'COLBTM', 'FILTER', 'DRUM', 'REACTOR', 'COLTOP', 'COLMID'],
}

for eq_name, components in data.items():
    equipment = EquipmentType.objects.get(name=eq_name)
    for comp_name in components:
        ComponentType.objects.get_or_create(equipment=equipment, name=comp_name)

