/**
 * Determines the unit system (Fahrenheit/Imperial vs Celsius/Metric)
 * @returns {string} "temperature_in_f" or "temperature_in_c"
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
 * Fetches the base corrosion rate table (table_2b122)
 * @returns {Promise<Object>} table data
 */
async function get_base_rate_table() {
    const tablePath = '/static/formula_app/data/json/soil_side_corrosion/table_2b122.JSON';
    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load base rate table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Displays error messages in the error container
 * @param {string[]} errors - Array of error messages
 */
/**
 * Displays error messages in the error container
 * @param {string[]} errors - Array of error messages
 */
function display_errors(errors) {
    const errorContainer = document.getElementById("error-container");
    if (!errorContainer) return;

    errorContainer.innerHTML = "";

    if (errors.length > 0) {
        errors.forEach(error => {
            const errorElement = document.createElement("p");
            errorElement.textContent = error;
            errorElement.classList.add("alert", "alert-error", "m-3", "text-white", "text-bold");
            errorContainer.appendChild(errorElement);
        });
    }
}

/**
 * Fetches the soil resistivity factor table (table_2b123)
 * @returns {Promise<Object>} table data
 */
async function get_resistivity_table() {
    const tablePath = '/static/formula_app/data/json/soil_side_corrosion/table_2b123.JSON';
    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load resistivity table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Fetches the temperature factor table (table_2b124)
 * @returns {Promise<Object>} table data
 */
async function get_temperature_table() {
    const tablePath = '/static/formula_app/data/json/soil_side_corrosion/table_2b124.JSON';
    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load temperature table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Determines the resistivity factor based on resistivity value
 * @param {number} resistivity - Soil resistivity in Ω-cm
 * @param {Object} tableData - Resistivity table data
 * @returns {Object} - {factor, corrosiveness, range}
 */
function get_resistivity_factor(resistivity, tableData) {
    for (const entry of tableData.data) {
        const range = entry.resistivity.range;

        if (range.includes("<") && !range.includes("to")) {
            const threshold = parseFloat(range.replace(/[<,]/g, "").trim());
            if (resistivity < threshold) {
                return {
                    factor: entry.multiplyingFactor,
                    corrosiveness: entry.corrosiveness,
                    range: range
                };
            }
        } else if (range.includes(">") && !range.includes("to")) {
            const threshold = parseFloat(range.replace(/[>,]/g, "").trim());
            if (resistivity > threshold) {
                return {
                    factor: entry.multiplyingFactor,
                    corrosiveness: entry.corrosiveness,
                    range: range
                };
            }
        } else if (range.includes("to")) {
            const parts = range.split("to").map(p => parseFloat(p.replace(/,/g, "").trim()));
            if (resistivity >= parts[0] && resistivity <= parts[1]) {
                return {
                    factor: entry.multiplyingFactor,
                    corrosiveness: entry.corrosiveness,
                    range: range
                };
            }
        }
    }
    return null;
}

/**
 * Determines the temperature factor based on operating temperature
 * @param {number} temperature - Operating temperature
 * @param {boolean} isFahrenheit - Whether temperature is in Fahrenheit
 * @param {Object} tableData - Temperature table data
 * @returns {Object} - {factor, range}
 */
function get_temperature_factor(temperature, isFahrenheit, tableData) {
    for (const entry of tableData.data) {
        const tempRange = isFahrenheit ? entry.temperature.fahrenheit : entry.temperature.celsius;

        if (tempRange.includes("<") && !tempRange.includes("to")) {
            const threshold = parseFloat(tempRange.replace("<", "").trim());
            if (temperature < threshold) {
                return {
                    factor: entry.multiplyingFactor,
                    range: tempRange
                };
            }
        } else if (tempRange.includes(">") && !tempRange.includes("to")) {
            const threshold = parseFloat(tempRange.replace(">", "").trim());
            if (temperature > threshold) {
                return {
                    factor: entry.multiplyingFactor,
                    range: tempRange
                };
            }
        } else if (tempRange.includes("to")) {
            const parts = tempRange.split("to").map(p => parseFloat(p.trim()));
            if (temperature >= parts[0] && temperature <= parts[1]) {
                return {
                    factor: entry.multiplyingFactor,
                    range: tempRange
                };
            }
        }
    }
    return null;
}

/**
 * Fetches the CP factor table (table_2b125)
 * @returns {Promise<Object>} table data
 */
async function get_cp_table() {
    const tablePath = '/static/formula_app/data/json/soil_side_corrosion/table_2b125.JSON';
    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load CP table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Determines the CP factor based on selected practice
 * @param {string} practice - Selected CP practice
 * @param {Object} tableData - CP table data
 * @returns {number|null} - Multiplying factor
 */
function get_cp_factor(practice, tableData) {
    const entry = tableData.data.find(e => e.practice === practice);
    return entry ? entry.multiplyingFactor : null;
}

/**
 * Fetches the Coating factor table (table_2b126)
 * @returns {Promise<Object>} table data
 */
async function get_coating_table() {
    const tablePath = '/static/formula_app/data/json/soil_side_corrosion/table_2b126.JSON';
    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load Coating table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Determines the Coating factor based on inputs
 * @param {string} coatingType - Selected coating type
 * @param {boolean} ageOver20 - Age > 20 years
 * @param {boolean} tempExceeded - Max rated temp occasionally exceeded
 * @param {boolean} maintenancePoor - Coating maintenance rare or none
 * @param {Object} tableData - Coating table data
 * @returns {number|null} - Multiplying factor
 */
function get_coating_factor(coatingType, ageOver20, tempExceeded, maintenancePoor, tableData) {
    const entry = tableData.data.find(e => e.coatingType === coatingType);
    if (!entry) return null;

    let factor = entry.baseFactorForCoatingType;

    if (ageOver20) factor *= entry.multiplyingFactors.ageOver20Years;
    if (tempExceeded) factor *= entry.multiplyingFactors.maxRatedTemperatureOccasionallyExceeded;
    if (maintenancePoor) factor *= entry.multiplyingFactors.coatingMaintenanceRareOrNone;

    return parseFloat(factor.toFixed(2)); // Round to 2 decimals
}

export function soil_side_corrosion_calc() {

    // Module-level variable to store base corrosion rate
    let baseCorrosionRate = null;

    const soilTypeSelect = document.getElementById("soil_type");
    const baseRateMessage = document.getElementById("base_corrosion_rate_message");

    // Event listener for soil type selection
    soilTypeSelect.addEventListener("change", async () => {
        const soilType = soilTypeSelect.value;

        if (!soilType) {
            baseRateMessage.classList.add("hidden");
            baseCorrosionRate = null;
            return;
        }

        try {
            // Fetch the base rate table
            const tableData = await get_base_rate_table();

            // Find the entry matching the selected soil type
            const soilData = tableData.data.find(entry => entry.soilType === soilType);

            if (!soilData) {
                throw new Error(`No data found for soil type: ${soilType}`);
            }

            // Determine which unit to use
            const unitKey = get_unit_key();
            const isFahrenheit = unitKey === "temperature_in_f";
            const rate = isFahrenheit ? soilData.rate.mpy : soilData.rate.mmPerYear;
            const unit = isFahrenheit ? "mpy" : "mm/yr";

            // Store the base corrosion rate for later use
            baseCorrosionRate = rate;

            // Display the message with additional soil information
            baseRateMessage.innerHTML = `
                <strong>Base Corrosion Rate: ${rate} ${unit}</strong><br>
                <small>
                    Chemical Contaminants: ${soilData.chemicalContaminants.level} (${soilData.chemicalContaminants.context})<br>
                    Particle Size: ${soilData.particleSize}<br>
                    Moisture Level: ${soilData.moistureLevel}
                </small>
            `;
            baseRateMessage.classList.remove("hidden");

            console.log(`Base corrosion rate for ${soilType}: ${rate} ${unit}`);
            console.log("Soil data:", soilData);

        } catch (error) {
            console.error("Error fetching base corrosion rate:", error);
            display_errors([`Error: ${error.message}`]);
            baseRateMessage.classList.add("hidden");
            baseCorrosionRate = null;
        }
    });

    // Additional DOM elements for resistivity flow
    const soilResistivitySelect = document.getElementById("soil_resistivity");
    const resistivityInputSection = document.getElementById("soil_resistivity_input_section");
    const resistivityValueInput = document.getElementById("soil_resistivity_value");
    const resistivityFactorMessage = document.getElementById("soil_resistivity_factor_message");
    const temperatureFactorMessage = document.getElementById("temperature_factor_message");
    const cpSection = document.getElementById("cp_section");
    const cpSelect = document.getElementById("cp_practice");
    const cpFactorMessage = document.getElementById("cp_factor_message");

    // Coating DOM elements
    const coatingQuestionSelect = document.getElementById("coating_question");
    const coatingQuestionSection = document.getElementById("coating_question_section");
    const coatingInputSection = document.getElementById("coating_input_section");
    const coatingTypeSelect = document.getElementById("coating_type");
    const coatingAgeCheckbox = document.getElementById("coating_age");
    const coatingTempCheckbox = document.getElementById("coating_temp");
    const coatingMaintenanceCheckbox = document.getElementById("coating_maintenance");
    const coatingFactorMessage = document.getElementById("coating_factor_message");

    let resistivityFactor = null;
    let temperatureFactor = null;
    let cpFactor = null;
    let coatingFactor = null;

    // Event listener for soil resistivity question
    soilResistivitySelect.addEventListener("change", async () => {
        const answer = soilResistivitySelect.value;

        // Hide all subsequent sections first
        resistivityInputSection.classList.add("hidden");
        resistivityFactorMessage.classList.add("hidden");
        temperatureFactorMessage.classList.add("hidden");
        cpSection.classList.add("hidden");
        cpFactorMessage.classList.add("hidden");
        coatingQuestionSection.classList.add("hidden");
        coatingInputSection.classList.add("hidden");
        coatingFactorMessage.classList.add("hidden");

        if (answer === "no") {
            // Show resistivity input section
            resistivityInputSection.classList.remove("hidden");
        } else if (answer === "yes") {
            // Skip to operating temperature
            await showOperatingTemperature();
        }
    });

    // Event listener for resistivity value input
    resistivityValueInput.addEventListener("input", async () => {
        const resistivity = parseFloat(resistivityValueInput.value);

        if (!resistivity || isNaN(resistivity)) {
            resistivityFactorMessage.classList.add("hidden");
            temperatureFactorMessage.classList.add("hidden");
            cpSection.classList.add("hidden");
            resistivityFactor = null;
            return;
        }

        try {
            const tableData = await get_resistivity_table();
            const factorData = get_resistivity_factor(resistivity, tableData);

            if (!factorData) {
                throw new Error("Could not determine resistivity factor");
            }

            resistivityFactor = factorData.factor;

            resistivityFactorMessage.innerHTML = `
                <strong>Soil Resistivity Factor: ${factorData.factor}</strong><br>
                <small>
                    Range: ${factorData.range} Ω-cm<br>
                    Corrosiveness: ${factorData.corrosiveness}
                </small>
            `;
            resistivityFactorMessage.classList.remove("hidden");

            console.log(`Resistivity factor: ${factorData.factor} for ${resistivity} Ω-cm`);

            // Show operating temperature section
            await showOperatingTemperature();

        } catch (error) {
            console.error("Error calculating resistivity factor:", error);
            display_errors([`Error: ${error.message}`]);
            resistivityFactorMessage.classList.add("hidden");
            resistivityFactor = null;
        }
    });

    // Function to show and populate operating temperature
    async function showOperatingTemperature() {
        try {
            // Get operating temperature from sessionStorage
            const table41 = sessionStorage.getItem("table4.1_data");
            const table41_data = table41 ? JSON.parse(table41) : null;

            if (!table41_data || !table41_data.operating_temp) {
                throw new Error("Operating temperature not found in Table 4.1");
            }

            // Show the message element
            temperatureFactorMessage.classList.remove("hidden");

            // Calculate temperature factor
            const unitKey = get_unit_key();
            const isFahrenheit = unitKey === "temperature_in_f";
            const unit = isFahrenheit ? "°F" : "°C";

            const tempTableData = await get_temperature_table();
            const tempFactorData = get_temperature_factor(parseFloat(table41_data.operating_temp), isFahrenheit, tempTableData);

            if (!tempFactorData) {
                throw new Error("Could not determine temperature factor");
            }

            temperatureFactor = tempFactorData.factor;

            temperatureFactorMessage.innerHTML = `
                <strong>Multiplying Factor (Temperature): ${tempFactorData.factor}</strong><br>
                <small>Based on Operating Temp: ${table41_data.operating_temp} ${unit} (Table 2.B.12.4)</small>
            `;

            console.log("Operating Temperature Message Set:", {
                temp: table41_data.operating_temp,
                unit: unit,
                factor: tempFactorData.factor
            });

            // Show CP section after temperature is done
            await showCPSection();

        } catch (error) {
            console.error("Error loading operating temperature:", error);
            display_errors([`Error: ${error.message}`]);
            temperatureFactorMessage.classList.add("hidden");
            temperatureFactor = null;
        }
    }

    // Function to populate and show CP section
    async function showCPSection() {
        try {
            const tableData = await get_cp_table();

            // Populate dropdown if empty
            if (cpSelect.options.length <= 1) {
                tableData.data.forEach(entry => {
                    const option = document.createElement("option");
                    option.value = entry.practice;
                    option.textContent = entry.practice;
                    cpSelect.appendChild(option);
                });
            }

            cpSection.classList.remove("hidden");

        } catch (error) {
            console.error("Error loading CP table:", error);
            display_errors([`Error: ${error.message}`]);
        }
    }

    // Event listener for CP selection
    cpSelect.addEventListener("change", async () => {
        const practice = cpSelect.value;

        if (!practice) {
            cpFactorMessage.classList.add("hidden");
            cpFactor = null;
            return;
        }

        try {
            const tableData = await get_cp_table();
            const factor = get_cp_factor(practice, tableData);

            if (factor === null) {
                throw new Error("Could not determine CP factor");
            }

            cpFactor = factor;

            cpFactorMessage.innerHTML = `<strong>Multiplying Factor (CP): ${factor}</strong>`;
            cpFactorMessage.classList.remove("hidden");

            console.log(`CP Factor: ${factor}`);

            // Show Coating Question Section
            coatingQuestionSection.classList.remove("hidden");

        } catch (error) {
            console.error("Error determining CP factor:", error);
            display_errors([`Error: ${error.message}`]);
            cpFactorMessage.classList.add("hidden");
            cpFactor = null;
        }
    });

    // Helper to calculate and display coating factor
    async function calculateCoatingFactor() {
        const coatingType = coatingTypeSelect.value;
        const answer = coatingQuestionSelect.value;

        if (answer === "no") {
            return;
        }

        if (!coatingType) {
            coatingFactorMessage.classList.add("hidden");
            coatingFactor = null;
            return;
        }

        try {
            const tableData = await get_coating_table();
            const factor = get_coating_factor(
                coatingType,
                coatingAgeCheckbox.checked,
                coatingTempCheckbox.checked,
                coatingMaintenanceCheckbox.checked,
                tableData
            );

            if (factor === null) {
                throw new Error("Could not determine Coating factor");
            }

            coatingFactor = factor;
            coatingFactorMessage.innerHTML = `<strong>Multiplying Factor (Coating): ${factor}</strong>`;
            coatingFactorMessage.classList.remove("hidden");

        } catch (error) {
            console.error("Error calculating coating factor:", error);
            coatingFactorMessage.classList.add("hidden");
            coatingFactor = null;
        }
    }

    // Event listener for Coating Question
    coatingQuestionSelect.addEventListener("change", async () => {
        const answer = coatingQuestionSelect.value;

        // Hide details and message initially
        coatingInputSection.classList.add("hidden");
        coatingFactorMessage.classList.add("hidden");
        coatingFactor = null;

        if (answer === "no") {
            // Factor is 1.0
            coatingFactor = 1.0;
            coatingFactorMessage.innerHTML = `<strong>Multiplying Factor (Coating): 1.0</strong><br><small>No coating present.</small>`;
            coatingFactorMessage.classList.remove("hidden");

        } else if (answer === "yes") {
            // Show details section
            try {
                const tableData = await get_coating_table();

                // Populate dropdown if empty
                if (coatingTypeSelect.options.length <= 1) {
                    tableData.data.forEach(entry => {
                        const option = document.createElement("option");
                        option.value = entry.coatingType;
                        option.textContent = entry.coatingType;
                        coatingTypeSelect.appendChild(option);
                    });
                }

                coatingInputSection.classList.remove("hidden");
                // Trigger calculation to update if values already exist
                if (coatingTypeSelect.value) calculateCoatingFactor();

            } catch (error) {
                console.error("Error loading Coating table:", error);
                display_errors([`Error: ${error.message}`]);
            }
        }
        updateCalculateButtonVisibility();
    });

    // Event listeners for Coating details
    coatingTypeSelect.addEventListener("change", () => { calculateCoatingFactor(); updateCalculateButtonVisibility(); });
    coatingAgeCheckbox.addEventListener("change", () => { calculateCoatingFactor(); updateCalculateButtonVisibility(); });
    coatingTempCheckbox.addEventListener("change", () => { calculateCoatingFactor(); updateCalculateButtonVisibility(); });
    coatingMaintenanceCheckbox.addEventListener("change", () => { calculateCoatingFactor(); updateCalculateButtonVisibility(); });

    // Function to get the current base corrosion rate (for use in calculations)
    function getBaseCorrosionRate() {
        return baseCorrosionRate;
    }

    // Expose the function for later use
    window.getBaseCorrosionRate = getBaseCorrosionRate;

    const calculateButton = document.getElementById("calculate_corrosion_rate");
    const corrosionRateMessage = document.getElementById("corrosion_rate");

    function checkAllFactorsSet() {
        const isBaseSet = baseCorrosionRate !== null;

        // Resistivity: 
        // If "Yes" (considered in base), factor is ignored (effectively 1).
        // If "No", factor must be calculated.
        const resistivityChoice = soilResistivitySelect.value;
        const isResistivitySet = (resistivityChoice === "yes") ||
            (resistivityChoice === "no" && resistivityFactor !== null);

        const isTempSet = temperatureFactor !== null;
        const isCpSet = cpFactor !== null;
        const isCoatingSet = coatingFactor !== null;

        return isBaseSet && isResistivitySet && isTempSet && isCpSet && isCoatingSet;
    }

    function updateCalculateButtonVisibility() {
        if (checkAllFactorsSet()) {
            calculateButton.classList.remove("hidden");
            // Hide result if inputs change after calculation
            corrosionRateMessage.classList.add("hidden");
        } else {
            calculateButton.classList.add("hidden");
            corrosionRateMessage.classList.add("hidden");
        }
    }

    // Call update in all other listeners
    soilTypeSelect.addEventListener("change", updateCalculateButtonVisibility);
    soilResistivitySelect.addEventListener("change", updateCalculateButtonVisibility);
    resistivityValueInput.addEventListener("input", updateCalculateButtonVisibility);
    // showOperatingTemperature calls update indirectly? No, it's async. 
    // We should call update at the end of showOperatingTemperature and showCPSection flow.
    // Actually, showOperatingTemperature is called by listeners. We can modify showOperatingTemperature to call checking.
    // However, simpler to just add hook to the end of the async functions or listeners.
    // listener for cpSelect already exists, let's update it.
    cpSelect.addEventListener("change", updateCalculateButtonVisibility);


    calculateButton.addEventListener("click", () => {
        // Clear previous errors
        document.getElementById("error-container").innerHTML = "";

        if (!checkAllFactorsSet()) {
            display_errors(["Please complete all sections before calculating."]);
            return;
        }

        try {
            // Formula 2.B.21: CR = CR_B * F_SR * F_T * F_CP * F_CE

            const CR_B = baseCorrosionRate;

            const F_SR = (soilResistivitySelect.value === "yes") ? 1.0 : resistivityFactor;

            const F_T = temperatureFactor;
            const F_CP = cpFactor;
            const F_CE = coatingFactor;

            const corrosionRate = CR_B * F_SR * F_T * F_CP * F_CE;

            // Get unit logic
            const unitKey = get_unit_key();
            const isFahrenheit = unitKey === "temperature_in_f";
            const unit = isFahrenheit ? "mpy" : "mm/yr";

            corrosionRateMessage.innerHTML = `
                <strong>Estimated Corrosion Rate: ${corrosionRate.toFixed(2)} ${unit}</strong><br>
                <small>Formula 2.B.21 applied.</small>
            `;
            corrosionRateMessage.classList.remove("hidden");

            // Save to sessionStorage
            sessionStorage.setItem("corrosion_rate", corrosionRate.toFixed(2));
            sessionStorage.setItem("corrosion_rate_bm", corrosionRate.toFixed(2));

            // Check for cladding and set rate to 0 (Internal cladding doesn't affect external soil corrosion)
            try {
                const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
                if (t41 && t41.has_cladding === "yes") {
                    sessionStorage.setItem("corrosion_rate_cladding", 0);
                } else {
                    sessionStorage.removeItem("corrosion_rate_cladding");
                }
            } catch (e) { }

            // Enable Next Step Button (Global Handler)
            if (typeof window.updateNextButtonState === 'function') {
                window.updateNextButtonState();
            }

        } catch (error) {
            console.error("Calculation Error:", error);
            display_errors([`Error calculating rate: ${error.message}`]);
        }
    });
}
