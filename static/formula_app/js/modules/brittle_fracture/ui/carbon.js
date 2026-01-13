
import { interpolate, calculateDeltaFattMethod2, calculateDeltaFattMethod3_JFactor, calculateDeltaFattMethod3_XBar, calculateDeltaFattMethod4, calculateMpt, calculateBaseDf } from '../logic.js';

export function initCarbon() {
    setupStep1();
    setupStep2();
    setupStep3();
    // setupStep4(); // Handled dynamically in Step 3
    setupStep5();
    setupStep6();
}

function setupStep1() {
    const btnCarbonConfirm = document.getElementById('btn_brittle_carbon_confirm');
    if (btnCarbonConfirm) {
        console.log("[Carbon] Confirmed button found. Attaching listener...");

        btnCarbonConfirm.onclick = (e) => {
             e.preventDefault(); 
             console.log("[Carbon] Button clicked.");
             
             try {
                 const admin = document.getElementById('brittle_admin_controls');
                 const temp = document.getElementById('brittle_min_temp');
                 const life = document.getElementById('brittle_service_life');
                 const factor = document.getElementById('brittle_inspection_factor');
                 
                 // Basic Existence Check
                 if (!admin || !temp || !life || !factor) {
                     console.error("Missing input elements in DOM");
                     return;
                 }

                 // Value Validation
                 if (!admin.value || !temp.value || !life.value || !factor.value) {
                     alert("Please fill in all required fields.");
                     return;
                 }
                 
                 const data = {
                     adminControls: admin.value,
                     minTemp: temp.value,
                     serviceLife: life.value,
                     inspectionFactor: factor.value
                 };
                 
                 sessionStorage.setItem('brittle_carbon_data', JSON.stringify(data));
                 
                 // Visual Feedback
                 const originalText = btnCarbonConfirm.innerHTML;
                 btnCarbonConfirm.innerHTML = `Saved!`;
                 setTimeout(() => btnCarbonConfirm.innerHTML = originalText, 1000);
                 
                 handleBrittleFractureCalculation(data); 

             } catch (err) {
                 console.error("[Carbon] Error in click handler:", err);
                 alert("An unexpected error occurred: " + err.message);
             }
        };
    } else {
        console.error("[Carbon] Button btn_brittle_carbon_confirm NOT found.");
    }
}

function handleBrittleFractureCalculation(data) {
    console.log("[Carbon] Handling Calculation...", data);
    try {
        const step1Container = document.getElementById('brittle_step_1_container');
        const step1Msg = document.getElementById('brittle_step_1_msg');
        const step2Container = document.getElementById('brittle_step_2_container');
        const step3Container = document.getElementById('brittle_step_3_container');
        const cetValueInput = document.getElementById('brittle_cet_value');

        if(step1Container) step1Container.classList.remove('hidden');
        if(step2Container) step2Container.classList.add('hidden');
        if(step3Container) step3Container.classList.add('hidden');
        
        if (data.adminControls === 'Yes') {
            if(step1Msg) step1Msg.innerHTML = `
                Administrative controls <strong>prevent</strong> pressurization below a critical temperature.<br>
                <span class="text-green-600 font-bold">Protocol A:</span> Use Minimum Operating Temperature as CET.
            `;
            if(step3Container) step3Container.classList.remove('hidden');
            if(cetValueInput) {
                console.log("[Carbon] Setting CET to:", data.minTemp);
                // alert("[DEBUG] Setting CET to: " + data.minTemp);
                cetValueInput.value = data.minTemp;
            } else {
                console.error("[Carbon] brittle_cet_value input not found!");
            }
            
            // Auto Trigger Step 3 Logic if possible? 
            // For now, let user interact.

        } else {
            if(step1Msg) step1Msg.innerHTML = `
                Administrative controls <strong>do not prevent</strong> pressurization below a critical temperature.<br>
                <span class="text-orange-600 font-bold">Protocol B:</span> Proceed to Step 2 to determine CET.
            `;
            if(step2Container) step2Container.classList.remove('hidden');
        }
    } catch (e) {
        console.error("[Carbon] Error in handleBrittleFractureCalculation:", e);
    }
}

function setupStep2() {
    const btnStep2Confirm = document.getElementById('btn_brittle_step2_confirm');
    if (btnStep2Confirm) {
        btnStep2Confirm.addEventListener('click', () => {
             const cetInput = document.getElementById('brittle_step2_cet_input');
             if (!cetInput || !cetInput.value) {
                 alert("Please enter the determined CET value.");
                 return;
             }
             const step3Container = document.getElementById('brittle_step_3_container');
             const cetValueInput = document.getElementById('brittle_cet_value');

             console.log("[Carbon] Step 2 Confirm. CET:", cetInput.value);
             step3Container.classList.remove('hidden');
             if(cetValueInput) {
                 cetValueInput.value = cetInput.value;
             }

             
             cetInput.disabled = true;
             btnStep2Confirm.textContent = "Confirmed";
        });
    }
}

function setupStep3() {
    const btnCalcTref = document.getElementById('btn_calc_tref');
    if(btnCalcTref) {
        btnCalcTref.addEventListener('click', async () => {
             // Logic to fetch table and calc TRef
             // Reusing the logic from interactions.js but cleaned up
             await calculateTRef();
        });
    }
}

