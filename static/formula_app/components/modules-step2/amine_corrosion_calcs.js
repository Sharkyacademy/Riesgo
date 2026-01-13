/**
 * Helper function to handle visibility
 */
function setVisibility(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) el.classList.remove("hidden");
    else el.classList.add("hidden");
}

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
 * Fetches the appropriate corrosion rate table based on amine type
 * @param {string} amineType - "MEA", "DEA", or "MDEA"
 * @returns {Promise<Object>} table data
 */
async function get_table(amineType) {
    const unitKey = get_unit_key();
    const isMetric = unitKey === "temperature_in_c";

    let tablePath;
    if (amineType === "MEA" || amineType === "DEA") {
        tablePath = isMetric
            ? '/static/formula_app/data/json/amine_corrosion/table_2b82M.JSON'
            : '/static/formula_app/data/json/amine_corrosion/table_2b82.JSON';
    } else if (amineType === "MDEA") {
        tablePath = isMetric
            ? '/static/formula_app/data/json/amine_corrosion/table_2b83M.JSON'
            : '/static/formula_app/data/json/amine_corrosion/table_2b83.JSON';
    } else {
        throw new Error(`Unknown amine type: ${amineType}`);
    }

    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Fetches the multiplier table (table_2b84)
 * @returns {Promise<Object>} multiplier table data
 */
async function get_multiplier_table() {
    const tablePath = '/static/formula_app/data/json/amine_corrosion/table_2b84.JSON';
    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load multiplier table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Fetches the 300 Series SS table (table_2b85)
 * @returns {Promise<Object>} SS table data
 */
async function get_ss_table() {
    const tablePath = '/static/formula_app/data/json/amine_corrosion/table_2b85.JSON';
    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load SS table: ${response.status}`);
    }
    return await response.json();
}

/**
 * Populates acid gas loading dropdown based on amine type
 * @param {string} amineType - "MEA", "DEA", or "MDEA"
 */
async function populate_acid_gas_loading(amineType) {
    const acidGasSelect = document.getElementById("acid_gas_loading");
    acidGasSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    try {
        const tableData = await get_table(amineType);
        const unitKey = get_unit_key();
        const tempData = tableData[unitKey];

        if (!tempData) {
            console.error("No temperature data found");
            return;
        }

        // Get unique acid gas loading values from table
        const acidGasValues = Object.keys(tempData).sort((a, b) => {
            const aVal = a === "<0.1" ? 0.09 : parseFloat(a);
            const bVal = b === "<0.1" ? 0.09 : parseFloat(b);
            return aVal - bVal;
        });

        acidGasValues.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            acidGasSelect.appendChild(option);
        });

        acidGasSelect.disabled = false;
    } catch (error) {
        console.error("Error populating acid gas loading:", error);
    }
}

/**
 * Populates HSAS dropdown based on amine type and acid gas loading
 * @param {string} amineType - "MEA", "DEA", or "MDEA"
 * @param {string} acidGasLoading - Selected acid gas loading value
 */
async function populate_hsas_options(amineType, acidGasLoading) {
    const hsasSelect = document.getElementById("HSAS");
    hsasSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    if (!acidGasLoading) {
        hsasSelect.disabled = true;
        return;
    }

    try {
        const tableData = await get_table(amineType);
        const unitKey = get_unit_key();
        const tempData = tableData[unitKey];

        if (!tempData || !tempData[acidGasLoading]) {
            console.error("No data for acid gas loading:", acidGasLoading);
            return;
        }

        // Get HSAS values from the first temperature entry
        const firstTemp = Object.keys(tempData[acidGasLoading])[0];
        const hsasValues = Object.keys(tempData[acidGasLoading][firstTemp]);

        hsasValues.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            hsasSelect.appendChild(option);
        });

        hsasSelect.disabled = false;
    } catch (error) {
        console.error("Error populating HSAS:", error);
    }
}

/**
 * Displays error messages in the error container
 * @param {string[]} errors - Array of error messages
 */
function display_errors(errors) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = "";

    if (errors.length > 0) {
        errors.forEach(error => {
            const errorDiv = document.createElement("div");
            errorDiv.className = "alert alert-error";
            errorDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>${error}</span>
            `;
            errorContainer.appendChild(errorDiv);
        });
    }
}

