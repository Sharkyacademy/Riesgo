
import { calculateDeltaFattMethod2, calculateDeltaFattMethod3_JFactor, calculateDeltaFattMethod3_XBar, calculateDeltaFattMethod4, calculateMpt, calculateBaseDf, interpolate } from '../logic.js';

export function initTemper() {
    setupStep1();
    setupStep2();
    setupStep3();
    setupStep4();
    setupStep5();
    setupStep6();
}

function setupStep1() {
    const btnConfirm = document.getElementById('btn_temper_confirm');
    if(!btnConfirm) return;
    
    btnConfirm.onclick = (e) => {
        e.preventDefault();
        
        const minOpTemp = document.getElementById('temper_min_op_temp');
        const admin = document.getElementById('temper_admin_controls');
        
        if (!minOpTemp || !minOpTemp.value || !admin || !admin.value) {
            alert("Please fill in Min Operating Temp and Admin Controls.");
            return;
        }

        const inputs = {
             minOpTemp: minOpTemp.value,
             adminControls: admin.value,
             // Capture other inputs if needed for restore
        };
        sessionStorage.setItem('temper_embrittlement_data', JSON.stringify(inputs));
        
        // Show next steps
        document.getElementById('temper_step_1_container').classList.remove('hidden');
        
        const msg = document.getElementById('temper_step_1_msg');
        if(inputs.adminControls === 'Yes') {
            if(msg) msg.textContent = "Admin controls present. Proceed to Step 3.";
            document.getElementById('temper_step_3_container').classList.remove('hidden');
            document.getElementById('temper_step_2_container').classList.add('hidden');
            
            // Auto-fill Step 3 CET
            const step3Cet = document.getElementById('temper_step3_cet');
            if(step3Cet) step3Cet.value = inputs.minOpTemp;

        } else {
            if(msg) msg.textContent = "Admin controls absent. Proceed to Step 2.";
            document.getElementById('temper_step_2_container').classList.remove('hidden');
            document.getElementById('temper_step_3_container').classList.add('hidden');
        }
    };
}


function setupStep2() {
    const btn = document.getElementById('btn_temper_calc_step2');
    if(!btn) return;
    btn.onclick = () => {
        const tMdt = parseFloat(document.getElementById('temper_tmdt').value);
        const mptProcess = parseFloat(document.getElementById('temper_mpt_process').value);
        const mpt = Math.min(tMdt, mptProcess);
        
        document.getElementById('temper_mpt_val').textContent = mpt.toFixed(1);
        document.getElementById('temper_step_2_result').classList.remove('hidden');
        document.getElementById('temper_step_3_container').classList.remove('hidden');
        
        // Auto-fill Step 3 CET
        const step3Cet = document.getElementById('temper_step3_cet');
        if(step3Cet) step3Cet.value = mpt;
    };
}

function setupStep3() {
    const btn = document.getElementById('btn_temper_calc_step3');
    if(!btn) return;
    btn.onclick = async () => {
        const matType = document.getElementById('temper_mat_type').value;
        const ysInput = document.getElementById('temper_yield_strength');
        const curveSelect = document.getElementById('temper_curve_select');
        
        if(!ysInput.value || !curveSelect.value) {
            alert("Please enter Yield Strength and select an Exemption Curve.");
            return;
        }

        const ys = parseFloat(ysInput.value);
        const curve = curveSelect.value.split(' ')[1].toLowerCase(); // "Curve A" -> "a"
        
        // Temper module uses ksi default for YS input in HTML (id="temper_ys_unit" says ksi)
        // Table 2.E.3.3 is in ksi (assumed matching Carbon logic)
        
        const tableFile = 'table_2_e_3_3.json';

        try {
            const response = await fetch(`/static/formula_app/data/${tableFile}`);
            if (!response.ok) throw new Error("Failed to load reference data.");
            
            const tableData = await response.json();
            const dataSet = (matType === 'Carbon Steel') ? tableData.carbon_steels : tableData.low_alloy_steels;
            
            // Sort by min_yield_strength ascending just in case
            dataSet.sort((a, b) => a.min_yield_strength - b.min_yield_strength);

            let tRef = null;
            const curveKey = `curve_${curve}`; // e.g., curve_a

            if (ys <= dataSet[0].min_yield_strength) {
                tRef = dataSet[0][curveKey];
            } else if (ys >= dataSet[dataSet.length - 1].min_yield_strength) {
                tRef = dataSet[dataSet.length - 1][curveKey];
            } else {
                for (let i = 0; i < dataSet.length - 1; i++) {
                    const p1 = dataSet[i];
                    const p2 = dataSet[i+1];
                    if (ys >= p1.min_yield_strength && ys <= p2.min_yield_strength) {
                        tRef = interpolate(ys, p1.min_yield_strength, p1[curveKey], p2.min_yield_strength, p2[curveKey]);
                        break;
                    }
                }
            }

            if(tRef !== null) {
                document.getElementById('temper_step_3_result').classList.remove('hidden');
                document.getElementById('temper_tref_val').textContent = tRef.toFixed(1);
                
                // Unhide Step 4
                handleStep4Logic();
            } else {
                 alert("Could not determine T_ref for the given inputs.");
            }

        } catch(e) {
            console.error(e);
            alert("Error calculating Reference Temperature: " + e.message);
        }
    };
}

