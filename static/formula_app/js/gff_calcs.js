
document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    // DOM Elements
    const equipmentSelect = document.getElementById('gff_equipment_select');
    const componentSelect = document.getElementById('gff_component_select');
    // const holeSizeSelect = document.getElementById('gff_hole_size_select'); // Removed
    const btnCalculate = document.getElementById('btn_calculate_gff');
    const resultsContainer = document.getElementById('gff_results_container');

    // Result fields
    const resValueTotal = document.getElementById('res_value_total');

    // URLs from Django Context
    const URL_GET_COMPONENTS = window.djangoUrls.getComponents;
    const URL_GET_GFF = window.djangoUrls.getGff;

    // --- LOGIC ---

    // 1. Initial Load: Restore Full State
    restoreState();

    // 2. Event Listeners
    if (equipmentSelect) {
        equipmentSelect.addEventListener('change', (e) => {
            const equipmentId = e.target.value;
            if (equipmentId) {
                loadComponents(equipmentId);
            } else {
                resetComponentSelect();
            }
            checkCalculateButton();
        });
    }

    if (componentSelect) {
        componentSelect.addEventListener('change', () => {
            checkCalculateButton();
        });
    }

    if (btnCalculate) {
        btnCalculate.addEventListener('click', () => {
            fetchGffValues();
        });
    }


    // --- FUNCTIONS ---

    function checkCalculateButton() {
        if (!btnCalculate) return;

        console.log("Checking Button State:", {
            equip: equipmentSelect ? equipmentSelect.value : 'null',
            comp: componentSelect ? componentSelect.value : 'null'
        });

        // Now requires Equipment + Component ONLY
        if (equipmentSelect && componentSelect &&
            equipmentSelect.value && componentSelect.value) {
            btnCalculate.disabled = false;
            btnCalculate.removeAttribute("disabled");
            console.log("Button ENABLED");
        } else {
            console.log("Button DISABLED");
            btnCalculate.disabled = true;
            btnCalculate.setAttribute("disabled", "true");
        }
        saveState(); // Auto-save inputs on change
    }

    function resetComponentSelect() {
        if (!componentSelect) return;
        componentSelect.innerHTML = '<option value="" disabled selected>Select equipment first</option>';
        componentSelect.disabled = true;
    }

    async function loadComponents(equipmentId, preSelectComponentId = null) {
        if (!componentSelect) return;

        try {
            componentSelect.disabled = true;
            componentSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';

            const response = await fetch(`${URL_GET_COMPONENTS}?equipment_id=${equipmentId}`);

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server Error ${response.status}: ${errText.substring(0, 50)}`);
            }

            const components = await response.json();

            componentSelect.innerHTML = '<option value="" disabled selected>Select component</option>';

            if (Array.isArray(components)) {
                components.forEach(comp => {
                    const option = document.createElement('option');
                    option.value = comp.id;
                    option.textContent = comp.name;
                    componentSelect.appendChild(option);
                });
            } else {
                throw new Error("Invalid format received from server");
            }

            componentSelect.disabled = false;

            if (preSelectComponentId) {
                // We use string comparison just to be safe with IDs
                const exists = components.some(c => c.id == preSelectComponentId);
                if (exists) {
                    componentSelect.value = preSelectComponentId;
                }
            }

            checkCalculateButton();

        } catch (error) {
            console.error("Load Components Error:", error);
            // Display specific error in dropdown for debugging
            componentSelect.innerHTML = `<option value="" disabled selected>Error: ${error.message}</option>`;
        }
    }

    async function fetchGffValues() {
        const componentId = componentSelect.value;

        if (!componentId) return;

        const originalBtnText = btnCalculate.textContent;
        btnCalculate.textContent = "Calculating...";
        btnCalculate.disabled = true;

        try {
            // Fetch without hole_size
            const response = await fetch(`${URL_GET_GFF}?component_id=${componentId}`);

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();

            if (resValueTotal) resValueTotal.textContent = Number(data.gff_total).toExponential(2);

            if (resultsContainer) resultsContainer.classList.remove('hidden');

            saveState(data);

        } catch (error) {
            console.error("GFF Fetch Error:", error);
            alert(`Error fetching GFF values: ${error.message}`);
        } finally {
            btnCalculate.textContent = originalBtnText;
            btnCalculate.disabled = false;
        }
    }

    function saveState(resultsData = null) {
        if (!equipmentSelect) return;

        const state = {
            equipment: equipmentSelect.value,
            component: componentSelect ? componentSelect.value : '',
            results: resultsData
        };
        sessionStorage.setItem('gff_module_state', JSON.stringify(state));
    }

    function restoreState() {
        const savedStateRaw = sessionStorage.getItem('gff_module_state');
        const tableDataRaw = sessionStorage.getItem('table4.1_data');

        if (savedStateRaw) {
            try {
                const state = JSON.parse(savedStateRaw);

                if (state.equipment && equipmentSelect) {
                    equipmentSelect.value = state.equipment;
                    loadComponents(state.equipment, state.component);
                }

                if (state.results && resultsContainer) {
                    if (resValueTotal) resValueTotal.textContent = Number(state.results.gff_total).toExponential(2);
                    resultsContainer.classList.remove('hidden');
                }

            } catch (e) {
                console.warn("Error parsing GFF state", e);
            }
        } else if (tableDataRaw) {
            // Default load from Step 1 data if no GFF state exists
            try {
                const tableData = JSON.parse(tableDataRaw);
                if (tableData.equip_type && equipmentSelect) {
                    equipmentSelect.value = tableData.equip_type;
                    loadComponents(tableData.equip_type, tableData.comp_type);
                }
            } catch (e) {
                console.warn("Error parsing Table 4.1 default", e);
            }
        }
    }

});
