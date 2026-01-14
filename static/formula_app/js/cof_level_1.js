import { RepresentativeFluids } from '../data/cof/table4_1_1.js';
import { FluidProperties } from '../data/cof/table4_1_2.js';

document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const selectFluid = document.getElementById('select_fluid');
    const fluidDetails = document.getElementById('fluid_details');
    const displayType = document.getElementById('fluid_type_display');
    const displayExamples = document.getElementById('fluid_examples_display');

    // Step 4.1.2 Elements
    const propertiesCard = document.getElementById('properties_card');
    const propMw = document.getElementById('prop_mw');
    const propDensity = document.getElementById('prop_density');
    const propNbp = document.getElementById('prop_nbp');
    const propAit = document.getElementById('prop_ait');
    const propAmbient = document.getElementById('prop_ambient');
    const propCpEq = document.getElementById('prop_cp_eq');
    const propCpA = document.getElementById('prop_cp_a');
    const propCpB = document.getElementById('prop_cp_b');
    const propCpC = document.getElementById('prop_cp_c');
    const propCpD = document.getElementById('prop_cp_d');
    const propCpE = document.getElementById('prop_cp_e');


    const selectPhase = document.getElementById('select_phase');
    const inputTemperature = document.getElementById('input_temperature');
    const cpResultContainer = document.getElementById('cp_result_container');
    const cpCalculatedValue = document.getElementById('cp_calculated_value');


    // Populate Select Dropdown
    if (selectFluid) {
        RepresentativeFluids.forEach(fluid => {
            const option = document.createElement('option');
            option.value = fluid.label; // Using label as ID for now
            option.textContent = fluid.label;
            selectFluid.appendChild(option);
        });

        // Unified Update Function
        function updateDisplay() {
            const selectedLabel = selectFluid.value;
            const phase = selectPhase ? selectPhase.value : null;
            const tempF = inputTemperature ? parseFloat(inputTemperature.value) : NaN;

            if (!selectedLabel || selectedLabel === "Select a fluid...") return;

            const selectedFluid = RepresentativeFluids.find(f => f.label === selectedLabel);
            const props = FluidProperties[selectedLabel];

            if (selectedFluid) {
                // Update Step 4.1.1 Display
                displayType.textContent = selectedFluid.type;
                displayExamples.textContent = selectedFluid.examples;
                fluidDetails.classList.remove('hidden');
            }

            if (props) {
                // Update Step 4.1.2 Display
                propMw.textContent = props.mw;
                propDensity.textContent = props.liquid_density;
                propNbp.textContent = props.nbp;
                propAit.textContent = props.ait !== null ? props.ait : 'N/A';

                propAmbient.textContent = props.ambient_state;
                // Color badge based on state
                propAmbient.className = `badge badge-lg font-bold ${props.ambient_state === 'Gas' ? 'badge-warning' : 'badge-info'}`;

                // Map Cp Eq to Latex
                let cpEqLatex = '-';
                if (props.cp_eq === 1) {
                    cpEqLatex = '\\(C_p = A + BT + CT^2 + DT^3\\)';
                } else if (props.cp_eq === 2) {
                    cpEqLatex = '\\(C_p = A + B \\left(\\frac{C/T}{\\sinh(C/T)}\\right)^2 + D \\left(\\frac{E/T}{\\cosh(E/T)}\\right)^2\\)';
                } else if (props.cp_eq === 3) {
                    cpEqLatex = '\\(C_p = A + BT + CT^2 + DT^3 + ET^4\\)';
                }

                propCpEq.innerHTML = cpEqLatex;

                // Trigger MathJax Reprocess
                if (window.MathJax) {
                    window.MathJax.typesetPromise([propCpEq]);
                }

                propCpA.textContent = props.a !== null ? props.a.toExponential(2) : '-';
                propCpB.textContent = props.b !== null ? props.b.toExponential(2) : '-';
                propCpC.textContent = props.c !== null ? props.c.toExponential(2) : '-';
                propCpD.textContent = props.d !== null ? props.d.toExponential(2) : '-';
                propCpE.textContent = props.e !== null ? props.e.toExponential(2) : '-';

                propertiesCard.classList.remove('hidden');

                // PHASE LOGIC VISUALIZATION
                // Reset opacities
                if (document.getElementById('card_mw')) document.getElementById('card_mw').style.opacity = '1';
                if (document.getElementById('card_density')) document.getElementById('card_density').style.opacity = '1';
                if (document.getElementById('card_cp')) document.getElementById('card_cp').style.opacity = '1';

                // Cp Calculation Logic
                if (phase === 'Vapor' && !isNaN(tempF)) {
                    // Convert F to Kelvin
                    const tempK = (tempF - 32) * 5 / 9 + 273.15;
                    let calculatedCp = null;

                    const A = props.a;
                    const B = props.b;
                    const C = props.c;
                    const D = props.d;
                    const E = props.e;

                    try {
                        if (props.cp_eq === 1) {
                            // Cp = A + BT + CT^2 + DT^3
                            calculatedCp = A + (B * tempK) + (C * Math.pow(tempK, 2)) + (D * Math.pow(tempK, 3));
                        } else if (props.cp_eq === 2 && tempK > 0) { // Avoid divide by zero
                            // Cp = A + B * ( (C/T) / sinh(C/T) )^2 + D * ( (E/T) / cosh(E/T) )^2
                            const term1 = (C / tempK) / Math.sinh(C / tempK);
                            const term2 = (E / tempK) / Math.cosh(E / tempK);
                            calculatedCp = A + (B * Math.pow(term1, 2)) + (D * Math.pow(term2, 2));
                        } else if (props.cp_eq === 3) {
                            // Cp = A + BT + CT^2 + DT^3 + ET^4
                            calculatedCp = A + (B * tempK) + (C * Math.pow(tempK, 2)) + (D * Math.pow(tempK, 3)) + (E * Math.pow(tempK, 4));
                        }
                    } catch (error) {
                        console.error("Calculation Error", error);
                    }

                    if (calculatedCp !== null) {
                        cpResultContainer.classList.remove('hidden');
                        cpCalculatedValue.textContent = calculatedCp.toFixed(2);

                        // --- STEP 4.1.4: Ratio k Calculation ---

                        // Default R = 8314 J/kmol-K (or 8.314 J/mol-K)
                        // Note 6 says: "For Note 1 [Eq 1], R = 8.314 J/mol-K [=8314 J/kmol-K]; for Notes 2 and 3 [Eq 2,3], R = 8314 Jkmol-K."
                        // Since calculatedCp is in J/kmol-K (consistent with coefficients), we use R = 8314.

                        let R_const = 8314;
                        if (props.cp_eq === 1) {
                            R_const = 8.314;
                        }

                        // k = Cp / (Cp - R)
                        const k_val = calculatedCp / (calculatedCp - R_const);

                        if (!isNaN(k_val) && isFinite(k_val)) {
                            // Display
                            const valRatioK = document.getElementById('val_ratio_k');
                            const cardRatioK = document.getElementById('ratio_k_card');

                            if (valRatioK && cardRatioK) {
                                valRatioK.textContent = k_val.toFixed(3);
                                cardRatioK.classList.remove('hidden');
                            }
                        }

                    } else {
                        cpResultContainer.classList.add('hidden');
                        if (document.getElementById('ratio_k_card')) document.getElementById('ratio_k_card').classList.add('hidden');
                    }

                    // Gas: NBP, MW, Cp, AIT. (Fade out Density)
                    if (document.getElementById('card_density')) document.getElementById('card_density').style.opacity = '0.3';

                } else if (phase === 'Liquid') {
                    // Liquid: NBP, Density, AIT. (Fade out MW, Cp)
                    if (document.getElementById('card_mw')) document.getElementById('card_mw').style.opacity = '0.3';
                    if (document.getElementById('card_cp')) document.getElementById('card_cp').style.opacity = '0.3';
                    cpResultContainer.classList.add('hidden');
                    if (document.getElementById('ratio_k_card')) document.getElementById('ratio_k_card').classList.add('hidden');
                } else {
                    // Reset or default if no phase/temp
                    cpResultContainer.classList.add('hidden');
                    if (document.getElementById('ratio_k_card')) document.getElementById('ratio_k_card').classList.add('hidden');
                }

                // --- STEP 4.1.7: Release Phase Calculation (Table 4.3) ---
                const releasePhaseCard = document.getElementById('release_phase_card');
                const dispStoredPhase = document.getElementById('disp_stored_phase');
                const dispAmbientPhase = document.getElementById('disp_ambient_phase');
                const dispFinalPhase = document.getElementById('disp_final_phase');
                const phaseMsgContainer = document.getElementById('phase_msg_container');
                const phaseMsg = document.getElementById('phase_determination_msg');

                if (selectedFluid && phase) {
                    const ambientState = props.ambient_state; // 'Gas' or 'Liquid'
                    const nbp = props.nbp;
                    let finalPhase = '-';
                    let message = '';
                    let showMsg = false;

                    // Logic from Table 4.3
                    if (phase === 'Vapor') {
                        if (ambientState === 'Gas') {
                            finalPhase = 'Gas';
                            message = 'Stored Gas & Ambient Gas -> Model as Gas';
                        } else if (ambientState === 'Liquid') {
                            finalPhase = 'Gas';
                            message = 'Stored Gas & Ambient Liquid -> Model as Gas';
                        }
                    } else if (phase === 'Liquid') {
                        if (ambientState === 'Gas') {
                            // Check NBP
                            if (nbp > 80) { // 80 F
                                finalPhase = 'Liquid';
                                message = `Stored Liquid & Ambient Gas, but NBP (${nbp}°F) > 80°F -> Model as Liquid`;
                                showMsg = true;
                            } else {
                                finalPhase = 'Gas';
                                message = `Stored Liquid & Ambient Gas (NBP ${nbp}°F <= 80°F) -> Model as Gas (Flash)`;
                                showMsg = true;
                            }
                        } else if (ambientState === 'Liquid') {
                            finalPhase = 'Liquid';
                            message = 'Stored Liquid & Ambient Liquid -> Model as Liquid';
                        }
                    }

                    if (finalPhase !== '-') {
                        releasePhaseCard.classList.remove('hidden');
                        dispStoredPhase.textContent = phase === 'Vapor' ? 'Gas' : 'Liquid';
                        dispAmbientPhase.textContent = ambientState;
                        dispFinalPhase.textContent = finalPhase;

                        // Style badge
                        dispFinalPhase.className = `badge badge-lg font-bold ${finalPhase === 'Gas' ? 'badge-warning text-white' : 'badge-info text-black'}`;

                        if (showMsg) {
                            phaseMsgContainer.classList.remove('hidden');
                            phaseMsg.textContent = message;
                        } else {
                            phaseMsgContainer.classList.add('hidden');
                        }
                    }
                } else {
                    if (releasePhaseCard) releasePhaseCard.classList.add('hidden');
                }

                // --- STEP 4.2: Release Hole Size Calculation (Table 4.4) ---
                const inputDiameter = document.getElementById('input_diameter');
                const holeSizesContainer = document.getElementById('hole_sizes_container');
                const valD1 = document.getElementById('val_d1');
                const valD2 = document.getElementById('val_d2');
                const valD3 = document.getElementById('val_d3');
                const valD4 = document.getElementById('val_d4');

                const diameter = inputDiameter ? parseFloat(inputDiameter.value) : NaN;

                if (!isNaN(diameter) && diameter > 0) {
                    // d1 = 0.25
                    const d1 = 0.25;

                    // d2 = min(D, 1)
                    const d2 = Math.min(diameter, 1);

                    // d3 = min(D, 4)
                    const d3 = Math.min(diameter, 4);

                    // d4 = min(D, 16)
                    const d4 = Math.min(diameter, 16);

                    if (valD1) valD1.textContent = d1.toFixed(2);
                    if (valD2) valD2.textContent = d2.toFixed(2);
                    if (valD3) valD3.textContent = d3.toFixed(2);
                    if (valD4) valD4.textContent = d4.toFixed(2);

                    if (holeSizesContainer) holeSizesContainer.classList.remove('hidden');
                } else {
                    if (holeSizesContainer) holeSizesContainer.classList.add('hidden');
                }

            } else {
                console.warn(`No properties found for ${selectedLabel}`);
                propertiesCard.classList.add('hidden');
                if (document.getElementById('release_phase_card')) document.getElementById('release_phase_card').classList.add('hidden');
            }
        }

        // Event Listeners
        selectFluid.addEventListener('change', updateDisplay);
        if (selectPhase) {
            selectPhase.addEventListener('change', updateDisplay);
        }
        if (inputTemperature) {
            inputTemperature.addEventListener('input', updateDisplay); // Real-time calculation
        }
        if (document.getElementById('input_diameter')) {
            document.getElementById('input_diameter').addEventListener('input', updateDisplay); // Real-time
        }
    }
});
