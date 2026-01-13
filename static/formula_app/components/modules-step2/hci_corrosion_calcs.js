/**
 * THE FOLLOWING CODE WILL HANDLE THE NECESSARY CALCULATIONS TO OBTAIN THE RESULT 
 * OF THE CORROSION RATE WHEN THE AMBIENT IS HCI.
 */

// import the tables for the api 581 document.
import { tables } from "../step2_calcs.js";

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

export function hci_corrosion_calc() {
    const { ci_conc_table } = tables;

    const select = document.getElementById("cs_300_series");
    const ph_known_container = document.getElementById("ph_known_container");
    const ph_known = document.getElementById("ph_known");
    const ci_calc_container = document.getElementById("ci_concentration_container");
    const ci_concentration_acidicwater_container = document.getElementById("ci_concentration_acidicwater_container");
    const ci_conc_acidicwater = document.getElementById("ci_conc_acidicwater");
    const ph_acidicwater_container = document.getElementById("ph_acidicwater_container");
    const cr_carbonSteel_300series_container = document.getElementById("cr_carbonSteel_300series");
    const ph_input_tab2b24 = document.getElementById("ph_input_tab2b24");

    let avg_cl_concentration;

    select.addEventListener("change", function () {
        const op = this.value;
        if (op == "yes") {

            ci_concentration_acidicwater_container.classList.add("hidden");
            ph_acidicwater_container.classList.add("hidden");
            document.getElementById("material_container").classList.add("hidden");
            document.getElementById("data_table2b26").classList.add("hidden");
            document.getElementById("data_table2b25").classList.add("hidden");

            // Show Cladding Type Check if Cladding is present
            let hasCladding = false;
            try {
                const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
                if (t41 && t41.has_cladding === "yes") hasCladding = true;
            } catch (e) { }

            const cladContainer = document.getElementById("cladding_type_container");
            if (hasCladding && cladContainer) {
                cladContainer.classList.remove("hidden");
            }


            ph_known_container.classList.remove("hidden");
            ph_known.addEventListener("change", function () {
                const op = this.value;
                ci_calc_container.classList.add("hidden");
                if (op == "no") {
                    ci_calc_container.classList.remove("hidden");
                    cr_carbonSteel_300series_container.classList.add("hidden");
                    ph_input_tab2b24.classList.add("hidden");
                } else {

                    const { ci_conc_table_2b23, ci_conc_table_2b24 } = tables;

                    ci_calc_container.classList.add("hidden");
                    ph_input_tab2b24.classList.remove("hidden");
                    document.getElementById("ph_input_submit_tab2b24").addEventListener("click", function () {

                        cr_carbonSteel_300series_container.classList.remove("hidden");
                        const material_selected_value = document.getElementById("material_selected_cs_300series");

                        const input_validation = document.getElementById("ph_input_tab2b24_value");
                        const message_error = document.getElementById("message_error_ph_input_tab2b24");

                        // validations

                        if (input_validation.value.trim() == "") {
                            input_validation.classList.add("border", "border-red-500");
                            message_error.classList.remove("hidden");
                            message_error.textContent = `The input field cannot be empty.`;
                            return;
                        }

                        input_validation.classList.remove("border", "border-red-500");
                        message_error.classList.add("hidden");


                        material_selected_value.addEventListener("change", function () {
                            const op = this.value;
                            switch (op) {
                                case "CARBON STEEL":
                                    calculate_corrosion_rate_tab2b23_2b24(ci_conc_table_2b23, input_validation.value);
                                    break;
                                case "300 SERIES":
                                    calculate_corrosion_rate_tab2b23_2b24(ci_conc_table_2b24, input_validation.value);
                                    break;
                                default:
                                    break;
                            }
                        })


                    })
                }
            })

        } else {
            cr_carbonSteel_300series_container.classList.add("hidden");
            ph_known_container.classList.add("hidden");
            ci_calc_container.classList.add("hidden");
            ph_input_tab2b24.classList.add("hidden");

            ci_concentration_acidicwater_container.classList.remove("hidden");

            ci_conc_acidicwater.addEventListener("change", function () {

                document.getElementById("material_container").classList.add("hidden");

                if (ci_conc_acidicwater.value == "no") {
                    ph_acidicwater_container.classList.remove("hidden");
                    document.getElementById("cl_acidicwater_calc").addEventListener("click", function () {

                        const input_validation = document.getElementById("ph_acidicwater");
                        const message_error = document.getElementById("message_error_phacidicwater");

                        if (input_validation.value.trim() == "") {
                            input_validation.classList.add("border", "border-red-500");
                            message_error.classList.remove("hidden");
                            message_error.textContent = `The input field cannot be empty.`;
                            return
                        }

                        input_validation.classList.remove("border", "border-red-500");
                        message_error.classList.add("hidden");

                        avg_cl_concentration = calculate_cl_from_ph(tables);
                        const material_container = document.getElementById("material_container");
                        material_container.classList.remove("hidden");
                    })

                } else {
                    ph_acidicwater_container.classList.add("hidden");
                    document.getElementById("material_container").classList.remove("hidden");
                }

            })

        }
    });

    const material = document.getElementById("material");
    const data_table2b26 = document.getElementById("data_table2b26");
    const data_table2b25 = document.getElementById("data_table2b25");

    material.addEventListener("change", function () {
        const cl_acidicwater_info = document.getElementById("cl_acidicwater_info");
        switch (material.value) {
            case "yes":
                data_table2b26.classList.remove("hidden");
                data_table2b25.classList.add("hidden");

                cl_acidicwater_info.classList.remove("hidden");
                cl_acidicwater_info.textContent = `The average of the range obtained from table 2b22 was calculated to relate the data to those presented in table 2b25. The average result is ${avg_cl_concentration}`;

                operations_crrate_tab2b26(avg_cl_concentration, tables);

                break;
            case "no":
                data_table2b25.classList.remove("hidden");
                data_table2b26.classList.add("hidden");

                cl_acidicwater_info.classList.remove("hidden");
                cl_acidicwater_info.textContent = `The average of the range obtained from table 2b22 was calculated to relate the data to those presented in table 2b25. The average result is ${avg_cl_concentration}`;

                operations_crrate_tab2b25(avg_cl_concentration, tables);

                break;
            default:
                break;
        }
    });


    // GET THE TABLE FROM THE GLOBAL VARIABLE AND OPERATE WITH THE DATA AND
    // THE USER INPUT TO GET THE COMPONENT'S PH. (PH UNKNWN)

    document.getElementById("ph_calc_1").addEventListener("click", function () {

        // get the value inputted by the user (cl_concentration in wppm)
        const cl_concentration = document.getElementById("ci_concentration");
        const cl_concentration_value = cl_concentration.value;
        const ph_calculated_container = document.getElementById("ph_calculated");
        const cr_carbonSteel_300series_container = document.getElementById("cr_carbonSteel_300series");
        const cr_carbonSteel_300series_value = document.getElementById("material_selected_cs_300series");

        const { ci_conc_table, ci_conc_table_2b23, ci_conc_table_2b24 } = tables;

        // validations  
        if (cl_concentration_value == "") {
            cl_concentration.classList.add("border", "border-red-500");
            ph_calculated_container.classList.remove("hidden");
            ph_calculated_container.textContent = `The input field cannot be empty.`;
            return
        }

        if (cl_concentration_value > 12000) {
            cl_concentration.classList.add("border", "border-red-500");
            ph_calculated_container.classList.remove("hidden");
            ph_calculated_container.textContent = `The input field cannot be greater than 12000.`;
            return
        }

        cl_concentration.classList.remove("border", "border-red-500");
        ph_calculated_container.classList.add("hidden");

        if (cl_concentration_value < 1) {
            ph_calculated_container.classList.remove("hidden");
            ph_calculated_container.textContent = `Estimated pH value calculated from the table 2b22 = 5.0`;
            return;
        }

        // get the value inputted by the user (cl concentration) and get the ph from the table 2b22

        let ph_value = null;

        for (let i = 0; i < ci_conc_table.ci_concentration.length; ++i) {

            const range = ci_conc_table.ci_concentration[i];

            // Check if the value is within the range
            if (cl_concentration_value >= range[0] && cl_concentration_value <= range[1]) {
                ph_value = ci_conc_table.ph[i];
                break;
            }
        }

        cr_carbonSteel_300series_container.classList.add("hidden");

        // Display the result
        if (ph_value !== null) {
            ph_calculated_container.classList.remove("hidden");
            ph_calculated_container.textContent = `Estimated pH value calculated from the table 2b22 = ${ph_value}`;

            cr_carbonSteel_300series_container.classList.remove("hidden");

            cr_carbonSteel_300series_value.addEventListener("change", function () {
                const op = this.value;

                switch (op) {
                    case "CARBON STEEL":
                        calculate_corrosion_rate_tab2b23_2b24(ci_conc_table_2b23, ph_value);
                        break;
                    case "300 SERIES":
                        calculate_corrosion_rate_tab2b23_2b24(ci_conc_table_2b24, ph_value);
                        break;
                    default:
                        break;
                }
            })

        } else {
            ph_calculated_container.classList.remove("hidden");
            ph_calculated_container.textContent = `No pH value found for the given Cl concentration.`;
        }

    })

}

