// HTHA Calculation Logic (API 581 Part 2, Section 6)

document.addEventListener('DOMContentLoaded', function () {
    // Inputs
    const activeCheck = document.getElementById('id_mechanism_htha_active');
    const inputMaterial = document.getElementById('id_htha_material');
    const inputTemp = document.getElementById('id_operating_temp_f'); // Uses shared field from Data section
    const inputPressure = document.getElementById('id_htha_h2_partial_pressure_psia');
    const inputTime = document.getElementById('id_htha_exposure_time_years');
    const checkDamageObserved = document.getElementById('id_htha_damage_observed');
    const checkMaterialVerified = document.getElementById('id_htha_material_verification');

    // Outputs
    const dispSusceptibility = document.getElementById('disp_htha_susceptibility');
    const dispDf = document.getElementById('disp_htha_df');
    const inputDf = document.getElementById('id_htha_damage_factor');
    const contentDiv = document.getElementById('htha_content');

    // Toggle Content
    if (activeCheck) {
        activeCheck.addEventListener('change', function () {
            if (activeCheck.checked) {
                contentDiv.classList.remove('hidden');
                calculateHTHA();
            } else {
                contentDiv.classList.add('hidden');
                resetHTHA();
            }
        });
        // Initial State
        if (activeCheck.checked) {
            contentDiv.classList.remove('hidden');
            updateTempDisplay();
        }
    }

    // Update temperature display
    function updateTempDisplay() {
        const dispTemp = document.getElementById('disp_htha_operating_temp');
        if (dispTemp && inputTemp) {
            const val = inputTemp.value || '--';
            dispTemp.innerText = val + (val !== '--' ? ' °F' : '');
        }
    }

    // Listen to operating temp changes
    if (inputTemp) {
        inputTemp.addEventListener('change', updateTempDisplay);
        inputTemp.addEventListener('input', updateTempDisplay);
    }

    // Listeners
    const inputs = [inputMaterial, inputTemp, inputPressure, inputTime, checkDamageObserved, checkMaterialVerified];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('change', calculateHTHA);
            input.addEventListener('input', calculateHTHA);
        }
    });

    function resetHTHA() {
        if (dispSusceptibility) dispSusceptibility.innerText = "--";
        if (dispDf) dispDf.innerText = "--";
        if (inputDf) inputDf.value = 0;

        // Trigger Chart Update
        if (typeof updatePofSummary === 'function') {
            updatePofSummary();
        }
    }

    function calculateHTHA() {
        if (!activeCheck || !activeCheck.checked) return;

        const material = inputMaterial ? inputMaterial.value : '';
        const tempF = parseFloat(inputTemp?.value) || 0;
        const pressure = parseFloat(inputPressure?.value) || 0;
        const timeYears = parseFloat(inputTime?.value) || 0;
        const damageObserved = checkDamageObserved?.checked || false;
        const materialVerified = checkMaterialVerified?.checked || false;

        // 1. Determine Susceptibility
        let susceptibility = "None"; // None, Low, Medium, High

        // Use Carbon Steel Curve if material is not verified? 
        // For simplicity, we use the selected material, but flag validation if needed.
        let selectedMaterial = material;
        if (!materialVerified && material !== 'Carbon Steel') {
            // Conservative: Check against Carbon Steel if not verified? 
            // API 581 says verify metallurgy. 
            // For this UI, we calc based on selection.
        }

        // Damage Observed Override
        if (damageObserved) {
            susceptibility = "High";
        } else {
            // Nelson Curve Logic
            susceptibility = determineSusceptibility(selectedMaterial, tempF, pressure);
        }

        // 2. Calculate Damage Factor (DF)
        let df = calculateHTHADamageFactor(susceptibility, timeYears);

        // Display Results
        if (dispSusceptibility) {
            dispSusceptibility.innerText = susceptibility;
            // Color coding
            dispSusceptibility.className = "font-mono font-bold " + getSusceptibilityColor(susceptibility);
        }

        if (dispDf) dispDf.innerText = df.toFixed(1);
        if (inputDf) inputDf.value = df;

        // Trigger Chart Update
        if (typeof updatePofSummary === 'function') {
            updatePofSummary();
        }
    }

    // --- Helper: Get Nelson Curve Limit Temperature (F) for a given Pressure ---
    function getNelsonCurveLimit(material, pressure) {
        // Simplified Nelson Curves (Polyline Approximations)
        // Returns the Temperature (F) limit for the given H2 partial pressure (psia)
        // If pressure is below curve range, usually safe -> returns high temp (e.g. 2000)
        // If pressure is above curve range, returns safe limit.

        // Absolute Lower Limits (API 941)
        // CS: ~400F below 50 psia.

        // Simplification for key materials:

        // Carbon Steel
        if (material === 'Carbon Steel') {
            // Roughly: constant 500F below 50 psia? No, standard curve starts higher.
            // API 941 Figure 1: 
            // ~ 500 - 600 F range until 100 psia.
            // Drops to 400F at high pressure.
            // Linear approx for demo:
            if (pressure < 50) return 9999; // Safe
            if (pressure > 2500) return 400;
            // Approx descent
            return 600 - (0.05 * pressure); // Very rough, needs precise data points
        }

        // C-0.5Mo (Same as CS in recent API editions due to failure history)
        if (material === 'C-0.5Mo' || material === 'C-0.5Mo Normalized') {
            return getNelsonCurveLimit('Carbon Steel', pressure);
        }

        // 1Cr-0.5Mo
        if (material === '1Cr-0.5Mo') {
            // Higher resistance
            if (pressure < 50) return 9999;
            return 850 - (0.02 * pressure); // Demo
        }

        // 1.25Cr-0.5Mo
        if (material === '1.25Cr-0.5Mo') {
            if (pressure < 50) return 9999;
            return 950 - (0.02 * pressure); // Demo
        }

        // 2.25Cr-1Mo
        if (material === '2.25Cr-1Mo') {
            return 1100; // Very resistant
        }

        // 3Cr and above
        if (material === '3Cr-1Mo' || material === '5Cr-0.5Mo' || material === '7Cr-0.5Mo') {
            return 9999; // Effectively immune in typical refining conditions
        }

        return 500; // Default/Conservative
    }

    function determineSusceptibility(material, tempF, pressure) {
        if (!material) return "None";
        if (tempF < 350 || pressure < 50) return "None"; // API 581 Screening

        const tLimit = getNelsonCurveLimit(material, pressure);

        // Time constant relative to curve
        const deltaF = tempF - tLimit; // Positive means above curve (Bad)

        if (deltaF >= 0) {
            return "High";
        } else if (deltaF >= -50) {
            // Between curve and 50F below
            return "Medium";
        } else if (deltaF >= -100) {
            // Between 50F and 100F below
            return "Low";
        } else {
            // More than 100F below
            return "None";
        }
    }

    function calculateHTHADamageFactor(susceptibility, timeYears) {
        // API 581 Table 6.3 (Simplified Logic)
        if (susceptibility === "None") return 0;

        // Basic DF Values based on time in service for each susceptibility
        // (Using approximate values commonly generated by API 581 calcs)

        if (susceptibility === "High") {
            // Increases rapidly with time
            if (timeYears < 1) return 10;
            if (timeYears < 5) return 500;
            return 5000; // Max out
        }

        if (susceptibility === "Medium") {
            if (timeYears < 5) return 0;
            if (timeYears < 10) return 50;
            if (timeYears < 20) return 500;
            return 1000;
        }

        if (susceptibility === "Low") {
            if (timeYears < 10) return 0;
            if (timeYears < 20) return 10;
            return 100;
        }

        return 0;
    }

    function getSusceptibilityColor(susceptibility) {
        if (susceptibility === "High") return "text-red-600";
        if (susceptibility === "Medium") return "text-orange-500";
        if (susceptibility === "Low") return "text-yellow-600";
        return "text-green-600";
    }

});
