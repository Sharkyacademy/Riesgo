
/**
 * COF DASHBOARD CALCULATOR - MONOLITHIC VERSION
 * Bundles all dependencies to avoid module resolution issues.
 */

// =============================================================================
// 1. DATA CONSTANTS (Inlined from table4_1_2.js and table4_8_9_10.js)
// =============================================================================

const FluidProperties = {
    "C1-C2": { mw: 23, liquid_density: 15.639, nbp: -193, ambient_state: "Gas", cp_eq: 1, a: 12.3, b: 1.150e-01, c: -2.87e-05, d: -1.30e-09, e: null, ait: 1036 },
    "C3-C4": { mw: 51, liquid_density: 33.61, nbp: -6.3, ambient_state: "Gas", cp_eq: 1, a: 2.632, b: 0.3188, c: -1.347e-04, d: 1.466e-08, e: null, ait: 696 },
    "C5": { mw: 72, liquid_density: 39.03, nbp: 97, ambient_state: "Liquid", cp_eq: 1, a: -3.626, b: 0.4873, c: -2.6e-04, d: 5.3e-08, e: null, ait: 544 },
    "C6-C8": { mw: 100, liquid_density: 42.702, nbp: 210, ambient_state: "Liquid", cp_eq: 1, a: -5.146, b: 6.762e-01, c: -3.65e-04, d: 7.658e-08, e: null, ait: 433 },
    "C9-C12": { mw: 149, liquid_density: 45.823, nbp: 364, ambient_state: "Liquid", cp_eq: 1, a: -8.5, b: 1.01e+00, c: -5.56e-04, d: 1.180e-07, e: null, ait: 406 },
    "C13-C16": { mw: 205, liquid_density: 47.728, nbp: 502, ambient_state: "Liquid", cp_eq: 1, a: -11.7, b: 1.39e+00, c: -7.72e-04, d: 1.670e-07, e: null, ait: 396 },
    "C17-C25": { mw: 280, liquid_density: 48.383, nbp: 651, ambient_state: "Liquid", cp_eq: 1, a: -22.4, b: 1.94e+00, c: -1.12e-03, d: -2.53e-07, e: null, ait: 396 },
    "C25+": { mw: 422, liquid_density: 56.187, nbp: 981, ambient_state: "Liquid", cp_eq: 1, a: -22.4, b: 1.94e+00, c: -1.12e-03, d: -2.53e-07, e: null, ait: 396 },
    "Pyrophoric": { mw: 149, liquid_density: 45.823, nbp: 364, ambient_state: "Liquid", cp_eq: 1, a: -8.5, b: 1.01e+00, c: -5.56e-04, d: 1.180e-07, e: null, ait: "Note 4" },
    "Aromatics": { mw: 104, liquid_density: 42.7, nbp: 293, ambient_state: "Liquid", cp_eq: 2, a: 8.93e+04, b: 2.15e+05, c: 7.72e+02, d: 9.99e+04, e: 2.44e+03, ait: 914 },
    "Styrene": { mw: 104, liquid_density: 42.7, nbp: 293, ambient_state: "Liquid", cp_eq: 2, a: 8.93e+04, b: 2.15e+05, c: 7.72e+02, d: 9.99e+04, e: 2.44e+03, ait: 914 },
    "Water": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Liquid", cp_eq: 3, a: 2.76e+05, b: -2.09e+03, c: 8.125, d: -1.41e-02, e: 9.37e-06, ait: null },
    "Steam": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Gas", cp_eq: 2, a: 3.34e+04, b: 2.68e+04, c: 2.61e+03, d: 8.90e+03, e: 1.17e+03, ait: null },
    "Acid": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Liquid", cp_eq: 2, a: 2.76e+05, b: -2.09e+03, c: 8.125, d: -1.41e-02, e: 9.37e-06, ait: null },
    "Methanol": { mw: 32, liquid_density: 50, nbp: 149, ambient_state: "Liquid", cp_eq: 2, a: 3.93e+04, b: 8.79e+04, c: 1.92e+03, d: 5.37e+04, e: 8.97e+02, ait: 867 },
    "Ammonia": { mw: 17.03, liquid_density: 38.55, nbp: -28.2, ambient_state: "Gas", cp_eq: 1, a: 27.26, b: 2.31e-04, c: 2.24e-07, d: 2.17e-10, e: 5.41e-14, ait: null },
    "H2": { mw: 2, liquid_density: 4.433, nbp: -423, ambient_state: "Gas", cp_eq: 1, a: 27.1, b: 9.270e-03, c: -1.38e-05, d: 7.650e-09, e: null, ait: 752 },
    "H2S": { mw: 34, liquid_density: 61.993, nbp: -75, ambient_state: "Gas", cp_eq: 1, a: 31.9, b: 1.440e-03, c: 2.430e-05, d: -1.18e-08, e: null, ait: 500 },
    "HF": { mw: 20, liquid_density: 60.37, nbp: 68, ambient_state: "Gas", cp_eq: 1, a: 29.1, b: 6.610e-04, c: -2.03e-06, d: 2.500e-09, e: null, ait: 32000 },
    "HCl": { mw: 36, liquid_density: 74, nbp: -121, ambient_state: "Gas", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: null },
    "CO": { mw: 28, liquid_density: 50, nbp: -312, ambient_state: "Gas", cp_eq: 2, a: 2.91e+04, b: 8.77e+03, c: 3.09e+03, d: 8.46e+03, e: 1.54e+03, ait: 1128 },
    "DEE": { mw: 74, liquid_density: 45, nbp: 95, ambient_state: "Liquid", cp_eq: 2, a: 8.62e+04, b: 2.55e+05, c: 1.54e+03, d: 1.44e+05, e: -6.89e+02, ait: 320 },
    "PO": { mw: 58, liquid_density: 52, nbp: 93, ambient_state: "Liquid", cp_eq: 2, a: 4.95e+04, b: 1.74e+05, c: 1.56e+03, d: 1.15e+05, e: 7.02e+02, ait: 840 },
    "EEA": { mw: 132, liquid_density: 61, nbp: 313, ambient_state: "Liquid", cp_eq: 2, a: 1.06e+05, b: 2.40e+05, c: 6.59e+02, d: 1.50e+05, e: 1.97e+03, ait: 715 },
    "EE": { mw: 90, liquid_density: 58, nbp: 275, ambient_state: "Liquid", cp_eq: 2, a: 3.25e+04, b: 3.00e+05, c: 1.17e+03, d: 2.08e+05, e: 4.73e+02, ait: 455 },
    "EG": { mw: 62, liquid_density: 69, nbp: 387, ambient_state: "Liquid", cp_eq: 2, a: 6.30e+04, b: 1.46e+05, c: 1.67e+03, d: 9.73e+04, e: 7.74e+02, ait: 745 },
    "EO": { mw: 44, liquid_density: 55, nbp: 51, ambient_state: "Gas", cp_eq: 2, a: 3.35e+04, b: 1.21e+05, c: 1.61e+03, d: 8.24e+04, e: 7.37e+02, ait: 804 },
    "Chlorine": { mw: 70.9, liquid_density: 98, nbp: -29, ambient_state: "Gas", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: null }
};