/**
 * Validates inputs for Carbon Steel/Low Alloy path
 * @param {string} amineType
 * @param {string} acidGasLoading
 * @param {string} hsas
 * @param {number} amineConcentration
 * @param {number} velocity
 * @param {number} temperature
 * @returns {string[]} Array of error messages
 */
function validate_inputs_cs(amineType, acidGasLoading, hsas, amineConcentration, velocity, temperature) {
    const errors = [];

    if (!amineType) {
        errors.push("Amine type is required.");
    }

    if (!acidGasLoading) {
        errors.push("Acid gas loading is required.");
    }

    if (!hsas) {
        errors.push("HSAS concentration is required.");
    }

    if (!amineConcentration || isNaN(amineConcentration)) {
        errors.push("Amine concentration is required and must be a number.");
    } else if (amineConcentration <= 0) {
        errors.push("Amine concentration must be greater than 0.");
    }

    if (!velocity || isNaN(velocity)) {
        errors.push("Velocity is required and must be a number.");
    } else if (velocity <= 0) {
        errors.push("Velocity must be greater than 0.");
    }

    if (!temperature || isNaN(temperature)) {
        errors.push("Temperature is required and must be a number.");
    }

    return errors;
}

/**
 * Validates inputs for 300 Series SS path
 * @param {number} acidGasLoading
 * @param {number} temperature
 * @returns {string[]} Array of error messages
 */
function validate_inputs_ss(acidGasLoading, temperature) {
    const errors = [];
    const unitKey = get_unit_key();
    const isFahrenheit = unitKey === "temperature_in_f";
    const maxTemp = isFahrenheit ? 300 : 149;
    const tempUnit = isFahrenheit ? "°F" : "°C";

    if (!temperature || isNaN(temperature)) {
        errors.push("Temperature is required and must be a number.");
    } else if (temperature > maxTemp) {
        errors.push(`Temperature must be ≤${maxTemp}${tempUnit} for 300 Series SS.`);
    }

    if (!acidGasLoading || isNaN(acidGasLoading)) {
        errors.push("Acid gas loading is required and must be a number.");
    } else if (acidGasLoading < 0.1 || acidGasLoading > 0.7) {
        errors.push("Acid gas loading must be between 0.1 and 0.7 for this calculation.");
    }

    return errors;
}

/**
 * Finds the closest key in the table data
 * @param {Object} data - The data object
 * @param {number} value - The value to find
 * @returns {string|null} The closest key
 */
function find_closest_key(data, value) {
    const keys = Object.keys(data).map(k => parseFloat(k));
    if (keys.length === 0) return null;

    // Find exact match first
    if (keys.includes(value)) return value.toString();

    // Find closest
    let closest = keys[0];
    let minDiff = Math.abs(value - closest);

    for (let key of keys) {
        const diff = Math.abs(value - key);
        if (diff < minDiff) {
            minDiff = diff;
            closest = key;
        }
    }

    return closest.toString();
}

/**
 * Calculates corrosion rate for Carbon Steel/Low Alloy path
 * @param {string} amineType
 * @param {string} acidGasLoading
 * @param {string} hsas
 * @param {number} amineConcentration
 * @param {number} velocity
 * @param {number} temperature
 * @returns {Promise<number|null>} Corrosion rate
 */
