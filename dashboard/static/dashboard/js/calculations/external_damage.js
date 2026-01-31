
// ============================================================================
// External Damage Calculations (API 581)
// ============================================================================

// --- Data Tables ---

// Table 2.D.3.2 - Base Corrosion Rate (mpy) based on Driver and Temp (F)
// (Simplified from full table for typical ranges)
const CUI_BASE_RATES = [
    { "temp": 10, "severe": 0, "moderate": 0, "mild": 0, "dry": 0 },
    { "temp": 18, "severe": 3, "moderate": 1, "mild": 0, "dry": 0 },
    { "temp": 32, "severe": 3, "moderate": 1, "mild": 0, "dry": 0 },
    { "temp": 43, "severe": 10, "moderate": 5, "mild": 3, "dry": 1 },
    { "temp": 90, "severe": 10, "moderate": 5, "mild": 3, "dry": 1 },
    { "temp": 160, "severe": 20, "moderate": 10, "mild": 5, "dry": 2 }, // Peak at boiling
    { "temp": 225, "severe": 10, "moderate": 5, "mild": 1, "dry": 1 },
    { "temp": 275, "severe": 10, "moderate": 2, "mild": 1, "dry": 0 },
    { "temp": 325, "severe": 5, "moderate": 1, "mild": 0, "dry": 0 },
    { "temp": 350, "severe": 0, "moderate": 0, "mild": 0, "dry": 0 }
];

// Insulation Type Factors (Table 2.D.3.3)
const INSULATION_FACTORS = {
    'Mineral Wool': 1.5,
    'Calcium Silicate': 1.25,
    'Fiberglass': 1.25,
    'Foam Glass': 0.75, // Cellular Glass
    'Asbestos': 1.5,
    'Other': 1.25,
    'Unknown': 1.5
};

// Utils
function interpolate(x, x0, y0, x1, y1) {
    if (x1 === x0) return y0;
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
}

/**
 * Calculates External Damage Rate
 */
function calculateExternalDamage(mechType) {
    console.log(`[External Damage] Calculating for ${mechType}...`);

    let rate = 0;

    if (mechType === 'ext_corrosion') {
        rate = calculateAtmosphericCorrosion();
    } else if (mechType === 'cui') {
        rate = calculateCUIRate();
    }

    // Display Result
    displayExternalResult(mechType, rate);
}

/**
 * Calculates Atmospheric Corrosion Rate
 * Still using simplified logic as API 581 Atmospheric doesn't strongly depend on Op Temp in the same way CUI does.
 */
function calculateAtmosphericCorrosion() {
    const driver = document.getElementById('id_external_driver').value;
    let rate = 0; // mpy

    switch (driver) {
        case 'Severe': rate = 10.0; break;
        case 'Marine': rate = 5.0; break; // Often considered Severe
        case 'Temperate': rate = 3.0; break;
        case 'Arid/Dry': rate = 0.5; break;
        case 'None':
        default: rate = 0.0; break;
    }

    // Complexity Factor
    const complexity = document.getElementById('id_complexity')?.value;
    // Map Complexity: High->1.25, Med->1.0, Low->0.75
    let fCm = 1.0;
    if (complexity === 'High') fCm = 1.25;
    if (complexity === 'Low') fCm = 0.75;

    return rate * fCm;
}

/**
 * Calculates CUI Rate for Ferritic Components using API 581 Tables
 * CR = CrB * Fins * Fcm * Fic * max(Feq, Fif)
 */
