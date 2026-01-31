/**
 * PHASE 2 & 3 THINNING CALCULATIONS
 * Amine, Water (Alkaline/Acid), and Specialized Mechanisms
 */

// ============================================================================
// PHASE 2: AMINE CORROSION
// ============================================================================

async function calculateAmineCorrosionRate() {
    const amineType = document.getElementById('id_amine_type')?.value;
    const concWt = parseFloat(document.getElementById('id_amine_concentration_wt_percent')?.value);
    const loading = parseFloat(document.getElementById('id_amine_acid_gas_loading')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);

    if (!amineType || isNaN(concWt) || isNaN(loading) || isNaN(tempF)) {
        displayAmineError('Please fill all fields: Amine Type, Concentration, Acid Gas Loading, and Operating Temperature.');
        return;
    }

    // Base rates by amine type (simplified - from API 581 guidance)
    const baseRates = {
        'MEA': 8,   // Most aggressive
        'DEA': 5,
        'MDEA': 3,  // Least aggressive
        'DGA': 6
    };

    const baseRate = baseRates[amineType] || 5;
    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = 1 + (tempC - 50) / 100;
    const concFactor = Math.pow(concWt / 20, 0.6);
    const loadingFactor = 1 + loading * 2;  // Higher loading = more corrosive

    const crMpy = baseRate * concFactor * tempFactor * loadingFactor;

    displayAmineResult(crMpy);
    document.getElementById('id_amine_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[Amine] Calculation complete:', crMpy.toFixed(2), 'mpy');
}

