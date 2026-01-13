
/**
 * Function that gets the table containing the corrosion rate data
 * @returns {Promise<Object>} table data
 */
async function get_table() {
    const tablePath = '/static/formula_app/data/json/alkaline_sw_corrosion/table_2b72.JSON';

    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load the table: ${response.status}`);
    }
    return await response.json();
}

/**
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @param {string} nh4hsConc - NH4HS Concentration
 * @param {string} velocity - Velocity
 * @returns {string[]} errors
 */
function validate_inputs(nh4hsConc, velocity) {
    const errors = [];

    if (!nh4hsConc) {
        errors.push("NH4HS concentration is required.");
    }

    if (!velocity) {
        errors.push("Stream velocity is required.");
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
 * Determines the unit system (Fahrenheit/Imperial vs Celsius/Metric)
 * @returns {string} combined key for the table ("temperature_in_f" or "temperature_in_c")
 */
function get_unit_key() {
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }
    return usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
}

/**
 * Populates the NH4HS Concentration dropdown
 * @param {Object} tableData 
 */
function populate_nh4hs_concentration(tableData) {
    const nh4hsSelect = document.getElementById("nh2sh_concentration");
    const currentVal = nh4hsSelect.value;

    nh4hsSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    const unitKey = get_unit_key();
    const rootData = tableData[unitKey];

    if (!rootData) return;

    // Sort numerically 
    const concentrations = Object.keys(rootData).sort((a, b) => parseFloat(a) - parseFloat(b));

    concentrations.forEach(conc => {
        const option = document.createElement("option");
        option.value = conc;
        option.textContent = conc;
        nh4hsSelect.appendChild(option);
    });

    if (concentrations.includes(currentVal)) {
        nh4hsSelect.value = currentVal;
    }

    // Trigger change to update velocity if needed
    if (nh4hsSelect.value) {
        populate_velocity(tableData);
    }
}

/**
 * Populates the Velocity dropdown based on selected NH4HS Concentration
 * @param {Object} tableData 
 */
function populate_velocity(tableData) {
    const nh4hsSelect = document.getElementById("nh2sh_concentration");
    const velocitySelect = document.getElementById("velocity");
    const currentVal = velocitySelect.value;
    const selectedConc = nh4hsSelect.value;

    velocitySelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    if (!selectedConc) return;

    const unitKey = get_unit_key();
    const rootData = tableData[unitKey];

    if (!rootData) return;

    const velocityData = rootData[selectedConc];
    if (!velocityData) return;

    const velocities = Object.keys(velocityData).sort((a, b) => parseFloat(a) - parseFloat(b));

    velocities.forEach(vel => {
        const option = document.createElement("option");
        option.value = vel;
        option.textContent = vel;
        velocitySelect.appendChild(option);
    });

    if (velocities.includes(currentVal)) {
        velocitySelect.value = currentVal;
    }
}

/**
 * Gets the corrosion rate from the table
 * @param {Object} tableData 
 * @param {string} nh4hsConc 
 * @param {string} velocity 
 * @returns {number|null} corrosion rate
 */
function calculate_corrosion_rate(tableData, nh4hsConc, velocity) {
    const unitKey = get_unit_key();
    const rootData = tableData[unitKey];

    if (!rootData) return null;

    const concData = rootData[nh4hsConc];
    if (!concData) return null;

    const rate = concData[velocity];
    return rate !== undefined ? rate : null;
}

/**
 * Calculates the adjusted corrosion rate based on H2S partial pressure
 * @param {number} baselineRate - The baseline corrosion rate
 * @param {number} pH2S - H2S partial pressure
 * @param {boolean} isFahrenheit - True if using Fahrenheit/PSI system
 * @returns {number} Adjusted corrosion rate
 */
function calculate_adjusted_rate(baselineRate, pH2S, isFahrenheit) {
    let adjustedRate = 0;

    if (isFahrenheit) {
        // PSI formulas (Note 1 & 2)
        // Threshold: 50 psia
        if (pH2S < 50) {
            // Note 1: Adjusted CR = max [ ((Baseline CR / 25) * (pH2S - 50) + Baseline CR), 0 ]
            adjustedRate = Math.max(((baselineRate / 25) * (pH2S - 50) + baselineRate), 0);
        } else {
            // Note 2: Adjusted CR = max [ ((Baseline CR / 40) * (pH2S - 50) + Baseline CR), 0 ]
            adjustedRate = Math.max(((baselineRate / 40) * (pH2S - 50) + baselineRate), 0);
        }
    } else {
        // kPa formulas (Note 1 & 2 for Metric)
        // Threshold: 345 kPa
        if (pH2S < 345) {
            // Note 1: Adjusted CR = max [ ((Baseline CR / 173) * (pH2S - 345) + Baseline CR), 0 ]
            adjustedRate = Math.max(((baselineRate / 173) * (pH2S - 345) + baselineRate), 0);
        } else {
            // Note 2: Adjusted CR = max [ ((Baseline CR / 276) * (pH2S - 345) + Baseline CR), 0 ]
            adjustedRate = Math.max(((baselineRate / 276) * (pH2S - 345) + baselineRate), 0);
        }
    }

    return parseFloat(adjustedRate.toFixed(4));
}

export function alkaline_sw_corrosion_calc() {
    // Get DOM elements
    const nh4hsSelect = document.getElementById("nh2sh_concentration");
    const velocitySelect = document.getElementById("velocity");
    const calculateButton = document.getElementById("calculate_corrosion_rate");
    const corrosionRateDisplay = document.getElementById("corrosion_rate");

    // H2S Elements
    const h2sContainer = document.getElementById("h2s_container");
    const h2sPressureInput = document.getElementById("h2s_pressure_value");
    const calculateAdjustedButton = document.getElementById("calculate_adjusted_rate");
    const adjustedRateDisplay = document.getElementById("adjusted_corrosion_rate_display");

    let currentTableData = null;

    // Use checkConditions pattern for consistency
    async function checkConditions() {
        // Since there are no visibility conditions to check first (like Material choice),
        // we essentially just ensure data is loaded and UI is ready.
        if (!currentTableData) {
            try {
                currentTableData = await get_table();
                populate_nh4hs_concentration(currentTableData);
                calculateButton.classList.remove("hidden");
            } catch (error) {
                console.error("Error initializing module:", error);
                display_errors(["Failed to load table data. Please refresh the page."]);
            }
        }
    }

    // Event Listeners
    nh4hsSelect.addEventListener("change", () => {
        populate_velocity(currentTableData);
        corrosionRateDisplay.classList.add("hidden");
        h2sContainer.classList.add("hidden"); // Hide H2S if inputs change
        adjustedRateDisplay.classList.add("hidden");
    });

    velocitySelect.addEventListener("change", () => {
        corrosionRateDisplay.classList.add("hidden");
        h2sContainer.classList.add("hidden");
        adjustedRateDisplay.classList.add("hidden");
    });



    // Check for Cladding
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") hasCladding = true;
    } catch (e) { }

    calculateButton.addEventListener("click", () => {
        // Reset output
        document.getElementById("error-container").innerHTML = "";
        corrosionRateDisplay.classList.add("hidden");
        h2sContainer.classList.add("hidden");
        adjustedRateDisplay.classList.add("hidden");

        const nh4hs = nh4hsSelect.value;
        const velocity = velocitySelect.value;

        const errors = validate_inputs(nh4hs, velocity);

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        const rate = calculate_corrosion_rate(currentTableData, nh4hs, velocity);

        if (rate === null || rate === undefined) {
            display_errors(["Could not determine corrosion rate from the table."]);
            return;
        }

        // Determine Unit string
        const table41Data = sessionStorage.getItem("table4.1_data");
        let unit = "mm/year";
        let isFahrenheit = true;

        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            isFahrenheit = table41.measurement_unit === "farenheit";
            unit = isFahrenheit ? "mpy" : "mm/year";
        }

        sessionStorage.setItem("corrosion_rate", rate);
        sessionStorage.setItem("corrosion_rate_bm", rate);

        if (hasCladding) {
            sessionStorage.setItem("corrosion_rate_cladding", 0);
            corrosionRateDisplay.innerHTML = `Base Rate: ${rate} ${unit}<br>Cladding Rate: 0 ${unit} (Assumed Resistant)`;
        } else {
            sessionStorage.removeItem("corrosion_rate_cladding");
            corrosionRateDisplay.textContent = `Estimated Corrosion Rate (Table 2.B.7.2): ${rate} ${unit}`;
        }

        corrosionRateDisplay.classList.remove("hidden");

        // Show H2S section after successful baseline calculation
        h2sContainer.classList.remove("hidden");
    });

    calculateAdjustedButton.addEventListener("click", () => {
        const baselineRate = parseFloat(sessionStorage.getItem("corrosion_rate"));
        const h2sPressure = parseFloat(h2sPressureInput.value);

        if (isNaN(baselineRate)) {
            display_errors(["Please calculate the baseline corrosion rate first."]);
            return;
        }

        if (isNaN(h2sPressure)) {
            display_errors(["Please enter a valid H2S partial pressure value."]);
            return;
        }

        const table41Data = sessionStorage.getItem("table4.1_data");
        let unit = "mm/year";
        let isFahrenheit = true;
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            isFahrenheit = table41.measurement_unit === "farenheit";
            unit = isFahrenheit ? "mpy" : "mm/year";
        }

        const adjustedRate = calculate_adjusted_rate(baselineRate, h2sPressure, isFahrenheit);

        sessionStorage.setItem("adjusted_corrosion_rate", adjustedRate);
        sessionStorage.setItem("corrosion_rate_bm", adjustedRate); // Update BM with adjusted

        if (hasCladding) {
            // Cladding rate remains 0
            adjustedRateDisplay.innerHTML = `Adjusted Base Rate: ${adjustedRate} ${unit}<br>Cladding Rate: 0 ${unit}`;
        } else {
            adjustedRateDisplay.textContent = `Adjusted Corrosion Rate: ${adjustedRate} ${unit}`;
        }

        adjustedRateDisplay.classList.remove("hidden");
    });

    // Initial run
    checkConditions();
}