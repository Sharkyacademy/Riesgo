"""
Representative Fluids for COF Level 1 Analysis
Based on API 581 Table 4.1.1
"""

# Structure: (code, type, examples)
REPRESENTATIVE_FLUIDS_DATA = [
    ("C1-C2", "Type 0", "Methane, ethane, ethylene, liquefied natural gas (LNG), fuel gas"),
    ("C3-C4", "Type 0", "Propane, butane, isobutane, liquefied petroleum gas (LPG)"),
    ("C5", "Type 0", "Pentane"),
    ("C6-C8", "Type 0", "Gasoline, naphtha, light straight run, heptane"),
    ("C9-C12", "Type 0", "Diesel, kerosene"),
    ("C13-C16", "Type 0", "Jet fuel, kerosene, atmospheric gas oil"),
    ("C17-C25", "Type 0", "Gas oil, typical crude"),
    ("C25+", "Type 0", "Residuum, heavy crude, lube oil, seal oil"),
    ("H2", "Type 0", "Hydrogen"),
    ("H2S", "Type 0", "Hydrogen sulfide"),
    ("HF", "Type 0", "Hydrogen fluoride"),
    ("HCl", "Type 0", "Hydrochloric acid"),
    ("Water", "Type 0", "Water"),
    ("Steam", "Type 0", "Steam"),
    ("Acid", "Type 0", "Acid, caustic"),
    ("Aromatics", "Type 1", "Benzene, toluene, xylene, cumene"),
    ("AlCl3", "Type 0", "Aluminum chloride"),
    ("Pyrophoric", "Type 0", "Pyrophoric materials"),
    ("Ammonia", "Type 0", "Ammonia"),
    ("Chlorine", "Type 0", "Chlorine"),
    ("CO", "Type 1", "Carbon monoxide"),
    ("DEE", "Type 1", "Diethyl ether"),
    ("Nitric acid", "Type 0", "Nitric acid"),
    ("NO2", "Type 0", "Nitrogen dioxide"),
    ("Phosgene", "Type 0", "Phosgene"),
    ("TDI", "Type 0", "Toluene diisocyanate"),
    ("Methanol", "Type 1", "Methanol"),
    ("PO", "Type 1", "Propylene oxide"),
    ("Styrene", "Type 1", "Styrene"),
    ("EEA", "Type 1", "Ethylene glycol monoethyl ether acetate"),
    ("EE", "Type 1", "Ethylene glycol monoethyl ether"),
    ("EG", "Type 1", "Ethylene glycol"),
    ("EO", "Type 1", "Ethylene oxide"),
]

# For Django choices (value, display_label)
REPRESENTATIVE_FLUIDS = [
    (item[0], f"{item[0]} ({item[2]})")
    for item in REPRESENTATIVE_FLUIDS_DATA
]

# Helper function to get fluid type by code
def get_fluid_type(fluid_code):
    """Returns the fluid type (Type 0 or Type 1) for a given fluid code"""
    for item in REPRESENTATIVE_FLUIDS_DATA:
        if item[0] == fluid_code:
            return item[1]
    return None

# Helper function to get all fluid properties
def get_fluid_properties(fluid_code):
    """Returns a dictionary with all properties for a given fluid code"""
    for item in REPRESENTATIVE_FLUIDS_DATA:
        if item[0] == fluid_code:
            return {
                'code': item[0],
                'type': item[1],
                'examples': item[2]
            }
    return None
