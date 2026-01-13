


/**
 * Function that gets the table based on the material selected and returns the table data
 * Special case: For carbon steel, the table selection depends on the temperature unit from table 4.1
 * - If fahrenheit: use table_2b52.JSON
 * - If celsius: use table_2b52M.JSON
 * @param {string} material - The selected material name
 * @returns {Promise<Object>} table data
 */
async function get_table(material) {
    const tables = {
        table_2b52: '/static/formula_app/data/json/sa_corrosion/table_2b52.JSON',
        table_2b52M: '/static/formula_app/data/json/sa_corrosion/table_2b52M.JSON',
        table_2b53: '/static/formula_app/data/json/sa_corrosion/table_2b53.JSON',
        table_2b54: '/static/formula_app/data/json/sa_corrosion/table_2b54.JSON',
        table_2b55: '/static/formula_app/data/json/sa_corrosion/table_2b55.JSON',
        table_2b56: '/static/formula_app/data/json/sa_corrosion/table_2b56.JSON',
        table_2b57: '/static/formula_app/data/json/sa_corrosion/table_2b57.JSON',
    }

    let table_path;

    if (material === "carbon steel") {
        const table41Data = sessionStorage.getItem("table4.1_data");
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            table_path = table41.measurement_unit === "celsius" ? tables.table_2b52M : tables.table_2b52;
        } else {
            table_path = tables.table_2b52;
        }
    } else {
        const materialToTable = {
            "304 ss": tables.table_2b53,
            "316 ss": tables.table_2b54,
            "alloy 20": tables.table_2b55,
            "alloy c-276": tables.table_2b56,
            "alloy b-2": tables.table_2b57,
        }

        table_path = materialToTable[material];
        if (!table_path) {
            throw new Error(`Unknown material: ${material}`);
        }
    }

    const response = await fetch(table_path);
    if (!response.ok) {
        throw new Error(`Failed to load the table: ${response.status}`);
    }
    const tableData = await response.json();

    return tableData;
}

/**
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @param {string} material - The selected material
 * @param {string} acidConcentration - The selected acid concentration
 * @param {string} maximumTemperature - The maximum temperature value
 * @param {string} velocityOfAcid - The selected velocity of acid
 * @returns {string[]}
 */
