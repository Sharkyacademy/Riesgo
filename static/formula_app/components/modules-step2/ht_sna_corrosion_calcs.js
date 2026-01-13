


// Global variable declarations 
let material = "";
let maximum_process_temperature = 0;
let sulfur_concentration = 0;
let tan = 0;
let velocity = 0;
let table = null;

// get the table4.1 to see the measurement unit
let table41 = sessionStorage.getItem("table4.1_data");
let table41_data = JSON.parse(table41);


/**
 * Populates the TAN select dropdown with unique TAN values from the table data
 * @param {Object} table - The table data
 */
function populate_tan_options(table) {
    const tanSelect = document.getElementById("tan");
    tanSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    const tanValues = new Set();
    const tempData = table["temperature_in_f"] || table["temperature_in_c"];

    Object.values(tempData).forEach((value) => {
        Object.keys(value).forEach((key) => {
            tanValues.add(parseFloat(key));
        });
    });

    Array.from(tanValues)
        .sort((a, b) => a - b)
        .forEach((tanValue) => {
            const option = document.createElement("option");
            option.value = tanValue;
            option.textContent = tanValue;
            tanSelect.appendChild(option);
        });

    tanSelect.disabled = false;
}

/**
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @returns {string[]}
 */
function validate_inputs() {
    const errors = [];
    if (!material || material === "") {
        errors.push("Material is required");
    }
    if (!maximum_process_temperature || maximum_process_temperature === 0 || isNaN(maximum_process_temperature)) {
        errors.push("Maximum process temperature is required");
    }
    if (!sulfur_concentration || sulfur_concentration === 0 || isNaN(sulfur_concentration)) {
        errors.push("Sulfur concentration is required");
    }
    if (!tan || tan === 0 || isNaN(tan)) {
        errors.push("TAN is required");
    }
    if (!velocity || velocity === 0 || isNaN(velocity)) {
        errors.push("Velocity is required");
    }
    return errors;
}

/**
 * DISPLAY VALIDATIONS ERRORS TO THE USER
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
 * Function that gets the table based on the material selected and returns the table data
 * @param {string} material - The selected material name
 * @returns {Promise<Object>} table data
 */