function handleStep4Logic() {
    document.getElementById('temper_step_4_container').classList.remove('hidden');
    
    // Method Selector Listener
    const methodSelect = document.getElementById('temper_step4_method_select');
    if(methodSelect) {
        methodSelect.onchange = (e) => toggleStep4Inputs(e.target.value);
    }
    
    // Method 3 Sub-selector Listener
    const radios = document.getElementsByName('temper_step4_comp_type');
    radios.forEach(r => {
        r.onchange = (e) => toggleMethod3SubInputs(e.target.value);
    });
}

function toggleStep4Inputs(method) {
    const groups = ['temper_step4_inputs_method1', 'temper_step4_inputs_method2', 'temper_step4_inputs_method3', 'temper_step4_inputs_method4'];
    groups.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById('temper_step4_inputs_' + method);
    if(target) target.classList.remove('hidden');

    // Auto-populate Year for Method 4
    if (method === 'method4') {
        const serviceLife = parseFloat(document.getElementById('temper_service_years').value) || 0;
        const currentYear = new Date().getFullYear();
        const yearInput = document.getElementById('temper_step4_input_year_confirm');
        if (yearInput && !yearInput.value) {
            yearInput.value = currentYear - serviceLife;
        }
    }
}

function toggleMethod3SubInputs(type) {
    const jGroup = document.getElementById('temper_group_j_factor');
    const xGroup = document.getElementById('temper_group_x_bar');
    
    if (type === 'j_factor') {
        if(jGroup) jGroup.classList.remove('hidden');
        if(xGroup) xGroup.classList.add('hidden');
    } else {
        if(jGroup) jGroup.classList.add('hidden');
        if(xGroup) xGroup.classList.remove('hidden');
    }
}

