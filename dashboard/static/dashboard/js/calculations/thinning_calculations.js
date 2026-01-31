/**
 * Thinning (Metal Loss) Calculations
 * Ported from formula_app/components/modules-step2/
 */

// ====================
// CO2 CORROSION
// ====================

/**
 * Calculate CO2 Corrosion Rate using API 581 equations
 * Based on formula_app/components/modules-step2/co2_corrosion_calcs.js
 */
async function calculateCO2CorrosionRate() {
    console.log('[CO2] Starting calculation...');

    // Get inputs
    const co2Mol = parseFloat(document.getElementById('id_co2_concentration_mol_percent')?.value);
    const shearPa = parseFloat(document.getElementById('id_co2_shear_stress_pa')?.value);
    const tempF = parseFloat(document.getElementById('id_operating_temp_f')?.value);
    const pressurePsia = parseFloat(document.getElementById('id_operating_pressure_psia')?.value);
    const pH = parseFloat(document.getElementById('id_ph_value')?.value);

    // Validate inputs
    const errors = [];
    if (isNaN(co2Mol) || co2Mol < 0) errors.push('CO2 Concentration must be a positive number');
    if (isNaN(shearPa) || shearPa < 0) errors.push('Shear Stress must be a positive number');
    if (isNaN(tempF)) errors.push('Operating Temperature is required (set in Operating & Process tab)');
    if (isNaN(pressurePsia)) errors.push('Operating Pressure is required (set in Operating & Process tab)');
    if (isNaN(pH)) errors.push('pH is required (set in Operating & Process tab)');

    if (errors.length > 0) {
        displayCO2Error(errors.join('<br>'));
        return;
    }

    try {
        console.log('========== CO2 CALCULATION DEBUG ==========');
        console.log('INPUTS:');
        console.log('  CO2 Concentration:', co2Mol, 'mol %');
        console.log('  Shear Stress:', shearPa, 'Pa');
        console.log('  Temperature:', tempF, '°F');
        console.log('  Pressure:', pressurePsia, 'psia');
        console.log('  pH:', pH);

        // Step 1: Convert pressure to bar
        const pressureBar = pressurePsia * 0.0689476;
        console.log('\nSTEP 1 - Pressure Conversion:');
        console.log('  Pressure (bar):', pressureBar.toFixed(4));

        // Step 2: Calculate partial pressure of CO2 (bar)
        const pCO2Bar = (co2Mol / 100) * pressureBar;
        console.log('\nSTEP 2 - Partial Pressure CO2:');
        console.log('  p_CO2 = (', co2Mol, '/ 100) ×', pressureBar.toFixed(4), '=', pCO2Bar.toFixed(4), 'bar');

        // Step 3: Calculate temperature in Celsius
        const tempC = (tempF - 32) * 5 / 9;
        console.log('\nSTEP 3 - Temperature Conversion:');
        console.log('  Temp (°C):', tempC.toFixed(2), '°C');

        // Step 4: Calculate fugacity f_CO2 (Equation 2.B.30 & 2.B.32)
        console.log('\nSTEP 4 - Fugacity Calculation (Eq 2.B.30):');
        const termP = Math.min(250, pCO2Bar);
        console.log('  termP = min(250,', pCO2Bar.toFixed(4), ') =', termP.toFixed(4));

        const termA = 0.0031 - (1.4 / (tempC + 273));
        console.log('  termA = 0.0031 - (1.4 / (', tempC.toFixed(2), '+ 273)) =', termA.toFixed(6));

        const logA = termP * termA;
        console.log('  log10(a) =', termP.toFixed(4), '×', termA.toFixed(6), '=', logA.toFixed(6));

        const a = Math.pow(10, logA);
        console.log('  a = 10^(', logA.toFixed(6), ') =', a.toFixed(6));

        const fCO2Bar = a * pCO2Bar;
        console.log('  f_CO2 =', a.toFixed(6), '×', pCO2Bar.toFixed(4), '=', fCO2Bar.toFixed(4), 'bar');

        // Step 5: Lookup f(T, pH) from Table 2.B.13.2
        const fTpH = await interpolateFTpH(tempF, pH);
        console.log('\nSTEP 5 - f(T, pH) Interpolation from Table 2.B.13.2:');
        console.log('  f(', tempF, '°F,', pH, ') =', fTpH.toFixed(4));

        // Step 6: Calculate shear term (default to 1.0 if shear stress is 0)
        let shearTerm = 1.0; // Default per API 581
        if (shearPa > 0) {
            shearTerm = Math.pow((shearPa / 19), 0.146);
        }
        console.log('\nSTEP 6 - Shear Term:');
        console.log('  Shear Stress:', shearPa, 'Pa');
        if (shearPa > 0) {
            console.log('  Shear Term = (', shearPa, '/ 19)^0.146 =', shearTerm.toFixed(4));
        } else {
            console.log('  Shear Term = 1.0 (default, no shear stress provided)');
        }

        // Step 7: Calculate corrosion rate (Equation 2.B.26)
        // CR_mm_yr = 0.0324 * f(T, pH) * (f_CO2)^0.62 * (S / 19)^0.146
        const crMmYr = 0.0324 * fTpH * Math.pow(fCO2Bar, 0.62) * shearTerm;
        console.log('\nSTEP 7 - Corrosion Rate (Eq 2.B.26):');
        console.log('  CR = 0.0324 × f(T,pH) × (f_CO2)^0.62 × shearTerm');
        console.log('  CR = 0.0324 ×', fTpH.toFixed(4), '× (', fCO2Bar.toFixed(4), ')^0.62 ×', shearTerm.toFixed(4));
        console.log('  CR = 0.0324 ×', fTpH.toFixed(4), '×', Math.pow(fCO2Bar, 0.62).toFixed(4), '×', shearTerm.toFixed(4));
        console.log('  CR (mm/yr):', crMmYr.toFixed(4), 'mm/yr');

        // Step 8: Convert to mpy
        const crMpy = crMmYr * 39.4;
        console.log('\nSTEP 8 - Final Result:');
        console.log('  CR (mpy) =', crMmYr.toFixed(4), '× 39.4 =', crMpy.toFixed(2), 'mpy');
        console.log('==========================================\n');

        // Update UI
        displayCO2Result(crMpy);

        // Save to model field
        document.getElementById('id_co2_corrosion_rate_mpy').value = crMpy.toFixed(2);

        // Calculate proper Damage Factor per API 581
        const commissioningDate = document.getElementById('id_commissioning_date')?.value;
        const age = commissioningDate ? calculateAgeFromDate(commissioningDate) : 10;
        const tMin = parseFloat(document.getElementById('id_min_required_thickness_in')?.value) || null;
        const fca = parseFloat(document.getElementById('id_future_corrosion_allowance_in')?.value) || null;

        let df;
        if (tMin !== null && fca !== null) {
            const denominator = tMin - fca;
            df = denominator > 0 ? (crMpy * age) / denominator : 9999;
        } else {
            df = crMpy * age; // Simplified
        }

        // Update debug panel
        if (typeof updateDebugFields === 'function') {
            updateDebugFields('co2', {
                rate: crMpy,
                fugacity: fCO2Bar,
                df: df
            });
        }

        // Update POF summary and chart
        if (typeof updatePofSummary === 'function') {
            updatePofSummary();
        }

        console.log('[CO2] Calculation complete:', crMpy.toFixed(2), 'mpy, DF:', df.toFixed(2));

    } catch (error) {
        console.error('[CO2] Calculation error:', error);
        displayCO2Error('Calculation failed: ' + error.message);
    }
}

