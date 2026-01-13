/**
 * Step 5 Logic: Determine Art Parameter
 * Equation 2.12
 */

function step5_init() {
    // UI Elements
    const crbmInput = document.getElementById("step5_crbm");
    const agetkInput = document.getElementById("step5_agetk");
    const trdiInput = document.getElementById("step5_trdi");
    const agercInput = document.getElementById("step5_agerc");
    const calcBtn = document.getElementById("step5_calc_btn");
    const resultContainer = document.getElementById("step5_result_container");
    const artResultSpan = document.getElementById("step5_art_result");
    const unitCorrSpans = document.querySelectorAll(".unit_corrosion");
    const unitThickSpans = document.querySelectorAll(".unit_thickness");

    // Load Data from Session Storage
    const crbm = parseFloat(sessionStorage.getItem("Cr_bm") || sessionStorage.getItem("corrosion_rate_bm") || sessionStorage.getItem("corrosion_rate") || 0);
    const agetk = parseFloat(sessionStorage.getItem("age_tk") || 0);
    const trdi = parseFloat(sessionStorage.getItem("t_rdi") || 0);

    // Determine age_rc (Liner takes precedence or check both?)
    // If liner exists, use liner_age_rc. Else if cladding, use age_rc.
    let agerc = 0;
    const linerAge = parseFloat(sessionStorage.getItem("liner_age_rc"));
    const cladAge = parseFloat(sessionStorage.getItem("age_rc"));

    if (!isNaN(linerAge) && linerAge > 0) {
        agerc = linerAge;
    } else if (!isNaN(cladAge) && cladAge > 0) {
        agerc = cladAge;
    }

    // Determine Units for Display
    const tableDataStr = sessionStorage.getItem('table4.1_data');
    let unitCorr = "mpy";
    let unitThick = "in";

    if (tableDataStr) {
        try {
            const data = JSON.parse(tableDataStr);
            if (data.measurement_unit && data.measurement_unit.toLowerCase() === "celsius") {
                unitCorr = "mm/yr";
                unitThick = "mm";
            }
        } catch (e) { }
    }

    // Populate UI
    if (crbmInput) crbmInput.value = crbm.toFixed(4);
    if (agetkInput) agetkInput.value = agetk.toFixed(3);
    if (trdiInput) trdiInput.value = trdi.toFixed(3);
    if (agercInput) agercInput.value = agerc.toFixed(3);

    // Update Unit Labels
    unitCorrSpans.forEach(s => s.textContent = unitCorr);
    unitThickSpans.forEach(s => s.textContent = unitThick);


    // Calculation Logic
    function calculateArt() {
        // formula: Art = max [ (Cr,bm * (agetk - agerc)) / trdi , 0 ]

        // Safety check zero division
        if (trdi <= 0) {
            alert("Last Known Thickness (t_rdi) is zero or invalid. Cannot calculate Art.");
            return;
        }

        let numerator = crbm * (agetk - agerc);
        let art = Math.max(numerator / trdi, 0.0);

        // Save Result
        sessionStorage.setItem("A_rt", art.toFixed(4));

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }

        // Display
        if (resultContainer && artResultSpan) {
            resultContainer.classList.remove("hidden");
            artResultSpan.textContent = art.toFixed(4);
        }
    }

    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateArt();
        };
    }
}

window.step5_init = step5_init;