function setupStep4() {
    const btn = document.getElementById('btn_temper_calc_step4');
    if(!btn) return;
    btn.onclick = () => {
        const method = document.getElementById('temper_step4_method_select').value;
        let deltaFatt = 0;

        try {
            if (method === 'method1') {
                const val = parseFloat(document.getElementById('temper_step4_input_manual_fatt').value);
                if (isNaN(val)) throw new Error("Please enter a valid ΔFATT value.");
                deltaFatt = val;
            } else if (method === 'method2') {
                // Determine if we use user input from step 4 or basic data?
                // Step 4 has an input id="temper_step4_input_sce"
                const sceInput = document.getElementById('temper_step4_input_sce');
                const sce = sceInput && sceInput.value ? parseFloat(sceInput.value) : (parseFloat(document.getElementById('temper_sce_temp').value) || 0);
                
                const years = parseFloat(document.getElementById('temper_service_years').value) || 0;
                deltaFatt = calculateDeltaFattMethod2(sce, years);
            } else if (method === 'method3') {
                const type = document.querySelector('input[name="temper_step4_comp_type"]:checked').value;
                if(type === 'j_factor') {
                     const si = parseFloat(document.getElementById('temper_step4_chem_si').value || 0);
                     const mn = parseFloat(document.getElementById('temper_step4_chem_mn').value || 0);
                     const p = parseFloat(document.getElementById('temper_step4_chem_p').value || 0);
                     const sn = parseFloat(document.getElementById('temper_step4_chem_sn').value || 0);
                     deltaFatt = calculateDeltaFattMethod3_JFactor(si, mn, p, sn);
                } else {
                     const p = parseFloat(document.getElementById('temper_step4_xb_p').value || 0);
                     const sb = parseFloat(document.getElementById('temper_step4_xb_sb').value || 0);
                     const sn = parseFloat(document.getElementById('temper_step4_xb_sn').value || 0);
                     const as = parseFloat(document.getElementById('temper_step4_xb_as').value || 0);
                     deltaFatt = calculateDeltaFattMethod3_XBar(p, sb, sn, as);
                }
            } else if (method === 'method4') {
                 // Method 4: Service Temp & Fabrication Year
                 // Use the confirmed year input
                 const yearInput = document.getElementById('temper_step4_input_year_confirm');
                 let fabricationYear;
                 
                 if (yearInput && yearInput.value) {
                     fabricationYear = parseFloat(yearInput.value);
                 } else {
                     // Fallback if empty (though we try to auto-fill)
                     const serviceLife = parseFloat(document.getElementById('temper_service_years').value) || 0;
                     const currentYear = new Date().getFullYear();
                     fabricationYear = currentYear - serviceLife;
                 }
                 
                 if (isNaN(fabricationYear)) throw new Error("Please enter a valid Fabrication Year.");
                 
                 deltaFatt = calculateDeltaFattMethod4(fabricationYear);
            } else {
                alert("Please select a method.");
                return;
            }
        } catch (err) {
            alert(err.message);
            return;
        }

        const tRef = parseFloat(document.getElementById('temper_tref_val').textContent);
        if(isNaN(tRef)) {
            alert("T_ref is missing (Step 3).");
            return;
        }

        const mpt = calculateMpt(tRef, deltaFatt);

        // Update UI
        // HTML IDs: temper_res_delta_fatt, temper_res_step4_tref, temper_res_mpt
        document.getElementById('temper_res_delta_fatt').textContent = deltaFatt.toFixed(1);
        document.getElementById('temper_res_step4_tref').textContent = tRef.toFixed(1);
        document.getElementById('temper_res_mpt').textContent = mpt.toFixed(1);

        document.getElementById('temper_step4_result_area').classList.remove('hidden');
        document.getElementById('temper_step_5_container').classList.remove('hidden');
    };
}

function setupStep5() {
    const btn = document.getElementById('btn_temper_calc_base_df');
    if(!btn) return;
    btn.onclick = async () => {
         const thickness = parseFloat(document.getElementById('temper_thickness').value);
         const mpt = parseFloat(document.getElementById('temper_res_mpt').textContent);
         const minOpTemp = parseFloat(JSON.parse(sessionStorage.getItem('temper_embrittlement_data')).minOpTemp);
         const deltaT = minOpTemp - mpt;
         
         const isPwht = document.getElementById('temper_pwht_select').value === 'Yes';
         // Load table
         const tableFile = isPwht ? 'table_2_e_3_5.json' : 'table_2_e_3_4.json'; 
         // Metric logic needed? Yes.
         
         const res = await fetch(`/static/formula_app/data/${tableFile}`);
         const tableData = await res.json();
         
         const baseDf = calculateBaseDf(deltaT, thickness, tableData);
         document.getElementById('temper_base_df_val').textContent = baseDf.toFixed(2);
         document.getElementById('temper_step5_result_area').classList.remove('hidden');
         document.getElementById('temper_step_6_container').classList.remove('hidden');
    };
}

function setupStep6() {
    const btn = document.getElementById('btn_temper_calc_final_df');
    if(!btn) return;
    btn.onclick = () => {
        const baseDf = parseFloat(document.getElementById('temper_base_df_val').textContent);
        const fse = parseFloat(document.getElementById('temper_fse_select').value);
        const finalDf = baseDf * fse;
        document.getElementById('temper_final_df_val').textContent = finalDf.toFixed(2);
        document.getElementById('temper_step6_result_area').classList.remove('hidden');
        
        let data = JSON.parse(sessionStorage.getItem('temper_embrittlement_data') || '{}');
        data.finalDF = finalDf.toFixed(2);
        sessionStorage.setItem('temper_embrittlement_data', JSON.stringify(data));
    };
}
