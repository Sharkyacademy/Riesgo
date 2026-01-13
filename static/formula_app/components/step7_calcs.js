/**
 * Step 7 Logic: Calculate Strength Ratio (SR_Thin_p)
 * Equation 2.14
 */

function step7_init() {
    // UI Elements
    const sInput = document.getElementById("step7_stress");
    const effInput = document.getElementById("step7_efficiency");
    const fsInput = document.getElementById("step7_fs");
    const tminInput = document.getElementById("step7_tmin");
    const tcInput = document.getElementById("step7_tc");
    const trdiInput = document.getElementById("step7_trdi");
    const calcBtn = document.getElementById("step7_calc_btn");
    const resultContainer = document.getElementById("step7_result_container");
    const resultSpan = document.getElementById("step7_result");
    const unitStressSpans = document.querySelectorAll(".unit_stress");
    const unitThickSpans = document.querySelectorAll(".unit_thickness");

    // Load Data
    const tableDataStr = sessionStorage.getItem("table4.1_data");
    const savedStress = parseFloat(sessionStorage.getItem("allowable_stress")); // Undefined if manual in step 4
    const fs = parseFloat(sessionStorage.getItem("FS_Thin") || 0);
    const tmin = parseFloat(sessionStorage.getItem("t_min") || 0);
    const trdi = parseFloat(sessionStorage.getItem("t_rdi") || 0);
    const savedTc = parseFloat(sessionStorage.getItem("structural_thickness_tc") || 0);

    let efficiency = 1.0;
    let unitStress = "psi";
    let unitThick = "in";

    if (tableDataStr) {
        try {
            const data = JSON.parse(tableDataStr);
            efficiency = parseFloat(data.weld_joint_efficiency) || 1.0;
            if (efficiency > 1.0) efficiency = efficiency / 100.0;

            if (data.measurement_unit && data.measurement_unit.toLowerCase() === "celsius") {
                unitStress = "MPa";
                unitThick = "mm";
            }
        } catch (e) { console.error(e); }
    }

    // Populate UI
    if (sInput && !isNaN(savedStress)) sInput.value = savedStress;
    if (effInput) effInput.value = efficiency;
    if (fsInput) fsInput.value = fs;
    if (tminInput) tminInput.value = tmin;
    if (trdiInput) trdiInput.value = trdi;
    if (tcInput && savedTc) tcInput.value = savedTc;

    // Update Units
    unitStressSpans.forEach(s => s.textContent = unitStress);
    unitThickSpans.forEach(s => s.textContent = unitThick);

    // Calculate
    function calculateSR() {
        // Equation 2.14: SR = (S * E / FS) * (max(tmin, tc) / trdi)

        const S = parseFloat(sInput.value);
        const tc = parseFloat(tcInput.value) || 0;

        if (isNaN(S) || S <= 0) {
            alert("Please enter a valid Allowable Stress (S).");
            return;
        }

        if (fs <= 0) {
            alert("Flow Stress (FS) is invalid (0). Check Step 6.");
            return;
        }

        if (trdi <= 0) {
            alert("Measured Thickness (trdi) is invalid (0). Check Step 3.");
            return;
        }

        const term1 = (S * efficiency) / fs;
        const term2 = Math.max(tmin, tc) / trdi;

        const SR = term1 * term2;

        // Save
        sessionStorage.setItem("strength_ratio_p", SR.toFixed(4));
        sessionStorage.setItem("structural_thickness_tc", tc); // Save tc if user entered it

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }

        // Display
        resultContainer.classList.remove("hidden");
        resultSpan.textContent = SR.toFixed(4);
    }

    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateSR();
        };
    }
}

window.step7_init = step7_init;
