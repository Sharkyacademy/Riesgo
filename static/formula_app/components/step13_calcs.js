/**
 * Logic for Step 13: Final Thinning Damage Factor
 * Equation 2.20
 */

function step13_init() {
    console.log("Step 13 Init Launched");

    // UI Elements
    const baseDfInput = document.getElementById("step13_base_df");

    // FOM Inputs
    const mechSelect = document.getElementById("step13_mechanism");
    const methodSelect = document.getElementById("step13_om_method");
    const fomValSpan = document.getElementById("step13_fom_val");

    // Adjustments
    const checkIp = document.getElementById("step13_check_ip");
    const ipDetails = document.getElementById("step13_ip_details");
    const ipRadios = document.getElementsByName("ip_insp");

    const checkDl = document.getElementById("step13_check_dl");
    const dlDetails = document.getElementById("step13_dl_details");
    const dlRadios = document.getElementsByName("dl_insp");

    const calcBtn = document.getElementById("step13_calc_btn");
    const resultVal = document.getElementById("step13_result");
    const resultContainer = document.getElementById("step13_result_container");
    const errorContainer = document.getElementById("step13_error_container");
    const errorMessageCtx = document.getElementById("step13_error_message");

    // Valid Data for FOM
    let fomData = [];

    // State
    let currentFom = 1;
    let baseDf = 0;

    function showError(msg) {
        if (errorContainer && errorMessageCtx) {
            errorMessageCtx.textContent = msg;
            errorContainer.classList.remove("hidden");
        } else {
            alert(msg);
        }
    }

    // 1. Load Base DF
    const savedBaseDf = parseFloat(sessionStorage.getItem("base_df_thin"));
    if (!isNaN(savedBaseDf)) {
        baseDf = savedBaseDf;
        if (baseDfInput) baseDfInput.value = baseDf.toFixed(4);
    } else {
        showError("Missing Base DF from Step 12.");
    }

    // 2. Load Table 4.9 Data
    fetch('/static/formula_app/data/json/step13/table49.JSON')
        .then(response => response.json())
        .then(json => {
            fomData = json.data;
            populateMechanisms();
            // Try to restore saved state first (if user already visited Step 13)
            // If no state (first visit), try auto-select from Step 2
            if (!restoreState()) {
                autoSelectMechanism();
            }
        })
        .catch(err => console.error("Error loading Table 4.9:", err));

    function populateMechanisms() {
        if (!mechSelect) return;
        mechSelect.innerHTML = '<option disabled selected>Select Mechanism...</option>';
        fomData.forEach((item, index) => {
            const opt = document.createElement("option");
            opt.value = index; // Use index to reference data array
            opt.textContent = item.mechanism;
            mechSelect.appendChild(opt);
        });
    }

    // 3. Logic to Determine FOM
    function autoSelectMechanism() {
        const savedMech = sessionStorage.getItem("selected_mechanism");
        const velocity = parseFloat(sessionStorage.getItem("velocity") || 999); // Default high if unknown

        console.group("Step 13: Auto-Select Mechanism Debug");
        console.log("Raw savedMech:", savedMech);
        console.log("Velocity:", velocity);

        if (!savedMech) {
            console.warn("No mechanism found in sessionStorage.");
            console.groupEnd();
            return;
        }

        let targetName = "";

        // Normalize string
        const key = savedMech.toLowerCase().trim();

        switch (key) {
            case "hci_corrosion":
                targetName = "Hydrochloric";
                break;
            case "ht_sna_corrosion":
                targetName = "High-temperature sulfidic"; // Match full start
                break;
            case "ht_h2sh2_corrosion":
                targetName = "High-temperature H2S/H2";
                break;
            case "hf_corrosion":
                targetName = "HF corrosion";
                break;
            case "sa_corrosion":
                // Sulfuric Acid
                targetName = (velocity > 3) ? "Sulfuric acid (H2S/H2) corrosion - High Velocity" : "Sulfuric acid (H2S/H2) corrosion - Low Velocity";
                break;
            case "alkaline_sw_corrosion":
            case "acid_sw_corrosion":
                // Sour Water
                targetName = (velocity > 20) ? "Sour water corrosion - High Velocity" : "Sour water corrosion - Low Velocity";
                break;
            case "amine_corrosion":
                targetName = (velocity > 5) ? "Amine - High Velocity" : "Amine - Low Velocity";
                break;
            // Handle unmapped cases explicitly if possible, or fall to Other
            case "co2_corrosion":
            case "cooling_water_corrosion":
            case "soil_side_corrosion":
            case "ht_oxidation":
                console.log("Mapping", key, "to Other (Generic)");
                targetName = "Other corrosion mechanism";
                break;
            default:
                console.log("Unknown key:", key, "falling back to Other");
                targetName = "Other corrosion mechanism";
                break;
        }

        console.log("Target Name derived:", targetName);

        let bestIndex = -1;
        // Exact match attempt first, then partial
        bestIndex = fomData.findIndex(item => item.mechanism.trim() === targetName);

        if (bestIndex === -1) {
            // Try partial (e.g. "Hydrochloric" in "Hydrochloric acid...")
            bestIndex = fomData.findIndex(item => item.mechanism.toLowerCase().includes(targetName.toLowerCase()));
        }

        console.log("Best Index Found:", bestIndex);

        if (bestIndex !== -1 && mechSelect) {
            mechSelect.value = bestIndex;
            // Also set as current val explicitly to update UI
            mechSelect.dispatchEvent(new Event('change'));
            updateFom();
            saveState(); // Persist immediately
            console.log("Auto-select applied successfully.");
        } else {
            console.warn("Failed to match targetName to dropdown options.");
        }
        console.groupEnd();
    }

    // 4. Update FOM Logic & Save State
    function updateFom() {
        const method = methodSelect.value;
        const mechIndex = mechSelect.value;

        if (method === "none" || !fomData[mechIndex]) {
            currentFom = 1;
        } else {
            const dataRow = fomData[mechIndex];
            currentFom = dataRow[method] || 1;
        }

        if (fomValSpan) fomValSpan.textContent = currentFom;
        saveState();
    }

    function getAdjustments() {
        let Fip = 1;
        let Fdl = 1;

        if (checkIp.checked) {
            ipDetails.classList.remove("hidden");
            let hasInsp = 'no';
            for (const r of ipRadios) { if (r.checked) hasInsp = r.value; }
            Fip = (hasInsp === 'yes') ? 1 : 3;
        } else {
            ipDetails.classList.add("hidden");
        }

        if (checkDl.checked) {
            dlDetails.classList.remove("hidden");
            let hasInsp = 'no';
            for (const r of dlRadios) { if (r.checked) hasInsp = r.value; }
            Fdl = (hasInsp === 'yes') ? 1 : 3;
        } else {
            dlDetails.classList.add("hidden");
        }

        saveState(); // Save on toggle
        return { Fip, Fdl };
    }

    // State Persistence
    function saveState() {
        const state = {
            mechIndex: mechSelect.value,
            method: methodSelect.value,
            ipChecked: checkIp.checked,
            dlChecked: checkDl.checked,
            ipInsp: document.querySelector('input[name="ip_insp"]:checked')?.value,
            dlInsp: document.querySelector('input[name="dl_insp"]:checked')?.value,
            savedFromMech: sessionStorage.getItem("selected_mechanism") // Important: Track the source
        };
        sessionStorage.setItem("step13_state", JSON.stringify(state));
    }

    function restoreState() {
        const savedState = sessionStorage.getItem("step13_state");
        if (savedState) {
            try {
                const state = JSON.parse(savedState);

                // CONFLICT CHECK:
                // If the user has a mechanism in Step 2, and the saved state is from a DIFFERENT mechanism (or none),
                // we should DISCARD the saved state and re-run auto-select.
                const currentStep2Mech = sessionStorage.getItem("selected_mechanism");

                if (currentStep2Mech) {
                    if (!state.savedFromMech || state.savedFromMech !== currentStep2Mech) {
                        console.warn(`[Step 13] Context Mismatch! Saved: ${state.savedFromMech}, Current: ${currentStep2Mech}. Refreshing.`);
                        return false; // Triggers autoSelectMechanism()
                    }
                }

                if (state.mechIndex) mechSelect.value = state.mechIndex;
                if (state.method) methodSelect.value = state.method;

                checkIp.checked = state.ipChecked;
                checkDl.checked = state.dlChecked;

                if (state.ipInsp) {
                    const r = document.querySelector(`input[name="ip_insp"][value="${state.ipInsp}"]`);
                    if (r) r.checked = true;
                }
                if (state.dlInsp) {
                    const r = document.querySelector(`input[name="dl_insp"][value="${state.dlInsp}"]`);
                    if (r) r.checked = true;
                }

                // Refresh UI
                updateFom();
                getAdjustments();
                console.log("[Step 13] State Restored successfully.");
                return true;
            } catch (e) {
                console.error("Error restoring Step 13 state:", e);
                return false;
            }
        }
        return false;
    }

    if (mechSelect) mechSelect.addEventListener("change", updateFom);
    if (methodSelect) methodSelect.addEventListener("change", updateFom);

    // Listeners for adjustments
    if (checkIp) checkIp.addEventListener("change", getAdjustments);
    if (checkDl) checkDl.addEventListener("change", getAdjustments);
    ipRadios.forEach(r => r.addEventListener("change", getAdjustments));
    dlRadios.forEach(r => r.addEventListener("change", getAdjustments));


    // 5. Calculate Final DF
    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateFinalDF();
        };
    }

    function calculateFinalDF() {
        if (errorContainer) errorContainer.classList.add("hidden");
        if (resultContainer) resultContainer.classList.add("hidden");

        if (isNaN(baseDf)) {
            showError("Base DF is invalid.");
            return;
        }

        // Validate Mechanism Selection if method > none
        if (methodSelect.value !== "none" && mechSelect.selectedIndex <= 0) {
            showError("Please select a Thinning Mechanism to determine the correct Online Monitoring Factor.");
            return;
        }

        const { Fip, Fdl } = getAdjustments();
        const Fom = currentFom;

        // Equation 2.20
        // Df = max [ (Dfb * Fip * Fdl) / Fom, 0.1 ]

        const rawDf = (baseDf * Fip * Fdl) / Fom;
        const finalDf = Math.max(rawDf, 0.1);

        if (resultVal) resultVal.textContent = finalDf.toFixed(4);

        if (resultContainer) resultContainer.classList.remove("hidden");

        // Save Result
        sessionStorage.setItem("final_df_thin", finalDf.toFixed(4));
        sessionStorage.setItem("thinning_final_df", finalDf.toFixed(4)); // Keep alias if needed by dashboard
        console.log("Final Thinning DF:", finalDf);

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }
    }
}

window.step13_init = step13_init;
