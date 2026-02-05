export const FluidProperties = {
    "C1-C2": { mw: 23, liquid_density: 15.639, nbp: -193, ambient_state: "Gas", cp_eq: 1, a: 12.3, b: 1.150e-01, c: -2.87e-05, d: -1.30e-09, e: null, ait: 1036 },
    "C3-C4": { mw: 51, liquid_density: 33.61, nbp: -6.3, ambient_state: "Gas", cp_eq: 1, a: 2.632, b: 0.3188, c: -1.347e-04, d: 1.466e-08, e: null, ait: 696 },
    "C5": { mw: 72, liquid_density: 39.03, nbp: 97, ambient_state: "Liquid", cp_eq: 1, a: -3.626, b: 0.4873, c: -2.6e-04, d: 5.3e-08, e: null, ait: 544 },
    "C6-C8": { mw: 100, liquid_density: 42.702, nbp: 210, ambient_state: "Liquid", cp_eq: 1, a: -5.146, b: 6.762e-01, c: -3.65e-04, d: 7.658e-08, e: null, ait: 433 },
    "C9-C12": { mw: 149, liquid_density: 45.823, nbp: 364, ambient_state: "Liquid", cp_eq: 1, a: -8.5, b: 1.01e+00, c: -5.56e-04, d: 1.180e-07, e: null, ait: 406 },
    "C13-C16": { mw: 205, liquid_density: 47.728, nbp: 502, ambient_state: "Liquid", cp_eq: 1, a: -11.7, b: 1.39e+00, c: -7.72e-04, d: 1.670e-07, e: null, ait: 396 },
    "C17-C25": { mw: 280, liquid_density: 48.383, nbp: 651, ambient_state: "Liquid", cp_eq: 1, a: -22.4, b: 1.94e+00, c: -1.12e-03, d: -2.53e-07, e: null, ait: 396 },
    "C25+": { mw: 422, liquid_density: 56.187, nbp: 981, ambient_state: "Liquid", cp_eq: 1, a: -22.4, b: 1.94e+00, c: -1.12e-03, d: -2.53e-07, e: null, ait: 396 },
    "Pyrophoric": { mw: 149, liquid_density: 45.823, nbp: 364, ambient_state: "Liquid", cp_eq: 1, a: -8.5, b: 1.01e+00, c: -5.56e-04, d: 1.180e-07, e: null, ait: "Note 4" }, // Note 4: assumed very low
    "Aromatic": { mw: 104, liquid_density: 42.7, nbp: 293, ambient_state: "Liquid", cp_eq: 2, a: 8.93e+04, b: 2.15e+05, c: 7.72e+02, d: 9.99e+04, e: 2.44e+03, ait: 914 }, // 'Aromatics' in Table 4.1 map to 'Aromatic'?
    "Styrene": { mw: 104, liquid_density: 42.7, nbp: 293, ambient_state: "Liquid", cp_eq: 2, a: 8.93e+04, b: 2.15e+05, c: 7.72e+02, d: 9.99e+04, e: 2.44e+03, ait: 914 },
    "Water": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Liquid", cp_eq: 3, a: 2.76e+05, b: -2.09e+03, c: 8.125, d: -1.41e-02, e: 9.37e-06, ait: null },
    "Steam": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Gas", cp_eq: 2, a: 3.34e+04, b: 2.68e+04, c: 2.61e+03, d: 8.90e+03, e: 1.17e+03, ait: null },
    "Acid": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Liquid", cp_eq: 2, a: 2.76e+05, b: -2.09e+03, c: 8.125, d: -1.41e-02, e: 9.37e-06, ait: null }, // Mapping 'Acid' to this generic entry
    "Acid/caustic-LP": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Liquid", cp_eq: 2, a: 2.76e+05, b: -2.09e+03, c: 8.125, d: -1.41e-02, e: 9.37e-06, ait: null },
    "Acid/caustic-MP": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Liquid", cp_eq: 2, a: 2.76e+05, b: -2.09e+03, c: 8.125, d: -1.41e-02, e: 9.37e-06, ait: null },
    "Acid/caustic-HP": { mw: 18, liquid_density: 62.3, nbp: 212, ambient_state: "Liquid", cp_eq: 2, a: 2.76e+05, b: -2.09e+03, c: 8.125, d: -1.41e-02, e: 9.37e-06, ait: null },
    "Methanol": { mw: 32, liquid_density: 50, nbp: 149, ambient_state: "Liquid", cp_eq: 2, a: 3.93e+04, b: 8.79e+04, c: 1.92e+03, d: 5.37e+04, e: 8.97e+02, ait: 867 },
    "Ammonia": { mw: 17.03, liquid_density: 38.55, nbp: -28.2, ambient_state: "Gas", cp_eq: 1, a: 27.26, b: 2.31e-04, c: 2.24e-07, d: 2.17e-10, e: 5.41e-14, ait: null }, // "Anhydrous ammonia" in table key map?
    "H2": { mw: 2, liquid_density: 4.433, nbp: -423, ambient_state: "Gas", cp_eq: 1, a: 27.1, b: 9.270e-03, c: -1.38e-05, d: 7.650e-09, e: null, ait: 752 },
    "H2S": { mw: 34, liquid_density: 61.993, nbp: -75, ambient_state: "Gas", cp_eq: 1, a: 31.9, b: 1.440e-03, c: 2.430e-05, d: -1.18e-08, e: null, ait: 500 },
    "HF": { mw: 20, liquid_density: 60.37, nbp: 68, ambient_state: "Gas", cp_eq: 1, a: 29.1, b: 6.610e-04, c: -2.03e-06, d: 2.500e-09, e: null, ait: 32000 },
    "HCl": { mw: 36, liquid_density: 74, nbp: -121, ambient_state: "Gas", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: null },
    "CO": { mw: 28, liquid_density: 50, nbp: -312, ambient_state: "Gas", cp_eq: 2, a: 2.91e+04, b: 8.77e+03, c: 3.09e+03, d: 8.46e+03, e: 1.54e+03, ait: 1128 },
    "DEE": { mw: 74, liquid_density: 45, nbp: 95, ambient_state: "Liquid", cp_eq: 2, a: 8.62e+04, b: 2.55e+05, c: 1.54e+03, d: 1.44e+05, e: -6.89e+02, ait: 320 },
    "Nitric acid": { mw: 63, liquid_density: 95, nbp: 250, ambient_state: "Liquid", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: null },
    "AlCl3": { mw: 133.5, liquid_density: 152, nbp: 382, ambient_state: "Powder", cp_eq: 1, a: 6.49e+01, b: 8.74e+01, c: 1.82e-02, d: -4.65e-04, e: null, ait: 1036 },
    "NO2": { mw: 46, liquid_density: 58, nbp: 275, ambient_state: "Liquid", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: null },
    "Phosgene": { mw: 99, liquid_density: 86, nbp: 181, ambient_state: "Liquid", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: null },
    "TDI": { mw: 174, liquid_density: 76, nbp: 484, ambient_state: "Liquid", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: 1148 },
    "PO": { mw: 58, liquid_density: 52, nbp: 93, ambient_state: "Liquid", cp_eq: 2, a: 4.95e+04, b: 1.74e+05, c: 1.56e+03, d: 1.15e+05, e: 7.02e+02, ait: 840 },
    "EEA": { mw: 132, liquid_density: 61, nbp: 313, ambient_state: "Liquid", cp_eq: 2, a: 1.06e+05, b: 2.40e+05, c: 6.59e+02, d: 1.50e+05, e: 1.97e+03, ait: 715 },
    "EE": { mw: 90, liquid_density: 58, nbp: 275, ambient_state: "Liquid", cp_eq: 2, a: 3.25e+04, b: 3.00e+05, c: 1.17e+03, d: 2.08e+05, e: 4.73e+02, ait: 455 },
    "EG": { mw: 62, liquid_density: 69, nbp: 387, ambient_state: "Liquid", cp_eq: 2, a: 6.30e+04, b: 1.46e+05, c: 1.67e+03, d: 9.73e+04, e: 7.74e+02, ait: 745 },
    "EO": { mw: 44, liquid_density: 55, nbp: 51, ambient_state: "Gas", cp_eq: 2, a: 3.35e+04, b: 1.21e+05, c: 1.61e+03, d: 8.24e+04, e: 7.37e+02, ait: 804 },
    "Aromatics": { mw: 104, liquid_density: 42.7, nbp: 293, ambient_state: "Liquid", cp_eq: 2, a: 8.93e+04, b: 2.15e+05, c: 7.72e+02, d: 9.99e+04, e: 2.44e+03, ait: 914 }, // Mapped manually
    "Chlorine": { mw: 70.9, liquid_density: 98, nbp: -29, ambient_state: "Gas", cp_eq: null, a: null, b: null, c: null, d: null, e: null, ait: null } // Added manually as common missing
};
