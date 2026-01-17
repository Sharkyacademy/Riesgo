
export const ComponentDamageConstants = {
    "C1-C2": {
        type: 0,
        AINL_CONT: { Gas: { a: 43.0, b: 0.98 }, Liquid: null },
        AIL_CONT: { Gas: { a: 280.0, b: 0.95 }, Liquid: null },
        AINL_INST: { Gas: { a: 41.0, b: 0.67 }, Liquid: null },
        AIL_INST: { Gas: { a: 1079, b: 0.62 }, Liquid: null }
    },
    "C3-C4": {
        type: 0,
        AINL_CONT: { Gas: { a: 49.48, b: 1.00 }, Liquid: null },
        AIL_CONT: { Gas: { a: 313.6, b: 1.00 }, Liquid: null },
        AINL_INST: { Gas: { a: 27.96, b: 0.72 }, Liquid: null },
        AIL_INST: { Gas: { a: 522.9, b: 0.63 }, Liquid: null }
    },
    "C5": {
        type: 0,
        AINL_CONT: { Gas: { a: 25.17, b: 0.99 }, Liquid: { a: 536.0, b: 0.89 } },
        AIL_CONT: { Gas: { a: 304.7, b: 1.00 }, Liquid: null },
        AINL_INST: { Gas: { a: 13.38, b: 0.73 }, Liquid: { a: 1.49, b: 0.85 } },
        AIL_INST: { Gas: { a: 275.0, b: 0.61 }, Liquid: null }
    },
    "C6-C8": {
        type: 0,
        AINL_CONT: { Gas: { a: 29.0, b: 0.98 }, Liquid: { a: 182.0, b: 0.89 } },
        AIL_CONT: { Gas: { a: 312.4, b: 1.00 }, Liquid: { a: 525.0, b: 0.95 } },
        AINL_INST: { Gas: { a: 13.98, b: 0.66 }, Liquid: { a: 4.35, b: 0.78 } },
        AIL_INST: { Gas: { a: 275.7, b: 0.61 }, Liquid: { a: 57.0, b: 0.55 } }
    },
    "C9-C12": {
        type: 0,
        AINL_CONT: { Gas: { a: 12.0, b: 0.98 }, Liquid: { a: 130.0, b: 0.90 } },
        AIL_CONT: { Gas: { a: 391.0, b: 0.95 }, Liquid: { a: 560.0, b: 0.95 } },
        AINL_INST: { Gas: { a: 7.1, b: 0.66 }, Liquid: { a: 3.3, b: 0.76 } },
        AIL_INST: { Gas: { a: 281.0, b: 0.61 }, Liquid: { a: 6.0, b: 0.53 } }
    },
    "C13-C16": {
        type: 0,
        AINL_CONT: { Gas: null, Liquid: { a: 64.0, b: 0.90 } },
        AIL_CONT: { Gas: null, Liquid: { a: 1023, b: 0.92 } },
        AINL_INST: { Gas: null, Liquid: { a: 0.46, b: 0.88 } },
        AIL_INST: { Gas: null, Liquid: { a: 9.2, b: 0.88 } }
    },
    "C17-C25": {
        type: 0,
        AINL_CONT: { Gas: null, Liquid: { a: 20.0, b: 0.90 } },
        AIL_CONT: { Gas: null, Liquid: { a: 861.0, b: 0.92 } },
        AINL_INST: { Gas: null, Liquid: { a: 0.11, b: 0.91 } },
        AIL_INST: { Gas: null, Liquid: { a: 5.6, b: 0.91 } }
    },
    "C25+": {
        type: 0,
        AINL_CONT: { Gas: null, Liquid: { a: 11.0, b: 0.91 } },
        AIL_CONT: { Gas: null, Liquid: { a: 544.0, b: 0.90 } },
        AINL_INST: { Gas: null, Liquid: { a: 0.03, b: 0.99 } },
        AIL_INST: { Gas: null, Liquid: { a: 1.4, b: 0.99 } }
    },
    "Pyrophoric": {
        type: 1,
        AINL_CONT: { Gas: { a: 12.0, b: 0.98 }, Liquid: { a: 130.0, b: 0.90 } },
        AIL_CONT: { Gas: { a: 391.0, b: 0.95 }, Liquid: { a: 560.0, b: 0.95 } },
        AINL_INST: { Gas: { a: 7.1, b: 0.66 }, Liquid: { a: 3.3, b: 0.76 } },
        AIL_INST: { Gas: { a: 281.0, b: 0.61 }, Liquid: { a: 6.0, b: 0.53 } }
    },
    "Aromatics": {
        type: 1,
        AINL_CONT: { Gas: { a: 17.87, b: 1.097 }, Liquid: { a: 103.0, b: 0 } },
        AIL_CONT: { Gas: { a: 374.5, b: 1.055 }, Liquid: null },
        AINL_INST: { Gas: { a: 11.46, b: 0.667 }, Liquid: { a: 70.12, b: 0 } },
        AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 701.2, b: 0 } }
    },
    "Styrene": {
        type: 1,
        AINL_CONT: { Gas: { a: 17.87, b: 1.097 }, Liquid: { a: 103.0, b: 0 } },
        AIL_CONT: { Gas: { a: 374.5, b: 1.055 }, Liquid: null },
        AINL_INST: { Gas: { a: 11.46, b: 0.667 }, Liquid: { a: 70.12, b: 0 } },
        AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 701.2, b: 0 } }
    },
    "Methanol": {
        type: 1,
        AINL_CONT: { Gas: { a: 0.02256, b: 0.9092 }, Liquid: { a: 1750.6, b: 0.9342 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 28.1170, b: 0.6670 }, Liquid: { a: 1.9188, b: 0.9004 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "H2": {
        type: 0,
        AINL_CONT: { Gas: { a: 64.5, b: 0.992 }, Liquid: null },
        AIL_CONT: { Gas: { a: 420.0, b: 1.00 }, Liquid: null },
        AINL_INST: { Gas: { a: 61.5, b: 0.657 }, Liquid: null },
        AIL_INST: { Gas: { a: 1430, b: 0.618 }, Liquid: null }
    },
    "H2S": {
        type: 0,
        AINL_CONT: { Gas: { a: 32.0, b: 1.00 }, Liquid: null },
        AIL_CONT: { Gas: { a: 203.0, b: 0.89 }, Liquid: null },
        AINL_INST: { Gas: { a: 148.0, b: 0.63 }, Liquid: null },
        AIL_INST: { Gas: { a: 357.0, b: 0.61 }, Liquid: null }
    },
    "CO": {
        type: 1,
        AINL_CONT: { Gas: { a: 0.107, b: 1.752 }, Liquid: null },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 69.68, b: 0.667 }, Liquid: null },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "DEE": {
        type: 1,
        AINL_CONT: { Gas: { a: 39.84, b: 1.134 }, Liquid: { a: 737.4, b: 1.106 } },
        AIL_CONT: { Gas: { a: 320.7, b: 1.033 }, Liquid: { a: 6289, b: 0.649 } },
        AINL_INST: { Gas: { a: 155.7, b: 0.667 }, Liquid: { a: 5.105, b: 0.919 } },
        AIL_INST: { Gas: null, Liquid: { a: 5.672, b: 0.919 } }
    },
    "PO": {
        type: 1,
        AINL_CONT: { Gas: { a: 14.61, b: 1.114 }, Liquid: { a: 1295, b: 0.9560 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 65.58, b: 0.667 }, Liquid: { a: 3.404, b: 0.869 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EEA": {
        type: 1,
        AINL_CONT: { Gas: { a: 0.002, b: 1.035 }, Liquid: { a: 117.0, b: 0 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 8.014, b: 0.667 }, Liquid: { a: 69.0, b: 0 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EE": {
        type: 1,
        AINL_CONT: { Gas: { a: 12.62, b: 1.005 }, Liquid: { a: 173.1, b: 0 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 38.87, b: 0.667 }, Liquid: { a: 72.21, b: 0 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EG": {
        type: 1,
        AINL_CONT: { Gas: { a: 7.721, b: 0.973 }, Liquid: { a: 108.0, b: 0 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 6.525, b: 0.667 }, Liquid: { a: 69.0, b: 0 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EO": {
        type: 1,
        AINL_CONT: { Gas: { a: 31.03, b: 1.069 }, Liquid: null },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 136.3, b: 0.667 }, Liquid: null },
        AIL_INST: { Gas: null, Liquid: null }
    }
};

export const PersonnelInjuryConstants = {
    "C1-C2": {
        type: 0,
        AINL_CONT: { Gas: { a: 110.0, b: 0.96 }, Liquid: null },
        AIL_CONT: { Gas: { a: 745.0, b: 0.92 }, Liquid: null },
        AINL_INST: { Gas: { a: 79.0, b: 0.67 }, Liquid: null },
        AIL_INST: { Gas: { a: 3100, b: 0.63 }, Liquid: null }
    },
    "C3-C4": {
        type: 0,
        AINL_CONT: { Gas: { a: 125.2, b: 1.00 }, Liquid: null },
        AIL_CONT: { Gas: { a: 836.7, b: 1.00 }, Liquid: null },
        AINL_INST: { Gas: { a: 57.72, b: 0.75 }, Liquid: null },
        AIL_INST: { Gas: { a: 1769, b: 0.63 }, Liquid: null }
    },
    "C5": {
        type: 0,
        AINL_CONT: { Gas: { a: 62.05, b: 1.00 }, Liquid: { a: 1545, b: 0.89 } },
        AIL_CONT: { Gas: { a: 811.0, b: 1.00 }, Liquid: null },
        AINL_INST: { Gas: { a: 28.45, b: 0.76 }, Liquid: { a: 4.34, b: 0.85 } },
        AIL_INST: { Gas: { a: 959.6, b: 0.63 }, Liquid: null }
    },
    "C6-C8": {
        type: 0,
        AINL_CONT: { Gas: { a: 68.0, b: 0.96 }, Liquid: { a: 516.0, b: 0.89 } },
        AIL_CONT: { Gas: { a: 828.7, b: 1.00 }, Liquid: { a: 1315, b: 0.92 } },
        AINL_INST: { Gas: { a: 26.72, b: 0.67 }, Liquid: { a: 12.7, b: 0.78 } },
        AIL_INST: { Gas: { a: 962.8, b: 0.63 }, Liquid: { a: 224.0, b: 0.54 } }
    },
    "C9-C12": {
        type: 0,
        AINL_CONT: { Gas: { a: 29.0, b: 0.96 }, Liquid: { a: 373.0, b: 0.89 } },
        AIL_CONT: { Gas: { a: 981.0, b: 0.92 }, Liquid: { a: 1401, b: 0.92 } },
        AINL_INST: { Gas: { a: 13.0, b: 0.66 }, Liquid: { a: 9.5, b: 0.76 } },
        AIL_INST: { Gas: { a: 988.0, b: 0.63 }, Liquid: { a: 20.0, b: 0.54 } }
    },
    "C13-C16": {
        type: 0,
        AINL_CONT: { Gas: null, Liquid: { a: 183.0, b: 0.89 } },
        AIL_CONT: { Gas: null, Liquid: { a: 2850, b: 0.90 } },
        AINL_INST: { Gas: null, Liquid: { a: 1.3, b: 0.88 } },
        AIL_INST: { Gas: null, Liquid: { a: 26.0, b: 0.88 } }
    },
    "C17-C25": {
        type: 0,
        AINL_CONT: { Gas: null, Liquid: { a: 57.0, b: 0.89 } },
        AIL_CONT: { Gas: null, Liquid: { a: 2420, b: 0.90 } },
        AINL_INST: { Gas: null, Liquid: { a: 0.32, b: 0.91 } },
        AIL_INST: { Gas: null, Liquid: { a: 16.0, b: 0.91 } }
    },
    "C25+": {
        type: 0,
        AINL_CONT: { Gas: null, Liquid: { a: 33.0, b: 0.89 } },
        AIL_CONT: { Gas: null, Liquid: { a: 1604, b: 0.90 } },
        AINL_INST: { Gas: null, Liquid: { a: 0.081, b: 0.99 } },
        AIL_INST: { Gas: null, Liquid: { a: 4.1, b: 0.99 } }
    },
    "Pyrophoric": {
        type: 1,
        AINL_CONT: { Gas: { a: 29.0, b: 0.96 }, Liquid: { a: 373.0, b: 0.89 } },
        AIL_CONT: { Gas: { a: 981.0, b: 0.92 }, Liquid: { a: 1401, b: 0.92 } },
        AINL_INST: { Gas: { a: 13.0, b: 0.66 }, Liquid: { a: 9.5, b: 0.76 } },
        AIL_INST: { Gas: { a: 988.0, b: 0.63 }, Liquid: { a: 20.0, b: 0.54 } }
    },
    "Aromatics": {
        type: 1,
        AINL_CONT: { Gas: { a: 64.14, b: 0.963 }, Liquid: { a: 353.5, b: 0.883 } },
        AIL_CONT: { Gas: { a: 1344, b: 0.937 }, Liquid: { a: 487.7, b: 0.268 } },
        AINL_INST: { Gas: { a: 18.08, b: 0.686 }, Liquid: { a: 0.14, b: 0.935 } },
        AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 1.404, b: 0.935 } }
    },
    "Styrene": {
        type: 1,
        AINL_CONT: { Gas: { a: 64.14, b: 0.963 }, Liquid: { a: 353.5, b: 0.883 } },
        AIL_CONT: { Gas: { a: 1344, b: 0.937 }, Liquid: { a: 487.7, b: 0.268 } },
        AINL_INST: { Gas: { a: 18.08, b: 0.686 }, Liquid: { a: 0.14, b: 0.935 } },
        AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 1.404, b: 0.935 } }
    },
    "Methanol": {
        type: 1,
        AINL_CONT: { Gas: { a: 0.0164, b: 1.0083 }, Liquid: { a: 4483.7, b: 0.9015 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 37.71, b: 0.6878 }, Liquid: { a: 6.2552, b: 0.8705 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "H2": {
        type: 0,
        AINL_CONT: { Gas: { a: 165.0, b: 0.933 }, Liquid: null },
        AIL_CONT: { Gas: { a: 1117, b: 1.00 }, Liquid: null },
        AINL_INST: { Gas: { a: 118.5, b: 0.652 }, Liquid: null },
        AIL_INST: { Gas: { a: 4193, b: 0.621 }, Liquid: null }
    },
    "H2S": {
        type: 0,
        AINL_CONT: { Gas: { a: 52.0, b: 1.00 }, Liquid: null },
        AIL_CONT: { Gas: { a: 375.0, b: 0.94 }, Liquid: null },
        AINL_INST: { Gas: { a: 271.0, b: 0.63 }, Liquid: null },
        AIL_INST: { Gas: { a: 1253, b: 0.63 }, Liquid: null }
    },
    "CO": {
        type: 1,
        AINL_CONT: { Gas: { a: 27.0, b: 0.991 }, Liquid: null },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 105.3, b: 0.692 }, Liquid: null },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "DEE": {
        type: 1,
        AINL_CONT: { Gas: { a: 128.1, b: 1.025 }, Liquid: { a: 971.9, b: 1.219 } },
        AIL_CONT: { Gas: { a: 1182, b: 0.997 }, Liquid: { a: 2658, b: 0.864 } },
        AINL_INST: { Gas: { a: 199.1, b: 0.682 }, Liquid: { a: 47.13, b: 0.814 } },
        AIL_INST: { Gas: { a: 821.7, b: 0.657 }, Liquid: { a: 52.36, b: 0.814 } }
    },
    "PO": {
        type: 1,
        AINL_CONT: { Gas: { a: 38.76, b: 1.047 }, Liquid: { a: 1955, b: 0.840 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 83.68, b: 0.682 }, Liquid: { a: 15.21, b: 0.834 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EEA": {
        type: 1,
        AINL_CONT: { Gas: { a: 0.017, b: 0.946 }, Liquid: { a: 443.1, b: 0.835 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 11.41, b: 0.687 }, Liquid: { a: 0.153, b: 0.924 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EE": {
        type: 1,
        AINL_CONT: { Gas: { a: 35.56, b: 0.969 }, Liquid: { a: 46.56, b: 0.800 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 162.0, b: 0.660 }, Liquid: { a: 0.152, b: 0.927 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EG": {
        type: 1,
        AINL_CONT: { Gas: { a: 25.67, b: 0.947 }, Liquid: { a: 324.7, b: 0.869 } },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 8.971, b: 0.687 }, Liquid: { a: 0.138, b: 0.922 } },
        AIL_INST: { Gas: null, Liquid: null }
    },
    "EO": {
        type: 1,
        AINL_CONT: { Gas: { a: 49.43, b: 1.105 }, Liquid: null },
        AIL_CONT: { Gas: null, Liquid: null },
        AINL_INST: { Gas: { a: 220.8, b: 0.665 }, Liquid: null },
        AIL_INST: { Gas: null, Liquid: null }
    }
};

export const MitigationSystems = {
    "None": { factor: 0.0, label: "No mitigation system" },
    "InventoryBlowdown": { factor: 0.25, label: "Inventory blowdown (Class B or higher)" },
    "FireWaterDeluge": { factor: 0.20, label: "Fire water deluge system and monitors" },
    "FireWaterMonitors": { factor: 0.05, label: "Fire water monitors only" },
    "FoamSpray": { factor: 0.15, label: "Foam spray system" }
};

export const ToxicGasConstants = {
    "HF": {
        idlh: 30,
        continuous: [
            { min: 5, c: 1.1401, d: 3.5683 },
            { min: 10, c: 1.1031, d: 3.8431 },
            { min: 20, c: 1.0816, d: 4.1040 },
            { min: 40, c: 1.0942, d: 4.3295 },
            { min: 60, c: 1.1031, d: 4.4576 }
        ],
        instantaneous: { c: 1.4056, d: 0.33606 }
    },
    "H2S": {
        idlh: 100,
        continuous: [
            { min: 5, c: 1.2411, d: 3.9686 },
            { min: 10, c: 1.2410, d: 4.0948 },
            { min: 20, c: 1.2370, d: 4.238 },
            { min: 40, c: 1.2297, d: 4.3626 },
            { min: 60, c: 1.2266, d: 4.4365 }
        ],
        instantaneous: { c: 0.9674, d: 2.7840 }
    },
    "Ammonia": {
        idlh: 300,
        continuous: [
            { min: 5, e: 2690, f: 1.183 },
            { min: 10, e: 3581, f: 1.181 },
            { min: 15, e: 4459, f: 1.180 },
            { min: 20, e: 5326, f: 1.178 },
            { min: 25, e: 6180, f: 1.176 },
            { min: 30, e: 7022, f: 1.174 },
            { min: 35, e: 7852, f: 1.172 },
            { min: 40, e: 8669, f: 1.169 },
            { min: 45, e: 9475, f: 1.166 },
            { min: 50, e: 10268, f: 1.161 },
            { min: 55, e: 11049, f: 1.155 },
            { min: 60, e: 11817, f: 1.145 }
        ],
        instantaneous: { e: 14.171, f: 0.9011 }
    },
    "Chlorine": {
        idlh: 10,
        continuous: [
            { min: 5, e: 15150, f: 1.097 },
            { min: 10, e: 15934, f: 1.095 },
            { min: 15, e: 17242, f: 1.092 },
            { min: 20, e: 19074, f: 1.089 },
            { min: 25, e: 21430, f: 1.085 },
            { min: 30, e: 24309, f: 1.082 },
            { min: 35, e: 27712, f: 1.077 },
            { min: 40, e: 31640, f: 1.072 },
            { min: 45, e: 36090, f: 1.066 },
            { min: 50, e: 41065, f: 1.057 },
            { min: 55, e: 46564, f: 1.046 },
            { min: 60, e: 52586, f: 1.026 }
        ],
        instantaneous: { e: 14.976, f: 1.177 }
    },
    // Table 4.13 Miscellaneous Chemicals
    "AlCl3": {
        continuous: { gas: { e: 17.663, f: 0.9411 } }
    },
    "CO": {
        idlh: 1200,
        continuous: [
            { min: 3, e: 41.412, f: 1.15 },
            { min: 5, e: 279.79, f: 1.06 },
            { min: 10, e: 834.48, f: 1.13 },
            { min: 20, e: 2915.9, f: 1.11 },
            { min: 40, e: 5346.8, f: 1.17 },
            { min: 60, e: 6293.7, f: 1.21 }
        ]
    },
    "HCl": {
        idlh: 50,
        continuous: [
            { min: 3, e: 215.48, f: 1.09 },
            { min: 5, e: 536.28, f: 1.15 },
            { min: 10, e: 2397.5, f: 1.10 },
            { min: 20, e: 4027.0, f: 1.18 },
            { min: 40, e: 7534.5, f: 1.20 },
            { min: 60, e: 8625.1, f: 1.23 }
        ]
    },
    "Nitric acid": {
        continuous: [
            { min: 3, gas: { e: 53013, f: 1.25 }, liquid: { e: 5110.0, f: 1.08 } },
            { min: 5, gas: { e: 68700, f: 1.25 }, liquid: { e: 9640.8, f: 1.02 } },
            { min: 10, gas: { e: 96325, f: 1.24 }, liquid: { e: 12453, f: 1.06 } },
            { min: 20, gas: { e: 126942, f: 1.23 }, liquid: { e: 19149, f: 1.06 } },
            { min: 40, gas: { e: 146941, f: 1.22 }, liquid: { e: 31145, f: 1.06 } },
            { min: 60, gas: { e: 156345, f: 1.22 }, liquid: { e: 41999, f: 1.12 } }
        ]
    },
    "NO2": {
        idlh: 20,
        continuous: [
            { min: 3, gas: { e: 6633.1, f: 0.70 }, liquid: { e: 2132.9, f: 0.98 } },
            { min: 5, gas: { e: 9221.4, f: 0.68 }, liquid: { e: 2887.0, f: 1.04 } },
            { min: 10, gas: { e: 11965, f: 0.68 }, liquid: { e: 6194.4, f: 1.07 } },
            { min: 20, gas: { e: 14248, f: 0.72 }, liquid: { e: 13843, f: 1.08 } },
            { min: 40, gas: { e: 22411, f: 0.70 }, liquid: { e: 27134, f: 1.12 } },
            { min: 60, gas: { e: 24994, f: 0.71 }, liquid: { e: 41657, f: 1.13 } }
        ]
    },
    "Phosgene": {
        idlh: 2,
        continuous: [
            { min: 3, gas: { e: 12902, f: 1.20 }, liquid: { e: 3414.8, f: 1.06 } },
            { min: 5, gas: { e: 22976, f: 1.29 }, liquid: { e: 6857.1, f: 1.10 } },
            { min: 10, gas: { e: 48985, f: 1.24 }, liquid: { e: 21215, f: 1.12 } },
            { min: 20, gas: { e: 108298, f: 1.27 }, liquid: { e: 63361, f: 1.16 } },
            { min: 40, gas: { e: 244670, f: 1.30 }, liquid: { e: 178841, f: 1.20 } },
            { min: 60, gas: { e: 367877, f: 1.31 }, liquid: { e: 314608, f: 1.23 } }
        ]
    },
    "TDI": {
        continuous: [
            { min: 3, liquid: { e: 3692.5, f: 1.06 } },
            { min: 5, liquid: { e: 3849.2, f: 1.09 } },
            { min: 10, liquid: { e: 4564.9, f: 1.10 } },
            { min: 20, liquid: { e: 4777.5, f: 1.06 } },
            { min: 40, liquid: { e: 4953.2, f: 1.06 } },
            { min: 60, liquid: { e: 5972.1, f: 1.03 } }
        ]
    },
    "EE": {
        continuous: [
            { min: 1.5, gas: { e: 3.819, f: 1.171 } },
            { min: 3, gas: { e: 7.438, f: 1.181 } },
            { min: 5, gas: { e: 17.735, f: 1.122 } },
            { min: 10, gas: { e: 33.721, f: 1.111 }, liquid: { e: 3.081, f: 1.105 } },
            { min: 20, gas: { e: 122.68, f: 0.971 }, liquid: { e: 16.877, f: 1.065 } },
            { min: 40, gas: { e: 153.03, f: 0.995 }, liquid: { e: 43.292, f: 1.132 } },
            { min: 60, gas: { e: 315.57, f: 0.899 }, liquid: { e: 105.74, f: 1.104 } }
        ]
    },
    "EO": {
        idlh: 800,
        continuous: [
            { min: 1.5, gas: { e: 2.083, f: 1.222 } },
            { min: 3, gas: { e: 12.32, f: 1.207 } },
            { min: 5, gas: { e: 31.5, f: 1.271 } },
            { min: 10, gas: { e: 185, f: 1.2909 } },
            { min: 20, gas: { e: 926, f: 1.2849 } },
            { min: 40, gas: { e: 4563, f: 1.1927 } },
            { min: 60, gas: { e: 7350, f: 1.203 } }
        ]
    },
    "PO": {
        idlh: 400,
        continuous: [
            { min: 3, gas: { e: 0.0019, f: 1.913 } },
            { min: 5, gas: { e: 0.3553, f: 1.217 }, liquid: { e: 10.055, f: 1.198 } },
            { min: 10, gas: { e: 0.7254, f: 1.2203 }, liquid: { e: 40.428, f: 1.111 } },
            { min: 20, gas: { e: 1.7166, f: 1.2164 }, liquid: { e: 77.743, f: 1.114 } },
            { min: 40, gas: { e: 3.9449, f: 1.2097 }, liquid: { e: 152.35, f: 1.118 } },
            { min: 60, gas: { e: 4.9155, f: 1.2522 }, liquid: { e: 1812.8, f: 0.9855 } }
        ]
    }
};