async function get_tables(material) {
    const tables = {
        table2b32: '/static/formula_app/data/json/ht_sna_corrosion/table_2b32.JSON',
        table2b33: '/static/formula_app/data/json/ht_sna_corrosion/table_2b33.JSON',
        table2b34: '/static/formula_app/data/json/ht_sna_corrosion/table_2b34.JSON',
        table2b35: '/static/formula_app/data/json/ht_sna_corrosion/table_2b35.JSON',
        table2b36: '/static/formula_app/data/json/ht_sna_corrosion/table_2b36.JSON',
        table2b37: '/static/formula_app/data/json/ht_sna_corrosion/table_2b37.JSON',
        table2b38: '/static/formula_app/data/json/ht_sna_corrosion/table_2b38.JSON',
        table2b39: '/static/formula_app/data/json/ht_sna_corrosion/table_2b39.JSON',
        table2b310: '/static/formula_app/data/json/ht_sna_corrosion/table_2b310.JSON',
    }

    const materialToTable = {
        "carbon steel": tables.table2b32,
        "1Cr-0.2 Mo": tables.table2b33,
        "1Cr-0.5 Mo": tables.table2b33,
        "1.25Cr-0.5Mo": tables.table2b33,
        "2.25Cr-1Mo": tables.table2b33,
        "3Cr-1Mo": tables.table2b33,
        "5Cr-0.5Mo": tables.table2b34,
        "7Cr-1Mo": tables.table2b35,
        "9Cr-1Mo": tables.table2b36,
        "12 % Cr Steel": tables.table2b37,
        "Austenitic SS Without Mo": tables.table2b38,
        "316 SS with < 2.5 % Mo": tables.table2b39,
        "316 SS with >= 2.5 % Mo": tables.table2b310,
        "317 SS": tables.table2b310
    };

    const tablePath = materialToTable[material];

    if (!tablePath) {
        throw new Error(`Unknown material: ${material}`);
    }

    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load the table: ${response.status}`);
    }
    return await response.json();
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
 * @param {Object} table - The table data
 * @param {string} measurement_unit - The measurement unit ("farenheit" or "celsius")
 * @param {number} maximum_process_temperature - The maximum process temperature
 * @param {number} sulfur_concentration - The sulfur concentration
 * @param {number} tan - The TAN value
 * @param {number} velocity - The velocity
 * @returns {Object} result object with {rate, warningMsg}
 */
function calculate_corrosion_rate_interpolated(table, measurement_unit, maximum_process_temperature, sulfur_concentration, tan, velocity) {

    const isFahrenheit = measurement_unit === "farenheit";

    // Get the data based on the measurement unit
    let measurement_unit_dict = isFahrenheit
        ? table["temperature_in_f"]
        : table["temperature_in_c"];

    // find the sulfur concentration dictionary
    let sulfur_dict = null;
    Object.keys(measurement_unit_dict).forEach((key) => {
        if (parseFloat(key) === sulfur_concentration) {
            sulfur_dict = measurement_unit_dict[key];
        }
    });

    if (!sulfur_dict) {
        console.error("Sulfur concentration not found:", sulfur_concentration);
        return null;
    }

    // find the TAN dictionary
    let tan_dict = null;
    Object.keys(sulfur_dict).forEach((key) => {
        if (parseFloat(key) === tan) {
            tan_dict = sulfur_dict[key];
        }
    });

    if (!tan_dict) {
        console.error("TAN value not found:", tan);
        return null;
    }

    // tan_dict Contains keys like "<=450", "500", "550", ..., ">750"
    // Extract points (Temp, Rate)
    const points = [];

    Object.entries(tan_dict).forEach(([key, value]) => {
        let tempVal;
        // Parse key
        if (key.startsWith("<=")) {
            tempVal = parseFloat(key.substring(2));
        } else if (key.startsWith(">")) {
            tempVal = parseFloat(key.substring(1));
        } else {
            tempVal = parseFloat(key);
        }

        if (!isNaN(tempVal) && value !== null && value !== undefined) {
            points.push([tempVal, parseFloat(value)]);
        }
    });

    // Sort
    points.sort((a, b) => a[0] - b[0]);

    if (points.length === 0) return null;

    const minTemp = points[0][0];
    const maxTemp = points[points.length - 1][0];
    let rate = interpolate(maximum_process_temperature, points);
    let warningMsg = "";

    if (maximum_process_temperature < minTemp) {
        warningMsg = `<strong>Warning:</strong> The temperature entered (${maximum_process_temperature}) is below the minimum table value (${minTemp}). The result is extrapolated and may be inaccurate (likely negligible).`;
        rate = Math.max(0, rate);
    } else if (maximum_process_temperature > maxTemp) {
        warningMsg = `<strong>Warning:</strong> The temperature entered (${maximum_process_temperature}) is above the maximum table value (${maxTemp}). The result is limited to the maximum available rate.`;
        rate = points[points.length - 1][1]; // Clamp to max value
    } else {
        rate = Math.max(0, rate);
    }

    // Apply Velocity Factor
    const velocityThreshold = isFahrenheit ? 100 : 30.48;
    let isHighVelocity = false;

    if (velocity >= velocityThreshold) {
        rate = rate * 5;
        isHighVelocity = true;
    }

    // Store metadata
    sessionStorage.setItem("is_high_velocity", isHighVelocity);
    sessionStorage.setItem("velocity_threshold", velocityThreshold);
    sessionStorage.setItem("velocity_unit", isFahrenheit ? "ft/s" : "m/s");

    return { rate, warningMsg };

}

/**
 * Main function that orchestrates the corrosion calculation workflow
 */
export async function ht_sna_corrosion_calc() {

    // Read table41_data from sessionStorage
    const table41 = sessionStorage.getItem("table4.1_data");
    const table41_data = table41 ? JSON.parse(table41) : { measurement_unit: "farenheit" };

    // Pre-fill maximum process temperature with operating_temp from Table 4.1
    const tempInput = document.getElementById("maximum_process_temperature");
    if (table41_data && table41_data.operating_temp) {
        tempInput.value = table41_data.operating_temp;
        maximum_process_temperature = parseFloat(table41_data.operating_temp);
    }

    // Check for Cladding
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") hasCladding = true;
    } catch (e) { }

    // Toggle UI
    function toggleCladdingUI() {
        const cladContainer = document.getElementById("cladding_type_container");
        if (cladContainer && material) {
            if (hasCladding) {
                cladContainer.classList.remove("hidden");
            } else {
                cladContainer.classList.add("hidden");
            }
        }
    }

    // get material value
    document.getElementById("material").addEventListener("change", async (e) => {
        material = e.target.value;

        const tanSelect = document.getElementById("tan");
        tanSelect.innerHTML = '<option value="" disabled selected>Select one</option>';
        tanSelect.disabled = true;

        try {
            const materialTable = await get_tables(material);
            populate_tan_options(materialTable);
        } catch (error) {
            console.error(error);
            tanSelect.innerHTML = '<option value="" disabled selected>Error loading options</option>';
        }

        toggleCladdingUI();
    });

    document.getElementById("maximum_process_temperature").addEventListener("input", (e) => {
        maximum_process_temperature = parseFloat(e.target.value);
    });
    document.getElementById("sulfur_concentration").addEventListener("input", (e) => {
        sulfur_concentration = parseFloat(e.target.value);
    });
    document.getElementById("velocity").addEventListener("input", (e) => {
        velocity = parseFloat(e.target.value);
    });

    // Button calculate corrosion rate listener to get the data in the inputs to operate with them
    document.getElementById("calculate_corrosion_rate").addEventListener("click", async () => {

        document.getElementById("error-container").innerHTML = "";

        material = document.getElementById("material").value;
        maximum_process_temperature = parseFloat(document.getElementById("maximum_process_temperature").value);
        sulfur_concentration = parseFloat(document.getElementById("sulfur_concentration").value);
        tan = parseFloat(document.getElementById("tan").value);
        velocity = parseFloat(document.getElementById("velocity").value);

        const errors = validate_inputs();
        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        // if all data is correct, get the table and calculate the corrosion rate
        try {
            table = await get_tables(material);

            const result = calculate_corrosion_rate_interpolated(
                table,
                table41_data.measurement_unit,
                maximum_process_temperature,
                sulfur_concentration,
                tan,
                velocity
            );

            // --- Cladding Calculation ---
            let rateClad = 0;
            if (hasCladding) {
                const cladSelect = document.getElementById("cladding_material_type");
                const cladMat = cladSelect ? cladSelect.value : "";

                if (cladMat && cladMat !== "other") {
                    try {
                        const cladTable = await get_tables(cladMat);
                        const cladResult = calculate_corrosion_rate_interpolated(
                            cladTable,
                            table41_data.measurement_unit,
                            maximum_process_temperature,
                            sulfur_concentration,
                            tan,
                            velocity
                        );
                        if (cladResult && cladResult.rate !== null) {
                            rateClad = cladResult.rate;
                        }
                    } catch (e) { console.log("Clad calc failed", e); }
                }
            }

            if (result && result.rate !== null) {
                const { rate, warningMsg } = result;

                // Get UI elements
                const corrosionRateElement = document.getElementById("corrosion_rate");
                const velocityMessageElement = document.getElementById("velocity_message");

                // Get stored values
                const isHighVelocity = sessionStorage.getItem("is_high_velocity") === "true";
                const velocityThreshold = sessionStorage.getItem("velocity_threshold");
                const velocityUnit = sessionStorage.getItem("velocity_unit");

                const rateRounded = rate.toFixed(2);
                sessionStorage.setItem("corrosion_rate", rateRounded);
                sessionStorage.setItem("corrosion_rate_bm", rateRounded);

                if (hasCladding) {
                    sessionStorage.setItem("corrosion_rate_cladding", rateClad.toFixed(2));
                    corrosionRateElement.innerHTML = `Base Rate: ${rateRounded} mpy<br>Cladding Rate: ${rateClad.toFixed(2)} mpy`;
                } else {
                    sessionStorage.removeItem("corrosion_rate_cladding");
                    corrosionRateElement.innerHTML = `Estimated Corrosion Rate: ${rateRounded} mpy`;
                }

                if (warningMsg) {
                    corrosionRateElement.innerHTML += `<div class="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">${warningMsg}</div>`;
                }

                corrosionRateElement.classList.remove("hidden");

                // Display velocity message if applicable
                if (isHighVelocity) {
                    velocityMessageElement.textContent = `High velocity detected (${velocity} ${velocityUnit} ≥ ${velocityThreshold} ${velocityUnit}). Corrosion rate has been multiplied by 5.`;
                    velocityMessageElement.classList.remove("hidden");
                } else {
                    velocityMessageElement.classList.add("hidden");
                }
            } else {
                display_errors(["Could not determine corrosion rate."]);
            }

        } catch (error) {
            console.error("Error:", error);
        }
    });

    // Init UI
    toggleCladdingUI();

}