function calculateCUIRate() {
    // 1. Get Inputs
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);
    const driverVal = document.getElementById('id_cui_driver').value; // None, Mild, Moderate, Severe
    const insConditionVal = document.getElementById('id_insulation_condition').value; // Good, Average, Poor
    const complexityVal = document.getElementById('id_complexity').value; // High, Medium, Low

    // Read non-persisted adjustments (if available in DOM, else default)
    const eqDesignVal = document.getElementById('sel_cui_eq_design')?.value || "1.0";
    const interfaceVal = document.getElementById('sel_cui_interface')?.value || "1.0";

    // Read persisted Insulation Type from Design Tab
    const insTypeVal = document.getElementById('id_insulation_type')?.value || "Unknown";

    if (isNaN(tempF)) {
        alert("Please enter Operating Temperature in the Operating Conditions tab.");
        return 0;
    }
    if (!driverVal || driverVal === 'None') return 0; // No CUI driver

    // 2. Calculate CrB (Base Rate)
    // Map driver to table keys: moderate, severe, mild, dry
    let tableKey = driverVal.toLowerCase();
    if (tableKey === 'marine') tableKey = 'severe'; // Map marine->severe if user selected marine (though cui driver usu doesn't have marine)

    // Interpolate base rate from CUI_BASE_RATES
    let crB = 0;
    const data = CUI_BASE_RATES;

    // Handle bounds
    if (tempF <= data[0].temp) {
        crB = data[0][tableKey] || 0;
    } else if (tempF >= data[data.length - 1].temp) {
        crB = 0; // Above limit (dry)
    } else {
        // Find interval
        for (let i = 0; i < data.length - 1; i++) {
            if (tempF >= data[i].temp && tempF <= data[i + 1].temp) {
                const y0 = data[i][tableKey] || 0;
                const y1 = data[i + 1][tableKey] || 0;
                crB = interpolate(tempF, data[i].temp, y0, data[i + 1].temp, y1);
                break;
            }
        }
    }

    // 3. Determine Factors

    // F_ins (Insulation Type)
    let fIns = 1.25; // Default (Calcium Silicate/Fiberglass)
    // Try to match partial string
    for (const type in INSULATION_FACTORS) {
        if (insTypeVal.includes(type)) {
            fIns = INSULATION_FACTORS[type];
            break;
        }
    }
    // Check specific known names
    if (insTypeVal === 'Calcium Silicate') fIns = 1.25;
    if (insTypeVal === 'Mineral Wool') fIns = 1.5;
    if (insTypeVal === 'Fiberglass') fIns = 1.25;
    if (insTypeVal === 'Foam Glass') fIns = 0.75;

    // Update Display Check
    const typeDisplay = document.getElementById('cui_insulation_type_display');
    if (typeDisplay) {
        typeDisplay.innerText = `${insTypeVal || 'None'} (Factor: ${fIns})`;
    }

    // F_cm (Complexity)
    let fCm = 1.0;
    if (complexityVal === 'High') fCm = 1.25;
    if (complexityVal === 'Low') fCm = 0.75;

    // F_ic (Insulation Condition)
    let fIc = 1.0;
    if (insConditionVal === 'Poor') fIc = 1.25;
    if (insConditionVal === 'Good') fIc = 0.75;

    // F_eq (Equipment Design)
    const fEq = parseFloat(eqDesignVal);

    // F_if (Interface)
    const fIf = parseFloat(interfaceVal);

    // 4. Final Calculation
    // CR = CrB * Fins * Fcm * Fic * max(Feq, Fif)
    const maxEqIf = Math.max(fEq, fIf);
    const finalRate = crB * fIns * fCm * fIc * maxEqIf;

    console.log(`[CUI Calc] Temp=${tempF} Driver=${driverVal} CrB=${crB.toFixed(2)} | Fins=${fIns} Fcm=${fCm} Fic=${fIc} MaxEqIf=${maxEqIf}`);

    return finalRate;
}

/**
 * Update UI and Hidden Fields with Result
 */
function displayExternalResult(mechType, rate) {
    const displayEl = document.getElementById(mechType === 'ext_corrosion' ? 'ext_corrosion_rate_display' : 'cui_rate_display');
    const inputEl = document.getElementById(mechType === 'ext_corrosion' ? 'id_external_corrosion_rate_mpy' : 'id_cui_corrosion_rate_mpy');
    const resultDiv = document.getElementById(mechType === 'ext_corrosion' ? 'ext_corrosion_result' : 'cui_result');

    if (displayEl && inputEl && resultDiv) {
        displayEl.innerText = `${rate.toFixed(2)} mpy`;
        inputEl.value = rate.toFixed(4);
        resultDiv.classList.remove('hidden');

        // Update Chart
        if (typeof updatePofSummary === 'function') {
            updatePofSummary();
        }
    }
}

// Init Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    const mainTemp = document.getElementById('id_operating_temp_f');
    const cuiTempDisplay = document.getElementById('cui_operating_temp_display');

    if (mainTemp && cuiTempDisplay) {
        mainTemp.addEventListener('change', function () {
            cuiTempDisplay.value = this.value;
        });
        cuiTempDisplay.value = mainTemp.value || '--';
    }

    // Initial update of Insulation Type display
    // We run a "dry" calc just to update the UI text, or just reuse the logic
    // But since calc requires fields potentially empty, we just update the specific label safely
    const insTypeVal = document.getElementById('id_insulation_type')?.value;
    if (insTypeVal) {
        calculateCUIRate(); // This will update the label (and the rate 0 if missing inputs)
    }
});