function calculate_corrosion_rate_tab2b23_2b24(table, ph_value) {

    const { ci_conc_table } = tables;
    const table41 = sessionStorage.getItem("table4.1_data");
    const table41_data = table41 ? JSON.parse(table41) : { measurement_unit: "farenheit", operating_temp: 100 };

    let temperature = parseFloat(table41_data.operating_temp);
    let data;
    let interpolated_ph;

    const cr_container = document.getElementById("estimated_cr_tab2b23_tab2b24");

    // For these tables (2b23/2b24), Structure is:
    // "temperature in f°": { "0.5": { "100": rate, "125": rate, ...} ... }
    // Or "temperature in f°": { "ph": { "temp": rate } }
    // Based on previous code: data = table["temperature in f°"]
    // Then ph_data = data[ph.toString()]
    // Then corrosion_rate = ph_data[temperature.toString()]
    // This implies { "PH_VAL": { "TEMP_VAL": RATE } }

    switch (table41_data.measurement_unit) {
        case "farenheit":
            data = table["temperature in f°"];
            break;
        case "celsius":
            data = table["temperature in c°"];
            break;
        default:
            data = table["temperature in f°"];
            break;
    }

    // get the interpolate value of the ph
    interpolated_ph = interpolate_ph(ph_value);

    const ph_data = data[interpolated_ph.toString()];

    if (ph_data) {
        // ph_data is { "200": 5, "100": 2 ... }
        // Extract points
        const points = Object.entries(ph_data).map(([t, r]) => [parseFloat(t), parseFloat(r)]).sort((a, b) => a[0] - b[0]);

        let corrosion_rate = interpolate(temperature, points);

        // Range checks
        const minTemp = points[0][0];
        const maxTemp = points[points.length - 1][0];
        let warningMsg = "";

        if (temperature < minTemp) {
            warningMsg = `(Temp < Min: Extrapolated)`;
            corrosion_rate = Math.max(0, corrosion_rate);
        } else if (temperature > maxTemp) {
            warningMsg = `(Temp > Max: Clamped)`;
            corrosion_rate = points[points.length - 1][1];
        } else {
            corrosion_rate = Math.max(0, corrosion_rate);
        }

        // Dual Calculation & Save Logic
        const corrosion_rate_bm = corrosion_rate;
        let corrosion_rate_clad = 0;

        // Check for Cladding
        let hasCladding = false;
        let cladType = "";
        try {
            const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
            if (t41 && t41.has_cladding === "yes") {
                hasCladding = true;
                cladType = document.getElementById("cladding_material_type").value;
            }
        } catch (e) { }

        const { ci_conc_table_2b23, ci_conc_table_2b24 } = tables;

        if (hasCladding) {
            if (cladType === "ss") {
                // Calculate using 2b24 (SS table) with same pH and Temp
                // Re-run interpolation logic for SS table
                // We can extract logic to function or just duplicate specific part for simplicity here as tables differ slightly?
                // Actually reusing logic requires the table data structure to be identical.
                // 2b23 and 2b24 structure is identical.

                // Helper to get rate from table
                function getRateFromTable(targetTable, t, ph) {
                    let tKey = (table41_data.measurement_unit === "celsius") ? "temperature in c°" : "temperature in f°";
                    let d = targetTable[tKey];
                    // Interpolate pH
                    let iph = interpolate_ph(ph);
                    let pd = d[iph.toString()];
                    if (!pd) return 0;
                    let pts = Object.entries(pd).map(([tm, r]) => [parseFloat(tm), parseFloat(r)]).sort((a, b) => a[0] - b[0]);
                    let r = interpolate(t, pts);
                    return Math.max(0, r);
                }

                corrosion_rate_clad = getRateFromTable(ci_conc_table_2b24, temperature, ph_value);

            } else if (cladType === "cs") {
                corrosion_rate_clad = corrosion_rate_bm; // Same as base
            }
            // else 0
        }

        const unit = table41_data.measurement_unit === "farenheit" ? "mpy" : "mm/year";
        const rateRounded = corrosion_rate_bm.toFixed(2);
        const cladRounded = corrosion_rate_clad.toFixed(2);

        cr_container.classList.remove("hidden");
        let resultHTML = `Estimated Base Rate: ${rateRounded} ${unit} <br> <span class="text-sm text-yellow-600">${warningMsg}</span>`;

        if (hasCladding) {
            resultHTML += `<br>Estimated Cladding Rate: ${cladRounded} ${unit}`;
        }

        cr_container.innerHTML = resultHTML;

        saveRates(rateRounded, cladRounded);
    } else {
        cr_container.classList.remove("hidden");
        cr_container.textContent = `No corrosion rate found for the given Cl concentration.`;
    }

}

