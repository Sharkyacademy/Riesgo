/**
 * Logic for Step 3: Determining t_rdi and age_tk
 */

const MS_PER_YEAR_S3_FINAL = 1000 * 60 * 60 * 24 * 365.25;

function step3_init() {
    const hasInspectionSelect = document.getElementById("step3_has_inspection");
    const containerYes = document.getElementById("step3_inspection_data_container");
    const resultContainer = document.getElementById("step3_result_container");
    const dateInput = document.getElementById("step3_inspection_date");
    const trdiInput = document.getElementById("step3_trdi");
    const calcBtn = document.getElementById("step3_calc_btn");
    const unitLabel = document.getElementById("step3_unit_label");

    // --- PART 2 INITIALIZATION ---
    const part2Container = document.getElementById("step3_part2_container");
    const crbmInput = document.getElementById("step3_crbm");
    const crcmInput = document.getElementById("step3_crcm");
    const crcmWrapper = document.getElementById("step3_crcm_wrapper");
    const part2Btn = document.getElementById("step3_part2_btn");
    const part2Result = document.getElementById("step3_part2_result");
    const unitSpans = document.querySelectorAll(".unit_corrosion");

    // --- PART 3 INITIALIZATION ---
    const part3Container = document.getElementById("step3_part3_container");
    const linerTypeSelect = document.getElementById("step3_liner_type");
    const linerSubtypeContainer = document.getElementById("step3_liner_subtype_container");
    const linerSubtypeSelect = document.getElementById("step3_liner_subtype");
    const linerConditionSelect = document.getElementById("step3_liner_condition");
    const onlineMonitorSelect = document.getElementById("step3_online_monitoring");
    const part3Btn = document.getElementById("step3_part3_btn");
    const part3Result = document.getElementById("step3_part3_result");

    if (!hasInspectionSelect) return;

    // 1. Determine Display Unit ... (keep existing)
    const tableDataStr = sessionStorage.getItem('table4.1_data');
    let displayUnit = "mm";

    if (tableDataStr) {
        // ... (keep existing parsing logic)
        // ...
    }

    // ... (keep existing unitLabel update)

    // ... (keep existing displayResult, saveStep3Values, handleSelection, calculateFromInspection)

    // Listeners
    hasInspectionSelect.onchange = handleSelection;

    // Manual Trigger only
    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault();
            calculateFromInspection();
        };
    }

    // Run initial state check
    handleSelection();

    // --- PART 2 LOGIC ---
    // (keep existing Part 2 logic: get variables, determine unit, prefill, calculatePart2)
    // ...

    // --- PART 3 LOGIC (Internal Liner) ---
    let hasLiner = false;
    let ageLiner = 0;
    let table47Data = [];
    let table48Data = [];

    if (tableDataStr) {
        try {
            const data = JSON.parse(tableDataStr);
            if (data.has_internal_liner && data.has_internal_liner.toLowerCase() === 'yes') {
                hasLiner = true;
                // Calculate age_liner from installation date to now
                if (data.internal_liner) { // date string YYYY-MM-DD
                    const installDate = new Date(data.internal_liner);
                    const now = new Date();
                    const diffTime = Math.abs(now - installDate);
                    ageLiner = diffTime / MS_PER_YEAR_S3_FINAL;
                }
            }
        } catch (e) { console.error("Error reading liner info", e); }
    }

    // Show Part 3 if Part 2 is done? Or sequentially?
    // Let's hide initially, and show if hasLiner is true AND Part 2 is done?
    // Or just show if hasLiner is true?
    // The prompt implies sequential flow. Let's make it visible if hasLiner is true, 
    // but maybe clearer to show it always if applicable.
    // Show Part 3 if Part 2 is done? Or sequentially?
    // Progressive disclosure: Hide initially. Show only after Part 2 calculation.
    if (part3Container) {
        part3Container.classList.add("hidden");
    }

    async function loadLinerTables() {
        try {
            const [res47, res48] = await Promise.all([
                fetch('/static/formula_app/data/json/step3/table47.JSON'),
                fetch('/static/formula_app/data/json/step3/table48.JSON')
            ]);

            const json47 = await res47.json();
            const json48 = await res48.json();

            table47Data = json47.data;
            table48Data = json48.data;

            populateLinerTypes();
        } catch (e) {
            console.error("Error loading liner tables", e);
        }
    }

    function populateLinerTypes() {
        if (!linerTypeSelect) return;
        linerTypeSelect.innerHTML = '<option value="" disabled selected>Select Liner Type</option>';

        table47Data.forEach((item, index) => {
            const opt = document.createElement("option");
            opt.value = index; // Use index to reference data easily
            opt.textContent = item.linerType;
            linerTypeSelect.appendChild(opt);
        });

        linerTypeSelect.onchange = () => {
            const idx = linerTypeSelect.value;
            const item = table47Data[idx];

            if (item.subtypes) {
                linerSubtypeContainer.classList.remove("hidden");
                linerSubtypeSelect.innerHTML = '<option value="" disabled selected>Select Subtype</option>';
                item.subtypes.forEach(sub => {
                    const sOpt = document.createElement("option");
                    sOpt.value = sub;
                    sOpt.textContent = sub;
                    linerSubtypeSelect.appendChild(sOpt);
                });
            } else {
                linerSubtypeContainer.classList.add("hidden");
                linerSubtypeSelect.innerHTML = '';
            }
        };
    }

    function getExpectedLife(typeIdx, subtype) {
        const item = table47Data[typeIdx];
        if (!item) return 0;

        let rangeStr = item.expectedAge; // e.g. "5 to 10 years"

        // This is a range. How to treat? Conservative? Average? 
        // Usually conservative means taking the LOWER bound for life? 
        // Or if we consume life, maybe average?
        // Let's parse the numbers.
        // matches: "1 to 3 years", "5 to 15 years", etc.
        const matches = rangeStr.match(/(\d+)\s+to\s+(\d+)/);
        if (matches) {
            const min = parseFloat(matches[1]);
            const max = parseFloat(matches[2]);
            return (min + max) / 2; // Average for now? Or ask user?
            // "determine the expected age using Table 4.7"
            // Let's use average as a default approximation.
        }

        // Special case: "Calculated based on thickness..." -> Handled differently?
        // If type is Cladding, we shouldn't be here (Part 2 handled it).
        return 0;
    }

    function calculatePart3() {
        const typeIdx = linerTypeSelect.value;
        const condition = linerConditionSelect.value;
        const onlineMon = onlineMonitorSelect.value;

        if (typeIdx === "" || condition === "") {
            alert("Please select Liner Type and Condition");
            return;
        }

        // Get F_LC from Table 4.8
        const condItem = table48Data.find(d => d.qualitativeCondition === condition);
        const F_LC = condItem ? condItem.adjustmentMultiplier.value : 1.0;

        // Get F_OM
        const F_OM = (onlineMon === "yes") ? 0.1 : 1.0;

        // Get RL_exp
        let RL_exp = getExpectedLife(typeIdx);
        // If it returns 0 (e.g. Cladding type selected by mistake or parse fail), handle it
        if (RL_exp === 0) {
            // Maybe alert?
        }

        // Equation 2.11: age_rc = (RL_exp - age_liner) * F_OM / F_LC
        // Wait, check formula: (RL_exp - age_liner) / F_LC * F_OM ??
        // Image says: (RL_exp - age_liner) / F_LC * F_OM [Linearly]
        // Let me re-read image.
        // It's a fraction: [ (RL_exp - age_liner) / F_LC ] * F_OM ? 
        // The image shows F_OM multiplied at the end.
        // Parenthesis implies whole term derived.

        let numerator = RL_exp - ageLiner;
        if (numerator < 0) numerator = 0; // Life exceeded?

        const ageRc = (numerator / F_LC) * F_OM;


        // Save
        sessionStorage.setItem("liner_age_rc", ageRc.toFixed(3));

        // Save 'step3_data' validation flag (as checked in steps_handler.js)
        sessionStorage.setItem("step3_data", "true");

        // Display
        part3Result.classList.remove("hidden");
        part3Result.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold underline mb-2">Step 3 - Part 3 Results</span>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col">
                        <span class="font-bold text-primary">Expected Life (RL<sub>exp</sub>)</span>
                        <span>${RL_exp} years (avg)</span>
                    </div>
                    <div class="flex flex-col">
                         <span class="font-bold text-primary">Liner Age</span>
                        <span>${ageLiner.toFixed(2)} years</span>
                    </div>
                    <div class="flex flex-col">
                         <span class="font-bold text-primary">Adjusted Rem. Life (age<sub>rc</sub>)</span>
                        <span>${ageRc.toFixed(3)} years</span>
                    </div>
                </div>
            </div>
        `;

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }
    }

    // Listeners
    if (part3Btn) {
        part3Btn.onclick = (e) => {
            e.preventDefault();
            calculatePart3();
        };
    }

    if (tableDataStr) {
        try {
            const data = JSON.parse(tableDataStr);
            if (data.measurement_unit) {
                // Mapping logic: farenheit -> inches (in), celsius -> mm
                // Using toLowerCase() to be safe, though HTML values are lowercase
                const unit = data.measurement_unit.toLowerCase();
                if (unit === "farenheit") {
                    displayUnit = "in";
                } else if (unit === "celsius") {
                    displayUnit = "mm";
                }
            }
        } catch (e) {
            console.error("Error parsing table data", e);
        }
    }

    // Update the label next to the input
    if (unitLabel) unitLabel.textContent = displayUnit;

    function displayResult(trdi, ageTk, isDefault) {
        if (!resultContainer) return;

        resultContainer.classList.remove("hidden");

        const methodText = isDefault
            ? "Values taken from Step 1 (Furnished Thickness & Equipment Age)."
            : "Values calculated from Inspection Date and Measured Thickness.";

        resultContainer.innerHTML = `
            <div class="flex flex-col w-full">
                <span class="font-bold underline mb-2">Step 3 - Part 1 Results</span>
                <span class="text-sm mb-2">${methodText}</span>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div class="flex flex-col">
                        <span class="font-bold text-primary">Last Known Thickness (t<sub>rdi</sub>)</span>
                        <span class="text-lg">${parseFloat(trdi).toFixed(3)} ${displayUnit}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="font-bold text-primary">Time in Service (age<sub>tk</sub>)</span>
                        <span class="text-lg">${parseFloat(ageTk).toFixed(3)} years</span>
                    </div>
                </div>
            </div>
        `;

        // Show Part 2 ONLY after Part 1 result is displayed
        if (part2Container) part2Container.classList.remove("hidden");
    }

    function saveStep3Values(trdi, ageTk, isDefault = false) {
        sessionStorage.setItem("t_rdi", trdi);
        sessionStorage.setItem("age_tk", ageTk);
        displayResult(trdi, ageTk, isDefault);
    }

    function handleSelection() {
        const val = hasInspectionSelect.value;

        // Hide result initially on logic switch
        resultContainer.classList.add("hidden");
        // Hide Part 2 when switching logic
        // Hide Part 2 when switching logic
        if (part2Container) part2Container.classList.add("hidden");
        // Hide Part 3 when switching logic
        if (part3Container) part3Container.classList.add("hidden");


        if (val === "yes") {
            containerYes.classList.remove("hidden");
            // Wait for user to click button
        } else if (val === "no") {
            containerYes.classList.add("hidden");

            // Fallback Step 1
            const compAgeStr = sessionStorage.getItem('comp_age');

            if (tableDataStr && compAgeStr) {
                const tableData = JSON.parse(tableDataStr);
                saveStep3Values(tableData.thickness, compAgeStr, true);
            }
        } else {
            containerYes.classList.add("hidden");
        }
    }

    function calculateFromInspection() {
        const dateVal = dateInput.value;
        const trdiVal = parseFloat(trdiInput.value);

        if (dateVal && !isNaN(trdiVal)) {
            // Create dates and normalize to midnight for comparison
            const inspDate = new Date(dateVal); // Usually parses as UTC midnight for YYYY-MM-DD
            // However, to be safe and consistent with "local day":
            // We can compare the string value directly against the local YYYY-MM-DD string
            // OR use setHours(0,0,0,0) on a local date object.

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // Treat input date as local midnight
            // parsing 'yyyy-mm-dd' often defaults to UTC.
            // Let's use the parts to build a local date.
            const [y, m, d] = dateVal.split('-').map(Number);
            const inspDateLocal = new Date(y, m - 1, d);
            inspDateLocal.setHours(0, 0, 0, 0);

            // Validate future date
            if (inspDateLocal > now) {
                alert("Inspection date cannot be in the future.");
                dateInput.value = ""; // Clear invalid date
                resultContainer.classList.add("hidden");
                if (part2Container) part2Container.classList.add("hidden"); // Hide Part 2 if validation fails
                return;
            }

            const diffTime = Math.abs(now - inspDateLocal); // Difference from today (or we could use exact time if we had it, but for age calculations day-level is usually fine or preferable)
            // Note: Previously we calculated age based on 'now' (exact time).
            // Do we want exact time or date diff? The prompt implies date-level restriction.
            // For 'age_tk', typically it's years. 
            // If we want exact age from inspection date to NOW (current second):
            const nowExact = new Date();
            // inspDateLocal is midnight of that day.
            // If inspection was "today", age is fraction of day? Or 0?
            // Usually inspection date implies "at some point that day".
            // Let's stick to simple diff from that date to now.

            const diffTimeExact = Math.abs(nowExact - inspDateLocal);
            const ageTk = (diffTimeExact / MS_PER_YEAR_S3_FINAL).toFixed(3);

            saveStep3Values(trdiVal, ageTk, false);
        } else {
            alert("Please enter a valid Date and Thickness.");
        }
    }

    // Listeners
    hasInspectionSelect.onchange = handleSelection;

    // Manual Trigger only
    if (calcBtn) {
        calcBtn.onclick = (e) => {
            e.preventDefault(); // prevent any form sub
            calculateFromInspection();
        };
    }

    // Run initial state check
    handleSelection();
    // --- PART 2 INITIALIZATION (Moved to top) ---

    // Get Table 1 Data variables
    let hasCladding = false;
    let claddingThickness = 0;

    if (tableDataStr) {
        try {
            const data = JSON.parse(tableDataStr);
            if (data.has_cladding === 'yes') {
                hasCladding = true;
                // Try 'cladding' first, then 'cladding_input' (depends on how table4.1 saves it)
                claddingThickness = parseFloat(data.cladding) || parseFloat(data.cladding_input) || 0;
            }
        } catch (e) { console.error("Error reading cladding info", e); }
    }

    // Determine Corrosion Unit (mpy vs mm/yr)
    let corrosionUnit = "mm/yr";
    if (displayUnit === 'in') corrosionUnit = "mpy"; // if displayUnit is 'in', it means Fahrenheit

    if (unitSpans) {
        unitSpans.forEach(span => span.textContent = corrosionUnit);
    }

    // Hide Part 2 initially
    if (part2Container) part2Container.classList.add("hidden");

    // Handle Cladding UI
    if (hasCladding) {
        if (crcmWrapper) crcmWrapper.classList.remove("hidden");
    } else {
        if (crcmWrapper) crcmWrapper.classList.add("hidden");
    }

    // Pre-fill Logic from Step 2
    const rateBM = parseFloat(sessionStorage.getItem("corrosion_rate_bm"));
    const rateClad = parseFloat(sessionStorage.getItem("corrosion_rate_cladding"));
    const rateGeneric = parseFloat(sessionStorage.getItem("corrosion_rate"));

    function preFillRates() {
        if (hasCladding) {
            // Cladding Rate Pre-fill
            if (!isNaN(rateClad)) {
                if (crcmInput) crcmInput.value = rateClad;
            } else if (!isNaN(rateGeneric)) {
                if (crcmInput) crcmInput.value = rateGeneric;
            }
            // BM Rate Pre-fill
            if (!isNaN(rateBM) && crbmInput) {
                crbmInput.value = rateBM;
            } else if (!isNaN(rateGeneric) && crbmInput) {
                crbmInput.value = rateGeneric;
            }
        } else {
            // Not clad -> Use BM rate or Generic
            if (!isNaN(rateBM)) {
                if (crbmInput) crbmInput.value = rateBM;
            } else if (!isNaN(rateGeneric)) {
                if (crbmInput) crbmInput.value = rateGeneric;
            }
        }
    }

    // Call prefill
    preFillRates();

    function calculatePart2() {
        if (!crbmInput) return;
        const crbm = parseFloat(crbmInput.value) || 0;
        let crcm = 0;
        let ageRc = 0;

        if (hasCladding) {
            crcm = parseFloat(crcmInput.value) || 0;

            // Calculate t_bm (Base Metal Thickness) from Step 1 Data
            // Assumption: 'thickness' in Step 1 is Total Furnished Thickness.
            // t_bm = nominal_thickness - nominal_cladding
            let nominalThickness = 0;
            try {
                const data = JSON.parse(tableDataStr);
                nominalThickness = parseFloat(data.thickness) || 0;
            } catch (e) { }

            const t_bm = Math.max(0, nominalThickness - claddingThickness);

            // Get Measured Thickness (t_rdi) from Part 1 input
            // The input ID for "Last Known Thickness" is 'step3_trdi' (from init) which is 'trdiInput' var here?
            // Wait, trdiInput is defined in init scope. I need to access it.
            // Since calculatePart2 is inside step3_init, it has access to trdiInput closure.
            const t_rdi = parseFloat(trdiInput.value) || 0;

            // Calculate Current Cladding Thickness (t_cm)
            // t_cm = t_rdi - t_bm
            // Note: If t_rdi < t_bm, it implies cladding is gone and base metal is compromised.
            const t_cm = Math.max(0, t_rdi - t_bm);

            // age_rc = max(t_cm / Cr_cm, 0.0)
            if (crcm > 0) {
                ageRc = Math.max(t_cm / crcm, 0.0);
            } else {
                ageRc = 0;
            }
        } else {
            // No cladding
            crcm = 0;
            ageRc = 0;
        }

        // Save
        sessionStorage.setItem("Cr_bm", crbm);
        sessionStorage.setItem("Cr_cm", crcm);
        sessionStorage.setItem("age_rc", ageRc);

        // Display
        if (part2Result) {
            part2Result.classList.remove("hidden");
            let resultHTML = `
                <div class="flex flex-col">
                    <span class="font-bold underline mb-2">Step 3 - Part 2 Results</span>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div class="flex flex-col">
                            <span class="font-bold text-primary">Base Metal Rate (Cr,bm)</span>
                            <span>${crbm.toFixed(3)} ${corrosionUnit}</span>
                        </div>
            `;

            if (hasCladding) {
                resultHTML += `
                        <div class="flex flex-col">
                            <span class="font-bold text-primary">Cladding Rate (Cr,cm)</span>
                            <span>${crcm.toFixed(3)} ${corrosionUnit}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="font-bold text-primary">Cladding Rem. Life (age<sub>rc</sub>)</span>
                            <span>${ageRc.toFixed(3)} years</span>
                        </div>
                `;
            } else {
                resultHTML += `
                        <div class="flex flex-col text-gray-400">
                            <span>No Cladding</span>
                        </div>
                `;
            }

            resultHTML += `</div></div>`;
            part2Result.innerHTML = resultHTML;

            // Show Part 3 if applicable AND if we have just calculated Part 2
            if (hasLiner && part3Container) {
                part3Container.classList.remove("hidden");
                loadLinerTables();
            } else {
                // If NO liner, step 3 is effectively done here.
                sessionStorage.setItem("step3_data", "true");
                if (typeof window.updateNextButtonState === 'function') {
                    window.updateNextButtonState();
                }
            }
        }
    }

    if (part2Btn) {
        part2Btn.onclick = (e) => {
            e.preventDefault();
            calculatePart2();
        }
    }
}
window.step3_init = step3_init;
