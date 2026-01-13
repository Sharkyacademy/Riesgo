document.addEventListener('DOMContentLoaded', () => {
    
    // --- Clear Session Storage on Reload (User Request) ---
    // Clears all calculated data for Brittle Fracture modules to ensure a fresh start.
    const keysToClear = [
        'brittle_fracture_result', 
        'brittle_final_df', 
        'brittle_base_df',
        'temper_embrittlement_data', 
        'brit885_data', 
        'sigma_phase_data',
        'brittle_carbon_data' // Also clear inputs if we want a full reset? User said "el valor", but usually implies inputs too. Let's clear main data.
    ];
    
    keysToClear.forEach(key => sessionStorage.removeItem(key));

    // --- Selectors ---
    const mechCheckboxes = document.querySelectorAll('.brittle-mech-check');
    const tabsContainer = document.getElementById('brittle_tabs_container');
    const tabsList = document.getElementById('brittle_tabs_list');
    const inputsPlaceholder = document.getElementById('brittle_inputs_placeholder');
    
    // State
    let activeMechanisms = []; // Stores IDs: ['carbon', 'tempe']
    let currentMechIndex = -1;

    // --- Interaction Logic ---
    
    // 1. Checkboxes & Tabs
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
                    // If we removed the last one we were looking at
                    currentMechIndex = activeMechanisms.length - 1;
                }

                updateUI();
            });
        });
    }

    // 2. Buttons
    const btnCarbonConfirm = document.getElementById('btn_brittle_carbon_confirm');
    if (btnCarbonConfirm) {
        btnCarbonConfirm.addEventListener('click', () => {
             // Basic Validation
             const admin = document.getElementById('brittle_admin_controls');
             const temp = document.getElementById('brittle_min_temp');
             const life = document.getElementById('brittle_service_life');
             const factor = document.getElementById('brittle_inspection_factor');

             if (!admin.value || !temp.value || !life.value || !factor.value) {
                 alert("Please fill in all required fields.");
                 return;
             }
             
             // Save Data
             const data = {
                 adminControls: admin.value,
                 minTemp: temp.value,
                 serviceLife: life.value,
                 inspectionFactor: factor.value
             };
             
             sessionStorage.setItem('brittle_carbon_data', JSON.stringify(data));
             console.log("Brittle Fracture Data Saved:", data);
             
             // Feedback (e.g. Change Button Text temporarily)
             const originalText = btnCarbonConfirm.innerHTML;
             btnCarbonConfirm.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Saved!`;
             btnCarbonConfirm.classList.add('btn-success', 'text-white');
             
             setTimeout(() => {
                 btnCarbonConfirm.innerHTML = originalText;
                 btnCarbonConfirm.classList.remove('btn-success', 'text-white');
             }, 2000);
             
             // Trigger next steps/logic
             handleBrittleFractureCalculation(data); 
        });
    }

    // --- Calculation / Flow Logic ---

    function handleBrittleFractureCalculation(data) {
        const step1Container = document.getElementById('brittle_step_1_container');
        const step1Msg = document.getElementById('brittle_step_1_msg');
        const step2Container = document.getElementById('brittle_step_2_container');
        const step3Container = document.getElementById('brittle_step_3_container');
        const cetValueInput = document.getElementById('brittle_cet_value');
        const cetUnitSpan = document.getElementById('brittle_cet_unit');
        const tempUnit = document.getElementById('brittle_temp_unit');

        // Reset Displays
        step1Container.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');

        // Step 1: Check Administrative Controls
        step1Container.classList.remove('hidden');
        
        if (data.adminControls === 'Yes') {
            // Flow: Step 1 (Yes) -> Step 3 (Use Min Temp as CET)
            step1Msg.innerHTML = `
                Administrative controls <strong>prevent</strong> pressurization below a critical temperature.<br>
                <span class="text-green-600 font-bold">Protocol A:</span> Use Minimum Operating Temperature as CET.
            `;
            
            // Proceed to Step 3
            step3Container.classList.remove('hidden');
            cetValueInput.value = data.minTemp;
            if(tempUnit) cetUnitSpan.textContent = "°" + tempUnit.value;
            
        } else {
            // Flow: Step 1 (No) -> Step 2 (Determine CET per API 579)
            step1Msg.innerHTML = `
                Administrative controls <strong>do not prevent</strong> pressurization below a critical temperature.<br>
                <span class="text-orange-600 font-bold">Protocol B:</span> Proceed to Step 2 to determine CET.
            `;
            
            // Proceed to Step 2
            step2Container.classList.remove('hidden');
        }
    }

    // --- Core UI Functions ---

    function updateUI() {
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
        renderTabs();

        // 3. Show Active Content
        hideAllInputGroups();
        if(currentMechIndex >= 0 && currentMechIndex < activeMechanisms.length) {
            const activeId = activeMechanisms[currentMechIndex];
            const activeContainer = document.getElementById(`cont_brit_${activeId}`);
            
            if(activeContainer) {
                activeContainer.classList.remove('hidden');
            } else {
                console.warn(`Input interface for ${activeId} not found.`);
            }
        }
        
        // Trigger Auto-population whenever UI updates (e.g. tab switch)
        // This ensures the inputs are filled even if the module was hidden initially
        autoPopulateBrittleFracture();
    }

    function renderTabs() {
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

    // --- Auto-Population Logic ---

    function autoPopulateBrittleFracture() {
        const serviceLifeInput = document.getElementById('brittle_service_life');
        if (!serviceLifeInput) return;

        const t41Str = sessionStorage.getItem("table4.1_data");
        if (!t41Str) return;

        try {
            const data = JSON.parse(t41Str);
            if (data.start_date) {
                const installDate = new Date(data.start_date);
                const currentDate = new Date();
                
                // Calculate difference in milliseconds
                const diffTime = Math.abs(currentDate - installDate);
                // Convert to years (approximate using 365.25 days)
                const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
                const age = Math.floor(diffYears); // Service life usually integers for years
                
                // Auto-populate Service Life (Carbon)
                serviceLifeInput.value = age;
                serviceLifeInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                serviceLifeInput.readOnly = true;

                // Auto-populate Time in Service (Temper Embrittlement)
                const temperServiceYears = document.getElementById('temper_service_years');
                if (temperServiceYears) {
                    temperServiceYears.value = age;
                    temperServiceYears.classList.add('bg-gray-100', 'cursor-not-allowed');
                    temperServiceYears.readOnly = true;
                }
                
                console.log(`[Brittle Fracture] Auto-populated Service Life: ${age} years`);
            }

            // 2. Sync Temperature Unit
            const tempUnitInput = document.getElementById('brittle_temp_unit');
            const step2Unit = document.getElementById('brittle_step2_cet_unit');
            
            if (data.measurement_unit) {
                const isMetric = data.measurement_unit.toLowerCase() === "celsius";
                const unitVal = isMetric ? "C" : "F";
                
                if(tempUnitInput) {
                    tempUnitInput.value = unitVal;
                    tempUnitInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                }
                
                if(step2Unit) {
                    step2Unit.value = unitVal;
                }

                // Sync Temper Embrittlement Unit Selectors
                const temperSelectors = document.querySelectorAll('.temper-unit-selector');
                temperSelectors.forEach(sel => {
                    sel.value = unitVal;
                });

                console.log(`[Brittle Fracture] Auto-populated Unit: ${unitVal}`);
            }

            // 3. Auto-populate Component Thickness (for Step 5)
            // 3. Auto-populate Component Thickness (for Step 5)
            const thicknessInput = document.getElementById('brittle_thickness');
            if(data.thickness && thicknessInput) {
                thicknessInput.value = data.thickness;
                thicknessInput.classList.add('bg-blue-50', 'cursor-not-allowed'); 
                thicknessInput.readOnly = true;
                console.log(`[Brittle Fracture] Auto-populated Thickness: ${data.thickness}`);
            }

        } catch (e) {
            console.error("[Brittle Fracture] Error auto-populating data:", e);
        }
    }

    // Step 2 Confirm Listener
    const btnStep2Confirm = document.getElementById('btn_brittle_step2_confirm');
    if (btnStep2Confirm) {
        btnStep2Confirm.addEventListener('click', () => {
             const cetInput = document.getElementById('brittle_step2_cet_input');
             if (!cetInput || !cetInput.value) {
                 alert("Please enter the determined CET value.");
                 return;
             }
             
             // Transition to Step 3
             const step2Container = document.getElementById('brittle_step_2_container');
             const step3Container = document.getElementById('brittle_step_3_container');
             const cetValueInput = document.getElementById('brittle_cet_value');
             const cetUnitSpan = document.getElementById('brittle_cet_unit');
             const step2Unit = document.getElementById('brittle_step2_cet_unit');

             // step2Container.classList.add('hidden'); // REMOVED: User wants it visible
             step3Container.classList.remove('hidden');
             
             // Visual feedback: Disable Step 2 inputs to show it's done
             cetInput.disabled = true;
             btnStep2Confirm.disabled = true;
             btnStep2Confirm.textContent = "Confirmed";
             btnStep2Confirm.classList.add('btn-success', 'text-white');
             
             cetValueInput.value = cetInput.value;
             if(step2Unit) cetUnitSpan.textContent = "°" + step2Unit.value;
        });
    }

    // --- Step 3: Tref Calculation ---

    // Interpolation Helper (from utils.js)
    function interpolate(x, x1, y1, x2, y2) {
        if (x2 === x1) return y1;
        return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
    }

    const btnCalcTref = document.getElementById('btn_calc_tref');
    if(btnCalcTref) {
        btnCalcTref.addEventListener('click', async () => {
            const matType = document.getElementById('brittle_material_type').value; // Carbon Steel / Low-Alloy Steel
            const ysInput = document.getElementById('brittle_yield_strength');
            const curveSelect = document.getElementById('brittle_curve_select');
            
            if(!ysInput.value || !curveSelect.value) {
                alert("Please enter Yield Strength and select an Exemption Curve.");
                return;
            }

            const ys = parseFloat(ysInput.value);
            const curve = curveSelect.value.replace('Curve ', '').toLowerCase(); // a, b, c, d
            
            // Determine Unit System (Metric/Imperial)
            const isMetric = document.getElementById('brittle_ys_unit').innerText === "MPa";
            const tableFile = isMetric ? 'table_2_e_3_3m.json' : 'table_2_e_3_3.json';

            try {
                // Fetch Data
                const response = await fetch(`/static/formula_app/data/${tableFile}`);
                if(!response.ok) throw new Error("Failed to load reference data.");
                const tableData = await response.json();

                // Select Data Set
                let dataSet = [];
                if (matType === 'Carbon Steel') {
                    dataSet = tableData.carbon_steels;
                } else {
                    dataSet = tableData.low_alloy_steels;
                }

                if(!dataSet || dataSet.length === 0) throw new Error("Data set not found.");

                // Interpolation Logic
                // 1. Sort by Yield Strength (just in case)
                dataSet.sort((a, b) => a.min_yield_strength - b.min_yield_strength);

                // 2. Find Bracketing Points
                const minYS = dataSet[0].min_yield_strength;
                const maxYS = dataSet[dataSet.length - 1].min_yield_strength;
                
                let tRef = null;

                if (ys <= minYS) {
                    // Lower Bound
                    tRef = dataSet[0][`curve_${curve}`];
                } else if (ys >= maxYS) {
                    // Upper Bound
                    tRef = dataSet[dataSet.length - 1][`curve_${curve}`];
                } else {
                    // Interpolate
                    for (let i = 0; i < dataSet.length - 1; i++) {
                        const p1 = dataSet[i];
                        const p2 = dataSet[i+1];
                        
                        if (ys >= p1.min_yield_strength && ys <= p2.min_yield_strength) {
                            const x1 = p1.min_yield_strength;
                            const y1 = p1[`curve_${curve}`];
                            const x2 = p2.min_yield_strength;
                            const y2 = p2[`curve_${curve}`];
                            
                            tRef = interpolate(ys, x1, y1, x2, y2);
                            break;
                        }
                    }
                }

                // Display Result
                const resultArea = document.getElementById('brittle_tref_result_area');
                const trefValSpan = document.getElementById('brittle_tref_val');
                const trefUnitSpan = document.getElementById('brittle_tref_unit');
                
                if(tRef !== null) {
                    resultArea.classList.remove('hidden');
                    trefValSpan.textContent = tRef.toFixed(1);
                    trefUnitSpan.textContent = isMetric ? "°C" : "°F";
                }

            } catch (err) {
                console.error(err);
                alert("Error determining Tref. Please check inputs or try again.");
            }
        });
    }

    // --- Step 4 Logic ---
    function handleStep4Logic(tRef, isMetric) {
        const step4Container = document.getElementById('brittle_step_4_container');
        console.log("handleStep4Logic called. Container found?", !!step4Container);
        const alertAuto = document.getElementById('step4_alert_auto');
        const methodSection = document.getElementById('step4_method_section');
        const methodSelect = document.getElementById('step4_method_select');
        const btnCalc = document.getElementById('btn_calc_step4');

        if(!step4Container) {
            console.error("Step 4 Container NOT FOUND in DOM");
            return;
        }
        
        step4Container.classList.remove('hidden');
        step4Container.style.display = 'block'; // Force visibility
        console.log("Container classes after remove hidden:", step4Container.className);
        step4Container.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Check for Existing Delta FATT in Basic Data (SessionStorage: table4.1_data)
        let existingDeltaFatt = null;
        let existingYear = null;
        let serviceLifeYears = 0;

        // Try to read from SessionStorage 'temper_embrittlement_data' (Module Specific Data)
        const storedInputs = sessionStorage.getItem('temper_embrittlement_data');
        console.log("[Step 4 Debug] Reading temper_embrittlement_data:", storedInputs);

        if(storedInputs) {
            const data = JSON.parse(storedInputs);
            
            // Check for Delta FATT (key: 'deltaFatt')
            if(data.deltaFatt && String(data.deltaFatt).trim() !== "") {
                existingDeltaFatt = parseFloat(data.deltaFatt);
                console.log("[Step 4 Debug] Found existingDeltaFatt:", existingDeltaFatt);
            } else {
                console.log("[Step 4 Debug] Delta FATT not found or empty in temper data.");
            }

            // Check Service Years (key: 'serviceYears') for Method 2 calculation
            if(data.serviceYears) {
                const sy = parseFloat(data.serviceYears);
                if(!isNaN(sy)) serviceLifeYears = sy;
            }
            
            // Fallback: Fabrication Year (derived or stored?)
            // If strictly needed for Method 4, we might need to look back at Table 4.1 or calculate from service years.
            // But usually 'serviceYears' is enough for Method 2. Method 4 needs 'Year'.
            // Let's grab installation date from Table 4.1 only if needed for Method 4 year lookup?
            // The user said "Don't look in Table 4.1 *for Delta FATT*".
            // I will keep Table 4.1 look up ONLY for Year/Date if I can't find it here, but I won't look for Delta FATT there.
             const t41 = JSON.parse(sessionStorage.getItem('table4.1_data') || '{}');
             if(t41.start_date) {
                 const y = new Date(t41.start_date).getFullYear();
                 if(!isNaN(y)) existingYear = y;
             }

        } else {
            console.log("[Step 4 Debug] No temper_embrittlement_data found.");
        }

        if(existingDeltaFatt !== null && !isNaN(existingDeltaFatt)) {
            console.log("[Step 4 Debug] Branch: Existing Data Found. Auto-Calculating.");
            // Found existing value -> Show ONLY results
            alertAuto.classList.add('hidden'); // Hide the blue alert (per user request: "muestres nada más los valores")
            methodSection.classList.add('hidden');
            
            // Hide the Calculate Button too, as it's done automatically
            if(btnCalc && btnCalc.parentElement) {
                 btnCalc.parentElement.classList.add('hidden');
            }

            // Auto Calculate
            calculateStep4(tRef, existingDeltaFatt, isMetric);
        } else {
            console.log("[Step 4 Debug] Branch: No Data Found. Show Manual Selection.");
            // Show Selection
            alertAuto.classList.add('hidden');
            methodSection.classList.remove('hidden');
            
            // Show Button for manual
            if(btnCalc && btnCalc.parentElement) {
                 btnCalc.parentElement.classList.remove('hidden');
            }
            
            // Setup Method Selector
            methodSelect.onchange = (e) => toggleStep4Inputs(e.target.value, existingYear);
            console.log("[Step 4 Debug] Method Selector Listener Attached.");
            
            // Setup Calc Button
            btnCalc.onclick = () => {
                console.log("Calculate Button Clicked for Step 4 Manual");
                // ... logic inside ...
                const method = methodSelect.value;
                let deltaFatt = 0;

                try {
                    if(method === 'method1') {
                        const val = parseFloat(document.getElementById('step4_input_manual_fatt').value);
                        if(isNaN(val)) throw new Error("Please enter a valid Delta FATT value.");
                        deltaFatt = val;
                    } 
                    else if(method === 'method2') {
                        const sce = parseFloat(document.getElementById('step4_input_sce').value);
                        if(isNaN(sce)) throw new Error("Please enter a valid SCE value.");
                        if(serviceLifeYears <= 0) throw new Error("Service Life invalid (check Installation Date).");
                        
                        const ageHours = serviceLifeYears * 8760; // Approximate hours
                        // Eq 2.E.4: 0.67 * (log10(age) - 0.91) * SCE
                        deltaFatt = 0.67 * (Math.log10(ageHours) - 0.91) * sce; 
                    } 
                    else if(method === 'method3') {
                        // Composition
                        const type = document.querySelector('input[name="step4_comp_type"]:checked').value;
                        
                        if(type === 'j_factor') {
                            const si = parseFloat(document.getElementById('step4_chem_si').value);
                            const mn = parseFloat(document.getElementById('step4_chem_mn').value);
                            const p = parseFloat(document.getElementById('step4_chem_p').value);
                            const sn = parseFloat(document.getElementById('step4_chem_sn').value);

                            if(isNaN(si) || isNaN(mn) || isNaN(p) || isNaN(sn)) 
                                throw new Error("Please enter valid percentages for Si, Mn, P, and Sn.");

                            // Formula: J = (Si + Mn) * (P + Sn) * 10^4
                            const j = (si + mn) * (p + sn) * 10000;
                            console.log(`[Method 3] Calculated J-Factor: ${j} from Si:${si} Mn:${mn} P:${p} Sn:${sn}`);
                            
                            // Eq 2.E.5 Correlation
                            deltaFatt = -77.321 + (0.57570 * j) - (0.00055147 * j * j);

                        } else {
                            const p = parseFloat(document.getElementById('step4_xb_p').value);
                            const sb = parseFloat(document.getElementById('step4_xb_sb').value);
                            const sn = parseFloat(document.getElementById('step4_xb_sn').value);
                            const as = parseFloat(document.getElementById('step4_xb_as').value);

                            if(isNaN(p) || isNaN(sb) || isNaN(sn) || isNaN(as)) 
                                throw new Error("Please enter valid percentages/values for P, Sb, Sn, and As.");

                            // Formula: X-bar = (10P + 5Sb + 4Sn + As) * 100
                            const x = (10 * p + 5 * sb + 4 * sn + as) * 100;
                            console.log(`[Method 3] Calculated X-bar: ${x} from P:${p} Sb:${sb} Sn:${sn} As:${as}`);

                            // Eq 2.E.6 Correlation
                            deltaFatt = -87.335 + (11.437 * x) - (0.1472 * x * x);
                        }
                        
                        // Bounds check logic usually applies (e.g. min Delta FATT is 0?)
                        // API 579 doesn't explicitly say clamp to 0, but negative Delta FATT implies improvement?
                        // Usually assumed >= 0. Let's keep raw value unless user complains, or clamp if negative.
                        if(deltaFatt < 0) deltaFatt = 0;
                    } 
                    else if(method === 'method4') {
                        // Year Lookup
                         if(!existingYear) throw new Error("Fabrication Year unknown.");
                         
                         if(existingYear > 1988) deltaFatt = 150;
                         else if(existingYear >= 1981) deltaFatt = 250;
                         else if(existingYear >= 1973) deltaFatt = 300;
                         else deltaFatt = 350; // Pre-1972
                    }
                    else {
                        throw new Error("Please select a method.");
                    }
                    
                    calculateStep4(tRef, deltaFatt, isMetric);

                } catch(e) {
                    alert(e.message);
                }
            };
        }
    }

    function toggleStep4Inputs(method, year) {
        // Hide all input groups
        ['step4_inputs_method1', 'step4_inputs_method2', 'step4_inputs_method3', 'step4_inputs_method4'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        // Show active
        if(method) {
            const el = document.getElementById('step4_inputs_' + method);
            if(el) el.classList.remove('hidden');

            if(method === 'method4') {
                const inp = document.getElementById('step4_input_year_confirm');
                if(inp) inp.value = year || "Unknown";
            }
        }
    }

    function calculateStep4(tRef, deltaFatt, isMetric) {
        const mpt = tRef + deltaFatt;
        
        document.getElementById('step4_result_area').classList.remove('hidden');
        document.getElementById('res_delta_fatt').textContent = deltaFatt.toFixed(1);
        document.getElementById('res_step4_tref').textContent = tRef.toFixed(1);
        
        // Final Result
        document.getElementById('res_mpt').textContent = mpt.toFixed(1);
        
        // Show Step 5
        const step5Container = document.getElementById('brittle_step_5_container');
        console.log("Un-hiding step 5 container:", step5Container);
        if(step5Container) {
            step5Container.classList.remove('hidden');
            step5Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Auto-populate Thickness from Table 4.1 Data (Step 0)
            let popSuccess = false;
            const thickInput = document.getElementById('brittle_thickness');
            
            if (thickInput) {
                const storedDataRaw = sessionStorage.getItem('table4.1_data'); // Correct Key
                console.log("Looking for Table 4.1 Data...", storedDataRaw ? "Found" : "Not Found");

                if(storedDataRaw) {
                    try {
                        const data = JSON.parse(storedDataRaw);
                        console.log("Full Table 4.1 Data:", data); 

                        // Try 'thickness' property. Handle 0 correctly.
                        const val = data.thickness; 
                        console.log("Retrieved thickness value:", val, "Type:", typeof val);

                        if (val !== undefined && val !== null && !isNaN(val)) {
                            thickInput.value = val;
                            
                            // Enforce Read-Only and Visual Lock
                            thickInput.setAttribute('readonly', 'true');
                            thickInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                            
                            console.log("SUCCESS: Auto-populated thickness:", val);
                            popSuccess = true;
                        } else {
                            console.warn("Thickness property is undefined, null, or NaN in table4.1_data.");
                        }
                    } catch(e) { 
                        console.error("Error parsing table4.1_data:", e); 
                    }
                }
                
                // Fallback: If auto-pop failed
                if(!popSuccess) {
                     console.warn("Auto-population failed. Unlocking input.");
                     thickInput.removeAttribute('readonly');
                     thickInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                     thickInput.placeholder = "Enter manually";
                }
            } else {
                console.error("CRITICAL: Input element 'brittle_thickness' not found in DOM!");
            }
        } else {
            console.error("Critical Error: Step 5 Container not found!");
        }
    }

    // Toggle J/X in Method 3 (Helper)
    document.querySelectorAll('input[name="step4_comp_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.value === 'j_factor') {
                document.getElementById('group_j_factor').classList.remove('hidden');
                document.getElementById('group_x_bar').classList.add('hidden');
            } else {
                document.getElementById('group_j_factor').classList.add('hidden');
                document.getElementById('group_x_bar').classList.remove('hidden');
            }
        });
    });



    // Sync Units for Step 3 Inputs
    function syncStep3Units() {
        // Use Global Unit from SessionStorage if available
        const storedDataRaw = sessionStorage.getItem('common_inputs');
        if(storedDataRaw) {
            const data = JSON.parse(storedDataRaw);
            const isMetric = data.measurement_unit && data.measurement_unit.toLowerCase() === 'celsius';
            
            const ysUnit = document.getElementById('brittle_ys_unit');
            if(ysUnit) {
               // Per user request: Show 'ksi' only for Fahrenheit. For Celsius, show 'MPa' (or 'psi' if strictly requested, but MPa matches JSON).
               // The JSON uses MPa for metric.
               ysUnit.textContent = isMetric ? "MPa" : "ksi"; 
            }
        }
    }
    
    // Call sync on load
    syncStep3Units();

    // --- Modal Logic for Curve Info (Event Delegation) ---
    document.body.addEventListener('click', async (e) => {
        // Check if clicked element or parent is the trigger
        const trigger = e.target.closest('.js-trigger-curve-info') || e.target.closest('a[onclick*="modal_curve_info"]');
        
        if (trigger) {
            e.preventDefault();
            
            // Nuclear Option: Rebuild Entire Table
            const container = document.getElementById('table_curve_container');
            const notesDiv = document.getElementById('table_curve_notes');
            const modalToggle = document.getElementById('modal_curve_info_toggle'); 
            
            if(!container || !notesDiv || !modalToggle) {
                console.error("Modal container elements not found");
                return;
            }

            container.innerHTML = '<div class="text-center p-4">Loading data...</div>';
            notesDiv.innerHTML = '';
            modalToggle.checked = true;

            try {
                const data = {
                  "Curve A": [
                    "All carbon and all low-alloy steel plates, structural shapes, and bars not listed in Curves B, C, and D below.",
                    "SA-216 Grades WCB and WCC if normalized and tempered or water-quenched and tempered; SA-217 Grade WC6 if normalized and tempered or water-quenched and tempered.",
                    "The following specifications for obsolete materials: A7, A10, A30, A70, A113, A149, A150. (Note 3)",
                    "The following specifications for obsolete materials from the 1934 edition of the ASME Code, Section VIII: S1, S2, S25, S26, and S27. (Note 4)",
                    "A201 and A212 unless it can be established that the steel was produced by a fine-grain practice. (Note 5)"
                  ],
                  "Curve B": [
                    "SA-216 Grade WCA if normalized and tempered or water-quenched and tempered.",
                    "SA-216 Grades WCB and WCC for thicknesses not exceeding 2 in. if produced to a fine-grain practice and water-quenched and tempered.",
                    "SA-217 Grade WC9 if normalized and tempered.",
                    "SA-285 Grades A and B.",
                    "SA-414 Grade A.",
                    "SA-442 Grade 55 > 1 in. if not to fine-grain practice and normalized.",
                    "SA-442 Grade 60 if not to fine-grain practice and normalized.",
                    "SA-515 Grades 55 and 60.",
                    "SA-516 Grades 65 and 70 if not normalized.",
                    "SA-612 if not normalized.",
                    "SA-662 Grade B if not normalized.",
                    "Except for cast steels, all materials of Curve A if produced to fine-grain practice and normalized that are not listed for Curves C and D below.",
                    "All pipe, fittings, forgings, and tubing not listed for Curves C and D below.",
                    "Parts permitted from paragraph UG-11 of the ASME Code, Section VIII, Division 1, shall be included in Curve B even when fabricated from plate that otherwise would be assigned to a different curve.",
                    "A201 and A212 if it can be established that the steel was produced by a fine-grain practice."
                  ],
                  "Curve C": [
                    "SA-182 Grades 21 and 22 if normalized and tempered.",
                    "SA-302 Grades C and D.",
                    "SA-336 Grades F21 and F22 if normalized and tempered.",
                    "SA-387 Grades 21 and 22 if normalized and tempered.",
                    "SA-442 Grade 55 < 1 in. if not to fine-grain practice and normalized.",
                    "SA-516 Grades 55 and 60 if not normalized.",
                    "SA-533 Grades B and C.",
                    "SA-662 Grade A.",
                    "All material of Curve B if produced to fine-grain practice and normalized and not listed for Curve D below."
                  ],
                  "Curve D": [
                    "SA-203.",
                    "SA-442 if to fine-grain practice and normalized.",
                    "SA-508 Class 1.",
                    "SA-516 if normalized.",
                    "SA-524 Classes 1 and 2.",
                    "SA-537 Classes 1 and 2.",
                    "SA-612 if normalized.",
                    "SA-662 if normalized.",
                    "SA-738 Grade A."
                  ],
                  "Notes": [
                    "1. When a material class or grade is not shown, all classes or grades are included.",
                    "2. The following apply to all material assignment notes: a. Cooling rates faster than those obtained in air, followed by tempering, as permitted by the material specification, are considered equivalent to normalizing and tempering heat treatments. b. Fine-grain practice is defined as the procedures necessary to obtain a fine austenitic grain size as described in SA-20.",
                    "3. The first edition of the API Code for Unfired Pressure Vessels (discontinued in 1956) included these ASTM carbon steel plate specifications. These specifications were variously designated for structural steel for bridges, locomotives, and rail cars or for boilers and firebox steel for locomotives and stationary service. ASTM A149 and A150 were applicable to high-tensile-strength carbon steel plates for pressure vessels.",
                    "4. The 1934 edition of Section VIII of the ASME Code listed a series of ASME steel specifications, including S1 and S2 for forge welding; S26 and S27 for carbon steel plates; and S25 for open-hearth iron. The titles of some of these specifications are similar to the ASTM specifications listed in the 1934 edition of the API Code for Unfired Pressure Vessels.",
                    "5. These two steels were replaced in strength grades by the four grades specified in ASTM A515 and the four grades specified in ASTM A516. Steel in accordance with ASTM A212 was made only in strength grades the same as Grades 65 and 70 and has accounted for several known brittle failures. Steels in conformance with ASTM A201 and A212 should be assigned to Curve A unless it can be established that the steel was produced by fine-grain practice, which may have enhanced the toughness properties.",
                    "6. No attempt has been made to make a list of obsolete specifications for tubes, pipes, forgings, bars, and castings. Unless specific information to the contrary is available, all of these product forms should be assigned to Curve A."
                  ]
                };

                // Create the table structure string
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

                // Render Curves A-D rows
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

                // Append Notes Row (Inside the table, spanning 2 columns)
                if(data.Notes && data.Notes.length > 0) {
                    tableHtml += `
                    <tr>
                        <td colspan="2" class="p-4 border border-gray-300 bg-white text-left text-gray-900 text-xs" style="color: black !important; background-color: white !important;">
                            ${data.Notes.map(note => `<div class="mb-1">${note}</div>`).join('')}
                        </td>
                    </tr>
                    `;
                }

                // Close table
                tableHtml += `</tbody></table>`;
                
                // Inject the entire table
                container.innerHTML = tableHtml;

                // Remove debug title
                const titleEl = modalToggle.nextElementSibling.querySelector('h3');
                if(titleEl) titleEl.innerText = "Exemption Curve Assignments (Table 2.E.3.1)";

                // Clear external notes div (since we moved it inside)
                if(notesDiv) notesDiv.innerHTML = '';

            } catch (err) {
                console.error(err);
                container.innerHTML = `<div class="text-error font-bold p-4">Error: ${err.message}</div>`;
            }
        }
    });

    // --- Modal Logic for Table 2.E.3.3 (Reference Temperature) ---
    const btnView2E33 = document.getElementById('btn_view_table_2e33');
    if(btnView2E33) {
        btnView2E33.onclick = async (e) => {
            e.preventDefault();
            const modalToggle = document.getElementById('modal_ref_temp_toggle');
            const tableCS = document.querySelector('#table_ref_cs tbody');
            const tableLAS = document.querySelector('#table_ref_las tbody');
            const unitSpans = document.querySelectorAll('.unit-ys');
            
            if(!modalToggle || !tableCS || !tableLAS) return;

            // Determine Unit Context
            const unitEl = document.querySelector('.temper-unit-display');
            const isMetric = unitEl && unitEl.textContent.includes('C');
            const tableFile = isMetric ? 'table_2_e_3_3m.json' : 'table_2_e_3_3.json';
            const unitText = isMetric ? 'MPa' : 'ksi';

            // Show Loading
            tableCS.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
            tableLAS.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
            unitSpans.forEach(el => el.textContent = unitText);

            modalToggle.checked = true;

            try {
                const response = await fetch(`/static/formula_app/data/${tableFile}`);
                if(!response.ok) throw new Error("Failed to load table data");
                const data = await response.json();

                // Helper to render rows
                const renderRows = (tbody, items) => {
                    tbody.innerHTML = '';
                    if(!items || items.length === 0) return;
                    
                    // Sort by Yield Strength
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

            } catch (err) {
                console.error(err);
                tableCS.innerHTML = '<tr><td colspan="5" class="text-center text-error">Error loading data.</td></tr>';
                tableLAS.innerHTML = '<tr><td colspan="5" class="text-center text-error">Error loading data.</td></tr>';
            }
        };
    }

    // --- Tab Switching Logic for Table 2.E.3.3 ---
    const tabCS = document.getElementById('tab_ref_cs');
    const tabLAS = document.getElementById('tab_ref_las');
    const contentCS = document.getElementById('content_ref_cs');
    const contentLAS = document.getElementById('content_ref_las');

    if(tabCS && tabLAS) {
        tabCS.onclick = () => {
             tabCS.classList.add('tab-active');
             tabLAS.classList.remove('tab-active');
             contentCS.classList.remove('hidden');
             contentLAS.classList.add('hidden');
        };
        tabLAS.onclick = () => {
             tabLAS.classList.add('tab-active');
             tabCS.classList.remove('tab-active');
             contentLAS.classList.remove('hidden');
             contentCS.classList.add('hidden');
        };
    }
    
    // --- Step 5: Base DF Calculation ---

    // Interpolate Helper
    function interpolate(x, x1, y1, x2, y2) {
        if (Math.abs(x2 - x1) < 1e-6) return y1; // Avoid div by zero
        return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
    }

    // Step 5 UI Logic (PWHT Select)
    const pwhtSelect = document.getElementById('brittle_pwht_select');
    const pwhtMsg = document.getElementById('brittle_pwht_table_msg');
    
    function updatePwhtMsg() {
        if(pwhtSelect && pwhtMsg) {
             if(pwhtSelect.value === 'Yes') {
                 pwhtMsg.textContent = "Using Table 2.E.3.5 (Subject to PWHT)";
             } else {
                 pwhtMsg.textContent = "Using Table 2.E.3.4 (Not Subject to PWHT)";
             }
        }
    }

    if(pwhtSelect) {
        pwhtSelect.addEventListener('change', updatePwhtMsg);
        // Init
        updatePwhtMsg();
    }


    const btnCalcBaseDf = document.getElementById('btn_calc_base_df');
    if(btnCalcBaseDf) {
        btnCalcBaseDf.addEventListener('click', async () => {
             const resultContainer = document.getElementById('brittle_step5_result_area');
             const resultVal = document.getElementById('brittle_base_df_val');
             
             // Inputs
             const thickInput = document.getElementById('brittle_thickness');
             // PWHT is now select
             // 1. Get Operating Temp (MPT from Step 1)
             const tempMinInput = document.getElementById('brittle_min_temp');
             
             // Auto-populate Min Temp if empty (User Request: "Data is there")
             if(tempMinInput && !tempMinInput.value) {
                 const t41Raw = sessionStorage.getItem('table4.1_data');
                 if(t41Raw) {
                     try {
                        const t41 = JSON.parse(t41Raw);
                        if(t41.operating_temp) {
                            tempMinInput.value = t41.operating_temp;
                            console.log("Auto-populated Min Temp from Table 4.1:", t41.operating_temp);
                        }
                     } catch(e) {}
                 }
             }

             // 2. Get Calculated Threshold (Tref + DeltaFATT from Step 4)
             const step4ResultSpan = document.getElementById('res_mpt'); // The final result of Step 4
             const step4UnitSpan = document.querySelector('.temper-unit-display'); // Assuming unit is consistent

             // Detailed Validation
             const errors = [];
             if(!thickInput.value) errors.push("Thickness (Step 5)");
             // if(!pwhtSelect) errors.push("PWHT Selection"); // Always exists
             if(!step4ResultSpan || step4ResultSpan.textContent === '--') errors.push("Step 4 Result (MPT)");
             if(!tempMinInput.value) errors.push("Step 1 (Minimum Operating Temperature)");

             if (errors.length > 0) {
                 alert("Missing required data:\n" + errors.join("\n"));
                 return;
             }
             
             const thickness = parseFloat(thickInput.value);
             const isPwht = (pwhtSelect.value === 'Yes');
             const tempMin = parseFloat(tempMinInput.value);
             const tempThreshold = parseFloat(step4ResultSpan.textContent); // This is Tref + DeltaFATT
             
             // Calculate Delta T
             // Delta T = MinOperatingTemp - (Tref + DeltaFATT)
             const deltaT = tempMin - tempThreshold;
             console.log(`[Step 5] MinOp: ${tempMin}, Thresh: ${tempThreshold}, DeltaT: ${deltaT}, Thick: ${thickness}, PWHT: ${isPwht}`);

             const isMetric = (step4UnitSpan && step4UnitSpan.textContent.includes('C'));

             // Select Data File
             // 2.E.3.4 (Non-PWHT), 2.E.3.5 (PWHT)
             // + 'm' for metric
             let tableFile = isPwht ? 'table_2_e_3_5' : 'table_2_e_3_4';
             if (isMetric) tableFile += 'm';
             tableFile += '.json';

             try {
                 const response = await fetch(`/static/formula_app/data/${tableFile}`);
                 if(!response.ok) throw new Error("Failed to load DF data table.");
                 const tableData = await response.json();

                 // Get Thickness Columns
                 const tCols = tableData.thicknesses; // [0.25, 0.5, ...]
                 
                 // Get Rows (DeltaT)
                 const rows = tableData.rows; // [{delta_t: 100, values: [...]}, ...]

                 // 1. Find bounding Thickness indices
                 // We will clamp if outside range, or interpolate if inside.
                 // tCols is sorted ascending.
                 let tIdx1 = 0;
                 let tIdx2 = 0;

                 if (thickness <= tCols[0]) {
                     tIdx1 = 0; tIdx2 = 0;
                 } else if (thickness >= tCols[tCols.length - 1]) {
                     tIdx1 = tCols.length - 1; tIdx2 = tCols.length - 1;
                 } else {
                     for(let i=0; i < tCols.length - 1; i++) {
                         if (thickness >= tCols[i] && thickness <= tCols[i+1]) {
                             tIdx1 = i;
                             tIdx2 = i+1;
                             break;
                         }
                     }
                 }

                 // 2. Find bounding Row indices (DeltaT)
                 // rows are sorted DESCENDING (100 down to -100)
                 let rIdx1 = 0; // Higher temp (usually index 0)
                 let rIdx2 = 0;

                 if (deltaT >= rows[0].delta_t) {
                     rIdx1 = 0; rIdx2 = 0;
                 } else if (deltaT <= rows[rows.length - 1].delta_t) {
                     rIdx1 = rows.length - 1; rIdx2 = rows.length - 1;
                 } else {
                     for(let i=0; i < rows.length - 1; i++) {
                         // Because descending: if val is between row[i] (higher) and row[i+1] (lower)
                         if (deltaT <= rows[i].delta_t && deltaT >= rows[i+1].delta_t) {
                             rIdx1 = i;
                             rIdx2 = i+1;
                             break;
                         }
                     }
                 }

                 // 3. Calculation Function
                 // First get DF for the target thickness at Row 1 (Temp 1) and Row 2 (Temp 2)
                 
                 const getDfAtRow = (rIdx, thick, tI1, tI2, tCols) => {
                     const rowVals = rows[rIdx].values;
                     const val1 = rowVals[tI1];
                     const val2 = rowVals[tI2];
                     
                     if (tI1 === tI2) return val1;
                     return interpolate(thick, tCols[tI1], val1, tCols[tI2], val2);
                 };

                 const dfRow1 = getDfAtRow(rIdx1, thickness, tIdx1, tIdx2, tCols);
                 const dfRow2 = getDfAtRow(rIdx2, thickness, tIdx1, tIdx2, tCols);

                 // Now interpolate between Row 1 and Row 2 for the target Temp
                 const t1 = rows[rIdx1].delta_t;
                 const t2 = rows[rIdx2].delta_t;
                 
                 let finalDf = 0;
                 if (rIdx1 === rIdx2) {
                     finalDf = dfRow1;
                 } else {
                     finalDf = interpolate(deltaT, t1, dfRow1, t2, dfRow2);
                 }

                 // Display Result
                 if(resultVal && resultContainer) {
                     resultVal.textContent = finalDf.toFixed(2);
                     resultContainer.classList.remove('hidden');
                     resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     
                     // Save to session
                     sessionStorage.setItem('brittle_base_df', finalDf.toFixed(2));

                     // Show Step 6
                     const step6Container = document.getElementById('brittle_step_6_container');
                     console.log("Attempting to show Step 6 Container:", step6Container);
                     
                     if(step6Container) {
                         step6Container.classList.remove('hidden');
                         step6Container.style.display = 'block'; // Force display
                         step6Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     } else {
                         console.error("CRITICAL: Step 6 Container (brittle_step_6_container) NOT FOUND.");
                         alert("Error: Step 6 Interface could not be loaded. Please refresh.");
                     }
                 }

             } catch (err) {
                 console.error(err);
                 alert("Error determining Base DF: " + err.message);
             }
        });
    }
    
    // --- STEP 6: Final Damage Factor ---
    const btnCalcFinalDf = document.getElementById('btn_calc_final_df');
    if(btnCalcFinalDf) {
        btnCalcFinalDf.addEventListener('click', () => {
            const baseDfEl = document.getElementById('brittle_base_df_val');
            const fseSelect = document.getElementById('brittle_fse_select');
            const resultContainer = document.getElementById('brittle_step6_result_area');
            const resultVal = document.getElementById('brittle_final_df_val');

            if(!baseDfEl || baseDfEl.textContent === '--') {
                alert("Please calculate the Base Damage Factor first.");
                return;
            }
            
            const baseDf = parseFloat(baseDfEl.textContent);
            const fse = parseFloat(fseSelect.value);
            
            if(isNaN(baseDf) || isNaN(fse)) {
                alert("Invalid inputs.");
                return;
            }

            const finalDf = baseDf * fse;
            
            if(resultVal && resultContainer) {
                resultVal.textContent = finalDf.toFixed(2);
                resultContainer.classList.remove('hidden');
                resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Save to session (Simple & Comprehensive)
                sessionStorage.setItem('brittle_final_df', finalDf.toFixed(2));
                
                const resultData = {
                     mechanism: "Brittle Fracture",
                     base_df: baseDf,
                     fse: fse,
                     final_df: finalDf,
                     date: new Date().toISOString()
                };
                sessionStorage.setItem('brittle_fracture_result', JSON.stringify(resultData));
                
                console.log("Calculated Final DF:", finalDf.toFixed(2), resultData);
            }
        });
    }
    // Helper to sync thickness unit
    function syncStep5HeightUnit() {
        const storedDataRaw = sessionStorage.getItem('common_inputs');
        if(storedDataRaw) {
             const data = JSON.parse(storedDataRaw);
             const isMetric = data.measurement_unit && data.measurement_unit.toLowerCase() === 'celsius';
             
             const tUnit = document.getElementById('brittle_thickness_unit');
             if (tUnit) {
                 tUnit.textContent = isMetric ? "mm" : "in";
             }
        }
    }
    syncStep5HeightUnit();
    
    // --- Temper Embrittlement Logic ---

    // --- Temper Embrittlement Logic ---

    const btnTemperConfirm = document.getElementById('btn_temper_confirm');
    if (btnTemperConfirm) {
        btnTemperConfirm.addEventListener('click', () => {
             // 1. Gather Inputs
             const inputs = {
                 impactTemp: document.getElementById('temper_impact_temp').value,
                 adminControls: document.getElementById('temper_admin_controls').value,
                 minOpTemp: document.getElementById('temper_min_op_temp').value,
                 serviceYears: document.getElementById('temper_service_years').value,
                 deltaFatt: document.getElementById('temper_delta_fatt').value,
                 chemComp: document.getElementById('temper_chem_comp').value,
                 materialScreening: document.getElementById('temper_material_screening').value,
                 sceTemp: document.getElementById('temper_sce_temp').value
             };

             // 2. Validation (Clean UI, No Alerts)
             // Required fields map
             const required = [
                 { id: 'temper_impact_temp', val: inputs.impactTemp },
                 { id: 'temper_admin_controls', val: inputs.adminControls },
                 { id: 'temper_min_op_temp', val: inputs.minOpTemp },
                 { id: 'temper_service_years', val: inputs.serviceYears },
                 // Delta FATT is now OPTIONAL per user request
                 // { id: 'temper_delta_fatt', val: inputs.deltaFatt }, 
                 { id: 'temper_material_screening', val: inputs.materialScreening },
                 { id: 'temper_sce_temp', val: inputs.sceTemp }
             ];

             let hasError = false;
             
             // Reset errors first
             required.forEach(item => {
                 const el = document.getElementById(item.id);
                 if(el) el.classList.remove('input-error', 'select-error');
             });

             // Check empty
             required.forEach(item => {
                 if(!item.val || item.val.trim() === "") {
                     const el = document.getElementById(item.id);
                     if(el) {
                         el.classList.add(el.tagName === 'SELECT' ? 'select-error' : 'input-error');
                         hasError = true;
                     }
                 }
             });

             if(hasError) {
                 // Clean toast or status message could go here, but input highlighting is sufficient prompt
                 console.warn("Validation failed: Missing required fields.");
                 return;
             }

             // 3. Save Data
             sessionStorage.setItem('temper_embrittlement_data', JSON.stringify(inputs));
             console.log("Temper Data Saved:", inputs);

             // 4. Feedback
             const originalText = btnTemperConfirm.innerHTML;
             btnTemperConfirm.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Saved!`;
             btnTemperConfirm.classList.add('btn-success', 'text-white');
             setTimeout(() => {
                 btnTemperConfirm.innerHTML = originalText;
                 btnTemperConfirm.classList.remove('btn-success', 'text-white');
             }, 2000);

             // 5. Logic Flow (Step 1)
             const s1Container = document.getElementById('temper_step_1_container');
             const s1Msg = document.getElementById('temper_step_1_msg');
             const s2Container = document.getElementById('temper_step_2_container');
             const s3Container = document.getElementById('temper_step_3_container');

             // Reset hidden
             s1Container.classList.add('hidden');
             s2Container.classList.add('hidden');
             s3Container.classList.add('hidden');

             s1Container.classList.remove('hidden');

             if (inputs.adminControls === 'Yes') {
                 // Protocol A -> Step 3
                 // "Do administrative controls prevent pressurizing ...? Yes -> Use this MPT"
                 // MPT = Minimum Operating Temperature (inputs.minOpTemp)
                 const unit = document.querySelector('.temper-unit-selector') ? document.querySelector('.temper-unit-selector').value : 'F';
                 
                 s1Msg.innerHTML = `
                    Administrative controls <strong>prevent</strong> pressurization below a critical temperature.<br>
                    <span class="text-green-600 font-bold">Protocol A:</span> Use Minimum Operating Temperature (${inputs.minOpTemp}°${unit}) as MPT. Proceed to Step 3.
                 `;
                 s3Container.classList.remove('hidden');

                 // Auto-populate Step 3 CET
                 const step3Cet = document.getElementById('temper_step3_cet');
                 if(step3Cet) step3Cet.value = inputs.minOpTemp;

             } else {
                 // Protocol B -> Step 2
                 s1Msg.innerHTML = `
                    Administrative controls <strong>do not prevent</strong> pressurization below a critical temperature.<br>
                    <span class="text-orange-600 font-bold">Protocol B:</span> Proceed to Step 2 to determine MPT.
                 `;
                 s2Container.classList.remove('hidden');
             }
        });
    }



    // Step 2 Logic (Calculate T_MPT)
    const btnTemperCalcStep2 = document.getElementById('btn_temper_calc_step2');
    if (btnTemperCalcStep2) {
        btnTemperCalcStep2.addEventListener('click', () => {
             const tMdt = parseFloat(document.getElementById('temper_tmdt').value);
             const mptProcess = parseFloat(document.getElementById('temper_mpt_process').value);

             if (isNaN(tMdt) || isNaN(mptProcess)) {
                 alert("Please enter valid numbers for both T_MDT and MPT.");
                 return;
             }

             // Equation 2.6: T_MPT = min(T_MDT, MPT_process)
             const mptVal = Math.min(tMdt, mptProcess);
             
             // Display Result
             const resultEl = document.getElementById('temper_step_2_result');
             const mptValEl = document.getElementById('temper_mpt_val');
             const s3Container = document.getElementById('temper_step_3_container');
             const unit = document.querySelector('.temper-unit-selector') ? document.querySelector('.temper-unit-selector').value : 'F';

             mptValEl.textContent = mptVal.toFixed(1);
             document.querySelectorAll('.temper-unit-display').forEach(el => el.textContent = '°' + unit);
             
             resultEl.classList.remove('hidden');

             // Save result to session
             let existingData = JSON.parse(sessionStorage.getItem('temper_embrittlement_data') || '{}');
             existingData.mpt = mptVal;
             sessionStorage.setItem('temper_embrittlement_data', JSON.stringify(existingData));

             // Auto-populate Step 3 CET
             const step3Cet = document.getElementById('temper_step3_cet');
             if(step3Cet) step3Cet.value = mptVal;

             // Proceed to Step 3
             s3Container.classList.remove('hidden');
        });
    }



    // -- Step 3 Logic (Calculate T_ref) --
    // Note: Reusing interpolate() from global scope or ensuring it exists.
    // Assuming interpolate() is available from earlier in the file.

    const btnTemperCalcStep3 = document.getElementById('btn_temper_calc_step3');
    if (btnTemperCalcStep3) {
        btnTemperCalcStep3.addEventListener('click', async () => {
             const matType = document.getElementById('temper_mat_type').value;
             const ysInput = document.getElementById('temper_yield_strength').value;
             const curveSelect = document.getElementById('temper_curve_select').value;
             
             if (!ysInput || !curveSelect) {
                 alert("Please enter Yield Strength and select an Exemption Curve.");
                 return;
             }

             const ys = parseFloat(ysInput);
             const curve = curveSelect.replace('Curve ', '').toLowerCase(); // a, b, c, d
             
             // Determine Unit from UI context (similar to global sync)
             const unitEl = document.querySelector('.temper-unit-display');
             const isMetric = unitEl && unitEl.textContent.includes('C');
             
             const tableFile = isMetric ? 'table_2_e_3_3m.json' : 'table_2_e_3_3.json';

             try {
                // Fetch Data
                const response = await fetch(`/static/formula_app/data/${tableFile}`);
                if(!response.ok) throw new Error("Failed to load reference data.");
                const tableData = await response.json();

                // Select Data Set
                let dataSet = [];
                if (matType === 'Carbon Steel') {
                    dataSet = tableData.carbon_steels;
                } else {
                    dataSet = tableData.low_alloy_steels;
                }

                if(!dataSet || dataSet.length === 0) throw new Error("Data set not found.");

                // Interpolation Logic
                // 1. Sort by Yield Strength
                dataSet.sort((a, b) => a.min_yield_strength - b.min_yield_strength);

                // 2. Find Bracketing Points
                const minYS = dataSet[0].min_yield_strength;
                const maxYS = dataSet[dataSet.length - 1].min_yield_strength;
                
                let tRef = null;

                if (ys <= minYS) {
                    tRef = dataSet[0][`curve_${curve}`];
                } else if (ys >= maxYS) {
                    tRef = dataSet[dataSet.length - 1][`curve_${curve}`];
                } else {
                    for (let i = 0; i < dataSet.length - 1; i++) {
                        const p1 = dataSet[i];
                        const p2 = dataSet[i+1];
                        
                        if (ys >= p1.min_yield_strength && ys <= p2.min_yield_strength) {
                            const x1 = p1.min_yield_strength;
                            const y1 = p1[`curve_${curve}`];
                            const x2 = p2.min_yield_strength;
                            const y2 = p2[`curve_${curve}`];
                            
                            // Simple linear interpolation
                            if (x2 === x1) tRef = y1;
                            else tRef = y1 + (ys - x1) * (y2 - y1) / (x2 - x1);
                            
                            break;
                        }
                    }
                }

                // Display Result
                const resultArea = document.getElementById('temper_step_3_result');
                const trefValSpan = document.getElementById('temper_tref_val');
                const trefUnitSpan = document.querySelector('.temper-unit-display') ? document.querySelector('.temper-unit-display').textContent : '°F';
                
                if(tRef !== null) {
                    resultArea.classList.remove('hidden');
                    trefValSpan.textContent = tRef.toFixed(1);
                    // Update all unit displays just in case
                    document.querySelectorAll('.temper-unit-display').forEach(el => el.textContent = trefUnitSpan);

                    // Save to Session
                    let existingData = JSON.parse(sessionStorage.getItem('temper_embrittlement_data') || '{}');
                    existingData.matType = matType;
                    existingData.yieldStrength = ys;
                    existingData.exemptionCurve = curveSelect;
                    existingData.tRef = tRef;
                    sessionStorage.setItem('temper_embrittlement_data', JSON.stringify(existingData));

                    // --- Step 4: Delta FATT & MPT Logic ---
                    console.log("Calling handleStep4Logic with", tRef, isMetric);
                    // --- Step 4: Delta FATT & MPT Logic ---
                    console.log("Calling handleTemperStep4Logic with", tRef, isMetric);
                    handleTemperStep4Logic(tRef, isMetric);
                }

             } catch (err) {
                 console.error(err);
                 alert("Error determining Tref. Please check inputs or try again.");
             }
        });
    }

    // Sync Unit Label for Temper YS
    function syncTemperUnits() {
        const storedDataRaw = sessionStorage.getItem('common_inputs');
        if(storedDataRaw) {
            const data = JSON.parse(storedDataRaw);
            const isMetric = data.measurement_unit && data.measurement_unit.toLowerCase() === 'celsius';
            
            const ysUnit = document.getElementById('temper_ys_unit');
            if(ysUnit) {
               ysUnit.textContent = isMetric ? "MPa" : "ksi"; 
            }
        }
    }
    syncTemperUnits(); // Run safely

    // --- End Step 6 ---

    // --- Temper Embrittlement Exclusive Logic ---
    
    function handleTemperStep4Logic(tRef, isMetric) {
        const step4Container = document.getElementById('temper_step_4_container');
        const alertAuto = document.getElementById('temper_step4_alert_auto');
        const methodSection = document.getElementById('temper_step4_method_section');
        const methodSelect = document.getElementById('temper_step4_method_select');
        const btnCalc = document.getElementById('btn_temper_calc_step4');

        if(!step4Container) {
            console.error("Temper Step 4 Container NOT FOUND in DOM");
            return;
        }
        
        step4Container.classList.remove('hidden');
        step4Container.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Logic similar to Carbon, but scoped to Temper inputs
        // Check for Existing Delta FATT in temper_embrittlement_data
        let existingDeltaFatt = null;
        let existingYear = null;
        let serviceLifeYears = 0;

        const storedInputs = sessionStorage.getItem('temper_embrittlement_data');
        if(storedInputs) {
            const data = JSON.parse(storedInputs);
            if(data.deltaFatt && String(data.deltaFatt).trim() !== "") {
                existingDeltaFatt = parseFloat(data.deltaFatt);
            }
            if(data.serviceYears) {
                const sy = parseFloat(data.serviceYears);
                if(!isNaN(sy)) serviceLifeYears = sy;
            }
            
             const t41 = JSON.parse(sessionStorage.getItem('table4.1_data') || '{}');
             if(t41.start_date) {
                 const y = new Date(t41.start_date).getFullYear();
                 if(!isNaN(y)) existingYear = y;
             }
        }

        if(existingDeltaFatt !== null && !isNaN(existingDeltaFatt)) {
            // Auto-calc
            alertAuto.classList.add('hidden');
            methodSection.classList.add('hidden');
            if(btnCalc && btnCalc.parentElement) btnCalc.parentElement.classList.add('hidden');
            
            calculateTemperStep4(tRef, existingDeltaFatt, isMetric);
        } else {
            // Manual
            alertAuto.classList.add('hidden');
            methodSection.classList.remove('hidden');
            if(btnCalc && btnCalc.parentElement) btnCalc.parentElement.classList.remove('hidden');
            
            // Re-attach listeners explicitly to new new IDs
            methodSelect.onchange = (e) => toggleTemperStep4Inputs(e.target.value, existingYear);
            
            // Button Listener
             btnCalc.onclick = () => {
                const method = methodSelect.value;
                let deltaFatt = 0;

                try {
                    if(method === 'method1') {
                        const val = parseFloat(document.getElementById('temper_step4_input_manual_fatt').value);
                        if(isNaN(val)) throw new Error("Please enter a valid Delta FATT value.");
                        deltaFatt = val;
                    } 
                    else if(method === 'method2') {
                        const sce = parseFloat(document.getElementById('temper_step4_input_sce').value);
                        if(isNaN(sce)) throw new Error("Please enter a valid SCE value.");
                        if(serviceLifeYears <= 0) throw new Error("Service Life invalid.");
                        const ageHours = serviceLifeYears * 8760; 
                        deltaFatt = 0.67 * (Math.log10(ageHours) - 0.91) * sce; 
                    } 
                    else if(method === 'method3') {
                        const type = document.querySelector('input[name="temper_step4_comp_type"]:checked').value;
                        if(type === 'j_factor') {
                            const si = parseFloat(document.getElementById('temper_step4_chem_si').value);
                            const mn = parseFloat(document.getElementById('temper_step4_chem_mn').value);
                            const p = parseFloat(document.getElementById('temper_step4_chem_p').value);
                            const sn = parseFloat(document.getElementById('temper_step4_chem_sn').value);
                            if(isNaN(si) || isNaN(mn) || isNaN(p) || isNaN(sn)) throw new Error("Invalid composition values.");
                            const j = (si + mn) * (p + sn) * 10000;
                            deltaFatt = -77.321 + (0.57570 * j) - (0.00055147 * j * j);
                        } else {
                            const p = parseFloat(document.getElementById('temper_step4_xb_p').value);
                            const sb = parseFloat(document.getElementById('temper_step4_xb_sb').value);
                            const sn = parseFloat(document.getElementById('temper_step4_xb_sn').value);
                            const as = parseFloat(document.getElementById('temper_step4_xb_as').value);
                             if(isNaN(p) || isNaN(sb) || isNaN(sn) || isNaN(as)) throw new Error("Invalid composition values.");
                            const x = (10 * p + 5 * sb + 4 * sn + as) * 100;
                            deltaFatt = -87.335 + (11.437 * x) - (0.1472 * x * x);
                        }
                        if(deltaFatt < 0) deltaFatt = 0;
                    } 
                    else if(method === 'method4') {
                         if(!existingYear) throw new Error("Fabrication Year unknown.");
                         if(existingYear > 1988) deltaFatt = 150;
                         else if(existingYear >= 1981) deltaFatt = 250;
                         else if(existingYear >= 1973) deltaFatt = 300;
                         else deltaFatt = 350; 
                    }
                    else {
                        throw new Error("Please select a method.");
                    }
                    
                    calculateTemperStep4(tRef, deltaFatt, isMetric);

                } catch(e) {
                    alert(e.message);
                }
            };
        }
    }

    function toggleTemperStep4Inputs(method, year) {
        ['temper_step4_inputs_method1', 'temper_step4_inputs_method2', 'temper_step4_inputs_method3', 'temper_step4_inputs_method4'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });

        if(method) {
            const el = document.getElementById('temper_step4_inputs_' + method);
            if(el) el.classList.remove('hidden');
            if(method === 'method4') {
                const inp = document.getElementById('temper_step4_input_year_confirm');
                if(inp) inp.value = year || "Unknown";
            }
        }
    }

    function calculateTemperStep4(tRef, deltaFatt, isMetric) {
        const mpt = tRef + deltaFatt;
        
        document.getElementById('temper_step4_result_area').classList.remove('hidden');
        document.getElementById('temper_res_delta_fatt').textContent = deltaFatt.toFixed(1);
        document.getElementById('temper_res_step4_tref').textContent = tRef.toFixed(1);
        document.getElementById('temper_res_mpt').textContent = mpt.toFixed(1);
        
        // Show Step 5
        const step5Container = document.getElementById('temper_step_5_container');
        if(step5Container) {
            step5Container.classList.remove('hidden');
            step5Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Auto-populate Thickness
            const thickInput = document.getElementById('temper_thickness');
            if (thickInput) {
                const storedDataRaw = sessionStorage.getItem('table4.1_data');
                if(storedDataRaw) {
                    try {
                         const data = JSON.parse(storedDataRaw);
                         if (data.thickness !== undefined && !isNaN(data.thickness)) {
                            thickInput.value = data.thickness;
                            thickInput.setAttribute('readonly', 'true');
                            thickInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                         }
                    } catch(e) {}
                }
            }
        }
    }

    // Toggle J/X for Temper Method 3
    document.querySelectorAll('input[name="temper_step4_comp_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.value === 'j_factor') {
                document.getElementById('temper_group_j_factor').classList.remove('hidden');
                document.getElementById('temper_group_x_bar').classList.add('hidden');
            } else {
                document.getElementById('temper_group_j_factor').classList.add('hidden');
                document.getElementById('temper_group_x_bar').classList.remove('hidden');
            }
        });
    });

    // Step 5: Temper Base DF Logic
    const btnTemperCalcBaseDf = document.getElementById('btn_temper_calc_base_df');
    if(btnTemperCalcBaseDf) {
        btnTemperCalcBaseDf.addEventListener('click', async () => {
             const pwhtStr = document.getElementById('temper_pwht_select').value; // Yes/No
             const thickness = parseFloat(document.getElementById('temper_thickness').value);

             if(isNaN(thickness)) {
                 alert("Component Thickness is missing or invalid (check Basic Data).");
                 return;
             }

             // Need MDT (from prior step 2 result) and MPT (from step 4 result)
             // Or 'Delta T' = T_min - T_ref_new?
             // API 581 Part 2, 2.E.3.4 says "Base Damage Factor ... Table 2.E.3.4" based on Delta T = T_min - MPT
             // T_min is Step 1 minOpTemp. 
             // MPT is T_ref + Delta FATT.

             // Retrieve values
             const temperData = JSON.parse(sessionStorage.getItem('temper_embrittlement_data') || '{}');
             const minOpTemp = parseFloat(temperData.minOpTemp);
             
             // MPT is in standard inputs? No, we just calculated it in Step 4.
             // We can grab it from textContent or re-calculate. TextContent is easiest.
             const mptText = document.getElementById('temper_res_mpt').textContent;
             const mpt = parseFloat(mptText);

             if(isNaN(minOpTemp) || isNaN(mpt)) {
                 alert("Missing Minimum Operating Temperature or MPT calculation.");
                 return;
             }

             const deltaT = minOpTemp - mpt;
             
             // Determine Table File: No PWHT vs PWHT
             // Actually table 2.E.3.4 is one table OR split?
             // API 581 typically has "Table 2.E.3.4 - Base Damage Factor"
             // Usually it depends on PWHT. 
             // IF NO PWHT -> Use regular. IF PWHT -> use specific curves or multipliers?
             // Checking JSON files... Assuming 'table_2_e_3_4.json' is available.
             // Wait, previous code 'calculateStep4' (wrongly named DF calc) used 'table_2_e_3_4.json' (NO PWHT) and 'table_2_e_3_5.json' (PWHT)?
             // Let's infer from logic.
             // User provided `table_2_e_3_4.json` and `table_2_e_3_5.json`.
             // 2.E.3.4 is usually "Non-PWHT" and 2.E.3.5 is "PWHT".
             
             const tableFile = (pwhtStr === 'Yes') ? 'table_2_e_3_5.json' : 'table_2_e_3_4.json';
             
             try {
                 const response = await fetch(`/static/formula_app/data/${tableFile}`);
                 if(!response.ok) throw new Error("Failed to load DF data table.");
                 const tableData = await response.json();
                 
                 // Reuse interpolation logic (similar to Carbon but localized variables)
                 const tCols = tableData.thicknesses; 
                 const rows = tableData.rows; 

                 // 1. Thickness Indices
                 let tIdx1 = 0, tIdx2 = 0;
                 if (thickness <= tCols[0]) { tIdx1=0; tIdx2=0; }
                 else if (thickness >= tCols[tCols.length-1]) { tIdx1=tCols.length-1; tIdx2=tCols.length-1; }
                 else {
                     for(let i=0; i<tCols.length-1; i++) {
                         if(thickness >= tCols[i] && thickness <= tCols[i+1]) {
                             tIdx1=i; tIdx2=i+1; break;
                         }
                     }
                 }

                 // 2. DeltaT Indices (Descending)
                 let rIdx1 = 0, rIdx2 = 0;
                 if (deltaT >= rows[0].delta_t) { rIdx1=0; rIdx2=0; }
                 else if (deltaT <= rows[rows.length-1].delta_t) { rIdx1=rows.length-1; rIdx2=rows.length-1; }
                 else {
                     for(let i=0; i<rows.length-1; i++) {
                         if(deltaT <= rows[i].delta_t && deltaT >= rows[i+1].delta_t) {
                             rIdx1=i; rIdx2=i+1; break;
                         }
                     }
                 }

                 const getDfAtRow = (rIdx, thick, tI1, tI2, tCols) => {
                     const rowVals = rows[rIdx].values;
                     const val1 = rowVals[tI1], val2 = rowVals[tI2];
                     if(tI1===tI2) return val1;
                     return interpolate(thick, tCols[tI1], val1, tCols[tI2], val2);
                 };

                 const dfRow1 = getDfAtRow(rIdx1, thickness, tIdx1, tIdx2, tCols);
                 const dfRow2 = getDfAtRow(rIdx2, thickness, tIdx1, tIdx2, tCols);

                 const t1 = rows[rIdx1].delta_t;
                 const t2 = rows[rIdx2].delta_t;
                 
                 let finalBaseDf = (rIdx1===rIdx2) ? dfRow1 : interpolate(deltaT, t1, dfRow1, t2, dfRow2);
                 
                 // Show Result
                 document.getElementById('temper_step5_result_area').classList.remove('hidden');
                 document.getElementById('temper_base_df_val').textContent = finalBaseDf.toFixed(2);
                 
                 // Save
                 temperData.baseDf = finalBaseDf.toFixed(2);
                 sessionStorage.setItem('temper_embrittlement_data', JSON.stringify(temperData));

                 // Reveal Step 6
                 const step6Container = document.getElementById('temper_step_6_container');
                 if(step6Container) {
                     step6Container.classList.remove('hidden');
                     step6Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }

             } catch(e) {
                 console.error(e);
                 alert("Error calculating Base DF: " + e.message);
             }
        });
    }

    // Step 6: Temper Final DF Logic
    const btnTemperCalcFinalDf = document.getElementById('btn_temper_calc_final_df');
    if(btnTemperCalcFinalDf) {
        btnTemperCalcFinalDf.addEventListener('click', () => {
             const baseDfText = document.getElementById('temper_base_df_val').textContent;
             const fseVal = parseFloat(document.getElementById('temper_fse_select').value);

             if(baseDfText === '--' || isNaN(parseFloat(baseDfText))) {
                 alert("Base Damage Factor not calculated.");
                 return;
             }
             
             const baseDf = parseFloat(baseDfText);
             const finalDf = baseDf * fseVal;

             document.getElementById('temper_step6_result_area').classList.remove('hidden');
             const output = document.getElementById('temper_final_df_val');
             output.textContent = finalDf.toFixed(2);
             
             // Save Final Result
             let temperData = JSON.parse(sessionStorage.getItem('temper_embrittlement_data') || '{}');
             temperData.fse = fseVal;
             temperData.finalDF = finalDf.toFixed(2);
             sessionStorage.setItem('temper_embrittlement_data', JSON.stringify(temperData));
             
             // Also update main result object? 
             // Typically we want a unified result object.
             // But for now, session storage is fine.
        });
    }

    // -------------------------------------------------------------------------
    // 885°F Embrittlement Logic
    // -------------------------------------------------------------------------

    const btnBrit885Confirm = document.getElementById('btn_brit885_confirm');
    if (btnBrit885Confirm) {
        btnBrit885Confirm.addEventListener('click', handleBrit885Step1);
    }

    function handleBrit885Step1() {
        const adminControlsSelect = document.getElementById('brit885_admin_controls');
        const minOpTempInput = document.getElementById('brit885_min_op_temp');
        const resultContainer = document.getElementById('brit885_step1_result');
        const step2Container = document.getElementById('brit885_step2_container');
        const step3Container = document.getElementById('brit885_step3_container');
        const msgDiv = document.getElementById('brit885_step1_msg');

        if (!adminControlsSelect || !minOpTempInput || !resultContainer) {
            console.error("885 Step 1 elements missing");
            return;
        }

        const adminControls = adminControlsSelect.value;
        const minOpTemp = parseFloat(minOpTempInput.value);

        if (!adminControls) {
            alert("Please select if Administrative Controls are present.");
            return;
        }

        // Reset displays
        resultContainer.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');

        resultContainer.classList.remove('hidden');

        let Brit885Data = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
        Brit885Data.adminControls = adminControls;

        if (adminControls === 'Yes') {
            // Protocol A: Use Min Operating Temp as Tmin
            if (isNaN(minOpTemp)) {
                 alert("Please enter a valid Minimum Operating Temperature.");
                 resultContainer.classList.add('hidden');
                 return;
            }

            msgDiv.innerHTML = `
                Administrative controls <strong>prevent</strong> pressurization below a critical temperature.<br>
                <span class="text-green-600 font-bold">Protocol A:</span> Use Minimum Operating Temperature as T<sub>min</sub>.
            `;
            
            Brit885Data.tMin = minOpTemp;
            Brit885Data.protocol = 'A';
            
            // Proceed to Step 3
            step3Container.classList.remove('hidden');

        } else {
            // Protocol B: Determine Tmin (Step 2)
             msgDiv.innerHTML = `
                Administrative controls do <strong>NOT</strong> prevent pressurization.<br>
                <span class="text-orange-600 font-bold">Protocol B:</span> Proceed to Step 2 to determine T<sub>min</sub>.
            `;
            
            Brit885Data.protocol = 'B';
            
            // Proceed to Step 2
            step2Container.classList.remove('hidden');
        }
        
        sessionStorage.setItem('brit885_data', JSON.stringify(Brit885Data));
    }

    const btnBrit885Step2Confirm = document.getElementById('btn_brit885_step2_confirm');
    if (btnBrit885Step2Confirm) {
        btnBrit885Step2Confirm.addEventListener('click', () => {
            const designTempInput = document.getElementById('brit885_design_temp');
            const upsetTempInput = document.getElementById('brit885_upset_temp');
            const resultArea = document.getElementById('brit885_step2_result');
            const tMinValDisplay = document.getElementById('brit885_tmin_val');
            const step3Container = document.getElementById('brit885_step3_container');

            if (!designTempInput || !upsetTempInput) return;

            const designTemp = parseFloat(designTempInput.value);
            const upsetTemp = parseFloat(upsetTempInput.value);

            if (isNaN(designTemp) || isNaN(upsetTemp)) {
                alert("Please enter valid temperatures for both Design and Upset conditions.");
                return;
            }

            const tMin = Math.min(designTemp, upsetTemp);

            // Display Result
            if (resultArea && tMinValDisplay) {
                resultArea.classList.remove('hidden');
                tMinValDisplay.textContent = tMin.toFixed(2);
            }

            // Save Data
            let Brit885Data = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
            Brit885Data.designTemp = designTemp;
            Brit885Data.upsetTemp = upsetTemp;
            Brit885Data.tMin = tMin;
            sessionStorage.setItem('brit885_data', JSON.stringify(Brit885Data));

            // Proceed to Step 3
            if (step3Container) {
                step3Container.classList.remove('hidden');
                step3Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Run auto-population
    autoPopulateBrittleFracture();

    // -------------------------------------------------------------------------
    // Helper: Update Step 3 Display
    // -------------------------------------------------------------------------
    function updateBrit885Step3() {
        const step3Container = document.getElementById('brit885_step3_container');
        const tRefDisplay = document.getElementById('brit885_tref_display');
        const tRefMsg = document.getElementById('brit885_tref_source_msg');
        const tRefInput = document.getElementById('brit885_tref');

        if (!step3Container || !tRefDisplay || !tRefMsg) return;

        let tRefVal = 80; // Default
        let sourceMsg = "Default API 581 value used.";

        if (tRefInput && tRefInput.value && !isNaN(parseFloat(tRefInput.value))) {
            tRefVal = parseFloat(tRefInput.value);
            sourceMsg = "Based on user input in Required Data.";
        }

        tRefDisplay.textContent = tRefVal.toFixed(2);
        tRefMsg.textContent = sourceMsg;
        
        let Brit885Data = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
        Brit885Data.tRef = tRefVal;
        sessionStorage.setItem('brit885_data', JSON.stringify(Brit885Data));
    }

    // Trigger Step 3 update when entering it
    // We hook into existing Confirm buttons
    const originalMx885Step1 = handleBrit885Step1;
    handleBrit885Step1 = function() {
        originalMx885Step1();
        // If Admin Controls = Yes, we go straight to Step 3
        const resultContainer = document.getElementById('brit885_step1_result');
        if (resultContainer && !resultContainer.classList.contains('hidden')) {
             const adminControls = document.getElementById('brit885_admin_controls').value;
             if (adminControls === 'Yes') {
                 updateBrit885Step3();
             }
        }
    }
    
    // Also update when confirming Step 2
    if (btnBrit885Step2Confirm) {
        const originalStep2Click = btnBrit885Step2Confirm.onclick; // Note: we used addEventListener, so this might not work as intended for hooking.
        // Better to add another listener since we can have multiple.
        btnBrit885Step2Confirm.addEventListener('click', () => {
             updateBrit885Step3();
        });
    }

    // -------------------------------------------------------------------------
    // Step 5: Check Impact Energy (DF Lookup)
    // -------------------------------------------------------------------------
    let brit885TableData = null;

    // Fetch the table data
    fetch('/static/formula_app/js/modules/brittle_fracture/data/brit885_damage_factor.json')
        .then(response => response.json())
        .then(data => {
            brit885TableData = data;
        })
        .catch(error => console.error('Error loading 885 DF table:', error));

    function calculateBrit885Step5(diff) {
        if (!brit885TableData) {
            console.warn("Table 2.E.5.3 data not loaded yet.");
            return;
        }

        const dfValDisplay = document.getElementById('brit885_df_val');
        const step5Container = document.getElementById('brit885_step5_container');
        
        // Find interpolation range
        // Table is sorted descending by temp_diff_f (100 down to -100)
        let df = 0;
        
        // Handle out of bounds
        if (diff > 100) {
            df = 0;
        } else if (diff < -100) {
            df = 1381;
        } else {
            // Interpolate
            for (let i = 0; i < brit885TableData.length - 1; i++) {
                const p1 = brit885TableData[i];
                const p2 = brit885TableData[i + 1];
                
                if (diff <= p1.temp_diff_f && diff >= p2.temp_diff_f) {
                    // Linear interpolation formula: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
                    // x = diff, y = df
                    const x = diff;
                    const x1 = p1.temp_diff_f;
                    const y1 = p1.df;
                    const x2 = p2.temp_diff_f;
                    const y2 = p2.df;
                    
                    df = y1 + (x - x1) * (y2 - y1) / (x2 - x1);
                    break;
                }
            }
        }
        
        // Save and Display
        let Brit885Data = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
        Brit885Data.df = Math.round(df); // DF is usually an integer
        sessionStorage.setItem('brit885_data', JSON.stringify(Brit885Data));

        if (step5Container && dfValDisplay) {
            step5Container.classList.remove('hidden');
            dfValDisplay.textContent = Math.round(df);
            step5Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Step 3 Confirm (Proceed to Step 4)
    const btnBrit885Step3Confirm = document.getElementById('btn_brit885_step3_confirm');
    if (btnBrit885Step3Confirm) {
        btnBrit885Step3Confirm.addEventListener('click', () => {
             calculateBrit885Step4();
             // Also trigger governing update
             setTimeout(calculateGoverningBrittleDF, 500); 
        });
    }

    function calculateBrit885Step4() {
        const resultArea = document.getElementById('brit885_step4_result');
        const diffValDisplay = document.getElementById('brit885_diff_val');
        
        let Brit885Data = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
        const tMin = Brit885Data.tMin;
        const tRef = Brit885Data.tRef;

        if (tMin === undefined || tRef === undefined) {
            console.warn("Missing Tmin or Tref data for Step 4 calculation.");
            return;
        }

        const diff = tMin - tRef;
        Brit885Data.diff = diff;
        sessionStorage.setItem('brit885_data', JSON.stringify(Brit885Data));

        if (resultArea && diffValDisplay) {
            resultArea.classList.remove('hidden');
            diffValDisplay.textContent = diff.toFixed(2);
        }

        // Trigger Step 5 immediately
        calculateBrit885Step5(diff);
    }

    // -------------------------------------------------------------------------
    // Sigma Phase Embrittlement Logic
    // -------------------------------------------------------------------------
    
    // Confirm & Next Button
    const btnSigmaConfirm = document.getElementById('btn_sigma_confirm');
    if (btnSigmaConfirm) {
        btnSigmaConfirm.addEventListener('click', () => {
            const adminControls = document.getElementById('sigma_admin_controls').value;
            const minOpTemp = document.getElementById('sigma_min_op_temp').value;
            const amountSigma = document.getElementById('sigma_amount').value;
            const step2Container = document.getElementById('sigma_step2_container');

            if (!adminControls || !minOpTemp || !amountSigma) {
                alert("Please fill in all required fields.");
                return;
            }

            const SigmaData = {
                adminControls: adminControls,
                minOpTemp: parseFloat(minOpTemp),
                amountSigma: amountSigma
            };

            sessionStorage.setItem('sigma_phase_data', JSON.stringify(SigmaData));
            
            sessionStorage.setItem('sigma_phase_data', JSON.stringify(SigmaData));
            
            // Show Step 1 Container
            const step1Container = document.getElementById('sigma_step1_container');
            const step1TminDisplay = document.getElementById('sigma_tmin_val');

            if (step1Container && step1TminDisplay) {
                step1TminDisplay.textContent = parseFloat(minOpTemp).toFixed(2);
                step1Container.classList.remove('hidden');
                step1Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Step 1 Confirm (Proceed to Step 2)
    const btnSigmaStep1Confirm = document.getElementById('btn_sigma_step1_confirm');
    if (btnSigmaStep1Confirm) {
        btnSigmaStep1Confirm.addEventListener('click', () => {
             const step2Container = document.getElementById('sigma_step2_container');
             const amountSigmaDisplay = document.getElementById('sigma_amount_val');
             
             // Retrieve data from sessionStorage
             const storedData = sessionStorage.getItem('sigma_phase_data');
             let amountSigma = '--';
             if (storedData) {
                 const parsedData = JSON.parse(storedData);
                 if (parsedData.amountSigma) {
                     amountSigma = parsedData.amountSigma;
                 }
             }

             if (step2Container && amountSigmaDisplay) {
                 amountSigmaDisplay.textContent = amountSigma;
                 step2Container.classList.remove('hidden');
                 step2Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }
        });
    }

    // Load Sigma Table
    let sigmaTableData = null;
    fetch('/static/formula_app/js/modules/brittle_fracture/data/sigma_damage_factor.json')
        .then(response => response.json())
        .then(data => {
            sigmaTableData = data;
        })
        .catch(error => console.error('Error loading Sigma DF table:', error));

    function calculateSigmaStep3() {
        if (!sigmaTableData) {
            console.warn("Sigma Table data not loaded yet.");
            return;
        }

        const dfValDisplay = document.getElementById('sigma_df_val');
        const step3Container = document.getElementById('sigma_step3_container');

        // Get Data
        const storedData = sessionStorage.getItem('sigma_phase_data');
        if (!storedData) return;
        const parsedData = JSON.parse(storedData);
        let tMin = parseFloat(parsedData.minOpTemp);
        let sigmaAmount = parsedData.amountSigma; // "Low", "Medium", "High"

        if (isNaN(tMin) || !sigmaAmount) return;

        // Map sigmaAmount to JSON key
        let key = 'df_low';
        if (sigmaAmount === 'Medium') key = 'df_medium';
        if (sigmaAmount === 'High') key = 'df_high';

        let df = 0;
        
        // Handle out of bounds (Table range: -50 to 1200 F)
        if (tMin > 1200) {
            // Use 1200 value
            df = sigmaTableData[0][key]; 
        } else if (tMin < -50) {
            // Use -50 value
            df = sigmaTableData[sigmaTableData.length - 1][key];
        } else {
            // Interpolate
            for (let i = 0; i < sigmaTableData.length - 1; i++) {
                const p1 = sigmaTableData[i];
                const p2 = sigmaTableData[i + 1];
                
                if (tMin <= p1.temp_f && tMin >= p2.temp_f) {
                    // Linear interpolation
                    // x = tMin, y = df
                    const x = tMin;
                    const x1 = p1.temp_f;
                    const y1 = p1[key];
                    const x2 = p2.temp_f;
                    const y2 = p2[key];
                    
                    df = y1 + (x - x1) * (y2 - y1) / (x2 - x1);
                    break;
                }
            }
        }
        
        // Save
        parsedData.df = parseFloat(df.toFixed(2));
        sessionStorage.setItem('sigma_phase_data', JSON.stringify(parsedData));

        // Display
        if (step3Container && dfValDisplay) {
            dfValDisplay.textContent = parsedData.df;
            step3Container.classList.remove('hidden');
            step3Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // -------------------------------------------------------------------------
    // Governing Brittle Fracture DF Logic (Equation 2.7)
    // -------------------------------------------------------------------------

    function calculateGoverningBrittleDF() {
        const govContainer = document.getElementById('brittle_governing_df_container');
        const govDfVal = document.getElementById('brittle_governing_df_val');
        const debugGeneral = document.getElementById('gov_debug_general');
        const debug885 = document.getElementById('gov_debug_885');
        const debugSigma = document.getElementById('gov_debug_sigma');

        if (!govContainer) return;

        // Check if checkboxes are checked
        const isBritChecked = document.getElementById('check_brit_carbon').checked;
        const isTempeChecked = document.getElementById('check_brit_tempe').checked;
        const is885Checked = document.getElementById('check_brit_885').checked;
        const isSigmaChecked = document.getElementById('check_brit_sigma').checked;

        // 1. Get General Brittle Fracture DF
        let dfBrit = 0;
        if (isBritChecked) {
            const britDataRaw = sessionStorage.getItem('brittle_fracture_result');
            if (britDataRaw) {
                try {
                    const data = JSON.parse(britDataRaw);
                    if (data.final_df) dfBrit = parseFloat(data.final_df);
                } catch (e) { console.error("Error parsing brittle_fracture_result", e); }
            } else {
                 const simpleDf = sessionStorage.getItem('brittle_final_df');
                 if(simpleDf) dfBrit = parseFloat(simpleDf);
            }
        }

        // 2. Get Temper Embrittlement DF
        let dfTempe = 0;
        if (isTempeChecked) {
            const tempeDataRaw = sessionStorage.getItem('temper_embrittlement_data');
            if (tempeDataRaw) {
                 try {
                     const data = JSON.parse(tempeDataRaw);
                     if (data.finalDF) dfTempe = parseFloat(data.finalDF);
                 } catch (e) {}
            }
        }

        // 3. Get 885 DF
        let df885 = 0;
        if (is885Checked) {
            const brit885DataRaw = sessionStorage.getItem('brit885_data');
            if (brit885DataRaw) {
                 try {
                     const data = JSON.parse(brit885DataRaw);
                     if (data.df) df885 = parseFloat(data.df);
                 } catch (e) {}
            }
        }

        // 4. Get Sigma DF
        let dfSigma = 0;
        if (isSigmaChecked) {
            const sigmaDataRaw = sessionStorage.getItem('sigma_phase_data');
            if (sigmaDataRaw) {
                 try {
                     const data = JSON.parse(sigmaDataRaw);
                     if (data.df) dfSigma = parseFloat(data.df);
                 } catch (e) {}
            }
        }
        
        // Handle NaNs
        if (isNaN(dfBrit)) dfBrit = 0;
        if (isNaN(dfTempe)) dfTempe = 0;
        if (isNaN(df885)) df885 = 0;
        if (isNaN(dfSigma)) dfSigma = 0;

        // Equation 2.7: max[(Df_brit + Df_tempe), Df_885, Df_sigma]
        // Note: Temper adds to General
        const term1 = dfBrit + dfTempe;
        
        const govDf = Math.max(term1, df885, dfSigma);

        // Display
        govDfVal.textContent = govDf.toFixed(2);
        
        // Debug/Breakdown Display
        if (debugGeneral) debugGeneral.textContent = isBritChecked || isTempeChecked ? `${dfBrit.toFixed(2)} + ${dfTempe.toFixed(2)} = ${term1.toFixed(2)}` : "Inactive";
        if (debug885) debug885.textContent = is885Checked ? df885.toFixed(2) : "Inactive";
        if (debugSigma) debugSigma.textContent = isSigmaChecked ? dfSigma.toFixed(2) : "Inactive";

        // Show/Hide container based on active status
        // If NO mechanisms are selected, hide it.
        if (!isBritChecked && !isTempeChecked && !is885Checked && !isSigmaChecked) {
            govContainer.classList.add('hidden');
        } else {
            govContainer.classList.remove('hidden');
        }
    }

    // Attach to Checkboxes (Reuse existing variable from top scope)
    if (mechCheckboxes.length > 0) {
        mechCheckboxes.forEach(chk => {
            chk.addEventListener('change', () => {
                 setTimeout(calculateGoverningBrittleDF, 100);
            });
        });
    }

    // Hook this function into the end of calculation chains
    const triggerIds = [
        'btn_calc_final_df', // General Brittle Final
        'btn_temper_calc_final_df', // Temper Final
        'btn_brit885_step5_confirm', // 885 Final (wait, 885 triggers Step 5 logic directly)
        'btn_sigma_step2_confirm' // Sigma trigger
    ];

    triggerIds.forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.addEventListener('click', () => {
                setTimeout(calculateGoverningBrittleDF, 500); 
            });
        }
    });

    document.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
             setTimeout(calculateGoverningBrittleDF, 800);
        });
    });

    // Initial check
    calculateGoverningBrittleDF();

});