function validate_inputs(material, acidConcentration, maximumTemperature, velocityOfAcid) {
    const errors = [];

    if (!material || material === "") {
        errors.push("Material of construction is required");
    }

    if (!acidConcentration || acidConcentration === "") {
        errors.push("Acid concentration is required");
    }

    if (!maximumTemperature || maximumTemperature === "") {
        errors.push("Maximum temperature is required");
    }

    if (!velocityOfAcid || velocityOfAcid === "") {
        errors.push("Velocity of acid is required");
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
 * Calculates the corrosion rate based on the given inputs using interpolation
 * @param {Object} tableData - The table data
 * @param {string} material - The material name
 * @param {string} acidConcentration - The acid concentration
 * @param {number} maximumTemperature - The maximum temperature
 * @param {number} velocity - The velocity of acid
 * @returns {Object} result object with {rate, warningMsg} or null
 */
function calculate_corrosion_rate_interpolated(tableData, material, acidConcentration, maximumTemperature, velocity) {
    let points = [];

    if (material === "carbon steel") {
        // Carbon steel format: { "100": [{ temperature: 42, acid_velocity: { "0": 5, "1": 7 } }] }
        const concentrationData = tableData[acidConcentration];

        if (!concentrationData || !Array.isArray(concentrationData)) {
            console.error("Concentration not found in table:", acidConcentration);
            return null;
        }

        // Iterate through all temp entries for this concentration
        concentrationData.forEach(item => {
            const t = parseFloat(item.temperature);
            // Check if this temp has a rate for the selected velocity
            if (item.acid_velocity && item.acid_velocity[velocity.toString()] !== undefined) {
                points.push([t, parseFloat(item.acid_velocity[velocity.toString()])]);
            }
        });

    } else {
        // Other materials format: { "temperature_in_f": { "98": { "86": { "2": 5 } } } }
        const table41Data = sessionStorage.getItem("table4.1_data");
        let usesFahrenheit = true;
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            usesFahrenheit = table41.measurement_unit === "farenheit";
        }
        const tempScale = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
        const tempData = tableData[tempScale];

        if (!tempData || !tempData[acidConcentration]) {
            return null;
        }

        const concentrationData = tempData[acidConcentration]; // { "86": {"2": 5}, ... }

        Object.keys(concentrationData).forEach(tStr => {
            const t = parseFloat(tStr);
            const velData = concentrationData[tStr];
            if (velData && velData[velocity.toString()] !== undefined) {
                points.push([t, parseFloat(velData[velocity.toString()])]);
            }
        });
    }

    // Sort points
    points.sort((a, b) => a[0] - b[0]);

    if (points.length === 0) {
        return null;
    }

    const minTemp = points[0][0];
    const maxTemp = points[points.length - 1][0];
    let rate = interpolate(maximumTemperature, points);
    let warningMsg = "";

    if (maximumTemperature < minTemp) {
        warningMsg = `<strong>Warning:</strong> The temperature entered (${maximumTemperature}) is below the minimum table value (${minTemp}). The result is extrapolated and may be inaccurate (likely negligible).`;
        rate = Math.max(0, rate);
    } else if (maximumTemperature > maxTemp) {
        warningMsg = `<strong>Warning:</strong> The temperature entered (${maximumTemperature}) is above the maximum table value (${maxTemp}). The result is limited to the maximum available rate.`;
        rate = points[points.length - 1][1]; // Clamp to max value
    } else {
        rate = Math.max(0, rate);
    }

    return { rate, warningMsg };
}


/**
 * Populates the acid concentration dropdown with unique values from the table
 * Handles both carbon steel format and other materials format
 * @param {Object} tableData - The table data
 * @param {string} material - The material name to determine table format
 */
function populate_acid_concentration(tableData, material) {
    const acidConcentrationSelect = document.getElementById("acid_concentration");
    acidConcentrationSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    let concentrations = [];

    // Check if this is carbon steel format (has numeric keys directly)
    if (material === "carbon steel") {
        // Carbon steel format: { "100": [...], "98": [...], ... }
        concentrations = Object.keys(tableData).sort((a, b) => parseFloat(b) - parseFloat(a));
    } else {
        // Other materials format: { "temperature_in_c": { "98": {...}, ... }, "temperature_in_f": { ... } }
        // Get concentrations from temperature_in_f or temperature_in_c
        const tempData = tableData.temperature_in_f || tableData.temperature_in_c;
        if (tempData) {
            concentrations = Object.keys(tempData).sort((a, b) => parseFloat(b) - parseFloat(a));
        }
    }

    concentrations.forEach((concentration) => {
        const option = document.createElement("option");
        option.value = concentration;
        option.textContent = `${concentration}%`;
        acidConcentrationSelect.appendChild(option);
    });

    acidConcentrationSelect.disabled = false;
}


/**
 * Populates the velocity dropdown with unique velocity values from the table
 * Handles both carbon steel format and other materials format
 * @param {Object} tableData - The table data
 * @param {string} material - The material name to determine table format
 */
function populate_velocity(tableData, material) {
    const velocitySelect = document.getElementById("velocity_of_acid");
    velocitySelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    const velocities = new Set();

    // Check if this is carbon steel format
    if (material === "carbon steel") {
        // Carbon steel format: { "100": [{ temperature: 42, acid_velocity: { "0": 5, "1": 7, ... } }] }
        Object.values(tableData).forEach((concentrationData) => {
            if (Array.isArray(concentrationData)) {
                concentrationData.forEach((tempData) => {
                    if (tempData && tempData.acid_velocity) {
                        Object.keys(tempData.acid_velocity).forEach((velocity) => {
                            velocities.add(parseFloat(velocity));
                        });
                    }
                });
            }
        });
    } else {
        // Other materials format: { "temperature_in_f": { "98": { "86": { "2": 5, "6": 15, ... } } } }
        const tempData = tableData.temperature_in_f || tableData.temperature_in_c;
        if (tempData) {
            Object.values(tempData).forEach((concentrationData) => {
                Object.values(concentrationData).forEach((temperatureData) => {
                    Object.keys(temperatureData).forEach((velocity) => {
                        velocities.add(parseFloat(velocity));
                    });
                });
            });
        }
    }

    // Sort velocities numerically
    Array.from(velocities)
        .sort((a, b) => a - b)
        .forEach((velocity) => {
            const option = document.createElement("option");
            option.value = velocity;
            option.textContent = velocity;
            velocitySelect.appendChild(option);
        });

    velocitySelect.disabled = false;
}


export function sa_corrosion_calc() {

    // Get DOM elements
    const materialSelect = document.getElementById("material_of_construction");
    const oxygenSelect = document.getElementById("oxygen_present");
    const specialistContainer = document.getElementById("specialist_message_container");
    const additionalInputsContainer = document.getElementById("additional_inputs_container");
    const calculateButton = document.getElementById("calculate_corrosion_rate");
    const setCorrosionRateButton = document.getElementById("set_corrosion_rate");
    const specialistCorrosionRateInput = document.getElementById("specialist_corrosion_rate");

    // Check for Cladding
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") hasCladding = true;
    } catch (e) { }

    // Function to check conditions and show/hide elements
    async function checkConditions() {
        const material = materialSelect.value;
        const oxygenPresent = oxygenSelect.value;

        // Cladding UI
        const cladContainer = document.getElementById("cladding_type_container");
        if (cladContainer && material) { // Show if material is selected
            if (hasCladding) {
                cladContainer.classList.remove("hidden");
            } else {
                cladContainer.classList.add("hidden");
            }
        }

        // Check if both material and oxygen are selected
        if (material && oxygenPresent) {
            // Load and display the table for verification
            try {
                const tableData = await get_table(material);

                // Populate acid concentrationand velocity dropdowns
                // Pass material to determine table format
                populate_acid_concentration(tableData, material);
                // populate_temperature(tableData, material); // Removed
                populate_velocity(tableData, material);

            } catch (error) {
                console.error(`[SA Corrosion] Error loading table:`, error);
            }

            // Check if material is Alloy B-2 AND oxygen is present
            if (material === "alloy b-2" && oxygenPresent === "yes") {
                specialistContainer.classList.remove("hidden");
                additionalInputsContainer.classList.add("hidden");
                calculateButton.classList.add("hidden");
                setCorrosionRateButton.classList.remove("hidden");
            } else {
                specialistContainer.classList.add("hidden");
                additionalInputsContainer.classList.remove("hidden");
                calculateButton.classList.remove("hidden");
                setCorrosionRateButton.classList.add("hidden");
            }
        } else {
            // Hide both if not all conditions are met
            specialistContainer.classList.add("hidden");
            additionalInputsContainer.classList.add("hidden");
            calculateButton.classList.add("hidden");
            setCorrosionRateButton.classList.add("hidden");
        }
    }

    // Handle set corrosion rate button click
    setCorrosionRateButton.addEventListener("click", () => {
        const corrosionRateValue = specialistCorrosionRateInput.value;

        if (corrosionRateValue && corrosionRateValue > 0) {
            // Get the measurement unit from table 4.1
            const table41Data = sessionStorage.getItem("table4.1_data");
            let unit = "mm/year"; // Default unit

            if (table41Data) {
                const table41 = JSON.parse(table41Data);
                unit = table41.measurement_unit === "farenheit" ? "mpy" : "mm/year";
            }

            // Save to sessionStorage (only the numeric value, without unit)
            sessionStorage.setItem("corrosion_rate", corrosionRateValue);
            sessionStorage.setItem("corrosion_rate_bm", corrosionRateValue);
            if (hasCladding) sessionStorage.setItem("corrosion_rate_cladding", 0);

            // Show success message with the appropriate unit
            const corrosionRateDisplay = document.getElementById("corrosion_rate");
            corrosionRateDisplay.textContent = `Corrosion Rate set: ${corrosionRateValue} ${unit}`;
            corrosionRateDisplay.classList.remove("hidden");
        } else {
            alert("Please enter a valid corrosion rate value");
        }
    });

    // Handle calculate corrosion rate button click
    calculateButton.addEventListener("click", async () => {
        // Clear previous errors
        document.getElementById("error-container").innerHTML = "";

        // Get input values
        const material = materialSelect.value;
        const acidConcentration = document.getElementById("acid_concentration").value;
        const maximumTemperature = parseFloat(document.getElementById("maximum_temperature").value);
        const velocityOfAcid = parseFloat(document.getElementById("velocity_of_acid").value);

        // Validate inputs
        const errors = validate_inputs(material, acidConcentration, maximumTemperature.toString(), velocityOfAcid.toString());

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        // If all validations pass, proceed with calculation
        try {
            const tableData = await get_table(material);

            // Calculate corrosion rate
            const result = calculate_corrosion_rate_interpolated(
                tableData,
                material,
                acidConcentration,
                maximumTemperature,
                velocityOfAcid
            );

            if (result === null || result.rate === null) {
                display_errors(["Could not calculate corrosion rate. Data may be missing for these conditions."]);
                return;
            }

            const { rate, warningMsg } = result;

            // Get the measurement unit from table 4.1
            const table41Data = sessionStorage.getItem("table4.1_data");
            let unit = "mm/year"; // Default unit

            if (table41Data) {
                const table41 = JSON.parse(table41Data);
                unit = table41.measurement_unit === "farenheit" ? "mpy" : "mm/year";
            }

            const rateRounded = rate.toFixed(2);
            let rateClad = 0;

            // --- Cladding Calculation ---
            if (hasCladding) {
                const cladSelect = document.getElementById("cladding_material_type");
                const cladMaterial = cladSelect ? cladSelect.value : "";

                if (cladMaterial && cladMaterial !== "other") {
                    try {
                        // Reuse the same functions
                        // Note: get_table might fail if material not in list but we matched HTML options
                        const cladTable = await get_table(cladMaterial);
                        // Try calc
                        const cladResult = calculate_corrosion_rate_interpolated(
                            cladTable,
                            cladMaterial,
                            acidConcentration,
                            maximumTemperature,
                            velocityOfAcid
                        );
                        if (cladResult && cladResult.rate !== null) {
                            rateClad = cladResult.rate;
                        }
                    } catch (e) {
                        console.log("Clad calc failed", e);
                    }
                }
            }

            // Save to sessionStorage
            sessionStorage.setItem("corrosion_rate", rateRounded);
            sessionStorage.setItem("corrosion_rate_bm", rateRounded);

            // Display the result
            const corrosionRateDisplay = document.getElementById("corrosion_rate");

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

        } catch (error) {
            console.error("Error calculating corrosion rate:", error);
            display_errors([`Error: ${error.message}`]);
        }
    });

    materialSelect.addEventListener("change", () => {
        // Hide corrosion rate display when material changes
        const corrosionRateDisplay = document.getElementById("corrosion_rate");
        corrosionRateDisplay.classList.add("hidden");

        checkConditions();
    });

    oxygenSelect.addEventListener("change", () => {
        // Hide corrosion rate display when oxygen selection changes
        const corrosionRateDisplay = document.getElementById("corrosion_rate");
        corrosionRateDisplay.classList.add("hidden");

        checkConditions();
    });

    checkConditions();
}
