
/**
 * Function that gets the tables containing the corrosion rate data
 * @returns {Promise<Object>} table data
 */
async function get_tables() {
    const tablePaths = {
        table_2b92: '/static/formula_app/data/json/ht_oxidation/table_2b92.JSON',
    };

    try {
        const responses = await Promise.all([
            fetch(tablePaths.table_2b92).then(r => r.json()),
        ]);

        return {
            table_2b92: responses[0],
        };
    } catch (error) {
        console.error("Failed to load tables:", error);
        throw error;
    }
}

/**
 * Determines the unit system (Fahrenheit/Imperial vs Celsius/Metric)
 * @returns {boolean} true if Fahrenheit, false if Celsius
 */
function is_fahrenheit() {
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true; // Default
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }
    return usesFahrenheit;
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

    // Find the interval [x1, x2] that contains x, or the closest one for extrapolation.
    let i = 0;
    while (i < points.length - 2 && x > points[i + 1][0]) {
        i++;
    }

    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];

    if (x1 === x2) return y1;

    // Linear Interpolation/Extrapolation Formula
    const slope = (y2 - y1) / (x2 - x1);
    const y = y1 + slope * (x - x1);

    return y; // Can be negative here, caller handles clamping
}


/**
 * Main Calculation Function
 */
export function ht_oxidation_calc() {
    const calcButton = document.getElementById("calculate_corrosion_rate");
    const resultDisplay = document.getElementById("corrosion_rate");
    const materialSelect = document.getElementById("material");
    const tempInput = document.getElementById("maximum_metal_temperature");

    let tables = null;

    // Initialization
    async function init() {
        try {
            tables = await get_tables();
        } catch (e) {
            display_errors(["Error loading data tables."]);
        }
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
        if (cladContainer && hasCladding) {
            cladContainer.classList.remove("hidden");
        }
    }

    init();
    toggleCladdingUI();

    // Helper to calculate rate for a specific material
    function getRateForMaterial(matName, temp) {
        const isF = is_fahrenheit();
        const materialMap = {
            "carbon steel": "CS",
            "1 1/4cr": "1 1/4Cr",
            "2 1/4cr": "2 1/4Cr",
            "5cr": "5 Cr",
            "7cr": "7 Cr",
            "9cr": "9 Cr",
            "12cr": "12 Cr",
            "304 ss": "304 SS",
            "309 ss": "309 SS",
            "310 ss/hk": "310 SS/HK",
            "800 h/hp": "800 H/HP"
        };
        const jsonMaterial = materialMap[matName];
        if (!jsonMaterial) return null; // Unknown or "Other"

        const tableData = tables.table_2b92;
        const unitKey = isF ? "temperature_in_f" : "temperature_in_c";

        if (!tableData || !tableData[unitKey] || !tableData[unitKey][jsonMaterial]) {
            return { error: "Data not available" };
        }

        const rawData = tableData[unitKey][jsonMaterial];

        // Convert to sorted array
        const points = Object.entries(rawData)
            .map(([t, r]) => [parseFloat(t), r])
            .filter(([t, r]) => r !== null && !isNaN(r) && !isNaN(t))
            .sort((a, b) => a[0] - b[0]);

        if (points.length === 0) return { error: "No valid data" };

        const minTemp = points[0][0];
        const maxTemp = points[points.length - 1][0];

        // Calculate Rate
        let rate = interpolate(temp, points);
        let warningMsg = "";

        // Check Bounds
        if (temp < minTemp) {
            warningMsg = `<strong>Warning:</strong> The temperature entered (${temp}) is below the minimum table value (${minTemp}). The result is extrapolated and may be inaccurate (likely negligible).`;
            rate = Math.max(0, rate);
        } else if (temp > maxTemp) {
            warningMsg = `<strong>Warning:</strong> The temperature entered (${temp}) is above the maximum table value (${maxTemp}). The result is limited to the maximum available rate.`;
            rate = points[points.length - 1][1];
        } else {
            rate = Math.max(0, rate);
        }

        return { rate, warningMsg };
    }

    // Calculate Button Logic
    calcButton.addEventListener("click", () => {
        document.getElementById("error-container").innerHTML = "";
        resultDisplay.classList.add("hidden");

        const material = materialSelect.value;
        const temperatureVal = tempInput.value;

        if (!material || !temperatureVal) {
            display_errors(["Please select Material and enter Temperature."]);
            return;
        }

        const temperature = parseFloat(temperatureVal);
        if (isNaN(temperature)) {
            display_errors(["Please enter a valid numeric Temperature."]);
            return;
        }

        const isF = is_fahrenheit();
        const unit = isF ? "mpy" : "mm/year";

        // Base Calculation
        const baseResult = getRateForMaterial(material, temperature);
        if (!baseResult || baseResult.error) {
            display_errors([baseResult?.error || "Calculation failed for base material."]);
            return;
        }

        const rateRounded = baseResult.rate.toFixed(2);
        let rateClad = 0;

        // Cladding Calculation
        if (hasCladding) {
            const cladSelect = document.getElementById("cladding_material_type");
            const cladMat = cladSelect ? cladSelect.value : "";
            if (cladMat && cladMat !== "other") {
                const cladResult = getRateForMaterial(cladMat, temperature);
                if (cladResult && !cladResult.error) {
                    rateClad = cladResult.rate;
                }
            }
        }

        // Save
        sessionStorage.setItem("corrosion_rate", rateRounded);
        sessionStorage.setItem("corrosion_rate_bm", rateRounded);

        if (hasCladding) {
            sessionStorage.setItem("corrosion_rate_cladding", rateClad.toFixed(2));
            resultDisplay.innerHTML = `Base Rate: ${rateRounded} ${unit}<br>Cladding Rate: ${rateClad.toFixed(2)} ${unit}`;
        } else {
            sessionStorage.removeItem("corrosion_rate_cladding");
            resultDisplay.innerHTML = `Estimated Corrosion Rate: ${rateRounded} ${unit}`;
        }

        if (baseResult.warningMsg) {
            resultDisplay.innerHTML += `<div class="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">${baseResult.warningMsg}</div>`;
        }

        resultDisplay.classList.remove("hidden");
    });

}
