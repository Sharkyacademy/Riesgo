import { ComponentDamageConstants, PersonnelInjuryConstants } from '../data/cof/table4_8_9_10.js';
import { FluidProperties } from '../data/cof/table4_1_2.js';

// --- HELPERS for Step 4.8 ---

// Helper: Calculate AIT Blending Factor (Eq 3.23 - 3.25)
// Ts and AIT in Rankine
const getAITBlendingFactor = (Ts, aitValue) => {
    if (aitValue === "Note 4") return 1.0; // Pyrophoric -> Assume Likely (factAIT = 1 for Auto-Ignition Likely)
    if (!aitValue) return 0.0; // No AIT data -> Assume Not Likely

    const AIT = parseFloat(aitValue);
    const C6 = 100.0; // Rankine

    // Step 8.13 / Eq 3.23: Ts + C6 <= AIT -> fact = 0
    if (Ts + C6 <= AIT) return 0.0;

    // Step 8.13 / Eq 3.24: Transition
    if (Ts + C6 > AIT && Ts > AIT - C6) {
        return (Ts - AIT + C6) / (2 * C6);
    }

    // Step 8.13 / Eq 3.25: Ts - C6 >= AIT -> fact = 1
    if (Ts - C6 >= AIT) return 1.0;

    return 0.0;
};

// Helper: Calculate Energy Efficiency Factor (Eq 3.17)
// Only for Instantaneous Releases > 10,000 lbs
const getEnergyEfficiencyFactor = (mass) => {
    if (mass <= 10000) return 1.0;
    // eneff = 4 * log10(mass) - 15
    const eff = 4 * Math.log10(1.0 * mass) - 15;
    return Math.max(1.0, eff); // Safety clamp, though formula usually > 1 for mass > 10k
};

// Helper: Generic CA power calculation
const calcPower = (val, coeffs) => {
    if (!coeffs || !coeffs.a || !coeffs.b) return 0; // Handle missing constants
    return coeffs.a * Math.pow(val, coeffs.b);
};

// Helper: Pick coefficients based on phase (Gas/Liquid)
const getCoeffs = (constSet, phase) => {
    if (!constSet) return null;
    return constSet[phase] || null;
};

/**
 * Main Step 4.8 Calculation Function
 * Calculates CA_cmd_flam and CA_inj_flam for a single hole size n.
 * 
 * @param {string} fluidKey - Key for fluid properties (e.g. "C1-C2")
 * @param {number} rateN - Adjusted Release Rate (lb/s)
 * @param {number} massN - Release Mass (lb)
 * @param {number} Ts - Storage Temperature (Rankine)
 * @param {number} mitFactor - Mitigation reduction factor (0.0 to 1.0)
 * @param {string} phase - Final Phase ('Gas' or 'Liquid')
 * @param {boolean} isInstPrimary - Determined Release Type (True if Instantaneous is primary)
 * @returns {Object} { cmd: number, inj: number } - Final blended and mitigated areas
 */