// Function responsible for converting the Cl concentration value from wppm to wt% and then applying interpolation to relate the obtained value with that of Table 2b25
function operations_crrate_tab2b25(avg_cl_concentration, tables) {

    // Get the user input to corrosion rate

    // Get the alloy selected by the user
    const alloy_select = document.getElementById("material_selected_tab2b25");

    // Get the table 4.1 for session storage and get the operating temperatura value
    const table_data_str = sessionStorage.getItem("table4.1_data");
    const table_data = table_data_str ? JSON.parse(table_data_str) : { measurement_unit: "farenheit", operating_temp: 100 };

    // already have the cl_concentration average value.

    // now interpolate the cl_concentration value with the function:
    let interpolated_clvalue = interpolate_cl_concentration(avg_cl_concentration);

    let measurement_unit = table_data.measurement_unit;
    let temperature = parseFloat(table_data.operating_temp);

    alloy_select.addEventListener("change", function () {

        // call the function to determine the cr of the component and store it in session storage variable
        let result = calc_corrosion_rate_tab2b25(alloy_select.value, temperature, interpolated_clvalue, measurement_unit, tables);

        if (result !== null) {
            const { rate, warningMsg } = result;
            const rateRounded = rate.toFixed(2);
            sessionStorage.setItem("corrosion_rate", rateRounded);

            let cr_result_container = document.getElementById("estimated_cr_tab2b25");
            cr_result_container.classList.remove("hidden");
            cr_result_container.innerHTML = `Estimated corrosion rate for this component is: ${rateRounded} mpy <br> <span class="text-sm text-yellow-600">${warningMsg}</span>`;
        }
    })

}

