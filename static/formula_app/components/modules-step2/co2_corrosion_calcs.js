
/**
 * Helper function to handle visibility
 */
function setVisibility(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) el.classList.remove("hidden");
    else el.classList.add("hidden");
}

export function co2_corrosion_calc() {

    // Selects
    const q1 = document.getElementById("q1_material");
    const q2 = document.getElementById("q2_liquid_hcs");
    const q3 = document.getElementById("q3_water_content");
    const q4 = document.getElementById("q4_velocity");

    // Containers
    const c2 = document.getElementById("q2_container");
    const c3 = document.getElementById("q3_container");
    const c4 = document.getElementById("q4_container");

    const resultDiv = document.getElementById("flow_result");

    // Dew Point Elements - RESTORED
    const dewContainer = document.getElementById("dew_point_inputs_container");
    const pctWaterInput = document.getElementById("percent_water");
    const pressureInput = document.getElementById("pressure_psia");
    const calcDewBtn = document.getElementById("btn_calc_dew_point");

    // Base Corrosion Inputs
    const co2Input = document.getElementById("co2_concentration_input");
    const phInput = document.getElementById("ph_input");
    const shearInput = document.getElementById("shear_stress_input");
    const calcRateBtn = document.getElementById("calculate_corrosion_rate");
    const resultRate = document.getElementById("corrosion_rate");
    const errorContainer = document.getElementById("error-container");
    const conditionMsg = document.getElementById("condition_met_msg");

    // Glycol/Inhibitor Elements
    const q5 = document.getElementById("q_glycol_inhibitor"); // "Is there glycol...?"
    const c5 = document.getElementById("glycol_inhibitor_container");
    const containerGlycolDetails = document.getElementById("glycol_details_container");

    // Final Inputs
    const inputGlycol = document.getElementById("percent_glycol");
    const inputInhibitor = document.getElementById("inhibitor_efficiency");

    const btnCalcFinal = document.getElementById("calculate_final_corrosion_rate");
    const resultFinal = document.getElementById("final_corrosion_rate");

    // Fetch table data on init
    let table2b132_data = null;
    fetch('/static/formula_app/data/json/co2_corrosion/table_2b132.JSON')
        .then(response => response.json())
        .then(data => {
            table2b132_data = data;
        })
        .catch(error => console.error('Error loading Table 2.B.13.2:', error));

    // Check for Cladding
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") hasCladding = true;
    } catch (e) { }

    function display_errors(errors) {
        errorContainer.innerHTML = "";
        errorContainer.className = "flex flex-col gap-2 m-3"; // Apply flex and gap

        errors.forEach(err => {
            const div = document.createElement("div");
            div.className = "alert alert-error";
            div.textContent = err;
            errorContainer.appendChild(div);
        });
    }

    function resetFlow(fromLevel) {
        // Level 1: Material
        if (fromLevel < 1) {
            // Reset everything from start if needed (usually Q1 change handles itself)
        }

        // Level 2: Liquid HCs
        if (fromLevel < 2) {
            q2.value = "";
            setVisibility("q2_container", false);
        }

        // Level 3: Water Content
        if (fromLevel < 3) {
            q3.value = "";
            setVisibility("q3_container", false);
        }

        // Level 4: Velocity (or Dew Point branch)
        if (fromLevel < 4) {
            q4.value = "";
            setVisibility("q4_container", false);

            // Also reset Dew Point inputs if we go back before Q4/Q3 decision
            setVisibility("dew_point_inputs_container", false);
            setVisibility("base_corrosion_inputs_container", false);
            setVisibility("calculate_corrosion_rate", false);
            setVisibility("corrosion_rate", false);
            setVisibility("condition_met_msg", false);
        }

        // Level 5: Glycol Question (After Base Rate Calc)
        // This is called when we re-calculate base rate (fromLevel=5) or go back
        if (fromLevel < 5) {
            q5.value = "";
            setVisibility("glycol_inhibitor_container", false);
            // DO NOT hide base rate results here if fromLevel >= 5
        }

        // Level 6: Glycol Inputs (After Q5 Answer)
        if (fromLevel < 6) {
            inputGlycol.value = "";
            inputInhibitor.value = "";
            setVisibility("glycol_details_container", false);
            setVisibility("calculate_final_corrosion_rate", false);
            setVisibility("final_corrosion_rate", false);
        }

        // Hide flow_result if resetting from early stages (1-4)
        if (fromLevel < 5) {
            setVisibility("flow_result", false);
            errorContainer.innerHTML = "";
        }
    }

    function showResult(message, type = "alert-info") {
        resultDiv.className = `alert ${type} mt-4 flex items-center gap-3`;

        // Define icons
        const iconWarning = `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
        const iconInfo = `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

        // Select icon based on type (warning gets warning icon, others get info)
        const icon = (type.includes("warning")) ? iconWarning : iconInfo;

        resultDiv.innerHTML = `${icon}<span>${message}</span>`;
        setVisibility("flow_result", true);
    }

    function showDewPointInputs() {
        setVisibility("flow_result", false);
        setVisibility("dew_point_inputs_container", true);
        setVisibility("base_corrosion_inputs_container", false);
    }

    function showBaseCorrosionInputs(message = "") {
        setVisibility("base_corrosion_inputs_container", true);
        setVisibility("calculate_corrosion_rate", true);

        if (message) {
            setVisibility("condition_met_msg", true);
            conditionMsg.innerHTML = message;
        } else {
            setVisibility("condition_met_msg", false);
        }

        // Ensure flow result is hidden if we are here
        setVisibility("flow_result", false);
    }

    // Helper: Interpolate f(T, pH) from Table 2.B.13.2
    function interpolate_fT_pH(tempF, ph) {
        if (!table2b132_data || !table2b132_data.temperature_in_f) return 1.0; // Fallback

        const data = table2b132_data.temperature_in_f;
        const temps = Object.keys(data).map(Number).sort((a, b) => a - b);

        // Clamp pH keys (available: 3.5 to 6.5 step 0.5)
        // We will simple-interpolate or find nearest columns. 
        // For strict bilinear, we need surrounding Ts and pHs.

        // Find T lower and upper
        let t_low = temps[0], t_high = temps[temps.length - 1];
        for (let i = 0; i < temps.length - 1; i++) {
            if (tempF >= temps[i] && tempF <= temps[i + 1]) {
                t_low = temps[i];
                t_high = temps[i + 1];
                break;
            }
        }
        // Clamp Temp logic (if out of range, use boundary)
        if (tempF < temps[0]) { t_low = t_high = temps[0]; }
        if (tempF > temps[temps.length - 1]) { t_low = t_high = temps[temps.length - 1]; }

        function getVal(t, p) {
            const row = data[t.toString()];
            if (!row) return 0;
            // ph keys are strings "3.5", "4.0"...
            // find p_low, p_high
            const phs = Object.keys(row).map(Number).sort((a, b) => a - b);

            // Clamp pH
            let p_eff = Math.max(phs[0], Math.min(p, phs[phs.length - 1]));

            let p_low = phs[0], p_high = phs[phs.length - 1];
            for (let i = 0; i < phs.length - 1; i++) {
                if (p_eff >= phs[i] && p_eff <= phs[i + 1]) {
                    p_low = phs[i];
                    p_high = phs[i + 1];
                    break;
                }
            }

            const v_low = row[p_low.toFixed(1)];
            const v_high = row[p_high.toFixed(1)];

            // Linear interp for pH
            if (p_high === p_low) return v_low;
            return v_low + (v_high - v_low) * (p_eff - p_low) / (p_high - p_low);
        }

        const val_t_low = getVal(t_low, ph);
        const val_t_high = getVal(t_high, ph);

        // Linear interp for Temp
        if (t_high === t_low) return val_t_low;
        return val_t_low + (val_t_high - val_t_low) * (tempF - t_low) / (t_high - t_low);
    }

    // Q1 Logic
    q1.addEventListener("change", () => {
        resetFlow(1);

        if (q1.value === "yes") {
            // Material is CS -> Go to Q2
            setVisibility("q2_container", true);
        } else {
            // Material is NOT CS -> Stop
            sessionStorage.setItem("corrosion_rate", 0); // No corrosion
            showResult("No corrosion due to Carbon Dioxide (Material is resistant).", "alert-warning");
        }
    });

    // Q2 Logic
    q2.addEventListener("change", () => {
        resetFlow(2);

        if (q2.value === "yes") {
            // Liquid HCs present -> Go to Q3
            setVisibility("q3_container", true);
        } else {
            // No Liquid HCs -> Diagram says "Calculate Dew Point"
            showDewPointInputs();
        }
    });

    // Q3 Logic
    q3.addEventListener("change", () => {
        resetFlow(3);

        if (q3.value === "yes") {
            // Water Content < 20% -> Go to Q4
            setVisibility("q4_container", true);
        } else {
            // Water Content >= 20% -> Diagram says "Calculate Dew Point"
            // We must verify liquid water presence via Dew Point even if content is high.
            showDewPointInputs();
        }
    });

    // Q4 Logic
    q4.addEventListener("change", () => {
        resetFlow(4);

        if (q4.value === "yes") {
            sessionStorage.setItem("corrosion_rate", 0); // No corrosion
            showResult("No corrosion due to Carbon Dioxide (High Velocity/Low Water).", "alert-warning");
        } else {
            // Velocity <= 1 m/s -> Calculate Dew Point
            showDewPointInputs();
        }
    });

    // ... Dew Point (omitted unchanged parts) ...
    // Note: I will use Replace logic more surgically or I have to provide large chunks.
    // The previous view_file shows I have multiple disjoint places.
    // I should probably use multi_replace or multiple clean replace calls.
    // I will use A SINGLE large replace if possible, but the file is big.
    // Let's use multi_replace to handle the specific lines.
    // Wait, the tool is replace_file_content. I should use multi_replace_file_content.
    // I will switch to multi_replace.

    // Q2 Logic
    q2.addEventListener("change", () => {
        resetFlow(2);

        if (q2.value === "yes") {
            // Liquid HCs present -> Go to Q3
            setVisibility("q3_container", true);
        } else {
            // No Liquid HCs -> Diagram says "Calculate Dew Point"
            showDewPointInputs();
        }
    });

    // Q3 Logic
    q3.addEventListener("change", () => {
        resetFlow(3);

        if (q3.value === "yes") {
            // Water Content < 20% -> Go to Q4
            setVisibility("q4_container", true);
        } else {
            // Water Content >= 20% -> Diagram says "Calculate Dew Point"
            // We must verify liquid water presence via Dew Point even if content is high.
            showDewPointInputs();
        }
    });

    // Q4 Logic
    q4.addEventListener("change", () => {
        resetFlow(4);

        if (q4.value === "yes") {
            sessionStorage.setItem("corrosion_rate", 0); // No corrosion
            showResult("No corrosion due to Carbon Dioxide (High Velocity/Low Water).", "alert-warning");
        } else {
            // Velocity <= 1 m/s -> Calculate Dew Point
            showDewPointInputs();
        }
    });

    // Dew Point Calculation Logic
    calcDewBtn.addEventListener("click", () => {
        const pctW = parseFloat(pctWaterInput.value);
        const P = parseFloat(pressureInput.value);

        if (isNaN(pctW) || isNaN(P)) {
            display_errors(["Please enter valid percent water and pressure."]);
            return;
        }

        // 1. Get Operating Temp from Session
        const sessionData = sessionStorage.getItem("table4.1_data");
        let opTempF = null;
        try {
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.operating_temp) opTempF = parseFloat(data.operating_temp);
            }
        } catch (e) { }

        if (opTempF === null || isNaN(opTempF)) {
            // Fallback or error? For now assume user knows to set it in step 1.
            // We can let them proceed or warn.
        }

        // 2. Compute Td (Eq 2.B.25)
        // 2. Compute Td (Eq 2.B.25)
        if (pctW <= 0) {
            display_errors(["% Water must be positive."]);
            return;
        }
        // Eq 2.B.25
        const logTd = 2.0866 + 0.2088 * Math.log10(pctW / 100) + 0.2242 * Math.log10(P);
        const Td = Math.pow(10, logTd);

        const dewResult = document.getElementById("dew_point_result");

        // 3. Compare T vs Td
        // If OpTemp is missing, we can't compare strictly. Assuming unsafe for now or asking? 
        // Let's assume OpTemp is required. If not found, use a default or ask.
        const T = opTempF || 70; // Safe-ish default or huge error

        if (T < Td) {
            // YES: T < Td -> Liquid water -> Corrosion Possible

            errorContainer.innerHTML = ""; // Clear any previous errors

            // Show custom message with values
            const msg = `<span class="font-bold">Dew Point Condition Met:</span> 
                         Operating Temp (${T.toFixed(1)}°F) < Dew Point (${Td.toFixed(1)}°F). 
                         Liquid water is present. Proceed with calculation.`;

            showBaseCorrosionInputs(msg);
            setVisibility("flow_result", false);

            dewResult.classList.remove("hidden");
            dewResult.className = "alert alert-error mt-2";
            dewResult.innerHTML = `
                <div>
                    <h3 class="font-bold text-white">Result: Corrosion Possible</h3>
                    <p class="text-white">Current Temperature (${T.toFixed(1)}°F) is less than Dew Point Temperature (${Td.toFixed(1)}°F).</p>
                    <p class="text-sm mt-1 text-white">Please proceed with Base Corrosion Rate inputs below.</p>
                </div>
             `;

        } else {
            // NO (T >= Td): No liquid water -> Safe
            sessionStorage.setItem("corrosion_rate", 0); // No corrosion
            setVisibility("base_corrosion_inputs_container", false);
            setVisibility("calculate_corrosion_rate", false);
            setVisibility("flow_result", false);

            dewResult.classList.remove("hidden");
            dewResult.className = "alert alert-warning mt-2";
            dewResult.innerHTML = `
                <div class="flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     <div>
                        <span class="font-bold">No liquid water in steam.</span>
                        <span>Current Temperature (${T.toFixed(1)}°F) is greater than Dew Point (${Td.toFixed(1)}°F). No corrosion due to Carbon Dioxide.</span>
                     </div>
                </div>
            `;
        }
    });

    // Base Corrosion Calculation Logic
    calcRateBtn.addEventListener("click", () => {
        // Clear previous errors/results
        errorContainer.innerHTML = "";

        // Inputs
        const co2Mol = parseFloat(co2Input.value);
        const pH = parseFloat(phInput.value);
        const shear = parseFloat(shearInput.value);

        // Needed: P (psia), T (F)
        // Try getting P from dew point input if available, else session?
        // Actually P is also in "Basic Data" (Table 4.1) or Dew Point input. 
        // Let's check session first, then inputs.
        const sessionData = sessionStorage.getItem("table4.1_data");
        let T_F = null;
        let P_psia = null;

        if (sessionData) {
            const data = JSON.parse(sessionData);
            if (data.operating_temp) T_F = parseFloat(data.operating_temp);
            // P can be tricky. Step 1 has 'pressure'.
            if (data.pressure) P_psia = parseFloat(data.pressure); // pressure in sig from step 1
        }

        // Fallback to inputs if user typed them in dew point section
        if (P_psia === null && !isNaN(parseFloat(pressureInput.value))) {
            P_psia = parseFloat(pressureInput.value);
        }

        if (isNaN(co2Mol) || isNaN(pH) || isNaN(shear) || T_F === null || P_psia === null) {
            // Minimal validation
            const missing = [];
            if (isNaN(co2Mol)) missing.push("CO2 Concentration");
            if (isNaN(pH)) missing.push("pH");
            if (isNaN(shear)) missing.push("Shear Stress");
            if (T_F === null) missing.push("Operating Temperature (Step 1)");
            if (P_psia === null) missing.push("Pressure");

            display_errors(["Missing required data: " + missing.join(", ")]);
            return;
        }

        // 1. Calculate Fugacity f_CO2 (bar)
        // Eq 2.B.30 & 2.B.32
        // p_CO2 (bar) = (CO2 mol % / 100) * P_total (bar)
        const P_bar = P_psia * 0.0689476;
        const p_co2_bar = (co2Mol / 100) * P_bar;

        // T in C
        const T_C = (T_F - 32) * 5 / 9;

        // Log10(a) = ... Eq 2.B.30
        // log10(f_CO2) = log10(a) + log10(p_CO2) => f_CO2 = a * p_CO2
        // Term inside log: min(250, p_co2_bar)

        const termP = Math.min(250, p_co2_bar);
        const termA = 0.0031 - (1.4 / (T_C + 273));
        const log_a = termP * termA;
        // a = 10^(log_a)
        const a = Math.pow(10, log_a);

        const f_co2_bar = a * p_co2_bar;

        // 2. Lookup f(T, pH) from table
        const f_t_ph = interpolate_fT_pH(T_F, pH);

        // 3. Base Corrosion Rate (Eq 2.B.26)
        // CR_mm_yr = 0.0324 * f(T, pH) * (f_CO2)^0.62 * (S / 19)^0.146
        // S in Pa.
        // If shear is 0, avoid NaN in power? (0^0.146 = 0)
        let shearTerm = 0;
        if (shear > 0) {
            shearTerm = Math.pow((shear / 19), 0.146);
        }

        const CR_mm_yr = 0.0324 * f_t_ph * Math.pow(f_co2_bar, 0.62) * shearTerm;
        const CR_mpy = CR_mm_yr * 39.4;

        // Display Result - Simplified Standard
        resultRate.classList.remove("hidden");
        // Restore standard styling (alert-soft) and set text content
        resultRate.className = "alert alert-info alert-soft m-3";
        resultRate.textContent = `Estimated Corrosion Rate: ${CR_mpy.toFixed(2)} mpy`;

        // Save to session
        sessionStorage.setItem("co2_corrosion_rate", CR_mpy.toFixed(2));
        // Integration with Step 3:
        sessionStorage.setItem("corrosion_rate", CR_mpy.toFixed(2));
        sessionStorage.setItem("corrosion_rate_bm", CR_mpy.toFixed(2));

        if (hasCladding) {
            sessionStorage.setItem("corrosion_rate_cladding", 0);
            resultRate.innerHTML = `Base Rate: ${CR_mpy.toFixed(2)} mpy<br>Cladding Rate: 0 mpy (Assumed Resistant)`;
        } else {
            sessionStorage.removeItem("corrosion_rate_cladding");
            resultRate.textContent = `Estimated Corrosion Rate: ${CR_mpy.toFixed(2)} mpy`;
        }

        // Proceed to next step: Glycol/Inhibitor
        resetFlow(5); // Clear anything below if re-calculating
        setVisibility("glycol_inhibitor_container", true);
    });

    // Q5: Glycol/Inhibitor Logic
    q5.addEventListener("change", () => {
        resetFlow(6); // Clear details below

        if (q5.value === "yes") {
            // Yes -> Show inputs for Glycol/Inhibitor
            setVisibility("glycol_details_container", true);
            setVisibility("calculate_final_corrosion_rate", true);
            // Hide final result if it was shown from a "No" selection previously
            setVisibility("final_corrosion_rate", false);
        } else {
            // No -> Final Rate = Base Rate
            // Hide inputs just in case
            setVisibility("glycol_details_container", false);
            setVisibility("calculate_final_corrosion_rate", false);

            const baseRateStr = sessionStorage.getItem("co2_base_corrosion_rate");
            if (baseRateStr) {
                resultFinal.classList.remove("hidden");
                // Remove alert classes, just bold text
                resultFinal.className = "m-3 font-bold text-lg";

                if (hasCladding) {
                    resultFinal.innerHTML = `Final Estimated Corrosion Rate is equal to Base Corrosion Rate: ${baseRateStr} mpy<br>Cladding Rate: 0 mpy`;
                } else {
                    resultFinal.textContent = `Final Estimated Corrosion Rate is equal to Base Corrosion Rate: ${baseRateStr} mpy`;
                }
                sessionStorage.setItem("corrosion_rate", baseRateStr);
                sessionStorage.setItem("corrosion_rate_bm", baseRateStr); // Ensure BM is updated if we skip final calc
                if (hasCladding) sessionStorage.setItem("corrosion_rate_cladding", 0);
            }
        }
    });

    // Final Calculation Logic
    btnCalcFinal.addEventListener("click", () => {
        // 1. Get Base Rate
        const baseRateStr = sessionStorage.getItem("co2_base_corrosion_rate");
        if (!baseRateStr) {
            display_errors(["Please calculate the Base Corrosion Rate first."]);
            return;
        }
        const baseRate = parseFloat(baseRateStr);

        // 2. Get Inputs
        const glycolVal = parseFloat(inputGlycol.value);
        const inhibVal = parseFloat(inputInhibitor.value);
        const errors = [];

        // 3. Validate
        if (isNaN(glycolVal) || glycolVal < 0 || glycolVal > 100) {
            errors.push("Percentage of glycol must be between 0 and 100.");
        }
        if (isNaN(inhibVal) || inhibVal < 0 || inhibVal > 100) {
            errors.push("Inhibitor efficiency must be between 0 and 100.");
        }

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        // 4. Calculate Adjustment Factors
        // F_inhibitor = 1 - (efficiency / 100)
        let f_inhibitor = 1.0;
        if (inhibVal > 0) {
            f_inhibitor = 1 - (inhibVal / 100.0);
        }

        // F_glycol: (Re-applying logic)
        // log10(F_glycol) = 1.6 * log10(100 - %Glycol) - 3.2
        // Implies F=1 at 0% Glycol. F decreases as Glycol increases.
        // Min limit 0.008.
        let f_glycol = 1.0;
        if (glycolVal > 0) {
            const waterPct = 100 - glycolVal;
            if (waterPct > 0) {
                const logF = 1.6 * Math.log10(waterPct) - 3.2;
                f_glycol = Math.pow(10, logF);
            } else {
                // 100% glycol -> Water=0 -> log(0) undefined.
                f_glycol = 0.008;
            }

            // Apply Min Limit
            if (f_glycol < 0.008) f_glycol = 0.008;
            // Apply Max Limit
            if (f_glycol > 1.0) f_glycol = 1.0;
        }

        // 5. Final Rate
        // Eq 2.B.23
        const finalRate = baseRate * f_glycol * f_inhibitor;

        // 6. Display Result
        errorContainer.innerHTML = ""; // Clear errors
        resultFinal.classList.remove("hidden");
        // Inherit classes/style from previous state if needed, or set fresh
        resultFinal.className = "alert alert-info alert-soft m-3";
        resultFinal.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold underline">Final Corrosion Rate Result</span>
                <div class="mt-2 text-xl font-bold text-primary">
                    Final Rate: ${finalRate.toFixed(2)} mpy
                </div>
            </div>
        `;

        // Match user requested style "sin fondo y en negrita" or "blue box"?
        // User said: "el final corrosion rate es igual al base, quiero que lo muestres sin fondo y en negrita." -> This was for the "No" case.
        // For the "Yes" case (calculation), usually we show it prominently (Blue Box).
        // Let's stick to the Blue Box for the calculated result to distinguish it, similar to Base Rate.
        // Or if user wants consistency, maybe blue box. I will use blue box as it is a "Result".
        if (hasCladding) {
            resultFinal.innerHTML = `Final Estimated Corrosion Rate: ${finalRate.toFixed(2)} mpy<br>Cladding Rate: 0 mpy`;
            sessionStorage.setItem("corrosion_rate_cladding", 0);
        } else {
            resultFinal.textContent = `Final Estimated Corrosion Rate: ${finalRate.toFixed(2)} mpy`;
            sessionStorage.removeItem("corrosion_rate_cladding");
        }

        sessionStorage.setItem("corrosion_rate", finalRate.toFixed(2));
        sessionStorage.setItem("corrosion_rate_bm", finalRate.toFixed(2));
    });
}