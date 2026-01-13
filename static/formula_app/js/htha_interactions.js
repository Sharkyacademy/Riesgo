import { validateInputs } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const btnCalc = document.getElementById('btn_calc_htha');
    const resultContainer = document.getElementById('htha_results');
    const dfResult = document.getElementById('htha_df_result');
    
    const inputDamageObserved = document.getElementById('htha_damage_observed');
    const step2Section = document.getElementById('htha_step2_section');
    const inputReplacedInKind = document.getElementById('htha_replaced_in_kind');
    const step2_1Section = document.getElementById('htha_step2_1_section');
    const upgradedMaterialWarning = document.getElementById('htha_upgraded_material_warning');
    const step1Section = document.getElementById('htha_step1_section');

    const inputMaterialVerification = document.getElementById('htha_material_verification');
    const step3_1Section = document.getElementById('htha_step3_1_section');

    const step3_2Section = document.getElementById('htha_step3_2_section');
    // const inputSusceptibility - Removed (Automatic)
    const resultDisplay = document.getElementById('htha_susceptibility_result_display');
    const resultCard = document.getElementById('htha_susceptibility_card');
    const resultTitle = document.getElementById('htha_susceptibility_title');
    
    // Inputs (Updated references to new IDs in table)
    const inputMaterial = document.getElementById('htha_material');
    const inputTemp = document.getElementById('htha_temperature');
    const inputTempUnit = document.getElementById('htha_temp_unit');
    const inputPressure = document.getElementById('htha_pressure');
    const inputTime = document.getElementById('htha_time_service');

    // UI Buttons
    const btnSaveHide = document.getElementById('btn_htha_save_hide');

    // Auto-load data from Table 4.1
    loadHTHAData();

    if(btnCalc) {
        btnCalc.addEventListener('click', calculateHTHA);
    }
    
    // Toggle Logic (Save)
    if(btnSaveHide) btnSaveHide.addEventListener('click', () => {
        saveHTHAData();
    });

    function loadHTHAData() {
        // 1. Try to load saved HTHA specific data first
        const savedHTHA = sessionStorage.getItem('htha_data');
        if(savedHTHA) {
             try {
                const hthaData = JSON.parse(savedHTHA);
                if(inputMaterial) inputMaterial.value = hthaData.material || "";
                
                // Temp: Load Value only
                if(inputTemp) inputTemp.value = hthaData.temperature || ""; 
                if(inputPressure) inputPressure.value = hthaData.pressure || "";
                
                // Note: Step 2 & 3 are NOT restored (Manual Flow)

                if(step1Section) step1Section.classList.remove('hidden');

                // Re-run checks
                checkStep1Completion();
                checkStep2Completion();
                checkStep3_1Completion();  

             } catch(e) {
                 console.error("Error loading saved HTHA data:", e);
             }
        } else {
            if(inputDamageObserved) inputDamageObserved.value = "";
            if(inputMaterialVerification) inputMaterialVerification.value = "";
        }

        // 2. Sync Unit from Table 4.1 (Basic Data) - Global Setting
        const tableDataRaw = sessionStorage.getItem('table4.1_data');
        if(inputTempUnit && tableDataRaw) {
             try {
                const globalData = JSON.parse(tableDataRaw);
                // "farenheit" (from component_basic_data.html) or "celsius"
                const unit = globalData.measurement_unit; 
                if(unit === "farenheit") {
                    inputTempUnit.value = "F";
                } else {
                    inputTempUnit.value = "C"; // Default or celsius
                }
             } catch(e) { console.warn("Error parsing Table 4.1 for unit", e); }
        }

        updateStep1Summary();
        checkStep1Completion();
    }

    // Update Summary in Step 1
    function updateStep1Summary() {
        const valMat = document.getElementById('val_htha_material');
        const valTemp = document.getElementById('val_htha_temp');
        const valPress = document.getElementById('val_htha_pressure');

        const unit = inputTempUnit ? inputTempUnit.value : "C";

        if(valMat) valMat.innerText = inputMaterial.value || "--";
        if(valTemp) valTemp.innerText = (inputTemp.value || "--") + " °" + unit;
        if(valPress) valPress.innerText = inputPressure.value || "--";
    }
    
    // Save Logic
    function saveHTHAData() {
        const data = {
            material: inputMaterial ? inputMaterial.value : "",
            temperature: inputTemp ? inputTemp.value : "",
            tempUnit: inputTempUnit ? inputTempUnit.value : "C",
            pressure: inputPressure ? inputPressure.value : "",
            damageObserved: inputDamageObserved ? inputDamageObserved.value : "",
            replacedInKind: inputReplacedInKind ? inputReplacedInKind.value : "",
            materialVerification: inputMaterialVerification ? inputMaterialVerification.value : "",
        };
        sessionStorage.setItem('htha_data', JSON.stringify(data));
        updateStep1Summary();
        checkStep1Completion(); // This checks if Step 2 should show
        checkStep2Completion(); // This checks if Step 3 should show
        checkStep3_1Completion(); // Checks if Step 3.2 should show and CALCS
        
        // Reveal Step 1 Summary on Save
        if(step1Section) step1Section.classList.remove('hidden');
    }

    function calculateSusceptibilityAndShow() {
        if(!inputTemp) return;
        const tempVal = parseFloat(inputTemp.value);
        if(isNaN(tempVal)) return;

        // Curve Limit Logic (Placeholder - NEED REAL DATA)
        // Assumption: Curve Limit is around 400°F (204°C) for testing, or derived from Pressure/Material
        // For now, let's use a dummy function
        const curveLimitTempF = 400; // Placeholder 400°F
        const curveLimitTempC = 204.4; // approx

        // Convert Input to F for logic?
        // App seems to use C or F? Label says "Temperature, °F (°C)". 
        // Assuming input is in C based on other modules? 
        // Let's assume input matches the units. 
        // If unclear, I'll use logic relative to values. 
        // Let's assume input is °C for now based on 'C-0.5Mo' typical usage in non-US, 
        // BUT image says 50°F / 100°F. 
        // 50°F = 27.8°C delta. 100°F = 55.6°C delta.
        const delta50F_in_C = 27.8;
        const delta100F_in_C = 55.6;

        const T_obs = tempVal; // Assume C
        const T_curve = curveLimitTempC; // Placeholder

        let susceptibility = "";
        
        // Logic from Figure 2.E.2.1
        // High: Extending from initial curve and upwards (T_obs >= T_curve)
        // Medium: 50F below curve up to curve (T_curve - 50 < T_obs < T_curve)
        // Low: 100F below curve up to previous (T_curve - 100 < T_obs <= T_curve - 50)
        // No: 100F below curve and farther below (T_obs <= T_curve - 100)

        if (T_obs >= T_curve) {
            susceptibility = "High Susceptibility";
        } else if (T_obs > (T_curve - delta50F_in_C)) {
            susceptibility = "Medium Susceptibility";
        } else if (T_obs > (T_curve - delta100F_in_C)) {
            susceptibility = "Low Susceptibility";
        } else {
            susceptibility = "No Susceptibility";
        }

        updateSusceptibilityCard(susceptibility);
    }

    // DF Lookup Table (Derived from htha_df_data.json)
    const HTHA_DF_DATA = {
        "Damage Observed": 5000,
        "High Susceptibility": 5000,
        "Medium Susceptibility": 2000,
        "Low Susceptibility": 100,
        "No Susceptibility": 0
    };

    function updateSusceptibilityCard(val) {
        if(!resultDisplay || !resultCard || !resultTitle) return;
        
        let finalSusceptibility = val;
    let finalDF = 0;

    // Override removed: Susceptibility is now determined by Step 2.1 or Step 3 logic upstream.

        if(!finalSusceptibility) {
            resultDisplay.classList.add('hidden');
            // Hide Results if incomplete
            if(document.getElementById('htha_results')) document.getElementById('htha_results').classList.add('hidden');
            return;
        }

        resultDisplay.classList.remove('hidden');
        
        // If it was overridden by Damage Observed, show that title, else show the calculated one
        resultTitle.innerText = finalSusceptibility; 
        
        // Reset classes
        resultCard.className = "alert shadow-sm border"; 
        
        // Apply colors based on value
        if(finalSusceptibility === "High Susceptibility" || finalSusceptibility === "Damage Observed") {
            resultCard.classList.add("alert-error"); // Redish
        } else if (finalSusceptibility === "Medium Susceptibility") {
            resultCard.classList.add("alert-warning"); // Orangish/Yellow
        } else if (finalSusceptibility === "Low Susceptibility") {
            resultCard.classList.add("bg-yellow-100", "border-yellow-300", "text-yellow-800"); // Custom yellow
        } else if (finalSusceptibility === "No Susceptibility") {
            resultCard.classList.add("alert-success"); // Green
        }
        
        // Calculate and Show DF
        finalDF = HTHA_DF_DATA[finalSusceptibility] !== undefined ? HTHA_DF_DATA[finalSusceptibility] : 0;
        
        const dfResult = document.getElementById('htha_df_result');
        const resultsSection = document.getElementById('htha_results');
        
        if(dfResult) dfResult.innerText = finalDF;
        if(resultsSection) resultsSection.classList.remove('hidden');
    }

    // Check if Step 1 is complete to show Step 2
    function checkStep1Completion() {
        if (inputMaterial && inputMaterial.value && 
            inputTemp && inputTemp.value && 
            inputPressure && inputPressure.value) {
            
            if(step2Section) step2Section.classList.remove('hidden');
        } else {
            if(step2Section) step2Section.classList.add('hidden');
            if(step3_1Section) step3_1Section.classList.add('hidden'); 
            if(step3_2Section) step3_2Section.classList.add('hidden');
        }
    }

    // Check logic for Step 2 to show Step 3.1
    // Check logic for Step 2 to show Step 3.1 or 2.1
    function checkStep2Completion() {
        if(!inputDamageObserved) return;
        
        const observed = inputDamageObserved.value;
        
        if(observed === "No") {
             if(step2_1Section) step2_1Section.classList.add('hidden'); // Hide 2.1
             if(inputReplacedInKind) inputReplacedInKind.value = ""; // Clear 2.1

             if(step3_1Section) step3_1Section.classList.remove('hidden');
             checkStep3_1Completion(); 
        } else if (observed === "Yes") {
             if(step2_1Section) step2_1Section.classList.remove('hidden'); // Show 2.1
             
             // Hide Step 3.1
             if(step3_1Section) step3_1Section.classList.add('hidden');
             if(step3_2Section) step3_2Section.classList.add('hidden');
             
             checkStep2_1Completion();

        } else {
             if(step2_1Section) step2_1Section.classList.add('hidden');
             if(step3_1Section) step3_1Section.classList.add('hidden');
             if(step3_2Section) step3_2Section.classList.add('hidden');
             updateSusceptibilityCard(""); // Hide result
        }
    }
    
    // Check logic for Step 2.1 to show Step 3.1
    function checkStep2_1Completion() {
        if(!inputReplacedInKind) return;
        const val = inputReplacedInKind.value;
        
        // Reset states
        if(upgradedMaterialWarning) upgradedMaterialWarning.classList.add('hidden');
        if(step3_1Section) step3_1Section.classList.add('hidden'); 
        if(step3_2Section) step3_2Section.classList.add('hidden');

        if(val === "No, replaced with upgraded materials") {
            // 1. Show warning
            if(upgradedMaterialWarning) upgradedMaterialWarning.classList.remove('hidden');
            // 2. Hide results
            updateSusceptibilityCard(""); 
        } 
        else if (val === "Yes, replaced in kind") {
            // 1. Susceptibility High
            updateSusceptibilityCard("High Susceptibility");
            // 2. Step 4 is effectively the result card
        } 
        else if (val === "No, not replaced") {
            // 1. Damage Observed
            updateSusceptibilityCard("Damage Observed");
        } 
        else {
             updateSusceptibilityCard(""); // Hide result
        }
    }
    
    // Check logic for Step 3.1 to show Step 3.2
    const step3_2Description = document.getElementById('htha_step3_2_description');

    // Check logic for Step 3.1 to show Step 3.2
    function checkStep3_1Completion() {
        if(!inputMaterialVerification) return;
        const val = inputMaterialVerification.value;

        if(val === "No") {
            // Logic for "No" (Other Materials) -> Curve Based
            if(step3_2Section) step3_2Section.classList.remove('hidden');
            if(step3_2Description) step3_2Description.classList.remove('hidden'); // Show curve description
            calculateSusceptibilityAndShow(); // Curve logic
        
        } else if (val === "Yes") {
            // Logic for "Yes" (Carbon/C-0.5Mo) -> Threshold Based
            // Thresholds: Temp > 350F (177C) AND PH2 > 50 psia (0.345 MPa)
            if(step3_2Section) step3_2Section.classList.remove('hidden');
            if(step3_2Description) step3_2Description.classList.add('hidden'); // Hide curve description
            
            calculateThresholdSusceptibility();

        } else {
            // Empty
            if(step3_2Section) step3_2Section.classList.add('hidden');
            if(resultDisplay) resultDisplay.classList.add('hidden');
            // Hide result container in Step 4
             if(document.getElementById('htha_results')) document.getElementById('htha_results').classList.add('hidden');
        }
    }

    function calculateThresholdSusceptibility() {
        if(!inputTemp || !inputPressure) return;
        
        let tempVal = parseFloat(inputTemp.value); 
        const pressVal = parseFloat(inputPressure.value); 
        const unit = inputTempUnit ? inputTempUnit.value : "C";

        if(isNaN(tempVal) || isNaN(pressVal)) return;

        // Convert to C if F
        if(unit === "F") {
            tempVal = (tempVal - 32) * 5 / 9;
        }

        // Thresholds (C)
        const T_Limit = 177; 
        const P_Limit = 0.345; 

        let susceptibility = "No Susceptibility";

        if (tempVal > T_Limit && pressVal > P_Limit) {
            susceptibility = "High Susceptibility";
        }

        updateSusceptibilityCard(susceptibility);
    }

    function calculateSusceptibilityAndShow() {
        if(!inputTemp) return;
        let tempVal = parseFloat(inputTemp.value);
        if(isNaN(tempVal)) return;
        
        const unit = inputTempUnit ? inputTempUnit.value : "C";

        // Curve Limit Logic (Placeholder - NEED REAL DATA)
        // Assumption: Curve Limit is around 204.4°C
        const curveLimitTempC = 204.4; 

        const delta50F_in_C = 27.8;
        const delta100F_in_C = 55.6;

        // Convert to C if F
        if(unit === "F") {
            tempVal = (tempVal - 32) * 5 / 9;
        }

        const T_obs = tempVal; 
        const T_curve = curveLimitTempC; 

        let susceptibility = "";
        
        // Logic from Figure 2.E.2.1
        if (T_obs >= T_curve) {
            susceptibility = "High Susceptibility";
        } else if (T_obs > (T_curve - delta50F_in_C)) {
            susceptibility = "Medium Susceptibility";
        } else if (T_obs > (T_curve - delta100F_in_C)) {
            susceptibility = "Low Susceptibility";
        } else {
            susceptibility = "No Susceptibility";
        }

        updateSusceptibilityCard(susceptibility);
    }

    // Live listeners removed as per user request. 
    // Updates now only happen on "Save Table" button click.

    // Step 2 Listener
    if(inputDamageObserved) {
        inputDamageObserved.addEventListener('change', () => {
             // Reset downstream step 3.1 if Step 2 changes
             if(inputMaterialVerification) inputMaterialVerification.value = "";
             if(inputReplacedInKind) inputReplacedInKind.value = ""; // Reset 2.1 choice
             
             saveHTHAData();
             checkStep2Completion();
        });
    }

    if(inputReplacedInKind) {
        inputReplacedInKind.addEventListener('change', () => {
             saveHTHAData();
             checkStep2_1Completion();
        });
    }

    // Step 3.1 Listener
    if(inputMaterialVerification) {
        inputMaterialVerification.addEventListener('change', () => {
             saveHTHAData();
             checkStep3_1Completion();
        });
    }
    
    // Step 3.2 Listener - Removed (Automatic)

    function calculateHTHA() {
        // Validation using utils
        const inputsToValidate = [inputMaterial, inputTemp, inputPressure];
        if (!validateInputs(inputsToValidate)) {
            // Optional: Alert if needed, but validateInputs provides visual feedback
            // alert("Please fill in all required fields.");
            return;
        }

        // TODO: Implement actual API 581 HTHA calculation logic here
        // For now, we will simulate a calculation for demonstration purposes
        
        console.log("Calculating HTHA...");
        console.log("Material:", inputMaterial.value);
        console.log("Temperature:", inputTemp.value);
        console.log("H2 Pressure:", inputPressure.value);

        // Dummy Result
        const dummyDf = (Math.random() * 10).toFixed(2); // Random fake val
        
        // Display Result
        if(dfResult) dfResult.innerText = dummyDf;
        if(resultContainer) resultContainer.classList.remove('hidden');
        
        // Scroll to results
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

});
