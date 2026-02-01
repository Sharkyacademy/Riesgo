// GFF (Generic Failure Frequency) Calculation Logic

document.addEventListener('DOMContentLoaded', function () {
    console.log('[GFF] Module loaded');

    // DOM Elements
    const gffEquipmentSelect = document.getElementById('id_gff_equipment_type');
    const gffComponentSelect = document.getElementById('id_gff_component_type');
    const pofCategorySelect = document.getElementById('id_pof_category');
    const dispGffValue = document.getElementById('disp_gff_value');
    const inputGffValue = document.getElementById('id_gff_value');

    if (!dispGffValue || !inputGffValue || !gffEquipmentSelect || !gffComponentSelect) {
        console.warn('[GFF] Required elements not found');
        return;
    }

    // Fetch GFF from backend
    async function fetchGFF() {
        const equipmentId = gffEquipmentSelect.value;
        const componentId = gffComponentSelect.value;
        const pofCategory = pofCategorySelect?.value || 'auto';

        if (!equipmentId || !componentId) {
            console.log('[GFF] Equipment or component not selected');
            dispGffValue.innerText = '--';
            inputGffValue.value = '';
            return;
        }

        try {
            const url = `/api/get_gff/?equipment_id=${equipmentId}&component_id=${componentId}&pof_category=${pofCategory}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.gff_value !== undefined) {
                const gffValue = parseFloat(data.gff_value);
                dispGffValue.innerText = gffValue.toExponential(3);
                inputGffValue.value = gffValue;
                console.log('[GFF] Value fetched:', gffValue);
            } else {
                dispGffValue.innerText = 'N/A';
                inputGffValue.value = '';
                console.warn('[GFF] No value returned');
            }
        } catch (error) {
            console.error('[GFF] Fetch error:', error);
            dispGffValue.innerText = 'Error';
            inputGffValue.value = '';
        }
    }

    // Load component types based on equipment selection
    async function loadComponentTypes(equipmentId) {
        if (!equipmentId) {
            gffComponentSelect.innerHTML = '<option value="">-- Select Component --</option>';
            return;
        }

        try {
            const url = `/api/get_component_types/?equipment_id=${equipmentId}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Clear and populate component select
            gffComponentSelect.innerHTML = '<option value="">-- Select Component --</option>';
            data.components.forEach(comp => {
                const option = document.createElement('option');
                option.value = comp.id;
                option.textContent = comp.name;
                gffComponentSelect.appendChild(option);
            });

            console.log('[GFF] Loaded', data.components.length, 'components');
        } catch (error) {
            console.error('[GFF] Component load error:', error);
            gffComponentSelect.innerHTML = '<option value="">Error loading components</option>';
        }
    }

    // Event Listeners
    gffEquipmentSelect.addEventListener('change', function () {
        loadComponentTypes(this.value);
        dispGffValue.innerText = '--';
        inputGffValue.value = '';
    });

    gffComponentSelect.addEventListener('change', fetchGFF);

    if (pofCategorySelect) {
        pofCategorySelect.addEventListener('change', fetchGFF);
    }

    // Initial load - if equipment already selected
    if (gffEquipmentSelect.value) {
        loadComponentTypes(gffEquipmentSelect.value);
        // If component also selected, fetch GFF
        if (gffComponentSelect.value) {
            fetchGFF();
        }
    }
});