export const calcFlammableCA = (fluidKey, rateN, massN, Ts, mitFactor, phase, isInstPrimary) => {
    // 1. Retrieve Constants
    // Note: fluidKey passed from UI might need mapping if it doesn't match keys in table4_8_9_10 directly.
    // Assuming representative fluid label matches keys for now.

    const cmdConsts = ComponentDamageConstants[fluidKey];
    const injConsts = PersonnelInjuryConstants[fluidKey];

    // If no constants found (e.g. fluid not in table), return 0
    if (!cmdConsts || !injConsts) {
        console.warn(`Missing coefficients for fluid: ${fluidKey}`);
        return { cmd: 0, inj: 0 };
    }

    const fluidType = cmdConsts.type; // 0 or 1
    const prop = FluidProperties[fluidKey];
    const aitVal = prop ? prop.ait : null;

    // 2. Energy Efficiency Correction (Step 8.2)
    const eneff = getEnergyEfficiencyFactor(massN);

    // 3. Mitigation Multiplier (Step 8.1)
    const mitMult = 1.0 - mitFactor;

    // Helper to calculate a specific Base CA (Equations 3.30, 3.33, 3.36, 3.39, etc.)
    const calcBaseCA = (coeffsObj, inputVal, isInst) => {
        // Get a, b for the specific phase
        const coeffs = getCoeffs(coeffsObj, phase);

        // If coeffs are null (e.g. liquid constants requested for Gas phase), return 0? 
        // Actually, for Type 0/1 blending, if a model doesn't exist, it implies zero contribution or fallback.
        if (!coeffs) return 0.0;

        let ca = calcPower(inputVal, coeffs);

        // Apply Mitigation
        ca = ca * mitMult;

        // Apply Energy Efficiency (Instantaneous only)
        if (isInst) ca = ca / eneff;

        return ca;
    };

    // --- CALCULATE 8 BASE AREAS (Step 8.4 - 8.11) ---

    // keys in table4_8_9_10: AINL_CONT, AIL_CONT, AINL_INST, AIL_INST

    // Component Damage (CMD)
    const ca_cmd_AINL_CONT = calcBaseCA(cmdConsts.AINL_CONT, rateN, false);
    const ca_cmd_AIL_CONT = calcBaseCA(cmdConsts.AIL_CONT, rateN, false);
    const ca_cmd_AINL_INST = calcBaseCA(cmdConsts.AINL_INST, massN, true);
    const ca_cmd_AIL_INST = calcBaseCA(cmdConsts.AIL_INST, massN, true);

    // Personnel Injury (INJ)
    const ca_inj_AINL_CONT = calcBaseCA(injConsts.AINL_CONT, rateN, false);
    const ca_inj_AIL_CONT = calcBaseCA(injConsts.AIL_CONT, rateN, false);
    const ca_inj_AINL_INST = calcBaseCA(injConsts.AINL_INST, massN, true);
    const ca_inj_AIL_INST = calcBaseCA(injConsts.AIL_INST, massN, true);


    // --- BLENDING BASED ON RELEASE TYPE (Step 8.12 - 8.14) ---
    // Calculate Mixing Factor factIC (Eq 3.18 - 3.20)
    let factIC = 0.0;

    const C5 = 55.6; // lb/s

    // Determine factIC
    if (fluidType === 0) {
        // Eq 3.18: Type 0 (Common case)
        factIC = Math.min(rateN / C5, 1.0);
    } else {
        // Type 1: 
        // Technically Eq 3.20 says 1.0 if Instantaneous...
        // But Step 8.14 text says "For Type 1 fluids, use... based on release type from Steps 8.4 to 8.11"
        // which implies binary selection, not blending.
        // We will handle Type 1 selection logic below.
        factIC = 0.0; // Placeholder
    }

    // Holders for Blended (or Selected) IC results
    let ca_cmd_AIL, ca_cmd_AINL, ca_inj_AIL, ca_inj_AINL;

    if (fluidType === 0) {
        // Blend (Eq 3.52 - 3.55)
        const blend = (inst, cont) => inst * factIC + cont * (1.0 - factIC);

        ca_cmd_AIL = blend(ca_cmd_AIL_INST, ca_cmd_AIL_CONT);
        ca_cmd_AINL = blend(ca_cmd_AINL_INST, ca_cmd_AINL_CONT);
        ca_inj_AIL = blend(ca_inj_AIL_INST, ca_inj_AIL_CONT);
        ca_inj_AINL = blend(ca_inj_AINL_INST, ca_inj_AINL_CONT);

    } else {
        // Type 1 Selection (No blending)
        if (isInstPrimary) {
            // Use Instantaneous Results
            ca_cmd_AIL = ca_cmd_AIL_INST;
            ca_cmd_AINL = ca_cmd_AINL_INST;
            ca_inj_AIL = ca_inj_AIL_INST;
            ca_inj_AINL = ca_inj_AINL_INST;
        } else {
            // Use Continuous Results
            ca_cmd_AIL = ca_cmd_AIL_CONT;
            ca_cmd_AINL = ca_cmd_AINL_CONT;
            ca_inj_AIL = ca_inj_AIL_CONT;
            ca_inj_AINL = ca_inj_AINL_CONT;
        }
    }

    // --- BLENDING BASED ON AIT (Step 8.13 & 8.15) ---
    const factAIT = getAITBlendingFactor(Ts, aitVal);

    // Final Blending (Eq 3.56 - 3.57)
    // CA_flam = CA_AIL * factAIT + CA_AINL * (1 - factAIT)

    const final_cmd = ca_cmd_AIL * factAIT + ca_cmd_AINL * (1.0 - factAIT);
    const final_inj = ca_inj_AIL * factAIT + ca_inj_AINL * (1.0 - factAIT);

    return {
        cmd: final_cmd,
        inj: final_inj
    };
};