function displayAmineResult(rateMpy) {
    document.getElementById('amine_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('amine_result').classList.remove('hidden');
    document.getElementById('amine_error').classList.add('hidden');
}

function displayAmineError(msg) {
    document.getElementById('amine_error_msg').textContent = msg;
    document.getElementById('amine_error').classList.remove('hidden');
    document.getElementById('amine_result').classList.add('hidden');
}

// ============================================================================
// PHASE 2: ALKALINE WATER CORROSION
// ============================================================================

async function calculateAlkalineWaterCorrosionRate() {
    const velocity = parseFloat(document.getElementById('id_alkaline_water_velocity_fps')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);
    const pH = parseFloat(document.getElementById('id_ph_value')?.value);

    if (isNaN(velocity) || isNaN(tempF) || isNaN(pH)) {
        displayAlkalineWaterError('Please fill all fields: Velocity, Operating Temperature, and pH.');
        return;
    }

    if (pH < 7) {
        displayAlkalineWaterError('pH must be >= 7 for alkaline water. Use Acid Water mechanism for pH < 7.');
        return;
    }

    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = 1 + tempC / 200;
    const velocityFactor = 1 + velocity / 20;
    const phFactor = Math.max(0.5, (pH - 7) / 7);  // Higher pH = more corrosive for alkaline

    const crMpy = 2 * tempFactor * velocityFactor * phFactor;

    displayAlkalineWaterResult(crMpy);
    document.getElementById('id_alkaline_water_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[Alkaline Water] CR:', crMpy.toFixed(2), 'mpy');
}

function displayAlkalineWaterResult(rateMpy) {
    document.getElementById('alkaline_water_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('alkaline_water_result').classList.remove('hidden');
    document.getElementById('alkaline_water_error').classList.add('hidden');
}

function displayAlkalineWaterError(msg) {
    document.getElementById('alkaline_water_error_msg').textContent = msg;
    document.getElementById('alkaline_water_error').classList.remove('hidden');
    document.getElementById('alkaline_water_result').classList.add('hidden');
}

// ============================================================================
// PHASE 2: ACID WATER CORROSION
// ============================================================================

async function calculateAcidWaterCorrosionRate() {
    const o2Ppm = parseFloat(document.getElementById('id_acid_water_dissolved_o2_ppm')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);
    const pH = parseFloat(document.getElementById('id_ph_value')?.value);

    if (isNaN(o2Ppm) || isNaN(tempF) || isNaN(pH)) {
        displayAcidWaterError('Please fill all fields: Dissolved O2, Operating Temperature, and pH.');
        return;
    }

    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = 1 + tempC / 150;
    const o2Factor = Math.pow(o2Ppm / 100, 0.5);  // O2 accelerates corrosion
    const phFactor = Math.max(0.5, 1.5 - pH / 7);   // Lower pH = more corrosive

    const crMpy = 3 * tempFactor * o2Factor * phFactor;

    displayAcidWaterResult(crMpy);
    document.getElementById('id_acid_water_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[Acid Water] CR:', crMpy.toFixed(2), 'mpy');
}

function displayAcidWaterResult(rateMpy) {
    document.getElementById('acid_water_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('acid_water_result').classList.remove('hidden');
    document.getElementById('acid_water_error').classList.add('hidden');
}

function displayAcidWaterError(msg) {
    document.getElementById('acid_water_error_msg').textContent = msg;
    document.getElementById('acid_water_error').classList.remove('hidden');
    document.getElementById('acid_water_result').classList.add('hidden');
}

// ============================================================================
// PHASE 3: SOIL SIDE CORROSION
// ============================================================================

async function calculateSoilCorrosionRate() {
    const coating = document.getElementById('id_soil_coating_condition')?.value;
    const cpActive = document.getElementById('id_soil_cathodic_protection')?.checked;
    const resistivity = parseFloat(document.getElementById('id_soil_resistivity_ohm_cm')?.value);

    if (!coating || isNaN(resistivity)) {
        displaySoilError('Please select Coating Condition and enter Soil Resistivity.');
        return;
    }

    // Base rates by coating condition
    const coatingRates = {
        'GOOD': 1,
        'FAIR': 3,
        'POOR': 8,
        'NONE': 15
    };

    let baseRate = coatingRates[coating] || 5;

    // CP reduces rate significantly
    if (cpActive) {
        baseRate *= 0.2;  // 80% reduction with active CP
    }

    // Resistivity effect (lower resistivity = more corrosive soil)
    const resistivityFactor = resistivity < 1000 ? 2 : resistivity < 5000 ? 1 : 0.5;

    const crMpy = baseRate * resistivityFactor;

    displaySoilResult(crMpy);
    document.getElementById('id_soil_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[Soil] CR:', crMpy.toFixed(2), 'mpy');
}

function displaySoilResult(rateMpy) {
    document.getElementById('soil_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('soil_result').classList.remove('hidden');
    document.getElementById('soil_error').classList.add('hidden');
}

function displaySoilError(msg) {
    document.getElementById('soil_error_msg').textContent = msg;
    document.getElementById('soil_error').classList.remove('hidden');
    document.getElementById('soil_result').classList.add('hidden');
}

// ============================================================================
// PHASE 3: HIGH TEMPERATURE H2S/H2 CORROSION
// ============================================================================

async function calculateHTH2SH2CorrosionRate() {
    const h2sPsi = parseFloat(document.getElementById('id_ht_h2s_partial_pressure_psia')?.value);
    const h2Psi = parseFloat(document.getElementById('id_ht_h2_partial_pressure_psia')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);

    if (isNaN(h2sPsi) || isNaN(h2Psi) || isNaN(tempF)) {
        displayHTH2SH2Error('Please fill H2S Partial Pressure, H2 Partial Pressure, and Operating Temperature.');
        return;
    }

    if (tempF < 500) {
        displayHTH2SH2Error('This mechanism applies only to temperatures > 500°F (High Temperature).');
        return;
    }

    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = Math.pow((tempC - 260) / 100, 1.5);  // Exponential at high temp
    const h2sEffect = Math.pow(h2sPsi / 10, 0.8);
    const h2Effect = Math.pow(h2Psi / 100, 0.3);  // H2 has lesser effect

    const crMpy = 5 * tempFactor * h2sEffect * (1 + h2Effect);

    displayHTH2SH2Result(crMpy);
    document.getElementById('id_ht_h2s_h2_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[HT H2S/H2] CR:', crMpy.toFixed(2), 'mpy');
}

function displayHTH2SH2Result(rateMpy) {
    document.getElementById('ht_h2s_h2_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('ht_h2s_h2_result').classList.remove('hidden');
    document.getElementById('ht_h2s_h2_error').classList.add('hidden');
}

function displayHTH2SH2Error(msg) {
    document.getElementById('ht_h2s_h2_error_msg').textContent = msg;
    document.getElementById('ht_h2s_h2_error').classList.remove('hidden');
    document.getElementById('ht_h2s_h2_result').classList.add('hidden');
}

// ============================================================================
// PHASE 3: SULFIDIC/NAPHTHENIC ACID CORROSION
// ============================================================================

async function calculateSulfidicCorrosionRate() {
    const tan = parseFloat(document.getElementById('id_sulfidic_tan')?.value);
    const sulfurWt = parseFloat(document.getElementById('id_sulfidic_sulfur_wt_percent')?.value);
    const velocity = parseFloat(document.getElementById('id_sulfidic_velocity_fps')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);

    if (isNaN(tan) || isNaN(sulfurWt) || isNaN(velocity) || isNaN(tempF)) {
        displaySulfidicError('Please fill TAN, Sulfur Content, Velocity, and Operating Temperature.');
        return;
    }

    const tempC = (tempF - 32) * 5 / 9;

    // Typical range: 450-750°F for naphthenic acid attack
    if (tempC < 230 || tempC > 400) {
        console.warn('[Sulfidic] Temperature outside typical range (450-750°F). Results may not be accurate.');
    }

    const tempFactor = tempC > 230 ? 1 + (tempC - 230) / 150 : 0.5;
    const tanFactor = Math.pow(tan / 0.5, 1.2);  // TAN strongly affects rate
    const sulfurFactor = 1 + sulfurWt / 5;
    const velocityFactor = 1 + velocity / 10;

    const crMpy = 2 * tempFactor * tanFactor * sulfurFactor * velocityFactor;

    displaySulfidicResult(crMpy);
    document.getElementById('id_sulfidic_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[Sulfidic] CR:', crMpy.toFixed(2), 'mpy');
}

function displaySulfidicResult(rateMpy) {
    document.getElementById('sulfidic_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('sulfidic_result').classList.remove('hidden');
    document.getElementById('sulfidic_error').classList.add('hidden');
}

function displaySulfidicError(msg) {
    document.getElementById('sulfidic_error_msg').textContent = msg;
    document.getElementById('sulfidic_error').classList.remove('hidden');
    document.getElementById('sulfidic_result').classList.add('hidden');
}

// ============================================================================
// COMMON POF UPDATE
// ============================================================================

function updateThinningPOF() {
    if (typeof updatePofSummary === 'function') {
        updatePofSummary();
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

if (typeof initializePhaseTwoThreeCalculations === 'undefined') {
    window.initializePhaseTwoThreeCalculations = function () {
        console.log('[Thinning] Initializing Phases 2-3 event listeners...');

        // Phase 2: Amine
        const btnAmine = document.getElementById('btn_calc_amine');
        if (btnAmine) btnAmine.addEventListener('click', calculateAmineCorrosionRate);

        // Phase 2: Alkaline Water
        const btnAlkaline = document.getElementById('btn_calc_alkaline_water');
        if (btnAlkaline) btnAlkaline.addEventListener('click', calculateAlkalineWaterCorrosionRate);

        // Phase 2: Acid Water
        const btnAcid = document.getElementById('btn_calc_acid_water');
        if (btnAcid) btnAcid.addEventListener('click', calculateAcidWaterCorrosionRate);

        // Phase 3: Soil
        const btnSoil = document.getElementById('btn_calc_soil');
        if (btnSoil) btnSoil.addEventListener('click', calculateSoilCorrosionRate);

        // Phase 3: HT H2S/H2
        const btnHTH2SH2 = document.getElementById('btn_calc_ht_h2s_h2');
        if (btnHTH2SH2) btnHTH2SH2.addEventListener('click', calculateHTH2SH2CorrosionRate);

        // Phase 3: Sulfidic
        const btnSulfidic = document.getElementById('btn_calc_sulfidic');
        if (btnSulfidic) btnSulfidic.addEventListener('click', calculateSulfidicCorrosionRate);

        console.log('[Thinning] Phases 2-3 initialized successfully');
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePhaseTwoThreeCalculations);
    } else {
        initializePhaseTwoThreeCalculations();
    }
}
