/**
 * Logic for Step 4: Determine t_min
 */

function step4_init() {
    console.log("Step 4 Init");

    const methodSelect = document.getElementById("step4_calc_method");
    const calcContainer = document.getElementById("step4_method_calc_container");
    const manualContainer = document.getElementById("step4_method_manual_container");
    const manualLabel = document.getElementById("step4_manual_label");
    const geomContainer = document.getElementById("step4_geometry_inputs_container");
    const stressInput = document.getElementById("step4_allowable_stress");
    const manualInput = document.getElementById("step4_manual_tmin");
    const resultContainer = document.getElementById("step4_result_container");
    const resultValue = document.getElementById("step4_result_value");
    const calcBtn = document.getElementById("step4_calc_btn");
    const stressUnitLabel = document.getElementById("step4_stress_unit");
    const unitDisplays = document.querySelectorAll(".unit_display");

    let table1Data = {};
    let table42Data = {};
    let table43Data = {};
    let currentGeomType = null;
    let units = "imperial"; // default

    // Load Data
    const t1Str = sessionStorage.getItem("table4.1_data");
    if (t1Str) {
        try {
            table1Data = JSON.parse(t1Str);
            // Determine units
            if (table1Data.measurement_unit && table1Data.measurement_unit.toLowerCase() === "celsius") {
                units = "metric";
                stressUnitLabel.textContent = "MPa";
                unitDisplays.forEach(s => s.textContent = "mm");
            } else {
                units = "imperial";
                stressUnitLabel.textContent = "psi"; // or ksi? ASME often uses ksi or psi. Let's assume psi for calc consistency or clarifying input.
                // Usually allow stress is in ksi or psi. Let's use psi to match Pressure (psi).
                // If user enters ksi, calc will be off. 
                // Let's explicitly say 'psi' for Imperial.
                stressUnitLabel.textContent = "psi";
                unitDisplays.forEach(s => s.textContent = "in");
            }
        } catch (e) { console.error(e); }
    }



    // Restore previously saved Allowable Stress if available
    const savedS = sessionStorage.getItem("allowable_stress");
    if (savedS && stressInput) {
        stressInput.value = savedS;
    }

    // Load JSONs
    Promise.all([
        fetch('/static/formula_app/data/json/step4/table42.JSON').then(r => r.json()),
        fetch('/static/formula_app/data/json/step4/table43.JSON').then(r => r.json())
    ]).then(([t42, t43]) => {
        table42Data = t42;
        table43Data = t43;
        initGeometry();
    }).catch(err => console.error("Error loading Step 4 JSONs", err));


    function initGeometry() {
        if (!table1Data.comp_type || !table1Data.equip_type) {
            geomContainer.innerHTML = `<p class="text-error">Please complete Step 1 (Component Selection) first.</p>`;
            return;
        }

        // Find Geometry Type from Table 4.2
        // table42Data structure: { equipment_data: [ { equipment_type: "...", components: [...], geometry_types: [...] } ] }

        // Find matching equipment
        // Note: equipment_type in JSON might differ in case/spacing from Step 1 value.
        // Let's try flexible matching or direct.
        // Step 1 values: 'HeatExchanger' vs JSON 'Heat exchanger'. 
        // We should normalize or search carefully.

        // Find matching equipment
        // Note: Step 1 uses IDs (1, 2, 3...) for equipment types in the select value.
        // We need to map these IDs to the names used in table42.JSON.
        // MAPPING BASED ON STANDARD API 581 EQUIPMENT LIST ORDER or NAME MATCHING
        // Since we don't have the dynamic DB list here, we'll try to map common IDs or use a normalization.
        // BETTER APPROACH: normalize text if possible, but we only have ID in sessionStorage.

        // Let's define a manual map based on common order or allow user to select if mapping fails.
        // Or, assume standard order:
        // 1: Compressor, 2: Heat Exchanger, 3: Pipe, 4: Pump, 5: Tank620, 6: Tank650, 7: FinFan, 8: Vessel
        // This is an assumption. A safer way is to check if table1Data.equip_type is a number.

        let targetEquipName = table1Data.equip_type;
        const equipId = parseInt(table1Data.equip_type);

        if (!isNaN(equipId)) {
            // Map ID to Name (Adjust based on project DB or standard list in table42.JSON)
            // Order in table42.JSON:
            // 0: Compressor
            // 1: Heat exchanger
            // 2: Pipe
            // 3: Pump
            // 4: Tank620
            // 5: Tank620 (duplicate components) -> Wait, JSON has multiple entries for Tank?
            // Let's use a name map.
            const idMap = {
                1: "Compressor",
                2: "Heat exchanger",
                3: "Pipe",
                4: "Pump",
                5: "Tank620",
                6: "Tank650",
                7: "FinFan",
                8: "Vessel"
            };
            if (idMap[equipId]) targetEquipName = idMap[equipId];
        }

        const equip = table42Data.equipment_data.find(e => e.equipment_type.toLowerCase().replace(/\s/g, '') === targetEquipName.toLowerCase().replace(/\s/g, ''));

        if (!equip) {
            geomContainer.innerHTML = `<p class="text-warning">Geometry mapping not found for ${table1Data.equip_type} (${targetEquipName}). Please use Manual Method.</p>`;
            return;
        }

        // Find component
        // Step 1 component value might be code or name.
        // Assuming Step 1 saves the code (e.g. HEXSS).
        const hasComp = equip.components.includes(table1Data.comp_type);

        // If not found directly, maybe logic is needed. But let's assume valid map.
        // If found, we need to know WHICH geometry type.
        // The JSON lists an ARRAY of geometry types for an equipment. It doesn't 1:1 map component -> geometry.
        // Wait, the structure shows: equipment -> components list AND geometry_types list.
        // This implies ANY of those components can be ANY of those geometries? 
        // Or is there an implicit order?
        // API 581 Table 4.2 implies user must SELECT the geometry type if multiple are possible?

        // Let's let user select if multiple.

        const possibleGeoms = equip.geometry_types;

        if (!possibleGeoms || possibleGeoms.length === 0) {
            geomContainer.innerHTML = `<p class="text-warning">No geometry types defined. Use Manual Method.</p>`;
            return;
        }

        // Create Selector for Geometry Type
        let html = `
            <div class="form-control w-full col-span-1 md:col-span-2">
                <label class="label"><span class="label-text">Component Geometry</span></label>
                <select id="step4_geometry_select" class="select select-bordered w-full">
                    ${possibleGeoms.map(g => `<option value="${g}">${g} - ${getGeomDesc(g)}</option>`).join('')}
                </select>
            </div>
        `;

        geomContainer.innerHTML = html;

        const geomSelect = document.getElementById("step4_geometry_select");
        geomSelect.onchange = () => loadGeomFields(geomSelect.value);

        // Pre-select based on Step 1 if available
        if (table1Data.comp_geom_data && possibleGeoms.includes(table1Data.comp_geom_data)) {
            geomSelect.value = table1Data.comp_geom_data;
        } else if (possibleGeoms.length > 0) {
            geomSelect.value = possibleGeoms[0];
        }

        // Load fields for the selected value
        if (geomSelect.value) {
            loadGeomFields(geomSelect.value);
        }
    }

    function getGeomDesc(code) {
        if (!table43Data.geometry_types) return code;
        const g = table43Data.geometry_types.find(x => x.geometry_type === code);
        return g ? g.description : code;
    }

    function loadGeomFields(geomCode) {
        currentGeomType = geomCode;
        // Remove old field inputs (keep select)
        const existingInputs = geomContainer.querySelectorAll('.dynamic-field');
        existingInputs.forEach(e => e.remove());

        const gData = table43Data.geometry_types.find(x => x.geometry_type === geomCode);
        if (!gData || !gData.data_fields) return;

        // Render fields
        // We need D (Diameter), and maybe others?
        // Formula mostly needs D or R.
        // Let's render all fields requested by JSON as inputs.

        gData.data_fields.forEach(field => {
            // Create input
            // ID logic: step4_geom_{FieldName}
            const safeName = field.replace(/\s/g, '_').toLowerCase();
            const div = document.createElement("div");
            div.className = "form-control w-full dynamic-field";
            div.innerHTML = `
                <label class="label">
                    <span class="label-text">${field}</span>
                    <span class="label-text-alt unit_display">${units === 'imperial' ? 'in' : 'mm'}</span>
                </label>
                <input type="number" id="step4_geom_${safeName}" placeholder="${field}" class="input input-bordered w-full" step="0.001" required />
             `;
            geomContainer.appendChild(div);
        });
    }

    // Toggle Methods
    methodSelect.onchange = () => {
        const val = methodSelect.value;
        if (val === 'calc') {
            calcContainer.classList.remove('hidden');
            manualContainer.classList.add('hidden');
        } else {
            calcContainer.classList.add('hidden');
            manualContainer.classList.remove('hidden');
            manualLabel.innerHTML = val === 'struct'
                ? "Minimum Structural Thickness (t<sub>c</sub>)"
                : "Manual t<sub>min</sub> (Asset Management)";
        }
    };

    // Calculate Action
    calcBtn.onclick = (e) => {
        e.preventDefault();

        const method = methodSelect.value;
        let tmin = 0;

        let S = 0;
        if (method === 'manual' || method === 'struct') {
            tmin = parseFloat(manualInput.value) || 0;
        } else {
            // CALCULATION LOGIC

            // Clear previous errors
            document.getElementById("step4_error_container").classList.add("hidden");

            // Get Inputs
            S = parseFloat(stressInput.value);
            const DesignP = parseFloat(table1Data.design_press) || parseFloat(table1Data.operating_press) || 0;
            let E = parseFloat(table1Data.weld_joint_efficiency) || 1.0;
            if (E > 1.0) E = E / 100.0;

            // Validate Inputs
            const validationError = validateInputs(S, DesignP, E);
            if (validationError) {
                const errorContainer = document.getElementById("step4_error_container");
                const errorMessageCtx = document.getElementById("step4_error_message");
                errorMessageCtx.textContent = validationError;
                errorContainer.classList.remove("hidden");
                return;
            }

            // Save Allowable Stress (S)
            console.log("Saving Allowable Stress:", S);
            sessionStorage.setItem("allowable_stress", S);

            // Get Geometry Inputs
            const dInput = document.querySelector('[id^="step4_geom_diameter"]');
            const diameter = dInput ? parseFloat(dInput.value) : 0;
            const radius = diameter / 2;

            if (currentGeomType === 'CYL' || currentGeomType === 'NOZ' || currentGeomType === 'elb' || currentGeomType === 'ELB') {
                // Cylindrical Shell / Nozzle / Elbow (treated as cylinder for tmin basis usually)
                // t = (P * R) / (S*E - 0.6*P)
                tmin = (DesignP * radius) / (S * E - 0.6 * DesignP);

            } else if (currentGeomType === 'SPH' || currentGeomType === 'HEM') {
                // Sphere/Hemisphere: t = (P * R) / (2*S*E - 0.2*P)
                tmin = (DesignP * radius) / (2 * S * E - 0.2 * DesignP);

            } else if (currentGeomType === 'ELL') {
                // Elliptical 2:1 Head: t = (P * D) / (2*S*E - 0.2*P)
                // Note: Standard 2:1 formula often simplified as (P*D)/(2SE-0.2P) where D is Diameter
                tmin = (DesignP * diameter) / (2 * S * E - 0.2 * DesignP);

            } else if (currentGeomType === 'TOR') {
                // Torispherical Head
                // Formula: t = (0.885 * P * L) / (S*E - 0.1*P)
                // L = Crown Radius
                const lInput = document.querySelector('[id*="crown_radius"]');
                const L = lInput ? parseFloat(lInput.value) : 0;

                if (L <= 0) {
                    showError("Please enter a valid Crown Radius.");
                    return;
                }
                tmin = (0.885 * DesignP * L) / (S * E - 0.1 * DesignP);

            } else if (currentGeomType === 'CON') {
                // Conical Shell
                // Formula: t = (P * D) / (2 * cos(alpha) * (S*E - 0.6*P)) 
                // D = Diameter at large end (usually)
                // alpha = half apex angle
                const angleInput = document.querySelector('[id*="cone_angle"]');
                const angleDeg = angleInput ? parseFloat(angleInput.value) : 0; // degrees

                if (angleDeg <= 0 || angleDeg >= 90) {
                    showError("Please enter a valid Cone Angle (0-90 degrees).");
                    return;
                }
                const alphaRad = angleDeg * (Math.PI / 180.0);
                tmin = (DesignP * diameter) / (2 * Math.cos(alphaRad) * (S * E - 0.6 * DesignP));

            } else {
                // Fallback for types not strictly defined (e.g. RECTNOZ)
                showError("Formula for " + currentGeomType + " not fully implemented. Please use Manual Input.");
                return;
            }
        }

        if (tmin < 0 || isNaN(tmin)) {
            showError("Calculated thickness is invalid (negative or NaN). Check input values.");
            return;
        }

        // Display
        resultContainer.classList.remove('hidden');
        resultValue.textContent = tmin.toFixed(4);

        // Save
        sessionStorage.setItem("t_min", tmin.toFixed(4));

        // Trigger Validation
        if (typeof window.updateNextButtonState === 'function') {
            window.updateNextButtonState();
        }
    };

    function showError(msg) {
        const errorContainer = document.getElementById("step4_error_container");
        const errorMessageCtx = document.getElementById("step4_error_message");
        if (errorContainer && errorMessageCtx) {
            errorMessageCtx.textContent = msg;
            errorContainer.classList.remove("hidden");
        } else {
            // Fallback if HTML container missing, but we added it.
            console.error("Validation Error:", msg);
        }
    }
}

function validateInputs(S, P, E) {
    if (!S || S <= 0) return "Allowable Stress (S) must be greater than 0.";
    if (P <= 0) return "Design Pressure must be greater than 0.";
    if (E <= 0 || E > 1) return "Efficiency (E) must be between 0 and 1.";
    const inputs = document.querySelectorAll('#step4_geometry_inputs_container input');
    for (let inp of inputs) {
        if (!inp.value || parseFloat(inp.value) <= 0) {
            return `Please enter a valid value for ${inp.placeholder || "all fields"}.`;
        }
    }
    return null;
}

window.step4_init = step4_init;
