import { RepresentativeFluids } from '../data/cof/table4_1_1.js';
import { FluidProperties } from '../data/cof/table4_1_2.js';
import ComponentGFFs from '../data/cof/gff_table_3_1.js'; // Default export

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

            let finalPhase = '-'; // Scope accessible for all steps



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
                    // finalPhase already declared at top of function
                    let message = '';
                    let showMsg = false;

                    // Logic from Table 4.3
                    console.log(`[PhaseCheck] Phase: ${phase}, Ambient: ${ambientState}, NBP: ${nbp}`);

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
                    } else {
                        if (releasePhaseCard) releasePhaseCard.classList.add('hidden');
                        // Cascade Hide
                        const holeSizesCardWrapper = document.getElementById('hole_sizes_card_wrapper');
                        if (holeSizesCardWrapper) holeSizesCardWrapper.classList.add('hidden');
                        if (document.getElementById('fluid_inventory_card')) document.getElementById('fluid_inventory_card').classList.add('hidden');
                    }
                } else {
                    if (releasePhaseCard) releasePhaseCard.classList.add('hidden');
                    // Cascade Hide
                    const holeSizesCardWrapper = document.getElementById('hole_sizes_card_wrapper');
                    if (holeSizesCardWrapper) holeSizesCardWrapper.classList.add('hidden');
                    if (document.getElementById('fluid_inventory_card')) document.getElementById('fluid_inventory_card').classList.add('hidden');
                }

                // --- STEP 4.2: Release Hole Size Calculation (Table 4.4) ---
                const holeSizesCardWrapper = document.getElementById('hole_sizes_card_wrapper');
                // Show Step 4.2 Card ONLY if Step 4.1.7 (Phase) is valid
                if (finalPhase !== '-' && holeSizesCardWrapper) {
                    holeSizesCardWrapper.classList.remove('hidden');
                } else {
                    if (holeSizesCardWrapper) holeSizesCardWrapper.classList.add('hidden');
                    if (document.getElementById('fluid_inventory_card')) document.getElementById('fluid_inventory_card').classList.add('hidden');
                }

                const inputDiameter = document.getElementById('input_diameter');
                const selectComponent = document.getElementById('select_component_type');
                const holeSizesContainer = document.getElementById('hole_sizes_container');
                const valD1 = document.getElementById('val_d1');
                const valD2 = document.getElementById('val_d2');
                const valD3 = document.getElementById('val_d3');
                const valD4 = document.getElementById('val_d4');

                const valGff1 = document.getElementById('val_gff1');
                const valGff2 = document.getElementById('val_gff2');
                const valGff3 = document.getElementById('val_gff3');
                const valGff4 = document.getElementById('val_gff4');
                const valGffTotal = document.getElementById('val_gff_total');

                const diameter = inputDiameter ? parseFloat(inputDiameter.value) : NaN;
                const componentLabel = selectComponent ? selectComponent.value : null;

                if (!isNaN(diameter) && diameter > 0) {
                    // d1 = 0.25 (limited by D)
                    const d1 = Math.min(diameter, 0.25);

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

                    // GFF Lookup
                    if (componentLabel && componentLabel !== "Select equipment type...") {
                        const compData = ComponentGFFs.find(c => c.label === componentLabel);
                        if (compData) {
                            if (valGff1) valGff1.textContent = compData.gff.small.toExponential(2);
                            if (valGff2) valGff2.textContent = compData.gff.medium.toExponential(2);
                            if (valGff3) valGff3.textContent = compData.gff.large.toExponential(2);
                            if (valGff4) valGff4.textContent = compData.gff.rupture.toExponential(2);
                            if (valGffTotal) valGffTotal.textContent = compData.gffTotal.toExponential(2);
                        }
                    } else {
                        // Clear GFFs if no component selected
                        if (valGff1) valGff1.textContent = '-';
                        if (valGff2) valGff2.textContent = '-';
                        if (valGff3) valGff3.textContent = '-';
                        if (valGff4) valGff4.textContent = '-';
                        if (valGffTotal) valGffTotal.textContent = '-';
                    }

                    if (holeSizesContainer) holeSizesContainer.classList.remove('hidden');

                    // --- STEP 4.3.2: Liquid Release Rate Calculation ---
                    const inputPs = document.getElementById('input_ps');
                    const valWn1 = document.getElementById('val_wn1');
                    const valWn2 = document.getElementById('val_wn2');
                    const valWn3 = document.getElementById('val_wn3');
                    const valWn4 = document.getElementById('val_wn4');
                    const valWnD1 = document.getElementById('val_wn_d1');
                    const valWnD2 = document.getElementById('val_wn_d2');
                    const valWnD3 = document.getElementById('val_wn_d3');
                    const valWnD4 = document.getElementById('val_wn_d4');

                    // Check if Final Phase is Liquid or Gas
                    const finalPhaseText = finalPhase;
                    console.log("Final Phase Detected:", finalPhaseText);

                    // Variables for Step 4.4 (Fluid Inventory)
                    let calcReleaseRate = null; // Function to reuse for 8" hole
                    let Wn1 = 0, Wn2 = 0, Wn3 = 0, Wn4 = 0;

                    const liquidReleaseCard = document.getElementById('liquid_release_card');
                    const vaporReleaseCard = document.getElementById('vapor_release_card');

                    console.log("Cards Found:", !!liquidReleaseCard, !!vaporReleaseCard);

                    // Default: Hide both
                    if (liquidReleaseCard) liquidReleaseCard.classList.add('hidden');
                    if (vaporReleaseCard) vaporReleaseCard.classList.add('hidden');

                    if (finalPhaseText === 'Liquid') {
                        if (liquidReleaseCard) liquidReleaseCard.classList.remove('hidden');

                        const Ps = inputPs ? parseFloat(inputPs.value) : NaN;
                        const Patm = document.getElementById('input_patm') ? parseFloat(document.getElementById('input_patm').value) : 14.7;

                        // New inputs
                        const inputCd = document.getElementById('input_cd');
                        const inputKvn = document.getElementById('input_kvn');

                        const Cd = inputCd ? parseFloat(inputCd.value) : 0.61;
                        const Kvn = inputKvn ? parseFloat(inputKvn.value) : 1.0;

                        // Need Liquid Density (lb/ft3) from FluidProperties
                        const rho_l = props.liquid_density;

                        if (document.getElementById('disp_rho_l')) {
                            document.getElementById('disp_rho_l').textContent = rho_l;
                        }

                        if (!isNaN(Ps) && !isNaN(rho_l) && rho_l > 0) {

                            const gc = 32.174; // ft-lb/lbf-s2

                            const calcWn = (dn) => {
                                // Formula derived: Wn = Cd * Kvn * An_ft2 * sqrt(2 * rho_l * gc * DeltaP_lbfft2)
                                const An_in2 = Math.PI * Math.pow(dn, 2) / 4;
                                const An_ft2 = An_in2 / 144;

                                // Ps is assumed Absolute (psia)
                                // DeltaP = Ps - Patm
                                const DeltaP_psi = Ps - Patm;

                                if (DeltaP_psi <= 0) return 0.00;

                                const DeltaP_lbfft2 = DeltaP_psi * 144;
                                return Cd * Kvn * An_ft2 * Math.sqrt(2 * rho_l * gc * DeltaP_lbfft2);
                            };

                            calcReleaseRate = calcWn;
                            Wn1 = calcWn(d1);
                            Wn2 = calcWn(d2);
                            Wn3 = calcWn(d3);
                            Wn4 = calcWn(d4);

                            if (valWn1) valWn1.textContent = Wn1.toFixed(2);
                            if (valWn2) valWn2.textContent = Wn2.toFixed(2);
                            if (valWn3) valWn3.textContent = Wn3.toFixed(2);
                            if (valWn4) valWn4.textContent = Wn4.toFixed(2);

                            if (valWnD1) valWnD1.textContent = d1.toFixed(2);
                            if (valWnD2) valWnD2.textContent = d2.toFixed(2);
                            if (valWnD3) valWnD3.textContent = d3.toFixed(2);
                            if (valWnD4) valWnD4.textContent = d4.toFixed(2);

                        } else {
                            if (valWn1) valWn1.textContent = '-';
                            if (valWn2) valWn2.textContent = '-';
                            if (valWn3) valWn3.textContent = '-';
                            if (valWn4) valWn4.textContent = '-';
                        }
                    } else if (finalPhaseText === 'Gas') {
                        console.log("Entering Gas Block. Showing Card...");
                        if (vaporReleaseCard) vaporReleaseCard.classList.remove('hidden');

                        // Inputs
                        // Inputs
                        const inputPsVap = document.getElementById('input_ps_vap');
                        let PsVap = inputPsVap ? parseFloat(inputPsVap.value) : NaN;

                        // Fallback: If vapor input empty, try liquid input
                        if (isNaN(PsVap) && inputPs && inputPs.value) {
                            PsVap = parseFloat(inputPs.value);
                            // Optional: Sync visible value for clarity
                            if (inputPsVap) inputPsVap.value = PsVap;
                        }

                        const PatmVap = document.getElementById('input_patm_vap') ? parseFloat(document.getElementById('input_patm_vap').value) : 14.7;
                        const inputCdVap = document.getElementById('input_cd_vap');
                        const CdVap = inputCdVap ? parseFloat(inputCdVap.value) : 1.0;
                        const inputC2Vap = document.getElementById('input_c2_vap');
                        const C2Vap = inputC2Vap ? parseFloat(inputC2Vap.value) : 1.0;

                        // Props
                        const MW = props.mw;

                        // Get k from UI
                        let k = 1.4;
                        const valRatioK = document.getElementById('val_ratio_k');
                        if (valRatioK && !isNaN(parseFloat(valRatioK.textContent))) {
                            k = parseFloat(valRatioK.textContent);
                        }

                        // Display Intermediates
                        const R_gas = 1545.3; // ft-lbf / (lb-mol R)
                        const Ts_R = tempF + 459.67;

                        if (document.getElementById('disp_k_vap')) document.getElementById('disp_k_vap').textContent = k.toFixed(3);
                        if (document.getElementById('disp_mw_vap')) document.getElementById('disp_mw_vap').textContent = MW;
                        if (document.getElementById('disp_ts_vap')) document.getElementById('disp_ts_vap').textContent = Ts_R.toFixed(1);

                        if (!isNaN(PsVap) && !isNaN(k) && !isNaN(MW) && PsVap > 0) {
                            // Eq 3.5 Transition Pressure
                            const termK = k / (k - 1);
                            const Ptrans = PatmVap * Math.pow((k + 1) / 2, termK);

                            if (document.getElementById('disp_ptrans')) document.getElementById('disp_ptrans').textContent = Ptrans.toFixed(2);

                            const isSonic = PsVap > Ptrans;
                            const regimeText = isSonic ? 'Sonic (Choked)' : 'Subsonic';
                            const dispRegime = document.getElementById('disp_flow_regime');
                            if (dispRegime) {
                                dispRegime.textContent = regimeText;
                                dispRegime.className = isSonic ? 'text-red-700 font-bold' : 'text-green-700 font-bold';
                            }

                            const gc = 32.174;

                            const calcWnGas = (dn) => {
                                const An = Math.PI * Math.pow(dn, 2) / 4;

                                let Wn = 0;
                                if (isSonic) {
                                    const term1 = (k * MW * gc) / (R_gas * Ts_R);
                                    const term2 = Math.pow(2 / (k + 1), (k + 1) / (k - 1));
                                    Wn = (CdVap / C2Vap) * An * PsVap * Math.sqrt(term1 * term2);
                                } else {
                                    const term1 = (MW * gc) / (R_gas * Ts_R);
                                    const term2 = (2 * k) / (k - 1);
                                    const pr = PatmVap / PsVap;
                                    if (pr >= 1) return 0.00;
                                    const term3 = Math.pow(pr, 2 / k);
                                    const term4 = 1 - Math.pow(pr, (k - 1) / k);
                                    Wn = (CdVap / C2Vap) * An * PsVap * Math.sqrt(term1 * term2 * term3 * term4);
                                }
                                return Wn;
                            };

                            calcReleaseRate = calcWnGas;
                            Wn1 = calcWnGas(d1);
                            Wn2 = calcWnGas(d2);
                            Wn3 = calcWnGas(d3);
                            Wn4 = calcWnGas(d4);

                            if (document.getElementById('val_wn1_vap')) document.getElementById('val_wn1_vap').textContent = Wn1.toFixed(2);
                            if (document.getElementById('val_wn2_vap')) document.getElementById('val_wn2_vap').textContent = Wn2.toFixed(2);
                            if (document.getElementById('val_wn3_vap')) document.getElementById('val_wn3_vap').textContent = Wn3.toFixed(2);
                            if (document.getElementById('val_wn4_vap')) document.getElementById('val_wn4_vap').textContent = Wn4.toFixed(2);

                        } else {
                            if (document.getElementById('val_wn1_vap')) document.getElementById('val_wn1_vap').textContent = '-';
                            if (document.getElementById('val_wn2_vap')) document.getElementById('val_wn2_vap').textContent = '-';
                            if (document.getElementById('val_wn3_vap')) document.getElementById('val_wn3_vap').textContent = '-';
                            if (document.getElementById('val_wn4_vap')) document.getElementById('val_wn4_vap').textContent = '-';
                        }
                    }

                    // --- STEP 4.4: Estimate Fluid Inventory Available for Release ---
                    const fluidInvCard = document.getElementById('fluid_inventory_card');

                    if (calcReleaseRate) {
                        if (fluidInvCard) fluidInvCard.classList.remove('hidden');

                        // 1. Calculate W_max8 (Release Rate for 8 inch hole)
                        // Note: If D < 8, limitation d_n = D applies.
                        const d8 = Math.min(diameter, 8.0);
                        const W_max8 = calcReleaseRate(d8);

                        if (document.getElementById('disp_w_max8')) document.getElementById('disp_w_max8').textContent = W_max8.toFixed(2);

                        // 2. Read Masses
                        const inputMassInv = document.getElementById('input_mass_inv');
                        const inputMassComp = document.getElementById('input_mass_comp');
                        const massInv = inputMassInv && inputMassInv.value ? parseFloat(inputMassInv.value) : Infinity;
                        const massComp = inputMassComp && inputMassComp.value ? parseFloat(inputMassComp.value) : 0;

                        // Helper to update row
                        const updateRow = (suffix, Wn, Wmax8) => {
                            // Update Rate col
                            const tblWn = document.getElementById(`tbl_wn${suffix}`);
                            if (tblWn) tblWn.textContent = Wn.toFixed(2);

                            // Calc Mass Add (Eq 3.10) => 180 * min(Wn, Wmax8)
                            const massAdd = 180 * Math.min(Wn, Wmax8);
                            const valMassAdd = document.getElementById(`val_mass_add${suffix}`);
                            if (valMassAdd) valMassAdd.textContent = massAdd.toFixed(1);

                            // Calc Mass Avail (Eq 3.11) => min(massComp + massAdd, massInv)
                            // Use MassInv as upper limit if defined
                            const massInvEff = (inputMassInv && inputMassInv.value) ? massInv : (massComp + massAdd);

                            const massAvail = Math.min(massComp + massAdd, massInvEff);

                            const valMassAvail = document.getElementById(`val_mass_avail${suffix}`);
                            if (valMassAvail) valMassAvail.textContent = massAvail.toFixed(1);
                        };

                        updateRow('1', Wn1, W_max8);
                        updateRow('2', Wn2, W_max8);
                        updateRow('3', Wn3, W_max8);
                        updateRow('4', Wn4, W_max8);

                        // --- STEP 4.5: Release Type Determination (Sec 4.5.2) ---
                        const rtCard = document.getElementById('release_type_card');
                        if (rtCard) rtCard.classList.remove('hidden');

                        const updateReleaseType = (suffix, dn, Wn) => {
                            let rType = 'Continuous';

                            // Rule 1: dn <= 0.25 in -> Continuous
                            if (dn <= 0.25) {
                                rType = 'Continuous';
                            }
                            // Rule 2 Check: Wn > 55.6 lb/s -> Instantaneous
                            else if (Wn > 55.6) {
                                rType = 'Instantaneous';
                            }
                            // Default: Continuous
                            else {
                                rType = 'Continuous';
                            }

                            // UI Updates
                            const elD = document.getElementById(`rt_d${suffix}`);
                            const elWn = document.getElementById(`rt_wn${suffix}`);
                            const elType = document.getElementById(`rt_type${suffix}`);

                            if (elD) elD.textContent = dn.toFixed(2);
                            if (elWn) elWn.textContent = Wn.toFixed(2);
                            if (elType) {
                                elType.textContent = rType;
                                // Visual styling
                                if (rType === 'Instantaneous') {
                                    elType.className = 'font-bold text-red-600';
                                } else {
                                    elType.className = 'font-bold text-green-600';
                                }
                            }
                        };

                        updateReleaseType('1', d1, Wn1);
                        updateReleaseType('2', d2, Wn2);
                        updateReleaseType('3', d3, Wn3);
                        updateReleaseType('4', d4, Wn4);

                    } else {
                        // Hide if no calculation happened (e.g. error in inputs)
                        // But keep logic clean: if calcReleaseRate is null, we are not in a valid state
                        if (fluidInvCard) fluidInvCard.classList.add('hidden');
                        if (document.getElementById('release_type_card')) document.getElementById('release_type_card').classList.add('hidden');
                    }

                } else {
                    if (holeSizesContainer) holeSizesContainer.classList.add('hidden');
                }

            } else {
                // If no fluid selected or invalid, hide all downstream
                if (propertiesCard) propertiesCard.classList.add('hidden');
                if (document.getElementById('release_phase_card')) document.getElementById('release_phase_card').classList.add('hidden');

                const hWrapper = document.getElementById('hole_sizes_card_wrapper');
                if (hWrapper) hWrapper.classList.add('hidden');

                const fInv = document.getElementById('fluid_inventory_card');
                if (fInv) fInv.classList.add('hidden');

                if (document.getElementById('release_type_card')) document.getElementById('release_type_card').classList.add('hidden');
            }
        }

        // Populate Component Dropdown
        const selectComponent = document.getElementById('select_component_type');
        if (selectComponent && ComponentGFFs) {
            ComponentGFFs.forEach(comp => {
                const option = document.createElement('option');
                option.value = comp.label;
                option.textContent = comp.label;
                selectComponent.appendChild(option);
            });
            // Listener
            selectComponent.addEventListener('change', updateDisplay);
        }

        // Event Listeners
        selectFluid.addEventListener('change', updateDisplay);
        if (selectPhase) {
            selectPhase.addEventListener('change', updateDisplay);
        }
        if (inputTemperature) {
            inputTemperature.addEventListener('input', updateDisplay);
        }

        if (document.getElementById('input_diameter')) {
            document.getElementById('input_diameter').addEventListener('input', updateDisplay); // Real-time
        }
        if (document.getElementById('input_ps')) {
            document.getElementById('input_ps').addEventListener('input', updateDisplay); // Real-time
        }
        if (document.getElementById('input_patm')) {
            document.getElementById('input_patm').addEventListener('input', updateDisplay); // Real-time
        }
        if (document.getElementById('input_cd')) {
            document.getElementById('input_cd').addEventListener('input', updateDisplay); // Real-time
        }
        if (document.getElementById('input_kvn')) {
            document.getElementById('input_kvn').addEventListener('input', updateDisplay); // Real-time
        }

        // Vapor Inputs Listeners
        if (document.getElementById('input_ps_vap')) document.getElementById('input_ps_vap').addEventListener('input', updateDisplay);
        if (document.getElementById('input_patm_vap')) document.getElementById('input_patm_vap').addEventListener('input', updateDisplay);
        if (document.getElementById('input_cd_vap')) document.getElementById('input_cd_vap').addEventListener('input', updateDisplay);
        if (document.getElementById('input_c2_vap')) document.getElementById('input_c2_vap').addEventListener('input', updateDisplay);

        // Step 4.4 Fluid Inventory Listeners
        if (document.getElementById('input_mass_inv')) document.getElementById('input_mass_inv').addEventListener('input', updateDisplay);
        if (document.getElementById('input_mass_comp')) document.getElementById('input_mass_comp').addEventListener('input', updateDisplay);
    }
});
