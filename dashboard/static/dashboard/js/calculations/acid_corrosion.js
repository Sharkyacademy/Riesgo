/**
 * ACID CORROSION CALCULATIONS
 * Simplified implementations for HCl, H2SO4, HF
 * Based on empirical formulas until full API 581 tables are available
 */

// ============================================================================
// HCl CORROSION
// ============================================================================

async function calculateHClCorrosionRate() {
    const hclConc = parseFloat(document.getElementById('id_hcl_concentration_wt_percent')?.value);
    const velocity = parseFloat(document.getElementById('id_hcl_velocity_fps')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);
    const pH = parseFloat(document.getElementById('id_ph_value')?.value);


    // DEBUG: Log all values
    console.log('[HCl DEBUG] Raw values:');
    console.log('  - HCl Conc field:', document.getElementById('id_hcl_concentration_wt_percent'));
    console.log('  - HCl Conc value:', document.getElementById('id_hcl_concentration_wt_percent')?.value);
    console.log('  - HCl Conc parsed:', hclConc);
    console.log('  - Velocity field:', document.getElementById('id_hcl_velocity_fps'));
    console.log('  - Velocity value:', document.getElementById('id_hcl_velocity_fps')?.value);
    console.log('  - Velocity parsed:', velocity);
    console.log('  - Temp field:', document.getElementById('id_operating_temp_f'));
    console.log('  - Temp value:', document.getElementById('id_operating_temp_f')?.value);
    console.log('  - Temp parsed:', tempF);
    console.log('  - pH field:', document.getElementById('id_ph_value'));
    console.log('  - pH value:', document.getElementById('id_ph_value')?.value);
    console.log('  - pH parsed:', pH);
    console.log('  - isNaN checks:', {
        hclConc: isNaN(hclConc),
        velocity: isNaN(velocity),
        tempF: isNaN(tempF),
        pH: isNaN(pH)
    });

    // Validation
    if (isNaN(hclConc) || isNaN(velocity) || isNaN(tempF) || isNaN(pH)) {
        displayHClError('Please fill in all required fields: HCl Concentration, Velocity, Operating Temperature, and pH.');
        return;
    }

    // Simplified formula (Empirical - needs API 581 table for production)
    // CR (m py) ≈ K × Conc^0.8 × (1 + Velocity/10) × f(T) × f(pH)
    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = 1 + (tempC - 25) / 100; // Simplified temperature effect
    const velocityFactor = 1 + velocity / 10;
    const phFactor = Math.max(0.1, 1.5 - pH / 10); // Lower pH → higher corrosion

    const crMpy = 5 * Math.pow(hclConc / 10, 0.8) * velocityFactor * tempFactor * phFactor;

    // Update UI
    displayHClResult(crMpy);

    // Save to model
    document.getElementById('id_hcl_corrosion_rate_mpy').value = crMpy.toFixed(2);

    // Update POF
    updateThinningPOF();

    console.log('[HCl] Calculation complete:', crMpy.toFixed(2), 'mpy');
}

function displayHClResult(rateMpy) {
    document.getElementById('hcl_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('hcl_result').classList.remove('hidden');
    document.getElementById('hcl_error').classList.add('hidden');
}

function displayHClError(msg) {
    document.getElementById('hcl_error_msg').textContent = msg;
    document.getElementById('hcl_error').classList.remove('hidden');
    document.getElementById('hcl_result').classList.add('hidden');
}

// ============================================================================
// H2SO4 CORROSION
// ============================================================================

async function calculateH2SO4CorrosionRate() {
    const concWt = parseFloat(document.getElementById('id_h2so4_concentration_wt_percent')?.value);
    const velocity = parseFloat(document.getElementById('id_h2so4_velocity_fps')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);

    if (isNaN(concWt) || isNaN(velocity) || isNaN(tempF)) {
        displayH2SO4Error('Please fill in all required fields: H2SO4 Concentration, Velocity, and Operating Temperature.');
        return;
    }

    // Simplified formula (Empirical)
    // H2SO4 has minimum at ~85% concentration
    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = 1 + (tempC - 25) / 80;
    const velocityFactor = 1 + velocity / 15;

    // Concentration effect: minimum near 85%, higher below and above
    const concFactor = Math.abs(concWt - 85) / 20 + 0.5;

    const crMpy = 3 * concFactor * velocityFactor * tempFactor;

    displayH2SO4Result(crMpy);
    document.getElementById('id_h2so4_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[H2SO4] Calculation complete:', crMpy.toFixed(2), 'mpy');
}

function displayH2SO4Result(rateMpy) {
    document.getElementById('h2so4_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('h2so4_result').classList.remove('hidden');
    document.getElementById('h2so4_error').classList.add('hidden');
}

function displayH2SO4Error(msg) {
    document.getElementById('h2so4_error_msg').textContent = msg;
    document.getElementById('h2so4_error').classList.remove('hidden');
    document.getElementById('h2so4_result').classList.add('hidden');
}

// ============================================================================
// HF CORROSION
// ============================================================================

async function calculateHFCorrosionRate() {
    const concWt = parseFloat(document.getElementById('id_hf_concentration_wt_percent')?.value);
    const velocity = parseFloat(document.getElementById('id_hf_velocity_fps')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);

    if (isNaN(concWt) || isNaN(velocity) || isNaN(tempF)) {
        displayHFError('Please fill in all required fields: HF Concentration, Velocity, and Operating Temperature.');
        return;
    }

    // Simplified formula (Empirical)
    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = 1 + (tempC - 25) / 100;
    const velocityFactor = 1 + velocity / 8;
    const concFactor = Math.pow(concWt / 20, 0.7);

    const crMpy = 4 * concFactor * velocityFactor * tempFactor;

    displayHFResult(crMpy);
    document.getElementById('id_hf_corrosion_rate_mpy').value = crMpy.toFixed(2);
    updateThinningPOF();

    console.log('[HF] Calculation complete:', crMpy.toFixed(2), 'mpy');
}

function displayHFResult(rateMpy) {
    document.getElementById('hf_rate_display').textContent = `${rateMpy.toFixed(2)} mpy`;
    document.getElementById('hf_result').classList.remove('hidden');
    document.getElementById('hf_error').classList.add('hidden');
}

function displayHFError(msg) {
    document.getElementById('hf_error_msg').textContent = msg;
    document.getElementById('hf_error').classList.remove('hidden');
    document.getElementById('hf_result').classList.add('hidden');
}

// ============================================================================
// COMMON THINNING POF UPDATE
// ============================================================================

function updateThinningPOF() {
    if (typeof updatePofSummary === 'function') {
        updatePofSummary();
    }
}

// Event listeners (called from HTML button onclick)
if (typeof initializeThinningCalculations === 'undefined') {
    window.initializeThinningCalculations = function () {
        console.log('[Thinning] Initializing calculation event listeners...');

        // HCl
        const btnHCl = document.getElementById('btn_calc_hcl');
        if (btnHCl) {
            btnHCl.addEventListener('click', calculateHClCorrosionRate);
        }

        // H2SO4
        const btnH2SO4 = document.getElementById('btn_calc_h2so4');
        if (btnH2SO4) {
            btnH2SO4.addEventListener('click', calculateH2SO4CorrosionRate);
        }

        // HF
        const btnHF = document.getElementById('btn_calc_hf');
        if (btnHF) {
            btnHF.addEventListener('click', calculateHFCorrosionRate);
        }

        console.log('[Thinning] Phase 1 (Acids) initialized successfully');
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeThinningCalculations);
    } else {
        initializeThinningCalculations();
    }
}