async function calculate_corrosion_rate_cs(amineType, acidGasLoading, hsas, amineConcentration, velocity, temperature) {
    try {
        const tableData = await get_table(amineType);
        const multiplierData = await get_multiplier_table();
        const unitKey = get_unit_key();

        // Navigate: temperature_in_f/c -> acid gas loading -> temperature -> HSAS -> velocity
        const tempData = tableData[unitKey];
        if (!tempData) {
            throw new Error("Temperature data not found in table");
        }

        // Get acid gas loading data
        const acidGasData = tempData[acidGasLoading];
        if (!acidGasData) {
            throw new Error(`No data for acid gas loading: ${acidGasLoading}`);
        }

        // Find closest temperature
        const availableTemps = Object.keys(acidGasData).map(t => parseFloat(t));
        let closestTemp = availableTemps[0];
        let minDiff = Math.abs(temperature - closestTemp);

        for (let temp of availableTemps) {
            const diff = Math.abs(temperature - temp);
            if (diff < minDiff) {
                minDiff = diff;
                closestTemp = temp;
            }
        }

        const tempKey = closestTemp.toString();
        const hsasData = acidGasData[tempKey];
        if (!hsasData) {
            throw new Error(`No data for temperature: ${tempKey}`);
        }

        // Get HSAS data
        const velocityData = hsasData[hsas];
        if (!velocityData) {
            throw new Error(`No data for HSAS: ${hsas}`);
        }

        // Determine velocity threshold
        // The table has two columns for velocity thresholds
        const velocityKeys = Object.keys(velocityData);
        let velocityThreshold;

        // For MEA/DEA with <0.1 acid gas loading, thresholds are <20 and >20
        // For other cases, thresholds are <=5 and >5
        if (velocityKeys.includes("<20")) {
            velocityThreshold = velocity < 20 ? "<20" : ">20";
        } else if (velocityKeys.includes("<=5")) {
            velocityThreshold = velocity <= 5 ? "<=5" : ">5";
        } else {
            // Fallback: use first available key
            velocityThreshold = velocityKeys[0];
        }

        const baseRate = velocityData[velocityThreshold];
        if (baseRate === undefined) {
            throw new Error(`No corrosion rate found for velocity threshold: ${velocityThreshold}`);
        }

        console.log(`Base corrosion rate: ${baseRate} for velocity threshold: ${velocityThreshold}`);

        // Get multiplier from table_2b84
        const multiplierTable = multiplierData.amine_corrosion_rate_multiplier[amineType];
        if (!multiplierTable) {
            throw new Error(`No multiplier data for amine type: ${amineType}`);
        }

        // Determine multiplier based on amine concentration
        let multiplier = 1.0;

        if (amineType === "MEA") {
            if (amineConcentration <= 20) multiplier = multiplierTable["<=20"];
            else if (amineConcentration <= 25) multiplier = multiplierTable["21_to_25"];
            else multiplier = multiplierTable[">25"];
        } else if (amineType === "DEA") {
            if (amineConcentration <= 30) multiplier = multiplierTable["<=30"];
            else if (amineConcentration <= 40) multiplier = multiplierTable["31_to_40"];
            else multiplier = multiplierTable[">40"];
        } else if (amineType === "MDEA") {
            multiplier = multiplierTable["<=50"];
        }

        console.log(`Multiplier: ${multiplier} for concentration: ${amineConcentration} wt%`);

        const finalRate = baseRate * multiplier;
        console.log(`Final corrosion rate: ${finalRate}`);

        return finalRate;

    } catch (error) {
        console.error("Error calculating corrosion rate:", error);
        throw error;
    }
}

/**
 * Calculates corrosion rate for 300 Series SS path
 * @param {number} acidGasLoading
 * @returns {Promise<number|null>} Corrosion rate
 */
async function calculate_corrosion_rate_ss(acidGasLoading) {
    try {
        const tableData = await get_ss_table();
        const unitKey = get_unit_key();
        const isFahrenheit = unitKey === "temperature_in_f";

        // Find closest acid gas loading key
        const acidGasKey = find_closest_key(tableData.data, acidGasLoading);
        if (!acidGasKey) {
            throw new Error("Could not find acid gas loading in SS table");
        }

        const rateData = tableData.data[acidGasKey];
        if (!rateData) {
            throw new Error(`No data for acid gas loading: ${acidGasKey}`);
        }

        // Return appropriate unit
        const rate = isFahrenheit ? rateData.mpy : rateData["mm/yr"];
        return rate;

    } catch (error) {
        console.error("Error calculating SS corrosion rate:", error);
        throw error;
    }
}

