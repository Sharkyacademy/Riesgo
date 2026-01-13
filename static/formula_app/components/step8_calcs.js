/**
 * Logic for Step 8: Inspection Effectiveness and Thinning DF Calculation
 * Calculates the Thinning Damage Factor using Bayesian probabilities based on
 * prior confidence and inspection history.
 */

async function step8_init() {

    const inpConfidence = document.getElementById("step8_confidence");
    const inpA = document.getElementById("step8_insp_A");
    const inpB = document.getElementById("step8_insp_B");
    const inpC = document.getElementById("step8_insp_C");
    const inpD = document.getElementById("step8_insp_D");
    const saveBtn = document.getElementById("step8_save_btn");
    const resultContainer = document.getElementById("step8_result_container");
    const errorContainer = document.getElementById("step8_error_container");
    const errorMessageCtx = document.getElementById("step8_error_message");

    function showError(msg) {
        if (errorContainer && errorMessageCtx) {
            errorMessageCtx.textContent = msg;
            errorContainer.classList.remove("hidden");
        } else {
            alert(msg);
        }
    }

    let table45Data = null; // Priors
    let table46Data = null; // Conditional Probabilities

    // Fetch Data
    try {
        const [res45, res46] = await Promise.all([
            fetch('/static/formula_app/data/json/step8/table45.JSON'),
            fetch('/static/formula_app/data/json/step8/table46.JSON')
        ]);

        table45Data = await res45.json();
        table46Data = await res46.json();
        console.log("Step 8 Data Loaded", table45Data, table46Data);
    } catch (err) {
        console.error("Error loading Step 8 data:", err);
        return;
    }

    // Load existing inputs from session
    const savedHistory = sessionStorage.getItem("inspection_history");
    if (savedHistory) {
        try {
            const data = JSON.parse(savedHistory);
            if (inpConfidence) inpConfidence.value = data.confidence || "Low";
            if (inpA) inpA.value = data.A || 0;
            if (inpB) inpB.value = data.B || 0;
            if (inpC) inpC.value = data.C || 0;
            if (inpD) inpD.value = data.D || 0;
        } catch (e) {
            console.error("Error parsing inspection history", e);
        }
    }

    if (saveBtn) {
        saveBtn.onclick = (e) => {
            e.preventDefault();
            calculateAndSave();
        };
    }

    function calculateAndSave() {
        // Reset UI
        if (errorContainer) errorContainer.classList.add("hidden");
        if (resultContainer) resultContainer.classList.add("hidden");

        if (!table45Data || !table46Data) {
            showError("Data not loaded yet. Please wait or refresh.");
            return;
        }

        const confidence = inpConfidence.value; // Low, Medium, High

        // Helper to strictly parse + integer
        const getCount = (inp) => {
            const val = inp.value.trim();
            if (!val) return 0; // Empty treated as 0
            if (!/^\d+$/.test(val)) return -1; // Contains non-digits (e.g. 'e', '.', '-')
            return parseInt(val, 10);
        };

        const countA = getCount(inpA);
        const countB = getCount(inpB);
        const countC = getCount(inpC);
        const countD = getCount(inpD);

        if (countA < 0 || countB < 0 || countC < 0 || countD < 0) {
            showError("Please enter valid positive integers for inspection counts.");
            return;
        }

        // Map confidence to JSON key
        const confKey = confidence === "Low" ? "low_confidence" :
            confidence === "Medium" ? "medium_confidence" :
                confidence === "High" ? "high_confidence" : "low_confidence";

        // 1. Get Priors associated with Confidence
        // Order in JSON is usually p1 (1), p2 (2), p3 (4)
        // We will robustly find them by "damage_state"
        const priors = {};
        table45Data.data.forEach(row => {
            priors[row.damage_state] = row[confKey];
        });

        // 2. Calculate Likelihoods for each State
        // Likelihood = P(A|State)^CountA * P(B|State)^CountB ...
        const states = ["Cp_p1_Thin", "Cp_p2_Thin", "Cp_p3_Thin"];
        // Corresponding prior keys
        const priorKeys = {
            "Cp_p1_Thin": "Pr_p1_Thin",
            "Cp_p2_Thin": "Pr_p2_Thin",
            "Cp_p3_Thin": "Pr_p3_Thin"
        };
        // Damage State Factors
        const factors = {
            "Cp_p1_Thin": 1,
            "Cp_p2_Thin": 2,
            "Cp_p3_Thin": 4
        };

        let likelihoods = {};
        table46Data.data.forEach(row => {
            const state = row.condition;
            if (states.includes(state)) {
                // Get conditional probs from table
                const pA = row.A_highly_effective;
                const pB = row.B_usually_effective;
                const pC = row.C_fairly_effective;
                const pD = row.D_poorly_effective;

                // Calculate combined likelihood
                // Note: If count is 0, term is 1 (P^0 = 1)
                const L = Math.pow(pA, countA) *
                    Math.pow(pB, countB) *
                    Math.pow(pC, countC) *
                    Math.pow(pD, countD);

                likelihoods[state] = L;
            }
        });

        // 3. posterior = (Likelihood * Prior) / Sum(Likelihood * Prior)
        let weightedSum = 0;
        let posteriors = {};

        states.forEach(state => {
            const priorVal = priors[priorKeys[state]];
            const likelihoodVal = likelihoods[state];
            const weighted = priorVal * likelihoodVal;
            posteriors[state] = weighted; // Store unnormalized first
            weightedSum += weighted;
        });

        // Normalize
        let finalDF = 0;
        states.forEach(state => {
            posteriors[state] = posteriors[state] / weightedSum;
            finalDF += posteriors[state] * factors[state];
        });

        console.log("Calculated DF:", finalDF, "Posteriors:", posteriors);

        // Save
        const history = { confidence, A: countA, B: countB, C: countC, D: countD };
        sessionStorage.setItem("inspection_history", JSON.stringify(history));
        sessionStorage.setItem("inspection_counts", JSON.stringify(history)); // Alias for validation
        sessionStorage.setItem("thinning_df", finalDF.toFixed(4));

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }

        // Show result
        if (resultContainer) {
            const resultSpan = document.getElementById("step8_result");
            if (resultSpan) {
                resultSpan.textContent = finalDF.toFixed(2);
            }
            resultContainer.classList.remove("hidden");
        }
    }
}

// Global expose
window.step8_init = step8_init;
