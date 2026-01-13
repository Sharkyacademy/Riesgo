/**
 * This file contains the calculations and functions necessary to make step 2 work correctly.
 */

/**
 * This function provides functionality to the dropdown, as well as allowing calls to the URLs defined in the views.py file to obtain the different templates for the available options
 */

import { hci_corrosion_calc } from "./modules-step2/hci_corrosion_calcs.js";
import { ht_sna_corrosion_calc } from "./modules-step2/ht_sna_corrosion_calcs.js";
import { ht_h2sh2_corrosion_calc } from "./modules-step2/ht_h2sh2_corrosion_calcs.js";
import { sa_corrosion_calc } from "./modules-step2/sa_corrosion_calcs.js";
import { hf_corrosion_calc } from "./modules-step2/hf_corrosion_calcs.js";
import { alkaline_sw_corrosion_calc } from "./modules-step2/alkaline_sw_corrosion_calcs.js";
import { amine_corrosion_calc } from "./modules-step2/amine_corrosion_calcs.js";
import { ht_oxidation_calc } from "./modules-step2/ht_oxidation_calcs.js";
import { acid_sw_corrosion_calc } from "./modules-step2/acid_sw_corrosion_calcs.js";
import { soil_side_corrosion_calc } from "./modules-step2/soil_side_corrosion_calcs.js";
import { co2_corrosion_calc } from "./modules-step2/co2_corrosion_calcs.js";

// URL TO GET THE JSON WITH THE TABLE
export const tables_data =
{
    table_2b22: '/static/formula_app/data/json/table_2-B-2-2.JSON',
    table_2b23: '/static/formula_app/data/json/table_2-B-2-3.JSON',
    table_2b24: '/static/formula_app/data/json/table_2b24.JSON',
    table_2b25: '/static/formula_app/data/json/table_2b25.JSON',
    table_2b26: '/static/formula_app/data/json/table_2b26.JSON',
    table_2b102: '/static/formula_app/data/json/acid_sw_corrosion/table_2b102.JSON',
    table_2b103: '/static/formula_app/data/json/acid_sw_corrosion/table_2b103.JSON'
}


// LOAD THE JSON FILES TO USE THEM TROUGHT THE STEP
class TableLoader {
    constructor() {
        this.tables = {
            ci_conc_table: null,
            ci_conc_table_2b23: null,
            ci_conc_table_2b24: null,
            ci_conc_table_2b25: null,
            ci_conc_table_2b26: null,
            table_2b102: null,
            table_2b103: null
        }
    }

    async loadAll() {
        try {

            const [table1, table2, table3, table4, table5, table6, table7] = await Promise.all([
                fetch(tables_data.table_2b22).then(r => r.json()),
                fetch(tables_data.table_2b23).then(r => r.json()),
                fetch(tables_data.table_2b24).then(r => r.json()),
                fetch(tables_data.table_2b25).then(r => r.json()),
                fetch(tables_data.table_2b26).then(r => r.json()),
                fetch(tables_data.table_2b102).then(r => r.json()),
                fetch(tables_data.table_2b103).then(r => r.json())
            ])

            this.tables.ci_conc_table = table1;
            this.tables.ci_conc_table_2b23 = table2;
            this.tables.ci_conc_table_2b24 = table3;
            this.tables.ci_conc_table_2b25 = table4;
            this.tables.ci_conc_table_2b26 = table5;
            this.tables.table_2b102 = table6;
            this.tables.table_2b103 = table7;

        } catch (error) {
            console.error(`failed to load the tables. Error: ${error}`);
            throw error;
        }
    }

    getTables() {
        return this.tables;
    }
}

const table_loader = new TableLoader();
await table_loader.loadAll();

// export the tables for the modules to use it.s
export const tables = table_loader.getTables();

/**
 * THIS BLOCK OF CODE GETS THE OPTION SELECTED AND GETS THE HTML TO DISPLAY IT.
 */
var selected_option;
document.addEventListener("click", (e) => {
    const item = e.target.closest(".list-row");
    if (item) {
        selected_option = item.dataset.value.toLowerCase();
        sessionStorage.setItem("selected_mechanism", selected_option);

        const snippetBase = window.djangoUrls ? window.djangoUrls.loadSnippet : 'load-cr-snippet/';
        fetch(`${snippetBase}${selected_option}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error en la respuesta");
                }
                return response.text();
            })
            .then(data => {
                var content_container = document.getElementById("content_container");
                content_container.classList.remove("hidden");
                content_container.innerHTML = data;

                switch (selected_option) {
                    case "hci_corrosion":
                        hci_corrosion_calc();
                        break;
                    case "ht_sna_corrosion":
                        ht_sna_corrosion_calc();
                        break;
                    case "ht_h2sh2_corrosion":
                        ht_h2sh2_corrosion_calc();
                        break;
                    case "sa_corrosion":
                        sa_corrosion_calc();
                        break;
                    case "hf_corrosion":
                        hf_corrosion_calc();
                        break;
                    case "alkaline_sw_corrosion":
                        alkaline_sw_corrosion_calc();
                        break;
                    case "amine_corrosion":
                        amine_corrosion_calc();
                        break;
                    case "ht_oxidation":
                        ht_oxidation_calc();
                        break;
                    case "acid_sw_corrosion":
                        acid_sw_corrosion_calc();
                        break;
                    case "soil_side_corrosion":
                        soil_side_corrosion_calc();
                        break;
                    case "co2_corrosion":
                        co2_corrosion_calc();
                        break;
                    default:
                        break;
                }

            })

    }
}); 