const ComponentDamageConstants = {
    "C1-C2": { type: 0, AINL_CONT: { Gas: { a: 43.0, b: 0.98 }, Liquid: null }, AIL_CONT: { Gas: { a: 280.0, b: 0.95 }, Liquid: null }, AINL_INST: { Gas: { a: 41.0, b: 0.67 }, Liquid: null }, AIL_INST: { Gas: { a: 1079, b: 0.62 }, Liquid: null } },
    "C3-C4": { type: 0, AINL_CONT: { Gas: { a: 49.48, b: 1.00 }, Liquid: null }, AIL_CONT: { Gas: { a: 313.6, b: 1.00 }, Liquid: null }, AINL_INST: { Gas: { a: 27.96, b: 0.72 }, Liquid: null }, AIL_INST: { Gas: { a: 522.9, b: 0.63 }, Liquid: null } },
    "C5": { type: 0, AINL_CONT: { Gas: { a: 25.17, b: 0.99 }, Liquid: { a: 536.0, b: 0.89 } }, AIL_CONT: { Gas: { a: 304.7, b: 1.00 }, Liquid: null }, AINL_INST: { Gas: { a: 13.38, b: 0.73 }, Liquid: { a: 1.49, b: 0.85 } }, AIL_INST: { Gas: { a: 275.0, b: 0.61 }, Liquid: null } },
    "C6-C8": { type: 0, AINL_CONT: { Gas: { a: 29.0, b: 0.98 }, Liquid: { a: 182.0, b: 0.89 } }, AIL_CONT: { Gas: { a: 312.4, b: 1.00 }, Liquid: { a: 525.0, b: 0.95 } }, AINL_INST: { Gas: { a: 13.98, b: 0.66 }, Liquid: { a: 4.35, b: 0.78 } }, AIL_INST: { Gas: { a: 275.7, b: 0.61 }, Liquid: { a: 57.0, b: 0.55 } } },
    "C9-C12": { type: 0, AINL_CONT: { Gas: { a: 12.0, b: 0.98 }, Liquid: { a: 130.0, b: 0.90 } }, AIL_CONT: { Gas: { a: 391.0, b: 0.95 }, Liquid: { a: 560.0, b: 0.95 } }, AINL_INST: { Gas: { a: 7.1, b: 0.66 }, Liquid: { a: 3.3, b: 0.76 } }, AIL_INST: { Gas: { a: 281.0, b: 0.61 }, Liquid: { a: 6.0, b: 0.53 } } },
    "C13-C16": { type: 0, AINL_CONT: { Gas: null, Liquid: { a: 64.0, b: 0.90 } }, AIL_CONT: { Gas: null, Liquid: { a: 1023, b: 0.92 } }, AINL_INST: { Gas: null, Liquid: { a: 0.46, b: 0.88 } }, AIL_INST: { Gas: null, Liquid: { a: 9.2, b: 0.88 } } },
    "C17-C25": { type: 0, AINL_CONT: { Gas: null, Liquid: { a: 20.0, b: 0.90 } }, AIL_CONT: { Gas: null, Liquid: { a: 861.0, b: 0.92 } }, AINL_INST: { Gas: null, Liquid: { a: 0.11, b: 0.91 } }, AIL_INST: { Gas: null, Liquid: { a: 5.6, b: 0.91 } } },
    "C25+": { type: 0, AINL_CONT: { Gas: null, Liquid: { a: 11.0, b: 0.91 } }, AIL_CONT: { Gas: null, Liquid: { a: 544.0, b: 0.90 } }, AINL_INST: { Gas: null, Liquid: { a: 0.03, b: 0.99 } }, AIL_INST: { Gas: null, Liquid: { a: 1.4, b: 0.99 } } },
    "Pyrophoric": { type: 1, AINL_CONT: { Gas: { a: 12.0, b: 0.98 }, Liquid: { a: 130.0, b: 0.90 } }, AIL_CONT: { Gas: { a: 391.0, b: 0.95 }, Liquid: { a: 560.0, b: 0.95 } }, AINL_INST: { Gas: { a: 7.1, b: 0.66 }, Liquid: { a: 3.3, b: 0.76 } }, AIL_INST: { Gas: { a: 281.0, b: 0.61 }, Liquid: { a: 6.0, b: 0.53 } } },
    "Aromatics": { type: 1, AINL_CONT: { Gas: { a: 17.87, b: 1.097 }, Liquid: { a: 103.0, b: 0 } }, AIL_CONT: { Gas: { a: 374.5, b: 1.055 }, Liquid: null }, AINL_INST: { Gas: { a: 11.46, b: 0.667 }, Liquid: { a: 70.12, b: 0 } }, AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 701.2, b: 0 } } },
    "Styrene": { type: 1, AINL_CONT: { Gas: { a: 17.87, b: 1.097 }, Liquid: { a: 103.0, b: 0 } }, AIL_CONT: { Gas: { a: 374.5, b: 1.055 }, Liquid: null }, AINL_INST: { Gas: { a: 11.46, b: 0.667 }, Liquid: { a: 70.12, b: 0 } }, AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 701.2, b: 0 } } },
    "Methanol": { type: 1, AINL_CONT: { Gas: { a: 0.02256, b: 0.9092 }, Liquid: { a: 1750.6, b: 0.9342 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 28.1170, b: 0.6670 }, Liquid: { a: 1.9188, b: 0.9004 } }, AIL_INST: { Gas: null, Liquid: null } },
    "H2": { type: 0, AINL_CONT: { Gas: { a: 64.5, b: 0.992 }, Liquid: null }, AIL_CONT: { Gas: { a: 420.0, b: 1.00 }, Liquid: null }, AINL_INST: { Gas: { a: 61.5, b: 0.657 }, Liquid: null }, AIL_INST: { Gas: { a: 1430, b: 0.618 }, Liquid: null } },
    "H2S": { type: 0, AINL_CONT: { Gas: { a: 32.0, b: 1.00 }, Liquid: null }, AIL_CONT: { Gas: { a: 203.0, b: 0.89 }, Liquid: null }, AINL_INST: { Gas: { a: 148.0, b: 0.63 }, Liquid: null }, AIL_INST: { Gas: { a: 357.0, b: 0.61 }, Liquid: null } },
    "CO": { type: 1, AINL_CONT: { Gas: { a: 0.107, b: 1.752 }, Liquid: null }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 69.68, b: 0.667 }, Liquid: null }, AIL_INST: { Gas: null, Liquid: null } },
    "DEE": { type: 1, AINL_CONT: { Gas: { a: 39.84, b: 1.134 }, Liquid: { a: 737.4, b: 1.106 } }, AIL_CONT: { Gas: { a: 320.7, b: 1.033 }, Liquid: { a: 6289, b: 0.649 } }, AINL_INST: { Gas: { a: 155.7, b: 0.667 }, Liquid: { a: 5.105, b: 0.919 } }, AIL_INST: { Gas: null, Liquid: { a: 5.672, b: 0.919 } } },
    "PO": { type: 1, AINL_CONT: { Gas: { a: 14.61, b: 1.114 }, Liquid: { a: 1295, b: 0.9560 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 65.58, b: 0.667 }, Liquid: { a: 3.404, b: 0.869 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EEA": { type: 1, AINL_CONT: { Gas: { a: 0.002, b: 1.035 }, Liquid: { a: 117.0, b: 0 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 8.014, b: 0.667 }, Liquid: { a: 69.0, b: 0 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EE": { type: 1, AINL_CONT: { Gas: { a: 12.62, b: 1.005 }, Liquid: { a: 173.1, b: 0 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 38.87, b: 0.667 }, Liquid: { a: 72.21, b: 0 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EG": { type: 1, AINL_CONT: { Gas: { a: 7.721, b: 0.973 }, Liquid: { a: 108.0, b: 0 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 6.525, b: 0.667 }, Liquid: { a: 69.0, b: 0 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EO": { type: 1, AINL_CONT: { Gas: { a: 31.03, b: 1.069 }, Liquid: null }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 136.3, b: 0.667 }, Liquid: null }, AIL_INST: { Gas: null, Liquid: null } }
};

const PersonnelInjuryConstants = {
    "C1-C2": { type: 0, AINL_CONT: { Gas: { a: 110.0, b: 0.96 }, Liquid: null }, AIL_CONT: { Gas: { a: 745.0, b: 0.92 }, Liquid: null }, AINL_INST: { Gas: { a: 79.0, b: 0.67 }, Liquid: null }, AIL_INST: { Gas: { a: 3100, b: 0.63 }, Liquid: null } },
    "C3-C4": { type: 0, AINL_CONT: { Gas: { a: 125.2, b: 1.00 }, Liquid: null }, AIL_CONT: { Gas: { a: 836.7, b: 1.00 }, Liquid: null }, AINL_INST: { Gas: { a: 57.72, b: 0.75 }, Liquid: null }, AIL_INST: { Gas: { a: 1769, b: 0.63 }, Liquid: null } },
    "C5": { type: 0, AINL_CONT: { Gas: { a: 62.05, b: 1.00 }, Liquid: { a: 1545, b: 0.89 } }, AIL_CONT: { Gas: { a: 811.0, b: 1.00 }, Liquid: null }, AINL_INST: { Gas: { a: 28.45, b: 0.76 }, Liquid: { a: 4.34, b: 0.85 } }, AIL_INST: { Gas: { a: 959.6, b: 0.63 }, Liquid: null } },
    "C6-C8": { type: 0, AINL_CONT: { Gas: { a: 68.0, b: 0.96 }, Liquid: { a: 516.0, b: 0.89 } }, AIL_CONT: { Gas: { a: 828.7, b: 1.00 }, Liquid: { a: 1315, b: 0.92 } }, AINL_INST: { Gas: { a: 26.72, b: 0.67 }, Liquid: { a: 12.7, b: 0.78 } }, AIL_INST: { Gas: { a: 962.8, b: 0.63 }, Liquid: { a: 224.0, b: 0.54 } } },
    "C9-C12": { type: 0, AINL_CONT: { Gas: { a: 29.0, b: 0.96 }, Liquid: { a: 373.0, b: 0.89 } }, AIL_CONT: { Gas: { a: 981.0, b: 0.92 }, Liquid: { a: 1401, b: 0.92 } }, AINL_INST: { Gas: { a: 13.0, b: 0.66 }, Liquid: { a: 9.5, b: 0.76 } }, AIL_INST: { Gas: { a: 988.0, b: 0.63 }, Liquid: { a: 20.0, b: 0.54 } } },
    "C13-C16": { type: 0, AINL_CONT: { Gas: null, Liquid: { a: 183.0, b: 0.89 } }, AIL_CONT: { Gas: null, Liquid: { a: 2850, b: 0.90 } }, AINL_INST: { Gas: null, Liquid: { a: 1.3, b: 0.88 } }, AIL_INST: { Gas: null, Liquid: { a: 26.0, b: 0.88 } } },
    "C17-C25": { type: 0, AINL_CONT: { Gas: null, Liquid: { a: 57.0, b: 0.89 } }, AIL_CONT: { Gas: null, Liquid: { a: 2420, b: 0.90 } }, AINL_INST: { Gas: null, Liquid: { a: 0.32, b: 0.91 } }, AIL_INST: { Gas: null, Liquid: { a: 16.0, b: 0.91 } } },
    "C25+": { type: 0, AINL_CONT: { Gas: null, Liquid: { a: 33.0, b: 0.89 } }, AIL_CONT: { Gas: null, Liquid: { a: 1604, b: 0.90 } }, AINL_INST: { Gas: null, Liquid: { a: 0.081, b: 0.99 } }, AIL_INST: { Gas: null, Liquid: { a: 4.1, b: 0.99 } } },
    "Pyrophoric": { type: 1, AINL_CONT: { Gas: { a: 29.0, b: 0.96 }, Liquid: { a: 373.0, b: 0.89 } }, AIL_CONT: { Gas: { a: 981.0, b: 0.92 }, Liquid: { a: 1401, b: 0.92 } }, AINL_INST: { Gas: { a: 13.0, b: 0.66 }, Liquid: { a: 9.5, b: 0.76 } }, AIL_INST: { Gas: { a: 988.0, b: 0.63 }, Liquid: { a: 20.0, b: 0.54 } } },
    "Aromatics": { type: 1, AINL_CONT: { Gas: { a: 64.14, b: 0.963 }, Liquid: { a: 353.5, b: 0.883 } }, AIL_CONT: { Gas: { a: 1344, b: 0.937 }, Liquid: { a: 487.7, b: 0.268 } }, AINL_INST: { Gas: { a: 18.08, b: 0.686 }, Liquid: { a: 0.14, b: 0.935 } }, AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 1.404, b: 0.935 } } },
    "Styrene": { type: 1, AINL_CONT: { Gas: { a: 64.14, b: 0.963 }, Liquid: { a: 353.5, b: 0.883 } }, AIL_CONT: { Gas: { a: 1344, b: 0.937 }, Liquid: { a: 487.7, b: 0.268 } }, AINL_INST: { Gas: { a: 18.08, b: 0.686 }, Liquid: { a: 0.14, b: 0.935 } }, AIL_INST: { Gas: { a: 512.6, b: 0.713 }, Liquid: { a: 1.404, b: 0.935 } } },
    "Methanol": { type: 1, AINL_CONT: { Gas: { a: 0.0164, b: 1.0083 }, Liquid: { a: 4483.7, b: 0.9015 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 37.71, b: 0.6878 }, Liquid: { a: 6.2552, b: 0.8705 } }, AIL_INST: { Gas: null, Liquid: null } },
    "H2": { type: 0, AINL_CONT: { Gas: { a: 165.0, b: 0.933 }, Liquid: null }, AIL_CONT: { Gas: { a: 1117, b: 1.00 }, Liquid: null }, AINL_INST: { Gas: { a: 118.5, b: 0.652 }, Liquid: null }, AIL_INST: { Gas: { a: 4193, b: 0.621 }, Liquid: null } },
    "H2S": { type: 0, AINL_CONT: { Gas: { a: 52.0, b: 1.00 }, Liquid: null }, AIL_CONT: { Gas: { a: 375.0, b: 0.94 }, Liquid: null }, AINL_INST: { Gas: { a: 271.0, b: 0.63 }, Liquid: null }, AIL_INST: { Gas: { a: 1253, b: 0.63 }, Liquid: null } },
    "CO": { type: 1, AINL_CONT: { Gas: { a: 0.107, b: 1.752 }, Liquid: null }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 105.3, b: 0.692 }, Liquid: null }, AIL_INST: { Gas: null, Liquid: null } },
    "DEE": { type: 1, AINL_CONT: { Gas: { a: 128.1, b: 1.025 }, Liquid: { a: 971.9, b: 1.219 } }, AIL_CONT: { Gas: { a: 1182, b: 0.997 }, Liquid: { a: 2658, b: 0.864 } }, AINL_INST: { Gas: { a: 199.1, b: 0.682 }, Liquid: { a: 47.13, b: 0.814 } }, AIL_INST: { Gas: { a: 821.7, b: 0.657 }, Liquid: { a: 52.36, b: 0.814 } } },
    "PO": { type: 1, AINL_CONT: { Gas: { a: 38.76, b: 1.047 }, Liquid: { a: 1955, b: 0.840 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 83.68, b: 0.682 }, Liquid: { a: 15.21, b: 0.834 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EEA": { type: 1, AINL_CONT: { Gas: { a: 0.017, b: 0.946 }, Liquid: { a: 443.1, b: 0.835 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 11.41, b: 0.687 }, Liquid: { a: 0.153, b: 0.924 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EE": { type: 1, AINL_CONT: { Gas: { a: 35.56, b: 0.969 }, Liquid: { a: 46.56, b: 0.800 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 162.0, b: 0.660 }, Liquid: { a: 0.152, b: 0.927 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EG": { type: 1, AINL_CONT: { Gas: { a: 25.67, b: 0.947 }, Liquid: { a: 324.7, b: 0.869 } }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 8.971, b: 0.687 }, Liquid: { a: 0.138, b: 0.922 } }, AIL_INST: { Gas: null, Liquid: null } },
    "EO": { type: 1, AINL_CONT: { Gas: { a: 49.43, b: 1.105 }, Liquid: null }, AIL_CONT: { Gas: null, Liquid: null }, AINL_INST: { Gas: { a: 220.8, b: 0.665 }, Liquid: null }, AIL_INST: { Gas: null, Liquid: null } }
};

// =============================================================================
// 2. CALCULATION LOGIC (Inlined from cof_level_1_4_8.js)
// =============================================================================

const getEnergyEfficiencyFactor = (mass) => {
    if (mass <= 10000) return 1.0;
    const eff = 4 * Math.log10(1.0 * mass) - 15;
    return Math.max(1.0, eff);
};

const calcPower = (val, coeffs) => {
    if (!coeffs || !coeffs.a || !coeffs.b) return 0;
    return coeffs.a * Math.pow(val, coeffs.b);
};

const getCoeffs = (constSet, phase) => {
    if (!constSet) return null;
    return constSet[phase] || null;
};

// Main Exported Logic Re-implemented
const calcFlammableCA = (fluidKey, rateN, massN, Ts, mitFactor, phase, isInstPrimary) => {
    const cmdConsts = ComponentDamageConstants[fluidKey];
    const injConsts = PersonnelInjuryConstants[fluidKey];

    if (!cmdConsts || !injConsts) {
        console.warn(`Missing coefficients for fluid: ${fluidKey}`);
        return { cmd: 0, inj: 0 };
    }

    const mitMult = 1.0 - mitFactor;

    const calcBaseCA = (coeffsObj, inputVal) => {
        const coeffs = getCoeffs(coeffsObj, phase);
        if (!coeffs) return 0.0;
        let ca = calcPower(inputVal, coeffs);
        return ca * mitMult;
    };

    // Assuming Continuous Release for Report purposes unless specific
    const ca_cmd = calcBaseCA(cmdConsts.AINL_CONT, rateN);
    const ca_inj = calcBaseCA(injConsts.AINL_CONT, rateN);

    // Simplified Blending (ignoring Auto-Ignition Likelihood detail for dashboard summary)
    return { cmd: ca_cmd, inj: ca_inj };
};


// =============================================================================
// 3. DASHBOARD LOGIC (Original cof_dashboard.js)
// =============================================================================

const GC = 32.2;

function calcHoleArea(diameterInch) {
    if (!diameterInch || diameterInch <= 0) return 0;
    return (Math.PI / 4) * Math.pow(diameterInch, 2);
}

function calcLiquidReleaseRate(An, Cd, density, Ps, Patm) {
    let deltaP = Ps - Patm;
    if (deltaP < 0) deltaP = 0;
    const An_ft2 = An / 144.0;
    const term = 2 * density * GC * (deltaP * 144.0);
    return Cd * An_ft2 * Math.sqrt(term);
}

function calcGasReleaseRate(An, Cd, Ps, Patm, Ts, Mw, k) {
    const k_val = k || 1.3;
    const R_gas = 10.73;
    const An_ft2 = An / 144.0;
    const g_factor = 32.2;

    // Simple Sonic approximation for robustness
    const term1 = (k_val * Mw * g_factor) / (R_gas * Ts);
    const term2 = Math.pow(2 / (k_val + 1), (k_val + 1) / (k_val - 1));
    let W = Cd * An_ft2 * Ps * Math.sqrt(term1 * term2);

    if (Ps < Patm + 5) W = W * (Ps - Patm) / 10;
    if (W < 0) W = 0;
    return W;
}

async function runCofCalculations() {
    console.log('[COF Dashboard] Starting calculation (Monolithic)...');
    try {
        const getValue = (id, def = 0) => {
            const el = document.getElementById(id);
            const val = el ? parseFloat(el.value || el.innerText) : def;
            return isNaN(val) ? def : val;
        };
        const getString = (id, def = '') => {
            const el = document.getElementById(id);
            return el ? (el.value || el.innerText || def).trim() : def;
        };

        const fluidKey = getString('id_rbix_fluid', 'C1-C2');
        const phase = getString('id_operational_fluid_phase', 'Liquid');
        const Ps = getValue('id_operating_pressure_psia', 100);
        const Ts_F = getValue('id_operating_temp_f', 100);
        const Ts_R = Ts_F + 460;
        const dHole = getValue('id_component_diameter', 1.0);

        const d_final = dHole > 0 ? dHole : 1.0;
        const An_1inch = calcHoleArea(1.0);

        const Cd = getValue('id_discharge_coeff', 0.61);
        const Patm = getValue('id_atm_pressure', 14.7);

        const props = FluidProperties[fluidKey] || FluidProperties['Water'];
        const density = props.liquid_density || 62.4;
        const Mw = props.mw || 18;

        let rateN = 0;
        if (phase === 'Gas' || props.ambient_state === 'Gas') {
            rateN = calcGasReleaseRate(An_1inch, Cd, Ps, Patm, Ts_R, Mw);
        } else {
            rateN = calcLiquidReleaseRate(An_1inch, Cd, density, Ps, Patm);
        }

        const mitSystem = getString('id_mitigation_system', 'None');
        let mitFactor = 0.0;
        if (mitSystem.includes('Inventory')) mitFactor = 0.25;
        if (mitSystem.includes('FireWater')) mitFactor = 0.20;

        const fluidMass = getValue('id_component_fluid_mass_lb', 10000);

        // Use inline calcFlammableCA
        const result = calcFlammableCA(fluidKey, rateN, fluidMass, Ts_R, mitFactor, phase, false);

        const cmdArea = result.cmd || 0;
        const injArea = result.inj || 0;

        const elCmd = document.getElementById('val_final_cmd');
        const elInj = document.getElementById('val_final_inj');

        if (elCmd) elCmd.innerText = cmdArea.toFixed(2);
        if (elInj) elInj.innerText = injArea.toFixed(2);

        const eqCostSqFt = getValue('id_equipment_cost_per_sqft', 0);
        const prodCostDay = getValue('id_production_cost_per_day', 0);
        const injCostPerson = getValue('id_injury_cost_per_person', 0);
        const envCostBbl = getValue('id_environmental_cost_per_bbl', 0);

        const costEquip = cmdArea * eqCostSqFt;
        const outageMult = getValue('id_outage_multiplier', 1.0);
        const days = (cmdArea > 500) ? 10 : (cmdArea > 100 ? 4 : 1);
        const costProd = prodCostDay * days * outageMult;
        const costBus = costEquip + costProd;

        const popDensity = 0.002;
        const calcSafe = injArea * popDensity * (injCostPerson > 0 ? injCostPerson : 1000000);

        const massSpilled = rateN * 1800;
        const volFt3 = massSpilled / density;
        const bbls = volFt3 / 5.615;
        const costEnv = bbls * envCostBbl;

        // Update DOM
        if (document.getElementById('val_fc_bus')) document.getElementById('val_fc_bus').innerText = `${costBus.toFixed(2)}`;
        if (document.getElementById('val_fc_inj')) document.getElementById('val_fc_inj').innerText = `${calcSafe.toFixed(2)}`;
        if (document.getElementById('val_fc_env')) document.getElementById('val_fc_env').innerText = `${costEnv.toFixed(2)}`;

        const costTotal = costBus + calcSafe + costEnv;
        if (document.getElementById('val_fc_total')) document.getElementById('val_fc_total').innerText = `${costTotal.toFixed(2)}`;

        // DEBUG PANEL UPDATES
        try {
            if (document.getElementById('dbg_pressure')) document.getElementById('dbg_pressure').textContent = Ps;
            if (document.getElementById('dbg_temp')) document.getElementById('dbg_temp').textContent = Ts_F;
            if (document.getElementById('dbg_fluid')) document.getElementById('dbg_fluid').textContent = fluidKey;
            if (document.getElementById('dbg_hole')) document.getElementById('dbg_hole').textContent = d_final + '"';
            if (document.getElementById('dbg_rate')) document.getElementById('dbg_rate').textContent = rateN.toFixed(4) + ' lb/s';
            if (document.getElementById('dbg_area')) document.getElementById('dbg_area').textContent = cmdArea.toFixed(2) + ' ft2';
            if (document.getElementById('dbg_cost')) document.getElementById('dbg_cost').textContent = '$' + costTotal.toLocaleString();

            const riskTgt = getValue('inp_target_max_df', 4.0);
            if (document.getElementById('dbg_target')) document.getElementById('dbg_target').textContent = riskTgt;

        } catch (e) { console.error("Debug update failed", e); }

        console.log('[COF Dashboard] Complete.', { rateN, cmdArea, costTotal });
    } catch (e) {
        console.error("Critical COF Calc Error", e);
        if (document.getElementById('dbg_rate')) document.getElementById('dbg_rate').textContent = "ERR: " + e.message;
        if (document.getElementById('dbg_area')) document.getElementById('dbg_area').textContent = "Check Console";
    }
}

// Global Export
window.runCofCalculations = runCofCalculations;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCofCalculations);
} else {
    runCofCalculations();
}
