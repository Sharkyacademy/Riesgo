
import { calculateBrit885Df } from '../logic.js';

let brit885TableData = null;

export function initBrit885() {
    loadTableData();
    setupStep1();
    setupStep2();
    setupStep3();
}

function loadTableData() {
    fetch('/static/formula_app/js/modules/brittle_fracture/data/brit885_damage_factor.json')
        .then(r => r.json())
        .then(d => brit885TableData = d)
        .catch(e => console.error(e));
}

function setupStep1() {
    const btn = document.getElementById('btn_brit885_confirm');
    if(!btn) return;
    
    btn.onclick = (e) => {
        e.preventDefault();
        const adminInput = document.getElementById('brit885_admin_controls');
        
        if(!adminInput || !adminInput.value) {
            alert("Please select Administrative Controls.");
            return;
        }

        const admin = adminInput.value;
        const resultContainer = document.getElementById('brit885_step1_result');
        const msg = document.getElementById('brit885_step1_msg');
        
        resultContainer.classList.remove('hidden');
        
        if(admin === 'Yes') {
            msg.innerHTML = "Protocol A: Use Min Operating Temp as Tmin.";
            document.getElementById('brit885_step3_container').classList.remove('hidden');
            document.getElementById('brit885_step2_container').classList.add('hidden');
            
            const minOp = document.getElementById('brit885_min_op_temp').value;
            updateStep3Display(parseFloat(minOp)); 
        } else {
            msg.innerHTML = "Protocol B: Proceed to Step 2.";
            document.getElementById('brit885_step2_container').classList.remove('hidden');
             document.getElementById('brit885_step3_container').classList.add('hidden');
        }
    };
}

function setupStep2() {
    const btn = document.getElementById('btn_brit885_step2_confirm');
    if(!btn) return;
    btn.onclick = () => {
         const d = parseFloat(document.getElementById('brit885_design_temp').value);
         const u = parseFloat(document.getElementById('brit885_upset_temp').value);
         const tMin = Math.min(d, u);
         document.getElementById('brit885_tmin_val').textContent = tMin.toFixed(2);
         document.getElementById('brit885_step2_result').classList.remove('hidden');
         document.getElementById('brit885_step3_container').classList.remove('hidden');
         updateStep3Display(tMin);
    };
}

function updateStep3Display(tMin) {
    const tRefInput = document.getElementById('brit885_tref');
    const tRefDisplay = document.getElementById('brit885_tref_display');
    const sourceMsg = document.getElementById('brit885_tref_source_msg');
    
    let tRef = 80;
    let source = "Default value (80°F)";
    
    if (tRefInput && tRefInput.value !== '') {
        tRef = parseFloat(tRefInput.value);
        source = "User defined value from Required Data";
    }

    if(tRefDisplay) tRefDisplay.textContent = tRef.toFixed(2);
    if(sourceMsg) sourceMsg.textContent = source;
}

function setupStep3() {
    const btn = document.getElementById('btn_brit885_step3_confirm');
    if(!btn) return;
    btn.onclick = () => {
         // Calculate Step 4 (Diff)
         // ...
         // Calculate Step 5 (DF)
         if(!brit885TableData) return;
         // Input diff...
         const tMin = parseFloat(document.getElementById('brit885_tmin_val').textContent) || 0; // rough check
         const tRef = parseFloat(document.getElementById('brit885_tref').value) || 80;
         const diff = tMin - tRef;
         
         document.getElementById('brit885_diff_val').textContent = diff.toFixed(2);
         document.getElementById('brit885_step4_result').classList.remove('hidden');
         
         const df = calculateBrit885Df(diff, brit885TableData);
         document.getElementById('brit885_df_val').textContent = df;
         document.getElementById('brit885_step5_container').classList.remove('hidden');
         
         // Save
         const data = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
         data.df = df;
         sessionStorage.setItem('brit885_data', JSON.stringify(data));
    };
}
