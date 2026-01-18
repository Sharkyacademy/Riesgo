export const ComponentCostData = {
    "COMPC": { small: 10000, medium: 20000, large: 100000, rupture: 300000 },
    "COMPR": { small: 5000, medium: 10000, large: 50000, rupture: 100000 },
    "HEXSS": { small: 1000, medium: 2000, large: 20000, rupture: 60000 },
    "HEXTS": { small: 1000, medium: 2000, large: 20000, rupture: 60000 },
    "HEXTUBE": { small: 1000, medium: 2000, large: 20000, rupture: 60000 },
    "PIPE-1": { small: 5, medium: 0, large: 0, rupture: 20 },
    "PIPE-2": { small: 5, medium: 0, large: 0, rupture: 40 },
    "PIPE-4": { small: 5, medium: 10, large: 0, rupture: 60 },
    "PIPE-6": { small: 5, medium: 20, large: 0, rupture: 120 },
    "PIPE-8": { small: 5, medium: 30, large: 60, rupture: 180 },
    "PIPE-10": { small: 5, medium: 40, large: 80, rupture: 240 },
    "PIPE-12": { small: 5, medium: 60, large: 120, rupture: 360 },
    "PIPE-16": { small: 5, medium: 80, large: 160, rupture: 500 },
    "PIPEGT16": { small: 10, medium: 120, large: 240, rupture: 700 },
    "PUMP2S": { small: 1000, medium: 2500, large: 5000, rupture: 5000 },
    "PUMP1S": { small: 1000, medium: 2500, large: 5000, rupture: 5000 },
    "PUMPR": { small: 1000, medium: 2500, large: 5000, rupture: 10000 },
    "TANKBOTTOM": { small: 5000, medium: 0, large: 0, rupture: 120000 },
    "TANKBOTEDGE": { small: 5000, medium: 0, large: 0, rupture: 120000 },
    "COURSES-10": { small: 5000, medium: 12000, large: 20000, rupture: 40000 },
    "FINFAN_TUBE": { small: 1000, medium: 2000, large: 20000, rupture: 60000 },
    "FINFAN_HEADER": { small: 1000, medium: 2000, large: 20000, rupture: 60000 },
    "KODRUM": { small: 5000, medium: 12000, large: 20000, rupture: 40000 },
    "DRUM": { small: 5000, medium: 12000, large: 20000, rupture: 40000 },
    "FILTER": { small: 1000, medium: 2000, large: 4000, rupture: 10000 },
    "REACTOR": { small: 10000, medium: 24000, large: 40000, rupture: 80000 },
    "COLTOP": { small: 10000, medium: 25000, large: 50000, rupture: 100000 },
    "COLMID": { small: 10000, medium: 25000, large: 50000, rupture: 100000 },
    "COLBTM": { small: 10000, medium: 25000, large: 50000, rupture: 100000 }
};

export const MaterialCostFactors = {
    "Carbon Steel": 1.0,
    "Organic coatings (< 80 mil)": 1.2,
    "1.25Cr-0.5Mo": 1.3,
    "2.25Cr-1Mo": 1.7,
    "5Cr-0.5Mo": 1.7,
    "7Cr-0.5Mo": 2.0,
    "Clad 304 SS": 2.1,
    "Fiberglass": 2.5,
    "PP lined": 2.5,
    "9Cr-1Mo": 2.6,
    "405 SS": 2.8,
    "410 SS": 2.8,
    "304 SS": 3.2,
    "Clad 316 SS": 3.3,
    "Strip lined alloy": 3.3,
    "Organic coating (> 80 mil)": 3.4,
    "CS saran lined": 3.4,
    "CS rubber lined": 4.4,
    "316 SS": 4.8,
    "CS glass lined": 5.8,
    "Clad Alloy 400": 6.4,
    "90/10 Cu/Ni": 6.8,
    "Clad Alloy 600": 7.0,
    "CS PTFE lined": 7.8,
    "Clad nickel": 8.0,
    "Alloy 800": 8.4,
    "70/30 Cu/Ni": 8.5,
    "904L": 8.8,
    "Alloy 20": 11,
    "Alloy 400": 15,
    "Alloy 600": 15,
    "Nickel": 18,
    "Acid brick": 20,
    "Refractory": 20,
    "Alloy 625": 26,
    "Titanium": 28,
    "Alloy C": 29,
    "Zirconium": 34,
    "Alloy B": 36,
    "Tantalum": 535
};

// API 581 Table 4.17 - Estimated Equipment Outage (Days) based on Hole Size
export const ComponentOutageData = {
    // Compressor
    "COMPC": { small: 0, medium: 3, large: 7, rupture: 0 },
    "COMPR": { small: 0, medium: 3, large: 7, rupture: 0 },

    // Heat Exchanger
    "HEXSS": { small: 2, medium: 3, large: 3, rupture: 10 },
    "HEXTS": { small: 2, medium: 3, large: 3, rupture: 10 },
    "HEXTUBE": { small: 0, medium: 0, large: 0, rupture: 0 },

    // Pipe
    "PIPE-1": { small: 0, medium: 0, large: 0, rupture: 1 },
    "PIPE-2": { small: 0, medium: 0, large: 0, rupture: 1 },
    "PIPE-4": { small: 0, medium: 1, large: 0, rupture: 2 },
    "PIPE-6": { small: 0, medium: 1, large: 2, rupture: 3 },
    "PIPE-8": { small: 0, medium: 2, large: 2, rupture: 3 },
    "PIPE-10": { small: 0, medium: 2, large: 2, rupture: 4 },
    "PIPE-12": { small: 1, medium: 3, large: 4, rupture: 4 },
    "PIPE-16": { small: 1, medium: 3, large: 4, rupture: 5 },
    "PIPEGT16": { small: 1, medium: 4, large: 5, rupture: 7 },

    // Pump
    "PUMP2S": { small: 0, medium: 0, large: 0, rupture: 0 },
    "PUMPR": { small: 0, medium: 0, large: 0, rupture: 0 },
    "PUMP1S": { small: 0, medium: 0, large: 0, rupture: 0 },

    // Tank
    "TANKBOTTOM": { small: 5, medium: 0, large: 0, rupture: 50 },
    "TANKBOTEDGE": { small: 5, medium: 0, large: 0, rupture: 50 },
    "COURSES-10": { small: 2, medium: 3, large: 3, rupture: 14 },
    // Specific keys for different courses if needed, but using generic
    "COURSE-1": { small: 2, medium: 3, large: 3, rupture: 14 },
    "COURSE-9": { small: 2, medium: 3, large: 3, rupture: 14 },

    // FINFAN
    "FINFAN_TUBE": { small: 0, medium: 0, large: 0, rupture: 1 },
    "FINFAN HEADER": { small: 0, medium: 0, large: 2, rupture: 3 },

    // Vessel/Drum/Reactor
    "KODRUM": { small: 2, medium: 3, large: 3, rupture: 10 },
    "FILTER": { small: 0, medium: 1, large: 2, rupture: 3 },
    "DRUM": { small: 2, medium: 3, large: 3, rupture: 10 },
    "REACTOR": { small: 4, medium: 6, large: 6, rupture: 21 },
    "COLTOP": { small: 3, medium: 4, large: 5, rupture: 21 },
    "COLMID": { small: 3, medium: 4, large: 5, rupture: 21 },
    "COLBTM": { small: 3, medium: 4, large: 5, rupture: 21 }
};
