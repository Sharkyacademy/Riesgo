import { validateInputs } from '../../utils.js';



document.addEventListener('DOMContentLoaded', () => {
    
    // --- Selectors ---
    const sccCheckboxes = document.querySelectorAll('.scc-mech-check');
    const tabsContainer = document.getElementById('scc_tabs_container');
    const tabsList = document.getElementById('scc_tabs_list');
    const inputsPlaceholder = document.getElementById('scc_inputs_placeholder');
    
    const stepperControls = document.getElementById('scc_stepper_controls');
    const btnPrev = document.getElementById('btn_scc_prev');
    const btnNext = document.getElementById('btn_scc_next');

    // State
    let activeMechanisms = []; // Stores IDs: ['caustic', 'amine']
    let currentMechIndex = -1;

    // --- Interaction Logic ---
    
    sccCheckboxes.forEach(chk => {
        chk.addEventListener('change', (e) => {
            const mechId = e.target.id.replace('scc_mech_', ''); // e.g. 'caustic'
            
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

    if(btnPrev) {
        btnPrev.addEventListener('click', () => {
            if(currentMechIndex > 0) {
                currentMechIndex--;
                updateUI();
            }
        });
    }

    if(btnNext) {
        btnNext.addEventListener('click', () => {
            if(currentMechIndex < activeMechanisms.length - 1) {
                currentMechIndex++;
                updateUI();
            }
        });
    }

    // --- Core UI Functions ---

    function updateUI() {
        // 1. Toggle Tabs Visibility
        if(activeMechanisms.length > 0) {
            tabsContainer.classList.remove('hidden');
            stepperControls.classList.remove('hidden');
            inputsPlaceholder.classList.add('hidden');
        } else {
            tabsContainer.classList.add('hidden');
            stepperControls.classList.add('hidden');
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
            const activeContainer = document.getElementById(`cont_scc_${activeId}`);
            
            if(activeContainer) {
                activeContainer.classList.remove('hidden');
                
                // Initialize specific module logic if needed
                if(activeId === 'acscc') {
                    initACSCC();
                } else if (activeId === 'ciscc') {
                    initCLSCC();
                }
            } else {
                // Fallback for not-yet-implemented inputs
                console.warn(`Input interface for ${activeId} not found.`);
            }
        }

        // 4. Update Buttons
        if(btnPrev) btnPrev.disabled = (currentMechIndex <= 0);
        if(btnNext) btnNext.disabled = (currentMechIndex >= activeMechanisms.length - 1);
    }

    function renderTabs() {
        tabsList.innerHTML = '';
        
        activeMechanisms.forEach((mechId, index) => {
            const tab = document.createElement('a');
            tab.className = `tab flex-nowrap whitespace-nowrap ${index === currentMechIndex ? 'tab-active bg-white font-bold shadow-sm text-blue-900' : 'text-gray-500'}`;
            tab.textContent = formatMechName(mechId);
            
            tab.addEventListener('click', () => {
                currentMechIndex = index;
                updateUI();
            });

            tabsList.appendChild(tab);
        });
    }

    function hideAllInputGroups() {
        const groups = document.querySelectorAll('.scc-input-group');
        groups.forEach(g => g.classList.add('hidden'));
    }

    function formatMechName(id) {
        // Simple formatter
        const map = {
            'caustic': 'Caustic',
            'amine': 'Amine',
            'ssc': 'SSC',
            'hic_h2s': 'HIC/SOHIC-H2S',
            'acscc': 'Alk. Carbonate',
            'pascc': 'Polythionic',
            'ciscc': 'Chloride',
            'hsc_hf': 'HSC-HF',
            'hic_hf': 'HIC-HF'
        };
        return map[id] || id;
    }

    // --- Caustic Cracking Logic ---

    // --- Caustic Cracking Logic ---

    // Fetched Data Containers
    // Global variables to store chart data
let areaACurveData = null;
let severityIndexData = null;
let baseDamageFactorData = null; // Table 2.C.1.3 // Table 2.C.1.2
    let baseDFData = null; // Table 2.C.1.3

    // Load all necessary data
    Promise.all([
        fetch('/static/formula_app/data/json/scc_caustic_chart.json').then(r => r.json()),
        fetch('/static/formula_app/data/json/scc_severity_index.json').then(r => r.json()),
        fetch('/static/formula_app/data/json/scc_base_damage_factor.json').then(r => r.json())
    ])
    .then(([chartData, severityData, baseData]) => {
        areaACurveData = chartData;
        severityIndexData = severityData.mappings;
        baseDamageFactorData = baseData; // Use the direct data object if wrapped, typically my JSONs are wrapped in {data: ...}
        
        console.log("Caustic Data Loaded:", { areaACurveData, severityIndexData, baseDamageFactorData });
        
        // Initialize graph if image is present
        if (causticInputs.imgGraph) {
            causticInputs.imgGraph.onload = function() {
                // Initial draw (optional)
            };
        }
    })
    .catch(err => console.error("Error loading Caustic JSON data:", err));

    // Selectors for Caustic Inputs (Updated)
    const causticInputs = {
        cracksPresent: document.getElementById('scc_caustic_cracks_present'),
        cracksRemoved: document.getElementById('scc_caustic_cracks_removed'),
        stressRelieved: document.getElementById('scc_caustic_stress_relieved'),
        naohConc: document.getElementById('scc_caustic_naoh_conc'),
        temp: document.getElementById('scc_caustic_temp'),
        tempUnit: document.getElementById('scc_caustic_temp_unit'),
        isAreaA: document.getElementById('scc_caustic_area_a'),
        heatTraced: document.getElementById('scc_caustic_heat_traced'),
        steamedOut: document.getElementById('scc_caustic_steamed_out'),
        
        // Step 3
        divStep3: document.getElementById('div_scc_caustic_step3'),
        installDate: document.getElementById('scc_caustic_install_date'),
        valAge: document.getElementById('scc_caustic_age_val'),
        
        // Step 4
        divStep4: document.getElementById('div_scc_caustic_step4'),
        inspA: document.getElementById('scc_caustic_insp_A'),
        inspB: document.getElementById('scc_caustic_insp_B'),
        inspC: document.getElementById('scc_caustic_insp_C'),
        inspD: document.getElementById('scc_caustic_insp_D'),
        divStep4Result: document.getElementById('scc_caustic_step4_result'),
        valFinalEffCat: document.getElementById('scc_caustic_final_eff_cat'),
        valFinalEffCount: document.getElementById('scc_caustic_final_eff_count'),
        // Step 5
        divStep5: document.getElementById('div_scc_caustic_step5'),
        valBaseDF: document.getElementById('scc_caustic_base_df_val'),

        // Future Steps (Placeholders)

        // Containers
        divCracksRemoved: document.getElementById('div_scc_caustic_cracks_removed'),
        divStressRelieved: document.getElementById('div_scc_caustic_stress_relieved'),
        divDetails: document.getElementById('div_scc_caustic_details'),
        divHeatTraced: document.getElementById('div_scc_caustic_heat_traced'),
        divSteamedOut: document.getElementById('div_scc_caustic_steamed_out'),
        divExtendedCalcs: document.getElementById('div_scc_caustic_extended_calcs'),
        
        // Results
        divResult: document.getElementById('scc_caustic_result'),
        valSusceptibility: document.getElementById('scc_caustic_susceptibility_val'),
        valSVI: document.getElementById('scc_caustic_svi_val'),
        valBaseDF: document.getElementById('scc_caustic_base_df_val'),
        valFinalDF: document.getElementById('scc_caustic_final_df_val'),
        divGraph: document.getElementById('div_scc_caustic_graph'),
        imgGraph: document.querySelector('#div_scc_caustic_graph img') 
    };

    // Attach listeners
    Object.values(causticInputs).forEach(el => {
        if(el && (el.tagName === 'SELECT' || el.tagName === 'INPUT')) {
            el.addEventListener('change', updateCausticLogic);
            el.addEventListener('input', updateCausticLogic); 
        }
    });

    // --- Auto-Populate SCC Fields from Table 4.1 ---
    (function autoPopulateSCC() {
        const t41Str = sessionStorage.getItem("table4.1_data");
        if (!t41Str) return;

        try {
            const data = JSON.parse(t41Str);
            console.log("SCC Auto-Populate Data:", data);

            // 1. Install Date (Age)
            if (data.start_date) {
                if (causticInputs.installDate) {
                    causticInputs.installDate.value = data.start_date;
                    causticInputs.installDate.readOnly = true;
                    causticInputs.installDate.classList.add('bg-gray-100', 'cursor-not-allowed');
                }
                const reqAge = document.getElementById('req_scc_caustic_age');
                if (reqAge) {
                    reqAge.value = "Calculated from Step 3"; // Placeholder or calc logic
                    reqAge.readOnly = true;
                    reqAge.classList.add('bg-gray-100');
                }
                // Trigger Age Calc
                if (typeof calculateAgeFromDate === 'function') setTimeout(calculateAgeFromDate, 100);
            }

            // 2. Temperature
            const opTemp = data.max_operating_temp || data.operating_temp;
            if (opTemp) {
                if(causticInputs.temp) {
                    causticInputs.temp.value = opTemp;
                    causticInputs.temp.readOnly = true;
                    causticInputs.temp.classList.add('bg-gray-100', 'cursor-not-allowed');
                }
                const reqTemp = document.getElementById('req_scc_caustic_temp');
                if(reqTemp) {
                    reqTemp.value = opTemp;
                    reqTemp.readOnly = true;
                    reqTemp.classList.add('bg-gray-100', 'cursor-not-allowed');
                }
            }

            // 3. Units
            if (data.measurement_unit) {
                const isMetric = data.measurement_unit.toLowerCase() === "celsius";
                const unitVal = isMetric ? "C" : "F";
                
                if(causticInputs.tempUnit) {
                    causticInputs.tempUnit.value = unitVal;
                    causticInputs.tempUnit.disabled = true;
                    causticInputs.tempUnit.classList.add('bg-gray-100', 'cursor-not-allowed');
                }
                
                const reqUnit = document.getElementById('req_scc_caustic_temp_unit');
                if(reqUnit) {
                    reqUnit.value = unitVal;
                    reqUnit.disabled = true;
                    reqUnit.classList.add('bg-gray-100', 'cursor-not-allowed');
                }
            }

            // 4. Heat Tracing
            if (data.heat_tracing) {
                 const val = data.heat_tracing;
                 // Try to match value
                 let matched = false;
                 // Normalize for existing select
                 if(causticInputs.heatTraced) {
                     const validOpts = Array.from(causticInputs.heatTraced.options).map(o => o.value);
                     if (validOpts.includes(val)) {
                         causticInputs.heatTraced.value = val;
                         matched = true;
                     } else if (validOpts.includes(val.charAt(0).toUpperCase() + val.slice(1).toLowerCase())) {
                         causticInputs.heatTraced.value = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                         matched = true;
                     }
                     if (matched) {
                         causticInputs.heatTraced.disabled = true;
                         causticInputs.heatTraced.classList.add('bg-gray-100', 'cursor-not-allowed');
                     }
                 }
            }

            // 5. Steam Out (Table 4.1 might not have this, check data model)
            if (data.steam_out) {
                const reqSteamed = document.getElementById('req_scc_caustic_steamed_out');
                const stepSteamed = document.getElementById('scc_caustic_steamed_out');
                
                let val = data.steam_out;
                if(val === true) val = 'Yes';
                if(val === false) val = 'No';
                
                if(reqSteamed) {
                    reqSteamed.value = val;
                    reqSteamed.disabled = true;
                }
                if(stepSteamed) {
                    stepSteamed.value = val;
                    stepSteamed.disabled = true;
                }
            }

            // Trigger Update to refresh UI / Graphs
            setTimeout(() => {
                if (typeof updateCausticLogic === 'function') updateCausticLogic();
            }, 200);

            // Trigger SSC Auto-Populate
            if (typeof autoPopulateSSC === 'function') autoPopulateSSC(data);

        } catch (e) {
            console.error("SCC Auto-Populate Error", e);
        }
    })();

    // ... isPointInAreaA ... 

    function updateCausticLogic() {
        // 1. Manage Visibility
        const cracksPresent = causticInputs.cracksPresent.value;
        const cracksRemoved = causticInputs.cracksRemoved.value;
        const stressRelieved = causticInputs.stressRelieved.value;
        const heatTraced = causticInputs.heatTraced.value;
        
        // Inputs for Graph Logic
        const tempUnit = causticInputs.tempUnit ? causticInputs.tempUnit.value : 'F';
        const naohConc = parseFloat(causticInputs.naohConc.value);
        const temp = parseFloat(causticInputs.temp.value);
        
        // 1b. Update Graph Image & Labels based on Unit
        if (causticInputs.imgGraph) {
            if (tempUnit === 'C') {
                causticInputs.imgGraph.src = "/static/formula_app/img/nace_caustic_graph_m.png";
                document.getElementById('scc_caustic_temp').previousElementSibling.querySelector('span').innerText = "Max Process Temperature (deg C)";
                document.getElementById('scc_caustic_temp').placeholder = "e.g. 65"; // C example
            } else {
                causticInputs.imgGraph.src = "/static/formula_app/img/nace_caustic_graph_f.png";
                document.getElementById('scc_caustic_temp').previousElementSibling.querySelector('span').innerText = "Max Process Temperature (deg F)";
                document.getElementById('scc_caustic_temp').placeholder = "e.g. 150"; // F example
            }
        }



    // Helper: Determine if point is in Area A (Curve Digitization)
        // Determine Area A automatically
        const areaA = isPointInAreaA(naohConc, temp);
        
        // We set the hidden checkbox state
        causticInputs.isAreaA.checked = areaA; 

        if (cracksPresent === 'Yes') {
            causticInputs.divCracksRemoved.classList.remove('hidden');
        } else {
            causticInputs.divCracksRemoved.classList.add('hidden');
        }

        // Show/Hide Stress Relieved
        let showStressRelieved = false;
        if (cracksPresent === 'No') {
            showStressRelieved = true;
        } 
        
        if (showStressRelieved) {
            causticInputs.divStressRelieved.classList.remove('hidden');
        } else {
            causticInputs.divStressRelieved.classList.add('hidden');
        }

        // Show/Hide Details (Graph Inputs)
        let showDetails = false;
        if (cracksPresent === 'No' && stressRelieved === 'No') {
            showDetails = true;
        }

        const divGraph = document.getElementById('div_scc_caustic_graph');
        const badgeOverlay = document.getElementById('scc_caustic_graph_overlay');
        const badgeText = document.getElementById('scc_caustic_graph_badge');

        if (showDetails) {
            causticInputs.divDetails.classList.remove('hidden');
            if(divGraph) divGraph.classList.remove('hidden');
        } else {
            causticInputs.divDetails.classList.add('hidden');
            if(divGraph) divGraph.classList.add('hidden');
        }

        // Validation & Auto-Graph Logic
        let isValid = true;
        if(showDetails) {
             isValid = validateInputs([causticInputs.naohConc, causticInputs.temp]);
             
             // If valid, update graph badge
             if (isValid && badgeOverlay) {
                 badgeOverlay.classList.remove('hidden');
                 if (areaA) {
                     badgeText.innerText = "In Area 'A' (Safe Zone)";
                     badgeText.className = "badge badge-lg p-4 shadow-xl text-lg font-bold badge-success text-white";
                 } else {
                     badgeText.innerText = "Not in Area 'A' (Susceptible)";
                     badgeText.className = "badge badge-lg p-4 shadow-xl text-lg font-bold badge-warning text-white";
                 }
             } else if (badgeOverlay) {
                 badgeOverlay.classList.add('hidden');
             }
        }

        // Show/Hide Dependent Details
        const naohHigh = (!isNaN(naohConc) && naohConc >= 5);
        
        let showHeatTraced = false;
        if (showDetails && isValid) {
            if (areaA) {
                // In Area A
                if (naohConc < 5) {
                    showHeatTraced = true;
                } else {
                    showHeatTraced = true;
                }
            } else {
                // Not in Area A
                if (naohConc >= 5) {
                    showHeatTraced = true;
                }
            }
        }

        if (showHeatTraced) {
            causticInputs.divHeatTraced.classList.remove('hidden');
        } else {
            causticInputs.divHeatTraced.classList.add('hidden');
        }

        // Steamed Out
        if (showHeatTraced && heatTraced === 'No') {
            causticInputs.divSteamedOut.classList.remove('hidden');
        } else {
            causticInputs.divSteamedOut.classList.add('hidden');
        }

        // 2. Calculate Susceptibility
        let susceptibility = null;
        if (isValid || cracksPresent === 'Yes' || stressRelieved === 'Yes') {
             susceptibility = calculateCausticSusceptibility();
        }
        
        // 3. Update Result UI & Extended
        console.log("Susceptibility Result:", susceptibility);
        if (susceptibility) {
            causticInputs.divResult.classList.remove('hidden');
            causticInputs.valSusceptibility.innerText = susceptibility;
            // causticInputs.divResult.className = `alert mt-4 shadow-lg ${getSusceptibilityClass(susceptibility)}`; // Removed per user request
            
            // Sync with Table Input
            const reqSuscept = document.getElementById('req_scc_caustic_susceptibility');
            if(reqSuscept) reqSuscept.value = susceptibility;
            
            
            // 4. Extended Calculations (Now specifically Step 2)
            const divStep2 = document.getElementById('div_scc_caustic_step2');
            
            // Validate if we should proceed to Step 2
            // Don't show if Pending or FFS
            if (susceptibility.includes('FFS') || susceptibility.includes('Pending')) {
                 if(divStep2) divStep2.classList.add('hidden');
            } else {
                 if(divStep2) {
                     divStep2.classList.remove('hidden');
                     
                     // Execute Step 2 Logic
                     updateStep2SeverityIndex(susceptibility);
                     
                 } else {
                     console.error("CRITICAL: div_scc_caustic_step2 not found in DOM!");
                 }
            }
        } else {
            causticInputs.divResult.classList.add('hidden');
            const divStep2 = document.getElementById('div_scc_caustic_step2');
            if(divStep2) divStep2.classList.add('hidden');
        }
    }

    function updateStep2SeverityIndex(susceptibility) {
        if (!severityIndexData) {
            console.warn("SCC Severity Data not yet loaded.");
            return;
        }

        // Step 2: SVI Calculation
        let svi = 0;
        let category = 'None';
        
        if (susceptibility.includes('High')) category = 'High';
        else if (susceptibility.includes('Medium')) category = 'Medium';
        else if (susceptibility.includes('Low')) category = 'Low';
        else if (susceptibility.includes('Not')) category = 'None';
        
        svi = severityIndexData[category] || 0;
        
        // Update UI
        if(causticInputs.valSVI) {
             causticInputs.valSVI.innerText = svi;
             // Animate or highlight?
        }

        // Save to Session Storage
        sessionStorage.setItem('scc_caustic_svi', svi);
        sessionStorage.setItem('scc_caustic_susceptibility_cat', category);
        console.log(`Step 2 Complete: SVI=${svi} (Category=${category}) saved to SessionStorage.`);
        
        // Show Saved Message momentarily
        const msgSaved = document.getElementById('msg_step2_saved');
        if(msgSaved) {
            msgSaved.classList.remove('hidden');
            setTimeout(() => msgSaved.classList.add('hidden'), 3000);
        }

    // Reveal Step 3 (Logic for future steps)
        if(causticInputs.divStep3) {
            causticInputs.divStep3.classList.remove('hidden');
            
             // Check if Step 4 data is already ready (e.g. auto-populated age)
            const ageVal = sessionStorage.getItem('scc_caustic_age');
            const divStep4 = document.getElementById('div_scc_caustic_step4');
            if (ageVal && ageVal !== '--' && divStep4) {
                 divStep4.classList.remove('hidden');
            }
        }
    }



    // Initialize: Check if session has age
    // (Optional: restore date if needed, but not critical for now)    
    // --- Step 3 Logic: Age Calculation ---
    if(causticInputs.installDate) {
        causticInputs.installDate.addEventListener('change', calculateAgeFromDate);
    }
    
    function calculateAgeFromDate() {
        const dateVal = causticInputs.installDate.value;
        if (!dateVal) return;

        const installDate = new Date(dateVal);
        const currentDate = new Date();
        
        // Calculate difference in milliseconds
        const diffTime = currentDate - installDate;
        
        // Basic validation: Future dates
        if(diffTime < 0) {
            alert("Installation date cannot be in the future.");
            causticInputs.installDate.value = '';
            causticInputs.valAge.innerText = '--';
            return;
        }

        // Convert to years (approximate using 365.25 days)
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        const age = diffYears.toFixed(2); // 2 decimal places
        
        // Update UI
        if(causticInputs.valAge) {
            causticInputs.valAge.innerText = age;
        }
        // Sync Table Input
        const reqAge = document.getElementById('req_scc_caustic_age');
        if(reqAge) reqAge.value = age;

        // Save to Session
        sessionStorage.setItem('scc_caustic_age', age);
        console.log(`Step 3 Complete: Age=${age} years.`);
        
        // Reveal Step 4 ONLY if Step 3 is visible (meaning we are allowed to proceed)
        const divStep3 = document.getElementById('div_scc_caustic_step3');
        if (divStep3 && !divStep3.classList.contains('hidden')) {
            const divStep4 = document.getElementById('div_scc_caustic_step4');
            if(divStep4) divStep4.classList.remove('hidden');
        }
    }
    
    // --- Step 4 Logic: Inspection Effectiveness ---
    // Register listeners
    ['A', 'B', 'C', 'D'].forEach(cat => {
        const el = causticInputs[`insp${cat}`];
        if (el) el.addEventListener('change', calculateInspectionEffectiveness);
    });

    function calculateInspectionEffectiveness() {
        // Get raw counts
        let countA = parseInt(causticInputs.inspA.value) || 0;
        let countB = parseInt(causticInputs.inspB.value) || 0;
        let countC = parseInt(causticInputs.inspC.value) || 0;
        let countD = parseInt(causticInputs.inspD.value) || 0;

        // Apply Equivalence Rule (2 Lower = 1 Higher)
        // 2D -> 1C
        countC += Math.floor(countD / 2);
        // 2C -> 1B
        countB += Math.floor(countC / 2);
        // 2B -> 1A
        countA += Math.floor(countB / 2);

        // Determine Highest Effective Category
        let finalCat = 'E'; // Default None
        let finalCount = 0;

        if (countA > 0) {
            finalCat = 'A';
            finalCount = countA;
        } else if (countB > 0) {
            finalCat = 'B';
            finalCount = countB;
        } else if (countC > 0) {
            finalCat = 'C';
            finalCount = countC;
        } else if (countD > 0) { // Should rarely happen if everything promotes, but possible if only 1D exists
            finalCat = 'D';
            finalCount = countD;
        }

        // Update UI
        if (causticInputs.divStep4Result) {
            causticInputs.divStep4Result.classList.remove('hidden');
            causticInputs.valFinalEffCat.innerText = finalCat;
            causticInputs.valFinalEffCount.innerText = finalCount;
            
            // Highlight E if no effective inspections
            if(finalCat === 'E') {
                 causticInputs.valFinalEffCat.className = "font-bold text-red-600";
            } else {
                 causticInputs.valFinalEffCat.className = "font-bold text-blue-800";
            }
            
            // Sync Table Inputs
            const reqEff = document.getElementById('req_scc_caustic_insp_eff');
            const reqCount = document.getElementById('req_scc_caustic_insp_count');
            
            if(reqEff) {
                 // Try to match value or add option if purely display
                 // Ideally this is a select, but we can just set value if option matches
                 // Or create a dummy option
                 const opts = Array.from(reqEff.options);
                 const hasOpt = opts.some(o => o.value === finalCat);
                 if(!hasOpt) {
                     const newOpt = new Option(finalCat, finalCat);
                     reqEff.add(newOpt);
                 }
                 reqEff.value = finalCat;
            }
            if(reqCount) reqCount.value = finalCount;
        }

        // Save to Session
        sessionStorage.setItem('scc_caustic_insp_eff', finalCat);
        sessionStorage.setItem('scc_caustic_insp_count', finalCount);
        console.log(`Step 4 Complete: Final Category=${finalCat}, Count=${finalCount}`);

        // Trigger Step 5
        const currentSVI = sessionStorage.getItem('scc_caustic_svi');
        if (currentSVI) {
             calculateBaseDamageFactor(currentSVI, finalCat, finalCount);
        } else {
             console.warn("Step 5 postponed: Missing SVI from Step 2.");
        }
    }
    function isPointInAreaA(conc, temp) {
        if (isNaN(conc) || isNaN(temp)) return false;
        
        const unit = causticInputs.tempUnit ? causticInputs.tempUnit.value : 'F';
        if (!areaACurveData) {
             console.warn("Graph data not loaded yet.");
             return false;
        }
        let curvePoints = (unit === 'C') ? areaACurveData.area_a_curve_c : areaACurveData.area_a_curve_f;


        if (!curvePoints || curvePoints.length === 0) {
            console.warn("Graph points empty.");
            return false;
        }

        // Linear Interpolation
        let maxTemp = 0;
        if (conc < 0) return false;
        if (conc > 50) return false; // Area A is typically low concentration/temp.
        
        for (let i = 0; i < curvePoints.length - 1; i++) {
            const p1 = curvePoints[i];
            const p2 = curvePoints[i+1];
            if (conc >= p1.c && conc <= p2.c) {
                const ratio = (conc - p1.c) / (p2.c - p1.c);
                maxTemp = p1.t + ratio * (p2.t - p1.t);
                break;
            }
        }
        
        return temp <= maxTemp;
    }


    


    function calculateCausticSusceptibility() {
        const cracksPresent = causticInputs.cracksPresent.value;
        const cracksRemoved = causticInputs.cracksRemoved.value;
        const stressRelieved = causticInputs.stressRelieved.value;
        
        if (!cracksPresent) return null;

        // Path 1: Cracks Present
        if (cracksPresent === 'Yes') {
            if (!cracksRemoved) return 'High Susceptibility (Pending: Have cracks been removed?)';
            if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
            return 'High Susceptibility';
        } 
        
        // Path 2: No Cracks
        if (!stressRelieved) return null;
        if (stressRelieved === 'Yes') return 'Not Susceptible';
        
        // Path 3: Detailed Analysis
        const naohConc = parseFloat(causticInputs.naohConc.value);
        const temp = parseFloat(causticInputs.temp.value);
        const heatTraced = causticInputs.heatTraced.value;
        const steamedOut = causticInputs.steamedOut.value;

        if (isNaN(naohConc) || isNaN(temp)) return null;

        if (isNaN(naohConc) || isNaN(temp)) return null;

        // SAVE INPUTS TO SESSION
        sessionStorage.setItem('scc_caustic_cracks_present', cracksPresent);
        sessionStorage.setItem('scc_caustic_cracks_removed', cracksRemoved);
        sessionStorage.setItem('scc_caustic_stress_relieved', stressRelieved);
        sessionStorage.setItem('scc_caustic_naoh_conc', naohConc);
        sessionStorage.setItem('scc_caustic_temp', temp);
        sessionStorage.setItem('scc_caustic_heat_traced', heatTraced);
        sessionStorage.setItem('scc_caustic_steamed_out', steamedOut);

        const areaA = isPointInAreaA(naohConc, temp);

        if (areaA) {
            // Plot in Area "A" (Safe Zone)
            if (naohConc < 5) {
                // < 5%
                if (!heatTraced) return null;
                if (heatTraced === 'Yes') return 'Medium Susceptibility'; // Left-most path
                
                if (!steamedOut) return null;
                if (steamedOut === 'Yes') return 'Low Susceptibility';
                return 'Not Susceptible';
                
            } else {
                // >= 5%
                if (!heatTraced) return null;
                if (heatTraced === 'Yes') return 'High Susceptibility';
                
                if (!steamedOut) return null;
                if (steamedOut === 'Yes') return 'Medium Susceptibility';
                return 'Not Susceptible'; // Corrected per flowchart: Area A -> >=5% -> Heat Traced No -> Steamed Out No -> Not Susceptible.
            }
        } else {
            // Not in Area A (Unsafe Zone)
             if (naohConc < 5) {
                 return 'Medium Susceptibility';
             } else {
                 // >= 5%
                 if (!heatTraced) return null;
                 if (heatTraced === 'Yes') return 'High Susceptibility';
                 
                 if (!steamedOut) return null;
                 if (steamedOut === 'Yes') return 'Medium Susceptibility';
                 return 'High Susceptibility';
             }
        }
    }

    function getSusceptibilityClass(suscept) {
        if (!suscept) return '';
        if (suscept.includes('High')) return 'alert-error';
        if (suscept.includes('Medium')) return 'alert-warning';
        if (suscept.includes('Low')) return 'alert-success'; 
        if (suscept.includes('Not')) return 'alert-success';
        if (suscept.includes('FFS')) return 'alert-error';
        return 'alert-info';
    }

    // --- Step 5 Logic: Base Damage Factor ---
    function calculateBaseDamageFactor(svi, effCat, effCount) {
        if (!baseDamageFactorData || !baseDamageFactorData.data) {
             console.warn("Base Damage Factor data not loaded yet.");
             return; 
        }

        // Validate SVI (from Step 2)
        const validSVIKeys = Object.keys(baseDamageFactorData.data);
        const sviKey = String(svi);

        if (!validSVIKeys.includes(sviKey)) {
            console.error("Invalid SVI for Base DF lookup:", svi);
            return;
        }

        // Validate Effectiveness Category
        let baseDF = 0;
        const lookup = baseDamageFactorData.data[sviKey];

        if (effCat === 'E' || effCount <= 0) {
             // Use the "E" key for no inspection
             baseDF = lookup['E'];
        } else {
             // Cap count at highest key available (likely 6)
             // JSON keys "1" to "6".
             let countKey = effCount > 6 ? "6" : String(effCount);
             
             // Safer lookup
             if (lookup[countKey] && lookup[countKey][effCat] !== undefined) {
                 baseDF = lookup[countKey][effCat];
             } else {
                 console.warn("Lookup failed for count/cat:", countKey, effCat);
                 baseDF = lookup['E']; // Conservative fallback
             }
        }

        // Update UI
        if (causticInputs.divStep5) {
             causticInputs.divStep5.classList.remove('hidden');
        }
        if (causticInputs.valBaseDF) {
             causticInputs.valBaseDF.innerText = baseDF;
        }

        // Save to Session
        sessionStorage.setItem('scc_caustic_base_df', baseDF);
        console.log(`Step 5 Complete: Base DF=${baseDF}`);
        
        // Trigger Step 6 only if Age is valid (Step 3 complete)
        const currentAge = parseFloat(sessionStorage.getItem('scc_caustic_age'));
        if (!isNaN(currentAge)) {
            calculateFinalDamageFactor();
        }
    }

    // --- Step 6 Logic: Final Damage Factor ---
    function calculateFinalDamageFactor() {
        const baseDF = parseFloat(sessionStorage.getItem('scc_caustic_base_df'));
        const age = parseFloat(sessionStorage.getItem('scc_caustic_age'));
        
        // Selectors
        const divStep6 = document.getElementById('div_scc_caustic_step6');
        const valFinalDF = document.getElementById('scc_caustic_final_df_val');
        const msgFinal = document.getElementById('scc_caustic_final_msg');

        if (isNaN(baseDF) || isNaN(age)) {
             console.warn("Missing inputs for Step 6:", { baseDF, age });
             return;
        }

        // Equation 2.C.3
        // Df = min( BaseDF * (max(age, 1.0))^1.1, 5000 )
        
        const timeFactor = Math.pow(Math.max(age, 1.0), 1.1);
        let finalDF = baseDF * timeFactor;
        
        // Cap at 5000
        if (finalDF > 5000) finalDF = 5000;
        
        // Round for display
        finalDF = parseFloat(finalDF.toFixed(1)); // 1 decimal place? Or integer? Standard practice is usually 1-2 decimals or int if large.

         // Update UI
         if (divStep6) {
             divStep6.classList.remove('hidden');
             divStep6.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
         if (valFinalDF) {
             valFinalDF.innerText = finalDF;
         }
         if (msgFinal) {
             msgFinal.classList.remove('hidden');
         }

         sessionStorage.setItem('scc_caustic_final_df', finalDF);
         calculateGoverningSCCDF();
         console.log(`Step 6 Complete: Final DF=${finalDF}`);
    }

    // --- SSC Event Listeners ---
    const btnCalcSSCSeverity = document.getElementById('btn_scc_ssc_calc_severity');
    if(btnCalcSSCSeverity) {
        btnCalcSSCSeverity.addEventListener('click', calculateSSCSeverity);
    }
    
    // Load SSC Table Data on Module Load (e.g. when tab switches)
    function getSusceptibilityColorClass(susc) {
        if (susc === 'High' || susc === 'FFS Required') return 'text-red-600';
        if (susc === 'Medium') return 'text-yellow-600';
        if (susc === 'Low') return 'text-green-600';
        return 'text-gray-600';
    }

    function showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.classList.remove('hidden');
        }
    }

    function clearError(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = '';
            el.classList.add('hidden');
        }
    }

    // Initialize ACSCC Logic
    function initACSCC() {
        loadACSCCRequiredData();
    }

    async function loadACSCCRequiredData() {
        const tbody = document.getElementById('tbody_scc_acscc_required_data');
        if (!tbody) return;

        // Prevent reload if already loaded (check if first row is not "Loading...")
        if (tbody.rows.length > 0 && !tbody.rows[0].innerText.includes('Loading')) return;

        try {
            const response = await fetch('/static/formula_app/data/json/scc_acscc_required_data.json');
            if (!response.ok) throw new Error("Failed to load ACSCC data");
            const json = await response.json();
            
            tbody.innerHTML = ''; // Clear loading msg
            
            json.rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-semibold text-xs md:text-sm">${row.data}</td>
                    <td class="text-xs md:text-sm">${row.comments}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error("Error loading ACSCC table:", e);
            tbody.innerHTML = '<tr><td colspan="2" class="text-center text-red-500">Error loading table data.</td></tr>';
        }
    }

    // Expose init to global scope or module export if needed, 
    // but here we are in a module script, so it runs on load.
    // If we need to trigger it when tab switches, we might need a listener.
    // For now, the event listeners attached above will work.
    
    // Export functions if using module system
    // export { initACSCC };
    const sccTable = document.getElementById('tbody_scc_ssc_required_data');
    if (sccTable) {
        loadSSCRequiredData();
    }

    // --- SSC Logic Functions ---
    
    async function loadSSCRequiredData() {
        const tbody = document.getElementById('tbody_scc_ssc_required_data');
        if (!tbody) return;
        
        // Check if already loaded to avoid redundant fetches
        if (tbody.getAttribute('data-loaded') === 'true') return;

        try {
            const response = await fetch('/static/formula_app/data/scc_ssc_required_data.json');
            if (!response.ok) throw new Error('Failed to load SSC data');
            const data = await response.json();
            
            tbody.innerHTML = '';
            data.forEach((row, index) => {
               const tr = document.createElement('tr');
               let inputHtml = '';
               
               if (row.parameter.includes('Susceptibility')) {
                   inputHtml = `<input type="text" id="req_scc_ssc_susceptibility" class="input input-bordered input-sm w-full bg-gray-100" placeholder="Calculated..." readonly />`;
               } else if (row.parameter.includes('Presence of water')) {
                   inputHtml = `
                       <select id="req_scc_ssc_water" class="select select-bordered select-sm w-full">
                           <option value="">Select...</option>
                           <option value="Yes">Yes</option>
                           <option value="No">No</option>
                       </select>`;
               } else if (row.parameter.includes('H2S content')) {
                   inputHtml = `<input type="number" id="req_scc_ssc_h2s" class="input input-bordered input-sm w-full" placeholder="ppm" />`;
               } else if (row.parameter.includes('pH of water')) {
                   inputHtml = `<input type="number" id="req_scc_ssc_ph" class="input input-bordered input-sm w-full" placeholder="pH" step="0.1" />`;
               } else if (row.parameter.includes('Presence of cyanides')) {
                   inputHtml = `
                       <select id="req_scc_ssc_cyanides" class="select select-bordered select-sm w-full">
                           <option value="">Select...</option>
                           <option value="Yes">Yes</option>
                           <option value="No">No</option>
                       </select>`;
               } else if (row.parameter.includes('Max Brinnell hardness')) {
                   inputHtml = `<input type="number" id="req_scc_ssc_hardness" class="input input-bordered input-sm w-full" placeholder="HB" />`;
               } else if (row.parameter.includes('Age')) {
                   inputHtml = `<input type="text" id="req_scc_ssc_age" class="input input-bordered input-sm w-full bg-gray-100" placeholder="Calculated..." readonly />`;
               } else if (row.parameter.includes('Inspection effectiveness')) {
                   inputHtml = `
                       <select id="req_scc_ssc_insp_eff" class="select select-bordered select-sm w-full" disabled>
                           <option value="">Calculated...</option>
                       </select>`;
               } else if (row.parameter.includes('Number of inspections')) {
                   inputHtml = `<input type="number" id="req_scc_ssc_insp_count" class="input input-bordered input-sm w-full bg-gray-100" placeholder="Calculated..." readonly />`;
               } else {
                   inputHtml = `<input type="text" class="input input-bordered input-sm w-full" disabled />`;
               }

               tr.innerHTML = `
                   <td class="font-semibold text-sm">${row.parameter}</td>
                   <td class="text-sm">${row.comment}</td>
                   <td>${inputHtml}</td>
               `;
               tbody.appendChild(tr);
            });
            tbody.setAttribute('data-loaded', 'true');
            console.log("SSC Required Data Table loaded.");

        } catch (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="2" class="text-center text-red-500">Error loading data.</td></tr>`;
        }
    }

    function calculateSSCSeverity() {
        // Delegate to Async logic
        calculateSSCSeverityAsync();
    }

    let sccEnvSeverityData = null;
    async function calculateSSCSeverityAsync() {
        if (!sccEnvSeverityData) {
            try {
                const response = await fetch('/static/formula_app/data/scc_ssc_environmental_severity.json');
                if (!response.ok) throw new Error("Data load failed");
                sccEnvSeverityData = await response.json();
            } catch (e) {
                console.error(e);
                alert("Failed to load Environmental Severity Table data.");
                return;
            }
        }

        const ph = parseFloat(document.getElementById('inp_scc_ssc_ph').value);
        const h2s = parseFloat(document.getElementById('inp_scc_ssc_h2s').value);
        
        const resultDiv = document.getElementById('div_scc_ssc_step1_result');
        const resultSpan = document.getElementById('val_scc_ssc_env_severity');
        const step2Div = document.getElementById('div_scc_ssc_step2');

        if (isNaN(ph) || isNaN(h2s)) {
            alert("Please enter valid numbers for pH and H2S Content.");
            return;
        }

        // Table Logic for Column Index (H2S Content)
        // Col 0: < 0.05 psia or Low ppm (< 1)
        // Col 1: > 1 to 50
        // Col 2: > 50 to 1000
        // Col 3: > 1000 to 10000
        // Col 4: > 10000
        
        let colIndex = -1;
        if (h2s <= 1) {
             colIndex = 0; 
        } else if (h2s > 1 && h2s <= 50) colIndex = 1;
        else if (h2s > 50 && h2s <= 1000) colIndex = 2;
        else if (h2s > 1000 && h2s <= 10000) colIndex = 3;
        else if (h2s > 10000) colIndex = 4;

        // Find Row
        const row = sccEnvSeverityData.find(r => ph >= r.ph_min && ph <= r.ph_max);
        
        let severity = "Unknown";
        if (!row) {
            severity = "None (pH out of range)"; 
        } else {
             if (h2s <= 1 && colIndex === -1) colIndex = 0; // Fallback
             severity = row.severity[colIndex];
        }

        // Display Result
        resultDiv.classList.remove('hidden');
        resultSpan.textContent = severity;
        
        // Color coding
        resultSpan.className = 'font-bold';
        if(severity === 'High') resultSpan.classList.add('text-red-600');
        else if(severity === 'Moderate') resultSpan.classList.add('text-orange-500');
        else if(severity === 'Low') resultSpan.classList.add('text-yellow-600');
        else resultSpan.classList.add('text-green-600');

        sessionStorage.setItem('scc_ssc_env_severity', severity);
        sessionStorage.setItem('scc_ssc_ph', ph);
        sessionStorage.setItem('scc_ssc_h2s', h2s);
        
        if (severity !== 'Unknown') {
            step2Div.classList.remove('hidden');
            
            // Auto-trigger Step 2 if Hardness is already present
            const inpHard = document.getElementById('inp_scc_ssc_hardness');
            if (inpHard && inpHard.value) {
                // We don't await this, just trigger it
                calculateSSCSusceptibility(false);
            }
        }
        
        // Sync Table Inputs
        const reqH2S = document.getElementById('req_scc_ssc_h2s');
        const reqPH = document.getElementById('req_scc_ssc_ph');
        if(reqH2S) reqH2S.value = h2s;
        if(reqPH) reqPH.value = ph;

        console.log(`SSC Step 1 Complete: Severity=${severity} (pH=${ph}, H2S=${h2s})`);
    }

    // Auto-Populate SSC
    function autoPopulateSSC(data) {
        if(!data) return;
        
        // 1. pH
        if (data.ph_water) {
             const val = data.ph_water;
             const inpPH = document.getElementById('inp_scc_ssc_ph');
             const reqPH = document.getElementById('req_scc_ssc_ph');
             
             if(inpPH) {
                 inpPH.value = val;
                 inpPH.readOnly = true; 
                 inpPH.classList.add('bg-gray-100', 'cursor-not-allowed');
             }
             if(reqPH) {
                 reqPH.value = val;
                 reqPH.readOnly = true;
                 reqPH.classList.add('bg-gray-100');
             }
        }
        
        // 2. H2S
        if (data.h2s_content) {
             const val = data.h2s_content;
             const inpH2S = document.getElementById('inp_scc_ssc_h2s');
             const reqH2S = document.getElementById('req_scc_ssc_h2s');
             
             if(inpH2S) {
                 inpH2S.value = val;
                 inpH2S.readOnly = true;
                 inpH2S.classList.add('bg-gray-100', 'cursor-not-allowed');
             }
             if(reqH2S) {
                 reqH2S.value = val;
                 reqH2S.readOnly = true;
                 reqH2S.classList.add('bg-gray-100');
             }
        }
        
        // 3. Hardness (if available in Step 0)
        // Check data model for hardness property? usually "max_brinell_hardness"
        if (data.max_brinell_hardness) {
             const val = data.max_brinell_hardness;
             const inpHard = document.getElementById('inp_scc_ssc_hardness');
             const reqHard = document.getElementById('req_scc_ssc_hardness');
             
             if(inpHard) {
                 inpHard.value = val;
                 inpHard.readOnly = true;
                 inpHard.classList.add('bg-gray-100', 'cursor-not-allowed');
             }
             if(reqHard) {
                 reqHard.value = val;
                 reqHard.readOnly = true;
                 reqHard.classList.add('bg-gray-100');
             }
        }
        
        // 4. Age (Start Date)
        if (data.start_date) {
            const inpDate = document.getElementById('inp_scc_ssc_install_date');
            
            if(inpDate) {
                inpDate.value = data.start_date;
                inpDate.readOnly = true;
                inpDate.classList.add('bg-gray-100', 'cursor-not-allowed');
                // Trigger change event to calc age
                calculateSSCAge();
            }
        }
        
        // 5. Water / Cyanides (Booleans)
        if (data.presence_of_water !== undefined) {
             const val = data.presence_of_water ? "Yes" : "No";
             const reqWater = document.getElementById('req_scc_ssc_water');
             if(reqWater) {
                 reqWater.value = val;
                 reqWater.disabled = true;
                 reqWater.classList.add('bg-gray-100');
             }
        }
        if (data.presence_of_cyanides !== undefined) {
             const val = data.presence_of_cyanides ? "Yes" : "No";
             const reqCyan = document.getElementById('req_scc_ssc_cyanides');
             if(reqCyan) {
                 reqCyan.value = val;
                 reqCyan.disabled = true;
                 reqCyan.classList.add('bg-gray-100');
             }
        }
        
        // Trigger Step 1 Calc if data is present
        if(data.ph_water && data.h2s_content) {
            setTimeout(calculateSSCSeverity, 500);
        }
    }

    // --- SSC Step 2 ---

    const btnCalcSSCSusceptibility = document.getElementById('btn_scc_ssc_calc_susceptibility');
    const selCracksPresent = document.getElementById('sel_scc_ssc_cracks_present');
    const divCracksRemoved = document.getElementById('div_scc_ssc_cracks_removed');
    const selCracksRemoved = document.getElementById('sel_scc_ssc_cracks_removed');

    // UI Logic for Cracks (Dynamic Update)
    if(selCracksPresent) {
        selCracksPresent.addEventListener('change', (e) => {
             const val = e.target.value;
             
             if(val === 'Yes') {
                 divCracksRemoved.classList.remove('hidden');
                 // Trigger calc immediately to show Step 3 (based on base susc)
                 // while waiting for Removed answer.
                 calculateSSCSusceptibility(true);
             } else {
                 divCracksRemoved.classList.add('hidden');
                 if(selCracksRemoved) selCracksRemoved.value = "";
                 // Re-run logic (reverts to calculated)
                 calculateSSCSusceptibility(true);
             }
        });
    }

    if(selCracksRemoved) {
        selCracksRemoved.addEventListener('change', (e) => {
             calculateSSCSusceptibility(true);
        });
    }

    // New Listeners for Step 2 Inputs (Hardness, PWHT)
    const inpHardness = document.getElementById('inp_scc_ssc_hardness');
    const selPWHT = document.getElementById('sel_scc_ssc_pwht');

    if(inpHardness) {
        inpHardness.addEventListener('input', () => calculateSSCSusceptibility(true));
        inpHardness.addEventListener('change', () => calculateSSCSusceptibility(true)); 
    }
    if(selPWHT) {
        selPWHT.addEventListener('change', () => calculateSSCSusceptibility(true));
    }



    let sccSusceptibilityData = null;
    async function calculateSSCSusceptibility(isUpdate = false) {
    console.log("Starting calculateSSCSusceptibility...");
    const severity = sessionStorage.getItem('scc_ssc_env_severity');
    if (!severity) {
        console.warn("Missing Severity in SessionStorage");
        alert("Please complete Step 1 first.");
        return;
    }

    // Clear previous errors
    const errDiv = document.getElementById('err_scc_ssc_step2'); // Changed to step 2 specific if exists, or just rely on validate inputs
    // if (errDiv) errDiv.classList.add('hidden'); // Assuming step 1 error div was reused erroneously

    const inpHardness = document.getElementById('inp_scc_ssc_hardness');
    console.log("Validating Hardness Input:", inpHardness.value);
    
    // Fix: Validate against Step 2 container, not Step 1
    if (!validateInputs([inpHardness], document.getElementById('div_scc_ssc_step2'))) {
        console.warn("Validation Failed for Hardness");
        return;
    }

    const hardnessStr = inpHardness.value;
    const hardness = parseFloat(hardnessStr);
    const pwht = document.getElementById('sel_scc_ssc_pwht').value;
    const cracksPresent = document.getElementById('sel_scc_ssc_cracks_present').value;
    const cracksRemoved = document.getElementById('sel_scc_ssc_cracks_removed').value;
    
    // Check if hardness is valid number specifically
    if (isNaN(hardness)) {
        if (errDiv) {
            errDiv.innerText = "Please enter a valid Max Brinnell Hardness.";
            errDiv.classList.remove('hidden');
        }
        return;
    }
        
        // --- 1. Base Calculation (Table) ---
        // Load Data
        if (!sccSusceptibilityData) {
            try {
                const response = await fetch('/static/formula_app/data/scc_ssc_susceptibility.json');
                if (!response.ok) throw new Error("Data load failed");
                sccSusceptibilityData = await response.json();
            } catch (e) {
                console.error(e);
                alert("Failed to load Susceptibility Table data.");
                return;
            }
        }

        let baseSusceptibility = "Unknown";
        
        // Lookup Logic
        const severityGroup = sccSusceptibilityData[severity];
        if (severityGroup) {
            const treatmentGroup = severityGroup[pwht];
            if (treatmentGroup) {
                const match = treatmentGroup.find(r => {
                    if (r.min === undefined && r.max !== undefined) return hardness <= r.max;
                    if (r.min !== undefined && r.max === undefined) return hardness > r.min;
                    if (r.min !== undefined && r.max !== undefined) return hardness >= r.min && hardness <= r.max;
                    return false;
                });
                if (match) baseSusceptibility = match.result;
            }
        }
        
        // --- 2. Cracks Overrides ---
        let finalSusceptibility = baseSusceptibility;

        if (cracksPresent === 'Yes') {
            if (cracksRemoved === 'Yes') {
                finalSusceptibility = 'High';
            } else if (cracksRemoved === 'No') {
                finalSusceptibility = 'FFS Required';
            } else {
                // Yes but Removed not set - If this is an update, maybe don't change yet?
                // Or if we need strict flow, we could say "Pending".
                // But typically if they just clicked "Yes", we show the extra input. 
                // We should keep the BASE result until they confirm Removed status.
                // UNLESS base is already High/FFS? No, we stick to base.
            }
        }
        
        // --- 3. Display ---
        displaySSCSusceptibility(finalSusceptibility);
        
        // Reveal Cracks Container if this was the initial button click (isUpdate=false)
        if (!isUpdate) {
            document.getElementById('div_scc_ssc_cracks_container').classList.remove('hidden');
        }
    }



    function displaySSCSusceptibility(val) {
        const resultDiv = document.getElementById('div_scc_ssc_step2_result');
        const resultSpan = document.getElementById('val_scc_ssc_susceptibility');
        
        resultDiv.classList.remove('hidden');
        resultSpan.textContent = val;
        
        // Color
        resultSpan.className = 'font-bold ml-1';
        if(val === 'FFS Required') resultSpan.classList.add('text-red-800', 'bg-red-100', 'px-2', 'rounded');
        else if(val === 'High') resultSpan.classList.add('text-red-600');
        else if(val === 'Medium') resultSpan.classList.add('text-orange-500');
        else if(val === 'Low') resultSpan.classList.add('text-yellow-600');
        else resultSpan.classList.add('text-green-600');

        sessionStorage.setItem('scc_ssc_susceptibility', val);
        console.log(`SSC Step 2 Complete: Susceptibility=${val}`);
        
        // Sync Table Inputs
        const reqSusc = document.getElementById('req_scc_ssc_susceptibility');
        if(reqSusc) reqSusc.value = val;
        
        const inpHard = document.getElementById('inp_scc_ssc_hardness');
        const reqHard = document.getElementById('req_scc_ssc_hardness');
        if(reqHard && inpHard) reqHard.value = inpHard.value;


        // Unlock Step 3
        const step3Div = document.getElementById('div_scc_ssc_step3');
        const cracksSelected = document.getElementById('sel_scc_ssc_cracks_present').value;

        // Only unlock if not FFS, not Unknown, AND cracks option is selected
        if (val !== 'Unknown' && val !== 'FFS Required' && cracksSelected !== "") {
             step3Div.classList.remove('hidden');
             // Auto-Calculate Step 3
             calculateSSCSeverityIndex();
        } else {
             step3Div.classList.add('hidden');
             document.getElementById('div_scc_ssc_step4').classList.add('hidden');
             document.getElementById('div_scc_ssc_step5').classList.add('hidden');
             document.getElementById('div_scc_ssc_step6').classList.add('hidden');
             document.getElementById('div_scc_ssc_step7').classList.add('hidden');
        }
    }

    // --- Caustic Confirm Table Data Button ---
    const btnConfirmCaustic = document.getElementById('btn_scc_caustic_confirm_table');
    if(btnConfirmCaustic) {
        btnConfirmCaustic.addEventListener('click', () => {
             // 1. Sync Table Inputs to hidden fields
             const reqConc = document.getElementById('req_scc_caustic_naoh_conc');
             const reqTemp = document.getElementById('req_scc_caustic_temp');
             const reqUnit = document.getElementById('req_scc_caustic_temp_unit');
             const reqSteam = document.getElementById('req_scc_caustic_steamed_out');
             const reqAge = document.getElementById('req_scc_caustic_age'); // Readonly?
             
             // Target Hidden Inputs
             const inpConc = document.getElementById('scc_caustic_naoh_conc');
             const inpTemp = document.getElementById('scc_caustic_temp');
             const inpUnit = document.getElementById('scc_caustic_temp_unit');
             const inpSteam = document.getElementById('scc_caustic_steamed_out');
             // Age/InstallDate mapping?
             // Since table has "Age" (Result), and Step 3 has "Date", we can't easily sync DATE from AGE.
             // But if we had an "Install Date" input in the table, we could.
             // For now, allow Step 3 to be the master for Age.
             
             if(reqConc && inpConc) inpConc.value = reqConc.value;
             // Trigger input event to update graph if possible?
             if(inpConc) inpConc.dispatchEvent(new Event('input'));
             
             if(reqTemp && inpTemp) inpTemp.value = reqTemp.value;
             if(reqUnit && inpUnit) inpUnit.value = reqUnit.value;
             if(reqSteam && inpSteam) inpSteam.value = reqSteam.value;
             
             // 2. Reveal Step 1 (Inputs)
             const divInputs = document.getElementById('div_scc_caustic_inputs');
             if(divInputs) {
                 divInputs.classList.remove('hidden');
                 divInputs.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }

             // 3. Trigger initial calculations (Graph logic)
             // We need to call checkCausticGraph() or similar if defined.
             // Searching for graph logic... likely implicitly called by 'input' events above.
             // But let's explicitly trigger if available in scope.
             // checkCausticGraph(); // Can't call if not defined in this scope or export.
             // Dispatching 'input' to inpConc and inpTemp should trigger it if listeners are set up.
             if(inpTemp) inpTemp.dispatchEvent(new Event('input'));
        });
    }

    // --- SSC Step 3 ---

    // Button Removed as per request (Auto-Calc)

    let sccSeverityIndexData = null;
    async function calculateSSCSeverityIndex() {
        const susceptibility = sessionStorage.getItem('scc_ssc_susceptibility');
        if (!susceptibility) {
            // Passive fail
            return;
        }

        // Load Data (Table 2.C.1.2 - Reused)
        if (!sccSeverityIndexData) {
            try {
                // Re-using the same JSON as Caustic Cracking if valid, or a generic one.
                const response = await fetch('/static/formula_app/data/json/scc_severity_index.json');
                if (!response.ok) throw new Error("Data load failed");
                sccSeverityIndexData = await response.json();
            } catch (e) {
                console.error(e);
                alert("Failed to load Severity Index Table data.");
                return;
            }
        }

        const svi = sccSeverityIndexData.mappings[susceptibility];

        if (svi === undefined) {
             const resultDiv = document.getElementById('div_scc_ssc_step3_result');
             const resultSpan = document.getElementById('val_scc_ssc_svi');
             resultSpan.textContent = "Error";
             resultDiv.classList.remove('hidden');
             return;
        }
        
        // Display SVI
        const resultDiv = document.getElementById('div_scc_ssc_step3_result');
        const resultSpan = document.getElementById('val_scc_ssc_svi');
        resultSpan.textContent = svi;
        resultSpan.className = 'font-bold ml-1 text-black';
        resultDiv.classList.remove('hidden');
        
        sessionStorage.setItem('scc_ssc_svi', svi);
        console.log(`SSC Step 3 Complete: Svi=${svi}`);
        

        
        // Unlock Step 4
        const step4Div = document.getElementById('div_scc_ssc_step4');
        step4Div.classList.remove('hidden');
        
        // Trigger Step 4/5 Logic
        // If age is already calculated (or date is present), we should make sure Step 5 is visible
        if(document.getElementById('inp_scc_ssc_install_date').value) {
            calculateSSCAge();
        }
    }

    // --- SSC Confirm Table Data Button ---
    const btnConfirmSSC = document.getElementById('btn_scc_ssc_confirm_table');
    if(btnConfirmSSC) {
        btnConfirmSSC.addEventListener('click', () => {
             // 1. Sync Table Inputs to Steps
             const reqPH = document.getElementById('req_scc_ssc_ph');
             const reqH2S = document.getElementById('req_scc_ssc_h2s');
             const reqHard = document.getElementById('req_scc_ssc_hardness');
             const reqAge = document.getElementById('req_scc_ssc_age');
             // Future: reqWater, reqCyanides
             
             // Step 1 Inputs
             const inpPH = document.getElementById('inp_scc_ssc_ph');
             const inpH2S = document.getElementById('inp_scc_ssc_h2s');
             
             if(reqPH && inpPH) inpPH.value = reqPH.value;
             if(reqH2S && inpH2S) inpH2S.value = reqH2S.value;
             
             // Step 2 Inputs
             const inpHard = document.getElementById('inp_scc_ssc_hardness');
             if(reqHard && inpHard) inpHard.value = reqHard.value;
             
             // Step 4 Inputs (If Age is manually entered? Age is calc, so date is what matters)
             // If user entered Age directly in table (it's readonly in my code, so maybe not)
             // But if they entered Date in Step 0, it's already popped.
             
             // 2. Reveal Step 1
             const divStep1 = document.getElementById('div_scc_ssc_step1');
             if(divStep1) {
                 divStep1.classList.remove('hidden');
                 divStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }

             // 4. Trigger Step 4 Calc if date present (or ensure it ran)
             if(document.getElementById('inp_scc_ssc_install_date').value) {
                 calculateSSCAge();
             }

             // 3. Trigger initial calculations if data is present
             if(inpPH.value && inpH2S.value) {
                 calculateSSCSeverity(); // This cascades to Step 2 if valid
             }
        });
    }

    // --- SSC Step 4: Time in Service ---
    
    // Auto-Calculate Age based on Date Input
    // Auto-Calculate Age based on Date Input
    const inpSSCDate = document.getElementById('inp_scc_ssc_install_date');
    
    function calculateSSCAge() {
        const dateVal = inpSSCDate.value;
        if(!dateVal) return;

        const installDate = new Date(dateVal);
        const today = new Date();
        let age = today.getFullYear() - installDate.getFullYear();
        const m = today.getMonth() - installDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < installDate.getDate())) {
            age--;
        }
        
        // Allow 0 but not negative
        if(age < 0) age = 0;

        const valAgeSpan = document.getElementById('val_scc_ssc_age');
        if(valAgeSpan) valAgeSpan.textContent = age;
        
        sessionStorage.setItem('scc_ssc_age', age);
        
        // Unlock Step 5
         document.getElementById('div_scc_ssc_step5').classList.remove('hidden');
         
         // Sync Table
         const reqAge = document.getElementById('req_scc_ssc_age');
         if(reqAge) reqAge.value = age;
         
         // Trigger Step 7 (Final DF) update if possible?
         // calculateSSCFinalDamage(); // We'll add this later or let Step 6 trigger it
    }

    if(inpSSCDate) {
        inpSSCDate.addEventListener('change', calculateSSCAge);
        inpSSCDate.addEventListener('input', calculateSSCAge);
    }

    // --- SSC Step 5: Inspection Effectiveness ---
    
    const inpSSCInspA = document.getElementById('inp_scc_ssc_insp_A');
    const inpSSCInspB = document.getElementById('inp_scc_ssc_insp_B');
    const inpSSCInspC = document.getElementById('inp_scc_ssc_insp_C');
    const inpSSCInspD = document.getElementById('inp_scc_ssc_insp_D');
    
    // Definitions View Logic
    const btnViewDef = document.getElementById('btn_scc_ssc_view_definitions');
    const divDef = document.getElementById('div_scc_ssc_definitions');
    const tbodyDef = document.getElementById('tbody_scc_ssc_definitions');
    let definitionsLoaded = false;

    if(btnViewDef) {
        btnViewDef.addEventListener('click', async () => {
             divDef.classList.toggle('hidden');
             if (!divDef.classList.contains('hidden') && !definitionsLoaded) {
                 // Load Data
                 try {
                     const response = await fetch('/static/formula_app/data/scc_ssc_inspection_definitions.json');
                     if(!response.ok) throw new Error("Failed to load definitions");
                     const data = await response.json();
                     
                     tbodyDef.innerHTML = '';
                     data.forEach(row => {
                         const tr = document.createElement('tr');
                         tr.innerHTML = `
                            <td class="font-bold text-center">${row.category}</td>
                            <td>${row.effectiveness}</td>
                            <td class="text-xs">${row.intrusive}</td>
                            <td class="text-xs">${row.non_intrusive}</td>
                         `;
                         tbodyDef.appendChild(tr);
                     });
                     definitionsLoaded = true;
                 } catch(e) {
                     console.error(e);
                     tbodyDef.innerHTML = '<tr><td colspan="4" class="text-red-500">Error loading definitions.</td></tr>';
                 }
             }
        });
    }

    if(inpSSCInspA) {
        [inpSSCInspA, inpSSCInspB, inpSSCInspC, inpSSCInspD].forEach(inp => {
            if(inp) inp.addEventListener('change', calculateSSCInspectionEffectiveness);
        });
    }

    function calculateSSCInspectionEffectiveness() {
        let countA = parseInt(inpSSCInspA.value) || 0;
        let countB = parseInt(inpSSCInspB.value) || 0;
        let countC = parseInt(inpSSCInspC.value) || 0;
        let countD = parseInt(inpSSCInspD.value) || 0;

        // 2:1 Equivalency (API 581 Part 2 Section 3.4.3)
        // Two inspections of lower efficacy = One inspection of higher efficacy
        
        // Propagate D -> C
        if (countD >= 2) {
            countC += Math.floor(countD / 2);
            // Remainder D discarded for specific effectiveness, but usually we just care about "Effective" count.
            // Actually, API logic usually upgrades.
        }
        
        // Propagate C -> B
        if (countC >= 2) {
            countB += Math.floor(countC / 2);
        }

        // Propagate B -> A
        if (countB >= 2) {
            countA += Math.floor(countB / 2);
        }

        let finalEffCat = 'E';
        let finalEffCount = 0;

        if (countA > 0) {
            finalEffCat = 'A';
            finalEffCount = countA;
        } else if (countB > 0) {
            finalEffCat = 'B';
            finalEffCount = countB;
        } else if (countC > 0) {
            finalEffCat = 'C';
            finalEffCount = countC;
        } else if (countD > 0) {
            finalEffCat = 'D'; // Remaining D if not enough to upgrade
            finalEffCount = countD; 
            // NOTE: If D was passed to C, countD is not technically "consumed" in source variable unless we subtract.
            // But the logic is: "Determine the highest effectiveness...".
            // If I have 1 C and 2 Ds -> 2 Ds become 1 C -> Total 2 Cs -> become 1 B. Final: 1 B.
            // If I have 1 D... Final: 1 D.
            // Correct flow:
            // D -> C -> B -> A.
            // After propagation, find highest Non-Zero.
            // But wait, if I have 2 Ds, they became a C. Does "D" count remain? No, usually effectively 'converted'.
            // In my Caustic implementation I added them up without subtracting. 
            // Let's re-read "Combine the inspections to the highest effectiveness".
            // If 2 Ds = 1 C, then do I have 0 Ds left? Yes, effectively.
            // So if I didn't have enough to upgrade, that's what remains.
            
            // Re-implementing strictly:
            // 1. D to C
            // const dToC = Math.floor(countD / 2);
            // countC += dToC;
            // countD = countD % 2; // Remainder
            
            // But earlier I just did +=. If I use my previous logic, I check A, then B, etc.
            // If countA > 0 (after upgrade), we use A. We don't care about remaining Bs.
            // This implies the "Highest Effectiveness performed".
            // So my previous logic is correct: We accumulate up, and then pick the top tier.
        }

        // Display
        document.getElementById('val_scc_ssc_final_eff_cat').innerText = finalEffCat;
        document.getElementById('val_scc_ssc_final_eff_count').innerText = finalEffCount;
        document.getElementById('div_scc_ssc_step5_result').classList.remove('hidden');

        // Save
        sessionStorage.setItem('scc_ssc_inspection_cat', finalEffCat);
        sessionStorage.setItem('scc_ssc_inspection_count', finalEffCount);
        
        // Unlock Step 6
        document.getElementById('div_scc_ssc_step6').classList.remove('hidden');
        
        // Sync Table Inputs
        const reqEff = document.getElementById('req_scc_ssc_insp_eff');
        const reqCount = document.getElementById('req_scc_ssc_insp_count');
        
        if(reqEff) {
             const opts = Array.from(reqEff.options);
             const hasOpt = opts.some(o => o.value === finalEffCat);
             if(!hasOpt) {
                 const newOpt = new Option(finalEffCat, finalEffCat);
                 reqEff.add(newOpt);
             }
             reqEff.value = finalEffCat;
        }
        if(reqCount) reqCount.value = finalEffCount;

        // Auto-Calculate Step 6
        calculateSSCBaseDamageFactor();
    }

    // --- SSC Step 6: Base Damage Factor ---

    let sccBaseFactorData = null;

    async function calculateSSCBaseDamageFactor() {
        const svi = sessionStorage.getItem('scc_ssc_svi');
        const effCat = sessionStorage.getItem('scc_ssc_inspection_cat');
        const effCount = parseInt(sessionStorage.getItem('scc_ssc_inspection_count')) || 0;

        if (!svi) {
             console.warn("SVI not set yet.");
             return;
        }

        // Load Data
        if (!sccBaseFactorData) {
            try {
                const response = await fetch('/static/formula_app/data/json/scc_base_damage_factor.json');
                if (!response.ok) throw new Error("Data load failed");
                sccBaseFactorData = await response.json();
            } catch (e) {
                console.error(e);
                alert("Failed to load Base Damage Factor Table data.");
                return;
            }
        }

        // Validate SVI (SVI can be 0, so check strictly undefined/null)
        // Ensure SVI is a string key
        const sviKey = String(svi);

        const data = sccBaseFactorData.data;
        if (!data[sviKey]) {
            console.error(`SVI '${sviKey}' not found in Base DF table.`);
            return;
        }

        let baseDF = 0;

        // Logic:
        // If Cat E -> Use "E" value (Inspection Effectiveness is Ineffective)
        // Else -> Use Count and Cat
        
        if (effCat === 'E' || effCount <= 0) {
            baseDF = data[sviKey]['E'];
        } else {
            // Count capped at 6 technically per API 581, but JSON handles up to 6?
            // Actually JSON is nested: data[svi][count][cat]
            // Let's verify JSON structure. Yes: "1": {"D":...}, "6": {"D"...}
            
            let countKey = effCount > 6 ? "6" : String(effCount);
            
            if (data[sviKey][countKey]) {
                const catGroup = data[sviKey][countKey];
                // Check if specific cat exists (A, B, C, D)
                if (catGroup[effCat] !== undefined) {
                    baseDF = catGroup[effCat];
                } else {
                    console.warn(`Category '${effCat}' not found for count '${countKey}'. Defaulting to E.`);
                    baseDF = data[sviKey]['E'];
                }
            } else {
                 // Should not happen if count is handled
                 console.warn(`Count '${countKey}' not found. Defaulting to E.`);
                 baseDF = data[sviKey]['E'];
            }
        }

        // Display
        const resultSpan = document.getElementById('val_scc_ssc_base_df');
        if (resultSpan) {
            resultSpan.textContent = baseDF;
        }

        // Save
        sessionStorage.setItem('scc_ssc_base_df', baseDF);
        console.log(`Step 6 Complete: Base DF=${baseDF}`);

        // Unlock Step 7
        document.getElementById('div_scc_ssc_step7').classList.remove('hidden');
        
        // Auto-Calculate Step 7
        calculateSSCFinalDamageFactor();
    }

    // --- SSC Step 7: Final Damage Factor ---

    function calculateSSCFinalDamageFactor() {
        const baseDF = parseFloat(sessionStorage.getItem('scc_ssc_base_df')) || 0;
        const age = parseFloat(sessionStorage.getItem('scc_ssc_age')) || 1.0; 
        
        // Equation 2.C.9: Df_SSC = min( DfB_SSC * (max(age, 1.0))^1.1, 5000 )
        
        const timeFactor = Math.pow(Math.max(age, 1.0), 1.1);
        let finalDF = baseDF * timeFactor;
        
        // Cap at 5000
        if (finalDF > 5000) {
            finalDF = 5000;
        }

        // Rounding? API 581 usually implies 1 decimal or integer for DFs. Let's do 1 decimal.
        finalDF = parseFloat(finalDF.toFixed(1));

        // Display
        const resultSpan = document.getElementById('val_scc_ssc_final_df');
        if (resultSpan) {
            resultSpan.textContent = finalDF;
        }

        // Save
        sessionStorage.setItem('scc_ssc_final_df', finalDF);
        calculateGoverningSCCDF();
        
        // Visual indicator that module is complete? 
        // Could perhaps highlight or scroll to bottom.
    }

    // --- ACSCC Implementation (Alkaline Carbonate) ---
    // ----------------------------------------------------

    const inpACSCCpH = document.getElementById('inp_scc_acscc_ph');
    const inpACSCCCo3 = document.getElementById('inp_scc_acscc_co3');
    const selACSCCPwht = document.getElementById('sel_scc_acscc_pwht');
    const btnACSCCCalc = document.getElementById('btn_scc_acscc_calc_susceptibility');
    
    // Cracking questions
    const divACSCCCracks = document.getElementById('div_scc_acscc_cracks_container');
    const selACSCCCracksPresent = document.getElementById('sel_scc_acscc_cracks_present');
    const divACSCCCracksRemoved = document.getElementById('div_scc_acscc_cracks_removed');
    const selACSCCCracksRemoved = document.getElementById('sel_scc_acscc_cracks_removed');
    
    // Results
    const divACSCCStep1Result = document.getElementById('div_scc_acscc_step1_result');
    const valACSCCSusceptibility = document.getElementById('val_scc_acscc_susceptibility');
    const divACSCCFinalResult = document.getElementById('div_scc_acscc_final_result');
    const valACSCCFinalSusceptibility = document.getElementById('val_scc_acscc_final_susceptibility');
    const msgACSCCOverride = document.getElementById('msg_scc_acscc_override');

    if (btnACSCCCalc) {
        btnACSCCCalc.addEventListener('click', () => calculateACSCCSusceptibility(false));
    }

    if (selACSCCCracksPresent) {
        selACSCCCracksPresent.addEventListener('change', () => {
             const val = selACSCCCracksPresent.value;
             // If YES cracks -> Show "Removed?" question
             if (val === 'Yes') {
                 divACSCCCracksRemoved.classList.remove('hidden');
             } else {
                 divACSCCCracksRemoved.classList.add('hidden');
                 selACSCCCracksRemoved.value = ""; // Reset
             }
             calculateACSCCSusceptibility(true);
        });
    }

    if (selACSCCCracksRemoved) {
        selACSCCCracksRemoved.addEventListener('change', () => calculateACSCCSusceptibility(true));
    }

    // Initialize ACSCC Logic
    let acsccSusceptibilityData = null;
    let acsccSeverityData = null;

    async function initACSCC() {
        // Clear stale session data for ACSCC
        sessionStorage.removeItem('scc_acscc_susceptibility');
        sessionStorage.removeItem('scc_acscc_svi');
        sessionStorage.removeItem('scc_acscc_age');
        sessionStorage.removeItem('scc_acscc_inspection_cat');
        sessionStorage.removeItem('scc_acscc_inspection_count');
        sessionStorage.removeItem('scc_acscc_base_df');
        sessionStorage.removeItem('scc_acscc_final_df');

        loadACSCCRequiredData(); 
        
        // Load Susceptibility Data
        try {
            const resp = await fetch('/static/formula_app/data/json/scc_acscc_susceptibility.json');
            if (resp.ok) acsccSusceptibilityData = await resp.json();
        } catch (e) {
            console.error("Failed to load ACSCC susceptibility data", e);
        }

        // Load Severity Index Data (Shared)
        try {
            const resp = await fetch('/static/formula_app/data/json/scc_severity_index.json');
            if (resp.ok) acsccSeverityData = await resp.json();
        } catch (e) {
            console.error("Failed to load Severity Index data", e);
        }
    }

    async function calculateACSCCSusceptibility(isUpdate = false) {
        clearError('err_scc_acscc_step1');

        const phStr = inpACSCCpH.value;
        const co3Str = inpACSCCCo3.value;
        const pwht = selACSCCPwht.value;

        // Strict Validation
        if (!phStr || !co3Str || !pwht) {
            if (!isUpdate) showError('err_scc_acscc_step1', "Please enter all required fields: pH, CO3 Concentration, and PWHT status.");
            return;
        }

        const ph = parseFloat(phStr);
        const co3 = parseFloat(co3Str);

        if (isNaN(ph) || isNaN(co3)) {
             showError('err_scc_acscc_step1', "Please enter valid numeric values for pH and CO3.");
             return;
        }
        
        if (ph < 0 || co3 < 0) {
             showError('err_scc_acscc_step1', "Values cannot be negative.");
             return;
        }

        // 1. Initial Calculation
        let baseSusc = 'None';
        
        if (acsccSusceptibilityData) {
            const map = acsccSusceptibilityData.susceptibility_map;
            // ... (Logic remains same, mapped from table) ...
            if (pwht === 'Yes') {
                 baseSusc = map.effective_pwht;
            } else {
                const ranges = map.ineffective_pwht;
                let matchedRange = null;
                for (const r of ranges) {
                    if (ph >= r.ph_min && ph < r.ph_max) { matchedRange = r; break; }
                    if (r.ph_min === 9.5 && ph >= 9.5) { matchedRange = r; break; }
                }

                if (matchedRange) {
                    for (const co3Range of matchedRange.co3_ranges) {
                        if (co3 < co3Range.max || (co3Range.max === 999999 && co3 >= 1000)) { 
                           baseSusc = co3Range.susc;
                           break;
                        }
                    }
                }
            }
        }

        // Display Base
        if (!isUpdate) {
            valACSCCSusceptibility.innerText = baseSusc;
            // divACSCCStep1Result.classList.remove('hidden'); // Removed alert style per user
            document.getElementById('div_scc_acscc_step1_result').classList.remove('hidden');

            divACSCCCracks.classList.remove('hidden'); 
            
            // Reset downstream
            divACSCCFinalResult.classList.add('hidden');
            selACSCCCracksPresent.value = "No";
            divACSCCCracksRemoved.classList.add('hidden');
            selACSCCCracksRemoved.value = "";
            document.getElementById('div_scc_acscc_step2').classList.add('hidden');
        }

        // 2. Apply Cracking Overrides
        let finalSusc = baseSusc;
        
        const cracksPresent = selACSCCCracksPresent.value;
        const cracksRemoved = selACSCCCracksRemoved.value;

        if (cracksPresent === 'Yes') {
            finalSusc = 'High';
            if (cracksRemoved === 'No') {
                 finalSusc = 'FFS Required';
            } else if (cracksRemoved === 'Yes') {
                finalSusc = 'High';
            } else {
                // Not selected yet -> Hide final and return
                divACSCCFinalResult.classList.add('hidden');
                document.getElementById('div_scc_acscc_step2').classList.add('hidden');
                return;
            }
        }

        // Display Final
        if (isUpdate || !divACSCCCracks.classList.contains('hidden')) {
             valACSCCFinalSusceptibility.innerText = finalSusc;
             // msgACSCCOverride... (optional message logic)
             divACSCCFinalResult.classList.remove('hidden');

             sessionStorage.setItem('scc_acscc_susceptibility', finalSusc);
             
             // Step 2 Logic
             if (finalSusc !== 'FFS Required') {
                 calculateACSCCSVI(finalSusc);
             } else {
                 document.getElementById('div_scc_acscc_step2').classList.add('hidden');
             }
        }
    }

    function calculateACSCCSVI(susc) {
         const divStep2 = document.getElementById('div_scc_acscc_step2');
         if (!divStep2) return;
         
         let svi = 0;
         if (acsccSeverityData && acsccSeverityData.mappings) {
             svi = acsccSeverityData.mappings[susc] !== undefined ? acsccSeverityData.mappings[susc] : 0;
         } else {
             // Fallback if JSON fails or not loaded
             if (susc === 'High') svi = 5000; // Updated to 5000 based on JSON content seen
             else if (susc === 'Medium') svi = 500;
             else if (susc === 'Low') svi = 50;
             else svi = 0; // None
         }

         // Display
         const valSVI = document.getElementById('val_scc_acscc_svi');
         if(valSVI) valSVI.textContent = svi;
         
         divStep2.classList.remove('hidden');
         sessionStorage.setItem('scc_acscc_svi', svi);

         // Unlock Step 3
         const divStep3 = document.getElementById('div_scc_acscc_step3');
         if(divStep3) divStep3.classList.remove('hidden');

         // Trigger downstream
         calculateACSCCBaseDamageFactor();
    }

    // Step 3 Logic: Time in Service
    const inpACSCCDate = document.getElementById('inp_scc_acscc_date');
    if (inpACSCCDate) {
        inpACSCCDate.addEventListener('change', () => {
            const dateVal = inpACSCCDate.value;
            if (dateVal) {
                const inspectionDate = new Date(dateVal);
                const today = new Date();
                let age = (today - inspectionDate) / (1000 * 60 * 60 * 24 * 365.25);
                if (age < 0) age = 0;
                
                const ageFixed = age.toFixed(2);
                sessionStorage.setItem('scc_acscc_age', ageFixed);
                
                // Show Result
                const divResult = document.getElementById('div_scc_acscc_step3_result');
                const valAge = document.getElementById('val_acscc_age');
                if (divResult && valAge) {
                    valAge.innerText = ageFixed;
                    divResult.classList.remove('hidden');
                }

                // Unlock Step 4
                const divStep4 = document.getElementById('div_scc_acscc_step4');
                if (divStep4) divStep4.classList.remove('hidden');

                calculateACSCCFinalDamageFactor();
            } else {
                sessionStorage.removeItem('scc_acscc_age');
                const divStep4 = document.getElementById('div_scc_acscc_step4');
                if (divStep4) divStep4.classList.add('hidden');
            }
        });
    }

    // Step 4 Logic: Inspection Effectiveness
    const btnACSCCViewDef = document.getElementById('btn_scc_acscc_view_definitions');
    const divACSCCDef = document.getElementById('div_scc_acscc_definitions');
    const tbodyACSCCDef = document.getElementById('tbody_scc_acscc_definitions');
    let acsccDefinitionsLoaded = false;

    if(btnACSCCViewDef) {
        btnACSCCViewDef.addEventListener('click', async () => {
             divACSCCDef.classList.toggle('hidden');
             
             if (!divACSCCDef.classList.contains('hidden') && !acsccDefinitionsLoaded) {
                 // Load Data
                 try {
                     const response = await fetch('/static/formula_app/data/json/scc_acscc_inspection_definitions.json');
                     if(!response.ok) throw new Error("Failed to load definitions");
                     const data = await response.json();
                     
                     tbodyACSCCDef.innerHTML = '';
                     data.forEach(row => {
                         const tr = document.createElement('tr');
                         tr.innerHTML = `
                            <td class="font-bold text-center">${row.category}</td>
                            <td>${row.effectiveness}</td>
                            <td class="text-xs whitespace-pre-wrap">${row.intrusive}</td>
                            <td class="text-xs whitespace-pre-wrap">${row.non_intrusive}</td>
                         `;
                         tbodyACSCCDef.appendChild(tr);
                     });
                     acsccDefinitionsLoaded = true;
                 } catch(e) {
                     console.error(e);
                     tbodyACSCCDef.innerHTML = '<tr><td colspan="4" class="text-red-500">Error loading definitions.</td></tr>';
                 }
             }
        });
    }

    const inpACSCCInspA = document.getElementById('inp_scc_acscc_insp_A');
    const inpACSCCInspB = document.getElementById('inp_scc_acscc_insp_B');
    const inpACSCCInspC = document.getElementById('inp_scc_acscc_insp_C');
    const inpACSCCInspD = document.getElementById('inp_scc_acscc_insp_D');

    if(inpACSCCInspA) {
        [inpACSCCInspA, inpACSCCInspB, inpACSCCInspC, inpACSCCInspD].forEach(inp => {
            if(inp) inp.addEventListener('change', calculateACSCCInspectionEffectiveness);
            if(inp) inp.addEventListener('input', calculateACSCCInspectionEffectiveness); 
        });
    }

    function calculateACSCCInspectionEffectiveness() {
        let countA = parseInt(inpACSCCInspA.value) || 0;
        let countB = parseInt(inpACSCCInspB.value) || 0;
        let countC = parseInt(inpACSCCInspC.value) || 0;
        let countD = parseInt(inpACSCCInspD.value) || 0;

        // Equivalency Propagation (2 Lower = 1 Higher)
        if (countD >= 2) countC += Math.floor(countD / 2);
        if (countC >= 2) countB += Math.floor(countC / 2);
        if (countB >= 2) countA += Math.floor(countB / 2);

        let finalEffCat = 'E';
        let finalEffCount = 0;

        if (countA > 0) {
            finalEffCat = 'A';
            finalEffCount = countA;
        } else if (countB > 0) {
            finalEffCat = 'B';
            finalEffCount = countB;
        } else if (countC > 0) {
            finalEffCat = 'C';
            finalEffCount = countC;
        } else if (countD > 0) {
            finalEffCat = 'D';
            finalEffCount = countD;
        }

        // Display
        const lblCat = document.getElementById('val_scc_acscc_final_eff_cat');
        const lblCount = document.getElementById('val_scc_acscc_final_eff_count');
        if(lblCat && lblCount) {
             lblCat.innerText = finalEffCat;
             lblCount.innerText = finalEffCount;
             document.getElementById('div_scc_acscc_step4_result').classList.remove('hidden');
        }

        // Save
        sessionStorage.setItem('scc_acscc_inspection_cat', finalEffCat);
        sessionStorage.setItem('scc_acscc_inspection_count', finalEffCount);

        // Unlock Step 5
        const divStep5 = document.getElementById('div_scc_acscc_step5');
        if(divStep5) {
             divStep5.classList.remove('hidden');
             // Auto-Calculate Step 5
             calculateACSCCBaseDamageFactor();
        }
    }

    // Step 5 Logic: Base Damage Factor
    // Step 5 Logic: Base Damage Factor
    let acsccBaseFactorData = null;

    async function calculateACSCCBaseDamageFactor() {
        const svi = sessionStorage.getItem('scc_acscc_svi');
        const effCat = sessionStorage.getItem('scc_acscc_inspection_cat');
        const effCount = parseInt(sessionStorage.getItem('scc_acscc_inspection_count')) || 0;

        if (svi === null) return; // Should not happen if flow is correct

        // Load Data (Shared Table 2.C.1.3)
        if (!acsccBaseFactorData) {
            try {
                const response = await fetch('/static/formula_app/data/json/scc_base_damage_factor.json');
                if (!response.ok) throw new Error("Data load failed");
                acsccBaseFactorData = await response.json();
            } catch (e) {
                console.error(e);
                alert("Failed to load Base Damage Factor Table data.");
                return;
            }
        }

        const sviKey = String(svi);
        const data = acsccBaseFactorData.data;
        
        if (!data[sviKey]) {
            console.error(`SVI '${sviKey}' not found in Base DF table.`);
            // Maybe handle SVI not in table (e.g. 50? Table has 50? Yes)
            // If SVI is 0, it's there.
            return;
        }

        let baseDF = 0;

        if (effCat === 'E' || effCount <= 0) {
            baseDF = data[sviKey]['E'];
        } else {
            // Count logic (Cap at 6? Table goes up to 6)
            let countKey = effCount > 6 ? "6" : String(effCount);
            
            if (data[sviKey][countKey]) {
                const catGroup = data[sviKey][countKey];
                if (catGroup[effCat] !== undefined) {
                    baseDF = catGroup[effCat];
                } else {
                    // Fallback to E if cat not found (shouldn't happen for A-D)
                    baseDF = data[sviKey]['E'];
                }
            } else {
                 // Fallback
                 baseDF = data[sviKey]['E'];
            }
        }

        // Display
        const valBaseDF = document.getElementById('val_scc_acscc_base_df');
        if(valBaseDF) {
            valBaseDF.innerText = baseDF;
             // Unlock Step 6
            const divStep6 = document.getElementById('div_scc_acscc_step6');
            sessionStorage.setItem('scc_acscc_base_df', baseDF);
            calculateACSCCFinalDamageFactor();
        }
    }

    function calculateACSCCFinalDamageFactor() {
        const baseDFStr = sessionStorage.getItem('scc_acscc_base_df');
        
        // Read directly from Input for Age to avoid stale storage execution
        const inpAge = document.getElementById('inp_scc_acscc_age');
        const ageVal = inpAge ? parseFloat(inpAge.value) : NaN;

        const divStep6 = document.getElementById('div_scc_acscc_step6');
        
        // Strict Prerequisite Check: BaseDF must exist, Age must be valid number > 0
        if (baseDFStr === null || isNaN(ageVal) || ageVal < 0 || inpAge.value.trim() === "") {
             if(divStep6) divStep6.classList.add('hidden');
             return;
        }

        const baseDF = parseFloat(baseDFStr);
        const age = ageVal;
        
        // Equation 2.C.9: Df = Dfb * age^1.1
        const timeFactor = Math.pow(Math.max(age, 1.0), 1.1);
        let finalDF = baseDF * timeFactor;
        
        if (finalDF > 5000) finalDF = 5000;
        finalDF = parseFloat(finalDF.toFixed(1));

        // Display
        const valFinalDF = document.getElementById('val_scc_acscc_final_df');
        if (valFinalDF) {
            valFinalDF.innerText = finalDF;
            if(divStep6) divStep6.classList.remove('hidden');
        }
        
        sessionStorage.setItem('scc_acscc_final_df', finalDF);
        calculateGoverningSCCDF();
    }

// === CLSCC (Chloride) Logic ===
function initCLSCC() {
    loadCLSCCRequiredData();
}

async function loadCLSCCRequiredData() {
    const tbody = document.getElementById('tbody_scc_clscc_required_data');
    if(!tbody) return;

    try {
        const response = await fetch('/static/formula_app/data/json/scc_clscc_required_data.json');
        if (!response.ok) throw new Error("Failed to load CLSCC required data");
        const data = await response.json();
        
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-semibold align-top">${row.parameter}</td>
                <td class="text-sm align-top text-gray-600">${row.comments}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-red-500">Error loading data.</td></tr>';
    }
}

// Global ClSCC Data
let clsccSusceptibilityData = null;

async function loadCLSCCSusceptibilityData() {
    if (clsccSusceptibilityData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_clscc_susceptibility.json');
        if (!response.ok) throw new Error("Failed");
        clsccSusceptibilityData = await response.json();
    } catch (e) {
        console.error("Error loading ClSCC Susceptibility JSON", e);
    }
}

// ClSCC Selectors & Listeners
let clsccModifiersData = null;
let clsccSVIData = null;
let clsccBaseDFData = null;

const btnCalcCLSCC = document.getElementById('btn_scc_clscc_calc_susceptibility');
if(btnCalcCLSCC) {
    btnCalcCLSCC.addEventListener('click', calculateCLSCCSusceptibility);
    loadCLSCCSusceptibilityData(); // Preload logic
    loadCLSCCModifiersData();
    loadCLSCCSVIData(); // Preload SVI data
    loadCLSCCBaseDFData(); // Preload Base DF data
}

async function loadCLSCCModifiersData() {
    try {
        const response = await fetch('/static/formula_app/data/json/scc_clscc_modifiers.json');
        if (!response.ok) throw new Error("HTTP error " + response.status);
        clsccModifiersData = await response.json();
    } catch (e) {
        console.error("Failed to load ClSCC modifiers:", e);
    }
}

async function loadCLSCCSVIData() {
    if (clsccSVIData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_severity_index.json');
        if (!response.ok) throw new Error("HTTP error " + response.status);
        clsccSVIData = await response.json();
    } catch (e) {
        console.error("Failed to load ClSCC SVI data:", e);
    }
}

async function loadCLSCCBaseDFData() {
    if (clsccBaseDFData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_base_damage_factor.json');
        if (!response.ok) throw new Error("HTTP error " + response.status);
        clsccBaseDFData = await response.json();
    } catch (e) {
        console.error("Failed to load ClSCC Base DF data:", e);
    }
}

const selClSCCCracks = document.getElementById('sel_scc_clscc_cracks_present');
const selClSCCRemoved = document.getElementById('sel_scc_clscc_cracks_removed');

if(selClSCCCracks) {
    selClSCCCracks.addEventListener('change', updateCLSCCFlow);
}
if(selClSCCRemoved) {
    selClSCCRemoved.addEventListener('change', updateCLSCCFlow);
}

function updateCLSCCFlow() {
    const cracks = selClSCCCracks.value;
    const divRemoved = document.getElementById('div_scc_clscc_cracks_removed');
    
    // Toggle Removed Question Visibility
    if (cracks === 'Yes') {
        divRemoved.classList.remove('hidden');
    } else {
        divRemoved.classList.add('hidden');
    }
    
    // Re-evaluate Final Result if Step 3 result exists
    const step3Result = sessionStorage.getItem('scc_clscc_step3_result');
    if (step3Result) {
       const baseResult = sessionStorage.getItem('scc_clscc_base_susceptibility') || "--";
       applyFinalCLSCCLogic(baseResult, step3Result, JSON.parse(sessionStorage.getItem('scc_clscc_modifiers_list') || "[]"));
    }
}

function applyFinalCLSCCLogic(baseResult, step3Result, step3Modifiers) {
    const cracks = selClSCCCracks.value;
    const removed = selClSCCRemoved.value;
    
    let step1Display = baseResult;
    let step1Note = "";
    let step2Display = baseResult;
    let step3Display = step3Result;
    let finalModifiers = [...step3Modifiers];
    
    // Flowchart Checks
    if (cracks === 'Yes') {
        // Step 1: Set to High and Skip to Step 4
        if (removed === 'Yes') {
            step1Display = "High";
            step1Note = "Cracks Confirmed & Removed";
        } else if (removed === 'No') {
            step1Display = "FFS Required (Per API 579-1)";
            step1Note = "Cracks Present & Not Removed";
        } else {
            step1Display = "High (Pending Removal Check)";
            step1Note = "Cracks Present";
        }
        
        // Step 2 & 3: Skipped
        step2Display = "Skipped (Cracks Present)";
        step3Display = "Skipped (Cracks Present)";
        finalModifiers = ["Calculation skipped due to existing cracks."];
    } else {
        // Cracks = No or Select...
        // Step 1 is the Table Value
        step1Note = "No cracks present.";
    }
    
    displayCLSCCResult(step1Display, step1Note, step2Display, step3Display, finalModifiers);
}

async function calculateCLSCCSusceptibility() {
    // 1. Get Input Elements
    const inpTemp = document.getElementById('inp_scc_clscc_temp');
    const selTempUnit = document.getElementById('sel_scc_clscc_temp_unit');
    const inpPh = document.getElementById('inp_scc_clscc_ph');
    const inpClConc = document.getElementById('inp_scc_clscc_cl_conc');
    const selCracks = document.getElementById('sel_scc_clscc_cracks_present');
    
    // Selectors
    const divResult = document.getElementById('div_scc_clscc_susceptibility_result');
    const errBox = document.getElementById('err_scc_clscc_step1');

    // Validation using validateInputs
    const isValid = validateInputs([inpTemp, selTempUnit, inpPh, inpClConc, selCracks]);
    
    if (!isValid) {
        errBox.innerText = "Please fill in all required fields (Temperature, Temperature Unit, pH, Chloride, Cracks Present).";
        errBox.classList.remove('hidden');
        divResult.classList.add('hidden');
        return;
    }
    errBox.classList.add('hidden');
    
    // 2. Parse Values
    const tempVal = parseFloat(inpTemp.value);
    const tempUnit = selTempUnit.value; // 'F' or 'C'
    const phVal = parseFloat(inpPh.value);
    const clConc = parseFloat(inpClConc.value);

    if (!clsccSusceptibilityData) await loadCLSCCSusceptibilityData();
    if (!clsccSusceptibilityData) return; // Error state

    // 2. Determine Susceptibility from Table
    // Handle Note 5: pH < 2.5 -> None (Go to HCl)
    if (phVal < 2.5) {
        finishCLSCCCalculation("None", "None (pH < 2.5)", ["See HCl corrosion"]);
        return;
    }

    const cols = clsccSusceptibilityData.ph_columns;
    let closestPH = cols[0];
    let minDiff = Math.abs(phVal - closestPH);
    for(let i=1; i<cols.length; i++) {
        const diff = Math.abs(phVal - cols[i]);
        if(diff < minDiff) {
            minDiff = diff;
            closestPH = cols[i];
        }
    }
    const colIndex = cols.indexOf(closestPH);

    // Row Lookup (Temp)
    let rowIndex = -1;
    const rows = (tempUnit === 'C') ? clsccSusceptibilityData.rows_c : clsccSusceptibilityData.rows_f;
    
    for(let i=0; i<rows.length; i++) {
        if(tempVal > rows[i].min && tempVal <= rows[i].max) {
             rowIndex = i;
             break;
        }
    }
    if(rowIndex === -1) rowIndex = rows.length - 1; 

    let baseSusc = clsccSusceptibilityData.susceptibility_grid[rowIndex][colIndex];

    // 3. Step 3: Apply Modifiers
    // Modifiers Logic (Table 2.C.5.3)
    // Convert to index for math: High=3, Medium=2, Low=1, None=0
    const susceptibilityMap = {"High": 3, "Medium": 2, "Low": 1, "None": 0};
    let currentLevel = susceptibilityMap[baseSusc];
    let appliedModifiers = [];

    // inputs for Step 3
    // Oxygen & Deposits removed per user request (Step 1 simplification)
    // We assume defaults that trigger NO modifiers for these:
    // O2 > 90 ppb (Normal)
    // Deposits = No

    if (clsccModifiersData && clsccModifiersData.modifiers) {
        const mods = clsccModifiersData.modifiers;
        
        // Chloride < 10 ppm -> -1
        if (clConc < 10) {
           currentLevel -= 1;
           appliedModifiers.push("Cl < 10 ppm (-1)");
        }
        
        // Chloride > 100 ppm -> +1
        if (clConc > 100) {
            currentLevel += 1;
            appliedModifiers.push("Cl > 100 ppm (+1)");
        }
    }

    // Clamp Level 0-3
    if (currentLevel < 0) currentLevel = 0;
    if (currentLevel > 3) currentLevel = 3;

    // Convert back to String
    const revSuscMap = ["None", "Low", "Medium", "High"];
    let finalSusc = revSuscMap[currentLevel];
    
    finishCLSCCCalculation(baseSusc, finalSusc, appliedModifiers);
}

function finishCLSCCCalculation(baseResult, finalResult, modifiers) {
   // Store Base Results
   sessionStorage.setItem('scc_clscc_base_susceptibility', baseResult);
   sessionStorage.setItem('scc_clscc_step3_result', finalResult);
   sessionStorage.setItem('scc_clscc_modifiers_list', JSON.stringify(modifiers));

   applyFinalCLSCCLogic(baseResult, finalResult, modifiers);
}

function displayCLSCCResult(valStep1, noteStep1, valStep2, valStep3, modifiers) {
    const divResult = document.getElementById('div_scc_clscc_susceptibility_result');
    
    const msgStep1 = document.getElementById('val_scc_clscc_step1_susc');
    const noteStep1Elem = document.getElementById('msg_scc_clscc_step1_note');
    
    const divStep2 = document.getElementById('div_scc_clscc_step2_result');
    const msgStep2 = document.getElementById('val_scc_clscc_base_susc');
    
    const divStep3 = document.getElementById('div_scc_clscc_step3_result');
    const msgStep3 = document.getElementById('val_scc_clscc_susceptibility');
    const msgModifiers = document.getElementById('msg_scc_clscc_modifiers');

    divResult.classList.remove('hidden');
    
    if(msgStep1) msgStep1.innerText = valStep1;
    if(noteStep1Elem) noteStep1Elem.innerText = noteStep1;
    
    // Show Step 2 only if we have a valid (non-skipped) value
    if(msgStep2 && valStep2 && !valStep2.includes('Skipped')) {
        msgStep2.innerText = valStep2;
        if(divStep2) divStep2.classList.remove('hidden');
    } else {
        // Hide Step 2 if skipped
        if(divStep2) divStep2.classList.add('hidden');
    }
    
    // Show Step 3 only if we have a valid (non-skipped) value
    if(msgStep3 && valStep3 && !valStep3.includes('Skipped')) {
        msgStep3.innerText = valStep3;
        if(divStep3) divStep3.classList.remove('hidden');
        
        if(modifiers.length > 0) {
            if(msgModifiers) msgModifiers.innerText = modifiers.join(', ');
        } else {
            if(msgModifiers) msgModifiers.innerText = "No modifiers applied.";
        }
    } else {
        // Hide Step 3 if skipped
        if(divStep3) divStep3.classList.add('hidden');
    }

    // Color coding for Step 1 if critical override
    if(valStep1.includes('High') || valStep1.includes('FFS')) {
         if(msgStep1) {
             msgStep1.classList.remove('text-gray-800');
             msgStep1.classList.add('text-red-900');
         }
    } else {
         if(msgStep1) {
             msgStep1.classList.remove('text-red-900');
             msgStep1.classList.add('text-gray-800');
         }
    }
    
    // Color coding for Step 3 if High
    if(valStep3 === 'High' || valStep3.includes('FFS')) {
        if(msgStep3) {
            msgStep3.classList.remove('text-gray-800');
            msgStep3.classList.add('text-red-900');
        }
    } else {
        if(msgStep3) {
            msgStep3.classList.remove('text-red-900');
            msgStep3.classList.add('text-gray-800');
        }
    }

    // Store in Session Final
    const statusToCheck = (valStep3.includes('Skipped')) ? valStep1 : valStep3;
    sessionStorage.setItem('scc_clscc_susceptibility', statusToCheck);
    
    // Calculate and display SVI (Step 4)
    calculateCLSCCSVI(statusToCheck);
}

/**
 * Calculate and display ClSCC Severity Index (SVI) - Step 4
 * @param {string} susceptibility - Final susceptibility value (High, Medium, Low, None)
 */
async function calculateCLSCCSVI(susceptibility) {
    // Load SVI data if not already loaded
    if (!clsccSVIData) await loadCLSCCSVIData();
    if (!clsccSVIData) return; // Error state
    
    const divStep4 = document.getElementById('div_scc_clscc_step4_result');
    const msgSVI = document.getElementById('val_scc_clscc_svi');
    
    if (!divStep4 || !msgSVI) return;
    
    // Extract clean susceptibility value (remove any notes in parentheses)
    let cleanSusceptibility = susceptibility;
    if (susceptibility.includes('(')) {
        cleanSusceptibility = susceptibility.split('(')[0].trim();
    }
    
    // Handle special cases
    if (cleanSusceptibility.includes('FFS')) {
        cleanSusceptibility = 'High'; // FFS Required maps to High
    }
    
    // Get SVI from mapping
    const sviValue = clsccSVIData.mappings[cleanSusceptibility];
    
    if (sviValue !== undefined) {
        msgSVI.innerText = sviValue;
        divStep4.classList.remove('hidden');
        
        // Store in sessionStorage
        sessionStorage.setItem('scc_clscc_svi', sviValue);
        
        // Reveal Step 5 (Time in Service)
        const divStep5 = document.getElementById('div_scc_clscc_step5');
        if (divStep5) divStep5.classList.remove('hidden');
    } else {
        console.error('Unknown susceptibility value for SVI mapping:', cleanSusceptibility);
        msgSVI.innerText = '--';
        divStep4.classList.add('hidden');
    }
}

// ClSCC Step 5: Time in Service (Age Calculation)
const inpClSCCInstallDate = document.getElementById('inp_scc_clscc_install_date');
if (inpClSCCInstallDate) {
    inpClSCCInstallDate.addEventListener('change', calculateClSCCAge);
}

function calculateClSCCAge() {
    const valAge = document.getElementById('val_scc_clscc_age');
    
    // Validation using validateInputs
    const isValid = validateInputs([inpClSCCInstallDate]);
    
    if (!isValid || !valAge) {
        if (valAge) valAge.innerText = '--';
        return;
    }

    const dateVal = inpClSCCInstallDate.value;
    const installDate = new Date(dateVal);
    const currentDate = new Date();
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(currentDate - installDate);
    // Convert to years (approximate using 365.25 days)
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    
    const age = diffYears.toFixed(2); // 2 decimal places
    
    // Update UI
    valAge.innerText = age;

    // Save to Session
    sessionStorage.setItem('scc_clscc_age', age);
    console.log(`ClSCC Step 5 Complete: Age=${age} years.`);
    
    // Reveal Step 6 (Inspection History)
    const divStep6 = document.getElementById('div_scc_clscc_step6');
    if (divStep6) divStep6.classList.remove('hidden');
}

// ClSCC Step 6: Inspection History
const inpClSCCInspA = document.getElementById('inp_scc_clscc_insp_A');
const inpClSCCInspB = document.getElementById('inp_scc_clscc_insp_B');
const inpClSCCInspC = document.getElementById('inp_scc_clscc_insp_C');
const inpClSCCInspD = document.getElementById('inp_scc_clscc_insp_D');

if (inpClSCCInspA && inpClSCCInspB && inpClSCCInspC && inpClSCCInspD) {
    [inpClSCCInspA, inpClSCCInspB, inpClSCCInspC, inpClSCCInspD].forEach(inp => {
        inp.addEventListener('input', calculateClSCCInspectionEffectiveness);
    });
}

/**
 * Calculate final effective inspection using 2:1 equivalency rule
 * 2 inspections of lower category = 1 inspection of higher category
 */
function calculateClSCCInspectionEffectiveness() {
    const countA = parseInt(inpClSCCInspA.value) || 0;
    const countB = parseInt(inpClSCCInspB.value) || 0;
    const countC = parseInt(inpClSCCInspC.value) || 0;
    const countD = parseInt(inpClSCCInspD.value) || 0;
    
    // Apply 2:1 equivalency rule (bottom-up)
    // Start with lowest category and work up
    let effA = countA;
    let effB = countB;
    let effC = countC;
    let effD = countD;
    
    // D -> C: 2D = 1C
    effC += Math.floor(effD / 2);
    effD = effD % 2;
    
    // C -> B: 2C = 1B
    effB += Math.floor(effC / 2);
    effC = effC % 2;
    
    // B -> A: 2B = 1A
    effA += Math.floor(effB / 2);
    effB = effB % 2;
    
    // Determine final effective category (highest non-zero)
    let finalCategory = 'E'; // Default to E (Ineffective)
    let finalCount = 0;
    
    if (effA > 0) {
        finalCategory = 'A';
        finalCount = effA;
    } else if (effB > 0) {
        finalCategory = 'B';
        finalCount = effB;
    } else if (effC > 0) {
        finalCategory = 'C';
        finalCount = effC;
    } else if (effD > 0) {
        finalCategory = 'D';
        finalCount = effD;
    }
    
    // Display result
    const divResult = document.getElementById('div_scc_clscc_step6_result');
    const valCat = document.getElementById('val_scc_clscc_final_eff_cat');
    const valCount = document.getElementById('val_scc_clscc_final_eff_count');
    
    if (divResult && valCat && valCount) {
        valCat.innerText = `Category ${finalCategory}`;
        valCount.innerText = finalCount;
        divResult.classList.remove('hidden');
    }
    
    // Save to sessionStorage
    sessionStorage.setItem('scc_clscc_final_eff_cat', finalCategory);
    sessionStorage.setItem('scc_clscc_final_eff_count', finalCount);
    
    console.log(`ClSCC Step 6 Complete: Final Effective = Category ${finalCategory} (Count: ${finalCount})`);
    
    // Trigger Step 7 calculation
    calculateClSCCBaseDamageFactor();
}

/**
 * Calculate and display ClSCC Base Damage Factor - Step 7
 * Uses Table 2.C.1.3 to lookup base DF based on SVI and Inspection Effectiveness
 */
async function calculateClSCCBaseDamageFactor() {
    // Load base DF data if not already loaded
    if (!clsccBaseDFData) await loadCLSCCBaseDFData();
    if (!clsccBaseDFData) return; // Error state
    
    const divStep7 = document.getElementById('div_scc_clscc_step7');
    const valBaseDF = document.getElementById('val_scc_clscc_base_df');
    
    if (!divStep7 || !valBaseDF) return;
    
    // Get SVI from sessionStorage (Step 4)
    const svi = parseInt(sessionStorage.getItem('scc_clscc_svi')) || 0;
    
    // Get Inspection data from sessionStorage (Step 6)
    const inspCategory = sessionStorage.getItem('scc_clscc_final_eff_cat') || 'E';
    const inspCount = parseInt(sessionStorage.getItem('scc_clscc_final_eff_count')) || 0;
    
    // Lookup in Table 2.C.1.3
    let baseDf = 0;
    
    // Get SVI row from table
    const sviKey = svi.toString();
    const sviRow = clsccBaseDFData.data[sviKey];
    
    if (!sviRow) {
        console.error(`SVI value ${svi} not found in base DF table`);
        valBaseDF.innerText = '--';
        return;
    }
    
    // Handle Category E (no effective inspections)
    if (inspCategory === 'E' || inspCount === 0) {
        baseDf = sviRow['E'];
    } else {
        // Cap count at 6 (table max)
        const countKey = Math.min(inspCount, 6).toString();
        const countRow = sviRow[countKey];
        
        if (!countRow) {
            console.error(`Count ${inspCount} not found in base DF table`);
            valBaseDF.innerText = '--';
            return;
        }
        
        // Get value for category
        baseDf = countRow[inspCategory];
        
        if (baseDf === undefined) {
            console.error(`Category ${inspCategory} not found in base DF table`);
            valBaseDF.innerText = '--';
            return;
        }
    }
    
    // Display result
    valBaseDF.innerText = baseDf;
    divStep7.classList.remove('hidden');
    
    // Save to sessionStorage
    sessionStorage.setItem('scc_clscc_base_df', baseDf);
    
    console.log(`ClSCC Step 7 Complete: Base DF = ${baseDf} (SVI=${svi}, Category=${inspCategory}, Count=${inspCount})`);
    
    // Trigger Step 8 calculation
    calculateClSCCFinalDamageFactor();
}

/**
 * Calculate and display ClSCC Final Damage Factor - Step 8
 * Uses Equation 2.C.4: D_f = min(D_fB × (max(age, 1.0))^1.1, 5000)
 */
function calculateClSCCFinalDamageFactor() {
    const divStep8 = document.getElementById('div_scc_clscc_step8');
    const valFinalDF = document.getElementById('val_scc_clscc_final_df');
    const msgFinal = document.getElementById('msg_scc_clscc_final');
    
    if (!divStep8 || !valFinalDF) return;
    
    // Get Base DF from sessionStorage (Step 7)
    const baseDf = parseFloat(sessionStorage.getItem('scc_clscc_base_df')) || 0;
    
    // Get Age from sessionStorage (Step 5)
    const age = parseFloat(sessionStorage.getItem('scc_clscc_age')) || 0;
    
    // Apply Equation 2.C.4
    // D_f^ClSCC = min(D_fB^ClSCC × (max(age, 1.0))^1.1, 5000)
    const ageForCalc = Math.max(age, 1.0);
    const escalatedDF = baseDf * Math.pow(ageForCalc, 1.1);
    const finalDF = Math.min(escalatedDF, 5000);
    
    // Round to 2 decimal places
    const finalDFRounded = Math.round(finalDF * 100) / 100;
    
    // Display result
    valFinalDF.innerText = finalDFRounded;
    divStep8.classList.remove('hidden');
    
    if (msgFinal) msgFinal.classList.remove('hidden');
    
    // Save to sessionStorage
    sessionStorage.setItem('scc_clscc_final_df', finalDFRounded);
    calculateGoverningSCCDF();
    
    console.log(`ClSCC Step 8 Complete: Final DF = ${finalDFRounded} (Base DF=${baseDf}, Age=${age})`);
}

// ========================================
// HIC/SOHIC-HF Module
// ========================================

// Load and display required data table for HIC/SOHIC-HF
const tbodyHICSOHICHFRequiredData = document.getElementById('tbody_scc_hic_sohic_hf_required_data');
if (tbodyHICSOHICHFRequiredData) {
    loadHICSOHICHFRequiredData();
}

async function loadHICSOHICHFRequiredData() {
    try {
        const response = await fetch('/static/formula_app/data/json/scc_hic_sohic_hf_required_data.json');
        if (!response.ok) throw new Error('Failed to load HIC/SOHIC-HF required data');
        const data = await response.json();
        
        const tbody = document.getElementById('tbody_scc_hic_sohic_hf_required_data');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        data.required_data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="font-semibold">${item.parameter}</td>
                <td class="text-sm">${item.comment}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading HIC/SOHIC-HF required data:', error);
        const tbody = document.getElementById('tbody_scc_hic_sohic_hf_required_data');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center text-red-600">Error loading required data</td></tr>';
        }
    }
}

// HIC/SOHIC-HF Step 1: Susceptibility Determination
const selHICHFCracksPresent = document.getElementById('sel_hic_hf_cracks_present');
const selHICHFCracksRemoved = document.getElementById('sel_hic_hf_cracks_removed');
const selHICHFHFPresent = document.getElementById('sel_hic_hf_hf_present');
const selHICHFCarbonSteel = document.getElementById('sel_hic_hf_carbon_steel');

// Table 2.C.6.2 inputs
const selHICHFProductForm = document.getElementById('sel_hic_hf_product_form');
const selHICHFPWHT = document.getElementById('sel_hic_hf_pwht');
const inpHICHFSulfur = document.getElementById('inp_hic_hf_sulfur');
const btnCalcHICHFSusceptibility = document.getElementById('btn_hic_hf_calc_susceptibility');

if (selHICHFCracksPresent) {
    selHICHFCracksPresent.addEventListener('change', updateHICHFStep1Flow);
}
if (selHICHFCracksRemoved) {
    selHICHFCracksRemoved.addEventListener('change', updateHICHFStep1Flow);
}
if (selHICHFHFPresent) {
    selHICHFHFPresent.addEventListener('change', updateHICHFStep1Flow);
}
if (selHICHFCarbonSteel) {
    selHICHFCarbonSteel.addEventListener('change', updateHICHFStep1Flow);
}
if (btnCalcHICHFSusceptibility) {
    btnCalcHICHFSusceptibility.addEventListener('click', calculateHICHFSusceptibility);
}

// Load susceptibility data
let hicHFSusceptibilityData = null;

async function loadHICHFSusceptibilityData() {
    if (hicHFSusceptibilityData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_hic_sohic_hf_susceptibility.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        hicHFSusceptibilityData = await response.json();
    } catch (e) {
        console.error('Failed to load HIC/SOHIC-HF susceptibility data:', e);
    }
}

// Load SVI data (reuse from ClSCC)
let hicHFSVIData = null;

// Preload data
if (btnCalcHICHFSusceptibility) {
    loadHICHFSusceptibilityData();
    loadHICHFSVIData(); // Preload SVI data
}

async function loadHICHFSVIData() {
    if (hicHFSVIData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_severity_index.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        hicHFSVIData = await response.json();
    } catch (e) {
        console.error('Failed to load HIC/SOHIC-HF SVI data:', e);
    }
}

function updateHICHFStep1Flow() {
    const cracksPresent = selHICHFCracksPresent.value;
    const cracksRemoved = selHICHFCracksRemoved.value;
    const hfPresent = selHICHFHFPresent.value;
    const carbonSteel = selHICHFCarbonSteel.value;
    
    const divCracksRemoved = document.getElementById('div_hic_hf_cracks_removed');
    const divHFPresent = document.getElementById('div_hic_hf_hf_present');
    const divCarbonSteel = document.getElementById('div_hic_hf_carbon_steel');
    const divTableInputs = document.getElementById('div_hic_hf_table_inputs');
    const divResult = document.getElementById('div_hic_hf_step1_result');
    const valSusceptibility = document.getElementById('val_hic_hf_susceptibility');
    const msgNote = document.getElementById('msg_hic_hf_susceptibility_note');
    
    // Reset visibility
    divCracksRemoved.classList.add('hidden');
    divHFPresent.classList.add('hidden');
    divCarbonSteel.classList.add('hidden');
    divTableInputs.classList.add('hidden');
    divResult.classList.add('hidden');
    
    // Decision Flow Logic
    if (cracksPresent === 'Yes') {
        // Show "Cracks Removed?" question
        divCracksRemoved.classList.remove('hidden');
        
        if (cracksRemoved) {
            // Determine susceptibility based on removal
            let susceptibility = 'High';
            let note = '';
            
            if (cracksRemoved === 'Yes') {
                susceptibility = 'High';
                note = 'Cracks confirmed and removed. Continue to Step 2.';
            } else if (cracksRemoved === 'No') {
                susceptibility = 'FFS Required';
                note = 'Cracks present and not removed. Fitness-for-Service evaluation required per API 579-1.';
            }
            
            // Display result
            valSusceptibility.innerText = susceptibility;
            msgNote.innerText = note;
            divResult.classList.remove('hidden');
            
            // Apply color coding
            if (susceptibility.includes('FFS')) {
                valSusceptibility.classList.add('text-red-900');
                valSusceptibility.classList.remove('text-blue-900');
            } else {
                valSusceptibility.classList.add('text-red-900');
                valSusceptibility.classList.remove('text-blue-900');
            }
            
            // Store in sessionStorage
            sessionStorage.setItem('hic_hf_susceptibility', susceptibility);
            
            // Calculate SVI for non-FFS cases
            if (!susceptibility.includes('FFS')) {
                calculateHICHFSVI(susceptibility);
            }
        }
    } else if (cracksPresent === 'No') {
        // Show "HF Present?" question
        divHFPresent.classList.remove('hidden');
        
        if (hfPresent === 'No') {
            // Not Susceptible
            valSusceptibility.innerText = 'Not Susceptible';
            msgNote.innerText = 'HF is not present in the component.';
            divResult.classList.remove('hidden');
            valSusceptibility.classList.remove('text-red-900');
            valSusceptibility.classList.add('text-blue-900');
            sessionStorage.setItem('hic_hf_susceptibility', 'Not Susceptible');
            calculateHICHFSVI('Not Susceptible');
        } else if (hfPresent === 'Yes') {
            // Show "Carbon Steel?" question
            divCarbonSteel.classList.remove('hidden');
            
            if (carbonSteel === 'No') {
                // Not Susceptible
                valSusceptibility.innerText = 'Not Susceptible';
                msgNote.innerText = 'Material is not carbon steel.';
                divResult.classList.remove('hidden');
                valSusceptibility.classList.remove('text-red-900');
                valSusceptibility.classList.add('text-blue-900');
                sessionStorage.setItem('hic_hf_susceptibility', 'Not Susceptible');
                calculateHICHFSVI('Not Susceptible');
            } else if (carbonSteel === 'Yes') {
                // Show Table 2.C.6.2 inputs
                divTableInputs.classList.remove('hidden');
            }
        }
    }
}

async function calculateHICHFSusceptibility() {
    // Load data if not already loaded
    if (!hicHFSusceptibilityData) await loadHICHFSusceptibilityData();
    if (!hicHFSusceptibilityData) return;
    
    const productForm = selHICHFProductForm.value;
    const pwht = selHICHFPWHT.value;
    const sulfurContent = parseFloat(inpHICHFSulfur.value);
    
    const divResult = document.getElementById('div_hic_hf_step1_result');
    const valSusceptibility = document.getElementById('val_hic_hf_susceptibility');
    const msgNote = document.getElementById('msg_hic_hf_susceptibility_note');
    const errBox = document.getElementById('err_hic_hf_step1');
    
    // Validation
    const isValid = validateInputs([selHICHFProductForm, selHICHFPWHT, inpHICHFSulfur]);
    
    if (!isValid || isNaN(sulfurContent)) {
        errBox.innerText = 'Please fill in all required fields (Product Form, PWHT, Sulfur Content).';
        errBox.classList.remove('hidden');
        divResult.classList.add('hidden');
        return;
    }
    errBox.classList.add('hidden');
    
    // Determine susceptibility using Table 2.C.6.2
    let susceptibility = 'Not Susceptible';
    let note = '';
    
    // Special case: Seamless Pipe is always Low
    if (productForm === 'Seamless_Pipe') {
        susceptibility = 'Low';
        note = 'Seamless/Extruded Pipe product form.';
    } else if (productForm === 'Plate') {
        // Determine sulfur category
        const sulfurThreshold = hicHFSusceptibilityData.sulfur_threshold; // 0.01
        const sulfurCategory = sulfurContent > sulfurThreshold ? 'High_Sulfur' : 'Low_Sulfur';
        
        // Lookup in table
        susceptibility = hicHFSusceptibilityData.data[pwht][sulfurCategory];
        note = `Rolled and Welded Plate, ${pwht}, Sulfur: ${sulfurContent}% (${sulfurCategory.replace('_', ' ')})`;
    }
    
    // Display result
    valSusceptibility.innerText = susceptibility;
    msgNote.innerText = note;
    divResult.classList.remove('hidden');
    
    // Apply color coding
    if (susceptibility === 'High') {
        valSusceptibility.classList.add('text-red-900');
        valSusceptibility.classList.remove('text-blue-900');
    } else if (susceptibility === 'Medium') {
        valSusceptibility.classList.remove('text-red-900');
        valSusceptibility.classList.add('text-orange-600');
    } else {
        valSusceptibility.classList.remove('text-red-900', 'text-orange-600');
        valSusceptibility.classList.add('text-blue-900');
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('hic_hf_susceptibility', susceptibility);
    
    console.log(`HIC/SOHIC-HF Step 1 Complete: Susceptibility = ${susceptibility}`);
    
    // Calculate SVI (Step 2)
    calculateHICHFSVI(susceptibility);
}

/**
 * Calculate and display HIC/SOHIC-HF Severity Index - Step 2
 * Uses Table 2.C.1.2 to map susceptibility to SVI
 */
async function calculateHICHFSVI(susceptibility) {
    // Load SVI data if not already loaded
    if (!hicHFSVIData) await loadHICHFSVIData();
    if (!hicHFSVIData) return;
    
    const divStep2 = document.getElementById('div_hic_hf_step2');
    const valSVI = document.getElementById('val_hic_hf_svi');
    
    if (!divStep2 || !valSVI) return;
    
    // Clean susceptibility value (remove notes in parentheses)
    let cleanSusceptibility = susceptibility.split('(')[0].trim();
    
    // Map susceptibility to SVI using Table 2.C.1.2
    let svi = 0;
    
    if (hicHFSVIData.mappings && hicHFSVIData.mappings[cleanSusceptibility] !== undefined) {
        svi = hicHFSVIData.mappings[cleanSusceptibility];
    } else {
        console.warn(`Susceptibility "${cleanSusceptibility}" not found in SVI mappings. Defaulting to 0.`);
        svi = 0;
    }
    
    // Display result
    valSVI.innerText = svi;
    divStep2.classList.remove('hidden');
    
    // Store in sessionStorage
    sessionStorage.setItem('hic_hf_svi', svi);
    
    console.log(`HIC/SOHIC-HF Step 2 Complete: SVI = ${svi} (Susceptibility: ${cleanSusceptibility})`);
    
    // Reveal Step 3 (Time in Service)
    const divStep3 = document.getElementById('div_hic_hf_step3');
    if (divStep3) divStep3.classList.remove('hidden');
}

// HIC/SOHIC-HF Step 3: Time in Service
const inpHICHFInstallDate = document.getElementById('inp_hic_hf_install_date');

if (inpHICHFInstallDate) {
    inpHICHFInstallDate.addEventListener('change', calculateHICHFAge);
}

function calculateHICHFAge() {
    const valAge = document.getElementById('val_hic_hf_age');
    
    const errDiv = document.getElementById('err_hic_hf_step3');
    if (errDiv) errDiv.classList.add('hidden');

    // Validation using validateInputs
    const isValid = validateInputs([inpHICHFInstallDate]); // Assuming validateInputs handles highlighting
    
    if (!isValid) return;

    const dateVal = inpHICHFInstallDate.value;
    const installDate = new Date(dateVal);
    const currentDate = new Date();
    
    if (installDate > currentDate) {
         if (errDiv) {
            errDiv.innerText = "Inspection date cannot be in the future.";
            errDiv.classList.remove('hidden');
        }
        return;
    }
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(currentDate - installDate);
    // Convert to years (approximate using 365.25 days)
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    
    const age = diffYears.toFixed(2); // 2 decimal places
    
    // Update UI
    valAge.innerText = age;

    // Save to Session
    sessionStorage.setItem('hic_hf_age', age);
    console.log(`HIC/SOHIC-HF Step 3 Complete: Age=${age} years.`);
    
    // Reveal Step 4 (Inspection History)
    const divStep4 = document.getElementById('div_hic_hf_step4');
    if (divStep4) divStep4.classList.remove('hidden');
}

// HIC/SOHIC-HF Step 4: Inspection History
const inpHICHFInspA = document.getElementById('inp_hic_hf_insp_A');
const inpHICHFInspB = document.getElementById('inp_hic_hf_insp_B');
const inpHICHFInspC = document.getElementById('inp_hic_hf_insp_C');
const inpHICHFInspD = document.getElementById('inp_hic_hf_insp_D');

if (inpHICHFInspA && inpHICHFInspB && inpHICHFInspC && inpHICHFInspD) {
    [inpHICHFInspA, inpHICHFInspB, inpHICHFInspC, inpHICHFInspD].forEach(inp => {
        inp.addEventListener('input', calculateHICHFInspectionEffectiveness);
    });
}

/**
 * Calculate final effective inspection using 2:1 equivalency rule
 * 2 inspections of lower category = 1 inspection of higher category
 */
function calculateHICHFInspectionEffectiveness() {
    const countA = parseInt(inpHICHFInspA.value) || 0;
    const countB = parseInt(inpHICHFInspB.value) || 0;
    const countC = parseInt(inpHICHFInspC.value) || 0;
    const countD = parseInt(inpHICHFInspD.value) || 0;
    
    // Apply 2:1 equivalency rule (bottom-up)
    // Start with lowest category and work up
    let effA = countA;
    let effB = countB;
    let effC = countC;
    let effD = countD;
    
    // D -> C: 2D = 1C
    effC += Math.floor(effD / 2);
    effD = effD % 2;
    
    // C -> B: 2C = 1B
    effB += Math.floor(effC / 2);
    effC = effC % 2;
    
    // B -> A: 2B = 1A
    effA += Math.floor(effB / 2);
    effB = effB % 2;
    
    // Determine final effective category (highest non-zero)
    let finalCategory = 'E'; // Default to E (Ineffective)
    let finalCount = 0;
    
    if (effA > 0) {
        finalCategory = 'A';
        finalCount = effA;
    } else if (effB > 0) {
        finalCategory = 'B';
        finalCount = effB;
    } else if (effC > 0) {
        finalCategory = 'C';
        finalCount = effC;
    } else if (effD > 0) {
        finalCategory = 'D';
        finalCount = effD;
    }
    
    // Display result
    const divResult = document.getElementById('div_hic_hf_step4_result');
    const valCat = document.getElementById('val_hic_hf_final_eff_cat');
    const valCount = document.getElementById('val_hic_hf_final_eff_count');
    
    if (divResult && valCat && valCount) {
        valCat.innerText = `Category ${finalCategory}`;
        valCount.innerText = finalCount;
        divResult.classList.remove('hidden');
    }
    
    // Save to sessionStorage
    sessionStorage.setItem('hic_hf_final_eff_cat', finalCategory);
    sessionStorage.setItem('hic_hf_final_eff_count', finalCount);
    
    console.log(`HIC/SOHIC-HF Step 4 Complete: Final Effective = Category ${finalCategory} (Count: ${finalCount})`);
    
    // Calculate Base Damage Factor (Step 5)
    calculateHICHFBaseDamageFactor();
}

// Load Base Damage Factor data (reuse from ClSCC)
let hicHFBaseDFData = null;

async function loadHICHFBaseDFData() {
    if (hicHFBaseDFData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_base_damage_factor.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        hicHFBaseDFData = await response.json();
    } catch (e) {
        console.error('Failed to load HIC/SOHIC-HF Base DF data:', e);
    }
}

// Preload base DF data
if (inpHICHFInspA) {
    loadHICHFBaseDFData();
}

/**
 * Calculate Base Damage Factor using Table 2.C.1.3
 * Uses SVI from Step 2 and Inspection from Step 4
 */
async function calculateHICHFBaseDamageFactor() {
    // Load data if not already loaded
    if (!hicHFBaseDFData) await loadHICHFBaseDFData();
    if (!hicHFBaseDFData) return;
    
    const svi = parseInt(sessionStorage.getItem('hic_hf_svi')) || 0;
    const inspCat = sessionStorage.getItem('hic_hf_final_eff_cat') || 'E';
    const inspCount = parseInt(sessionStorage.getItem('hic_hf_final_eff_count')) || 0;
    
    const divStep5 = document.getElementById('div_hic_hf_step5');
    const valBaseDf = document.getElementById('val_hic_hf_base_df');
    
    if (!divStep5 || !valBaseDf) return;
    
    // Find the closest SVI in the table
    const sviValues = hicHFBaseDFData.svi_values || [];
    let closestSVI = sviValues[0];
    let minDiff = Math.abs(svi - closestSVI);
    
    for (const sviVal of sviValues) {
        const diff = Math.abs(svi - sviVal);
        if (diff < minDiff) {
            minDiff = diff;
            closestSVI = sviVal;
        }
    }
    
    // Determine inspection key (category + count, or "E" for no inspection)
    let inspKey = 'E';
    if (inspCat !== 'E' && inspCount > 0) {
        // Cap count at 6 (table max)
        const cappedCount = Math.min(inspCount, 6);
        inspKey = `${inspCat}${cappedCount}`;
    }
    
    // Lookup base DF in table
    let baseDf = 1;
    
    if (hicHFBaseDFData.table && hicHFBaseDFData.table[closestSVI] && hicHFBaseDFData.table[closestSVI][inspKey] !== undefined) {
        baseDf = hicHFBaseDFData.table[closestSVI][inspKey];
    } else {
        console.warn(`Base DF not found for SVI=${closestSVI}, Inspection=${inspKey}. Using default=1`);
    }
    
    // Display result
    valBaseDf.innerText = baseDf;
    divStep5.classList.remove('hidden');
    
    // Save to sessionStorage
    sessionStorage.setItem('hic_hf_base_df', baseDf);
    
    console.log(`HIC/SOHIC-HF Step 5 Complete: Base DF = ${baseDf} (SVI=${svi}, Inspection=${inspKey})`);
    
    // Reveal Step 6 (Online Monitoring)
    const divStep6 = document.getElementById('div_hic_hf_step6');
    if (divStep6) divStep6.classList.remove('hidden');
}

// HIC/SOHIC-HF Step 6: Online Monitoring Adjustment Factor
const selHICHFMonitoring = document.getElementById('sel_hic_hf_monitoring');

if (selHICHFMonitoring) {
    selHICHFMonitoring.addEventListener('change', calculateHICHFOnlineMonitoringFactor);
}

// Load Online Monitoring data
let hicHFOnlineMonitoringData = null;

async function loadHICHFOnlineMonitoringData() {
    if (hicHFOnlineMonitoringData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_hic_sohic_hf_online_monitoring.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        hicHFOnlineMonitoringData = await response.json();
    } catch (e) {
        console.error('Failed to load HIC/SOHIC-HF Online Monitoring data:', e);
    }
}

// Preload online monitoring data
if (selHICHFMonitoring) {
    loadHICHFOnlineMonitoringData();
}

/**
 * Calculate Online Monitoring Adjustment Factor (F_OM) using Table 2.C.6.3
 */
async function calculateHICHFOnlineMonitoringFactor() {
    // Load data if not already loaded
    if (!hicHFOnlineMonitoringData) await loadHICHFOnlineMonitoringData();
    if (!hicHFOnlineMonitoringData) return;
    
    const divResult = document.getElementById('div_hic_hf_step6_result');
    const valFOM = document.getElementById('val_hic_hf_fom');
    
    // Validation
    const isValid = validateInputs([selHICHFMonitoring]);
    
    if (!isValid) {
        if (divResult) divResult.classList.add('hidden');
        return;
    }
    
    const monitoringType = selHICHFMonitoring.value;
    
    if (!divResult || !valFOM) return;
    
    // Lookup F_OM from table
    let fom = 1; // Default to 1 (no monitoring)
    
    if (hicHFOnlineMonitoringData.factors && hicHFOnlineMonitoringData.factors[monitoringType] !== undefined) {
        fom = hicHFOnlineMonitoringData.factors[monitoringType];
    } else {
        console.warn(`F_OM not found for monitoring type: ${monitoringType}. Using default=1`);
    }
    
    // Display result
    valFOM.innerText = fom;
    divResult.classList.remove('hidden');
    
    // Save to sessionStorage
    sessionStorage.setItem('hic_hf_fom', fom);
    sessionStorage.setItem('hic_hf_monitoring_type', monitoringType);
    
    console.log(`HIC/SOHIC-HF Step 6 Complete: F_OM = ${fom} (Monitoring: ${monitoringType})`);
    
    // Calculate Final Damage Factor (Step 7)
    calculateHICHFFinalDamageFactor();
}

/**
 * Calculate Final Damage Factor using Equation 2.C.5
 * D_f = min( (D_fB × (max(age, 1.0))^1.1) / F_OM, 5000 )
 */
function calculateHICHFFinalDamageFactor() {
    const baseDf = parseFloat(sessionStorage.getItem('hic_hf_base_df')) || 1;
    const age = parseFloat(sessionStorage.getItem('hic_hf_age')) || 1;
    const fom = parseFloat(sessionStorage.getItem('hic_hf_fom')) || 1;
    
    const divStep7 = document.getElementById('div_hic_hf_step7');
    const valFinalDf = document.getElementById('val_hic_hf_final_df');
    const msgFinal = document.getElementById('msg_hic_hf_final');
    
    if (!divStep7 || !valFinalDf) return;
    
    // Apply Equation 2.C.5
    // D_f = min( (D_fB × (max(age, 1.0))^1.1) / F_OM, 5000 )
    const ageForCalc = Math.max(age, 1.0);
    const ageFactor = Math.pow(ageForCalc, 1.1);
    const rawDf = (baseDf * ageFactor) / fom;
    const finalDf = Math.min(rawDf, 5000);
    
    // Round to 2 decimal places
    const finalDfRounded = Math.round(finalDf * 100) / 100;
    
    // Display result
    valFinalDf.innerText = finalDfRounded;
    divStep7.classList.remove('hidden');
    
    if (msgFinal) {
        msgFinal.classList.remove('hidden');
    }
    
    // Save to sessionStorage
    sessionStorage.setItem('hic_hf_final_df', finalDfRounded);
    calculateGoverningSCCDF();
    
    console.log(`HIC/SOHIC-HF Step 7 Complete: Final DF = ${finalDfRounded} (Base DF=${baseDf}, Age=${age}, F_OM=${fom})`);
}

// ============================================================================
// AMINE CRACKING MODULE
// ============================================================================

/**
 * Load and display Amine Cracking Required Data Table (Table 2.C.3.1)
 */
async function loadAmineRequiredData() {
    const tableBody = document.querySelector('#tbody_scc_amine_required_data');
    if (!tableBody) return;

    try {
        const response = await fetch('/static/formula_app/data/json/scc_amine_required_data.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        const data = await response.json();

        tableBody.innerHTML = '';
        
        if (data.required_data && Array.isArray(data.required_data)) {
            data.required_data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-3 py-2">${item.parameter}</td>
                    <td class="px-3 py-2">${item.comment}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (e) {
        console.error('Failed to load Amine required data:', e);
        tableBody.innerHTML = '<tr><td colspan="2" class="text-center text-red-500">Error loading data</td></tr>';
    }
}

// Load required data table on page load
if (document.getElementById('table_scc_amine_required_data')) {
    loadAmineRequiredData();
}

// Amine Severity Index Data
let amineSeverityIndexData = null;

async function loadAmineSeverityIndex() {
    try {
        const response = await fetch('/static/formula_app/data/json/scc_severity_index.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        amineSeverityIndexData = await response.json();
        console.log('Amine Severity Index data loaded:', amineSeverityIndexData);
    } catch (e) {
        console.error('Failed to load Amine severity index data:', e);
    }
}

// Load severity index data on page load
if (document.getElementById('div_amine_step2')) {
    loadAmineSeverityIndex();
}

// Amine Step 2: Calculate Severity Index
function calculateAmineSeverityIndex(susceptibility) {
    const divStep2 = document.getElementById('div_amine_step2');
    const valSvi = document.getElementById('val_amine_svi');
    const msgNote = document.getElementById('msg_amine_svi_note');
    
    if (!divStep2 || !valSvi || !msgNote) return;
    
    // Show Step 2 section
    divStep2.classList.remove('hidden');
    
    // Check if severity index data is loaded
    if (!amineSeverityIndexData || !amineSeverityIndexData.mappings) {
        valSvi.innerText = 'Error';
        msgNote.innerText = 'Severity index data not loaded.';
        return;
    }
    
    // Map susceptibility to severity index
    let svi = 0;
    let note = '';
    
    // Handle "Not Susceptible" case
    if (susceptibility === 'Not Susceptible') {
        svi = amineSeverityIndexData.mappings['None'] || 0;
        note = 'Component is not susceptible. SVI = 0.';
    } else if (amineSeverityIndexData.mappings[susceptibility] !== undefined) {
        svi = amineSeverityIndexData.mappings[susceptibility];
        note = `Susceptibility: ${susceptibility}. From Table 2.C.2.2: SVI = ${svi}.`;
    } else {
        valSvi.innerText = 'Error';
        msgNote.innerText = `Unknown susceptibility level: ${susceptibility}`;
        return;
    }
    
    // Display result
    valSvi.innerText = svi;
    msgNote.innerText = note;
    
    // Save to sessionStorage
    sessionStorage.setItem('amine_svi', svi);
    sessionStorage.setItem('amine_susceptibility', susceptibility);
    
    // Show Step 3 section
    const divStep3 = document.getElementById('div_amine_step3');
    if (divStep3) {
        divStep3.classList.remove('hidden');
    }
}

// Amine Step 3: Time in Service (Age) Calculation
const inpAmineInspectionDate = document.getElementById('inp_amine_inspection_date');

if (inpAmineInspectionDate) {
    inpAmineInspectionDate.addEventListener('change', calculateAmineAge);
}

function calculateAmineAge() {
    const divResult = document.getElementById('div_amine_step3_result');
    const valAge = document.getElementById('val_amine_age');
    const inspectionDate = inpAmineInspectionDate.value;
    
    if (!divResult || !valAge) return;
    
    // Validate date input
    if (!inspectionDate) {
        divResult.classList.add('hidden');
        return;
    }
    
    // Calculate age in years
    const lastDate = new Date(inspectionDate);
    const today = new Date();
    
    // Validate date is not in the future
    if (lastDate > today) {
        divResult.classList.add('hidden');
        const errDiv = document.getElementById('err_amine_step3');
        if (errDiv) {
            errDiv.innerText = "Inspection date cannot be in the future.";
            errDiv.classList.remove('hidden');
        }
        inpAmineInspectionDate.value = '';
        return;
    }
    
    // Resize error if exists changes
    const errDiv = document.getElementById('err_amine_step3');
    if (errDiv) errDiv.classList.add('hidden');
    
    // Calculate difference in years
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const age = (diffDays / 365.25).toFixed(2); // Account for leap years
    
    // Display result (simple format)
    valAge.innerText = `${age} years`;
    divResult.classList.remove('hidden');
    
    // Save to sessionStorage
    sessionStorage.setItem('amine_age', age);
    sessionStorage.setItem('amine_inspection_date', inspectionDate);
    
    console.log(`Amine Step 3 Complete: Age = ${age} years`);
    
    // Show Step 4 section
    const divStep4 = document.getElementById('div_amine_step4');
    if (divStep4) {
        divStep4.classList.remove('hidden');
    }
}

// Amine Step 4: Inspection History (Equivalency Calculation)
const inpAmineInspA = document.getElementById('inp_amine_insp_A');
const inpAmineInspB = document.getElementById('inp_amine_insp_B');
const inpAmineInspC = document.getElementById('inp_amine_insp_C');
const inpAmineInspD = document.getElementById('inp_amine_insp_D');

if (inpAmineInspA && inpAmineInspB && inpAmineInspC && inpAmineInspD) {
    inpAmineInspA.addEventListener('input', calculateAmineInspectionEquivalency);
    inpAmineInspB.addEventListener('input', calculateAmineInspectionEquivalency);
    inpAmineInspC.addEventListener('input', calculateAmineInspectionEquivalency);
    inpAmineInspD.addEventListener('input', calculateAmineInspectionEquivalency);
}

function calculateAmineInspectionEquivalency() {
    const divResult = document.getElementById('div_amine_step4_result');
    const valCategory = document.getElementById('val_amine_final_eff_cat');
    const valCount = document.getElementById('val_amine_final_eff_count');
    
    if (!divResult || !valCategory || !valCount) return;
    
    // Get input values
    let countA = parseInt(inpAmineInspA.value) || 0;
    let countB = parseInt(inpAmineInspB.value) || 0;
    let countC = parseInt(inpAmineInspC.value) || 0;
    let countD = parseInt(inpAmineInspD.value) || 0;
    
    // Apply 2:1 equivalency rule (combine lower effectiveness to higher)
    // 2 Category D = 1 Category C
    if (countD >= 2) {
        countC += Math.floor(countD / 2);
        countD = countD % 2;
    }
    
    // 2 Category C = 1 Category B
    if (countC >= 2) {
        countB += Math.floor(countC / 2);
        countC = countC % 2;
    }
    
    // 2 Category B = 1 Category A
    if (countB >= 2) {
        countA += Math.floor(countB / 2);
        countB = countB % 2;
    }
    
    // Determine final effective category (highest with count > 0)
    let finalCategory = 'None';
    let finalCount = 0;
    
    if (countA > 0) {
        finalCategory = 'Category A';
        finalCount = countA;
    } else if (countB > 0) {
        finalCategory = 'Category B';
        finalCount = countB;
    } else if (countC > 0) {
        finalCategory = 'Category C';
        finalCount = countC;
    } else if (countD > 0) {
        finalCategory = 'Category D';
        finalCount = countD;
    }
    
    // Display result
    if (finalCategory === 'None') {
        divResult.classList.add('hidden');
    } else {
        valCategory.innerText = finalCategory;
        valCount.innerText = finalCount;
        divResult.classList.remove('hidden');
        
        // Save to sessionStorage
        sessionStorage.setItem('amine_final_eff_cat', finalCategory);
        sessionStorage.setItem('amine_final_eff_count', finalCount);
        
        console.log(`Amine Step 4 Complete: ${finalCategory} (Count: ${finalCount})`);
        
        // Trigger Step 5 calculation
        calculateAmineBaseDamageFactor();
    }
}

// Amine Base Damage Factor Data
let amineBaseDFData = null;

async function loadAmineBaseDFData() {
    try {
        const response = await fetch('/static/formula_app/data/json/scc_base_damage_factor.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        amineBaseDFData = await response.json();
        console.log('Amine Base DF data loaded:', amineBaseDFData);
    } catch (e) {
        console.error('Failed to load Amine base DF data:', e);
    }
}

// Load base DF data on page load
if (document.getElementById('div_amine_step5')) {
    loadAmineBaseDFData();
}

// Amine Step 5: Calculate Base Damage Factor
function calculateAmineBaseDamageFactor() {
    const divStep5 = document.getElementById('div_amine_step5');
    const valBaseDF = document.getElementById('val_amine_base_df');
    const msgNote = document.getElementById('msg_amine_base_df_note');
    
    if (!divStep5 || !valBaseDF || !msgNote) return;
    
    // Get values from previous steps
    const svi = parseInt(sessionStorage.getItem('amine_svi')) || 0;
    const age = parseFloat(sessionStorage.getItem('amine_age')) || 0;
    const inspCategory = sessionStorage.getItem('amine_final_eff_cat') || 'None';
    const inspCount = parseInt(sessionStorage.getItem('amine_final_eff_count')) || 0;
    
    // Show Step 5 section
    divStep5.classList.remove('hidden');
    
    // Check if base DF data is loaded
    if (!amineBaseDFData || !amineBaseDFData.data) {
        valBaseDF.innerText = 'Error';
        msgNote.innerText = 'Base damage factor data not loaded.';
        return;
    }
    
    // Determine SVI key (find closest match)
    const sviKeys = Object.keys(amineBaseDFData.data).map(k => parseInt(k)).sort((a, b) => a - b);
    let sviKey = sviKeys[0];
    for (let key of sviKeys) {
        if (svi >= key) {
            sviKey = key;
        }
    }
    
    // Determine age bucket (1-6+)
    let ageBucket;
    if (inspCount === 0) {
        ageBucket = 'E'; // No inspection
    } else if (age < 1) {
        ageBucket = '1';
    } else if (age >= 6) {
        ageBucket = '6';
    } else {
        ageBucket = Math.floor(age).toString();
    }
    
    // Determine inspection category letter (A, B, C, D)
    let inspLetter = 'D'; // Default to lowest
    if (inspCategory.includes('A')) {
        inspLetter = 'A';
    } else if (inspCategory.includes('B')) {
        inspLetter = 'B';
    } else if (inspCategory.includes('C')) {
        inspLetter = 'C';
    } else if (inspCategory.includes('D')) {
        inspLetter = 'D';
    }
    
    // Lookup base DF from table
    let baseDF = 0;
    try {
        if (ageBucket === 'E') {
            baseDF = amineBaseDFData.data[sviKey.toString()]['E'];
        } else {
            baseDF = amineBaseDFData.data[sviKey.toString()][ageBucket][inspLetter];
        }
    } catch (e) {
        console.error('Error looking up base DF:', e);
        valBaseDF.innerText = 'Error';
        msgNote.innerText = 'Error looking up value in table.';
        return;
    }
    
    // Display result
    valBaseDF.innerText = baseDF;
    msgNote.innerText = `From Table 2.C.1.3: SVI=${svi} (using ${sviKey}), Age=${age.toFixed(2)} years (bucket ${ageBucket}), Inspection=${inspCategory} (${inspLetter})`;
    
    // Save to sessionStorage
    sessionStorage.setItem('amine_base_df', baseDF);
    
    console.log(`Amine Step 5 Complete: Base DF = ${baseDF}`);
    
    // Trigger Step 6 calculation
    calculateAmineFinalDamageFactor();
}

// Amine Step 6: Calculate Final Damage Factor (with escalation)
function calculateAmineFinalDamageFactor() {
    const divStep6 = document.getElementById('div_amine_step6');
    const valFinalDF = document.getElementById('val_amine_final_df');
    const msgNote = document.getElementById('msg_amine_final_df_note');
    
    if (!divStep6 || !valFinalDF || !msgNote) return;
    
    // Get values from previous steps
    const baseDF = parseFloat(sessionStorage.getItem('amine_base_df')) || 0;
    const age = parseFloat(sessionStorage.getItem('amine_age')) || 0;
    
    // Show Step 6 section
    divStep6.classList.remove('hidden');
    
    // Apply escalation formula: Df = min(DfB * (max(age, 1.0))^1.1, 5000)
    const ageForCalc = Math.max(age, 1.0);
    const escalationFactor = Math.pow(ageForCalc, 1.1);
    const escalatedDF = baseDF * escalationFactor;
    const finalDF = Math.min(escalatedDF, 5000);
    
    // Display result
    valFinalDF.innerText = finalDF.toFixed(2);
    msgNote.innerText = 'Calculation Complete';
    
    // Save to sessionStorage
    sessionStorage.setItem('amine_final_df', finalDF);
    calculateGoverningSCCDF();
    
    console.log(`Amine Step 6 Complete: Final DF = ${finalDF.toFixed(2)}`);
}

// Amine Step 1: Susceptibility Determination
const selAmineCracksPresent = document.getElementById('sel_amine_cracks_present');
const selAmineCracksRemoved = document.getElementById('sel_amine_cracks_removed');
const selAmineStressRelieved = document.getElementById('sel_amine_stress_relieved');
const selAmineLean = document.getElementById('sel_amine_lean');
const selAmineMeaDipa = document.getElementById('sel_amine_mea_dipa');
const selAmineDea = document.getElementById('sel_amine_dea');
const inpAmineTempMea = document.getElementById('inp_amine_temp_mea');
const selAmineTempUnitMea = document.getElementById('sel_amine_temp_unit_mea');
const selAmineHeatTracedMea = document.getElementById('sel_amine_heat_traced_mea');
const selAmineSteamedMea = document.getElementById('sel_amine_steamed_mea');
const inpAmineTempDea = document.getElementById('inp_amine_temp_dea');
const selAmineTempUnitDea = document.getElementById('sel_amine_temp_unit_dea');
const selAmineHeatTracedDea = document.getElementById('sel_amine_heat_traced_dea');
const selAmineSteamedDea = document.getElementById('sel_amine_steamed_dea');

// Helper function to convert temperature to Fahrenheit
function convertToFahrenheit(temp, unit) {
    if (unit === 'C') {
        return (temp * 9/5) + 32;
    }
    return temp;
}

if (selAmineCracksPresent) {
    selAmineCracksPresent.addEventListener('change', updateAmineStep1Flow);
}
if (selAmineCracksRemoved) {
    selAmineCracksRemoved.addEventListener('change', updateAmineStep1Flow);
}
if (selAmineStressRelieved) {
    selAmineStressRelieved.addEventListener('change', updateAmineStep1Flow);
}
if (selAmineLean) {
    selAmineLean.addEventListener('change', updateAmineStep1Flow);
}
if (selAmineMeaDipa) {
    selAmineMeaDipa.addEventListener('change', updateAmineStep1Flow);
}
if (selAmineDea) {
    selAmineDea.addEventListener('change', updateAmineStep1Flow);
}
if (inpAmineTempMea) {
    inpAmineTempMea.addEventListener('input', updateAmineStep1Flow);
}
if (selAmineHeatTracedMea) {
    selAmineHeatTracedMea.addEventListener('change', updateAmineStep1Flow);
}
if (selAmineSteamedMea) {
    selAmineSteamedMea.addEventListener('change', updateAmineStep1Flow);
}
if (inpAmineTempDea) {
    inpAmineTempDea.addEventListener('input', updateAmineStep1Flow);
}
if (selAmineHeatTracedDea) {
    selAmineHeatTracedDea.addEventListener('change', updateAmineStep1Flow);
}
if (selAmineSteamedDea) {
    selAmineSteamedDea.addEventListener('change', updateAmineStep1Flow);
}

// --- Amine Helper: Hide Downstream Steps ---
function hideAmineStepsFrom(step) {
    if (step <= 2) {
        const divStep2 = document.getElementById('div_amine_step2');
        if (divStep2) divStep2.classList.add('hidden');
    }
    if (step <= 3) {
        const divStep3 = document.getElementById('div_amine_step3');
        if (divStep3) divStep3.classList.add('hidden');
    }
    if (step <= 4) {
        const divStep4 = document.getElementById('div_amine_step4');
        if (divStep4) divStep4.classList.add('hidden');
    }
    if (step <= 5) {
        const divStep5 = document.getElementById('div_amine_step5');
        if (divStep5) divStep5.classList.add('hidden');
    }
    if (step <= 6) {
        const divStep6 = document.getElementById('div_amine_step6');
        if (divStep6) divStep6.classList.add('hidden');
    }
}

// --- Amine Confirm Table Button ---
const btnConfirmAmine = document.getElementById('btn_amine_confirm_table');
if (btnConfirmAmine) {
    btnConfirmAmine.addEventListener('click', () => {
        // Sync Inputs
        const reqSolution = document.getElementById('req_amine_solution');
        const reqTemp = document.getElementById('req_amine_temp');
        const reqUnit = document.getElementById('req_amine_temp_unit');
        const reqSteam = document.getElementById('req_amine_steam_out');

        const selLean = document.getElementById('sel_amine_lean');
        const selMea = document.getElementById('sel_amine_mea_dipa');
        const selDea = document.getElementById('sel_amine_dea');
        
        // Target Inputs (Both paths)
        const inputsTemp = [document.getElementById('inp_amine_temp_mea'), document.getElementById('inp_amine_temp_dea')];
        const selectsUnit = [document.getElementById('sel_amine_temp_unit_mea'), document.getElementById('sel_amine_temp_unit_dea')];
        const selectsSteam = [document.getElementById('sel_amine_steamed_mea'), document.getElementById('sel_amine_steamed_dea')];

        // 1. Solution Sync
        if (reqSolution && selLean && selMea && selDea) {
             const sol = reqSolution.value;
             if (sol === 'Lean') {
                 selLean.value = 'Yes';
                 selMea.value = 'No';
                 selDea.value = 'No';
             } else if (sol === 'MEA_DIPA') {
                 selLean.value = 'Yes';
                 selMea.value = 'Yes';
             } else if (sol === 'DEA') {
                 selLean.value = 'Yes';
                 selMea.value = 'No';
                 selDea.value = 'Yes';
             } else if (sol === 'Other') {
                 selLean.value = 'Yes';
                 selMea.value = 'No';
                 selDea.value = 'No';
             }
        }

        // 2. Temp Sync
        if (reqTemp && reqTemp.value) {
            inputsTemp.forEach(inp => { if(inp) inp.value = reqTemp.value; });
        }
        if (reqUnit && reqUnit.value) {
            selectsUnit.forEach(sel => { if(sel) sel.value = reqUnit.value; });
        }

        // 3. Steam Sync
        if (reqSteam && reqSteam.value) {
            selectsSteam.forEach(sel => { if(sel) sel.value = reqSteam.value; });
        }

        // Reveal Step 1
        const divStep1 = document.getElementById('div_amine_step1');
        if (divStep1) {
            divStep1.classList.remove('hidden');
            divStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

function updateAmineStep1Flow() {
    hideAmineStepsFrom(2); // Auto-hide downstream steps
    hideAmineStepsFrom(2); // Auto-hide downstream steps
    const cracksPresent = selAmineCracksPresent.value;
    const cracksRemoved = selAmineCracksRemoved.value;
    const stressRelieved = selAmineStressRelieved.value;
    const lean = selAmineLean.value;
    const meaDipa = selAmineMeaDipa.value;
    const dea = selAmineDea ? selAmineDea.value : '';
    
    // Get temperature values and convert to Fahrenheit
    const tempMeaInput = parseFloat(inpAmineTempMea.value);
    const tempMeaUnit = selAmineTempUnitMea ? selAmineTempUnitMea.value : 'F';
    const tempMea = !isNaN(tempMeaInput) ? convertToFahrenheit(tempMeaInput, tempMeaUnit) : NaN;
    
    const tempDeaInput = parseFloat(inpAmineTempDea.value);
    const tempDeaUnit = selAmineTempUnitDea ? selAmineTempUnitDea.value : 'F';
    const tempDea = !isNaN(tempDeaInput) ? convertToFahrenheit(tempDeaInput, tempDeaUnit) : NaN;
    
    const heatTracedMea = selAmineHeatTracedMea.value;
    const steamedMea = selAmineSteamedMea.value;
    const heatTracedDea = selAmineHeatTracedDea.value;
    const steamedDea = selAmineSteamedDea.value;
    
    const divCracksRemoved = document.getElementById('div_amine_cracks_removed');
    const divStressRelieved = document.getElementById('div_amine_stress_relieved');
    const divLean = document.getElementById('div_amine_lean');
    const divMeaDipa = document.getElementById('div_amine_mea_dipa');
    const divDea = document.getElementById('div_amine_dea');
    const divMeaDipaPath = document.getElementById('div_amine_mea_dipa_path');
    const divDeaPath = document.getElementById('div_amine_dea_path');
    const divHeatTracedMea = document.getElementById('div_amine_heat_traced_mea');
    const divSteamedMea = document.getElementById('div_amine_steamed_mea');
    const divHeatTracedDea = document.getElementById('div_amine_heat_traced_dea');
    const divSteamedDea = document.getElementById('div_amine_steamed_dea');
    const divResult = document.getElementById('div_amine_step1_result');
    const valSusceptibility = document.getElementById('val_amine_susceptibility');
    const msgNote = document.getElementById('msg_amine_susceptibility_note');
    
    // Reset visibility
    divCracksRemoved.classList.add('hidden');
    divStressRelieved.classList.add('hidden');
    divLean.classList.add('hidden');
    divMeaDipa.classList.add('hidden');
    divDea.classList.add('hidden');
    divMeaDipaPath.classList.add('hidden');
    divDeaPath.classList.add('hidden');
    divHeatTracedMea.classList.add('hidden');
    divSteamedMea.classList.add('hidden');
    divHeatTracedDea.classList.add('hidden');
    divSteamedDea.classList.add('hidden');
    divResult.classList.add('hidden');
    
    let susceptibility = '';
    let note = '';
    
    // Decision Flow Logic following Figure 2.C.3.1
    
    // Path 1: Cracks Present?
    if (cracksPresent === 'Yes') {
        divCracksRemoved.classList.remove('hidden');
        
        if (cracksRemoved === 'Yes') {
            susceptibility = 'High';
            note = 'Cracks confirmed and removed. Continue to Step 2.';
            displayAmineResult(susceptibility, note);
        } else if (cracksRemoved === 'No') {
            susceptibility = 'FFS Required';
            note = 'Cracks present and not removed. Fitness-for-Service evaluation required per API 579-1.';
            displayAmineResult(susceptibility, note);
        }
        return;
    }
    
    // Path 2: No Cracks → Stress Relieved?
    if (cracksPresent === 'No') {
        divStressRelieved.classList.remove('hidden');
        
        if (stressRelieved === 'Yes') {
            susceptibility = 'Not Susceptible';
            note = 'Component is stress relieved (PWHT).';
            displayAmineResult(susceptibility, note);
            return;
        }
        
        // Path 3: Not Stress Relieved → Exposed to Lean Amine?
        if (stressRelieved === 'No') {
            divLean.classList.remove('hidden');
            
            if (lean === 'No') {
                susceptibility = 'Not Susceptible';
                note = 'Component is not exposed to lean amine.';
                displayAmineResult(susceptibility, note);
                return;
            }
            
            // Path 4: Exposed to Lean Amine → MEA or DIPA?
            if (lean === 'Yes') {
                divMeaDipa.classList.remove('hidden');
                
                // MEA/DIPA Path
                if (meaDipa === 'Yes') {
                    divMeaDipaPath.classList.remove('hidden');
                    
                    if (!isNaN(tempMea)) {
                        const tempDisplay = `${tempMeaInput}°${tempMeaUnit}`;
                        
                        // Temp > 180°F → High
                        if (tempMea > 180) {
                            susceptibility = 'High';
                            note = `MEA/DIPA at ${tempDisplay} (>180°F). High susceptibility.`;
                            displayAmineResult(susceptibility, note);
                            return;
                        }
                        
                        // Temp 100-180°F → Check Heat Traced
                        if (tempMea >= 100 && tempMea <= 180) {
                            divHeatTracedMea.classList.remove('hidden');
                            
                            if (heatTracedMea === 'Yes') {
                                susceptibility = 'Medium';
                                note = `MEA/DIPA at ${tempDisplay} (100-180°F) with heat tracing. Medium susceptibility.`;
                                displayAmineResult(susceptibility, note);
                                return;
                            }
                            
                            if (heatTracedMea === 'No') {
                                divSteamedMea.classList.remove('hidden');
                                
                                if (steamedMea === 'Yes') {
                                    susceptibility = 'Medium';
                                    note = `MEA/DIPA at ${tempDisplay} (100-180°F), not heat traced, but steamed out. Medium susceptibility.`;
                                    displayAmineResult(susceptibility, note);
                                    return;
                                }
                                
                                if (steamedMea === 'No') {
                                    susceptibility = 'Low';
                                    note = `MEA/DIPA at ${tempDisplay} (100-180°F), not heat traced, not steamed out. Low susceptibility.`;
                                    displayAmineResult(susceptibility, note);
                                    return;
                                }
                            }
                        }
                        
                        // Temp < 100°F → Ask Heat Traced first
                        if (tempMea < 100) {
                            divHeatTracedMea.classList.remove('hidden');
                            
                            if (heatTracedMea === 'Yes') {
                                susceptibility = 'Medium';
                                note = `MEA/DIPA at ${tempDisplay} (<100°F) with heat tracing. Medium susceptibility.`;
                                displayAmineResult(susceptibility, note);
                                return;
                            }
                            
                            if (heatTracedMea === 'No') {
                                divSteamedMea.classList.remove('hidden');
                                
                                if (steamedMea === 'Yes') {
                                    susceptibility = 'Medium';
                                    note = `MEA/DIPA at ${tempDisplay} (<100°F), not heat traced, but steamed out. Medium susceptibility.`;
                                    displayAmineResult(susceptibility, note);
                                    return;
                                }
                                
                                if (steamedMea === 'No') {
                                    susceptibility = 'Low';
                                    note = `MEA/DIPA at ${tempDisplay} (<100°F), not heat traced, not steamed out. Low susceptibility.`;
                                    displayAmineResult(susceptibility, note);
                                    return;
                                }
                            }
                        }
                    }
                }
                
                // DEA Path - Show DEA question first
                if (meaDipa === 'No') {
                    divDea.classList.remove('hidden');
                    
                    // Show temperature input only AFTER user selects Yes or No for DEA
                    if (dea === 'Yes' || dea === 'No') {
                        divDeaPath.classList.remove('hidden');
                    }
                    
                    // Only evaluate temperature logic if temperature has been entered
                    if (!isNaN(tempDea)) {
                        const tempDisplay = `${tempDeaInput}°${tempDeaUnit}`;
                        
                        // Temp > 180°F
                        if (tempDea > 180) {
                            // For DEA = Yes → Medium Susceptibility (immediate)
                            if (dea === 'Yes') {
                                susceptibility = 'Medium';
                                note = `DEA at ${tempDisplay} (>180°F). Medium susceptibility.`;
                                displayAmineResult(susceptibility, note);
                                return;
                            }
                            
                            // For DEA = No → Low Susceptibility (immediate)
                            if (dea === 'No') {
                                susceptibility = 'Low';
                                note = `DEA at ${tempDisplay} (>180°F). Low susceptibility.`;
                                displayAmineResult(susceptibility, note);
                                return;
                            }
                            return;
                        }
                        
                        // Temp 140-180°F
                        if (tempDea >= 140 && tempDea <= 180) {
                            // For DEA = Yes → Low Susceptibility (immediate)
                            if (dea === 'Yes') {
                                susceptibility = 'Low';
                                note = `DEA at ${tempDisplay} (140-180°F). Low susceptibility.`;
                                displayAmineResult(susceptibility, note);
                                return;
                            }
                            
                            // For DEA = No → Ask heat traced, then steamed
                            if (dea === 'No') {
                                divHeatTracedDea.classList.remove('hidden');
                                
                                // If heat traced = Yes → Low
                                if (heatTracedDea === 'Yes') {
                                    susceptibility = 'Low';
                                    note = `DEA at ${tempDisplay} (140-180°F) with heat tracing. Low susceptibility.`;
                                    displayAmineResult(susceptibility, note);
                                    return;
                                }
                                
                                // If heat traced = No → Ask steamed
                                if (heatTracedDea === 'No') {
                                    divSteamedDea.classList.remove('hidden');
                                    
                                    // If steamed = Yes → Low
                                    if (steamedDea === 'Yes') {
                                        susceptibility = 'Low';
                                        note = `DEA at ${tempDisplay} (140-180°F), not heat traced, but steamed out. Low susceptibility.`;
                                        displayAmineResult(susceptibility, note);
                                        return;
                                    }
                                    
                                    // If steamed = No → Not Susceptible
                                    if (steamedDea === 'No') {
                                        susceptibility = 'Not Susceptible';
                                        note = `DEA at ${tempDisplay} (140-180°F), not heat traced, not steamed out.`;
                                        displayAmineResult(susceptibility, note);
                                        return;
                                    }
                                }
                                return;
                            }
                        }
                        
                        // Temp < 140°F
                        if (tempDea < 140) {
                            // For DEA = Yes → Ask heat traced first
                            if (dea === 'Yes') {
                                divHeatTracedDea.classList.remove('hidden');
                                
                                // If heat traced = Yes → Low
                                if (heatTracedDea === 'Yes') {
                                    susceptibility = 'Low';
                                    note = `DEA at ${tempDisplay} (<140°F) with heat tracing. Low susceptibility.`;
                                    displayAmineResult(susceptibility, note);
                                    return;
                                }
                                
                                // If heat traced = No → Ask steamed out
                                if (heatTracedDea === 'No') {
                                    divSteamedDea.classList.remove('hidden');
                                    
                                    // If steamed = Yes → Low
                                    if (steamedDea === 'Yes') {
                                        susceptibility = 'Low';
                                        note = `DEA at ${tempDisplay} (<140°F), not heat traced, but steamed out. Low susceptibility.`;
                                        displayAmineResult(susceptibility, note);
                                        return;
                                    }
                                    
                                    // If steamed = No → Not Susceptible
                                    if (steamedDea === 'No') {
                                        susceptibility = 'Not Susceptible';
                                        note = `DEA at ${tempDisplay} (<140°F), not heat traced, not steamed out.`;
                                        displayAmineResult(susceptibility, note);
                                        return;
                                    }
                                }
                                return;
                            }
                            
                            // For DEA = No → Will implement based on diagram
                            if (dea === 'No') {
                                // TODO: Implement DEA=No path for <140°F
                            }
                        }
                    }
                }
            }
        }
    }
}

function displayAmineResult(susceptibility, note) {
    const divResult = document.getElementById('div_amine_step1_result');
    const valSusceptibility = document.getElementById('val_amine_susceptibility');
    const msgNote = document.getElementById('msg_amine_susceptibility_note');
    
    valSusceptibility.innerText = susceptibility;
    msgNote.innerText = note;
    divResult.classList.remove('hidden');
    
    // Apply color coding
    valSusceptibility.classList.remove('text-red-900', 'text-orange-600', 'text-blue-900');
    
    if (susceptibility.includes('FFS') || susceptibility === 'High') {
        valSusceptibility.classList.add('text-red-900');
    } else if (susceptibility === 'Medium') {
        valSusceptibility.classList.add('text-orange-600');
    } else {
        valSusceptibility.classList.add('text-blue-900');
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('amine_susceptibility', susceptibility);
    
    console.log(`Amine Step 1 Complete: Susceptibility = ${susceptibility}`);
    
    // Automatically calculate Step 2: Severity Index
    calculateAmineSeverityIndex(susceptibility);
}

// Auto-populate Amine Temperature from Table 4.1 (General Data)
function autoPopulateAmineFromTable41() {
    const table41DataStr = sessionStorage.getItem('table4.1_data');
    if (!table41DataStr) return;

    try {
        const data = JSON.parse(table41DataStr);
        const temp = data.operating_temp;
        let unit = data.measurement_unit; // 'farenheit' or 'celsius'

        // Map Unit
        if (unit && unit.toLowerCase().includes('farenheit') || unit === 'farenheit' || unit === 'F') unit = 'F'; 
        else if (unit && unit.toLowerCase().includes('celsius') || unit === 'C') unit = 'C';
        else unit = '';

        const inpTemp = document.getElementById('req_amine_temp');
        const selUnit = document.getElementById('req_amine_temp_unit');

        if (inpTemp && (temp !== undefined && temp !== null && temp !== "")) {
            inpTemp.value = temp;
        }
        if (selUnit && unit) {
            selUnit.value = unit;
        }
    } catch (e) {
        console.error("Error parsing Table 4.1 data for Amine:", e);
    }
}

// Trigger auto-populate on load
if (document.getElementById('req_amine_temp')) {
    autoPopulateAmineFromTable41();
}

});

// ============================================================================
// HSC-HF (Hydrogen Stress Cracking in Hydrofluoric Acid) Module
// ============================================================================

// Load HSC-HF Required Data - REMOVED (Static HTML used now)
// if (document.getElementById('table_scc_hsc_hf_required_data')) {
//     loadHSCHFRequiredData();
// }

// if (document.getElementById('div_scc_hsc_hf_step1')) {
//    loadHSCHFRequiredData();
// }

// Load HSC-HF Susceptibility Data
let hscHFSusceptibilityData = null;

async function loadHSCHFSusceptibilityData() {
    try {
        const response = await fetch('/static/formula_app/data/json/scc_hsc_hf_susceptibility.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        hscHFSusceptibilityData = await response.json();
        console.log('HSC-HF Susceptibility data loaded:', hscHFSusceptibilityData);
    } catch (e) {
        console.error('Failed to load HSC-HF susceptibility data:', e);
    }
}

if (document.getElementById('div_scc_hsc_hf_step1')) {
    loadHSCHFSusceptibilityData();
}

// Load Severity Index Data
let hscHFSeverityIndexData = null;

async function loadHSCHFSeverityIndex() {
    try {
        const response = await fetch('/static/formula_app/data/json/scc_severity_index.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        hscHFSeverityIndexData = await response.json();
        console.log('HSC-HF Severity Index data loaded:', hscHFSeverityIndexData);
    } catch (e) {
        console.error('Failed to load HSC-HF severity index data:', e);
    }
}

if (document.getElementById('div_scc_hsc_hf_step2')) {
    loadHSCHFSeverityIndex();
}

// Load Base DF Data
let hscHFBaseDFData = null;

async function loadHSCHFBaseDFData() {
    try {
        const response = await fetch('/static/formula_app/data/json/scc_base_damage_factor.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        hscHFBaseDFData = await response.json();
        console.log('HSC-HF Base DF data loaded:', hscHFBaseDFData);
    } catch (e) {
        console.error('Failed to load HSC-HF base DF data:', e);
    }
}

if (document.getElementById('div_scc_hsc_hf_step5')) {
    loadHSCHFBaseDFData();
}

// HSC-HF Step 1: Susceptibility Determination
const selHSCHFCracksPresent = document.getElementById('sel_hsc_hf_cracks_present');
const selHSCHFCracksRemoved = document.getElementById('sel_hsc_hf_cracks_removed');
const selHSCHFHFPresent = document.getElementById('sel_hsc_hf_hf_present');
const selHSCHFCarbonSteel = document.getElementById('sel_hsc_hf_carbon_steel');
const inpHSCHFHardness = document.getElementById('inp_hsc_hf_hardness');
const selHSCHFPWHT = document.getElementById('sel_hsc_hf_pwht');
const btnHSCHFCalcSusceptibility = document.getElementById('btn_hsc_hf_calc_susceptibility');

function hideHSCHFStepsFrom(step) {
    if (step <= 2) {
        const divStep2 = document.getElementById('div_scc_hsc_hf_step2');
        if (divStep2) divStep2.classList.add('hidden');
    }
    if (step <= 3) {
        const divStep3 = document.getElementById('div_scc_hsc_hf_step3');
        if (divStep3) divStep3.classList.add('hidden');
    }
    if (step <= 4) {
        const divStep4 = document.getElementById('div_scc_hsc_hf_step4');
        if (divStep4) divStep4.classList.add('hidden');
    }
    if (step <= 5) {
        const divStep5 = document.getElementById('div_scc_hsc_hf_step5');
        if (divStep5) divStep5.classList.add('hidden');
    }
    if (step <= 6) {
        const divStep6 = document.getElementById('div_scc_hsc_hf_step6');
        if (divStep6) divStep6.classList.add('hidden');
    }
}

// Question 1: Cracks present?
if (selHSCHFCracksPresent) {
    selHSCHFCracksPresent.addEventListener('change', () => {
        const divCracksRemoved = document.getElementById('div_hsc_hf_cracks_removed');
        const divHFPresent = document.getElementById('div_hsc_hf_hf_present');
        const divCarbonSteel = document.getElementById('div_hsc_hf_carbon_steel');
        const divTableLookup = document.getElementById('div_hsc_hf_table_lookup');
        const divResult = document.getElementById('div_hsc_hf_step1_result');
        
        // Hide all conditional sections
        divCracksRemoved.classList.add('hidden');
        divHFPresent.classList.add('hidden');
        divCarbonSteel.classList.add('hidden');
        divTableLookup.classList.add('hidden');
        divResult.classList.add('hidden');
        
        hideHSCHFStepsFrom(2); // Hide Steps 2-6
        
        // Reset selects
        
        // Reset selects
        if (selHSCHFCracksRemoved) selHSCHFCracksRemoved.value = '';
        if (selHSCHFHFPresent) selHSCHFHFPresent.value = '';
        if (selHSCHFCarbonSteel) selHSCHFCarbonSteel.value = '';
        
        if (selHSCHFCracksPresent.value === 'Yes') {
            // Show "Cracks removed?" question and High Susceptibility
            divCracksRemoved.classList.remove('hidden');
            if (selHSCHFCracksRemoved && selHSCHFCracksRemoved.value) {
                selHSCHFCracksRemoved.dispatchEvent(new Event('change'));
            } else {
                 displayHSCHFResult('High', 'Cracks are present. High susceptibility to HSC-HF.');
            }
        } else if (selHSCHFCracksPresent.value === 'No') {
            // No cracks → Show "HF present?" question
            divHFPresent.classList.remove('hidden');
            if (selHSCHFHFPresent && selHSCHFHFPresent.value) {
                selHSCHFHFPresent.dispatchEvent(new Event('change'));
            }
        }
    });
}

// Question 2: Cracks removed?
if (selHSCHFCracksRemoved) {
    selHSCHFCracksRemoved.addEventListener('change', () => {
        if (selHSCHFCracksRemoved.value === 'No') {
            // Cracks not removed → FFS Required
            displayHSCHFResult('FFS Required', 'Cracks present and not removed. Fitness-for-Service evaluation required per API 579-1/ASME FFS-1.');
        } else if (selHSCHFCracksRemoved.value === 'Yes') {
            // Cracks removed → High susceptibility, continue to Step 2
            displayHSCHFResult('High', 'Cracks confirmed and removed. High susceptibility to HSC-HF. Continue to Step 2.');
        }
    });
}

// Question 3: HF present?
if (selHSCHFHFPresent) {
    selHSCHFHFPresent.addEventListener('change', () => {
        const divCarbonSteel = document.getElementById('div_hsc_hf_carbon_steel');
        const divTableLookup = document.getElementById('div_hsc_hf_table_lookup');
        const divResult = document.getElementById('div_hsc_hf_step1_result');
        
        // Hide subsequent sections
        divCarbonSteel.classList.add('hidden');
        divTableLookup.classList.add('hidden');
        
        hideHSCHFStepsFrom(2); // Hide Steps 2-6
        
        // Reset selects
        if (selHSCHFCarbonSteel) selHSCHFCarbonSteel.value = '';
        
        if (selHSCHFHFPresent.value === 'No') {
            // HF not present → Not Susceptible
            displayHSCHFResult('Not Susceptible', 'HF not present. Component is not susceptible to HSC-HF.');
        } else if (selHSCHFHFPresent.value === 'Yes') {
            // HF present → Show "Carbon Steel?" question
            divCarbonSteel.classList.remove('hidden');
            // Hide result until Carbon Steel is answered
            divResult.classList.add('hidden');
            if (selHSCHFCarbonSteel && selHSCHFCarbonSteel.value) {
                selHSCHFCarbonSteel.dispatchEvent(new Event('change'));
            }
        }
    });
}

// Question 4: Carbon Steel?
if (selHSCHFCarbonSteel) {
    selHSCHFCarbonSteel.addEventListener('change', () => {
        const divTableLookup = document.getElementById('div_hsc_hf_table_lookup');
        
        // Hide table lookup
        divTableLookup.classList.add('hidden');
        
        hideHSCHFStepsFrom(2); // Hide Steps 2-6
        
        if (selHSCHFCarbonSteel.value === 'No') {
            // Not Carbon Steel → Not Susceptible
            displayHSCHFResult('Not Susceptible', 'Material is not Carbon Steel. Component is not susceptible to HSC-HF.');
        } else if (selHSCHFCarbonSteel.value === 'Yes') {
            // Carbon Steel → Show Table 2.C.7.2 lookup
            divTableLookup.classList.remove('hidden');
        }
    });
}

// --- HSC-HF Confirm Table Data Button ---
const btnConfirmHSCHF = document.getElementById('btn_hsc_hf_confirm_table');
if(btnConfirmHSCHF) {
    btnConfirmHSCHF.addEventListener('click', () => {
         // Sync Table Inputs to Steps
         const reqHF = document.getElementById('req_hsc_hf_hf_present');
         const reqCS = document.getElementById('req_hsc_hf_carbon_steel');
         const reqHardness = document.getElementById('req_hsc_hf_hardness');
         const reqPWHT = document.getElementById('req_hsc_hf_pwht');

         const selHF = document.getElementById('sel_hsc_hf_hf_present');
         const selCS = document.getElementById('sel_hsc_hf_carbon_steel');
         const inpHardness = document.getElementById('inp_hsc_hf_hardness');
         const selPWHT = document.getElementById('sel_hsc_hf_pwht');

         if(reqHF && selHF) selHF.value = reqHF.value;
         if(reqCS && selCS) selCS.value = reqCS.value;
         if(reqHardness && inpHardness) inpHardness.value = reqHardness.value;
         if(reqPWHT && selPWHT) selPWHT.value = reqPWHT.value;

         // Reveal Step 1
         const divStep1 = document.getElementById('div_scc_hsc_hf_step1');
         if(divStep1) {
             divStep1.classList.remove('hidden');
             divStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
    });
}

// Calculate button for Table 2.C.7.2 lookup
if (btnHSCHFCalcSusceptibility) {
    btnHSCHFCalcSusceptibility.addEventListener('click', calculateHSCHFSusceptibility);
}

function calculateHSCHFSusceptibility() {
    const inpHardness = document.getElementById('inp_hsc_hf_hardness');
    const selPWHT = document.getElementById('sel_hsc_hf_pwht');
    const errDiv = document.getElementById('err_hsc_hf_step1');
    
    if (errDiv) errDiv.classList.add('hidden');

    if (!validateInputs([inpHardness, selPWHT])) {
        if (errDiv) {
             errDiv.innerText = "Please complete all required fields.";
             errDiv.classList.remove('hidden');
        }
        return;
    }
    
    const hardness = parseFloat(inpHardness.value);
    const pwht = selPWHT.value;
    
    if (!hscHFSusceptibilityData || !hscHFSusceptibilityData.data) {
        alert('Susceptibility data not loaded. Please refresh the page.');
        return;
    }
    
    let susceptibility = 'Low';
    let note = '';
    
    // Apply Table 2.C.7.2 logic
    if (hardness <= 200) {
        susceptibility = 'Low';
        note = `Brinnell hardness ${hardness} ≤ 200. Low susceptibility regardless of PWHT.`;
    } else if (hardness >= 238) {
        susceptibility = 'High';
        note = `Brinnell hardness ${hardness} ≥ 238. High susceptibility regardless of PWHT.`;
    } else if (hardness >= 201 && hardness <= 237) {
        if (pwht === 'PWHT') {
            susceptibility = 'Low';
            note = `Brinnell hardness ${hardness} (201-237) with PWHT. Low susceptibility.`;
        } else {
            susceptibility = 'Medium';
            note = `Brinnell hardness ${hardness} (201-237) without PWHT. Medium susceptibility.`;
        }
    }
    
    displayHSCHFResult(susceptibility, note);
}

function displayHSCHFResult(susceptibility, note) {
    const divResult = document.getElementById('div_hsc_hf_step1_result');
    const valSusceptibility = document.getElementById('val_hsc_hf_susceptibility');
    const msgNote = document.getElementById('msg_hsc_hf_susceptibility_note');
    
    valSusceptibility.innerText = susceptibility;
    msgNote.innerText = note;
    divResult.classList.remove('hidden');
    
    // Color coding
    valSusceptibility.classList.remove('text-red-900', 'text-orange-600', 'text-blue-900');
    if (susceptibility === 'High') {
        valSusceptibility.classList.add('text-red-900');
    } else if (susceptibility === 'Medium') {
        valSusceptibility.classList.add('text-orange-600');
    } else if (susceptibility === 'FFS Required') {
        valSusceptibility.classList.add('text-red-900');
    } else {
        valSusceptibility.classList.add('text-blue-900');
    }
    
    sessionStorage.setItem('hsc_hf_susceptibility', susceptibility);
    console.log(`HSC-HF Step 1 Complete: Susceptibility = ${susceptibility}`);
    
    // Automatically calculate Step 2 only for valid susceptibilities (not FFS)
    if (susceptibility !== 'FFS Required') {
        calculateHSCHFSeverityIndex(susceptibility);
    }
}

// HSC-HF Step 2: Calculate Severity Index
function calculateHSCHFSeverityIndex(susceptibility) {
    const divStep2 = document.getElementById('div_scc_hsc_hf_step2');
    const valSVI = document.getElementById('val_hsc_hf_svi');
    
    if (!divStep2 || !valSVI) return;
    
    divStep2.classList.remove('hidden');
    
    if (!hscHFSeverityIndexData || !hscHFSeverityIndexData.mappings) {
        valSVI.innerText = 'Error';
        return;
    }
    
    let svi = 0;
    if (susceptibility === 'Not Susceptible') {
        svi = hscHFSeverityIndexData.mappings['None'] || 0;
    } else if (hscHFSeverityIndexData.mappings[susceptibility] !== undefined) {
        svi = hscHFSeverityIndexData.mappings[susceptibility];
    }
    
    valSVI.innerText = svi;
    sessionStorage.setItem('hsc_hf_svi', svi);
    console.log(`HSC-HF Step 2 Complete: SVI = ${svi}`);
    
    // Show Step 3
    const divStep3 = document.getElementById('div_scc_hsc_hf_step3');
    if (divStep3) divStep3.classList.remove('hidden');
}

// HSC-HF Step 3: Time in Service (Age)
const inpHSCHFInspectionDate = document.getElementById('inp_hsc_hf_inspection_date');

if (inpHSCHFInspectionDate) {
    inpHSCHFInspectionDate.addEventListener('change', calculateHSCHFAge);
}

function calculateHSCHFAge() {
    const divResult = document.getElementById('div_scc_hsc_hf_step3_result');
    const valAge = document.getElementById('val_hsc_hf_age');
    const inspectionDate = inpHSCHFInspectionDate.value;
    
    if (!divResult || !valAge) return;
    
    if (!inspectionDate) {
        divResult.classList.add('hidden');
        return;
    }
    
    const lastDate = new Date(inspectionDate);
    const today = new Date();
    
    const errDiv = document.getElementById('err_hsc_hf_step3');
    if (errDiv) errDiv.classList.add('hidden');

    if (lastDate > today) {
        divResult.classList.add('hidden');
        if (errDiv) {
            errDiv.innerText = "Inspection date cannot be in the future.";
            errDiv.classList.remove('hidden');
        }
        // inpHSCHFInspectionDate.value = ''; // Optional: Clear or keep for correction
        return;
    }
    
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const age = (diffDays / 365.25).toFixed(2);
    
    valAge.innerText = `${age} years`;
    divResult.classList.remove('hidden');
    
    sessionStorage.setItem('hsc_hf_age', age);
    sessionStorage.setItem('hsc_hf_inspection_date', inspectionDate);
    console.log(`HSC-HF Step 3 Complete: Age = ${age} years`);
    
    // Show Step 4
    const divStep4 = document.getElementById('div_scc_hsc_hf_step4');
    if (divStep4) {
        divStep4.classList.remove('hidden');
        // Ensure it's visible
        divStep4.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// HSC-HF Step 4: Inspection History
const inpHSCHFInspA = document.getElementById('inp_hsc_hf_insp_A');
const inpHSCHFInspB = document.getElementById('inp_hsc_hf_insp_B');
const inpHSCHFInspC = document.getElementById('inp_hsc_hf_insp_C');
const inpHSCHFInspD = document.getElementById('inp_hsc_hf_insp_D');

if (inpHSCHFInspA && inpHSCHFInspB && inpHSCHFInspC && inpHSCHFInspD) {
    inpHSCHFInspA.addEventListener('input', calculateHSCHFInspectionEquivalency);
    inpHSCHFInspB.addEventListener('input', calculateHSCHFInspectionEquivalency);
    inpHSCHFInspC.addEventListener('input', calculateHSCHFInspectionEquivalency);
    inpHSCHFInspD.addEventListener('input', calculateHSCHFInspectionEquivalency);
}

function calculateHSCHFInspectionEquivalency() {
    const divResult = document.getElementById('div_scc_hsc_hf_step4_result');
    const valCategory = document.getElementById('val_hsc_hf_final_eff_cat');
    const valCount = document.getElementById('val_hsc_hf_final_eff_count');
    
    if (!divResult || !valCategory || !valCount) return;
    
    let countA = parseInt(inpHSCHFInspA.value) || 0;
    let countB = parseInt(inpHSCHFInspB.value) || 0;
    let countC = parseInt(inpHSCHFInspC.value) || 0;
    let countD = parseInt(inpHSCHFInspD.value) || 0;
    
    // 2:1 equivalency rule
    if (countD >= 2) {
        countC += Math.floor(countD / 2);
        countD = countD % 2;
    }
    if (countC >= 2) {
        countB += Math.floor(countC / 2);
        countC = countC % 2;
    }
    if (countB >= 2) {
        countA += Math.floor(countB / 2);
        countB = countB % 2;
    }
    
    let finalCategory = 'None';
    let finalCount = 0;
    
    if (countA > 0) {
        finalCategory = 'Category A';
        finalCount = countA;
    } else if (countB > 0) {
        finalCategory = 'Category B';
        finalCount = countB;
    } else if (countC > 0) {
        finalCategory = 'Category C';
        finalCount = countC;
    } else if (countD > 0) {
        finalCategory = 'Category D';
        finalCount = countD;
    }
    
    if (finalCategory === 'None') {
        divResult.classList.add('hidden');
    } else {
        valCategory.innerText = finalCategory;
        valCount.innerText = finalCount;
        divResult.classList.remove('hidden');
        
        sessionStorage.setItem('hsc_hf_final_eff_cat', finalCategory);
        sessionStorage.setItem('hsc_hf_final_eff_count', finalCount);
        console.log(`HSC-HF Step 4 Complete: ${finalCategory} (Count: ${finalCount})`);
        
        // Trigger Step 5
        calculateHSCHFBaseDamageFactor();
    }
}

// HSC-HF Step 5: Base Damage Factor
function calculateHSCHFBaseDamageFactor() {
    const divStep5 = document.getElementById('div_scc_hsc_hf_step5');
    const valBaseDF = document.getElementById('val_hsc_hf_base_df');
    
    if (!divStep5 || !valBaseDF) return;
    
    const svi = parseInt(sessionStorage.getItem('hsc_hf_svi')) || 0;
    const age = parseFloat(sessionStorage.getItem('hsc_hf_age')) || 0;
    const inspCategory = sessionStorage.getItem('hsc_hf_final_eff_cat') || 'None';
    const inspCount = parseInt(sessionStorage.getItem('hsc_hf_final_eff_count')) || 0;
    
    divStep5.classList.remove('hidden');
    
    if (!hscHFBaseDFData || !hscHFBaseDFData.data) {
        valBaseDF.innerText = 'Error';
        return;
    }
    
    // Find closest SVI key
    const sviKeys = Object.keys(hscHFBaseDFData.data).map(k => parseInt(k)).sort((a, b) => a - b);
    let sviKey = sviKeys[0];
    for (let key of sviKeys) {
        if (svi >= key) sviKey = key;
    }
    
    // Determine age bucket
    let ageBucket;
    if (inspCount === 0) {
        ageBucket = 'E';
    } else if (age < 1) {
        ageBucket = '1';
    } else if (age >= 6) {
        ageBucket = '6';
    } else {
        ageBucket = Math.floor(age).toString();
    }
    
    // Determine inspection letter
    let inspLetter = 'D';
    if (inspCategory.includes('A')) inspLetter = 'A';
    else if (inspCategory.includes('B')) inspLetter = 'B';
    else if (inspCategory.includes('C')) inspLetter = 'C';
    
    // Lookup base DF
    let baseDF = 0;
    try {
        if (ageBucket === 'E') {
            baseDF = hscHFBaseDFData.data[sviKey.toString()]['E'];
        } else {
            baseDF = hscHFBaseDFData.data[sviKey.toString()][ageBucket][inspLetter];
        }
    } catch (e) {
        console.error('Error looking up base DF:', e);
        valBaseDF.innerText = 'Error';
        return;
    }
    
    valBaseDF.innerText = baseDF;
    sessionStorage.setItem('hsc_hf_base_df', baseDF);
    console.log(`HSC-HF Step 5 Complete: Base DF = ${baseDF}`);
    
    // Trigger Step 6
    calculateHSCHFFinalDamageFactor();
}

// HSC-HF Step 6: Final Damage Factor
function calculateHSCHFFinalDamageFactor() {
    const divStep6 = document.getElementById('div_scc_hsc_hf_step6');
    const valFinalDF = document.getElementById('val_hsc_hf_final_df');
    const msgNote = document.getElementById('msg_hsc_hf_final_df_note');
    
    if (!divStep6 || !valFinalDF) return;
    
    const baseDF = parseFloat(sessionStorage.getItem('hsc_hf_base_df')) || 0;
    const age = parseFloat(sessionStorage.getItem('hsc_hf_age')) || 0;
    
    divStep6.classList.remove('hidden');
    
    // Apply Equation 2.C.6: Df = min(DfB * (max(age, 1.0))^1.1, 5000)
    const ageForCalc = Math.max(age, 1.0);
    const escalationFactor = Math.pow(ageForCalc, 1.1);
    const escalatedDF = baseDF * escalationFactor;
    const finalDF = Math.min(escalatedDF, 5000);
    
    valFinalDF.innerText = finalDF.toFixed(2);
    msgNote.innerText = 'Calculation Complete';
    
    sessionStorage.setItem('hsc_hf_final_df', finalDF);
    calculateGoverningSCCDF();
    console.log(`HSC-HF Step 6 Complete: Final DF = ${finalDF.toFixed(2)}`);
}




// ============================================================================
// PASCC (Polythionic Acid SCC) MODULE  
// ============================================================================

// PASCC Required Data is now static HTML with inputs.
// loadPASCCRequiredData() removed to prevent overwriting.

// Auto-populate PASCC Temperature from Table 4.1 (General Data)
function autoPopulatePASCCFromTable41() {
    const table41DataStr = sessionStorage.getItem('table4.1_data');
    if (!table41DataStr) return;

    try {
        const data = JSON.parse(table41DataStr);
        const temp = data.operating_temp;
        let unit = data.measurement_unit; // 'farenheit' or 'celsius'

        // Map Unit
        if (unit && unit.toLowerCase().includes('farenheeit') || unit === 'farenheit' || unit === 'F') unit = 'F'; // Handle potential typos or variations
        else if (unit && unit.toLowerCase().includes('celsius') || unit === 'C') unit = 'C';
        else unit = '';

        const inpTemp = document.getElementById('req_pascc_temp');
        const selUnit = document.getElementById('req_pascc_temp_unit');

        if (inpTemp && (temp !== undefined && temp !== null && temp !== "")) {
            inpTemp.value = temp;
        }
        if (selUnit && unit) {
            selUnit.value = unit;
        }
    } catch (e) {
        console.error("Error parsing Table 4.1 data for PASCC:", e);
    }
}

// Call on load if elements exist
if (document.getElementById('req_pascc_temp')) {
    autoPopulatePASCCFromTable41();
}

// Load PASCC Susceptibility Data
let pasccSusceptibilityData = null;

async function loadPASCCSusceptibilityData() {
    if (pasccSusceptibilityData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_pascc_susceptibility.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        pasccSusceptibilityData = await response.json();
    } catch (e) {
        console.error('Failed to load PASCC susceptibility data:', e);
    }
}

// Load SVI Data for PASCC
let pasccSVIData = null;

async function loadPASCCSVIData() {
    if (pasccSVIData) return;
    try {
        const response = await fetch('/static/formula_app/data/json/scc_severity_index.json');
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        pasccSVIData = await response.json();
    } catch (e) {
        console.error('Failed to load PASCC SVI data:', e);
    }
}

// Initialize data loading
if (document.getElementById('div_scc_pascc_step1')) {
    loadPASCCSusceptibilityData();
    loadPASCCSVIData();
}

// PASCC Step 1 Element References
const selPASCCCracksPresent = document.getElementById('sel_pascc_cracks_present');
const selPASCCCracksRemoved = document.getElementById('sel_pascc_cracks_removed');
const selPASCCExposedOperation = document.getElementById('sel_pascc_exposed_operation');
const selPASCCExposedShutdown = document.getElementById('sel_pascc_exposed_shutdown');
const inpPASCCTemp = document.getElementById('inp_pascc_temp');
const selPASCCTempUnit = document.getElementById('sel_pascc_temp_unit');
const selPASCCMaterial = document.getElementById('sel_pascc_material');
const selPASCCThermalHistory = document.getElementById('sel_pascc_thermal_history');
const btnPASCCCalcSusceptibility = document.getElementById('btn_pascc_calc_susceptibility');
const selPASCCDowntimeProtection = document.getElementById('sel_pascc_downtime_protection');

// Helper: Show Validation Message
function showPASCCValidation(msg) {
    const divMsg = document.getElementById('div_pascc_validation_msg');
    const txtMsg = document.getElementById('txt_pascc_validation_msg');
    if (divMsg && txtMsg) {
        txtMsg.innerText = msg;
        divMsg.classList.remove('hidden');
        // Auto-hide after 5 seconds
        setTimeout(() => {
            divMsg.classList.add('hidden');
        }, 5000);
    }
}

// Question 1: Cracks present?
if (selPASCCCracksPresent) {
    selPASCCCracksPresent.addEventListener('change', () => {
        const divCracksRemoved = document.getElementById('div_pascc_cracks_removed');
        const divExposedOperation = document.getElementById('div_pascc_exposed_operation');
        const divExposedShutdown = document.getElementById('div_pascc_exposed_shutdown');
        const divTableLookup = document.getElementById('div_pascc_table_lookup');
        const divDowntimeProtection = document.getElementById('div_pascc_downtime_protection');
        const divResult = document.getElementById('div_pascc_step1_result');
        const divStep2 = document.getElementById('div_scc_pascc_step2');
        
        divCracksRemoved.classList.add('hidden');
        divExposedOperation.classList.add('hidden');
        divExposedShutdown.classList.add('hidden');
        divTableLookup.classList.add('hidden');
        divDowntimeProtection.classList.add('hidden');
        divResult.classList.add('hidden');
        if (divStep2) divStep2.classList.add('hidden');
        
        // Hide Step 3-6 if visible
        hidePASCCStepsFrom(3);
        
        if (selPASCCCracksRemoved) selPASCCCracksRemoved.value = '';
        if (selPASCCExposedOperation) selPASCCExposedOperation.value = '';
        if (selPASCCExposedShutdown) selPASCCExposedShutdown.value = '';
        if (selPASCCDowntimeProtection) selPASCCDowntimeProtection.value = '';
        
        if (selPASCCCracksPresent.value === 'Yes') {
            // Show "Cracks removed?" question (don't display result yet)
            divCracksRemoved.classList.remove('hidden');
            if (selPASCCCracksRemoved && selPASCCCracksRemoved.value) {
                 selPASCCCracksRemoved.dispatchEvent(new Event('change'));
            }
        } else if (selPASCCCracksPresent.value === 'No') {
            divExposedOperation.classList.remove('hidden');
            if (selPASCCExposedOperation && selPASCCExposedOperation.value) {
                 selPASCCExposedOperation.dispatchEvent(new Event('change'));
            }
        }
    });
}

// Question 2: Cracks removed?
if (selPASCCCracksRemoved) {
    selPASCCCracksRemoved.addEventListener('change', () => {
        hidePASCCStepsFrom(2);
        if (selPASCCCracksRemoved.value === 'No') {
            displayPASCCResult('FFS Required', 'Cracks present and not removed. Fitness-for-Service evaluation required per API 579-1/ASME FFS-1.');
        } else if (selPASCCCracksRemoved.value === 'Yes') {
            displayPASCCResult('High', 'Cracks confirmed and removed. High susceptibility to PASCC. Continue to Step 2.');
        }
    });
}

// Question 3: Exposed during operation?
if (selPASCCExposedOperation) {
    selPASCCExposedOperation.addEventListener('change', () => {
        const divExposedShutdown = document.getElementById('div_pascc_exposed_shutdown');
        const divTableLookup = document.getElementById('div_pascc_table_lookup');
        const divDowntimeProtection = document.getElementById('div_pascc_downtime_protection');
        const divResult = document.getElementById('div_pascc_step1_result');
        const divStep2 = document.getElementById('div_scc_pascc_step2');
        
        divExposedShutdown.classList.add('hidden');
        divTableLookup.classList.add('hidden');
        divDowntimeProtection.classList.add('hidden');
        divResult.classList.add('hidden');
        if (divStep2) divStep2.classList.add('hidden');
        
        hidePASCCStepsFrom(3);
        
        if (selPASCCExposedShutdown) selPASCCExposedShutdown.value = '';
        
        if (selPASCCExposedOperation.value === 'Yes') {
            divTableLookup.classList.remove('hidden');
            // Trigger calculation if inputs are ready?
            // inpPASCCTemp, etc. might be populated. 
            // Let user click calculate? Or trigger it?
            // User usually has to click Calculate. But if we auto-populated inputs...
            // Let's just reveal the table lookup. The inputs are there.
        } else if (selPASCCExposedOperation.value === 'No') {
            divExposedShutdown.classList.remove('hidden');
             if (selPASCCExposedShutdown && selPASCCExposedShutdown.value) {
                 selPASCCExposedShutdown.dispatchEvent(new Event('change'));
            }
        }
    });
}

// Question 4: Exposed during shutdown?
if (selPASCCExposedShutdown) {
    selPASCCExposedShutdown.addEventListener('change', () => {
        const divTableLookup = document.getElementById('div_pascc_table_lookup');
        const divDowntimeProtection = document.getElementById('div_pascc_downtime_protection');
        const divResult = document.getElementById('div_pascc_step1_result');
        const divStep2 = document.getElementById('div_scc_pascc_step2');
        
        divTableLookup.classList.add('hidden');
        divDowntimeProtection.classList.add('hidden');
        divResult.classList.add('hidden');
        if (divStep2) divStep2.classList.add('hidden');
        
        hidePASCCStepsFrom(3);
        
        if (selPASCCExposedShutdown.value === 'No') {
            displayPASCCResult('Not Susceptible', 'Component is not exposed to sulfides, moisture, and oxygen during operation or shutdown.');
        } else if (selPASCCExposedShutdown.value === 'Yes') {
            divTableLookup.classList.remove('hidden');
        }
    });
}

// Calculate Susceptibility from Table 2.C.8.2
if (btnPASCCCalcSusceptibility) {
    btnPASCCCalcSusceptibility.addEventListener('click', calculatePASCCSusceptibility);
}

function calculatePASCCSusceptibility() {
    if (!pasccSusceptibilityData) {
        showPASCCValidation('Susceptibility data not loaded yet. Please try again.');
        return;
    }
    
    const temp = parseFloat(inpPASCCTemp.value);
    const tempUnit = selPASCCTempUnit.value;
    const material = selPASCCMaterial.value;
    const thermalHistory = selPASCCThermalHistory.value;
    
    if (!temp || !material || !thermalHistory) {
        showPASCCValidation('Please fill in all fields: Temperature, Material, and Thermal History.');
        return;
    }
    
    let tempF = temp;
    if (tempUnit === 'C') {
        tempF = (temp * 9/5) + 32;
    }
    
    const tempRange = tempF < 800 ? 'below_800F' : 'above_800F';
    const rangeData = pasccSusceptibilityData.temperature_ranges[tempRange];
    
    const materialData = rangeData.materials.find(m => m.material === material);
    if (!materialData) {
        showPASCCValidation('Material not found in susceptibility data.');
        return;
    }
    
    let susceptibility = null;
    if (thermalHistory === 'solution_annealed') {
        susceptibility = materialData.solution_annealed;
    } else if (thermalHistory === 'stabilized_before_welding') {
        susceptibility = materialData.stabilized_before_welding;
    } else if (thermalHistory === 'stabilized_after_welding') {
        susceptibility = materialData.stabilized_after_welding;
    }
    
    if (susceptibility === null || susceptibility === undefined) {
        showPASCCValidation('This thermal history is not applicable for the selected material.');
        return;
    }
    
    sessionStorage.setItem('pascc_table_susceptibility', susceptibility);
    
    // Reset downtime protection selection
    if (selPASCCDowntimeProtection) selPASCCDowntimeProtection.value = '';

    // Show Table Result (without triggering Step 2 yet)
    displayPASCCResult(susceptibility, 'Susceptibility determined from Table 2.C.8.2. Please indicate if downtime protection is used.', false);

    const divDowntimeProtection = document.getElementById('div_pascc_downtime_protection');
    divDowntimeProtection.classList.remove('hidden');
    
    console.log(`PASCC Table Lookup: Temp=${tempF}°F, Material=${material}, Thermal=${thermalHistory}, Result=${susceptibility}`);
}

// Question 5: Downtime protection?
if (selPASCCDowntimeProtection) {
    selPASCCDowntimeProtection.addEventListener('change', () => {
        const tableSusceptibility = sessionStorage.getItem('pascc_table_susceptibility');
        
        if (!tableSusceptibility) {
            showPASCCValidation('Please calculate susceptibility from the table first.');
            return;
        }
        
        let finalSusceptibility = tableSusceptibility;
        let note = `Susceptibility from Table 2.C.8.2: ${tableSusceptibility}.`;
        
        if (selPASCCDowntimeProtection.value === 'Yes') {
            const reductionMap = {
                'High': 'Medium',
                'Medium': 'Low',
                'Low': 'None'
            };
            finalSusceptibility = reductionMap[tableSusceptibility] || tableSusceptibility;
            note += ` Reduced to ${finalSusceptibility} due to downtime protection per NACE RP 01.70.`;
        } else {
            note += ' No downtime protection used.';
        }
        
        if (finalSusceptibility === 'None') {
            finalSusceptibility = 'Not Susceptible';
        }
        
        hidePASCCStepsFrom(3);
        displayPASCCResult(finalSusceptibility, note, true);
    });
}

function displayPASCCResult(susceptibility, note, triggerNextStep = true) {
    const divResult = document.getElementById('div_pascc_step1_result');
    const valSusceptibility = document.getElementById('val_pascc_susceptibility');
    const msgNote = document.getElementById('msg_pascc_susceptibility_note');
    const divStep2 = document.getElementById('div_scc_pascc_step2');
    
    valSusceptibility.innerText = susceptibility;
    msgNote.innerText = note;
    divResult.classList.remove('hidden');
    
    valSusceptibility.classList.remove('text-red-900', 'text-orange-600', 'text-blue-900');
    if (susceptibility === 'High') {
        valSusceptibility.classList.add('text-red-900');
    } else if (susceptibility === 'Medium') {
        valSusceptibility.classList.add('text-orange-600');
    } else if (susceptibility === 'FFS Required') {
        valSusceptibility.classList.add('text-red-900');
    } else {
        valSusceptibility.classList.add('text-blue-900');
    }
    
    sessionStorage.setItem('pascc_susceptibility', susceptibility);
    console.log(`PASCC Step 1 Complete: Susceptibility = ${susceptibility}`);
    
    if (triggerNextStep) {
        // Only show Step 2 for valid susceptibilities (not FFS)
        if (susceptibility !== 'FFS Required') {
            calculatePASCCSeverityIndex(susceptibility);
        } else {
            // Hide Step 2 if FFS Required
            if (divStep2) divStep2.classList.add('hidden');
            hidePASCCStepsFrom(3);
        }
    } else {
        // Ensure Step 2 is hidden if not triggering (e.g. intermediate step)
        if (divStep2) divStep2.classList.add('hidden');
    }
}

// PASCC Step 2: Calculate Severity Index (SVI)
function calculatePASCCSeverityIndex(susceptibility) {
    const divStep2 = document.getElementById('div_scc_pascc_step2');
    const valSVI = document.getElementById('val_pascc_svi');
    
    if (!divStep2 || !valSVI) return;
    
    divStep2.classList.remove('hidden');
    
    loadPASCCSVIData().then(() => {
        if (!pasccSVIData || !pasccSVIData.mappings) {
            valSVI.innerText = 'Error';
            return;
        }
        
        let svi = 0;
        if (susceptibility === 'Not Susceptible') {
            svi = pasccSVIData.mappings['None'] || 0;
        } else if (pasccSVIData.mappings[susceptibility] !== undefined) {
            svi = pasccSVIData.mappings[susceptibility];
        }
        
        valSVI.innerText = svi;
        sessionStorage.setItem('pascc_svi', svi);
        console.log(`PASCC Step 2 Complete: SVI = ${svi}`);
        
        // Show Step 3
        const divStep3 = document.getElementById('div_scc_pascc_step3');
        if (divStep3) divStep3.classList.remove('hidden');
    });
}

// PASCC Step 3: Time in Service
const inpPASCCInspectionDate = document.getElementById('inp_pascc_inspection_date');

if (inpPASCCInspectionDate) {
    inpPASCCInspectionDate.addEventListener('change', () => {
        calculatePASCCAge();
    });
}

function calculatePASCCAge() {
    const inspectionDate = inpPASCCInspectionDate.value;
    const valAge = document.getElementById('val_pascc_age');
    const divStep3Result = document.getElementById('div_scc_pascc_step3_result');
    
    if (!inspectionDate) return;
    
    const lastDate = new Date(inspectionDate);
    const today = new Date();
    const age = (today - lastDate) / (1000 * 60 * 60 * 24 * 365.25);
    const finalAge = Math.max(0, age.toFixed(2));
    
    valAge.innerText = finalAge;
    divStep3Result.classList.remove('hidden');
    
    sessionStorage.setItem('pascc_age', finalAge);
    console.log(`PASCC Step 3 Complete: Age = ${finalAge} years`);
    
    // Show Step 4
    const divStep4 = document.getElementById('div_scc_pascc_step4');
    if (divStep4) divStep4.classList.remove('hidden');
}

// PASCC Step 4: Inspection History
const inpPASCCInspA = document.getElementById('inp_pascc_insp_a');
const inpPASCCInspB = document.getElementById('inp_pascc_insp_b');
const inpPASCCInspC = document.getElementById('inp_pascc_insp_c');
const inpPASCCInspD = document.getElementById('inp_pascc_insp_d');

const pasccInspectionInputs = [inpPASCCInspA, inpPASCCInspB, inpPASCCInspC, inpPASCCInspD];

pasccInspectionInputs.forEach(input => {
    if (input) {
        input.addEventListener('input', calculatePASCCInspectionEffectiveness);
    }
});

function calculatePASCCInspectionEffectiveness() {
    const inspA = parseInt(document.getElementById('inp_pascc_insp_a').value) || 0;
    const inspB = parseInt(document.getElementById('inp_pascc_insp_b').value) || 0;
    const inspC = parseInt(document.getElementById('inp_pascc_insp_c').value) || 0;
    const inspD = parseInt(document.getElementById('inp_pascc_insp_d').value) || 0;
    
    // Calculate effectiveness based on 2:1 rule
    let effectiveCategory = 'E'; // Default (None/Ineffective)
    let effectiveCount = 0;
    
    // Simple logic for highest effectiveness
    if (inspA > 0) {
        effectiveCategory = 'A';
        effectiveCount = inspA;
    } else if (inspB > 0) {
        // Check if B's can be promoted to A (needs 2 B's)
        if (inspB >= 2) {
             effectiveCategory = 'A';
             effectiveCount = Math.floor(inspB / 2); // 2 B's = 1 A
             // Note: API 581 typically just uses the highest category present or combines.
             // For strict rule compliance: "The number of Highest Effectiveness Inspections is determined..."
        } else {
             effectiveCategory = 'B';
             effectiveCount = inspB;
        }
    } else if (inspC > 0) {
         if (inspC >= 2) { // 2 C's = 1 B
             effectiveCategory = 'B';
             effectiveCount = Math.floor(inspC / 2);
         } else {
             effectiveCategory = 'C';
             effectiveCount = inspC;
         }
    } else if (inspD > 0) {
         if (inspD >= 2) { // 2 D's = 1 C
             effectiveCategory = 'C';
             effectiveCount = Math.floor(inspD / 2);
         } else {
             effectiveCategory = 'D';
             effectiveCount = inspD;
         }
    }
    
    // Better Aggregation Logic (Combine all to highest level possible)
    let totalScore = (inspA * 8) + (inspB * 4) + (inspC * 2) + (inspD * 1);
    
    let finalCat = 'E';
    let finalCount = 0;
    
    // Determine highest category achievable with total score
    // A requires 8 points, B requires 4, C requires 2, D requires 1
    if (totalScore >= 8 && (inspA > 0 || inspB >= 2 || inspC >= 4 || inspD >= 8)) {
        finalCat = 'A';
        finalCount = Math.floor(totalScore / 8); 
        // Cap count based on limitation if needed, but usually just raw count.
        // However, standard API 581 table 2.C.1.3 usually caps at 1 or 2 high inspections.
        if (finalCount > 3) finalCount = 3; // Max needed for table lookup usually
    } else if (totalScore >= 4) {
        finalCat = 'B';
        finalCount = Math.floor(totalScore / 4);
        if (finalCount > 3) finalCount = 3;
    } else if (totalScore >= 2) {
        finalCat = 'C';
        finalCount = Math.floor(totalScore / 2);
        if (finalCount > 3) finalCount = 3;
    } else if (totalScore >= 1) {
        finalCat = 'D';
        finalCount = totalScore;
        if (finalCount > 3) finalCount = 3;
    }
    
    const divResult = document.getElementById('div_scc_pascc_step4_result');
    const valCategory = document.getElementById('val_pascc_final_category');
    const valCount = document.getElementById('val_pascc_final_count');
    
    valCategory.innerText = finalCat;
    valCount.innerText = finalCount;
    divResult.classList.remove('hidden');
    
    sessionStorage.setItem('pascc_insp_category', finalCat);
    sessionStorage.setItem('pascc_insp_count', finalCount);
    
    // Show Step 5
    const divStep5 = document.getElementById('div_scc_pascc_step5');
    if (divStep5) divStep5.classList.remove('hidden');
    
    calculatePASCCBaseDamageFactor();
}

// PASCC Step 5: Base Damage Factor
async function calculatePASCCBaseDamageFactor() {
    const svi = parseInt(sessionStorage.getItem('pascc_svi')) || 0;
    const inspCategory = sessionStorage.getItem('pascc_insp_category') || 'E';
    let inspCount = parseInt(sessionStorage.getItem('pascc_insp_count')) || 0;
    
    try {
        const response = await fetch('/static/formula_app/data/json/scc_base_damage_factor.json');
        if (!response.ok) throw new Error('Failed to load Base DF data');
        const json = await response.json();
        const data = json.data;
        
        let baseDF = svi; // Default to SVI if lookup fails
        
        // 1. Get SVI data object
        const sviData = data[svi.toString()];
        
        if (sviData) {
            if (inspCategory === 'E') {
                baseDF = sviData['E'];
            } else {
                // Clamp inspection count to 6 (max in typical tables) or whatever max is in JSON
                // Checking keys: "1", "2", ... "6"
                if (inspCount > 6) inspCount = 6;
                if (inspCount < 1) inspCount = 1; // Should handle 0 via 'E' check, but if Cat A with 0? logic says count >= 1 for cats.
                
                const countData = sviData[inspCount.toString()];
                if (countData && countData[inspCategory] !== undefined) {
                    baseDF = countData[inspCategory];
                } else {
                    // Fallback if specific count/cat missing
                    console.warn(`Missing Base DF data for SVI=${svi}, Count=${inspCount}, Cat=${inspCategory}`);
                }
            }
        } else {
             console.warn(`SVI ${svi} not found in Base DF table.`);
        }
        
        const valBaseDF = document.getElementById('val_pascc_base_df');
        valBaseDF.innerText = baseDF;
        sessionStorage.setItem('pascc_base_df', baseDF);
        
        console.log(`PASCC Step 5 Complete: Base DF = ${baseDF}`);
        
        // Trigger Step 6
        calculatePASCCFinalDamageFactor();
        
    } catch (e) {
        console.error('Error calculating Base DF:', e);
        showPASCCValidation('Error loading Base Damage Factor table.');
    }
}

// PASCC Step 6: Final Damage Factor
function calculatePASCCFinalDamageFactor() {
    const divStep6 = document.getElementById('div_scc_pascc_step6');
    const valFinalDF = document.getElementById('val_pascc_final_df');
    const msgNote = document.getElementById('msg_pascc_final_df_note');
    
    if (!divStep6 || !valFinalDF) return;
    
    const baseDF = parseFloat(sessionStorage.getItem('pascc_base_df')) || 0;
    
    divStep6.classList.remove('hidden');
    
    // Apply Equation 2.C.7: Df = min(DfB, 5000)
    // NOTE: PASCC DOES NOT use time escalation (age^1.1) like other mechanisms.
    const finalDF = Math.min(baseDF, 5000);
    
    valFinalDF.innerText = finalDF.toFixed(2);
    msgNote.innerText = 'Calculation Complete (No time escalation applied for PASCC).';
    
    sessionStorage.setItem('pascc_final_df', finalDF);
    calculateGoverningSCCDF();
    console.log(`PASCC Step 6 Complete: Final DF = ${finalDF.toFixed(2)}`);
}

function hidePASCCStepsFrom(step) {
    if (step <= 2) {
        const divStep2 = document.getElementById('div_scc_pascc_step2');
        if (divStep2) divStep2.classList.add('hidden');
    }
    if (step <= 3) {
        const divStep3 = document.getElementById('div_scc_pascc_step3');
        const divStep3Result = document.getElementById('div_scc_pascc_step3_result');
        if (divStep3) divStep3.classList.add('hidden');
        if (divStep3Result) divStep3Result.classList.add('hidden');
    }
    if (step <= 4) {
        const divStep4 = document.getElementById('div_scc_pascc_step4');
        const divStep4Result = document.getElementById('div_scc_pascc_step4_result');
        if (divStep4) divStep4.classList.add('hidden');
        if (divStep4Result) divStep4Result.classList.add('hidden');
    }
    if (step <= 5) {
        const divStep5 = document.getElementById('div_scc_pascc_step5');
        if (divStep5) divStep5.classList.add('hidden');
    }
    if (step <= 6) {
        const divStep6 = document.getElementById('div_scc_pascc_step6');
        if (divStep6) divStep6.classList.add('hidden');
        sessionStorage.removeItem('pascc_final_df');
    }
}

// ============================================================================
// GOVERNING SCC DAMAGE FACTOR (Equation 2.5)
// ============================================================================

function calculateGoverningSCCDF() {
    const mechanisms = [
        { id: 'scc_mech_caustic', key: 'scc_caustic_final_df' },
        { id: 'scc_mech_amine', key: 'amine_final_df' },
        { id: 'scc_mech_ssc', key: 'scc_ssc_final_df' },
        // { id: 'scc_mech_hic_h2s', key: 'scc_hic_sohic_h2s_final_df' }, // Placeholder/Not Implemented
        { id: 'scc_mech_acscc', key: 'scc_acscc_final_df' },
        { id: 'scc_mech_pascc', key: 'pascc_final_df' },
        { id: 'scc_mech_ciscc', key: 'scc_clscc_final_df' }, // CLSCC uses 'ciscc' in ID
        { id: 'scc_mech_hsc_hf', key: 'hsc_hf_final_df' },
        { id: 'scc_mech_hic_hf', key: 'hic_hf_final_df' }
    ];

    let maxDF = 0.0;
    
    mechanisms.forEach(mech => {
        const toggle = document.getElementById(mech.id);
        // Only consider if checkbox exists and IS CHECKED
        if (toggle && toggle.checked) {
            const val = parseFloat(sessionStorage.getItem(mech.key)) || 0;
            if (val > maxDF) {
                maxDF = val;
            }
        }
    });
    
    const valGov = document.getElementById('val_scc_governing');
    const contGov = document.getElementById('scc_max_result_container');
    
    // Save Governing Result for future Total DF calculation
    sessionStorage.setItem('scc_governing_final_df', maxDF.toFixed(2));
    
    if (valGov && contGov) {
        valGov.innerText = maxDF.toFixed(2);
        // Ensure container is visible
        contGov.classList.remove('hidden');
    }
}

// Initialize Global Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Attach to all scc mechanism checkboxes using their class
    const checkboxes = document.querySelectorAll('.scc-mech-check');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', calculateGoverningSCCDF);
        // Also ensure we calculate initially if any are pre-checked (e.g. browser cache)
        if (cb.checked) calculateGoverningSCCDF();
    });
});

// Also trigger once on load to be safe
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', calculateGoverningSCCDF);
} else {
    calculateGoverningSCCDF();
}

// --- Persistence Restoration ---
function loadSavedSSCResults() {
    // Step 1: Severity
    const severity = sessionStorage.getItem('scc_ssc_env_severity');
    if (severity) {
        const resultDiv = document.getElementById('div_scc_ssc_step1_result');
        const resultSpan = document.getElementById('val_scc_ssc_env_severity');
        if (resultDiv && resultSpan) {
            resultSpan.textContent = severity;
            resultSpan.className = 'font-bold ml-1';
            if(severity === 'High') resultSpan.classList.add('text-red-600');
            else if(severity === 'Medium') resultSpan.classList.add('text-orange-500');
            else if(severity === 'Low') resultSpan.classList.add('text-yellow-600');
            else resultSpan.classList.add('text-green-600');
            
            resultDiv.classList.remove('hidden');
            
            // Unlock Step 2
            const divStep1 = document.getElementById('div_scc_ssc_step1');
            if(divStep1) divStep1.classList.remove('hidden');
            const divStep2 = document.getElementById('div_scc_ssc_step2');
            if(divStep2) divStep2.classList.remove('hidden');
        }
    }

    // Step 2: Susceptibility
    const susc = sessionStorage.getItem('scc_ssc_susceptibility');
    if (susc) {
        const resultDiv = document.getElementById('div_scc_ssc_step2_result');
        const resultSpan = document.getElementById('val_scc_ssc_susceptibility');
            if (resultDiv && resultSpan) {
            resultSpan.textContent = susc;
            resultSpan.className = 'font-bold ml-1';
            if(susc === 'FFS Required') resultSpan.classList.add('text-red-800', 'bg-red-100', 'px-2', 'rounded');
            else if(susc === 'High') resultSpan.classList.add('text-red-600');
            else if(susc === 'Medium') resultSpan.classList.add('text-orange-500');
            else if(susc === 'Low') resultSpan.classList.add('text-yellow-600');
            else resultSpan.classList.add('text-green-600');

            resultDiv.classList.remove('hidden');
            
            // Unlock Step 3
            // Assuming if we have a saved susceptibility, we potentially unlocked Step 3
            // BUT we must check cracks selection as per recent logic change
            const cracksSelected = document.getElementById('sel_scc_ssc_cracks_present');
            if(cracksSelected && cracksSelected.value !== '') {
                 const step3Div = document.getElementById('div_scc_ssc_step3');
                 if(step3Div) step3Div.classList.remove('hidden');
            }
            }
    }

    // Step 3: SVI
    const svi = sessionStorage.getItem('scc_ssc_svi');
    if (svi) {
            const resultDiv = document.getElementById('div_scc_ssc_step3_result');
            const resultSpan = document.getElementById('val_scc_ssc_svi');
            if (resultDiv && resultSpan) {
                resultSpan.textContent = svi;
                resultDiv.classList.remove('hidden');
                
                // Unlock Step 4
                const step3Div = document.getElementById('div_scc_ssc_step3');
                if(step3Div) step3Div.classList.remove('hidden');
                const step4Div = document.getElementById('div_scc_ssc_step4');
                if(step4Div) step4Div.classList.remove('hidden');
            }
    }

    // Step 4: Age
    const age = sessionStorage.getItem('scc_ssc_age');
    if (age) {
            const valAgeSpan = document.getElementById('val_scc_ssc_age');
            if(valAgeSpan) valAgeSpan.textContent = age;
            
            // Unlock Step 5
            const step5Div = document.getElementById('div_scc_ssc_step5');
            if(step5Div) step5Div.classList.remove('hidden');
    }
}

function loadSavedCausticResults() {
    const finalDF = sessionStorage.getItem('scc_caustic_final_df');
    const baseDF = sessionStorage.getItem('scc_caustic_base_df');
    
    // Restore Inputs First (to ensure UI matches state)
    // We need to save inputs in calculateCausticSusceptibility for this to work perfectly.
    // Assuming we start saving them or they are already saved? 
    // Checking code... we are NOT saving 'cracksPresent' explicitly to session in calculateCausticSusceptibility.
    // We need to add saving logic there first? Or just rely on the fact that if finalDF exists, we *should* have valid state?
    // But if browser refreshed, UI inputs are empty.
    
    // Let's TRY to restore inputs if they happen to be there (we need to update saving logic likely).
    // BUT for now, let's just be safer about unhiding.
    
    const divInputs = document.getElementById('div_scc_caustic_inputs');
    
    // Recovery Check: If "Cracks Present" is empty in UI, we should probably NOT show Step 3/4 yet 
    // unless we can restore it.
    const cracksSelect = document.getElementById('scc_caustic_cracks_present');
    
    // Restore Input Value First
    const savedCracks = sessionStorage.getItem('scc_caustic_cracks_present');
    if (savedCracks && cracksSelect) {
        cracksSelect.value = savedCracks;
        // Trigger change to update dependent dropdown visibility (Removed, Stress Relieved)?
        // We might need to manually unhide dependent input divs too or trigger event.
        // For simplicity, let's trigger the event:
        cracksSelect.dispatchEvent(new Event('change'));
    }

    if (finalDF) {
         if(divInputs) divInputs.classList.remove('hidden');

        // Only unhide downstream steps if we have inputs or if we are sure?
        // Actually, if we just unhide Inputs, and the user hasn't selected anything, it's weird to show Step 3.
        
        if (cracksSelect && cracksSelect.value !== '') {
             const divStep2 = document.getElementById('div_scc_caustic_step2');
             if(divStep2) divStep2.classList.remove('hidden');

             const divStep3 = document.getElementById('div_scc_caustic_step3');
             if(divStep3) divStep3.classList.remove('hidden');
             
             // ... and so on
        } else {
            // Cracks empty? Hide downstream to be safe.
            // But we want to persist! 
            // So we MUST restore Cracks value if we want to persist.
            // But I don't have it saved!
            // I will add saving logic for inputs in the next tool call.
            // For now, let's AT LEAST hide Step 3/4 if Cracks is empty to stop "showing steps ahead of time".
        }

         // Populate Values (always safe to populate text)
         document.getElementById('scc_caustic_base_df_val').innerText = sessionStorage.getItem('scc_caustic_base_df') || '--';
         document.getElementById('scc_caustic_final_df_val').innerText = finalDF;
         
         const age = sessionStorage.getItem('scc_caustic_age');
         if(age) document.getElementById('scc_caustic_age_val').innerText = age;
         
         const susc = sessionStorage.getItem('scc_caustic_susceptibility');
         if(susc) document.getElementById('scc_caustic_susceptibility_val').innerText = susc;

         const svi = sessionStorage.getItem('scc_caustic_svi');
         if(svi) document.getElementById('scc_caustic_svi_val').innerText = svi;
    }
}

// Call restoration on load
loadSavedSSCResults();
// Call restoration on load
loadSavedSSCResults();
loadSavedCausticResults();


    // --- PASCC Confirm Table Data Button ---
    const btnConfirmPASCC = document.getElementById('btn_scc_pascc_confirm_table');
    if(btnConfirmPASCC) {
        btnConfirmPASCC.addEventListener('click', () => {
             // 1. Sync Table Inputs to Steps
             const reqThermal = document.getElementById('req_pascc_thermal_history');
             const reqTemp = document.getElementById('req_pascc_temp');
             const reqTempUnit = document.getElementById('req_pascc_temp_unit');
             const reqMaterial = document.getElementById('req_pascc_material');
             const reqOp = document.getElementById('req_pascc_exposed_operation');
             const reqShut = document.getElementById('req_pascc_exposed_shutdown');
             const reqDown = document.getElementById('req_pascc_downtime_protection');

             // Target Inputs
             const inpThermal = document.getElementById('sel_pascc_thermal_history');
             const inpTemp = document.getElementById('inp_pascc_temp');
             const inpTempUnit = document.getElementById('sel_pascc_temp_unit');
             const inpMaterial = document.getElementById('sel_pascc_material');
             const inpOp = document.getElementById('sel_pascc_exposed_operation');
             const inpShut = document.getElementById('sel_pascc_exposed_shutdown');
             const inpDown = document.getElementById('sel_pascc_downtime_protection');

             if(reqThermal && inpThermal) inpThermal.value = reqThermal.value;
             // Do NOT trigger change events here to prevent cascading reveals (progressive disclosure)

             if(reqTemp && inpTemp) inpTemp.value = reqTemp.value;
             if(reqTempUnit && inpTempUnit) inpTempUnit.value = reqTempUnit.value;
             // if(inpTemp) inpTemp.dispatchEvent(new Event('input')); // Removed to prevent premature calculation

             if(reqMaterial && inpMaterial) inpMaterial.value = reqMaterial.value;
             // if(inpMaterial) inpMaterial.dispatchEvent(new Event('change'));

             if(reqOp && inpOp) inpOp.value = reqOp.value;
             // if(inpOp) inpOp.dispatchEvent(new Event('change'));

             if(reqShut && inpShut) inpShut.value = reqShut.value;
             // if(inpShut) inpShut.dispatchEvent(new Event('change'));

             if(reqDown && inpDown) inpDown.value = reqDown.value;
             // if(inpDown) inpDown.dispatchEvent(new Event('change'));

             // 2. Reveal Step 1
             const divStep1 = document.getElementById('div_scc_pascc_step1');
             if(divStep1) {
                 divStep1.classList.remove('hidden');
                 divStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }
        });
    }

