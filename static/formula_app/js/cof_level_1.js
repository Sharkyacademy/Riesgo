import { RepresentativeFluids } from '../data/cof/table4_1_1.js';
import { FluidProperties } from '../data/cof/table4_1_2.js';
import ComponentGFFs from '../data/cof/gff_table_3_1.js';
import { getReductionFactor, getLeakDuration, DetectionDescriptions, IsolationDescriptions } from '../data/cof/table4_6_7.js';
import { ComponentDamageConstants, PersonnelInjuryConstants, MitigationSystems } from '../data/cof/table4_8_9_10.js';
import { calcFlammableCA } from './cof_level_1_4_8.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPERS for Step 4.8 ---

    // Helper: Calculate AIT Blending Factor (Eq 3.23 - 3.25)
    // Ts and AIT in Rankine
    const getAITBlendingFactor = (Ts, aitValue) => {
        if (aitValue === "Note 4") return 1.0; // Pyrophoric -> Assume Likely
        if (!aitValue) return 0.0;

        const AIT = parseFloat(aitValue);
        const C6 = 100.0; // Rankine

        if (Ts + C6 <= AIT) return 0.0;
        if (Ts + C6 > AIT && Ts > AIT - C6) {
            return (Ts - AIT + C6) / (2 * C6);
        }
        if (Ts - C6 >= AIT) return 1.0;
        return 0.0;
    };

    // Helper: Calculate Energy Efficiency Factor (Eq 3.17)
    // Only for Instantaneous Releases > 10,000 lbs
    const getEnergyEfficiencyFactor = (mass) => {
        if (mass <= 10000) return 1.0;
        const eff = 4 * Math.log10(1.0 * mass) - 15;
        return Math.max(1.0, eff);
    };

    // Helper: Generic CA power calculation
    const calcPower = (val, coeffs) => {
        if (!coeffs || !coeffs.a || !coeffs.b) return 0;
        return coeffs.a * Math.pow(val, coeffs.b);
    };

    // Helper: Pick coefficients based on phase
    const getCoeffs = (constSet, phase) => {
        if (!constSet) return null;
        return constSet[phase] || null;
    };



    // --- DOM Elements ---
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
            option.value = fluid.label; // Using label as ID
            option.textContent = fluid.label;
            selectFluid.appendChild(option);
        });
    }

    // Populate Component Type Dropdown
    const selectComponentType = document.getElementById('select_component_type');
    if (selectComponentType) {
        console.log('Populating Component Type dropdown...', ComponentGFFs);
        ComponentGFFs.forEach(comp => {
            const option = document.createElement('option');
            option.value = comp.label;
            option.textContent = comp.label;
            selectComponentType.appendChild(option);
        });
        console.log('Dropdown populated with', selectComponentType.options.length, 'options.');
    } else {
        console.error('Element select_component_type not found!');
    }

    // Unified Update Function
    function updateDisplay() {
        const selectedLabel = selectFluid.value;
        const phase = selectPhase ? selectPhase.value : null;
        const tempF = inputTemperature ? parseFloat(inputTemperature.value) : NaN;

        let finalPhase = '-';

        const selectedFluid = RepresentativeFluids.find(f => f.label === selectedLabel);
        const props = FluidProperties[selectedLabel];

        if (selectedFluid) {
            displayType.textContent = selectedFluid.type;
            displayExamples.textContent = selectedFluid.examples;
            fluidDetails.classList.remove('hidden');
        }

        if (props) {
            // Update Properties Phase
            propMw.textContent = props.mw;
            propDensity.textContent = props.liquid_density;
            propNbp.textContent = props.nbp;
            propAit.textContent = props.ait !== null ? props.ait : 'N/A';
            propAmbient.textContent = props.ambient_state;
            propAmbient.className = `badge badge-lg font-bold ${props.ambient_state === 'Gas' ? 'badge-warning' : 'badge-info'}`;

            // Cp Equation Latex
            let cpEqLatex = '-';
            if (props.cp_eq === 1) cpEqLatex = '\\(C_p = A + BT + CT^2 + DT^3\\)';
            else if (props.cp_eq === 2) cpEqLatex = '\\(C_p = A + B \\left(\\frac{C/T}{\\sinh(C/T)}\\right)^2 + D \\left(\\frac{E/T}{\\cosh(E/T)}\\right)^2\\)';
            else if (props.cp_eq === 3) cpEqLatex = '\\(C_p = A + BT + CT^2 + DT^3 + ET^4\\)';

            propCpEq.innerHTML = cpEqLatex;
            if (window.MathJax) window.MathJax.typesetPromise([propCpEq]);

            propCpA.textContent = props.a !== null ? props.a.toExponential(2) : '-';
            propCpB.textContent = props.b !== null ? props.b.toExponential(2) : '-';
            propCpC.textContent = props.c !== null ? props.c.toExponential(2) : '-';
            propCpD.textContent = props.d !== null ? props.d.toExponential(2) : '-';
            propCpE.textContent = props.e !== null ? props.e.toExponential(2) : '-';

            propertiesCard.classList.remove('hidden');

            // Phase Logic Visualization
            if (document.getElementById('card_mw')) document.getElementById('card_mw').style.opacity = '1';
            if (document.getElementById('card_density')) document.getElementById('card_density').style.opacity = '1';
            if (document.getElementById('card_cp')) document.getElementById('card_cp').style.opacity = '1';

            // Cp Calculation
            if (phase === 'Vapor' && !isNaN(tempF)) {
                // ... (Cp Logic Omitted for Brevity in Thought but INCLUDED in CodeContent)
                // Wait, I MUST include the logic or it will be gone.
                const tempK = (tempF - 32) * 5 / 9 + 273.15;
                let calculatedCp = null;
                const { a: A, b: B, c: C, d: D, e: E } = props;
                try {
                    if (props.cp_eq === 1) calculatedCp = A + (B * tempK) + (C * Math.pow(tempK, 2)) + (D * Math.pow(tempK, 3));
                    else if (props.cp_eq === 2 && tempK > 0) {
                        const term1 = (C / tempK) / Math.sinh(C / tempK);
                        const term2 = (E / tempK) / Math.cosh(E / tempK);
                        calculatedCp = A + (B * Math.pow(term1, 2)) + (D * Math.pow(term2, 2));
                    } else if (props.cp_eq === 3) {
                        calculatedCp = A + (B * tempK) + (C * Math.pow(tempK, 2)) + (D * Math.pow(tempK, 3)) + (E * Math.pow(tempK, 4));
                    }
                } catch (e) { }

                if (calculatedCp !== null) {
                    cpResultContainer.classList.remove('hidden');
                    cpCalculatedValue.textContent = calculatedCp.toFixed(2);
                    // Ratio k
                    let R_const = (props.cp_eq === 1) ? 8.314 : 8314;
                    const k_val = calculatedCp / (calculatedCp - R_const);
                    if (!isNaN(k_val) && isFinite(k_val)) {
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
                if (document.getElementById('card_density')) document.getElementById('card_density').style.opacity = '0.3';

            } else if (phase === 'Liquid') {
                if (document.getElementById('card_mw')) document.getElementById('card_mw').style.opacity = '0.3';
                if (document.getElementById('card_cp')) document.getElementById('card_cp').style.opacity = '0.3';
                cpResultContainer.classList.add('hidden');
                if (document.getElementById('ratio_k_card')) document.getElementById('ratio_k_card').classList.add('hidden');
            } else {
                cpResultContainer.classList.add('hidden');
                if (document.getElementById('ratio_k_card')) document.getElementById('ratio_k_card').classList.add('hidden');
            }

            // Reference Phase Calc (Table 4.3)
            const releasePhaseCard = document.getElementById('release_phase_card');
            const dispStoredPhase = document.getElementById('disp_stored_phase');
            const dispAmbientPhase = document.getElementById('disp_ambient_phase');
            const dispFinalPhase = document.getElementById('disp_final_phase');
            const phaseMsgContainer = document.getElementById('phase_msg_container');
            const phaseMsg = document.getElementById('phase_determination_msg');

            if (selectedFluid && phase) {
                const ambientState = props.ambient_state;
                const nbp = props.nbp;
                let message = '';
                let showMsg = false;

                if (phase === 'Vapor') {
                    finalPhase = 'Gas';
                    message = (ambientState === 'Gas' || ambientState === 'Liquid') ? 'Stored Gas -> Model as Gas' : '';
                } else if (phase === 'Liquid') {
                    if (ambientState === 'Gas') {
                        if (nbp > 80) {
                            finalPhase = 'Liquid';
                            message = `NBP (${nbp}°F) > 80°F -> Model as Liquid`;
                            showMsg = true;
                        } else {
                            finalPhase = 'Gas';
                            message = `NBP (${nbp}°F) <= 80°F -> Model as Gas (Flash)`;
                            showMsg = true;
                        }
                    } else {
                        finalPhase = 'Liquid';
                        message = 'Stored Liquid & Ambient Liquid -> Model as Liquid';
                    }
                }

                if (finalPhase !== '-') {
                    releasePhaseCard.classList.remove('hidden');
                    dispStoredPhase.textContent = phase === 'Vapor' ? 'Gas' : 'Liquid';
                    dispAmbientPhase.textContent = ambientState;
                    dispFinalPhase.textContent = finalPhase;
                    dispFinalPhase.className = `badge badge-lg font-bold ${finalPhase === 'Gas' ? 'badge-warning text-white' : 'badge-info text-black'}`;
                    if (showMsg) {
                        phaseMsgContainer.classList.remove('hidden');
                        phaseMsg.textContent = message;
                    } else {
                        phaseMsgContainer.classList.add('hidden');
                    }
                } else {
                    if (releasePhaseCard) releasePhaseCard.classList.add('hidden');
                }
            } else {
                if (releasePhaseCard) releasePhaseCard.classList.add('hidden');
            }

            // --- STEP 4.2 Hole Sizes ---
            const holeSizesCardWrapper = document.getElementById('hole_sizes_card_wrapper');
            if (finalPhase !== '-' && holeSizesCardWrapper) {
                holeSizesCardWrapper.classList.remove('hidden');
            } else {
                if (holeSizesCardWrapper) holeSizesCardWrapper.classList.add('hidden');
                // Also hide downstream
            }

            const inputDiameter = document.getElementById('input_diameter');
            const selectComponent = document.getElementById('select_component_type');
            const holeSizesContainer = document.getElementById('hole_sizes_container');

            const diameter = inputDiameter ? parseFloat(inputDiameter.value) : NaN;
            const componentLabel = selectComponent ? selectComponent.value : null;

            // Vars for later
            let d1 = 0, d2 = 0, d3 = 0, d4 = 0;
            let Wn1 = 0, Wn2 = 0, Wn3 = 0, Wn4 = 0;

            if (!isNaN(diameter) && diameter > 0) {
                d1 = Math.min(diameter, 0.25);
                d2 = Math.min(diameter, 1);
                d3 = Math.min(diameter, 4);
                d4 = Math.min(diameter, 16);

                if (document.getElementById('val_d1')) document.getElementById('val_d1').textContent = d1.toFixed(2);
                if (document.getElementById('val_d2')) document.getElementById('val_d2').textContent = d2.toFixed(2);
                if (document.getElementById('val_d3')) document.getElementById('val_d3').textContent = d3.toFixed(2);
                if (document.getElementById('val_d4')) document.getElementById('val_d4').textContent = d4.toFixed(2);

                // GFF
                let gffs = { small: 0, medium: 0, large: 0, rupture: 0 };
                if (componentLabel && componentLabel !== "Select equipment type...") {
                    const compData = ComponentGFFs.find(c => c.label === componentLabel);
                    if (compData) {
                        gffs = compData.gff;
                        if (document.getElementById('val_gff1')) document.getElementById('val_gff1').textContent = gffs.small.toExponential(2);
                        if (document.getElementById('val_gff2')) document.getElementById('val_gff2').textContent = gffs.medium.toExponential(2);
                        if (document.getElementById('val_gff3')) document.getElementById('val_gff3').textContent = gffs.large.toExponential(2);
                        if (document.getElementById('val_gff4')) document.getElementById('val_gff4').textContent = gffs.rupture.toExponential(2);
                        if (document.getElementById('val_gff_total')) document.getElementById('val_gff_total').textContent = compData.gffTotal.toExponential(2);
                    }
                }

                if (holeSizesContainer) holeSizesContainer.classList.remove('hidden');

                // --- STEP 4.3 CALCULATION (Re-impl) ---
                const inputPs = document.getElementById('input_ps');
                const valWn1 = document.getElementById('val_wn1');
                const valWn2 = document.getElementById('val_wn2');
                const valWn3 = document.getElementById('val_wn3');
                const valWn4 = document.getElementById('val_wn4');

                // Diameters in Rate Table
                if (document.getElementById('val_wn_d1')) document.getElementById('val_wn_d1').textContent = d1.toFixed(2);
                if (document.getElementById('val_wn_d2')) document.getElementById('val_wn_d2').textContent = d2.toFixed(2);
                if (document.getElementById('val_wn_d3')) document.getElementById('val_wn_d3').textContent = d3.toFixed(2);
                if (document.getElementById('val_wn_d4')) document.getElementById('val_wn_d4').textContent = d4.toFixed(2);

                let calcReleaseRate = null;
                const liquidReleaseCard = document.getElementById('liquid_release_card');
                const vaporReleaseCard = document.getElementById('vapor_release_card');

                if (liquidReleaseCard) liquidReleaseCard.classList.add('hidden');
                if (vaporReleaseCard) vaporReleaseCard.classList.add('hidden');

                if (finalPhase === 'Liquid') {
                    if (liquidReleaseCard) liquidReleaseCard.classList.remove('hidden');
                    const Ps = inputPs ? parseFloat(inputPs.value) : NaN;
                    const Patm = document.getElementById('input_patm') ? parseFloat(document.getElementById('input_patm').value) : 14.7;
                    const Cd = document.getElementById('input_cd') ? parseFloat(document.getElementById('input_cd').value) : 0.61;
                    const Kvn = document.getElementById('input_kvn') ? parseFloat(document.getElementById('input_kvn').value) : 1.0;
                    const rho_l = props.liquid_density;
                    if (document.getElementById('disp_rho_l')) document.getElementById('disp_rho_l').textContent = rho_l;

                    if (!isNaN(Ps) && !isNaN(rho_l) && rho_l > 0) {
                        const gc = 32.174;
                        const calcWn = (dn) => {
                            const An_ft2 = (Math.PI * Math.pow(dn, 2) / 4) / 144;
                            const DeltaP = Math.max(0, (Ps - Patm) * 144);
                            if (DeltaP <= 0) return 0;
                            return Cd * Kvn * An_ft2 * Math.sqrt(2 * rho_l * gc * DeltaP);
                        };
                        calcReleaseRate = calcWn;
                        Wn1 = calcWn(d1); Wn2 = calcWn(d2); Wn3 = calcWn(d3); Wn4 = calcWn(d4);

                        if (valWn1) valWn1.textContent = Wn1.toFixed(2);
                        if (valWn2) valWn2.textContent = Wn2.toFixed(2);
                        if (valWn3) valWn3.textContent = Wn3.toFixed(2);
                        if (valWn4) valWn4.textContent = Wn4.toFixed(2);
                    }
                } else if (finalPhase === 'Gas') {
                    if (vaporReleaseCard) vaporReleaseCard.classList.remove('hidden');
                    let PsVap = document.getElementById('input_ps_vap') ? parseFloat(document.getElementById('input_ps_vap').value) : parseInt(inputPs.value);
                    if (isNaN(PsVap) && !isNaN(parseFloat(inputPs.value))) PsVap = parseFloat(inputPs.value);

                    const PatmVap = 14.7;
                    const CdVap = 1.0;
                    const C2Vap = 1.0; // Simplification from UI defaults
                    const MW = props.mw;
                    let k = 1.4;
                    const valRatioK = document.getElementById('val_ratio_k');
                    if (valRatioK && !isNaN(parseFloat(valRatioK.textContent))) k = parseFloat(valRatioK.textContent);

                    // Disp
                    if (document.getElementById('disp_k_vap')) document.getElementById('disp_k_vap').textContent = k.toFixed(3);
                    if (document.getElementById('disp_mw_vap')) document.getElementById('disp_mw_vap').textContent = MW;

                    const R_gas = 1545.3;
                    const Ts_R = tempF + 459.67;

                    if (!isNaN(PsVap) && PsVap > 0) {
                        const termK = k / (k - 1);
                        const Ptrans = PatmVap * Math.pow((k + 1) / 2, termK);
                        const isSonic = PsVap > Ptrans;
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
                        Wn1 = calcWnGas(d1); Wn2 = calcWnGas(d2); Wn3 = calcWnGas(d3); Wn4 = calcWnGas(d4);

                        // UI Update for Gas Wn
                        if (document.getElementById('val_wn1_vap')) document.getElementById('val_wn1_vap').textContent = Wn1.toFixed(2);
                        if (document.getElementById('val_wn2_vap')) document.getElementById('val_wn2_vap').textContent = Wn2.toFixed(2);
                        if (document.getElementById('val_wn3_vap')) document.getElementById('val_wn3_vap').textContent = Wn3.toFixed(2);
                        if (document.getElementById('val_wn4_vap')) document.getElementById('val_wn4_vap').textContent = Wn4.toFixed(2);
                    }
                }

                // --- STEPS 4.4, 4.5, 4.6 ---
                const fluidInvCard = document.getElementById('fluid_inventory_card');
                if (calcReleaseRate) {
                    if (fluidInvCard) fluidInvCard.classList.remove('hidden');

                    const d8 = Math.min(diameter, 8.0);
                    const W_max8 = calcReleaseRate(d8);
                    if (document.getElementById('disp_w_max8')) document.getElementById('disp_w_max8').textContent = W_max8.toFixed(2);

                    const inputMassInv = document.getElementById('input_mass_inv');
                    const inputMassComp = document.getElementById('input_mass_comp');
                    const massInv = inputMassInv && inputMassInv.value ? parseFloat(inputMassInv.value) : Infinity;
                    const massComp = inputMassComp && inputMassComp.value ? parseFloat(inputMassComp.value) : 0;

                    // Update Rows
                    const updateRow4 = (suffix, Wn) => {
                        if (document.getElementById(`tbl_wn${suffix}`)) document.getElementById(`tbl_wn${suffix}`).textContent = Wn.toFixed(2);
                        const massAdd = 180 * Math.min(Wn, W_max8);
                        if (document.getElementById(`val_mass_add${suffix}`)) document.getElementById(`val_mass_add${suffix}`).textContent = massAdd.toFixed(1);
                        const massInvEff = (inputMassInv && inputMassInv.value) ? massInv : (massComp + massAdd);
                        const massAvail = Math.min(massComp + massAdd, massInvEff);
                        if (document.getElementById(`val_mass_avail${suffix}`)) document.getElementById(`val_mass_avail${suffix}`).textContent = massAvail.toFixed(1);
                    };
                    updateRow4('1', Wn1); updateRow4('2', Wn2); updateRow4('3', Wn3); updateRow4('4', Wn4);

                    // 4.5 Release Type
                    const rtCard = document.getElementById('release_type_card');
                    if (rtCard) rtCard.classList.remove('hidden');
                    const updateRT = (suffix, dn, Wn) => {
                        // Update Table Cells
                        if (document.getElementById(`rt_d${suffix}`)) document.getElementById(`rt_d${suffix}`).textContent = dn.toFixed(2);
                        if (document.getElementById(`rt_wn${suffix}`)) document.getElementById(`rt_wn${suffix}`).textContent = Wn.toFixed(2);

                        let rType = 'Continuous';
                        if (dn <= 0.25) rType = 'Continuous';
                        else if (Wn > 55.6) rType = 'Instantaneous';
                        const el = document.getElementById(`rt_type${suffix}`);
                        if (el) {
                            el.textContent = rType;
                            el.className = rType === 'Instantaneous' ? 'font-bold text-red-600' : 'font-bold text-green-600';
                        }
                    };
                    updateRT('1', d1, Wn1); updateRT('2', d2, Wn2); updateRT('3', d3, Wn3); updateRT('4', d4, Wn4);

                    // 4.6 Detection
                    const detIsoCard = document.getElementById('detection_isolation_card');
                    if (detIsoCard) detIsoCard.classList.remove('hidden');
                    const selectDet = document.getElementById('select_detection');
                    const selectIso = document.getElementById('select_isolation');
                    const detClass = selectDet ? selectDet.value : null;
                    const isoClass = selectIso ? selectIso.value : null;

                    // Desc
                    if (selectDet && DetectionDescriptions[detClass]) document.getElementById('desc_detection').textContent = DetectionDescriptions[detClass];
                    if (selectIso && IsolationDescriptions[isoClass]) document.getElementById('desc_isolation').textContent = IsolationDescriptions[isoClass];

                    if (detClass && isoClass && detClass !== "Select Class..." && isoClass !== "Select Class...") {
                        const factDi = getReductionFactor(detClass, isoClass);
                        if (document.getElementById('val_fact_di')) document.getElementById('val_fact_di').textContent = factDi.toFixed(2);

                        const ld1 = getLeakDuration(detClass, isoClass, d1);
                        const ld2 = getLeakDuration(detClass, isoClass, d2);
                        const ld3 = getLeakDuration(detClass, isoClass, d3);
                        const ld4 = getLeakDuration(detClass, isoClass, d4);

                        if (document.getElementById('val_ld1')) document.getElementById('val_ld1').textContent = ld1;
                        if (document.getElementById('val_ld2')) document.getElementById('val_ld2').textContent = ld2;
                        if (document.getElementById('val_ld3')) document.getElementById('val_ld3').textContent = ld3;
                        if (document.getElementById('val_ld4')) document.getElementById('val_ld4').textContent = ld4;

                        // --- STEP 4.7 & 4.8 ---
                        const relMassCard = document.getElementById('release_mass_card');
                        if (relMassCard) relMassCard.classList.remove('hidden');

                        const flammableCard = document.getElementById('flammable_consequence_card');
                        if (flammableCard) flammableCard.classList.remove('hidden');

                        // Totals
                        let finalCmdTotal = 0;
                        let finalInjTotal = 0;
                        let totalGffSum = 0;

                        const mitSelect = document.getElementById('select_mitigation');
                        const mitKey = mitSelect ? mitSelect.value : "None";
                        const mitFactor = MitigationSystems[mitKey] ? MitigationSystems[mitKey].factor : 0.0;
                        const tempR = (tempF ? tempF : 70) + 459.67;

                        // Non-Flammable Check
                        const isFlammable = !!ComponentDamageConstants[selectedLabel];
                        const warningDiv = document.getElementById('non_flammable_msg');
                        if (warningDiv) {
                            if (!isFlammable) warningDiv.classList.remove('hidden');
                            else warningDiv.classList.add('hidden');
                        }

                        const updateFinalRelease = (suffix, Wn, Wmax8, massComp, massInv, factDi, ldMaxMin, dn, gffVal) => {
                            const massAdd = 180 * Math.min(Wn, Wmax8);
                            let massInvEff = massInv;
                            if (!inputMassInv || !inputMassInv.value) massInvEff = massComp + massAdd;
                            const massAvail = Math.min(massComp + massAdd, massInvEff);

                            const rateN = Wn * (1.0 - factDi);
                            const ldMaxSec = 60 * ldMaxMin;
                            const ldN = (rateN > 0) ? Math.min(massAvail / rateN, ldMaxSec) : ldMaxSec;
                            const massN = Math.min(rateN * ldN, massAvail);

                            // UI
                            if (document.getElementById(`fin_rate${suffix}`)) document.getElementById(`fin_rate${suffix}`).textContent = rateN.toFixed(2);
                            if (document.getElementById(`fin_dur${suffix}`)) document.getElementById(`fin_dur${suffix}`).textContent = ldN.toFixed(1);
                            if (document.getElementById(`fin_mass${suffix}`)) document.getElementById(`fin_mass${suffix}`).textContent = massN.toFixed(1);

                            // 4.8
                            let isInstPrimary = false;
                            if (dn <= 0.25) isInstPrimary = false;
                            else if (rateN > 55.6) isInstPrimary = true;

                            const res = calcFlammableCA(selectedLabel, rateN, massN, tempR, mitFactor, finalPhase, isInstPrimary);

                            // Detailed Table Update
                            if (document.getElementById(`det_cmd${suffix}`)) document.getElementById(`det_cmd${suffix}`).textContent = res.cmd.toFixed(2);
                            if (document.getElementById(`det_inj${suffix}`)) document.getElementById(`det_inj${suffix}`).textContent = res.inj.toFixed(2);

                            finalCmdTotal += res.cmd * gffVal;
                            finalInjTotal += res.inj * gffVal;
                            totalGffSum += gffVal;
                        };

                        updateFinalRelease('1', Wn1, W_max8, massComp, massInv, factDi, ld1, d1, gffs.small);
                        updateFinalRelease('2', Wn2, W_max8, massComp, massInv, factDi, ld2, d2, gffs.medium);
                        updateFinalRelease('3', Wn3, W_max8, massComp, massInv, factDi, ld3, d3, gffs.large);
                        updateFinalRelease('4', Wn4, W_max8, massComp, massInv, factDi, ld4, d4, gffs.rupture);

                        const wCmd = totalGffSum > 0 ? (finalCmdTotal / totalGffSum) : 0;
                        const wInj = totalGffSum > 0 ? (finalInjTotal / totalGffSum) : 0;

                        if (document.getElementById('val_final_cmd')) document.getElementById('val_final_cmd').textContent = wCmd.toFixed(2);
                        if (document.getElementById('val_final_inj')) document.getElementById('val_final_inj').textContent = wInj.toFixed(2);


                    }
                } else {
                    if (fluidInvCard) fluidInvCard.classList.add('hidden');
                }

            } else {
                if (holeSizesContainer) holeSizesContainer.classList.add('hidden');
            }
        }
    }

    // --- EVENT LISTENERS ---
    if (selectFluid) selectFluid.addEventListener('change', updateDisplay);
    if (selectPhase) selectPhase.addEventListener('change', updateDisplay);
    if (inputTemperature) inputTemperature.addEventListener('input', updateDisplay);
    if (document.getElementById('input_diameter')) document.getElementById('input_diameter').addEventListener('input', updateDisplay);
    if (document.getElementById('select_component_type')) document.getElementById('select_component_type').addEventListener('change', updateDisplay);

    // Liquid Inputs
    ['input_ps', 'input_patm', 'input_cd', 'input_kvn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateDisplay);
    });

    // Gas Inputs
    ['input_ps_vap', 'input_patm_vap', 'input_cd_vap', 'input_c2_vap'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateDisplay);
    });

    ['input_mass_inv', 'input_mass_comp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateDisplay);
    });

    if (document.getElementById('select_detection')) document.getElementById('select_detection').addEventListener('change', updateDisplay);
    if (document.getElementById('select_isolation')) document.getElementById('select_isolation').addEventListener('change', updateDisplay);
    if (document.getElementById('select_mitigation')) document.getElementById('select_mitigation').addEventListener('change', updateDisplay);

    // Initial call
    updateDisplay();
});
