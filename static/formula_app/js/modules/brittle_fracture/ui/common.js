
import { curveInfoData } from '../data.js';

// State
let activeMechanisms = []; 
let currentMechIndex = -1;

export function initCommon() {
    setupSelectors();
    setupTabs();
    setupModals();
    syncUnits();
    autoPopulateGlobal();
}

function setupSelectors() {
    const mechCheckboxes = document.querySelectorAll('.brittle-mech-check');
    if (mechCheckboxes.length > 0) {
        mechCheckboxes.forEach(chk => {
            chk.addEventListener('change', (e) => {
                const mechId = e.target.id.replace('check_brit_', ''); // e.g. 'carbon'
                
                if (e.target.checked) {
                    if(!activeMechanisms.includes(mechId)) {
                        activeMechanisms.push(mechId);
                    }
                } else {
                    activeMechanisms = activeMechanisms.filter(id => id !== mechId);
                }

                // If we just added the first one, select it
                if (activeMechanisms.length === 1 && e.target.checked) {
                    currentMechIndex = 0;
                } else if (currentMechIndex >= activeMechanisms.length) {
                    currentMechIndex = activeMechanisms.length - 1;
                }

                updateUI();
                // Force auto-pop check when user activates a module
                if (e.target.checked) {
                    console.log("[Brittle Common] Mechanism activated, re-running autoPopulateGlobal");
                    autoPopulateGlobal();
                }
            });
        });
    }
}

function updateUI() {
    const tabsContainer = document.getElementById('brittle_tabs_container');
    const inputsPlaceholder = document.getElementById('brittle_inputs_placeholder');

    // 1. Toggle Tabs Visibility
    if(activeMechanisms.length > 0) {
        tabsContainer.classList.remove('hidden');
        inputsPlaceholder.classList.add('hidden');
    } else {
        tabsContainer.classList.add('hidden');
        inputsPlaceholder.classList.remove('hidden');
        hideAllInputGroups();
        return;
    }

    // 2. Build Tabs
    setupTabs();

    // 3. Show Active Content
    hideAllInputGroups();
    if(currentMechIndex >= 0 && currentMechIndex < activeMechanisms.length) {
        const activeId = activeMechanisms[currentMechIndex];
        const activeContainer = document.getElementById(`cont_brit_${activeId}`);
        
        if(activeContainer) {
            activeContainer.classList.remove('hidden');
        }
    }
}

function setupTabs() {
    const tabsList = document.getElementById('brittle_tabs_list');
    tabsList.innerHTML = '';
    
    activeMechanisms.forEach((mechId, index) => {
        const tab = document.createElement('a');
        tab.className = `tab flex-nowrap whitespace-nowrap ${index === currentMechIndex ? 'tab-active bg-white font-bold shadow-sm text-blue-900 border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`;
        tab.textContent = formatMechName(mechId);
        
        tab.addEventListener('click', () => {
            currentMechIndex = index;
            updateUI();
        });

        tabsList.appendChild(tab);
    });
}

function hideAllInputGroups() {
    const groups = document.querySelectorAll('.brittle-input-group');
    groups.forEach(g => g.classList.add('hidden'));
}

function formatMechName(id) {
    const map = {
        'carbon': 'Brittle Fracture',
        'tempe': 'Temper Embrittlement',
        '885': '885°F Embrittlement',
        'sigma': 'Sigma Phase'
    };
    return map[id] || id;
}

