
// Logic to populate Component Geometry Data in Table 4.1 (Step 1)
// Globals defined IMMEDIATELY to avoid race conditions with table4-1.js

// --- Global Data Holders ---
let t42Data = null;
let t43Data = null;

let dataResolve;
const dataReady = new Promise(resolve => dataResolve = resolve);

// --- Start Data Fetch Immediately ---
Promise.all([
    fetch('/static/formula_app/data/json/step4/table42.JSON').then(r => r.json()),
    fetch('/static/formula_app/data/json/step4/table43.JSON').then(r => r.json())
]).then(([t42, t43]) => {
    t42Data = t42;
    t43Data = t43;
    console.log("DEBUG: Geometry JSONs loaded successfully");
    if (dataResolve) dataResolve(); // Signal valid data
}).catch(err => {
    console.error("Failed to load geometry data", err);
});


// --- Define Global Functions IMMEDIATELY ---

window.updateGeometryOptions = function() {
    console.log("DEBUG: updateGeometryOptions called");
    
    const equipSelect = document.getElementById("equipment");
    const compSelect = document.getElementById("component");
    const geomDataSelect = document.getElementById("component_geometry_data");

    if (!equipSelect || !compSelect || !geomDataSelect) {
        console.warn("DEBUG: DOM elements missing in updateGeometryOptions");
        return;
    }

    // Wait for data? access global vars directly.
    if (!t42Data || !t43Data) {
        console.warn("DEBUG: Data t42 or t43 not loaded yet during updateGeometryOptions call");
        return;
    }

    // Clear current
    geomDataSelect.innerHTML = '<option value="" disabled selected>Select geometry</option>';

    const equipId = parseInt(equipSelect.value);
    const compId = compSelect.value; 

    console.log("DEBUG: equipId", equipId, "compId", compId);

    if (isNaN(equipId) || !compId) {
        console.log("DEBUG: Missing equipId or compId. Abort.");
        return;
    }

    // Map ID to Name logic 
    let targetEquipName = "";
    const idMap = {
        1: "Compressor",
        2: "Heat exchanger",
        3: "Pipe",
        4: "Pump",
        5: "Tank620",
        6: "Tank650",
        7: "FinFan",
        8: "Vessel"
    };
    if (idMap[equipId]) targetEquipName = idMap[equipId];
    if (!targetEquipName && isNaN(equipId)) targetEquipName = equipSelect.value;
    if (!targetEquipName) targetEquipName = "";

    console.log("DEBUG: targetEquipName", targetEquipName);


    // Find matches in Table 4.2
    const equipEntry = t42Data.equipment_data.find(e =>
        e.equipment_type.toLowerCase().replaceAll(/\s/g, '') === targetEquipName.toLowerCase().replaceAll(/\s/g, '')
    );

    if (!equipEntry) {
        console.error("DEBUG: No equipment entry found in t42Data for", targetEquipName);
        return;
    }

    const possibleGeoms = equipEntry.geometry_types;
    console.log("DEBUG: possibleGeoms", possibleGeoms);

    possibleGeoms.forEach(gCode => {
        // Get description from Table 4.3
        const gDescEntry = t43Data.geometry_types.find(x => x.geometry_type === gCode);
        const desc = gDescEntry ? gDescEntry.description : gCode;

        const opt = document.createElement("option");
        opt.value = gCode;
        opt.textContent = `${gCode} - ${desc}`;
        geomDataSelect.appendChild(opt);
    });
    
    console.log("DEBUG: Geometry dropdown updated. Options count:", geomDataSelect.options.length);
};

window.loadComponents = async function (equipType) {
    console.log("DEBUG: loadComponents called for", equipType);
    
    // Wait for data with timeout if needed
    if (!t42Data) {
        console.log("DEBUG: waiting for dataReady...");
        // Race dataReady with a 3s timeout
        const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 3000));
        const result = await Promise.race([dataReady, timeout]);
        if (result === 'timeout') {
            console.warn("Geometry data load timed out. Dropdowns will be empty.");
        }
    }

    const compSelect = document.getElementById("component");
    if (!compSelect) {
        console.error("DEBUG: Component select not found during loadComponents");
        return;
    }

    compSelect.innerHTML = '<option value="" disabled selected>Select component</option>';

    let targetEquipName = "";
    const equipId = parseInt(equipType);

    // Map ID to Name logic (Same as Step 4)
    const idMap = {
        1: "Compressor",
        2: "Heat exchanger",
        3: "Pipe",
        4: "Pump",
        5: "Tank620",
        6: "Tank650",
        7: "FinFan",
        8: "Vessel"
    };
    if (idMap[equipId]) targetEquipName = idMap[equipId];
    else targetEquipName = equipType; // Fallback if string

    const equipEntry = t42Data.equipment_data.find(e =>
        e.equipment_type.toLowerCase().replaceAll(/\s/g, '') === targetEquipName.toLowerCase().replaceAll(/\s/g, '')
    );

    if (!equipEntry || !equipEntry.components) return;

    equipEntry.components.forEach(comp => {
        const opt = document.createElement("option");
        opt.value = comp;
        opt.textContent = comp;
        compSelect.appendChild(opt);
    });
};


// --- DOM Initialization Logic ---
function initStep1Listeners() {
    console.log("DEBUG: initStep1Listeners running");
    const equipSelect = document.getElementById("equipment");
    const compSelect = document.getElementById("component");
    const geomDataSelect = document.getElementById("component_geometry_data");

    if (compSelect) {
        compSelect.addEventListener("change", () => {
            window.updateGeometryOptions();
        });
    }

    if (equipSelect) {
        equipSelect.addEventListener("change", () => {
            if(geomDataSelect) geomDataSelect.innerHTML = '<option value="" disabled selected>Select geometry</option>';
            window.loadComponents(equipSelect.value);
        });
    }
}

// Ensure execution on load or if already loaded
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initStep1Listeners);
} else {
    initStep1Listeners();
}