function interpolate_ph(ph_value) {

    const ph_available = [0.5, 0.80, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75, 4.25, 4.75, 5.25, 5.75, 6.25, 6.80];

    // If the ph has an exact value in the table return.
    if (ph_available.includes(ph_value)) {
        return ph_value;
    }

    // If ph is less than minimun value, return the minimun value.
    if (ph_value <= ph_available[0]) {
        return ph_available[0];
    }

    // If ph is greater than maximum value, return the maximum value.
    if (ph_value >= ph_available[ph_available.length - 1]) {
        return ph_available[ph_available.length - 1];
    }

    // Interpolate the ph value.
    let lower_ph = ph_available[0];
    let upper_ph = ph_available[1];

    for (let i = 0; i < ph_available.length - 1; i++) {
        if (ph_value >= ph_available[i] && ph_value <= ph_available[i + 1]) {
            lower_ph = ph_available[i];
            upper_ph = ph_available[i + 1];
            break;
        }
    }

    // Calculate the interpolation factor
    const interpolation_factor = (ph_value - lower_ph) / (upper_ph - lower_ph);

    // Decide if to use the lower or upper value based on which is closer
    // If the factor is < 0.5, it is closer to the lower value
    if (interpolation_factor < 0.5) {
        return lower_ph;
    } else {
        return upper_ph;
    }

}

