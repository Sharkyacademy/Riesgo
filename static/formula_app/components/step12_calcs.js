/**
 * Logic for Step 12: Base Thinning Damage Factor
 * Equation 2.19
 */

function step12_init() {
    console.log("Step 12 Init Launched");

    // UI Elements
    const po1Disp = document.getElementById("step12_po1");
    const po2Disp = document.getElementById("step12_po2");
    const po3Disp = document.getElementById("step12_po3");

    const beta1Disp = document.getElementById("step12_beta1");
    const beta2Disp = document.getElementById("step12_beta2");
    const beta3Disp = document.getElementById("step12_beta3");

    const resultVal = document.getElementById("step12_result");
    const calcBtn = document.getElementById("step12_calc_btn");
    const resultContainer = document.getElementById("step12_result_container");
    const errorContainer = document.getElementById("step12_error_container");
    const errorMessageCtx = document.getElementById("step12_error_message");

    function showError(msg) {
        if (errorContainer && errorMessageCtx) {
            errorMessageCtx.textContent = msg;
            errorContainer.classList.remove("hidden");
        } else {
            alert(msg);
        }
    }

    /**
     * Standard Normal Cumulative Distribution Function (CDF)
     * High precision approximation using the error function (erf).
     * Accuracy: Maximum error less than 1.5 x 10^-7.
     */
    function stdNormalCDF(x) {
        return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
    }

    // Approximation of the error function erf(x)
    // Source: Abramowitz and Stegun 7.1.26
    function erf(x) {
        // save the sign of x
        var sign = (x >= 0) ? 1 : -1;
        x = Math.abs(x);

        // constants
        var a1 = 0.254829592;
        var a2 = -0.284496736;
        var a3 = 1.421413741;
        var a4 = -1.453152027;
        var a5 = 1.061405429;
        var p = 0.3275911;

        // A&S formula 7.1.26
        var t = 1.0 / (1.0 + p * x);
        var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    // Load Data
    let posteriors = null;
    let betas = null;

    try {
        posteriors = JSON.parse(sessionStorage.getItem("posterior_probabilities"));
        betas = JSON.parse(sessionStorage.getItem("reliability_parameters_beta"));
    } catch (e) {
        console.error(e);
    }

    // Populate UI Table
    if (posteriors && betas) {
        if (po1Disp) po1Disp.textContent = (posteriors.Po1 * 100).toFixed(2) + "%";
        if (po2Disp) po2Disp.textContent = (posteriors.Po2 * 100).toFixed(2) + "%";
        if (po3Disp) po3Disp.textContent = (posteriors.Po3 * 100).toFixed(2) + "%";

        if (beta1Disp) beta1Disp.textContent = betas.beta1.toFixed(4);
        if (beta2Disp) beta2Disp.textContent = betas.beta2.toFixed(4);
        if (beta3Disp) beta3Disp.textContent = betas.beta3.toFixed(4);
    } else {
        showError("Missing data from Step 10 or Step 11.");
    }

    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateDF();
        };
    }

    function calculateDF() {
        if (errorContainer) errorContainer.classList.add("hidden");
        if (resultContainer) resultContainer.classList.add("hidden");

        if (!posteriors || !betas) {
            showError("Missing required data (Po or Beta).");
            return;
        }

        // Equation 2.19
        // Dfb = [ Po1 * CDF(-Beta1) + Po2 * CDF(-Beta2) + Po3 * CDF(-Beta3) ] / 1.56E-4

        const term1 = posteriors.Po1 * stdNormalCDF(-betas.beta1);
        const term2 = posteriors.Po2 * stdNormalCDF(-betas.beta2);
        const term3 = posteriors.Po3 * stdNormalCDF(-betas.beta3);

        const numerator = term1 + term2 + term3;
        const denominator = 1.56e-4;

        const dfB = numerator / denominator;

        if (resultVal) resultVal.textContent = dfB.toFixed(4);

        if (resultContainer) resultContainer.classList.remove("hidden");

        // Save Result
        sessionStorage.setItem("base_df_thin", dfB.toFixed(4));
        console.log("Final Base DF:", dfB);

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }
    }
}

window.step12_init = step12_init;
