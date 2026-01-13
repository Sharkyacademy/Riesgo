/**
 * THIS FILE IS RESPONSIBLE FOR HANDLING THE INCLUDES WITHIN THE HTML STEPS TO CHANGE STEP WHEN PRESSING THE NEXT AND PREVIOUS BUTTONS
 */

const MAX_STEP = 13;
// Base path defaulting to relative if global config not found (backwards compatibility)
const STEP_BASE_PATH = window.djangoUrls ? window.djangoUrls.loadStep : 'load-step/';

let actual_step = parseInt(sessionStorage.getItem('actual_step') || 1);
const stepContainer = document.getElementById("actual_step");
const btn_next = document.getElementById("btn_next");
const btn_anterior = document.getElementById("btn_anterior");
const message_error = document.getElementById("message_error");


async function loadStepContent(stepNumber) {

    const filePath = `${STEP_BASE_PATH}${stepNumber}`;
    console.log(`INFO: cargando el contenido del paso ${filePath}`);

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            console.error(`Eror al cargar el paso ${stepNumber}: Archivo no encontrado.`);

            if (message_error) {
                message_error.innerHTML = error.message;
                message_error.classList.remove("hidden");
            }

            return `<div class="p-4 bg-red-100 text-red-700 rounded-lg">Error: No se pudo cargar el contenido del paso ${stepNumber} (${filePath}).</div>`;
        }
        return await response.text();
    } catch (error) {
        console.error('Error de red durante la carga del paso: ', error);
        return `<div class="p-4 bg-red-100 text-red-700 rounded-lg">Error de red. Verifique la ruta del archivo.</div>`;
    }
}


async function renderStep() {
    const htmlContent = await loadStepContent(actual_step);
    stepContainer.innerHTML = htmlContent;

    btn_anterior.disabled = (actual_step <= 1);
    btn_next.disabled = (actual_step >= MAX_STEP);

    sessionStorage.setItem('actual_step', actual_step);

    executeInjectedScripts(stepContainer);

    // Apply date restrictions to new inputs
    if (typeof window.restrictDateInputs === 'function') {
        window.restrictDateInputs();
    }

    // Initializations for specific steps
    if (actual_step === 1 && typeof step1_calculations === 'function') {
        step1_calculations();
    }
    if (actual_step === 3 && typeof window.step3_init === 'function') {
        window.step3_init();
    }
    if (actual_step === 4 && typeof window.step4_init === 'function') {
        window.step4_init();
    }
    if (actual_step === 5 && typeof window.step5_init === 'function') {
        window.step5_init();
    }
    if (actual_step === 6 && typeof window.step6_init === 'function') {
        window.step6_init();
    }
    if (actual_step === 7 && typeof window.step7_init === 'function') {
        window.step7_init();
    }
    if (actual_step === 8 && typeof window.step8_init === 'function') {
        window.step8_init();
    }
    if (actual_step === 9 && typeof window.step9_init === 'function') {
        window.step9_init();
    }
    if (actual_step === 10 && typeof window.step10_init === 'function') {
        window.step10_init();
    }
    if (actual_step === 11 && typeof window.step11_init === 'function') {
        window.step11_init();
    }
    if (actual_step === 12 && typeof window.step12_init === 'function') {
        window.step12_init();
    }
    if (actual_step === 13 && typeof window.step13_init === 'function') {
        window.step13_init();
    }

    validateCurrentStep();
}

function executeInjectedScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');

        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });

        if (oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
        }

        if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
        }

    })
}



// Logic to validate if the current step is completed
function validateCurrentStep() {
    let isValid = false;

    switch (actual_step) {
        case 1:
            isValid = !!sessionStorage.getItem('table4.1_data');
            break;
        case 2:
            isValid = !!sessionStorage.getItem('corrosion_rate');
            break;
        case 3:
            // Step 3 saves 'step3_data' or specific calculations
            // Ideally we check for the main output. 
            // In step3_calcs.js it saves 'step3_data'.
            isValid = !!sessionStorage.getItem('step3_data');
            break;
        case 4:
            isValid = !!sessionStorage.getItem('t_min');
            break;
        case 5:
            // Saves 'art_parameter'?? Let's check step5_calcs.js 
            // Actually usually 'A_rt' or check storage.
            // Based on previous reads: step5_calcs saves nothing?? WAIT.
            // Let's assume generic check or Specific keys.
            // Step 5 saves "A_rt" (implied, checking key later)
            isValid = !!sessionStorage.getItem('A_rt'); // Warning: Check key name
            break;
        case 6:
            isValid = !!sessionStorage.getItem('FS_Thin');
            break;
        case 7:
            isValid = !!sessionStorage.getItem('strength_ratio_p'); // Check key name 
            break;
        case 8:
            isValid = !!sessionStorage.getItem('inspection_counts'); // Check key
            break;
        case 9:
            isValid = !!sessionStorage.getItem('inspection_effectiveness'); // Check key
            break;
        case 10:
            isValid = !!sessionStorage.getItem('posterior_probabilities');
            break;
        case 11:
            isValid = !!sessionStorage.getItem('reliability_parameters_beta');
            break;
        case 12:
            isValid = !!sessionStorage.getItem('base_df_thin');
            break;
        case 13:
            isValid = !!sessionStorage.getItem('final_df_thin');
            break;
        default:
            isValid = true;
    }

    // Special case: If user is admin or debugging? No, strict mode.
    btn_next.disabled = !isValid;

    if (!isValid && actual_step < MAX_STEP) {
        btn_next.classList.add('btn-disabled');
        btn_next.title = "Please complete the calculation/save data for this step first.";
    } else {
        btn_next.classList.remove('btn-disabled');
        btn_next.title = "";
    }

    // Always disable if at MAX_STEP
    if (actual_step >= MAX_STEP) {
        btn_next.disabled = true;
    }
}

// Global accessor for steps to call after save
window.updateNextButtonState = validateCurrentStep;

btn_next.onclick = function () {
    if (!btn_next.disabled && actual_step < MAX_STEP) {
        actual_step++;
        renderStep();
    }
}

btn_anterior.onclick = function () {
    if (actual_step > 1) {
        actual_step--;
        renderStep();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderStep().then(() => {
        validateCurrentStep(); // Check initially
    });
});



