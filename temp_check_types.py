from formula_app.models import ComponentType

for c in ComponentType.objects.select_related('equipment').all()[:20]:
    print(f'{c.equipment.name}: {c.name}')