function setupModals() {
    // Curve Info Modal
    document.body.addEventListener('click', async (e) => {
        const trigger = e.target.closest('.js-trigger-curve-info') || e.target.closest('a[onclick*="modal_curve_info"]');
        
        if (trigger) {
            e.preventDefault();
            const container = document.getElementById('table_curve_container');
            const notesDiv = document.getElementById('table_curve_notes');
            const modalToggle = document.getElementById('modal_curve_info_toggle'); 
            
            if(!container || !modalToggle) return;

            container.innerHTML = '<div class="text-center p-4">Loading data...</div>';
            if(notesDiv) notesDiv.innerHTML = '';
            modalToggle.checked = true;

            // Render static data
            renderCurveModal(container, notesDiv, modalToggle);
        }
    });

    // Reference Temp Modal
    const btnView2E33 = document.getElementById('btn_view_table_2e33');
    if(btnView2E33) {
        btnView2E33.onclick = async (e) => {
            e.preventDefault();
            const modalToggle = document.getElementById('modal_ref_temp_toggle');
            if(modalToggle) modalToggle.checked = true;
            loadRefTempModal(); // Load async
        };
    }
}

function renderCurveModal(container, notesDiv, modalToggle) {
    const data = curveInfoData;
    let tableHtml = `
    <table class="table table-compact table-zebra w-full text-xs border border-gray-300">
        <thead>
            <tr class="bg-gray-200">
                <th class="w-1/6 text-left text-gray-900 font-bold p-2 border border-gray-300">Curve</th>
                <th class="text-left text-gray-900 font-bold p-2 border border-gray-300">Material Assignment</th>
            </tr>
        </thead>
        <tbody>
    `;

    ['Curve A', 'Curve B', 'Curve C', 'Curve D'].forEach(curveName => {
        const items = data[curveName];
        if(items && items.length > 0) {
            tableHtml += `<tr>
                <td class="font-bold align-top p-2 border border-gray-300 bg-white text-gray-900" style="color: black !important; background-color: white !important;">${curveName}</td>
                <td class="p-2 border border-gray-300 bg-white text-left text-gray-900" style="color: black !important; background-color: white !important;">
                    <ul class="list-disc pl-4 space-y-1 marker:text-gray-500">
                        ${items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </td>
            </tr>`;
        }
    });

    if(data.Notes && data.Notes.length > 0) {
        tableHtml += `
        <tr>
            <td colspan="2" class="p-4 border border-gray-300 bg-white text-left text-gray-900 text-xs" style="color: black !important; background-color: white !important;">
                ${data.Notes.map(note => `<div class="mb-1">${note}</div>`).join('')}
            </td>
        </tr>
        `;
    }
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
    
    // Update title
    const titleEl = modalToggle.nextElementSibling?.querySelector('h3');
    if(titleEl) titleEl.innerText = "Exemption Curve Assignments (Table 2.E.3.1)";
}

