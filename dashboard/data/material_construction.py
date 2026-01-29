"""
API 581 Table 4.16
Material Cost Factors for Component Damage Calculations
These are multipliers applied to base component costs
"""

# Material name: cost_factor
MATERIAL_COST_FACTORS = {
    'Carbon Steel': 1.0,
    'Organic coatings (< 80 mil)': 1.2,
    '1.25Cr-0.5Mo': 1.3,
    '2.25Cr-1Mo': 1.7,
    '5Cr-0.5Mo': 1.7,
    '7Cr-0.5Mo': 2.0,
    'Clad 304 SS': 2.1,
    'Fiberglass': 2.5,
    'PP lined': 2.5,
    '9Cr-1Mo': 2.6,
    '405 SS': 2.8,
    '410 SS': 2.8,
    '304 SS': 3.2,
    'Clad 316 SS': 3.3,
    'Strip lined alloy': 3.3,
    'Organic coating (> 80 mil)': 3.4,
    'CS saran lined': 3.4,
    'CS rubber lined': 4.4,
    '316 SS': 4.8,
    'CS glass lined': 5.8,
    'Clad Alloy 400': 6.4,
    '90/10 Cu/Ni': 6.8,
    'Clad Alloy 600': 7.0,
    'CS PTFE lined': 7.8,
    'Clad nickel': 8.0,
    'Alloy 800': 8.4,
    '70/30 Cu/Ni': 8.5,
    '904L': 8.8,
    'Alloy 20': 11,
    'Alloy 400': 15,
    'Alloy 600': 15,
    'Nickel': 18,
    'Acid brick': 20,
    'Refractory': 20,
    'Alloy 625': 26,
    'Titanium': 28,
    'Alloy C': 29,
    'Zirconium': 34,
    'Alloy B': 36,
    'Tantalum': 535
}

# For Django model choices: [(value, display_label), ...]
MATERIAL_CONSTRUCTION_CHOICES = [(name, name) for name in MATERIAL_COST_FACTORS.keys()]

def get_material_cost_factor(material_name):
    """
    Get material cost factor multiplier from API 581 Table 4.16
    
    Args:
        material_name (str): Material name from MATERIAL_COST_FACTORS
    
    Returns:
        float: Cost multiplier (defaults to 1.0 for Carbon Steel if not found)
    """
    return MATERIAL_COST_FACTORS.get(material_name, 1.0)