/**
 * Interpolate f(T, pH) from Table 2.B.13.2
 * Bilinear interpolation between temperature and pH
 */
async function interpolateFTpH(tempF, pH) {
    // Load table data
    const response = await fetch('/static/formula_app/data/json/co2_corrosion/table_2b132.JSON');
    const tableData = await response.json();

    const data = tableData.temperature_in_f;
    const temps = Object.keys(data).map(Number).sort((a, b) => a - b);

    // Find surrounding temperatures
    let tLow = temps[0];
    let tHigh = temps[temps.length - 1];

    for (let i = 0; i < temps.length - 1; i++) {
        if (tempF >= temps[i] && tempF <= temps[i + 1]) {
            tLow = temps[i];
            tHigh = temps[i + 1];
            break;
        }
    }

    // Clamp to boundaries
    if (tempF < temps[0]) { tLow = tHigh = temps[0]; }
    if (tempF > temps[temps.length - 1]) { tLow = tHigh = temps[temps.length - 1]; }

    // Helper function to get value at (T, pH)
    function getVal(t, p) {
        const row = data[t.toString()];
        if (!row) return 0;

        const phs = Object.keys(row).map(Number).sort((a, b) => a - b);

        // Clamp pH
        const pEff = Math.max(phs[0], Math.min(p, phs[phs.length - 1]));

        let pLow = phs[0];
        let pHigh = phs[phs.length - 1];

        for (let i = 0; i < phs.length - 1; i++) {
            if (pEff >= phs[i] && pEff <= phs[i + 1]) {
                pLow = phs[i];
                pHigh = phs[i + 1];
                break;
            }
        }

        const vLow = row[pLow.toFixed(1)];
        const vHigh = row[pHigh.toFixed(1)];

        // Linear interp for pH
        if (pHigh === pLow) return vLow;
        return vLow + (vHigh - vLow) * (pEff - pLow) / (pHigh - pLow);
    }

    const valTLow = getVal(tLow, pH);
    const valTHigh = getVal(tHigh, pH);

    // Linear interp for Temp
    if (tHigh === tLow) return valTLow;
    return valTLow + (valTHigh - valTLow) * (tempF - tLow) / (tHigh - tLow);
}

/**
 * Display CO2 result
 */
function displayCO2Result(rateMpy) {
    const resultDiv = document.getElementById('co2_result');
    const rateDisplay = document.getElementById('co2_rate_display');
    const errorDiv = document.getElementById('co2_error');

    if (resultDiv && rateDisplay) {
        rateDisplay.textContent = rateMpy.toFixed(2) + ' mpy';
        resultDiv.classList.remove('hidden');
    }

    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

/**
 * Display CO2 error
 */
function displayCO2Error(message) {
    const resultDiv = document.getElementById('co2_result');
    const errorDiv = document.getElementById('co2_error');
    const errorMsg = document.getElementById('co2_error_msg');

    if (errorDiv && errorMsg) {
        errorMsg.innerHTML = message;
        errorDiv.classList.remove('hidden');
    }

    if (resultDiv) {
        resultDiv.classList.add('hidden');
    }
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    const btnCalcCO2 = document.getElementById('btn_calc_co2');
    if (btnCalcCO2) {
        btnCalcCO2.addEventListener('click', calculateCO2CorrosionRate);
    }
});
