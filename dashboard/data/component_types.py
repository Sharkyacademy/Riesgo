"""
Component Types and GFF (Generic Failure Frequency) Data
Based on API 581 Table 3.1
"""

# Structure: (component_type, label, equipment_type)
COMPONENT_TYPES_DATA = [
    ("COMPC", "Compressor - Centrifugal (COMPC)", "Compressor"),
    ("COMPR", "Compressor - Reciprocating (COMPR)", "Compressor"),
    ("HEXSS, HEXTS", "Heat Exchanger (HEXSS, HEXTS)", "Heat exchanger"),
    ("PIPE-1, PIPE-2", "Pipe - 1, 2 inch (PIPE-1, PIPE-2)", "Pipe"),
    ("PIPE-4, PIPE-6", "Pipe - 4, 6 inch (PIPE-4, PIPE-6)", "Pipe"),
    ("PIPE-8+", "Pipe - 8, 10, 12, 16, >16 inch", "Pipe"),
    ("PUMP2S, PUMPR, PUMP1S", "Pump (PUMP2S, PUMPR, PUMP1S)", "Pump"),
    ("TANKBOTTOM", "Tank620 - Bottom (TANKBOTTOM)", "Tank620"),
    ("TANKBOTEDGE", "Tank620 - Bottom Edge (TANKBOTEDGE)", "Tank620"),
    ("COURSE-1-10", "Tank620 - Course 1-10", "Tank620"),
    ("TANKBOTTOM", "Tank650 - Bottom (TANKBOTTOM)", "Tank650"),
    ("TANKBOTEDGE", "Tank650 - Bottom Edge (TANKBOTEDGE)", "Tank650"),
    ("COURSE-1-10", "Tank650 - Course 1-10", "Tank650"),
    ("FINFAN TUBES, HEADER", "FinFan (Tubes, Header)", "FinFan"),
    ("Drum, Reactor, Column", "Vessel (Drum, Reactor, Column, Filter)", "Vessel"),
]

# For Django choices (value, display_label)
COMPONENT_TYPES = [
    (item[0], item[1])
    for item in COMPONENT_TYPES_DATA
]

# Helper to get equipment type by component type
def get_equipment_type(component_type):
    """Returns the equipment type for a given component type"""
    for item in COMPONENT_TYPES_DATA:
        if item[0] == component_type:
            return item[2]
    return None
