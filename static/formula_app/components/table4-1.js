
var table_data;

// validate table fields and save it in a dict
document.getElementById("btn_table4.1").addEventListener("click", () => {

    //
    const requiredFields = document.getElementById("table4.1_data").querySelectorAll('input[required], select[required]');

    for (let field of requiredFields) {

        if (!field.value || field.value === "") {
            field.reportValidity();
            alert("Please fill in: " + (field.name || field.id)); // Fallback alert
            return;
        }
    }

    // Validate dates
    const startDateVal = document.getElementById('start_date').value;
    const linerDateVal = document.getElementById('internal_liner_input').value;

    // Normalize today to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateVal) {
        const [y, m, d] = startDateVal.split('-').map(Number);
        const startDate = new Date(y, m - 1, d);
        if (startDate > today) {
            alert("Start Date cannot be in the future.");
            return;
        }
    }

    if (linerDateVal) {
        const [y, m, d] = linerDateVal.split('-').map(Number);
        const linerDate = new Date(y, m - 1, d);
        if (linerDate > today) {
            alert("Internal Liner Date cannot be in the future.");
            return;
        }
    }

    // Dict with all the data table and we use sessionStorage to keep these values and use them later in other scripts.
    table_data =
    {
        start_date: document.getElementById('start_date').value,
        thickness: parseFloat(document.getElementById('thickness').value),
        measurement_unit: document.getElementById('measurement_unit').value,
        corrosion_allow: parseFloat(document.getElementById('corrosion_allowance').value),
        design_temp: parseFloat(document.getElementById('design_temperature').value),
        design_press: parseFloat(document.getElementById('design_pressure').value),
        operating_temp: parseFloat(document.getElementById('operating_temperature').value),
        operating_press: parseFloat(document.getElementById('operating_pressure').value),
        design_code: document.getElementById('design_code').value,
        equip_type: document.getElementById('equipment').value,
        comp_type: document.getElementById('component').value,
        has_cladding: document.getElementById('has_cladding').value,
        cladding: document.getElementById('cladding_input').value,
        has_internal_liner: document.getElementById('has_internal_liner').value,
        internal_liner: document.getElementById('internal_liner_input').value,
        comp_geom_data: document.getElementById('component_geometry_data').value,
        material_especification: document.getElementById('material_especification').value,
        yield_strength: parseFloat(document.getElementById('yield_strength').value),
        tensile_strength: parseFloat(document.getElementById('tensile_strength').value),
        weld_joint_efficiency: parseFloat(document.getElementById('weld_joint_efficiency').value),
        heat_tracing: document.getElementById('heat_tracing').value,
    }

    const result_JSON = JSON.stringify(table_data);

    console.log("todo correcto");
    sessionStorage.setItem('table4.1_data', result_JSON);
    step1_calculations();
    document.getElementById("table4.1_confirmation").classList.remove("hidden");

    // Enable Next Button
    if (typeof window.updateNextButtonState === 'function') {
        window.updateNextButtonState();
    }
});

window.loadComponents = undefined;