// This function gets the data in the table 2b22 and gets the cl concentration from the ph value.
function calculate_cl_from_ph(tables) {

    const { ci_conc_table } = tables;

    const ph_input = document.getElementById("ph_acidicwater");
    const cl_result_element = document.getElementById("cl_acidicwater");
    const message_error = document.getElementById("message_error");

    const ph_value = parseFloat(ph_input.value);

    // VALIDATIONS
    if (isNaN(ph_value)) {
        message_error.classList.remove("hidden");
        message_error.textContent = "El valor del ph debe ser un número válido!";
        return;
    } else {
        message_error.classList.add("hidden");
    }

    if (ph_value < 0.5 || ph_value > 5.0) {
        message_error.classList.remove("hidden");
        message_error.textContent = "El ph debe estar entre 0.5 y 5.0 según la tabla 2.B.2.2";
        return;
    }

    let cl_concentration_range = null;


    for (let i = 0; i < ci_conc_table.ph.length; ++i) {
        const table_ph = ci_conc_table.ph[i];


        if (ph_value == table_ph) {
            cl_concentration_range = ci_conc_table.ci_concentration[i];
            break;
        }

        if (i < ci_conc_table.ph.length - 1) {
            const next_ph = ci_conc_table.ph[i + 1];

            if (ph_value > table_ph && ph_value < next_ph) {
                const current_range = ci_conc_table.ci_concentration[i];
                const next_range = ci_conc_table.ci_concentration[i + 1];

                const current_mid = Array.isArray(current_range)
                    ? (current_range[0] + current_range[1]) / 2
                    : current_range;

                const next_mid = Array.isArray(next_range)
                    ? (next_range[0] + next_range[1]) / 2
                    : next_range;

                const interpolated_value = current_mid + ((ph_value - table_ph) / (next_ph - table_ph)) * (next_mid - current_mid);

                cl_concentration_range = Math.round(interpolated_value);
                break;

            }
        }
    }

    let avg_cl_concentration;

    if (cl_concentration_range !== null) {
        cl_result_element.classList.remove("hidden");

        avg_cl_concentration = (cl_concentration_range[0] + cl_concentration_range[1]) / 2;

        if (Array.isArray(cl_concentration_range)) {
            cl_result_element.textContent = `Cl concentration for ph ${ph_value}: ${cl_concentration_range[0]} - ${cl_concentration_range[1]} wppm`;
        } else {
            cl_result_element.textContent = `Cl concentration for ph: ${ph_value}: <= ${cl_concentration_range} wppm`;
        }

    } else {
        cl_result_element.classList.remove("hidden");
        cl_result_element.textContent = "The Cl⁻ concentration could not be determined for the entered pH."
    }

    return avg_cl_concentration;
}

// This function get the array and the temperature inputted by the user to round it to te nearest value
function round_nearest(array, temperature) {
    let low = 0;
    let high = array.length - 1;

    // Reduce the interval by binary search until the low value > high value
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);

        if (array[mid] == temperature) return array[mid]; // The value is in the array
        if (array[mid] < temperature) low = mid + 1; // Search in right
        else high = mid - 1; // Search in left
    }

    let min_value = array[high] ?? array[0];
    let max_value = array[low] ?? array[array.length - 1];

    return Math.abs(temperature - min_value) < Math.abs(temperature - max_value)
        ? min_value
        : max_value;

}

