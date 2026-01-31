
/**
 * Brittle Fracture Calculation Module
 * Implements API 581 Part 2, Section 2.E logic.
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log("Brittle Fracture Module Loaded");

    // Inputs
    const activeCheck = document.getElementById('id_mechanism_brittle_fracture_active');
    const adminCheck = document.getElementById('id_brittle_admin_controls');
    const minTempInput = document.getElementById('id_brittle_min_operating_temp_f');
    const cetInput = document.getElementById('id_brittle_cet_f');
    const pwhtCheck = document.getElementById('id_brittle_pwht');
    const curveInput = document.getElementById('id_brittle_curve');
    const yieldInput = document.getElementById('id_brittle_yield_strength_ksi');
    const matTypeInput = document.getElementById('id_brittle_material_type');

    // Outputs
    const dfDisplay = document.getElementById('disp_brittle_df');
    const trefDisplay = document.getElementById('disp_brittle_tref');
    const thicknessDisplay = document.getElementById('disp_brittle_thickness');
    // Hidden Fields
    const dfHidden = document.getElementById('id_brittle_damage_factor'); // Might be dynamically named by django form

    const contentDiv = document.getElementById('brittle_carbon_content');

    // Event Listeners
    const inputs = [activeCheck, adminCheck, minTempInput, cetInput, pwhtCheck, curveInput, yieldInput, matTypeInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('change', calculateBrittleFactor);
            input.addEventListener('input', calculateBrittleFactor);
        }
    });

    if (activeCheck) {
        activeCheck.addEventListener('change', toggleContent);
        toggleContent(); // Init
    }

    function toggleContent() {
        if (activeCheck && contentDiv) {
            if (activeCheck.checked) {
                contentDiv.classList.remove('hidden');
                calculateBrittleFactor();
            } else {
                contentDiv.classList.add('hidden');
                updateDf(0);
            }
        }
    }

    function getFloat(id) {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) : NaN;
    }

    function calculateBrittleFactor() {
        if (!activeCheck || !activeCheck.checked) return;

        // 1. Admin Controls
        if (adminCheck && adminCheck.checked) {
            updateDf(0);
            return;
        }

        // 2. Determine CET (Use input)
        const cet = getFloat('id_brittle_cet_f');
        if (isNaN(cet)) {
            // If CET missing, maybe default to Min Operating Temp?
            // API 581 says CET is usually MDMT or Min Op Temp.
            // For now, if missing, return.
            updateDf(0); // Or handle invalid state
            return;
        }

        // 3. Determine Tref
        // TODO: Implement Curve Tables (API 579/581)
        // For now, we will use a placeholder or 0 if not implemented.
        let tref = 0;

        // Mocking Tref based on Curve for demo/placeholder
        // Logic: Tref increases with Thickness.
        // Needs proper lookup.
        // If user provided Curve, we could approximate.

        if (trefDisplay) trefDisplay.innerText = tref.toFixed(0);

        // 4. Calculate (CET - Tref)
        const delta = cet - tref;

        // 5. Determine Df based on (CET - Tref) and Thickness/PWHT
        // Table 2.E.1 or Eq 2.E.something
        // Simplified Logic for placeholder:
        // If (CET - Tref) > 0, Low Risk.
        // If (CET - Tref) < -50, High Risk.

        // Need Reference Thickness
        // const thickness = getFloat('id_thickness_nominal_mm') / 25.4; // Convert to inch
        // Wait, thickness field ID needs to be verified.

        let df = 0;

        // Placeholder Logic (Replace with actual Table 2.E.1)
        if (delta >= -20) {
            df = 0.1; // Very low
        } else if (delta >= -50) {
            df = 10;
        } else {
            df = 100; // High
        }

        // PWHT Credit
        if (pwhtCheck && pwhtCheck.checked) {
            df = Math.max(0.1, df * 0.5); // Example credit
        }

        updateDf(df);
    }

    function updateDf(val) {
        if (dfDisplay) dfDisplay.innerText = val.toFixed(2);
        if (dfHidden) dfHidden.value = val;

        // Update Chart
        if (typeof updatePofSummary === 'function') {
            updatePofSummary();
        }
    }

    // Init
    calculateBrittleFactor();
});
