
const ComponentGFFs = [
    {
        equipmentType: "Compressor",
        componentType: "COMPC",
        label: "Compressor - Centrifugal (COMPC)",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 2.00E-06, rupture: 0 },
        gffTotal: 3.00E-05
    },
    {
        equipmentType: "Compressor",
        componentType: "COMPR",
        label: "Compressor - Reciprocating (COMPR)",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 2.00E-06, rupture: 6.00E-07 },
        gffTotal: 3.06E-05
    },
    {
        equipmentType: "Heat exchanger",
        componentType: "HEXSS, HEXTS",
        label: "Heat Exchanger (HEXSS, HEXTS)",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 2.00E-06, rupture: 6.00E-07 },
        gffTotal: 3.06E-05
    },
    {
        equipmentType: "Pipe",
        componentType: "PIPE-1, PIPE-2",
        label: "Pipe - 1, 2 inch (PIPE-1, PIPE-2)",
        gff: { small: 2.80E-05, medium: 0, large: 0, rupture: 2.60E-06 },
        gffTotal: 3.06E-05
    },
    {
        equipmentType: "Pipe",
        componentType: "PIPE-4, PIPE-6",
        label: "Pipe - 4, 6 inch (PIPE-4, PIPE-6)",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 0, rupture: 2.60E-06 },
        gffTotal: 3.06E-05
    },
    {
        equipmentType: "Pipe",
        componentType: "PIPE-8+",
        label: "Pipe - 8, 10, 12, 16, >16 inch",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 2.00E-06, rupture: 6.00E-07 },
        gffTotal: 3.06E-05
    },
    {
        equipmentType: "Pump",
        componentType: "PUMP2S, PUMPR, PUMP1S",
        label: "Pump (PUMP2S, PUMPR, PUMP1S)",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 2.00E-06, rupture: 6.00E-07 },
        gffTotal: 3.06E-05
    },
    {
        equipmentType: "Tank620",
        componentType: "TANKBOTTOM",
        label: "Tank620 - Bottom (TANKBOTTOM)",
        gff: { small: 7.20E-04, medium: 0, large: 0, rupture: 2.00E-06 },
        gffTotal: 7.22E-04
    },
    {
        equipmentType: "Tank620",
        componentType: "TANKBOTEDGE",
        label: "Tank620 - Bottom Edge (TANKBOTEDGE)",
        gff: { small: 7.20E-04, medium: 0, large: 0, rupture: 2.00E-06 },
        gffTotal: 7.22E-04
    },
    {
        equipmentType: "Tank620",
        componentType: "COURSE-1-10",
        label: "Tank620 - Course 1-10",
        gff: { small: 7.00E-05, medium: 2.50E-05, large: 5.00E-06, rupture: 1.00E-07 },
        gffTotal: 1.00E-04
    },
    {
        equipmentType: "Tank650",
        componentType: "TANKBOTTOM",
        label: "Tank650 - Bottom (TANKBOTTOM)",
        gff: { small: 7.20E-04, medium: 0, large: 0, rupture: 2.00E-06 },
        gffTotal: 7.22E-04
    },
    {
        equipmentType: "Tank650",
        componentType: "TANKBOTEDGE",
        label: "Tank650 - Bottom Edge (TANKBOTEDGE)",
        gff: { small: 7.20E-04, medium: 0, large: 0, rupture: 2.00E-06 },
        gffTotal: 7.22E-04
    },
    {
        equipmentType: "Tank650",
        componentType: "COURSE-1-10",
        label: "Tank650 - Course 1-10",
        gff: { small: 7.00E-05, medium: 2.50E-05, large: 5.00E-06, rupture: 1.00E-07 },
        gffTotal: 1.00E-04
    },
    {
        equipmentType: "FinFan",
        componentType: "FINFAN TUBES, HEADER",
        label: "FinFan (Tubes, Header)",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 2.00E-06, rupture: 6.00E-07 },
        gffTotal: 3.06E-05
    },
    {
        equipmentType: "Vessel",
        componentType: "Drum, Reactor, Column",
        label: "Vessel (Drum, Reactor, Column, Filter)",
        gff: { small: 8.00E-06, medium: 2.00E-05, large: 2.00E-06, rupture: 6.00E-07 },
        gffTotal: 3.06E-05
    }
];

export default ComponentGFFs;
