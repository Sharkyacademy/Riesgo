
import { tables } from "../step2_calcs.js";

/**
 * HELPER FUNCTION TO SET VISIBILITY
 * @param {string} elementId - ID of the element to show/hide
 * @param {boolean} visible - true to show, false to hide
 */
function setVisibility(elementId, visible) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (visible) {
        element.classList.remove("hidden");
    } else {
        element.classList.add("hidden");
    }
}

/**
 * VALIDATES INPUTS
 * @param {string} ph - Selected pH
 * @param {string} temp - Input Temperature
 * @returns {string[]} errors
 */
function validate_inputs(ph, temp) {
    const errors = [];
    if (!ph || ph === "") errors.push("pH is required.");
    if (!temp || temp === "") errors.push("Temperature is required.");
    return errors;
}


/**
 * DISPLAY ERRORS
 * @param {string[]} errors 
 */
function display_errors(errors) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = "";
    errorContainer.className = "flex flex-col gap-2 m-3"; // Apply flex and gap

    errors.forEach(err => {
        const div = document.createElement("div");
        div.className = "alert alert-error";
        div.textContent = err;
        errorContainer.appendChild(div);
    });
}

/**
 * Interpolates or extrapolates y value for given x based on sorted points.
 * @param {number} x - The input value (Temperature or pH)
 * @param {Array<Array<number>>} points - Array of [x, y] points, sorted by x
 * @returns {number|null} - Interpolated y value (Corrosion Rate)
 */
function interpolate(x, points) {
    if (!points || points.length === 0) return null;

    if (points.length === 1) return points[0][1];

    let i = 0;
    while (i < points.length - 2 && x > points[i + 1][0]) {
        i++;
    }

    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];

    if (x1 === x2) return y1;

    const slope = (y2 - y1) / (x2 - x1);
    const y = y1 + slope * (x - x1);

    return y;
}


/**
 * MAIN MODULE FUNCTION
 */
