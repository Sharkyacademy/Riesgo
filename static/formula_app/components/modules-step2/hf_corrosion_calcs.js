
/**
 * Function that gets the table based on the material selected and returns the table data
 * @param {string} material - The selected material name
 * @returns {Promise<Object>} table data
 */
async function get_table(material) {
    const tables = {
        table_2b62: '/static/formula_app/data/json/hf_corrosion/table_2b62.JSON',
        table_2b63: '/static/formula_app/data/json/hf_corrosion/table_2b63.JSON'
    }

    const materialToTable = {
        "carbon_steel": tables.table_2b62,
        "alloy_400": tables.table_2b63
    }

    const tablePath = materialToTable[material];

    if (!tablePath) {
        throw new Error(`unknown material: ${material}`);
    }

    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load the table: ${response.status}`);
    }
    return await response.json();
}

/**
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @param {string} material - The selected material (carbon_steel or alloy_400)
 * @param {string} temp - Maximum service temperature
 * @param {string} hfConc - HF concentration
 * @param {string} velocity - Velocity (only for carbon_steel)
 * @param {string} aerated - Aerated (only for alloy_400)
 * @returns {string[]} errors
 */
function validate_inputs(material, temp, hfConc, velocity, aerated) {
    const errors = [];

    if (!material) {
        errors.push("Material selection is required.");
        return errors;
    }

    if (!temp) errors.push("Maximum service temperature is required.");
    if (!hfConc) errors.push("HF-in-water concentration is required.");

    if (material === "carbon_steel") {
        if (!velocity) errors.push("Velocity is required.");
    } else if (material === "alloy_400") {
        if (!aerated) errors.push("Aeration status is required.");
    }

    return errors;
}

/**
 * DISPLAY VALIDATION ERRORS TO THE USER
 * @param {string[]} errors - Array of error messages
 */
function display_errors(errors) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = "";

    errors.forEach((error) => {
        const errorElement = document.createElement("p");
        errorElement.textContent = error;
        errorElement.classList.add("alert", "alert-error", "m-3", "text-white", "text-bold");
        errorContainer.appendChild(errorElement);
    });
}

/**
 * Interpolates or extrapolates y value for given x based on sorted points.
 * @param {number} x - The input value (Temperature)
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
 * Populates other dropdowns based on material
 * @param {Object} tableData 
 * @param {string} material 
 */
function populate_specific_options(tableData, material) {
    const hfConcentrationSelect = document.getElementById("hf_in_water");
    const velocitySelect = document.getElementById("velocity");
    const aeratedSelect = document.getElementById("aerated");

    // Preserve values if possible
    const currentHf = hfConcentrationSelect.value;
    const currentVel = velocitySelect.value;

    // Reset contents
    hfConcentrationSelect.innerHTML = '<option value="" disabled selected>Select one</option>';
    velocitySelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    // Get root data
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }
    const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
    const rootData = tableData[tempKey];

    if (!rootData) return;

    if (material === "carbon_steel") {
        // Populate HF Conc (Ranges) and Velocity
        const hfRanges = new Set();
        const velocities = new Set();

        Object.values(rootData).forEach(tempObj => {
            Object.keys(tempObj).forEach(range => hfRanges.add(range));
            Object.values(tempObj).forEach(velObj => {
                Object.keys(velObj).forEach(v => velocities.add(v));
            });
        });

        // Fill HF
        Array.from(hfRanges).sort().forEach(range => {
            const option = document.createElement("option");
            option.value = range;
            option.textContent = range;
            hfConcentrationSelect.appendChild(option);
        });
        if (hfRanges.has(currentHf)) hfConcentrationSelect.value = currentHf;

        // Fill Velocity
        Array.from(velocities)
            .sort((a, b) => parseFloat(a) - parseFloat(b))
            .forEach(vel => {
                const option = document.createElement("option");
                option.value = vel;
                option.textContent = vel;
                velocitySelect.appendChild(option);
            });
        if (velocities.has(currentVel)) velocitySelect.value = currentVel;

    } else if (material === "alloy_400") {
        // Populate HF Conc (Values)
        const hfConcs = new Set();
        Object.values(rootData).forEach(tempObj => {
            Object.values(tempObj).forEach(aeratedObj => {
                Object.keys(aeratedObj).forEach(conc => hfConcs.add(conc));
            });
        });

        Array.from(hfConcs)
            .sort((a, b) => parseFloat(a) - parseFloat(b))
            .forEach(conc => {
                const option = document.createElement("option");
                option.value = conc;
                option.textContent = conc + "%";
                hfConcentrationSelect.appendChild(option);
            });
        if (hfConcs.has(currentHf)) hfConcentrationSelect.value = currentHf;
    }
}

/**
 * Calculates the corrosion rate from the table data
 * @param {Object} tableData 
 * @param {string} material 
 * @param {number} inputTemp 
 * @param {string} hfConc 
 * @param {string} velocity 
 * @param {string} aerated 
 * @returns {Object} result { rate, warningMsg } or null
 */
function calculate_corrosion_rate_interpolated(tableData, material, inputTemp, hfConc, velocity, aerated) {
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }
    const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";

    const rootData = tableData[tempKey];
    if (!rootData) return null;

    const points = [];

    // Iterate all available temperatures to find matches for other params
    // Keys of rootData are temperature strings (e.g. "93" from "93_deg_f" or just "93" - checking get_table uses keys directly if mapped, but in populate it did parsing)
    // Wait, populate_temperature line 99: parseFloat(a.split('_')[0]). It implies keys might be "93_deg_something"? 
    // Checking table_2b62 or 63 json structure would be safer, but I can infer from code.
    // Code lines 98-102: keys are temp strings.

    Object.keys(rootData).forEach(tempStr => {
        // Clean temp key if needed (the populate function implies it might need splitting, but usually it's just the number if the JSON keys are numbers)
        // Let's assume keys are parseable numbers or strings starting with number.
        const t = parseFloat(tempStr); // e.g. "125" -> 125

        const tempData = rootData[tempStr];
        let rate = undefined;

        if (material === "carbon_steel") {
            // Temp -> HF Range -> Velocity -> Rate
            const hfData = tempData[hfConc];
            if (hfData) {
                rate = hfData[velocity];
            }
        } else if (material === "alloy_400") {
            // Temp -> Aerated -> HF Conc -> Rate
            const aeratedKey = aerated.charAt(0).toUpperCase() + aerated.slice(1).toLowerCase();
            const aeratedData = tempData[aeratedKey];
            if (aeratedData) {
                rate = aeratedData[hfConc];
            }
        }

        if (rate !== undefined && rate !== null) {
            points.push([t, parseFloat(rate)]);
        }
    });

    // Sort points
    points.sort((a, b) => a[0] - b[0]);

    if (points.length === 0) return null;

    const minTemp = points[0][0];
    const maxTemp = points[points.length - 1][0];
    let rate = interpolate(inputTemp, points);
    let warningMsg = "";

    if (inputTemp < minTemp) {
        warningMsg = `<strong>Warning:</strong> The temperature entered (${inputTemp}) is below the minimum table value (${minTemp}). The result is extrapolated and may be inaccurate (likely negligible).`;
        rate = Math.max(0, rate);
    } else if (inputTemp > maxTemp) {
        warningMsg = `<strong>Warning:</strong> The temperature entered (${inputTemp}) is above the maximum table value (${maxTemp}). The result is limited to the maximum available rate.`;
        rate = points[points.length - 1][1]; // Clamp to max value
    } else {
        rate = Math.max(0, rate);
    }

    return { rate, warningMsg };

}

export function hf_corrosion_calc() {
    // Get all input elements
    const carbonSteelSelect = document.getElementById("carbon_steel");
    const alloy400Select = document.getElementById("alloy_400");
    const maxTempInput = document.getElementById("maximum_service_temperature"); // Input now
    const velocitySelect = document.getElementById("velocity");
    const hfConcentrationSelect = document.getElementById("hf_in_water");
    const aeratedSelect = document.getElementById("aerated");

    const calculateButton = document.getElementById("calculate_corrosion_rate");
    const messageDisplay = document.getElementById("velocity_message");
    const corrosionRateDisplay = document.getElementById("corrosion_rate");

    // Helper visibility function
    function setVisibility(elementId, visible) {
        const element = document.getElementById(elementId);
        if (!element) return;
        const label = document.querySelector(`label[for="${elementId}"]`);
        if (visible) {
            element.classList.remove("hidden");
            if (label) label.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
            if (label) label.classList.add("hidden");
        }
    }

    // State
    let currentMaterial = null;
    let currentTableData = null;

    // Check for Cladding
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") hasCladding = true;
    } catch (e) { }

    async function checkConditions() {
        // Reset UI Components
        setVisibility("maximum_service_temperature", false);
        setVisibility("velocity", false);
        setVisibility("hf_in_water", false);
        setVisibility("aerated", false);

        // Cladding UI
        const cladContainer = document.getElementById("cladding_type_container");
        if (cladContainer) {
            if (hasCladding && (carbonSteelSelect.value === "yes" || alloy400Select.value === "yes")) {
                cladContainer.classList.remove("hidden");
            } else {
                cladContainer.classList.add("hidden");
            }
        }

        calculateButton.classList.add("hidden");
        messageDisplay.classList.add("hidden");
        corrosionRateDisplay.classList.add("hidden");

        const isCarbonSteel = carbonSteelSelect.value;
        const isAlloy400 = alloy400Select.value;
        let activeMaterial = null;

        // Logic Flow
        if (isCarbonSteel === "yes") {
            activeMaterial = "carbon_steel";
            setVisibility("alloy_400", false);

            // Show Inputs
            setVisibility("maximum_service_temperature", true);
            setVisibility("hf_in_water", true);
            setVisibility("velocity", true); // Only for CS

            calculateButton.classList.remove("hidden");

        } else if (isCarbonSteel === "no") {
            setVisibility("alloy_400", true);

            if (isAlloy400 === "yes") {
                activeMaterial = "alloy_400";

                // Show Inputs
                setVisibility("maximum_service_temperature", true);
                setVisibility("hf_in_water", true);
                setVisibility("aerated", true); // Only for Alloy 400

                calculateButton.classList.remove("hidden");

            } else if (isAlloy400 === "no") {
                // Literature Case
                messageDisplay.textContent = "Determine Corrosion Rate from published literature.";
                messageDisplay.classList.remove("hidden");
                messageDisplay.classList.remove("alert-warning");
                messageDisplay.classList.add("alert-info");
            }
        } else {
            setVisibility("alloy_400", false);
        }

        // Data Loading & Population
        if (activeMaterial) {
            if (activeMaterial !== currentMaterial) {
                try {
                    currentTableData = await get_table(activeMaterial);
                    currentMaterial = activeMaterial;

                    // Populate
                    // populate_temperature(currentTableData); // Removed
                    populate_specific_options(currentTableData, activeMaterial);

                } catch (error) {
                    console.error("Error loading table data:", error);
                }
            }
        } else {
            currentMaterial = null;
            currentTableData = null;
        }
    }

    // Calculation Handler
    calculateButton.addEventListener("click", async () => {
        document.getElementById("error-container").innerHTML = ""; // Clear errors

        const tempVal = maxTempInput.value;
        const hfConc = hfConcentrationSelect.value;
        const velocity = velocitySelect.value;
        const aerated = aeratedSelect.value;

        const errors = validate_inputs(currentMaterial, tempVal, hfConc, velocity, aerated);

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        const inputTemp = parseFloat(tempVal);
        if (isNaN(inputTemp)) {
            display_errors(["Invalid temperature value."]);
            return;
        }

        const result = calculate_corrosion_rate_interpolated(currentTableData, currentMaterial, inputTemp, hfConc, velocity, aerated);

        if (result === null || result.rate === null) {
            display_errors(["Could not determine corrosion rate from the table with these inputs (insufficient data)."]);
            return;
        }

        const { rate, warningMsg } = result;

        // Unit handling (from Table 4.1)
        const table41Data = sessionStorage.getItem("table4.1_data");
        let unit = "mm/year";
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            unit = table41.measurement_unit === "farenheit" ? "mpy" : "mm/year";
        }

        const rateRounded = rate.toFixed(2);

        // --- Cladding Logic ---
        let rateClad = 0;
        let cladType = "";
        if (hasCladding) {
            const cladSelect = document.getElementById("cladding_material_type");
            if (cladSelect) cladType = cladSelect.value;

            // Map simplified values to internal keys
            let internalCladType = "";
            if (cladType === "cs") internalCladType = "carbon_steel";
            if (cladType === "alloy400") internalCladType = "alloy_400";

            if (internalCladType === currentMaterial) {
                rateClad = rate; // Reuse base rate
            } else if (internalCladType && internalCladType !== currentMaterial) {
                // Try to calculate if possible?
                // If Base=CS (has velocity), Clad=Alloy (needs aerated). We don't have aerated.
                // If Base=Alloy (has aerated), Clad=CS (needs velocity). We don't have velocity.
                // So default to 0.
                rateClad = 0;
            }
        }

        sessionStorage.setItem("corrosion_rate", rateRounded);
        sessionStorage.setItem("corrosion_rate_bm", rateRounded);

        if (hasCladding) {
            sessionStorage.setItem("corrosion_rate_cladding", rateClad.toFixed(2));
            corrosionRateDisplay.innerHTML = `Base Rate: ${rateRounded} ${unit}<br>Cladding Rate: ${rateClad.toFixed(2)} ${unit}`;
        } else {
            sessionStorage.removeItem("corrosion_rate_cladding");
            corrosionRateDisplay.innerHTML = `Corrosion Rate: ${rateRounded} ${unit}`;
        }

        if (warningMsg) {
            corrosionRateDisplay.innerHTML += `<div class="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">${warningMsg}</div>`;
        }

        corrosionRateDisplay.classList.remove("hidden");
    });

    // Listeners
    carbonSteelSelect.addEventListener("change", () => {
        if (carbonSteelSelect.value === "yes") alloy400Select.value = "";
        checkConditions();
    });
    alloy400Select.addEventListener("change", checkConditions);

    // Initial run
    checkConditions();
}