// This function interpolates the values inputted by the user to the ones in the table 2b25.
function interpolate_cl_concentration(avg_cl_concentration) {
    // get the values of cl concentration (wt%)
    const cl_concentration_wt = [0.50, 0.75, 1.0];

    // convert from wppm to wt%
    const conc_wt = avg_cl_concentration / 10000;

    for (let i = 0; i < cl_concentration_wt; ++i) {
        if (conc_wt == cl_concentration_wt[i]) return conc_wt;
    }

    // Binary search to get the values that surrounds the avg_cl_concentration
    let low = 0;
    let high = cl_concentration_wt.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (cl_concentration_wt[mid] < conc_wt) low = mid + 1;
        else high = mid - 1;
    }

    // manage values out of range 
    if (conc_wt <= cl_concentration_wt[0]) return cl_concentration_wt[0];
    if (conc_wt >= cl_concentration_wt[cl_concentration_wt.length - 1]) return cl_concentration_wt[cl_concentration_wt.length - 1];

    // interpolate the value to the values in the array.
    const x0 = cl_concentration_wt[high];
    const x1 = cl_concentration_wt[low];

    const t = (conc_wt - x0) / (x1 - x0);
    return x0 + t * (x1 - x0);

}

// This function calculates the corrosion rate of the component based in the data of the table 2b25 in the api581 file.
function calc_corrosion_rate_tab2b25(alloy_name, temperature, cl_concentration, measurement_unit, tables) {

    const { ci_conc_table_2b25 } = tables;

    let obt_array;

    // switch to evaluate the measurement_unit
    switch (measurement_unit) {
        case "farenheit":
            obt_array = ci_conc_table_2b25['temperature in f°'];
            break;
        case "celsius":
            obt_array = ci_conc_table_2b25['temperature in c°'];
            break;
        default:
            obt_array = ci_conc_table_2b25['temperature in f°'];
            break;
    }

    let temp_dict = null; // Map of Temp -> Rate

    for (let i = 0; i < obt_array.length; ++i) {
        // see if the alloy name is equals to material then checks the temperature to get the corrosion rate.
        if (obt_array[i].alloy == alloy_name && parseFloat(obt_array[i].cl_concentration) == parseFloat(cl_concentration)) {
            temp_dict = obt_array[i].temperature;
            break;
        }
    }

    if (!temp_dict) return null;

    // Extract points
    const points = Object.entries(temp_dict).map(([t, r]) => [parseFloat(t), parseFloat(r)]).sort((a, b) => a[0] - b[0]);

    let corrosion_rate = interpolate(temperature, points);

    // Range checks
    const minTemp = points[0][0];
    const maxTemp = points[points.length - 1][0];
    let warningMsg = "";

    if (temperature < minTemp) {
        warningMsg = `(Temp < Min: Extrapolated)`;
        corrosion_rate = Math.max(0, corrosion_rate);
    } else if (temperature > maxTemp) {
        warningMsg = `(Temp > Max: Clamped)`;
        corrosion_rate = points[points.length - 1][1];
    } else {
        corrosion_rate = Math.max(0, corrosion_rate);
    }

    return { rate: corrosion_rate, warningMsg };
}

// Function responsible for do all the operations related to get the corrosion rate of the component using the table 2b26
function operations_crrate_tab2b26(avg_cl_concentration, tables) {
    // get the user inputs
    const alloy = document.getElementById("material_selected_tab2b26");
    const ox_od_present = document.getElementById("ox_od_present");

    //interpolate the avg_cl_concentration value
    let cl_concentration = interpolate_cl_concentration(avg_cl_concentration);

    // function to get the values of the inputs
    function process_values() {

        let corrosion_rate_container = document.getElementById("corrosion_rate_result_tab2b26");
        corrosion_rate_container.classList.add("hidden");

        const alloy_value = alloy.value;
        const ox_od_present_value = ox_od_present.value;

        if (alloy_value && ox_od_present_value) {
            // call the function to calc the corrosion rate and keep it in the sessionStorage
            let result = calc_corrosion_rate_tab2b26(alloy_value, cl_concentration, ox_od_present_value, tables);

            if (result !== null) {
                const { rate, warningMsg } = result;
                const rateRounded = rate.toFixed(2);

                // Generic Saving for Alloy path (No Cladding Support explicitly yet or assume 0)
                saveRates(rateRounded, 0);

                // show the result
                corrosion_rate_container.classList.remove("hidden");
                corrosion_rate_container.innerHTML = `Estimated corrosion rate for this component is: ${rateRounded} mpy <br> <span class="text-sm text-yellow-600">${warningMsg}</span>`;
            }

        }

    }

    alloy.addEventListener("change", process_values);
    ox_od_present.addEventListener("change", process_values);
}