export function acid_sw_corrosion_calc() {

    // --- DOM ELEMENTS ---
    const h2oSelect = document.getElementById("h2o_present");
    const ph7Select = document.getElementById("ph_7");
    const ph45Select = document.getElementById("ph_4_5");
    const chloridesSelect = document.getElementById("chlorides");
    const materialSelect = document.getElementById("material");
    const claddingMaterialSelect = document.getElementById("cladding_material"); // NEW

    // Final Inputs Containers
    const containerFinalInputs = document.getElementById("container_final_inputs");
    const containerStep1 = document.getElementById("container_step_1");
    const containerStep2 = document.getElementById("container_step_2");
    const containerStep3 = document.getElementById("container_step_3");
    const containerComingSoon = document.getElementById("container_coming_soon");

    // Inputs inside Final Step
    const phValueInput = document.getElementById("ph_value");
    const temperatureInput = document.getElementById("temperature");
    const oxygenInput = document.getElementById("oxygen");
    const velocityInput = document.getElementById("velocity");

    // Buttons & Results
    const btnCalcRate = document.getElementById("calculate_corrosion_rate");
    const btnCalcFinalRate = document.getElementById("calculate_final_corrosion_rate");

    const resultRate1 = document.getElementById("corrosion_rate_result_1"); // Intermediate Result
    const finalResultDisplay = document.getElementById("corrosion_rate"); // Main Result at bottom
    const errorContainer = document.getElementById("error-container");

    let baseCorrosionRate = 0; // Calculated rate for CS (unfactored)

    // Check Cladding Status from Table 4.1
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") {
            hasCladding = true;
        }
    } catch (e) { console.error("Error reading table4.1", e); }

    // --- VISIBILITY LOGIC ---

    function updateVisibility() {
        errorContainer.innerHTML = "";
        finalResultDisplay.classList.add("hidden");

        if (h2oSelect.value === "no") {
            hideAllAfterH2O();
            // Both rates 0
            saveRates(0, 0);
            finalResultDisplay.textContent = "Estimated Corrosion Rate is 0 mpy";
            finalResultDisplay.classList.remove("hidden");
            return;
        }

        if (h2oSelect.value === "yes") {
            setVisibility("container_ph_7", true);
        } else {
            hideAllAfterH2O();
            return;
        }

        if (ph7Select.value === "yes") {
            hideAllAfterPH7();
            setVisibility("container_coming_soon", true);
            return;
        }

        if (ph7Select.value === "no") {
            setVisibility("container_ph_4_5", true);
            setVisibility("container_coming_soon", false);
        } else {
            hideAllAfterPH7();
            return;
        }

        if (ph45Select.value === "yes") {
            hideAllAfterPH45();
            setVisibility("container_coming_soon", true);
            return;
        }

        if (ph45Select.value === "no") {
            setVisibility("container_chlorides", true);
            setVisibility("container_coming_soon", false);
        } else {
            hideAllAfterPH45();
            return;
        }

        if (chloridesSelect.value === "yes") {
            hideAllAfterChlorides();
            setVisibility("container_coming_soon", true);
            return;
        }

        if (chloridesSelect.value === "no") {
            setVisibility("container_material", true);
            setVisibility("container_coming_soon", false);
        } else {
            hideAllAfterChlorides();
            return;
        }

        // Material Selection Logic
        // Flow: Material (BM) -> Cladding Material (if hasCladding) -> Calc Inputs

        // If BM is NO (non-CS) -> We handle it (rate=2). 
        // If BM is YES (CS) -> Go to Cladding Check.

        if (materialSelect.value === "") {
            setVisibility("container_cladding_material", false);
            setVisibility("container_final_inputs", false);
            return;
        }

        let showCalcInputs = false;

        if (hasCladding) {
            setVisibility("container_cladding_material", true);
            if (claddingMaterialSelect.value !== "") {
                showCalcInputs = true;
            } else {
                showCalcInputs = false;
            }
        } else {
            setVisibility("container_cladding_material", false);
            showCalcInputs = true;
        }

        if (showCalcInputs) {
            // Logic to determine if we show inputs or auto-result
            // We need inputs IF at least one material is CS ("yes").
            // If both are "no", we just set result to 2/2?

            const bmIsCS = materialSelect.value === "yes";
            const cmIsCS = hasCladding ? (claddingMaterialSelect.value === "yes") : false;

            if (bmIsCS || cmIsCS) {
                // Need calculation parameters
                setVisibility("container_final_inputs", true);
                setVisibility("container_step_1", true);
                finalResultDisplay.classList.add("hidden");
            } else {
                // Both are non-CS (e.g. both SS)
                setVisibility("container_final_inputs", false);
                const rate = 2; // Default for non-CS
                saveRates(rate, hasCladding ? rate : 0);
                finalResultDisplay.textContent = `Estimated Corrosion Rates: Base=${rate} mpy` + (hasCladding ? `, Clad=${rate} mpy` : "");
                finalResultDisplay.classList.remove("hidden");
            }
        } else {
            setVisibility("container_final_inputs", false);
        }
    }

    function saveRates(bmRate, cmRate) {
        sessionStorage.setItem("corrosion_rate", bmRate); // Keep legacy for compatibility? or base
        sessionStorage.setItem("corrosion_rate_bm", bmRate);
        if (hasCladding) {
            sessionStorage.setItem("corrosion_rate_cladding", cmRate);
        } else {
            sessionStorage.removeItem("corrosion_rate_cladding");
        }
    }

    function hideAllAfterH2O() {
        setVisibility("container_ph_7", false);
        setVisibility("container_ph_4_5", false);
        setVisibility("container_chlorides", false);
        setVisibility("container_material", false);
        setVisibility("container_cladding_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
        finalResultDisplay.classList.add("hidden");
    }

    function hideAllAfterPH7() {
        setVisibility("container_ph_4_5", false);
        setVisibility("container_chlorides", false);
        setVisibility("container_material", false);
        setVisibility("container_cladding_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
    }

    function hideAllAfterPH45() {
        setVisibility("container_chlorides", false);
        setVisibility("container_material", false);
        setVisibility("container_cladding_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
    }

    function hideAllAfterChlorides() {
        setVisibility("container_material", false);
        setVisibility("container_cladding_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
    }


    // --- CALCULATION HANDLERS ---

    // Step 1 Calculation (pH & Temp) -> Show Oxygen
    btnCalcRate.addEventListener("click", () => {
        errorContainer.innerHTML = "";

        const phVal = phValueInput.value;
        const tempVal = temperatureInput.value;

        const errors = validate_inputs(phVal, tempVal);
        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        const ph = parseFloat(phVal);
        const temp = parseFloat(tempVal);

        if (isNaN(ph) || isNaN(temp)) {
            display_errors(["Invalid pH or temperature."]);
            return;
        }

        // Get Unit System
        const table41Data = sessionStorage.getItem("table4.1_data");
        let usesFahrenheit = true;
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            usesFahrenheit = table41.measurement_unit === "farenheit";
        }
        const unitLabel = usesFahrenheit ? "mpy" : "mm/y";

        // Lookup Table 2.B.10.2
        if (!tables.table_2b102) {
            errorContainer.innerHTML = `<div class="alert alert-error">Table 2.B.10.2 data not loaded.</div>`;
            return;
        }

        const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
        const tempData = tables.table_2b102[tempKey]; // { "100": { "4.75": 1, ... }, "200": ... }

        if (!tempData) {
            errorContainer.innerHTML = `<div class="alert alert-error">Data for ${unitLabel} not valid.</div>`;
            return;
        }

        // DOUBLE INTERPOLATION STRATEGY (Copy of existing logic)
        // ... (omitted for brevity, assume logic is same but result assigned to variable)
        // Actually I need to run this logic. 

        const tempPoints = [];
        let phWarning = "";

        const availableTemps = Object.keys(tempData).map(parseFloat).sort((a, b) => a - b);

        for (const t of availableTemps) {
            const phData = tempData[t];
            if (!phData) continue;
            const phPoints = Object.entries(phData).map(([p, r]) => [parseFloat(p), parseFloat(r)]).sort((a, b) => a[0] - b[0]);
            if (phPoints.length === 0) continue;
            const minPH = phPoints[0][0];
            const maxPH = phPoints[phPoints.length - 1][0];
            let rateAtPH = interpolate(ph, phPoints);

            if (ph < minPH) {
                rateAtPH = Math.max(0, rateAtPH);
                if (!phWarning) phWarning = `(pH < Table Range: Extrapolated)`;
            } else if (ph > maxPH) {
                rateAtPH = Math.max(0, rateAtPH);
                if (!phWarning) phWarning = `(pH > Table Range: Extrapolated)`;
            } else {
                rateAtPH = Math.max(0, rateAtPH);
            }
            tempPoints.push([t, rateAtPH]);
        }

        if (tempPoints.length === 0) {
            errorContainer.innerHTML = `<div class="alert alert-error">Could not calculate rates from table data.</div>`;
            return;
        }

        const minTemp = tempPoints[0][0];
        const maxTemp = tempPoints[tempPoints.length - 1][0];
        let finalRate = interpolate(temp, tempPoints);
        let tempWarning = "";

        if (temp < minTemp) {
            tempWarning = `(Temp < Min: Extrapolated)`;
            finalRate = Math.max(0, finalRate);
        } else if (temp > maxTemp) {
            tempWarning = `(Temp > Max: Clamped)`;
            finalRate = tempPoints[tempPoints.length - 1][1];
        } else {
            finalRate = Math.max(0, finalRate);
        }

        // Store BASE CALCULATED rate (unfactored)
        baseCorrosionRate = finalRate;

        // Store intermediate rate for display (just base rate unfactored?) or factored?
        // The original logic saved this as 'acid_base_corrosion_rate' and showed it.
        const rateRounded = finalRate.toFixed(2);
        sessionStorage.setItem("acid_base_corrosion_rate", rateRounded);

        const combinedWarning = [phWarning, tempWarning].filter(Boolean).join(" ");
        let warningHTML = "";
        if (combinedWarning) warningHTML = `<div class="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">Warning: ${combinedWarning}</div>`;

        resultRate1.innerHTML = `Base Rate (CRph): ${rateRounded} ${unitLabel} ${warningHTML}`;
        resultRate1.classList.remove("hidden");

        // Show Next Step
        setVisibility("container_step_2", true);
    });

    // Step 2 Logic (Oxygen input focus) -> Show Velocity
    oxygenInput.addEventListener("input", () => {
        if (oxygenInput.value) {
            setVisibility("container_step_3", true);
        }
    });

    // Final Calculation
    btnCalcFinalRate.addEventListener("click", () => {
        errorContainer.innerHTML = "";

        if (!baseCorrosionRate && baseCorrosionRate !== 0) {
            errorContainer.innerHTML = `<div class="alert alert-error">Please calculate the base rate first.</div>`;
            return;
        }

        const oxy = parseFloat(oxygenInput.value);
        const vel = parseFloat(velocityInput.value);

        if (isNaN(oxy) || isNaN(vel)) {
            errorContainer.innerHTML = `<div class="alert alert-error">Please fill in Oxygen and Velocity.</div>`;
            return;
        }

        let Fo = 1.0;
        if (tables.table_2b103) {
            const isSignificant = oxy >= 50;
            const oxData = tables.table_2b103;
            const index = isSignificant ? 1 : 0;
            if (oxData.adjustment_factor && oxData.adjustment_factor[index] !== undefined) {
                Fo = oxData.adjustment_factor[index];
            }
        }

        const table41Data = sessionStorage.getItem("table4.1_data");
        let usesFahrenheit = true;
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            usesFahrenheit = table41.measurement_unit === "farenheit";
        }

        let Fv = 1.0;
        if (usesFahrenheit) {
            if (vel < 6) Fv = 1.0;
            else if (vel <= 20) Fv = (0.25 * vel) - 0.5;
            else Fv = 5.0;
        } else {
            if (vel < 1.83) Fv = 1.0;
            else if (vel <= 6.10) Fv = (0.82 * vel) - 0.5;
            else Fv = 5.0;
        }

        // --- DUAL CALCULATION ---
        const bmIsCS = materialSelect.value === "yes";
        const cmIsCS = hasCladding ? (claddingMaterialSelect.value === "yes") : false;

        const calculatedRate = baseCorrosionRate * Fo * Fv;
        const defaultRate = 2.0;

        const bmRate = bmIsCS ? calculatedRate : defaultRate;
        const cmRate = hasCladding ? (cmIsCS ? calculatedRate : defaultRate) : 0;

        const unitLabel = usesFahrenheit ? "mpy" : "mm/y";

        // Display
        let outputHTML = `Estimated Base Metal Rate: ${bmRate.toFixed(2)} ${unitLabel}`;
        if (hasCladding) {
            outputHTML += `<br>Estimated Cladding Rate: ${cmRate.toFixed(2)} ${unitLabel}`;
        }

        finalResultDisplay.innerHTML = outputHTML;
        finalResultDisplay.classList.remove("hidden");

        // Save
        saveRates(bmRate.toFixed(2), cmRate.toFixed(2));
    });

    if (claddingMaterialSelect) claddingMaterialSelect.addEventListener("change", updateVisibility); // Ensure listener
    h2oSelect.addEventListener("change", updateVisibility);
    ph7Select.addEventListener("change", updateVisibility);
    ph45Select.addEventListener("change", updateVisibility);
    chloridesSelect.addEventListener("change", updateVisibility);
    materialSelect.addEventListener("change", updateVisibility);

    updateVisibility();
}