async function calculateTRef() {
    const matType = document.getElementById('brittle_material_type').value;
    const ysInput = document.getElementById('brittle_yield_strength');
    const curveSelect = document.getElementById('brittle_curve_select');
    
    if(!ysInput.value || !curveSelect.value) {
        alert("Please enter Yield Strength and select an Exemption Curve.");
        return;
    }

    const ys = parseFloat(ysInput.value);
    const curve = curveSelect.value.replace('Curve ', '').toLowerCase();
    
    const isMetric = document.getElementById('brittle_ys_unit').innerText === "MPa";
    const tableFile = isMetric ? 'table_2_e_3_3m.json' : 'table_2_e_3_3.json';

    try {
        const response = await fetch(`/static/formula_app/data/${tableFile}`);
        const tableData = await response.json();
        const dataSet = (matType === 'Carbon Steel') ? tableData.carbon_steels : tableData.low_alloy_steels;
        
        dataSet.sort((a, b) => a.min_yield_strength - b.min_yield_strength);

        // Find TRef
        // Simplified search logic vs manual loop
        // We can reuse the interpolate logic if we want, or simple bound check
        let tRef = null;
        // ... (Re-implement search or import helper?)
        // I'll stick to the logic from interactions.js inline here as it involves specific data structure traversal
        
        if (ys <= dataSet[0].min_yield_strength) {
            tRef = dataSet[0][`curve_${curve}`];
        } else if (ys >= dataSet[dataSet.length - 1].min_yield_strength) {
            tRef = dataSet[dataSet.length - 1][`curve_${curve}`];
        } else {
            for (let i = 0; i < dataSet.length - 1; i++) {
                const p1 = dataSet[i];
                const p2 = dataSet[i+1];
                if (ys >= p1.min_yield_strength && ys <= p2.min_yield_strength) {
                    tRef = interpolate(ys, p1.min_yield_strength, p1[`curve_${curve}`], p2.min_yield_strength, p2[`curve_${curve}`]);
                    break;
                }
            }
        }

        if(tRef !== null) {
            document.getElementById('brittle_tref_result_area').classList.remove('hidden');
            document.getElementById('brittle_tref_val').textContent = tRef.toFixed(1);
            
            // Trigger Step 4
            handleStep4Logic(tRef, isMetric);
        }
    } catch(e) {
        console.error(e);
        alert("Error determining Tref.");
    }
}

function handleStep4Logic(tRef, isMetric) {
    const step4Container = document.getElementById('brittle_step_4_container');
    step4Container.classList.remove('hidden');
    
    // Retrieve CET from DOM (populated by Step 1 or Step 2)
    const cetInput = document.getElementById('brittle_cet_value');
    const cet = parseFloat(cetInput ? cetInput.value : NaN);
    
    // Display values
    document.getElementById('step4_cet_val').textContent = isNaN(cet) ? '--' : cet.toFixed(1);
    document.getElementById('step4_tref_val').textContent = tRef.toFixed(1);
    document.getElementById('step4_unit_val').textContent = isMetric ? "°C" : "°F";
    
    // Setup Calculate Button
    const btnCalc = document.getElementById('btn_calc_step4');
    btnCalc.onclick = () => calculateStep4(cet, tRef);
}

function calculateStep4(cet, tRef) {
    if(isNaN(cet) || isNaN(tRef)) {
        alert("Missing CET or Tref values.");
        return;
    }
    
    const result = cet - tRef;
    
    // Update UI
    document.getElementById('step4_result_val').textContent = result.toFixed(1);
    
    // Show Step 5
    document.getElementById('brittle_step_5_container').classList.remove('hidden');
    
    // Store intermediate for Step 5 usage if needed
    // Store result to session for Step 5 to pick up easily? 
    // Usually Step 5 reads from DOM or re-calcs, but let's assume it reads the result span or we store it.
    sessionStorage.setItem('brittle_step4_result', result);
}

function setupStep5() {
    const btnCalcBaseDf = document.getElementById('btn_calc_base_df');
    if(btnCalcBaseDf) {
        btnCalcBaseDf.addEventListener('click', async () => {
             const thickness = parseFloat(document.getElementById('brittle_thickness').value);
             const isPwht = document.getElementById('brittle_pwht_select').value === 'Yes';
             
             // For Carbon Steel Brittle Fracture, the parameter for the table is (CET - Tref)
             // This is calculated in Step 4.
             const step4Result = parseFloat(sessionStorage.getItem('brittle_step4_result'));
             
             if (isNaN(step4Result)) {
                 alert("Step 4 Result (CET - Tref) is missing. Please complete Step 4.");
                 return;
             }

             const deltaT = step4Result;
             
             // Determine Table
             // Is Metric?
             const unit = document.getElementById('brittle_temp_unit')?.value || 'F';
             const isMetric = unit === 'C';
             
             let tableFile = isPwht ? 'table_2_e_3_5' : 'table_2_e_3_4';
             if (isMetric) tableFile += 'm';
             tableFile += '.json';

             const res = await fetch(`/static/formula_app/data/${tableFile}`);
             const tableData = await res.json();
             
             const baseDf = calculateBaseDf(deltaT, thickness, tableData);
             
             document.getElementById('brittle_step5_result_area').classList.remove('hidden');
             document.getElementById('brittle_base_df_val').textContent = baseDf.toFixed(2);
             sessionStorage.setItem('brittle_base_df', baseDf.toFixed(2));
             
             document.getElementById('brittle_step_6_container').classList.remove('hidden');
        });
    }
}

function setupStep6() {
    const btn = document.getElementById('btn_calc_final_df');
    if(btn) {
        btn.onclick = () => {
             const baseDf = parseFloat(document.getElementById('brittle_base_df_val').textContent);
             const fse = parseFloat(document.getElementById('brittle_fse_select').value);
             const finalDf = baseDf * fse;
             document.getElementById('brittle_final_result_area').classList.remove('hidden');
             document.getElementById('brittle_final_df_val').textContent = finalDf.toFixed(2);
             sessionStorage.setItem('brittle_final_df', finalDf.toFixed(2));
             
             // Also store object
             sessionStorage.setItem('brittle_fracture_result', JSON.stringify({ final_df: finalDf }));
        };
    }
}