async function loadTable41() {
    const dataString = sessionStorage.getItem('table4.1_data');
    if (!dataString) return;

    const table_data = JSON.parse(dataString);

    document.getElementById('start_date').value = table_data.start_date;
    document.getElementById('thickness').value = table_data.thickness;
    document.getElementById('measurement_unit').value = table_data.measurement_unit;
    document.getElementById('corrosion_allowance').value = table_data.corrosion_allow;
    document.getElementById('design_temperature').value = table_data.design_temp;
    document.getElementById('design_pressure').value = table_data.design_press;
    document.getElementById('operating_temperature').value = table_data.operating_temp;
    document.getElementById('operating_pressure').value = table_data.operating_press;
    document.getElementById('design_code').value = table_data.design_code;
    document.getElementById('has_cladding').value = table_data.has_cladding;
    document.getElementById('cladding_input').value = table_data.cladding;
    document.getElementById('has_internal_liner').value = table_data.has_internal_liner;
    document.getElementById('internal_liner_input').value = table_data.internal_liner;
    document.getElementById('component_geometry_data').value = table_data.comp_geom_data;
    document.getElementById('material_especification').value = table_data.material_especification;
    document.getElementById('yield_strength').value = table_data.yield_strength;
    document.getElementById('tensile_strength').value = table_data.tensile_strength;
    document.getElementById('weld_joint_efficiency').value = table_data.weld_joint_efficiency;
    document.getElementById('heat_tracing').value = table_data.heat_tracing;

    // Trigger Toggle Logic explicitly
    document.getElementById('has_cladding').dispatchEvent(new Event('change'));
    document.getElementById('has_internal_liner').dispatchEvent(new Event('change'));

    document.getElementById('equipment').value = table_data.equip_type;

    if (table_data.equip_type && typeof window.loadComponents === 'function') {
        // loadComponents is async (waits for JSON fetch)
        await window.loadComponents(table_data.equip_type);
    }

    // Set Component Value
    const compSelect = document.getElementById('component');
    compSelect.value = table_data.comp_type;

    // Trigger Geometry Load
    if (typeof window.updateGeometryOptions === 'function') {
        // updateGeometryOptions checks t42Data presence internally.
        // It should be populated now because loadComponents waited for data.
        window.updateGeometryOptions();
    }

    // Set Geometry Value - robust retry logic
    if (table_data.comp_geom_data) {
        let attempts = 0;
        const maxAttempts = 10;
        
        const setGeom = setInterval(() => {
            const geomSelect = document.getElementById('component_geometry_data');
            
            // Check if options are populated (more than just the placeholder)
            if(geomSelect && geomSelect.options.length > 1) {
                geomSelect.value = table_data.comp_geom_data;
                
                if(geomSelect.value === table_data.comp_geom_data) {
                    // Success
                    console.log("Geometry restored successfully:", table_data.comp_geom_data);
                    clearInterval(setGeom);
                }
            }
            
            attempts++;
            if(attempts >= maxAttempts) {
                console.warn("Failed to restore component_geometry_data after multiple attempts:", table_data.comp_geom_data);
                clearInterval(setGeom);
            }
        }, 100);
    }

    // Restore Cladding/Liner Rows (Explicit check)
    // setupToggle is run at end of file. It runs BEFORE or AFTER initializeStep1?
    // initializeStep1 is delayed by polling/DOMReady. setupToggle runs immediately script loads.
    // So listeners are ready. dispatch should work.

    // Trigger Toggle Logic explicitly
    // Move this down to ensure values are set? 
    // They are set above.
    
    // Restore Results Message

    // Restore Cladding/Liner Rows (Explicit check)
    // Sometimes dispatchEvent isn't enough if listeners are not creating? 
    // But polling ensures listeners... wait. 
    // setupToggle is run at end of file. It runs BEFORE or AFTER initializeStep1?
    // initializeStep1 is delayed by polling/DOMReady. setupToggle runs immediately script loads.
    // So listeners are ready. dispatch should work.

    // Restore Results Message
    console.log("Restoring Step 1 Results...");
    if (typeof step1_calculations === 'function') {
        step1_calculations();
    } else {
        console.warn("step1_calculations function not found.");
    }

    console.log("Table 4.1 Data Restored Successfully.");
}

// Delete the sessionStorage data when the log_out button is clicked
var log_out_btn = document.getElementById("logout_btn");
if (log_out_btn) {
    log_out_btn.addEventListener("click", function () {
        sessionStorage.clear();
    });
}

// Helper to setup toggle logic
function setupToggle(selectId, rowId, inputId) {
    const select = document.getElementById(selectId);
    const row = document.getElementById(rowId);
    const input = document.getElementById(inputId);

    if (select && row && input) {
        const toggle = () => {
            if (select.value === 'yes') { // Case sensitive 'yes' matches HTML value
                row.classList.remove('hidden');
                input.setAttribute('required', 'true');
            } else {
                row.classList.add('hidden');
                input.removeAttribute('required');
                input.value = ''; // Clean up
            }
        };
        select.addEventListener('change', toggle);
        // Run once
        toggle();
    }
}

// Initialize triggers
setupToggle('has_internal_liner', 'internal_liner_row', 'internal_liner_input');
setupToggle('has_cladding', 'cladding_row', 'cladding_input');

// Polling to ensure dependencies from step1_geom_loader.js are ready
if (typeof window.step1Retries === 'undefined') {
    window.step1Retries = 0;
}

function initializeStep1() {
    // Check if dependent functions are defined
    if (typeof window.loadComponents === 'function' && typeof window.updateGeometryOptions === 'function') {
        loadTable41();
    } else {
        window.step1Retries++;
        if (window.step1Retries < 200) { // Max wait ~10 seconds
            setTimeout(initializeStep1, 50);
        } else {
            console.error("Timeout: Step 1 dependencies (loadComponents) failed to load.");
            // Try loading anyway as last resort? No, it would crash.
        }
    }
}

// Call on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStep1);
} else {
    initializeStep1();
}