async function loadRefTempModal() {
    const tableCS = document.querySelector('#table_ref_cs tbody');
    const tableLAS = document.querySelector('#table_ref_las tbody');
    const unitSpans = document.querySelectorAll('.unit-ys');
    
    if(!tableCS || !tableLAS) return;

    // Unit Logic
    const unitEl = document.querySelector('.temper-unit-display');
    const isMetric = unitEl && unitEl.textContent.includes('C');
    const tableFile = isMetric ? 'table_2_e_3_3m.json' : 'table_2_e_3_3.json';
    const unitText = isMetric ? 'MPa' : 'ksi';

    tableCS.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
    tableLAS.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
    unitSpans.forEach(el => el.textContent = unitText);

    try {
        const response = await fetch(`/static/formula_app/data/${tableFile}`);
        const data = await response.json();

        const renderRows = (tbody, items) => {
            tbody.innerHTML = '';
            items.sort((a,b) => a.min_yield_strength - b.min_yield_strength);
            items.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-bold">${item.min_yield_strength}</td>
                    <td>${item.curve_a}</td>
                    <td>${item.curve_b}</td>
                    <td>${item.curve_c}</td>
                    <td>${item.curve_d}</td>
                `;
                tbody.appendChild(tr);
            });
        };

        renderRows(tableCS, data.carbon_steels);
        renderRows(tableLAS, data.low_alloy_steels);
    } catch (e) {
        console.error("Error loading ref table", e);
    }
}

function syncUnits() {
    // Sync Step 3 Units
    const storedDataRaw = sessionStorage.getItem('common_inputs');
    if(storedDataRaw) {
        const data = JSON.parse(storedDataRaw);
        const isMetric = data.measurement_unit && data.measurement_unit.toLowerCase() === 'celsius';
        
        const ysUnit = document.getElementById('brittle_ys_unit');
        if(ysUnit) ysUnit.textContent = isMetric ? "MPa" : "ksi"; // Carbon
        
        const tUnit = document.getElementById('temper_ys_unit');
        if(tUnit) tUnit.textContent = isMetric ? "MPa" : "ksi"; // Temper
    }
}

function autoPopulateGlobal() {
    console.log("[Brittle Common] Running autoPopulateGlobal...");
    
    // 1. Service Life
    const serviceLifeInput = document.getElementById('brittle_service_life');
    const temperServiceYears = document.getElementById('temper_service_years');
    
    const t41Str = sessionStorage.getItem("table4.1_data");
    
    if(!t41Str) {
        console.warn("[Brittle Common] No table4.1_data found in sessionStorage.");
        return;
    }
    
    try {
        const data = JSON.parse(t41Str);
        if (data.start_date) {
            console.log("[Brittle Common] Found Start Date:", data.start_date);
            
            const installDate = new Date(data.start_date);
            const currentDate = new Date(); // Now
            const diffTime = Math.abs(currentDate - installDate);
            const age = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
            console.log("[Brittle Common] Calculated Age:", age);
            
            if(serviceLifeInput) {
                serviceLifeInput.value = age;
                serviceLifeInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                serviceLifeInput.readOnly = true;
                console.log("[Brittle Common] Set Carbon Service Life to:", age);
            } else {
                 console.warn("[Brittle Common] brittle_service_life input NOT found in DOM.");
            }

            // Sync to Temper
            if (temperServiceYears) {
                temperServiceYears.value = age;
                temperServiceYears.classList.add('bg-gray-100', 'cursor-not-allowed');
                temperServiceYears.readOnly = true;
                console.log("[Brittle Common] Set Temper Service Life to:", age);
            }
        } else {
             console.warn("[Brittle Common] No start_date in table4.1_data.");
        }
        
        // 2. Units
        if (data.measurement_unit) {
            const isMetric = data.measurement_unit.toLowerCase() === "celsius";
            const unitVal = isMetric ? "C" : "F";
            const tempUnitInput = document.getElementById('brittle_temp_unit');
            if(tempUnitInput) {
                tempUnitInput.value = unitVal;
                tempUnitInput.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
            const temperSelectors = document.querySelectorAll('.temper-unit-selector');
            temperSelectors.forEach(sel => sel.value = unitVal);
        }
        
        // 3. Thickness
        // 3. Thickness
         const thicknessInput = document.getElementById('brittle_thickness');
         const temperThickness = document.getElementById('temper_thickness');
         
         if(data.component_thickness) {
             const thickVal = data.component_thickness;
             
             if(thicknessInput) {
                 thicknessInput.value = thickVal;
                 thicknessInput.classList.add('bg-blue-50', 'cursor-not-allowed'); 
                 thicknessInput.readOnly = true;
             }
             
             if(temperThickness) {
                 temperThickness.value = thickVal;
                 temperThickness.classList.add('bg-gray-100', 'cursor-not-allowed');
                 temperThickness.readOnly = true;
                 console.log("[Brittle Common] Set Temper Thickness to:", thickVal);
             }
         } else if (data.thickness) {
              // try 'thickness' key
             const thickVal = data.thickness;
             
             if(thicknessInput) {
                 thicknessInput.value = thickVal;
                 thicknessInput.classList.add('bg-blue-50', 'cursor-not-allowed'); 
                 thicknessInput.readOnly = true;
             }
             
             if(temperThickness) {
                 temperThickness.value = thickVal;
                 temperThickness.classList.add('bg-gray-100', 'cursor-not-allowed');
                 temperThickness.readOnly = true;
                 console.log("[Brittle Common] Set Temper Thickness to:", thickVal);
             }
         }
    } catch(e) { console.error("AutoPop Error", e); }
}
