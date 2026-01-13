/**
 * Step 6 Logic: Calculate Flow Stress (FS_Thin)
 * Equation 2.13
 */

function step6_init() {
    // UI Elements
    const ysInput = document.getElementById("step6_ys");
    const tsInput = document.getElementById("step6_ts");
    const effInput = document.getElementById("step6_efficiency");
    const calcBtn = document.getElementById("step6_calc_btn");
    const resultContainer = document.getElementById("step6_result_container");
    const resultSpan = document.getElementById("step6_result");
    const unitSpans = document.querySelectorAll(".unit_stress");

    // Load Data from Session Storage
    const tableDataStr = sessionStorage.getItem("table4.1_data");
    let ys = 0;
    let ts = 0;
    let efficiency = 1.0;
    let unitStress = "psi"; // default

    if (tableDataStr) {
        try {
            const data = JSON.parse(tableDataStr);
            ys = parseFloat(data.yield_strength) || 0;
            ts = parseFloat(data.tensile_strength) || 0;
            efficiency = parseFloat(data.weld_joint_efficiency) || 1.0;

            // Assuming efficiency input is 0-1 or 0-100?
            // In step4_calcs we saw: if (E > 1.0) E = E / 100.0;
            // Let's replicate that logic for safety.
            if (efficiency > 1.0) efficiency = efficiency / 100.0;

            // Determine Unit
            // Usually ksi or psi. If data unit is metric (Celsius), stress might be MPa.
            if (data.measurement_unit && data.measurement_unit.toLowerCase() === "celsius") {
                unitStress = "MPa";
            }
        } catch (e) {
            console.error("Error parsing Step 1 data for Step 6", e);
        }
    }

    // Populate UI
    if (ysInput) ysInput.value = ys;
    if (tsInput) tsInput.value = ts;
    if (effInput) effInput.value = efficiency;

    // Update Units
    unitSpans.forEach(s => s.textContent = unitStress);

    // Calculation Logic
    function calculateFlowStress() {
        // Equation 2.13: FS_Thin = ((YS + TS) / 2) * E * 1.1

        const avgStrength = (ys + ts) / 2;
        const fsThin = avgStrength * efficiency * 1.1;

        // Save Result
        sessionStorage.setItem("FS_Thin", fsThin.toFixed(4));

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }

        // Display
        if (resultContainer && resultSpan) {
            resultContainer.classList.remove("hidden");
            resultSpan.textContent = fsThin.toFixed(4);
        }
    }

    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateFlowStress();
        };
    }
}

window.step6_init = step6_init;
