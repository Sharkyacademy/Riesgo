from formula_app.models import ComponentGff, ComponentType, EquipmentType

common_values_small = [8.00E-06, 2.80E-05, 7.20E-04, 7.00E-05]
common_values_medium = [2.00E-05, 2.50E-05]
common_values_large = [2.00E-06, 5.00E-06]
common_values_rupture = [6.00E-07, 2.60E-06, 1.00E-07, 2.00E-06]
common_values_gff = [3.00E-05, 3.06E-05, 7.22E-04, 1.00E-04]

data = {

    # COMPRESSOR
    'COMPC': [common_values_small[0], common_values_medium[0], common_values_large[0], 0.0, common_values_gff[0]],
    'COMPR': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],

    # HEAT EXCHANGER
    'HEXSS': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'HEXTS': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],

    # PIPE
    'PIPE-1': [common_values_small[1], 0.0, 0.0, common_values_rupture[1], common_values_gff[1]],
    'PIPE-2': [common_values_small[1], 0.0, 0.0, common_values_rupture[1], common_values_gff[1]],
    'PIPE-4': [common_values_small[0], common_values_medium[0], 0.0, common_values_rupture[1], common_values_gff[1]],
    'PIPE-6': [common_values_small[0], common_values_medium[0], 0.0, common_values_rupture[1], common_values_gff[1]],
    'PIPE-8':[common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'PIPE-10': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'PIPE-12': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'PIPE-16': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'PIPEGT16': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],

    # PUMP
    'PUMP2S': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'PUMPR': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'PUMP1S': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],

    # TANK620
    'TANKBOTTOM': [common_values_small[2], 0.0, 0.0, common_values_rupture[3], common_values_gff[2]],
    'TANKBOTEDGE': [common_values_small[2], 0.0, 0.0, common_values_rupture[3], common_values_gff[2]],
    'COURSE-1-10': [common_values_small[3], common_values_medium[1], common_values_large[1], common_values_rupture[2], common_values_gff[3]],

    # TANK650
    'TANKBOTTOM': [common_values_small[2], 0.0, 0.0, common_values_rupture[3], common_values_gff[2]],
    'TANKBOTEDGE': [common_values_small[2], 0.0, 0.0, common_values_rupture[3], common_values_gff[2]],
    'COURSE-1-10': [common_values_small[3], common_values_medium[1], common_values_large[1], common_values_rupture[2], common_values_gff[3]],

    # FINFAN
    'FINFAN TUBES': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'FINFAN HEADER': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],

    # VESSEL
    'KODRUM': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'COLBTM': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'FILTER': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'DRUM': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'REACTOR': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'COLTOP': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]],
    'COLMID': [common_values_small[0], common_values_medium[0], common_values_large[0], common_values_rupture[0], common_values_gff[1]]
}

# update the table gff with the data in the table above
equipments = ['compressor', 'heat exchanger', 'pipe', 'pump', 'finfan', 'vessel', 'tank620', 'tank650']

for eq_name in equipments:
    equipment = EquipmentType.objects.get(name=eq_name)
    components = ComponentType.objects.filter(equipment_id=equipment.id)

    for component in components:
        values = data.get(component.name)
        if values:
            ComponentGff.objects.update_or_create(component_id=component.id, defaults={'gff_small': values[0],  'gff_medium': values[1], 'gff_large': values[2], 'gff_rupture': values[3], 'gff_total': values[4]})
