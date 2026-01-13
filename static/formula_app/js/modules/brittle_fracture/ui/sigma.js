
import { calculateSigmaDf } from '../logic.js';

let sigmaTableData = null;

export function initSigma() {
    // alert("[DEBUG] Init Sigma"); // Uncomment if needed, but console log should suffice if common works
    loadTableData();
    setupStep1();
    setupStep2();
    setupStep3();
}

function loadTableData() {
    fetch('/static/formula_app/js/modules/brittle_fracture/data/sigma_damage_factor.json')
        .then(r => r.json())
        .then(d => sigmaTableData = d)
        .catch(e => console.error(e));
}

function setupStep1() {
    const btn = document.getElementById('btn_sigma_confirm');
    if(!btn) {
        console.warn("[Sigma] btn_sigma_confirm not found in DOM");
        return;
    }
    
    // alert("[DEBUG] Sigma Button Found");

    btn.onclick = (e) => {
         // alert("[DEBUG] Sigma Clicked!");
         console.log("[Sigma] Confirm Clicked");
         e.preventDefault();
         const minOp = document.getElementById('sigma_min_op_temp');
         const admin = document.getElementById('sigma_admin_controls');
         const amount = document.getElementById('sigma_amount');

         console.log("[Sigma] Inputs:", { minOp, admin, amount });

         if(!minOp || !minOp.value) {
             alert("Please enter the Minimum Operating Temperature.");
             return;
         }
         
         // Save to session
         const data = {
             minOpTemp: minOp.value,
             adminControls: admin ? admin.value : 'No',
             amount: amount ? amount.value : '' // Save partial
         };
         sessionStorage.setItem('sigma_phase_data', JSON.stringify(data));

         document.getElementById('sigma_tmin_val').textContent = minOp.value;
         document.getElementById('sigma_step1_container').classList.remove('hidden');
         
         // Feedback
         const originalText = btn.innerHTML;
         btn.innerHTML = 'Saved!';
         setTimeout(() => btn.innerHTML = originalText, 1000);
    };
}

function setupStep2() {
    const btn = document.getElementById('btn_sigma_step1_confirm');
    if(!btn) return;
    
    btn.onclick = (e) => {
         e.preventDefault();
         // Just a confirmation button for Tmin, arguably redundant but kept for flow
         // Usually this button moves to Step 2, so it should show Step 2 container
         document.getElementById('sigma_step2_container').classList.remove('hidden');
    };
}

function setupStep3() {
    const btn = document.getElementById('btn_sigma_step2_confirm'); 
    if(!btn) return;
    
    btn.onclick = (e) => {
         e.preventDefault();
         const amtInput = document.getElementById('sigma_amount');
         
         if(!amtInput || !amtInput.value) {
             alert("Please select the estimated % Sigma.");
             return;
         }

         document.getElementById('sigma_amount_val').textContent = amtInput.value;
         
         if(!sigmaTableData) {
             console.error("Sigma Table Data not loaded.");
             return;
         }
         
         const tMin = parseFloat(document.getElementById('sigma_min_op_temp').value);
         const amt = amtInput.value;
         
         const df = calculateSigmaDf(tMin, amt, sigmaTableData);
         document.getElementById('sigma_df_val').textContent = df;
         document.getElementById('sigma_step3_container').classList.remove('hidden');
         
         // Save complete data
         const data = JSON.parse(sessionStorage.getItem('sigma_phase_data') || '{}');
         data.amount = amt;
         data.df = df;
         sessionStorage.setItem('sigma_phase_data', JSON.stringify(data));
    };
}