// Function to get the corrosion rate using the table 2b26
function calc_corrosion_rate_tab2b26(alloy_name, cl_concentration, ox_od_present, tables) {
    // get the table 2b26 for the step2_calcs.js file and the table 4.1 to get the temperature value
    const { ci_conc_table_2b26 } = tables;

    // code to handle the temperature value. Get the value from the sessionStorage table4.1 and round it.
    let table41_string = sessionStorage.getItem("table4.1_data");
    let table41 = table41_string ? JSON.parse(table41_string) : { measurement_unit: "farenheit", operating_temp: 100 };
    const measurement_unit = table41.measurement_unit;

    let temperature_value = parseFloat(table41["operating_temp"]);

    // Get the array depending on the temperature
    let operation_array;

    switch (measurement_unit) {
        case "farenheit":
            operation_array = ci_conc_table_2b26["temperature in f°"];
            break;
        case "celsius":
            operation_array = ci_conc_table_2b26["temperature in c°"];
            break;
        default:
            operation_array = ci_conc_table_2b26["temperature in f°"];
            break;
    }

    let temp_dict;

    for (let i = 0; i < operation_array.length; ++i) {
        let actual_position = operation_array[i];
        if (actual_position.alloy == alloy_name) {
            temp_dict = actual_position.temperature;
            break;
        }
    }

    if (!temp_dict) return null;

    // Structure of temp_dict in 2b26:
    // { "100": {"oxygen": 5, "no_oxygen": 2}, "125": ... }

    // Extract points based on oxygen selection
    const points = [];
    Object.entries(temp_dict).forEach(([t, val]) => {
        // val is {oxygen: X, no_oxygen: Y}
        let rate;
        switch (ox_od_present) {
            case "yes":
                rate = val["oxygen"];
                break;
            case "no":
                rate = val["no_oxygen"];
                break;
        }
        if (rate !== undefined) {
            points.push([parseFloat(t), parseFloat(rate)]);
        }
    });

    points.sort((a, b) => a[0] - b[0]);
    if (points.length === 0) return null;

    let corrosion_rate = interpolate(temperature_value, points);

    // Range checks
    const minTemp = points[0][0];
    const maxTemp = points[points.length - 1][0];
    let warningMsg = "";

    if (temperature_value < minTemp) {
        warningMsg = `(Temp < Min: Extrapolated)`;
        corrosion_rate = Math.max(0, corrosion_rate);
    } else if (temperature_value > maxTemp) {
        warningMsg = `(Temp > Max: Clamped)`;
        corrosion_rate = points[points.length - 1][1];
    } else {
        corrosion_rate = Math.max(0, corrosion_rate);
    }

    return { rate: corrosion_rate, warningMsg };
}

// Helper to save rates
function saveRates(bmRate, cmRate) {
    sessionStorage.setItem("corrosion_rate", bmRate);
    sessionStorage.setItem("corrosion_rate_bm", bmRate);

    // Check hasCladding again in case called from outside context (inefficient but safe)
    let hasCladding = false;
    try {
        const t41 = JSON.parse(sessionStorage.getItem("table4.1_data"));
        if (t41 && t41.has_cladding === "yes") hasCladding = true;
    } catch (e) { }

    if (hasCladding) {
        sessionStorage.setItem("corrosion_rate_cladding", cmRate);
    } else {
        sessionStorage.removeItem("corrosion_rate_cladding");
    }

    // Trigger validation to enable Next button
    if (typeof window.updateNextButtonState === 'function') {
        window.updateNextButtonState();
    }
}