export function amine_corrosion_calc() {

    const typeCS = document.getElementById("type_carbon_lowAlloy");
    const typeSS = document.getElementById("type_300_series_ss");
    const amineTypeSelect = document.getElementById("amine_type");
    const acidGasLoadingSelect = document.getElementById("acid_gas_loading");
    const calculateButton = document.getElementById("calculate_corrosion_rate");
    const corrosionRateDisplay = document.getElementById("corrosion_rate");

    // Check Cladding Status from Table 4.1
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") {
            hasCladding = true;
        }
    } catch (e) { console.error("Error reading table4.1", e); }


    // Function to manage the flow logic
    function updateVisibility() {
        const isCS = typeCS.value === "yes";
        const isNotCS = typeCS.value === "no";

        // Hide everything first
        setVisibility("cs_inputs_container", false);
        setVisibility("ss_check_container", false);
        setVisibility("ss_inputs_container", false);
        setVisibility("specialist_message", false);
        setVisibility("calculate_corrosion_rate", false);

        // Cladding visibility
        const cladContainer = document.getElementById("cladding_type_container");
        if (cladContainer) {
            if (hasCladding && (isCS || (isNotCS && typeSS.value === "yes"))) {
                cladContainer.classList.remove("hidden");
            } else {
                cladContainer.classList.add("hidden");
            }
        }

        // Clear errors and results
        display_errors([]);
        corrosionRateDisplay.classList.add("hidden");

        if (isCS) {
            // Path 1: Carbon Steel -> Show CS Inputs
            setVisibility("cs_inputs_container", true);
            setVisibility("calculate_corrosion_rate", true);
        } else if (isNotCS) {
            // Path 2: Not CS -> Ask if SS
            setVisibility("ss_check_container", true);

            const isSS = typeSS.value === "yes";
            const isNotSS = typeSS.value === "no";

            if (isSS) {
                // Path 2a: Is SS -> Show SS Inputs
                setVisibility("ss_inputs_container", true);
                setVisibility("calculate_corrosion_rate", true);
            } else if (isNotSS) {
                // Path 2b: Not SS -> Consult Specialist
                setVisibility("specialist_message", true);
            }
        }
    }

    // Event listener for amine type selection
    amineTypeSelect.addEventListener("change", async () => {
        const amineType = amineTypeSelect.value;
        if (amineType) {
            // Populate acid gas loading dropdown
            await populate_acid_gas_loading(amineType);

            // Clear dependent dropdowns
            document.getElementById("HSAS").innerHTML = '<option value="" disabled selected>Select one</option>';
            document.getElementById("HSAS").disabled = true;
        }
    });

    // Event listener for acid gas loading selection
    acidGasLoadingSelect.addEventListener("change", async () => {
        const amineType = amineTypeSelect.value;
        const acidGasLoading = acidGasLoadingSelect.value;

        if (amineType && acidGasLoading) {
            // Populate HSAS dropdown
            await populate_hsas_options(amineType, acidGasLoading);
        }
    });

    // Event Listeners for material type
    typeCS.addEventListener("change", () => {
        updateVisibility();
    });

    typeSS.addEventListener("change", updateVisibility);

    // Calculate button event listener
    calculateButton.addEventListener("click", async () => {
        display_errors([]);
        corrosionRateDisplay.classList.add("hidden");

        const isCS = typeCS.value === "yes";
        const isSS = typeSS.value === "yes";

        let rateBM = 0;
        let rateClad = 0;
        let bmCalced = false;

        try {
            // --- BASE METAL CALCULATION ---
            if (isCS) {
                // Carbon Steel/Low Alloy path
                const amineType = document.getElementById("amine_type").value;
                const acidGasLoading = document.getElementById("acid_gas_loading").value;
                const hsas = document.getElementById("HSAS").value;
                const amineConcentration = parseFloat(document.getElementById("amine_concentration").value);
                const velocity = parseFloat(document.getElementById("velocity").value);
                const temperature = parseFloat(document.getElementById("temperature").value);

                const errors = validate_inputs_cs(amineType, acidGasLoading, hsas, amineConcentration, velocity, temperature);
                if (errors.length > 0) {
                    display_errors(errors);
                    return;
                }

                const result = await calculate_corrosion_rate_cs(
                    amineType, acidGasLoading, hsas, amineConcentration, velocity, temperature
                );

                if (result !== null) {
                    rateBM = result;
                    bmCalced = true;
                } else {
                    display_errors(["Could not calculate corrosion rate. Please check your inputs."]);
                    return;
                }

            } else if (isSS) {
                // 300 Series SS path
                const acidGasLoading = parseFloat(document.getElementById("acid_gas_loading_ss").value);
                const temperature = parseFloat(document.getElementById("temperature_ss").value);

                const errors = validate_inputs_ss(acidGasLoading, temperature);
                if (errors.length > 0) {
                    display_errors(errors);
                    return;
                }

                const result = await calculate_corrosion_rate_ss(acidGasLoading);

                if (result !== null) {
                    rateBM = result;
                    bmCalced = true;
                } else {
                    display_errors(["Could not calculate corrosion rate. Please check your inputs."]);
                    return;
                }
            }

            // --- CLADDING CALCULATION ---
            if (hasCladding && bmCalced) {
                const cladType = document.getElementById("cladding_material_type").value;

                if (cladType === "ss" && isCS) {
                    // Base=CS, Clad=SS. Reuse CS inputs -> convert to SS inputs
                    // Need: Acid Gas Loading (float), Temperature
                    const csLoadingStr = document.getElementById("acid_gas_loading").value; // e.g. "0.20" or "<0.1"
                    let csLoading = parseFloat(csLoadingStr);
                    if (csLoadingStr.includes("<")) csLoading = 0.09; // Safe approx

                    const csTemp = parseFloat(document.getElementById("temperature").value);

                    // SS Calc needs loading and doesn't use temp for rate look up but validates it?
                    // Actually calculate_corrosion_rate_ss uses loading. 
                    const ssResult = await calculate_corrosion_rate_ss(csLoading);
                    if (ssResult !== null) rateClad = ssResult;

                } else if (cladType === "cs" && isCS) {
                    // Base=CS, Clad=CS. Same rate.
                    rateClad = rateBM;
                } else if (cladType === "ss" && isSS) {
                    // Base=SS, Clad=SS. Same rate.
                    rateClad = rateBM;
                } else {
                    // Other cases (e.g. Base=SS, Clad=CS -> Can't calc CS without extra inputs)
                    // Or Clad = Other
                    rateClad = 0; // Default safe assumption or 0 corrosion
                }
            }

            // --- SAVE & DISPLAY ---
            if (bmCalced) {
                const unitKey = get_unit_key();
                const unit = unitKey === "temperature_in_f" ? "mpy" : "mm/yr";

                // Save keys
                sessionStorage.setItem("corrosion_rate", rateBM.toFixed(2)); // Legacy
                sessionStorage.setItem("corrosion_rate_bm", rateBM.toFixed(2));

                if (hasCladding) {
                    sessionStorage.setItem("corrosion_rate_cladding", rateClad.toFixed(2));
                    corrosionRateDisplay.innerHTML = `Base Rate: ${rateBM.toFixed(2)} ${unit}<br>Cladding Rate: ${rateClad.toFixed(2)} ${unit}`;
                } else {
                    sessionStorage.removeItem("corrosion_rate_cladding");
                    corrosionRateDisplay.innerHTML = `Estimated Corrosion Rate: ${rateBM.toFixed(2)} ${unit}`;
                }

                corrosionRateDisplay.classList.remove("hidden");
            }

        } catch (error) {
            console.error("Calculation error:", error);
            display_errors([`Error: ${error.message}`]);
        }
    });

    // Event listener for specialist corrosion rate save button
    const saveSpecialistRateButton = document.getElementById("save_specialist_rate");
    const specialistRateInput = document.getElementById("specialist_corrosion_rate");
    const specialistRateSavedMessage = document.getElementById("specialist_rate_saved");

    if (saveSpecialistRateButton) {
        saveSpecialistRateButton.addEventListener("click", () => {
            const specialistRate = parseFloat(specialistRateInput.value);

            if (!specialistRate || isNaN(specialistRate)) {
                display_errors(["Please enter a valid corrosion rate."]);
                specialistRateSavedMessage.classList.add("hidden");
                return;
            }

            if (specialistRate <= 0) {
                display_errors(["Corrosion rate must be greater than 0."]);
                specialistRateSavedMessage.classList.add("hidden");
                return;
            }

            // Clear any previous errors
            display_errors([]);

            // Save to sessionStorage
            sessionStorage.setItem("corrosion_rate", specialistRate);
            sessionStorage.setItem("corrosion_rate_bm", specialistRate);
            if (hasCladding) sessionStorage.setItem("corrosion_rate_cladding", 0); // Specialist rate usually for base

            // Show success message
            const unitKey = get_unit_key();
            const unit = unitKey === "temperature_in_f" ? "mpy" : "mm/yr";
            specialistRateSavedMessage.textContent = `Corrosion rate saved successfully: ${specialistRate} ${unit}`;
            specialistRateSavedMessage.classList.remove("hidden");
        });
    }

    // Initial State
    updateVisibility();
}
