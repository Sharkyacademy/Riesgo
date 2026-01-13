
import { calculateGoverningDf } from '../logic.js';

export function initGoverning() {
    setupListeners();
    calculateAndShow(); // Initial check
}

function setupListeners() {
    const triggerIds = [
        'btn_calc_final_df',         // Carbon
        'btn_temper_calc_final_df',  // Temper
        'btn_brit885_step3_confirm', // 885
        'btn_sigma_step2_confirm'    // Sigma
    ];

    triggerIds.forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.addEventListener('click', () => {
                setTimeout(calculateAndShow, 500); // Wait for other calcs
            });
        }
    });

    const checkboxes = document.querySelectorAll('.brittle-mech-check');
    checkboxes.forEach(chk => {
        chk.addEventListener('change', () => setTimeout(calculateAndShow, 100));
    });
}

function calculateAndShow() {
    const isBrit = document.getElementById('check_brit_carbon')?.checked;
    const isTempe = document.getElementById('check_brit_tempe')?.checked;
    const is885 = document.getElementById('check_brit_885')?.checked;
    const isSigma = document.getElementById('check_brit_sigma')?.checked;

    // Retrieve DFs from Session Storage
    let dfBrit = 0;
    if (isBrit) {
        const d = JSON.parse(sessionStorage.getItem('brittle_fracture_result') || '{}');
        if (d.final_df) dfBrit = parseFloat(d.final_df);
        else dfBrit = parseFloat(sessionStorage.getItem('brittle_final_df')) || 0;
    }

    let dfTempe = 0;
    if (isTempe) {
        const d = JSON.parse(sessionStorage.getItem('temper_embrittlement_data') || '{}');
        if (d.finalDF) dfTempe = parseFloat(d.finalDF);
    }

    let df885 = 0;
    if (is885) {
        const d = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
        if (d.df) df885 = parseFloat(d.df);
    }

    let dfSigma = 0;
    if (isSigma) {
        const d = JSON.parse(sessionStorage.getItem('sigma_phase_data') || '{}');
        if (d.df) dfSigma = parseFloat(d.df);
    }

    const govDf = calculateGoverningDf(dfBrit, dfTempe, df885, dfSigma);
    
    // Display
    const govContainer = document.getElementById('brittle_governing_df_container');
    const govVal = document.getElementById('brittle_governing_df_val');
    
    if (govVal) govVal.textContent = govDf.toFixed(2);

    if (govContainer) {
        if (!isBrit && !isTempe && !is885 && !isSigma) {
            govContainer.classList.add('hidden');
        } else {
            govContainer.classList.remove('hidden');
        }
    }

    // Debug
    const dGen = document.getElementById('gov_debug_general');
    if(dGen) dGen.textContent = (isBrit || isTempe) ? `${dfBrit} + ${dfTempe}` : "Inactive";
}
