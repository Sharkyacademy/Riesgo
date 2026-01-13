/**
 * Logic for Step 10: Posterior Probabilities (Po)
 * Equation 2.17
 */

function step10_init() {
    console.log("Step 10 Init Launched");

    // UI Elements
    const i1Input = document.getElementById("step10_i1");
    const i2Input = document.getElementById("step10_i2");
    const i3Input = document.getElementById("step10_i3");

    const po1Span = document.getElementById("step10_po1");
    const po2Span = document.getElementById("step10_po2");
    const po3Span = document.getElementById("step10_po3");
    const sumSpan = document.getElementById("step10_sum");

    const calcBtn = document.getElementById("step10_calc_btn");
    const resultContainer = document.getElementById("step10_result_container");

    const errorContainer = document.getElementById("step10_error_container");
    const errorMessageCtx = document.getElementById("step10_error_message");

    function showError(msg) {
        if (errorContainer && errorMessageCtx) {
            errorMessageCtx.textContent = msg;
            errorContainer.classList.remove("hidden");
        } else {
            alert(msg);
        }
    }

    // Load Data from Step 9
    let iFactors = null;
    const iStr = sessionStorage.getItem("inspection_effectiveness_factors");
    if (iStr) {
        try {
            iFactors = JSON.parse(iStr);
        } catch (e) { console.error(e); }
    }

    // Populate Input Review
    if (iFactors) {
        if (i1Input) i1Input.value = iFactors.I1 ? iFactors.I1.toExponential(4) : "0";
        if (i2Input) i2Input.value = iFactors.I2 ? iFactors.I2.toExponential(4) : "0";
        if (i3Input) i3Input.value = iFactors.I3 ? iFactors.I3.toExponential(4) : "0";
    } else {
        showError("No data from Step 9 found. Please complete Step 9.");
    }

    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculatePosteriors();
        };
    }

    function calculatePosteriors() {
        if (errorContainer) errorContainer.classList.add("hidden");
        if (resultContainer) resultContainer.classList.add("hidden");

        if (!iFactors) {
            showError("Missing I-Factors from Step 9.");
            return;
        }

        const I1 = iFactors.I1 || 0;
        const I2 = iFactors.I2 || 0;
        const I3 = iFactors.I3 || 0;

        const sum = I1 + I2 + I3;

        if (sum === 0) {
            showError("Sum of I-Factors is 0. Cannot normalize (Division by zero). Check Step 8/9 inputs.");
            return;
        }

        // Equation 2.17
        const Po1 = I1 / sum;
        const Po2 = I2 / sum;
        const Po3 = I3 / sum;

        // Display as Percentages for better reading in Posteriors
        if (po1Span) po1Span.textContent = (Po1 * 100).toFixed(2) + "%";
        if (po2Span) po2Span.textContent = (Po2 * 100).toFixed(2) + "%";
        if (po3Span) po3Span.textContent = (Po3 * 100).toFixed(2) + "%";
        if (sumSpan) sumSpan.textContent = ((Po1 + Po2 + Po3) * 100).toFixed(2) + "%";

        if (resultContainer) resultContainer.classList.remove("hidden");

        // Save
        const posteriors = { Po1, Po2, Po3 };
        sessionStorage.setItem("posterior_probabilities", JSON.stringify(posteriors));
        console.log("Posteriors calculated and saved:", posteriors);

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }
    }
}

window.step10_init = step10_init;
