/**
 * Logic for Step 9: Inspection Effectiveness Factors (I_Factors)
 * Equation 2.16
 */

async function step9_init() {
    console.log("Step 9 Init Launched");

    // UI Elements
    const confDisplay = document.getElementById("step9_confidence");
    const countsDisplay = document.getElementById("step9_counts");
    const calcBtn = document.getElementById("step9_calc_btn");
    const resultContainer = document.getElementById("step9_result_container");

    // Result Spans
    const i1Span = document.getElementById("step9_i1");
    const i2Span = document.getElementById("step9_i2");
    const i3Span = document.getElementById("step9_i3");

    // Validations
    const errorContainer = document.getElementById("step9_error_container");
    const errorMessageCtx = document.getElementById("step9_error_message");

    function showError(msg) {
        if (errorContainer && errorMessageCtx) {
            errorMessageCtx.textContent = msg;
            errorContainer.classList.remove("hidden");
        } else {
            alert(msg);
        }
    }

    // Load Data
    let table45Data = null;
    let table46Data = null;

    try {
        const [res45, res46] = await Promise.all([
            fetch('/static/formula_app/data/json/step8/table45.JSON'), // Re-use Step 8 data
            fetch('/static/formula_app/data/json/step8/table46.JSON')
        ]);
        table45Data = await res45.json();
        table46Data = await res46.json();
    } catch (err) {
        console.error("Error loading JSONs for Step 9", err);
        showError("Failed to load probability tables.");
        return;
    }

    // Load Session Data
    let history = null;
    const historyStr = sessionStorage.getItem("inspection_history");
    if (historyStr) {
        try {
            history = JSON.parse(historyStr);
        } catch (e) { console.error(e); }
    }

    // Populate Review Section
    if (history) {
        if (confDisplay) confDisplay.value = history.confidence || "Unknown";
        if (countsDisplay) {
            countsDisplay.value = `A:${history.A} | B:${history.B} | C:${history.C} | D:${history.D}`;
        }
    } else {
        if (confDisplay) confDisplay.value = "N/A";
        showError("No inspection history found. Please complete Step 8.");
    }

    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateFactors();
        };
    }

    function calculateFactors() {
        // Clear errors
        if (errorContainer) errorContainer.classList.add("hidden");
        if (resultContainer) resultContainer.classList.add("hidden");

        if (!history || !table45Data || !table46Data) {
            showError("Missing required data. Check Step 8.");
            return;
        }

        const countA = history.A || 0;
        const countB = history.B || 0;
        const countC = history.C || 0;
        const countD = history.D || 0;
        const confidence = history.confidence || "Low";

        // Map confidence
        const confKey = confidence === "Low" ? "low_confidence" :
            confidence === "Medium" ? "medium_confidence" :
                confidence === "High" ? "high_confidence" : "low_confidence";

        // Get Priors (Pr_p1, Pr_p2, Pr_p3)
        // Table 4.5 maps 'damage_state' -> confKey
        const priors = {};
        table45Data.data.forEach(row => {
            priors[row.damage_state] = row[confKey];
        });

        // Calculate I-Factors
        // I = Prior * LikelihoodCombined
        // LikelihoodCombined = (pA^nA * pB^nB ...)

        const factors = {};
        const states = ["Cp_p1_Thin", "Cp_p2_Thin", "Cp_p3_Thin"];
        // Map Cp key to Pr key
        const priorMap = {
            "Cp_p1_Thin": "Pr_p1_Thin",
            "Cp_p2_Thin": "Pr_p2_Thin",
            "Cp_p3_Thin": "Pr_p3_Thin"
        };

        // We iterate over Table 4.6 to get conditional probs for each state
        table46Data.data.forEach(row => {
            const state = row.condition;
            if (states.includes(state)) {
                // Conditional Probs
                const cpA = row.A_highly_effective;
                const cpB = row.B_usually_effective;
                const cpC = row.C_fairly_effective;
                const cpD = row.D_poorly_effective;

                // Likelihood
                const likelihood = Math.pow(cpA, countA) *
                    Math.pow(cpB, countB) *
                    Math.pow(cpC, countC) *
                    Math.pow(cpD, countD);

                // Prior
                const prKey = priorMap[state];
                const prior = priors[prKey] || 0;

                // I Factor (Eq 2.16)
                const I = prior * likelihood;
                factors[state] = I;
            }
        });

        // 1 = p1 (No worse), 2 = p2 (Somewhat), 3 = p3 (Considerably)
        const I1 = factors["Cp_p1_Thin"] || 0;
        const I2 = factors["Cp_p2_Thin"] || 0;
        const I3 = factors["Cp_p3_Thin"] || 0;

        // Display
        if (i1Span) i1Span.textContent = I1.toExponential(4); // Scientific notation often better for small probs
        if (i2Span) i2Span.textContent = I2.toExponential(4);
        if (i3Span) i3Span.textContent = I3.toExponential(4);

        if (resultContainer) resultContainer.classList.remove("hidden");

        // Save
        const results = { I1, I2, I3 };
        sessionStorage.setItem("inspection_effectiveness", JSON.stringify(results));
        sessionStorage.setItem("inspection_effectiveness_factors", JSON.stringify(results)); // Keep old key for compatibility just in case

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }
    }
}

window.step9_init = step9_init;
