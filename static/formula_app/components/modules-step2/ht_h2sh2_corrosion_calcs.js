


const AVAILABLE_TEMPS_F = [425, 475, 525, 575, 625, 675, 725, 775, 825, 875, 925, 975];
const AVAILABLE_TEMPS_C = [218, 246, 274, 302, 329, 357, 385, 413, 441, 469, 496, 524];

// Variables to store input values
let material = "";
let hydrocarbon = "";
let maximum_process_temperature = 0;
let h2s_concentration = 0;
let table = null;

/**
 * Function that handles the selection of the table based on the material
 * @param {string} material 
 * @returns {JSON} table
 */
async function get_table(material) {
    const tables = {
        table_2b42: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b42.json',
        table_2b43: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b43.json',
        table_2b44: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b44.json',
        table_2b45: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b45.json',
        table_2b46: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b46.json',
        table_2b47: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b47.json',
    }

    const materialToTable = {
        "carbon steel": tables.table_2b42,
        "1cr-0.2 mo": tables.table_2b42,
        "1cr-0.5 mo": tables.table_2b42,
        "1.25cr-0.5mo": tables.table_2b42,
        "2.25cr-1mo": tables.table_2b42,
        "3cr-1mo": tables.table_2b42,
        "5cr-0.5mo": tables.table_2b43,
        "7cr steel": tables.table_2b44,
        "9cr-1mo": tables.table_2b45,
        "12cr steel": tables.table_2b46,
        "304 stainless steel": tables.table_2b47,
        "304l stainless steel": tables.table_2b47,
        "316 stainless steel": tables.table_2b47,
        "316l stainless steel": tables.table_2b47,
        "321 stainless steel": tables.table_2b47,
        "347 stainless steel": tables.table_2b47,
    }

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
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @returns {string[]}
 */
function validate_inputs() {
    const errors = [];
    if (!material || material === "") {
        errors.push("Material is required");
    }
    // Only validate hydrocarbon if it's not disabled
    const hydrocarbonInput = document.getElementById("hydrocarbon");
    if (!hydrocarbonInput.disabled && (!hydrocarbon || hydrocarbon === "")) {
        errors.push("Type of hydrocarbon is required");
    }
    if (!maximum_process_temperature || maximum_process_temperature === 0 || isNaN(maximum_process_temperature)) {
        errors.push("Maximum process temperature is required");
    }
    if (!h2s_concentration || h2s_concentration === 0 || isNaN(h2s_concentration)) {
        errors.push("H2S concentration is required");
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
 * Calculates the corrosion rate based on the given inputs with interpolation
 * @param {Object} table - The table data from JSON
 * @param {string} measurement_unit - The measurement unit ("farenheit" or "celsius")
 * @param {number} maximum_process_temperature - The maximum process temperature
 * @param {number} h2s_concentration - The H2S concentration (mole %)
 * @param {string} hydrocarbon - The type of hydrocarbon ("naphtha" or "gas oil")
 * @returns {Object} {rate, warningMsg} or null
 */
function calculate_corrosion_rate_interpolated(table, measurement_unit, maximum_process_temperature, h2s_concentration, hydrocarbon) {

    const isFahrenheit = measurement_unit === "farenheit";

    const temperatureData = isFahrenheit
        ? table["temperature_in_f"]
        : table["temperature_in_c"];

    const availableTemps = temperatureData["temperatures"]; // Array of temperatures e.g. [425, 475...]

    // Find the H2S concentration key in the data
    let h2sKey = null;
    Object.keys(temperatureData["data"]).forEach((key) => {
        if (parseFloat(key) === h2s_concentration) {
            h2sKey = key;
        }
    });

    if (!h2sKey) {
        console.error("H2S concentration not found:", h2s_concentration);
        return null;
    }

    const h2sData = temperatureData["data"][h2sKey];
    let ratesArray;

    if (Array.isArray(h2sData)) {
        ratesArray = h2sData;
    } else {
        const hydrocarbonKey = hydrocarbon === "naphtha" ? "Naphtha" : "Gas oil";
        ratesArray = h2sData[hydrocarbonKey];
        if (!ratesArray) {
            console.error("Hydrocarbon type not found:", hydrocarbonKey);
            return null;
        }
    }

    // Build points (Temp, Rate)
    // Both arrays should be same length
    if (availableTemps.length !== ratesArray.length) {
        console.error("Data mismatch: Temperature and Rate arrays have different lengths.");
        return null;
    }

    const points = [];
    for (let i = 0; i < availableTemps.length; i++) {
        points.push([availableTemps[i], ratesArray[i]]);
    }

    // Sort points (Available temps are usually sorted, but safe to ensure)
    points.sort((a, b) => a[0] - b[0]);

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

    return { rate, warningMsg };
}


export async function ht_h2sh2_corrosion_calc() {

    // Read table41_data from sessionStorage
    const table41 = sessionStorage.getItem("table4.1_data");
    let table41_data = {
        measurement_unit: "farenheit", // default, should handle missing gracefully
        operating_temp: ""
    };
    if (table41) {
        table41_data = JSON.parse(table41);
    }

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

    // Function to toggle Cladding UI
    function toggleCladdingUI() {
        const cladContainer = document.getElementById("cladding_type_container");
        if (cladContainer) {
            if (hasCladding && material) { // Show if material is selected (and cladding exists)
                cladContainer.classList.remove("hidden");
            } else {
                cladContainer.classList.add("hidden");
            }
        }
    }

    // Event listener for material selection
    document.getElementById("material").addEventListener("change", async function () {
        material = this.value;
        try {
            table = await get_table(material);
        } catch (e) {
            console.error(e);
        }

        switch (material) {
            case "12cr steel":
            case "304 stainless steel":
            case "304l stainless steel":
            case "316 stainless steel":
            case "316l stainless steel":
            case "321 stainless steel":
            case "347 stainless steel":
                document.getElementById("hydrocarbon").disabled = true;
                document.getElementById("hydrocarbon").value = "";
                hydrocarbon = "";
                break;
            default:
                document.getElementById("hydrocarbon").disabled = false;
                break;
        }

        toggleCladdingUI();
    });

    document.getElementById("hydrocarbon").addEventListener("change", function () {
        hydrocarbon = this.value;
    });

    document.getElementById("maximum_process_temperature").addEventListener("input", function () {
        maximum_process_temperature = parseFloat(this.value);
    });

    document.getElementById("h2s_concentration").addEventListener("change", function () {
        h2s_concentration = parseFloat(this.value);
    });

    document.getElementById("calculate_corrosion_rate").addEventListener("click", async function () {
        const errors = validate_inputs();

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        document.getElementById("error-container").innerHTML = "";

        const result = calculate_corrosion_rate_interpolated(
            table,
            table41_data.measurement_unit,
            maximum_process_temperature,
            h2s_concentration,
            hydrocarbon
        );

        // --- Cladding Calculation ---
        let rateClad = 0;
        if (hasCladding) {
            const cladSelect = document.getElementById("cladding_material_type");
            const cladMaterial = cladSelect ? cladSelect.value : "";

            if (cladMaterial && cladMaterial !== "other") {
                try {
                    const cladTable = await get_table(cladMaterial);
                    const cladResult = calculate_corrosion_rate_interpolated(
                        cladTable,
                        table41_data.measurement_unit,
                        maximum_process_temperature,
                        h2s_concentration,
                        hydrocarbon
                    );
                    if (cladResult && cladResult.rate !== null) {
                        rateClad = cladResult.rate;
                    }
                } catch (e) { console.log("Clad calc failed", e); }
            }
        }

        if (result && result.rate !== null) {
            const { rate, warningMsg } = result;
            const resultElement = document.getElementById("corrosion_rate");
            const unit = table41_data.measurement_unit === "farenheit" ? "mpy" : "mm/y";

            const rateRounded = rate.toFixed(2);

            sessionStorage.setItem("corrosion_rate", rateRounded);
            sessionStorage.setItem("corrosion_rate_bm", rateRounded);

            if (hasCladding) {
                sessionStorage.setItem("corrosion_rate_cladding", rateClad.toFixed(2));
                resultElement.innerHTML = `Base Rate: ${rateRounded} ${unit}<br>Cladding Rate: ${rateClad.toFixed(2)} ${unit}`;
            } else {
                sessionStorage.removeItem("corrosion_rate_cladding");
                resultElement.innerHTML = `Corrosion rate: ${rateRounded} ${unit}`;
            }

            if (warningMsg) {
                resultElement.innerHTML += `<div class="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">${warningMsg}</div>`;
            }

            resultElement.classList.remove("hidden");
        } else {
            display_errors(["Could not determine corrosion rate."]);
        }
    });

    // Initial check
    toggleCladdingUI();

}