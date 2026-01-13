
import { interpolate } from "../js/utils.js";

document.addEventListener('DOMContentLoaded', () => {

    // Inputs Step 1
    let requiredData = null;
    const inpThickness = document.getElementById('inp_ext_ferritic_thickness');
    const inpInstallDate = document.getElementById('inp_ext_ferritic_install_date');
    const outAge = document.getElementById('val_ext_ferritic_age');

    // Auto-Populate from Table 4.1
    const t41Str = sessionStorage.getItem("table4.1_data");
    if (t41Str) {
        try {
            const d = JSON.parse(t41Str);
            
            // 1. Start Date -> Install Date
            if (d.start_date && inpInstallDate) {
                inpInstallDate.value = d.start_date;
                inpInstallDate.readOnly = true;
                inpInstallDate.classList.add('bg-gray-100', 'cursor-not-allowed');
                setTimeout(() => calculateAge(), 100); 
            }

            // 2. Nominal Thickness -> Furnished Thickness
            if (d.thickness && inpThickness) {
                inpThickness.value = d.thickness;
                inpThickness.readOnly = true;
                inpThickness.classList.add('bg-gray-100', 'cursor-not-allowed');
            }

        } catch (e) {
            console.error("ExtCorr: Error populating start date/thickness", e);
        }
    }

    // Inputs Step 3
    const selDriver = document.getElementById("sel_ext_ferritic_driver");
    const inpOpTemp = document.getElementById("inp_ext_ferritic_op_temp");
    const selTempUnit = document.getElementById("sel_ext_ferritic_temp_unit");
    const outCrB = document.getElementById("val_ext_ferritic_crb");
    const lblRateUnit = document.getElementById("lbl_ext_ferritic_rate_unit");

    // Init
    attachListeners();
    fetchRequiredData(); // Populate the top "Required Data" table immediately


    function attachListeners() {
        if(inpInstallDate) inpInstallDate.addEventListener('change', calculateAge);
        
        // Step 3 Listeners
        if(selDriver) selDriver.addEventListener('change', calculateCrB);
        if(inpOpTemp) inpOpTemp.addEventListener('input', calculateCrB);
        if(selTempUnit) selTempUnit.addEventListener('change', calculateCrB);
    }

    function calculateAge() {
        if(!inpInstallDate.value) return;

        const installDate = new Date(inpInstallDate.value);
        const today = new Date(); 
        
        const diffTime = today - installDate;
        const age = diffTime / (31557600000); 

        if (age < 0) {
            outAge.innerText = "Error (Future Date)";
            hideStep2();
        } else {
            outAge.innerText = age.toFixed(2); 
            showStep2();
        }
    }

    function hideStep2() {
        const step2 = document.getElementById("ext_ferritic_step2_container");
        if(step2) step2.classList.add("hidden");
    }

    function showStep2() {
        const step2 = document.getElementById("ext_ferritic_step2_container");
        const resDiv = document.getElementById("ext_ferritic_step2_result");
        const nextBtn = document.getElementById("btn_ext_ferritic_step2_next");
        
        if(!step2 || !resDiv) return;
        
        step2.classList.remove("hidden");

        const crThinning = sessionStorage.getItem("corrosion_rate") || sessionStorage.getItem("thinning_corrosion_rate");
        
        if (crThinning && parseFloat(crThinning) > 0) {
            // Case: CR Exists
            resDiv.innerHTML = `
                <div class="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-green-600 shrink-0 h-5 w-5 mt-0.5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <div class="font-bold text-green-800">Corrosion Rate Available</div>
                        <div class="text-sm text-green-700 mt-1">
                            Assigned Corrosion Rate: <strong>${parseFloat(crThinning).toFixed(4)} mpy/mmpy</strong><br>
                            Based on inspection history/specialist.
                        </div>
                    </div>
                </div>
            `;
            if(nextBtn) {
                nextBtn.innerText = "Proceed to Step 5";
                nextBtn.classList.remove("hidden");
                // nextBtn.onclick = () => revealStep(5); 
            }

        } else {
            // Case: CR Missing
            resDiv.innerHTML = `
                <div class="flex items-start gap-3 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-gray-500 shrink-0 h-5 w-5 mt-0.5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <span class="font-bold text-gray-900 block mb-1">No Assigned Corrosion Rate Found.</span>
                        <div class="text-sm text-gray-700">A specific corrosion rate from history was not found. Please proceed to <strong>Step 3</strong> to determine Base Corrosion Rate.</div>
                    </div>
                </div>
            `;
            if(nextBtn) {
                nextBtn.innerText = "Proceed to Step 3";
                nextBtn.classList.remove("hidden");
                nextBtn.onclick = () => showStep3(); 
            }
        }
    }

    // --- Step 3: Base Corrosion Rate ---
    async function showStep3() {
        const step3 = document.getElementById("ext_ferritic_step3_container");
        if(step3) step3.classList.remove("hidden");
        
        await fetchRequiredData();

        // Load Temp from Session (Initial fill)
        const table1Str = sessionStorage.getItem("table4.1_data");
        
        let opTemp = "";
        let units = "F"; 
        
        if (table1Str) {
            try {
                const data = JSON.parse(table1Str);
                // Prioritize Max Temp, then Operating Temp
                opTemp = data.max_operating_temp || data.operating_temp || ""; 
                
                if (data.measurement_unit && data.measurement_unit.toLowerCase() === "celsius") {
                    units = "C";
                }
            } catch(e) { console.error("Error parsing Step 1 data", e); }
        }

        // Set Initial Values & Lock
        if(inpOpTemp) {
            if(opTemp !== "") {
                inpOpTemp.value = opTemp;
                inpOpTemp.readOnly = true;
                inpOpTemp.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
        }
        
        if(selTempUnit) {
             selTempUnit.value = units;
             // Lock unit if data came from Table 4.1
             if (table1Str) {
                 selTempUnit.disabled = true;
                 selTempUnit.classList.add('bg-gray-100', 'cursor-not-allowed');
             }
        }

        // Load Table Data if not loaded
        if(!baseRatesData) {
            await fetchBaseRates();
        }

        calculateCrB();
    }

    async function fetchRequiredData() {
        if(requiredData) return;
        try {
            const res = await fetch("/static/formula_app/data/json/table_2d_3_1.json");
            requiredData = await res.json();
            populateRequiredTable(requiredData);
        } catch(e) { console.error("Error loading Table 2.D.3.1", e); }
    }

    function populateRequiredTable(data) {
        const table = document.getElementById("table_2d_3_1_content");
        if(!table || !data || !data.rows) return;
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>${data.columns[0]}</th>
                    <th>${data.columns[1]}</th>
                </tr>
            </thead>
            <tbody>
                ${data.rows.map(row => `
                    <tr>
                        <td class="font-medium">${row.data}</td>
                        <td>${row.comment}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }

    let baseRatesData = null;
    async function fetchBaseRates() {
        try {
            const res = await fetch("/static/formula_app/data/json/table_2d_3_2.json");
            baseRatesData = await res.json();
            console.log("ExtCorrFerritic Table 2.D.3.2 Loaded", baseRatesData);
        } catch (e) { console.error("Error loading Table 2.D.3.2", e); }
    }

    function calculateCrB() {
        if(!baseRatesData || !selDriver.value || !inpOpTemp.value) return;

        const driver = selDriver.value;
        const temp = parseFloat(inpOpTemp.value);
        const unit = selTempUnit.value; // F or C

        // Update Labels based on unit
        if(lblRateUnit) lblRateUnit.innerText = unit === "C" ? "mm/y" : "mpy";

        const dataset = unit === "C" ? baseRatesData.metric : baseRatesData.imperial;
        const data = dataset.data; 

        // Sort by temp
        data.sort((a, b) => a.temp - b.temp);

        let rate = 0;

        // Interpolation Logic
        if (temp <= data[0].temp) {
             // Lower bound clamping (or extrapolate?) 
             // Logic: If below min temp treated, usually 0 or min rate if non-zero. 
             // Table starts at -12C(10F) with 0 rates for most.
             // We clamp to first value.
            rate = data[0][driver]; // Likely 0
        } else if (temp >= data[data.length - 1].temp) {
             // Upper bound clamping
            rate = data[data.length - 1][driver];
        } else {
            // Find Interval
            let lower = data[0];
            let upper = data[1];
            for(let i=0; i < data.length - 1; i++) {
                if (temp >= data[i].temp && temp <= data[i+1].temp) {
                    lower = data[i];
                    upper = data[i+1];
                    break;
                }
            }
            
            // Use Utils Interpolate
            rate = interpolate(temp, lower.temp, lower[driver], upper.temp, upper[driver]);
        }
        
        // Display
        if(outCrB) {
            outCrB.innerText = rate.toFixed(2); 
            // Trigger Step 4
            showStep4();
        }
    }

    // --- Step 4: Final Corrosion Rate ---

    // Inputs Step 4
    const selInsType = document.getElementById("sel_ext_ferritic_ins_type");
    const outFinsFactor = document.getElementById("val_ext_ferritic_fins");
    const selComplexity = document.getElementById("sel_ext_ferritic_complexity");
    const selInsCondition = document.getElementById("sel_ext_ferritic_ins_condition");
    const selEqDesign = document.getElementById("sel_ext_ferritic_eq_design");
    const selInterface = document.getElementById("sel_ext_ferritic_interface");
    const outFinalCr = document.getElementById("val_ext_ferritic_final_cr");
    const lblFinalRateUnit = document.getElementById("lbl_ext_ferritic_final_rate_unit");

    // Load Step 4 Data
    let insTypeData = null;
    async function fetchInsTypeData() {
        if(insTypeData) return;
        try {
            const res = await fetch("/static/formula_app/data/json/table_2d_3_3.json");
            const json = await res.json();
            insTypeData = json.rows;
            populateInsTypeSelect();
        } catch(e) { console.error("Error loading Table 2.D.3.3", e); }
    }

    function populateInsTypeSelect() {
        if(!selInsType || !insTypeData) return;
        selInsType.innerHTML = '<option value="" disabled selected>Select Insulation...</option>';
        insTypeData.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.factor; // Store factor in value for easy access
            opt.innerText = item.type;
            selInsType.appendChild(opt);
        });
    }

    // Step 4 Listeners
    const step4Inputs = [selInsType, selComplexity, selInsCondition, selEqDesign, selInterface];
    step4Inputs.forEach(inp => {
        if(inp) inp.addEventListener('change', calculateFinalCr);
    });

    if(selInsType) {
        selInsType.addEventListener('change', () => {
             if(outFinsFactor && selInsType.value) {
                 outFinsFactor.innerText = `Factor: ${selInsType.value}`;
             }
        });
    }

    function showStep4() {
        const step4 = document.getElementById("ext_ferritic_step4_container");
        if(step4) {
            step4.classList.remove("hidden");
            fetchInsTypeData();
        }
    }

    function calculateFinalCr() {
        // Ensure CrB is calculated
        const crBText = outCrB ? outCrB.innerText : "--";
        if (crBText === "--" || !selInsType.value || !selComplexity.value || !selInsCondition.value || !selEqDesign.value || !selInterface.value) {
            return;
        }

        const crB = parseFloat(crBText);
        const fIns = parseFloat(selInsType.value);
        const fCm = parseFloat(selComplexity.value);
        const fIc = parseFloat(selInsCondition.value);
        const fEq = parseFloat(selEqDesign.value);
        const fIf = parseFloat(selInterface.value);

        const maxEqIf = Math.max(fEq, fIf);

        // Equation 2.D.14
        const finalCr = crB * fIns * fCm * fIc * maxEqIf;
        
        if(outFinalCr) {
            outFinalCr.innerText = finalCr.toFixed(4); // 4 decimals for final rate? User asked for 2 for CrB, maybe 4 is better for final. Keeping 4 for precision unless requested otherwise.
            // Actually, let's stick to 2 to be consistent with previous request if logic implies flow.
            // But usually final rate needs precision. I'll use 4 and if user complains I change it.
            // Wait, previous request was specific "redondea el decimal a 2 numeros nada más, para continuar con el paso 4".
            // It applied to CrB to *continue* to step 4.
            // I will use 4 here as standard engineering practice, easily changeable.
             outFinalCr.innerText = finalCr.toFixed(2);
        }
        
        // Sync Units
         if(lblFinalRateUnit && lblRateUnit) {
            lblFinalRateUnit.innerText = lblRateUnit.innerText;
        }

        // Trigger Step 5
        showStep5();
    }

    // Hook into Step 3 completion
    // We need to call showStep4 when Step 3 is done.
    // Modifying calculateCrB to trigger showStep4
    const originalCalculateCrB = calculateCrB;
    // ... wait, I am replacing the file content, I can just edit calculateCrB directly in the content below or rewrite it.
    // I will rewrite calculateCrB to include showStep4 call.
    
    // RE-INJECTING CALCULATECRB to add showStep4()
    /* 
       Note: The tool replaces a block. I need to be careful not to duplicate code or miss dependencies.
       The previous block ended at line 230. 
       I will just add the new functions and assume I need to manually call showStep4 from calculateCrB?
       
       Actually, I cant easily modify the middle of the file with this tool call unless I target it.
       The 'ReplacementContent' replaces the end of the file.
       Code inside 'calculateCrB' needs to call 'showStep4'.
       
       Strategy: 
       I will overwrite 'calculateCrB' in this same block if I can include it, 
       BUT 'calculateCrB' is above Step 4 logic in the file structure I usually prefer.
       However, JS functions are hoisted if defined as function declarations.
       
       Wait, I am appending to the end of the file (lines 229+).
       So 'calculateCrB' is already defined above.
       
       I will simply add a check at the end of calculateCrB in the previous tool or just add a listener?
       No, I can't easily hook into it without editing it.
       
       I will use a separate 'replace_file_content' call to update 'calculateCrB' to call 'showStep4'.
       For this call, I will just add the Step 4 functions.
    */

    // --- Step 5: Time in Service (age_tke) ---

    // Inputs
    const tglHasInsp = document.getElementById("tgl_ext_ferritic_has_inspection");
    const divInspInputs = document.getElementById("ext_ferritic_step5_inspection_inputs");
    const inpInspDate = document.getElementById("inp_ext_ferritic_inspection_date");
    const inpLe = document.getElementById("inp_ext_ferritic_le");
    const outAgeTke = document.getElementById("val_ext_ferritic_age_tke");
    const outTrde = document.getElementById("val_ext_ferritic_trde");

    // Listeners
    if (tglHasInsp) {
        tglHasInsp.addEventListener('change', () => {
             updateStep5Visibility();
             calculateStep5();
        });
    }

    const step5Inputs = [inpInspDate, inpLe];
    step5Inputs.forEach(el => {
        if(el) el.addEventListener('change', calculateStep5);
        if(el) el.addEventListener('input', calculateStep5);
    });

    function showStep5() {
        const step5 = document.getElementById("ext_ferritic_step5_container");
        if(step5) {
            step5.classList.remove("hidden");
            calculateStep5();
        }
    }

    function updateStep5Visibility() {
        if(tglHasInsp.checked) {
            divInspInputs.classList.remove("hidden");
        } else {
            divInspInputs.classList.add("hidden");
        }
    }

    function calculateStep5() {
        // Dependencies from Step 1
        const t = parseFloat(inpThickness.value) || 0;
        const totalAge = parseFloat(outAge.innerText); // Assuming valid number text

        if (isNaN(t)) return;

        let ageTke = 0;
        let trde = 0;

        if (totalAge < 0) return; // Future date error handling

        if (tglHasInsp.checked) {
            // Scenario B: Measured Loss Available
            const le = parseFloat(inpLe.value) || 0;
            
            if (inpInspDate.value) {
                const inspDate = new Date(inpInspDate.value);
                const today = new Date();
                const diffTime = today - inspDate;
                const calculatedAge = diffTime / (31557600000); // years
                ageTke = calculatedAge < 0 ? 0 : calculatedAge;
            } else {
                ageTke = 0; 
            }
            
            trde = t - le;

        } else {
            // Scenario A: No Measured Loss
            ageTke = isNaN(totalAge) ? 0 : totalAge;
            trde = t;
        }

        // Display
        if(outAgeTke) outAgeTke.innerText = ageTke.toFixed(2);
        if(outTrde) outTrde.innerText = trde.toFixed(2);

        // Trigger Step 6
        showStep6();
    }

    // --- Step 6: Coating Age (age_coat) ---
    
    // Inputs
    const selIsCoated = document.getElementById("sel_ext_ferritic_is_coated");
    const divCoatingInputs = document.getElementById("ext_ferritic_step6_coating_inputs");
    const inpCoatingDate = document.getElementById("inp_ext_ferritic_coating_date");
    const outAgeCoat = document.getElementById("val_ext_ferritic_age_coat");
    const step6Container = document.getElementById("ext_ferritic_step6_container");

    // Listeners
    if (selIsCoated) {
        selIsCoated.addEventListener('change', () => {
             const isCoated = selIsCoated.value === 'Yes';
             
             if (isCoated) {
                 divCoatingInputs.classList.remove("hidden");
                 if(!inpCoatingDate.value) outAgeCoat.innerText = "0.00";
             } else {
                 divCoatingInputs.classList.add("hidden");
                 outAgeCoat.innerText = "0.00";
                 // Trigger Step 7 immediately logic
                 showStep7();
             }
        });
    }

    if(inpCoatingDate) {
        inpCoatingDate.addEventListener('change', calculateStep6);
    }

    function showStep6() {
        if(step6Container) step6Container.classList.remove("hidden");
        // If already "No", ensure next step
        if(selIsCoated && selIsCoated.value === "No") {
             showStep7();
        }
    }

    function calculateStep6() {
        if (!selIsCoated) return;
        
        if (selIsCoated.value === 'No') {
            if(outAgeCoat) outAgeCoat.innerText = "0.00";
            showStep7();
            return;
        }

        const dateVal = inpCoatingDate.value;
        if (!dateVal) return; // Wait for input

        const installDate = new Date(dateVal);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - installDate);
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        
        if(outAgeCoat) outAgeCoat.innerText = diffYears.toFixed(2);
        showStep7();
    }


    // --- Step 7: Determine Expected Coating Age (Cage) ---

    // Inputs
    const selQuality = document.getElementById("sel_ext_ferritic_coating_quality");
    const divCustomCage = document.getElementById("div_ext_ferritic_cage_custom");
    const inpCustomCage = document.getElementById("inp_ext_ferritic_cage_custom");
    const outFinalCage = document.getElementById("val_ext_ferritic_cage_final");
    const step7Container = document.getElementById("ext_ferritic_step7_container");

    // Listeners
    if(selQuality) {
        selQuality.addEventListener('change', () => {
            if(selQuality.value === 'custom') {
                divCustomCage.classList.remove('hidden');
            } else {
                divCustomCage.classList.add('hidden');
                calculateStep7();
            }
        });
    }

    if(inpCustomCage) {
        inpCustomCage.addEventListener('input', calculateStep7);
    }

    function showStep7() {
        if(step7Container) step7Container.classList.remove("hidden");
        
        // Auto-select "0" if no coating is selected in Step 6
        if(tglHasCoating && !tglHasCoating.checked) {
            if(selQuality) {
                selQuality.value = "0";
                selQuality.disabled = true; // Lock it because logic dictates 0 for no coating
                divCustomCage.classList.add('hidden');
            }
            calculateStep7();
        } else {
            // Unlock if previously locked
            if(selQuality) selQuality.disabled = false;
        }
    }

    function calculateStep7() {
        let cage = 0;

        if (selQuality.value === 'custom') {
            cage = parseFloat(inpCustomCage.value) || 0;
        } else {
            cage = parseFloat(selQuality.value) || 0;
        }

        if(outFinalCage) outFinalCage.innerText = cage;
        
        // Trigger Step 8
        showStep8();
    }

    // --- Step 8: Determine Coating Adjustment (Coat_adj) ---

    // Inputs
    const step8Container = document.getElementById("ext_ferritic_step8_container");
    const divStep8Condition = document.getElementById("ext_ferritic_step8_condition_input");
    const selCoatingFailed = document.getElementById("sel_ext_ferritic_coating_failed");
    const outCoatAdj = document.getElementById("val_ext_ferritic_coat_adj");

    // Listeners
    if(selCoatingFailed) {
        selCoatingFailed.addEventListener('change', calculateStep8);
    }

    function showStep8() {
        if(step8Container) step8Container.classList.remove("hidden");
        calculateStep8();
    }

    function calculateStep8() {
        // Dependencies
        const ageTke = parseFloat(outAgeTke.innerText); // Step 5
        const ageCoat = parseFloat(outAgeCoat.innerText) || 0; // Step 6
        const cage = parseFloat(outFinalCage.innerText) || 0; // Step 7
        
        if (isNaN(ageTke)) return;

        let coatAdj = 0;

        // Logic Check: age_tke vs age_coat
        // Note: age_tke = Time since inspection (or start). age_coat = Time since coating install.
        
        if (ageTke >= ageCoat) {
            // Case 1: Inspection (or start) happened BEFORE coating (or same time).
            // Equation 2.D.17
            divStep8Condition.classList.add("hidden");
            coatAdj = Math.min(cage, ageCoat);
            
        } else {
            // Case 2: Inspection happened AFTER coating.
            // age_tke < age_coat
            
            // We need to know if coating failed at time of inspection
            divStep8Condition.classList.remove("hidden");
            
            const coatingFailed = selCoatingFailed.value;
            
            if (!coatingFailed) {
                outCoatAdj.innerText = "--"; // Waiting for user input
                return;
            }

            if (coatingFailed === "Yes") {
                // Condition 1: Coating failed at inspection
                coatAdj = 0;
            } else {
                // Condition 2: Coating NOT failed at inspection
                // Equation 2.D.18
                // Coat_adj = min(Cage, age_coat) - min(Cage, age_coat - age_tke)
                const term1 = Math.min(cage, ageCoat);
                const term2 = Math.min(cage, ageCoat - ageTke);
                coatAdj = term1 - term2;
            }
        }

        if(outCoatAdj) outCoatAdj.innerText = coatAdj.toFixed(2);
        
        // Trigger Step 9
        showStep9();
    }

    // --- Step 9: Determine In-Service Time (age) ---

    // Inputs
    const step9Container = document.getElementById("ext_ferritic_step9_container");
    const outFinalAge = document.getElementById("val_ext_ferritic_final_age");

    function showStep9() {
        if(step9Container) step9Container.classList.remove("hidden");
        calculateStep9();
    }

    function calculateStep9() {
        const ageTke = parseFloat(outAgeTke.innerText); // Step 5
        const coatAdj = parseFloat(outCoatAdj.innerText); // Step 8

        if (isNaN(ageTke) || isNaN(coatAdj)) return;

        // Equation 2.D.19
        // age = age_tke - Coat_adj
        let age = ageTke - coatAdj;

        // Sanity Check
        if (age < 0) age = 0;

        if(outFinalAge) outFinalAge.innerText = age.toFixed(2);

        // Trigger Step 10
        showStep10();
    }

    // --- Step 10: Determine S, E, and t_min ---

    // Inputs
    const step10Container = document.getElementById("ext_ferritic_step10_container");
    const inpS = document.getElementById("inp_ext_ferritic_allowable_stress");
    const inpE = document.getElementById("inp_ext_ferritic_weld_efficiency");
    const inpTmin = document.getElementById("inp_ext_ferritic_tmin");
    const btnConfirmStep10 = document.getElementById("btn_ext_ferritic_confirm_step10");

    // Listeners
    if(btnConfirmStep10) {
        btnConfirmStep10.addEventListener('click', () => {
            // Validate inputs
            const s = parseFloat(inpS.value);
            const e = parseFloat(inpE.value);
            const tmin = parseFloat(inpTmin.value);

            if(isNaN(s) || isNaN(e) || isNaN(tmin)) {
                alert("Please enter valid numeric values for S, E, and t_min."); 
                return;
            }

            console.log("Step 10 Confirmed:", { s, e, tmin });
            showStep11(); 
        });
    }

    function showStep10() {
        if(step10Container) step10Container.classList.remove("hidden");
        
        // 1. Allowable Stress (S) from Step 4
        // Always try to populate if empty
        const storedS = sessionStorage.getItem("step4_allowable_stress");
        if (storedS && storedS !== "NaN" && (!inpS.value || inpS.value === "")) {
            inpS.value = storedS;
        }

        // 2. Weld Efficiency (E) from Table 4.1 Data (Step 1)
        // We prioritize Step 1 data if it exists.
        const t41Data = sessionStorage.getItem('table4.1_data');
        let step1E = null;

        if (t41Data) {
            try {
                const data = JSON.parse(t41Data);
                // Check specifically for weld_joint_efficiency
                if (data && data.weld_joint_efficiency !== undefined && data.weld_joint_efficiency !== null) {
                    step1E = data.weld_joint_efficiency;
                }
            } catch (err) {
                console.error("Error parsing table4.1_data for Step 10:", err);
            }
        }
        
        // Populate E
        // If we found a value in Step 1, and the input is currently empty OR holds the default "1.0" (user hasn't changed it to something else unique)
        // actually strict empty check is safer to avoid overwriting user edits.
        if (step1E !== null && (!inpE.value || inpE.value === "")) {
            inpE.value = step1E;
        } else if ((!inpE.value || inpE.value === "") && (!step1E)) {
            // Apply default only if no step 1 data and field is empty
            inpE.value = "1.0";
        }

        // 3. t_min
        const storedTmin = sessionStorage.getItem("tmin_calc");
        if (storedTmin && storedTmin !== "NaN" && (!inpTmin.value || inpTmin.value === "")) {
            inpTmin.value = storedTmin;
        }
    }

    function showStep11() {
        const step11 = document.getElementById("ext_ferritic_step11_container");
        if(step11) {
            step11.classList.remove("hidden");
            step11.scrollIntoView({ behavior: 'smooth', block: 'start' });
            calculateStep11();
        }
    }

    // --- Step 11: Determine Art ---
    const outArt = document.getElementById("val_ext_ferritic_art");
    const btnStep11Next = document.getElementById("btn_ext_ferritic_step11_next");

    function calculateStep11() {
        // Inputs
        const outFinalCr = document.getElementById("val_ext_ferritic_final_cr");
        const outAgeTke = document.getElementById("val_ext_ferritic_age_tke");
        const outTrde = document.getElementById("val_ext_ferritic_trde");

        if (!outFinalCr || !outAgeTke || !outTrde) return;

        const cr = parseFloat(outFinalCr.innerText);
        const ageTke = parseFloat(outAgeTke.innerText);
        const trde = parseFloat(outTrde.innerText);

        if (isNaN(cr) || isNaN(ageTke) || isNaN(trde) || trde === 0) {
            if(outArt) outArt.innerText = "--";
            return;
        }

        // Equation 2.D.20: Art = (Cr * age_tke) / trde
        // Art matches API 581 eq. 2.9 roughly.
        let art = (cr * ageTke) / trde;
        
        // Sanity check Art >= 0
        if(art < 0) art = 0;

        if(outArt) outArt.innerText = art.toFixed(4);
    }
    
    // Step 11 Next Button
    if (btnStep11Next) {
        btnStep11Next.addEventListener('click', () => {
             showStep12();
        });
    }

    // --- Step 12: Calculate Flow Stress (FS_CUIF) ---
    const inpYS = document.getElementById("inp_ext_ferritic_ys");
    const inpTS = document.getElementById("inp_ext_ferritic_ts");
    const outFsCuif = document.getElementById("val_ext_ferritic_fs_cuif");
    const btnStep12Next = document.getElementById("btn_ext_ferritic_step12_next");

    function showStep12() {
        const step12 = document.getElementById("ext_ferritic_step12_container");
        if(step12) {
            step12.classList.remove("hidden");
            step12.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Try to pre-fill YS/TS from Table 4.1 if available
            const t41Str = sessionStorage.getItem("table4.1_data");
            if(t41Str) {
                try {
                    const d = JSON.parse(t41Str);
                    if(d.yield_strength && (!inpYS.value || inpYS.value === "")) {
                        inpYS.value = d.yield_strength;
                        inpYS.readOnly = true;
                        inpYS.classList.add('bg-gray-100', 'cursor-not-allowed');
                    }
                    if(d.tensile_strength && (!inpTS.value || inpTS.value === "")) {
                        inpTS.value = d.tensile_strength;
                        inpTS.readOnly = true;
                        inpTS.classList.add('bg-gray-100', 'cursor-not-allowed');
                    }
                } catch(e) {}
            }
            
            calculateStep12();
        }
    }

    if(inpYS) inpYS.addEventListener('input', calculateStep12);
    if(inpTS) inpTS.addEventListener('input', calculateStep12);

    function calculateStep12() {
        if(!outFsCuif || !inpYS || !inpTS) return;

        const ys = parseFloat(inpYS.value);
        const ts = parseFloat(inpTS.value);
        
        // Need Efficiency E from Step 10
        const inpE = document.getElementById("inp_ext_ferritic_weld_efficiency");
        let E = 1.0;
        if(inpE && inpE.value) E = parseFloat(inpE.value);
        
        if(isNaN(ys) || isNaN(ts) || isNaN(E)) {
            outFsCuif.innerText = "--";
            return;
        }

        // Equation 2.D.21
        // FS_CUIF = ((YS + TS) / 2) * E * 1.1
        let fs = ((ys + ts) / 2) * E * 1.1;
        
        // Ensure FS > 0 to avoid division by zero later
        if(fs <= 0) fs = 0.0001; 

        outFsCuif.innerText = fs.toFixed(2);
    }
    
    if(btnStep12Next) {
        btnStep12Next.addEventListener('click', () => {
             showStep13();
        });
    }

    // --- Step 13: Strength Ratio (SRp) ---
    function showStep13() {
        const step13 = document.getElementById("ext_ferritic_step13_container");
        if(step13) {
            step13.classList.remove("hidden");
            step13.scrollIntoView({ behavior: 'smooth', block: 'start' });
            calculateStep13();
        }
    }

    function calculateStep13() {
        const outSrp = document.getElementById("val_ext_ferritic_srp");
        const outFsCuif = document.getElementById("val_ext_ferritic_fs_cuif");
        const inpS = document.getElementById("inp_ext_ferritic_allowable_stress");
        const inpE = document.getElementById("inp_ext_ferritic_weld_efficiency");
        const inpTmin = document.getElementById("inp_ext_ferritic_tmin");
        const outTrde = document.getElementById("val_ext_ferritic_trde");

        if(!outSrp || !outFsCuif || !inpS || !inpE || !inpTmin || !outTrde) return;

        const fs = parseFloat(outFsCuif.innerText);
        const s = parseFloat(inpS.value);
        const e = parseFloat(inpE.value);
        const tmin = parseFloat(inpTmin.value);
        const trde = parseFloat(outTrde.innerText);

        if(isNaN(fs) || isNaN(s) || isNaN(e) || isNaN(tmin) || isNaN(trde) || trde === 0 || fs === 0) {
            outSrp.innerText = "--";
            return;
        }

        // Equation 2.D.22
        // SRp = (S * E / FS) * (tmin / trde)
        // Note: Using tmin as proxy for max(tmin, tc) per instructions if tc not explicitly Step 10 input.
        // Assuming tmin holds the relevant code calc thickness.
        
        const term1 = (s * e) / fs;
        const term2 = tmin / trde;
        
        let srp = term1 * term2;
        
        // Sanity
        if(srp < 0) srp = 0;

        outSrp.innerText = srp.toFixed(4);
    }
    
    const btnStep13Next = document.getElementById("btn_ext_ferritic_step13_next");
    if(btnStep13Next) {
        btnStep13Next.addEventListener('click', () => {
            showStep14();
        });
    }

    // --- Steps 14, 15, 16: Inspection Updating ---
    const inpCountA = document.getElementById("inp_ext_ferritic_count_A");
    const inpCountB = document.getElementById("inp_ext_ferritic_count_B");
    const inpCountC = document.getElementById("inp_ext_ferritic_count_C");
    const inpCountD = document.getElementById("inp_ext_ferritic_count_D");
    const selConfidence = document.getElementById("sel_ext_ferritic_confidence");
    
    const btnStep14Next = document.getElementById("btn_ext_ferritic_step14_next");
    const btnStep16Next = document.getElementById("btn_ext_ferritic_step16_next");

    let table45Data = null;
    let table46Data = null;

    function showStep14() {
        const step14 = document.getElementById("ext_ferritic_step14_container");
        if(step14) {
            step14.classList.remove("hidden");
            step14.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Fetch Data if not present
            if (!table45Data || !table46Data) {
                Promise.all([
                    fetch('/static/formula_app/data/json/table_4_5.json').then(r => r.json()),
                    fetch('/static/formula_app/data/json/table_4_6.json').then(r => r.json())
                ])
                .then(([t45, t46]) => {
                    table45Data = t45;
                    table46Data = t46;
                    console.log("Tables 4.5 & 4.6 Loaded", table45Data, table46Data);
                    calculateSteps14_16();
                })
                .catch(err => console.error("Error loading Inspection Data:", err));
            } else {
                calculateSteps14_16();
            }
        }
    }

    function calculateSteps14_16() {
        if (!table45Data || !table46Data) return;

        // Step 1: Read Inputs
        const nA = parseInt(inpCountA ? inpCountA.value : 0) || 0;
        const nB = parseInt(inpCountB ? inpCountB.value : 0) || 0;
        const nC = parseInt(inpCountC ? inpCountC.value : 0) || 0;
        const nD = parseInt(inpCountD ? inpCountD.value : 0) || 0;
        
        const confidence = selConfidence ? selConfidence.value : "Low";

        // Step 2: Get Prior Probabilities (Table 4.5)
        const priors = table45Data[confidence]; 
        if (!priors) {
            console.error("Invalid Confidence Level:", confidence);
            return; 
        }

        // Step 3: Get Conditional Probabilities (Table 4.6)
        const condA = table46Data["A"];
        const condB = table46Data["B"];
        const condC = table46Data["C"];
        const condD = table46Data["D"];

        if (!condA || !condB || !condC || !condD) {
             console.error("Missing Conditional Data");
             return;
        }

        // Step 4: Calculate Effectiveness Factors (I1, I2, I3) - Equation 2.D.24
        // I_i = Pr_pi * (Co_piA)^NA * (Co_piB)^NB ...
        
        // I1 (High Confidence Path / p1)
        const I1 = priors.p1 * 
                   Math.pow(condA.p1, nA) * 
                   Math.pow(condB.p1, nB) * 
                   Math.pow(condC.p1, nC) * 
                   Math.pow(condD.p1, nD);

        // I2 (Medium Confidence Path / p2)
        const I2 = priors.p2 * 
                   Math.pow(condA.p2, nA) * 
                   Math.pow(condB.p2, nB) * 
                   Math.pow(condC.p2, nC) * 
                   Math.pow(condD.p2, nD);

        // I3 (Low Confidence Path / p3)
        const I3 = priors.p3 * 
                   Math.pow(condA.p3, nA) * 
                   Math.pow(condB.p3, nB) * 
                   Math.pow(condC.p3, nC) * 
                   Math.pow(condD.p3, nD);

        // Display I Factors
        updateText("val_ext_ferritic_I1", I1.toExponential(4));
        updateText("val_ext_ferritic_I2", I2.toExponential(4));
        updateText("val_ext_ferritic_I3", I3.toExponential(4));

        // Step 5: Calculate Posterior Probabilities (Po1, Po2, Po3) - Equation 2.D.25
        const sumI = I1 + I2 + I3;
        
        let po1 = 0, po2 = 0, po3 = 0;
        if (sumI > 0) {
            po1 = I1 / sumI;
            po2 = I2 / sumI;
            po3 = I3 / sumI;
        }

        // Display Po Probabilities
        updateText("val_ext_ferritic_Po1", po1.toFixed(4));
        updateText("val_ext_ferritic_Po2", po2.toFixed(4));
        updateText("val_ext_ferritic_Po3", po3.toFixed(4));
        
        // Store for next steps
        sessionStorage.setItem("ext_ferritic_posterior_probs", JSON.stringify({po1, po2, po3}));

        // Show Container Results
        const container = document.getElementById("ext_ferritic_steps15_16_container");
        if(container) container.classList.remove("hidden");
    }

    function updateText(id, val) {
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    }

    // Listeners for Recalculation
    if(inpCountA) inpCountA.addEventListener('input', calculateSteps14_16);
    if(inpCountB) inpCountB.addEventListener('input', calculateSteps14_16);
    if(inpCountC) inpCountC.addEventListener('input', calculateSteps14_16);
    if(inpCountD) inpCountD.addEventListener('input', calculateSteps14_16);
    if(selConfidence) selConfidence.addEventListener('change', calculateSteps14_16);

    if(btnStep14Next) {
        btnStep14Next.addEventListener('click', () => {
             const container = document.getElementById("ext_ferritic_steps15_16_container");
             if(container) {
                 container.classList.remove("hidden");
                 container.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }
        });
    }

    if(btnStep16Next) {
        btnStep16Next.addEventListener('click', () => {
             // Validate if calculation done? Assuming yes if visible.
             showStep17();
        });
    }

    // --- Step 17: Calculate Beta Parameters ---
    const outBeta1 = document.getElementById("val_ext_ferritic_beta1");
    const outBeta2 = document.getElementById("val_ext_ferritic_beta2");
    const outBeta3 = document.getElementById("val_ext_ferritic_beta3");
    const btnStep17Next = document.getElementById("btn_ext_ferritic_step17_next");

    function showStep17() {
        const step17 = document.getElementById("ext_ferritic_step17_container");
        if(step17) {
            step17.classList.remove("hidden");
            step17.scrollIntoView({ behavior: 'smooth', block: 'start' });
            calculateStep17();
        }
    }

    function calculateStep17() {
        // Inputs Required: Art (Step 11), SRp (Step 13)
        const outArt = document.getElementById("val_ext_ferritic_art");
        const outSrp = document.getElementById("val_ext_ferritic_srp");
        
        if(!outArt || !outSrp) return;

        const Art = parseFloat(outArt.innerText);
        const SRp = parseFloat(outSrp.innerText);
        
        if(isNaN(Art) || isNaN(SRp)) {
             if(outBeta1) outBeta1.innerText = "--";
             return;
        }

        // Constants
        const COV_dt = 0.20;
        const COV_Sf = 0.20;
        const COV_p = 0.05;

        // Equation 2.D.12 Function
        // Beta = (1 - Ds*Art - SRp) / sqrt(...)
        const calculateBetaVal = (Ds) => {
             const numerator = 1 - (Ds * Art) - SRp;
             
             // Term 1: (Ds^2 * Art^2 * COV_dt^2)
             const term1 = Math.pow(Ds, 2) * Math.pow(Art, 2) * Math.pow(COV_dt, 2);
             
             // Term 2: (1 - Ds*Art)^2 * COV_Sf^2
             const term2 = Math.pow((1 - (Ds * Art)), 2) * Math.pow(COV_Sf, 2);
             
             // Term 3: SRp^2 * COV_p^2
             const term3 = Math.pow(SRp, 2) * Math.pow(COV_p, 2);
             
             const denominator = Math.sqrt(term1 + term2 + term3);
             
             if (denominator === 0) return 0; // Avoid div by zero
             return numerator / denominator;
        };

        const beta1 = calculateBetaVal(1); // Ds1 = 1
        const beta2 = calculateBetaVal(2); // Ds2 = 2
        const beta3 = calculateBetaVal(4); // Ds3 = 4

        updateText("val_ext_ferritic_beta1", beta1.toFixed(4));
        updateText("val_ext_ferritic_beta2", beta2.toFixed(4));
        updateText("val_ext_ferritic_beta3", beta3.toFixed(4));
    }

    if(btnStep17Next) {
        btnStep17Next.addEventListener('click', () => {
             showStep18();
        });
    }

    // --- Step 18: Final Damage Factor ---
    const outFinalDf = document.getElementById("val_ext_ferritic_final_df");

    function showStep18() {
        const step18 = document.getElementById("ext_ferritic_step18_container");
        if(step18) {
            step18.classList.remove("hidden");
            step18.scrollIntoView({ behavior: 'smooth', block: 'start' });
            calculateStep18();
        }
    }

    // Helper: Standard Normal CDF (Phi)
    function stdNormCDF(x) {
        if (x === 0) return 0.5;
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        if (x > 0) prob = 1 - prob;
        return prob;
    }

    function calculateStep18() {
        // Inputs: Po (Step 16), Beta (Step 17)
        const po1Text = document.getElementById("val_ext_ferritic_Po1")?.innerText;
        const po2Text = document.getElementById("val_ext_ferritic_Po2")?.innerText;
        const po3Text = document.getElementById("val_ext_ferritic_Po3")?.innerText;
        
        const beta1Text = document.getElementById("val_ext_ferritic_beta1")?.innerText;
        const beta2Text = document.getElementById("val_ext_ferritic_beta2")?.innerText;
        const beta3Text = document.getElementById("val_ext_ferritic_beta3")?.innerText;

        if(!outFinalDf) return;

        // Parse
        const Po1 = parseFloat(po1Text);
        const Po2 = parseFloat(po2Text);
        const Po3 = parseFloat(po3Text);
        
        const B1 = parseFloat(beta1Text);
        const B2 = parseFloat(beta2Text);
        const B3 = parseFloat(beta3Text);

        if(isNaN(Po1) || isNaN(B1)) {
            outFinalDf.innerText = "--";
            return;
        }

        // Equation 2.D.13
        // Df = [ Po1*Phi(-B1) + Po2*Phi(-B2) + Po3*Phi(-B3) ] / 1.56E-04
        
        const term1 = Po1 * stdNormCDF(-B1);
        const term2 = Po2 * stdNormCDF(-B2);
        const term3 = Po3 * stdNormCDF(-B3);
        
        const numerator = term1 + term2 + term3;
        const denominator = 1.56e-4; // 1.56E-04
        
        const Df = numerator / denominator;
        
        // Display Result
        outFinalDf.innerText = Df.toFixed(2);
        
        // Store in Session Storage (Requested)
        sessionStorage.setItem("external_corrosion_damage_factor", Df);
        sessionStorage.setItem("ext_ferritic_df", Df); // Backwards compatibility just in case
        console.log("External Corrosion DF Stored:", Df);
    }

});
