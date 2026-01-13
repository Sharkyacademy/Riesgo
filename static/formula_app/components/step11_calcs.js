/**
 * Logic for Step 11: Reliability Parameters (Beta)
 * Equation 2.18
 */

function step11_init() {
    console.log("Step 11 Init Launched");

    // UI Elements
    const artInput = document.getElementById("step11_art");
    const srpInput = document.getElementById("step11_srp");

    const beta1Span = document.getElementById("step11_beta1");
    const beta2Span = document.getElementById("step11_beta2");
    const beta3Span = document.getElementById("step11_beta3");

    const calcBtn = document.getElementById("step11_calc_btn");
    const resultContainer = document.getElementById("step11_result_container");
    const errorContainer = document.getElementById("step11_error_container");
    const errorMessageCtx = document.getElementById("step11_error_message");

    // Constants
    const COV_dt = 0.20;
    const COV_Sf = 0.20;
    const COV_P = 0.05;

    function showError(msg) {
        if (errorContainer && errorMessageCtx) {
            errorMessageCtx.textContent = msg;
            errorContainer.classList.remove("hidden");
        } else {
            alert(msg);
        }
    }

    // Load Data
    const artVal = parseFloat(sessionStorage.getItem("Art"));
    const srpVal = parseFloat(sessionStorage.getItem("SR_Thin_p"));

    // Populate Input Review
    if (!isNaN(artVal) && artInput) artInput.value = artVal.toFixed(4);
    if (!isNaN(srpVal) && srpInput) srpInput.value = srpVal.toFixed(4);

    if (isNaN(artVal) || isNaN(srpVal)) {
        showError("Missing Art (Step 5) or SRp (Step 7). Please complete previous steps.");
    }

    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateBeta();
        };
    }

    function calculateBeta() {
        if (errorContainer) errorContainer.classList.add("hidden");
        if (resultContainer) resultContainer.classList.add("hidden");

        if (isNaN(artVal) || isNaN(srpVal)) {
            showError("Cannot calculate Beta without valid Art and Strength Ratio.");
            return;
        }

        // Helper for Eq 2.18
        function getBeta(Ds) {
            // Numerator: 1 - Ds*Art - SRp
            const num = 1 - (Ds * artVal) - srpVal;

            // Denominator components
            // (Ds * Art * COV_dt)^2
            const term1 = Math.pow(Ds * artVal * COV_dt, 2);

            // ((1 - Ds*Art) * COV_Sf)^2
            const term2 = Math.pow((1 - Ds * artVal) * COV_Sf, 2);

            // (SRp * COV_P)^2
            const term3 = Math.pow(srpVal * COV_P, 2);

            const denom = Math.sqrt(term1 + term2 + term3);

            if (denom === 0) return 0; // Avoid div by zero
            return num / denom;
        }

        const beta1 = getBeta(1);
        const beta2 = getBeta(2);
        const beta3 = getBeta(4);

        if (beta1Span) beta1Span.textContent = beta1.toFixed(4);
        if (beta2Span) beta2Span.textContent = beta2.toFixed(4);
        if (beta3Span) beta3Span.textContent = beta3.toFixed(4);

        if (resultContainer) resultContainer.classList.remove("hidden");

        // Save Results
        const betas = { beta1, beta2, beta3 };
        sessionStorage.setItem("reliability_parameters_beta", JSON.stringify(betas));
        console.log("Calculated Betas:", betas);

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }
    }
}

window.step11_init = step11_init;
