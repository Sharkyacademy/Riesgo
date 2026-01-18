import { RepresentativeFluids } from '../data/cof/table4_1_1.js';
import { FluidProperties } from '../data/cof/table4_1_2.js';
import ComponentGFFs from '../data/cof/gff_table_3_1.js';
import { getReductionFactor, getLeakDuration, DetectionDescriptions, IsolationDescriptions } from '../data/cof/table4_6_7.js';
import { ComponentDamageConstants, PersonnelInjuryConstants, MitigationSystems, ToxicGasConstants, SteamConstants, AcidConstants } from '../data/cof/table4_8_9_10.js';
import { ComponentCostData, MaterialCostFactors, ComponentOutageData } from '../data/cof/table4_15_16.js';
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
            const opt = document.createElement('option');
            opt.value = comp.componentType; // Use componentType for value
            opt.textContent = comp.label;
            selectComponentType.appendChild(opt);
        });
        console.log('Dropdown populated with', selectComponentType.options.length, 'options.');
    } else {
        console.error('Element select_component_type not found!');
    }

    // Populate Material Cost Factors (Step 4.12.2)
    const selectMaterial = document.getElementById('select_material_cost');
    if (selectMaterial) {
        Object.keys(MaterialCostFactors).forEach(mat => {
            const opt = document.createElement('option');
            opt.value = MaterialCostFactors[mat]; // Value is the factor (e.g. 1.0)
            opt.textContent = mat; // Text is Carbon Steel
            selectMaterial.appendChild(opt);
        });
    }

    // Unified Update Function
    function updateDisplay() {
        const selectedLabel = selectFluid.value;
        const phase = selectPhase ? selectPhase.value : null;
        const tempF = inputTemperature ? parseFloat(inputTemperature.value) : NaN;

        let finalPhase = '-';

        const selectedFluid = RepresentativeFluids.find(f => f.label === selectedLabel);
        const props = FluidProperties[selectedLabel];

        // Declare variables at function scope to avoid ReferenceErrors
        const inputDiameter = document.getElementById('input_diameter');
        const selectComponent = document.getElementById('select_component_type');
        const holeSizesContainer = document.getElementById('hole_sizes_container');
        const fluidInvCard = document.getElementById('fluid_inventory_card');

        let nbp = null;
        let ld1 = 0, ld2 = 0, ld3 = 0, ld4 = 0;
        let d1 = 0, d2 = 0, d3 = 0, d4 = 0;
        let Wn1 = 0, Wn2 = 0, Wn3 = 0, Wn4 = 0;
        let totalGffSum = 0, finalCmdTotal = 0, finalInjTotal = 0, volEnvTotal = 0;
        let factDi = 0;
        let W_max8 = 0, massInv = Infinity, massComp = 0;
        let densL = 62.4, frac_evap = 1.0;
        let tempR = 529.67, mitFactor = 0;
        let nbpF = 0;
        const inputMassInv = document.getElementById('input_mass_inv');
        const inputPs = document.getElementById('input_ps');

        if (selectedFluid) {
            displayType.textContent = selectedFluid.type;
            displayExamples.textContent = selectedFluid.examples;
            fluidDetails.classList.remove('hidden');
        }

        if (props) {
            nbp = props.nbp; // Assign nbp here
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

            const diameter = inputDiameter ? parseFloat(inputDiameter.value) : NaN;
            const componentLabel = selectComponent ? selectComponent.value : null;

            if (!isNaN(diameter) && diameter > 0) {
                d1 = Math.min(diameter, 0.25);
                d2 = Math.min(diameter, 1);
                d3 = Math.min(diameter, 4);
                d4 = Math.min(diameter, 16);

                if (document.getElementById('val_d1')) document.getElementById('val_d1').textContent = d1.toFixed(2);
                if (document.getElementById('val_d2')) document.getElementById('val_d2').textContent = d2.toFixed(2);
                if (document.getElementById('val_d3')) document.getElementById('val_d3').textContent = d3.toFixed(2);
                if (document.getElementById('val_d4')) document.getElementById('val_d4').textContent = d4.toFixed(2);

                // GFF - Find component object early for use throughout function
                let gffs = { small: 0, medium: 0, large: 0, rupture: 0 };
                const compData = ComponentGFFs.find(c => c.componentType === componentLabel);
                const compObj = compData; // Alias for later use in financial calculations

                if (componentLabel && componentLabel !== "Select equipment type...") {
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
                    if (document.getElementById('disp_ts_vap')) document.getElementById('disp_ts_vap').textContent = Ts_R.toFixed(1);

                    if (!isNaN(PsVap) && PsVap > 0) {
                        const termK = k / (k - 1);
                        const Ptrans = PatmVap * Math.pow((k + 1) / 2, termK);
                        const isSonic = PsVap > Ptrans;

                        // Disp Regime
                        if (document.getElementById('disp_ptrans')) document.getElementById('disp_ptrans').textContent = Ptrans.toFixed(2);
                        if (document.getElementById('disp_flow_regime')) document.getElementById('disp_flow_regime').textContent = isSonic ? 'Sonic' : 'Subsonic';

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
                    W_max8 = calcReleaseRate(d8);
                    if (document.getElementById('disp_w_max8')) document.getElementById('disp_w_max8').textContent = W_max8.toFixed(2);

                    const inputMassComp = document.getElementById('input_mass_comp');
                    massInv = inputMassInv && inputMassInv.value ? parseFloat(inputMassInv.value) : Infinity;
                    massComp = inputMassComp && inputMassComp.value ? parseFloat(inputMassComp.value) : 0;

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
                        factDi = getReductionFactor(detClass, isoClass);
                        if (document.getElementById('val_fact_di')) document.getElementById('val_fact_di').textContent = factDi.toFixed(2);

                        ld1 = getLeakDuration(detClass, isoClass, d1);
                        ld2 = getLeakDuration(detClass, isoClass, d2);
                        ld3 = getLeakDuration(detClass, isoClass, d3);
                        ld4 = getLeakDuration(detClass, isoClass, d4);

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
                        // Totals removed duplicates


                        const mitSelect = document.getElementById('select_mitigation');
                        const mitKey = mitSelect ? mitSelect.value : "None";
                        mitFactor = MitigationSystems[mitKey] ? MitigationSystems[mitKey].factor : 0.0;
                        tempR = (tempF ? tempF : 70) + 459.67;

                        // Non-Flammable Check
                        const isFlammable = !!ComponentDamageConstants[selectedLabel];
                        const warningDiv = document.getElementById('non_flammable_msg');
                        if (warningDiv) {
                            if (!isFlammable) warningDiv.classList.remove('hidden');
                            else warningDiv.classList.add('hidden');
                        }

                        // Calculate frac_evap (Eq 3.89)
                        frac_evap = 1.0;
                        nbpF = nbp || 0; // Default to 0 if nbp is null

                        if (nbpF >= 200) {
                            frac_evap = -7.1408
                                + 8.5827e-3 * nbpF
                                - 3.5594e-6 * Math.pow(nbpF, 2)
                                + 2331.1 / nbpF
                                - 203545 / Math.pow(nbpF, 2);
                            frac_evap = Math.max(0, Math.min(1.0, frac_evap));
                        } else {
                            frac_evap = 1.0;
                        }

                        densL = (typeof liquid_density !== 'undefined') ? liquid_density : 62.4;
                        if (!densL || isNaN(densL)) densL = 62.4;

                        // updateFinalRelease function is now defined later, before its first use
                    };



                    // Define updateFinalRelease function (moved here to be accessible)
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

                        // 4.8 Flag
                        let isInstPrimary = false;
                        if (dn <= 0.25) isInstPrimary = false;
                        else if (rateN > 55.6) isInstPrimary = true;

                        // --- Consequence Logic (Single Step) ---
                        const isNonFlammable = ["Steam", "Acid"].includes(selectedLabel);

                        let res = { cmd: 0, inj: 0 };
                        let caInj = 0;

                        if (isNonFlammable) {
                            if (selectedLabel === "Steam" && typeof SteamConstants !== 'undefined') {
                                const { C5, C9, C10 } = SteamConstants;
                                const caCont = C9 * rateN;
                                const caInst = C10 * Math.pow(massN, 0.6384);

                                // Fact IC
                                const factIC = (rateN > 0) ? Math.min(rateN / C5, 1.0) : 0;
                                // Blending
                                caInj = caInst * factIC + caCont * (1.0 - factIC);

                            } else if (selectedLabel === "Acid" && typeof AcidConstants !== 'undefined') {
                                const Ps = inputPs ? parseFloat(inputPs.value) : 15;
                                let consts = AcidConstants.LP;
                                if (Ps > 45) consts = AcidConstants.HP;
                                else if (Ps > 22.5) consts = AcidConstants.MP;

                                const { a, b } = consts;
                                const caCont = 0.2 * a * Math.pow(rateN, b);
                                caInj = caCont;
                            }
                            res.cmd = 0;
                            res.inj = caInj;
                        } else {
                            // Flammable
                            res = calcFlammableCA(selectedLabel, rateN, massN, tempR, mitFactor, finalPhase, isInstPrimary);
                        }

                        // Update Detail Table
                        if (document.getElementById(`det_cmd${suffix}`)) document.getElementById(`det_cmd${suffix}`).textContent = res.cmd.toFixed(2);
                        if (document.getElementById(`det_inj${suffix}`)) document.getElementById(`det_inj${suffix}`).textContent = res.inj.toFixed(2);

                        // Accumulate Totals
                        if (gffVal > 0) {
                            finalCmdTotal += res.cmd * gffVal;
                            finalInjTotal += res.inj * gffVal;

                            if (finalPhase !== 'Gas') {
                                const vol_env = (0.178 * massN * (1.0 - frac_evap)) / densL;
                                volEnvTotal += vol_env * gffVal;
                            }

                            totalGffSum += gffVal;
                        }
                    };

                    // Define aliases for calculation invocation
                    const W_small = Wn1; const W_medium = Wn2; const W_large = Wn3; const W_rupture = Wn4;
                    const ld_max_small = ld1; const ld_max_medium = ld2; const ld_max_large = ld3; const ld_max_rupture = ld4;
                    const dn_small = d1; const dn_medium = d2; const dn_large = d3; const dn_rupture = d4;

                    // invoke calculations
                    if (compObj && compObj.gff) {
                        totalGffSum = 0;
                        finalCmdTotal = 0;
                        finalInjTotal = 0;
                        volEnvTotal = 0;

                        updateFinalRelease('_small', W_small, W_max8, massComp, massInv, factDi, ld_max_small, dn_small, compObj.gff.small);
                        updateFinalRelease('_medium', W_medium, W_max8, massComp, massInv, factDi, ld_max_medium, dn_medium, compObj.gff.medium);
                        updateFinalRelease('_large', W_large, W_max8, massComp, massInv, factDi, ld_max_large, dn_large, compObj.gff.large);
                        updateFinalRelease('_rupture', W_rupture, W_max8, massComp, massInv, factDi, ld_max_rupture, dn_rupture, compObj.gff.rupture);

                        // --- Final Consequence Areas Summary (Step 4.11) ---
                        // Divide by Total GFF to get weighted average Area per event
                        const finalCmd = totalGffSum > 0 ? (finalCmdTotal / totalGffSum) : 0;
                        const finalInj = totalGffSum > 0 ? (finalInjTotal / totalGffSum) : 0;
                        const finalCof = Math.max(finalCmd, finalInj);

                        if (document.getElementById('val_final_cmd_summary')) document.getElementById('val_final_cmd_summary').textContent = finalCmd.toFixed(2);
                        if (document.getElementById('val_final_inj_summary')) document.getElementById('val_final_inj_summary').textContent = finalInj.toFixed(2);
                        if (document.getElementById('val_final_cof_area')) document.getElementById('val_final_cof_area').textContent = finalCof.toFixed(2);

                        // --- Step 4.8 Final Results inside Card ---
                        if (document.getElementById('val_final_cmd')) document.getElementById('val_final_cmd').textContent = finalCmd.toFixed(2);
                        if (document.getElementById('val_final_inj')) document.getElementById('val_final_inj').textContent = finalInj.toFixed(2);

                        const finalAreaCard = document.getElementById('final_consequence_areas_card');
                        if (finalAreaCard) finalAreaCard.classList.remove('hidden');
                    }

                    // --- STEP 4.9: Toxic Determination ---
                    const ToxicFluids = [
                        "H2S", "HF", "HCl", "Ammonia", "Chlorine", "AlCl3", "CO", "Nitric acid", "NO2",
                        "Phosgene", "TDI", "EO", "PO", "EE", "EEA", "EG", "Methanol", "Styrene", "DEE"
                    ];
                    const toxicCard = document.getElementById('toxic_consequence_card');
                    const toxicYes = document.getElementById('toxic_yes_msg');
                    const toxicNo = document.getElementById('toxic_no_msg');

                    if (toxicCard) {
                        toxicCard.classList.remove('hidden'); // Always show card
                        if (ToxicFluids.includes(selectedLabel)) {
                            if (toxicYes) toxicYes.classList.remove('hidden');
                            if (toxicNo) toxicNo.classList.add('hidden');
                        } else {
                            if (toxicYes) toxicYes.classList.add('hidden');
                            if (toxicNo) toxicNo.classList.remove('hidden');
                        }
                    }

                    // Toxic Calculation (Step 4.9.5)
                    const inputMfrac = document.getElementById('input_mfrac_tox');
                    const mfracTox = inputMfrac ? parseFloat(inputMfrac.value) : 1.0;

                    // Helper to get e/f from data point
                    const getEF = (point, isGasState) => {
                        if (point.gas && point.liquid) return isGasState ? point.gas : point.liquid;
                        if (point.gas) return point.gas;
                        if (point.liquid) return point.liquid;
                        // Fallback if structure is flat (e.g. AlCl3 or simple)
                        if (point.e !== undefined) return point;
                        return { e: 0, f: 0 };
                    };

                    const updateToxicTable = (suffix, Wn, dn, massN, isGasState, ldMaxMinutes) => {
                        // Recalculate Unmitigated Mass/Rate
                        const massAdd = 180 * Math.min(Wn, W_max8);
                        let massInvEff = massInv;
                        if (!inputMassInv || !inputMassInv.value) massInvEff = massComp + massAdd;
                        const massAvail = Math.min(massComp + massAdd, massInvEff);

                        // Duration for Toxic (Equation 3.66)
                        // ldMaxMinutes is ld_max,n from Table 4.7 (Calculated via getLeakDuration)
                        const limit1 = 3600;
                        const limit2 = (Wn > 0) ? (massAvail / Wn) : 3600;
                        const limit3 = 60 * (ldMaxMinutes || 60); // default to 1 hour if unspecified

                        const ldUnmitigated = Math.min(limit1, limit2, limit3);
                        const massUnmitigated = Math.min(Wn * ldUnmitigated, massAvail);

                        const rateTox = mfracTox * Wn;
                        const massTox = mfracTox * massUnmitigated;

                        if (document.getElementById(`val_rate_tox${suffix}`)) document.getElementById(`val_rate_tox${suffix}`).textContent = rateTox.toFixed(2);
                        if (document.getElementById(`val_mass_tox${suffix}`)) document.getElementById(`val_mass_tox${suffix}`).textContent = massTox.toFixed(2);

                        // Step 4.9.6, 4.9.7, 4.9.8: Toxic Area
                        let caTox = 0;
                        if (typeof ToxicGasConstants !== 'undefined' && ToxicGasConstants[selectedLabel]) {
                            const consts = ToxicGasConstants[selectedLabel];

                            // Determine Release Type (Logic from Step 4.5)
                            let isInstantaneous = false;
                            if (dn > 0.25 && Wn > 55.6) isInstantaneous = true;

                            // Special handling for Step 4.9.8 Chemicals (Miscellaneous)
                            // Rule: Use Equation 3.64 (Continuous).
                            // If Instantaneous (per Step 4.5), model as 3-minute continuous release.
                            const step498Chemicals = ["AlCl3", "CO", "HCl", "Nitric acid", "NO2", "Phosgene", "TDI", "EO", "PO", "EE", "EEA", "EG", "Methanol", "Styrene", "DEE"];

                            if (step498Chemicals.includes(selectedLabel)) {
                                // We use Eq 3.64 for these.
                                let calcRate = rateTox;
                                let calcDurationMin = ldUnmitigated / 60;

                                if (isInstantaneous) {
                                    // Enforce 3 minute rule
                                    calcDurationMin = 3.0;
                                    // Rate = Mass / (3 * 60)
                                    // MassTox is the total toxic mass released.
                                    // For instantaneous, usually Mass is limited by inventory or 30s rupture?
                                    // We use massTox (already calculated based on inventory/rupture limits).
                                    if (massTox > 0) calcRate = massTox / 180.0;
                                } else {
                                    // Continuous: Clamp Duration
                                    if (calcDurationMin > 60) calcDurationMin = 60;
                                }

                                // Interpolate constants for calcDurationMin
                                const { e, f } = getInterp(calcDurationMin, 'e', 'f');
                                if (calcRate > 0 && e !== undefined) {
                                    caTox = e * Math.pow(calcRate, f);
                                }
                            }
                            // 1. HF / H2S (Step 4.9.6)
                            else if (["HF", "H2S"].includes(selectedLabel)) {
                                if (isInstantaneous) {
                                    const { c, d } = consts.instantaneous;
                                    if (massTox > 0) {
                                        const logMass = Math.log10(massTox);
                                        caTox = Math.pow(10, c * logMass + d);
                                    }
                                } else {
                                    const durationMin = Math.max(Math.min(ldUnmitigated / 60, 60), 5);
                                    const { c, d } = getInterp(durationMin, 'c', 'd');
                                    if (rateTox > 0) {
                                        const logRate = Math.log10(rateTox);
                                        caTox = Math.pow(10, c * logRate + d);
                                    }
                                }
                            }
                            // 2. Ammonia / Chlorine (Step 4.9.7)
                            else if (["Ammonia", "Chlorine"].includes(selectedLabel)) {
                                if (isInstantaneous) {
                                    const { e, f } = consts.instantaneous;
                                    if (massTox > 0) caTox = e * Math.pow(massTox, f);
                                } else {
                                    const durationMin = Math.max(Math.min(ldUnmitigated / 60, 60), 5);
                                    const { e, f } = getInterp(durationMin, 'e', 'f');
                                    if (rateTox > 0) caTox = e * Math.pow(rateTox, f);
                                }
                            }
                        }

                        if (document.getElementById(`val_ca_tox${suffix}`)) {
                            const displayVal = (caTox > 0) ? caTox.toFixed(1) : "-";
                            document.getElementById(`val_ca_tox${suffix}`).textContent = displayVal;
                        }
                    };

                    // 4.9.11 Probability of Ignition (POI) - Simplified Lookup (API 581 Table 4.1 approx)
                    const getProbIgnition = (rate, isGas) => {
                        // Rate in lb/s
                        if (isGas) {
                            if (rate < 1) return 0.01;
                            if (rate < 10) return 0.07;
                            if (rate < 100) return 0.30;
                            return 0.80;
                        } else {
                            // Liquid
                            if (rate < 1) return 0.01;
                            if (rate < 10) return 0.03;
                            if (rate < 100) return 0.07;
                            return 0.15; // Assume High Flashpoint liquid for conservative or standard Level 1? 
                            // Actually Level 1 distinction is often just Liquid/Gas.
                        }
                    };

                    // Storage for weighted calc
                    let totalToxAreaWeighted = 0;

                    if (ToxicFluids.includes(selectedLabel)) {
                        const isGasState = finalPhase === 'Gas';

                        // 4.9.13 Mitigation
                        // Applying mitigation factor to rate/mass if applicable
                        // Step 4.9.13 says: "Effectiveness ... accounted for by reducing the release rate..."
                        // If mitFactor > 0 (e.g. from Water Spray), we reduce rate.
                        // We use the same mitFactor as Flammable (Step 4.8) for now.
                        // mitFactor = 0.2 means 20% reduction? Or factor is reduction?
                        // Logic in 4.8: mitMult = 1.0 - mitFactor.
                        // So if mitFactor=0.9 (90% efficient), mult=0.1.
                        const mitMult = 1.0 - mitFactor;

                        const calcToxStep = (suffix, Wn, dn, ldMaxMinutes, gffVal) => {
                            // Apply Mitigation to Rate (Step 4.9.13)
                            const WnMitigated = Wn * mitMult;

                            // Calc Area
                            updateToxicTable(suffix, WnMitigated, dn, 0, isGasState, ldMaxMinutes);

                            // Retrieve calculated value from UI (or we could just return it from function)
                            const el = document.getElementById(`val_ca_tox${suffix}`);
                            let caTox = 0;
                            if (el && el.textContent !== "-" && !isNaN(parseFloat(el.textContent))) {
                                caTox = parseFloat(el.textContent);
                            }

                            // Step 4.9.11: Probability of Toxic Event = (1 - P_ign)
                            // We need P_ign for this release rate.
                            // Using Unmitigated rate for P_ign lookup? 
                            // API 581 usually uses the release rate to determine POI.
                            // Conservative: Use unmitigated rate for POI (higher probability of ignition -> lower toxic prob).
                            // But effectively we want the *Toxic Risk*. 
                            // Let's use WnMitigated for consistency if we assume mitigation works.
                            // However, standard usually calculates POI based on the event magnitude.
                            // I will use WnMitigated.
                            const poi = getProbIgnition(WnMitigated, isGasState);
                            const probToxic = 1.0 - poi;

                            totalToxAreaWeighted += caTox * gffVal * probToxic;
                        };

                        calcToxStep('1', Wn1, d1, ld1, gffs.small);
                        calcToxStep('2', Wn2, d2, ld2, gffs.medium);
                        calcToxStep('3', Wn3, d3, ld3, gffs.large);
                        calcToxStep('4', Wn4, d4, ld4, gffs.rupture);
                    }

                    // Final Toxic Area (Weighted)
                    const finalToxArea = (totalGffSum > 0) ? (totalToxAreaWeighted / totalGffSum) : 0;
                    if (document.getElementById('val_final_tox_area')) {
                        document.getElementById('val_final_tox_area').textContent = finalToxArea.toFixed(1);
                    }

                    updateFinalRelease('1', Wn1, W_max8, massComp, massInv, factDi, ld1, d1, gffs.small);
                    updateFinalRelease('2', Wn2, W_max8, massComp, massInv, factDi, ld2, d2, gffs.medium);
                    updateFinalRelease('3', Wn3, W_max8, massComp, massInv, factDi, ld3, d3, gffs.large);
                    updateFinalRelease('4', Wn4, W_max8, massComp, massInv, factDi, ld4, d4, gffs.rupture);

                    // --- STEP 4.11: Final Consequence Areas ---
                    // Normalize totals
                    const normCmd = (totalGffSum > 0) ? finalCmdTotal / totalGffSum : 0;
                    const normInjFlam = (totalGffSum > 0) ? finalInjTotal / totalGffSum : 0;
                    const normInjTox = finalToxArea; // already normalized

                    // Eq 3.80: Final Personnel Injury Area = Max(Flam, Tox, NonFlam)
                    // Note: normInjFlam contains either Flammable OR NonFlammable result based on fluid type.
                    const finalInjArea = Math.max(normInjFlam, normInjTox);

                    // Eq 3.81: Final Consequence Area = Max(Cmd, Inj)
                    const finalCofArea = Math.max(normCmd, finalInjArea);

                    // Update Existing Fields
                    if (document.getElementById('val_cmd_total')) document.getElementById('val_cmd_total').textContent = normCmd.toFixed(2);
                    if (document.getElementById('val_inj_total')) document.getElementById('val_inj_total').textContent = normInjFlam.toFixed(2);
                    if (document.getElementById('val_tox_total')) document.getElementById('val_tox_total').textContent = normInjTox.toFixed(2);

                    // Update New Final Summary Fields (Step 4.11)
                    if (document.getElementById('val_final_cmd_summary')) document.getElementById('val_final_cmd_summary').textContent = normCmd.toFixed(2);
                    if (document.getElementById('val_final_inj_summary')) document.getElementById('val_final_inj_summary').textContent = finalInjArea.toFixed(2);
                    if (document.getElementById('val_final_cof_area')) document.getElementById('val_final_cof_area').textContent = finalCofArea.toFixed(2);

                    // Reveal 4.11 Final Summary Card
                    const summaryCard = document.getElementById('final_consequence_areas_card');
                    if (summaryCard) summaryCard.classList.remove('hidden');

                    // Reveal 4.12 Financial Consequence Card if 4.11 is done (implied by execution here)
                    const financialCard = document.getElementById('financial_consequence_card');
                    if (financialCard) financialCard.classList.remove('hidden');

                    // --- STEP 4.12.2: Component Damage Cost (Eq 3.83) ---
                    // Need selected component type to get Hole Costs
                    // compObj is already declared earlier in the function

                    // Material & Cost Factor
                    const elMat = document.getElementById('select_material_cost');
                    const matFactor = elMat ? parseFloat(elMat.value) : 1.0;

                    const elCostFactor = document.getElementById('input_cost_factor');
                    const costFactor = elCostFactor ? parseFloat(elCostFactor.value) : 1.0;

                    let fc_cmd = 0;
                    if (compObj && compObj.gff) {
                        // Resolve Cost Key (handle "HEXSS, HEXTS")
                        // Resolve Cost Key
                        // Resolve Cost Key
                        let costKey = componentLabel ? componentLabel.split(',')[0].trim().toUpperCase() : '';

                        // Special handling for Pipes (Cost depends on Diameter, not just GFF group)
                        if (compObj.equipmentType === 'Pipe') {
                            const dVal = parseFloat(inputDiameter.value);
                            if (!isNaN(dVal)) {
                                if (dVal <= 1.5) costKey = 'PIPE-1';
                                else if (dVal <= 3) costKey = 'PIPE-2';
                                else if (dVal <= 5) costKey = 'PIPE-4';
                                else if (dVal <= 7) costKey = 'PIPE-6';
                                else if (dVal <= 9) costKey = 'PIPE-8';
                                else if (dVal <= 11) costKey = 'PIPE-10';
                                else if (dVal <= 14) costKey = 'PIPE-12';
                                else if (dVal <= 16) costKey = 'PIPE-16';
                                else costKey = 'PIPEGT16';
                            } else {
                                // Default fallback if no diameter
                                if (costKey === 'PIPE-8+') costKey = 'PIPE-8';
                            }
                        } else if (costKey === 'PIPE-8+') {
                            // Fallback for PIPE-8+ if logic above missed somehow
                            costKey = 'PIPE-8';
                        }

                        // Fallback for generic keys that need specific mapping
                        if (costKey === 'DRUM' || costKey === 'KODRUM') {
                            // Check table4_15_16.js to see if DRUM/KODRUM exists or if it needs specific sizing
                            // Based on viewed file, DRUM and KODRUM exist directly.
                        }

                        // Fix for Tank Courses mismatch
                        if (costKey === 'COURSE-1-10') costKey = 'COURSES-10';

                        // Fix for FinFan mismatch
                        if (costKey === 'FINFAN TUBES') costKey = 'FINFAN_TUBE';

                        const holeCosts = ComponentCostData[costKey];

                        if (holeCosts) {
                            // Eq 3.83 Numerator sum
                            // gff_n * holecost_n
                            let numSum = 0;
                            numSum += compObj.gff.small * (holeCosts.small || 0);
                            numSum += compObj.gff.medium * (holeCosts.medium || 0);
                            numSum += compObj.gff.large * (holeCosts.large || 0);
                            numSum += compObj.gff.rupture * (holeCosts.rupture || 0);

                            // Divide by gffTotal
                            if (compObj.gffTotal > 0) {
                                fc_cmd = (numSum / compObj.gffTotal) * matFactor * costFactor;
                            }
                        }
                    }

                    if (document.getElementById('val_fc_cmd')) {
                        document.getElementById('val_fc_cmd').textContent = `$ ${fc_cmd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }

                    // --- STEP 4.12.3: Affected Area Cost (Eq 3.84) ---
                    // FC_affa = CA_cmd * equipcost
                    const elEquipCost = document.getElementById('input_equipcost');
                    const equipCost = elEquipCost ? parseFloat(elEquipCost.value) : 0;

                    // Use normCmd (Final Component Damage Area calculated in 4.11)
                    const fc_affa = normCmd * equipCost;

                    if (document.getElementById('val_fc_affa')) {
                        document.getElementById('val_fc_affa').textContent = `$ ${fc_affa.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }

                    // --- STEP 4.12.4: Production Loss Cost (Eq 3.87) ---
                    // Outage_cmd (Eq 3.85)
                    const outageData = ComponentOutageData[componentLabel ? componentLabel.split(',')[0].trim() : ''];
                    let outage_cmd = 0;

                    const elOutageMult = document.getElementById('input_outage_mult');
                    const outageMult = elOutageMult ? parseFloat(elOutageMult.value) : 1.0;

                    const elProdCost = document.getElementById('input_prodcost');
                    const prodCost = elProdCost ? parseFloat(elProdCost.value) : 0;

                    if (outageData && compObj && compObj.gffTotal > 0) {
                        // Sum gff_n * Outage_n
                        let numSum = 0;
                        // Outage Data keys: small, medium, large, rupture
                        // GFF keys: small, medium, large, rupture
                        numSum += compObj.gff.small * (outageData.small || 0);
                        numSum += compObj.gff.medium * (outageData.medium || 0);
                        numSum += compObj.gff.large * (outageData.large || 0);
                        numSum += compObj.gff.rupture * (outageData.rupture || 0);

                        outage_cmd = (numSum / compObj.gffTotal) * outageMult;
                    }

                    // Outage_affa (Eq 3.86)
                    // Outage_affa = 10^(1.242 + 0.585 * log10(FC_affa * 1e-6))
                    let outage_affa = 0;
                    if (fc_affa > 0) {
                        const logTerm = Math.log10(fc_affa * 1e-6);
                        const exponent = 1.242 + 0.585 * logTerm;
                        outage_affa = Math.pow(10, exponent);
                    }

                    // FC_prod (Eq 3.87)
                    const fc_prod = (outage_cmd + outage_affa) * prodCost;

                    if (document.getElementById('val_fc_prod')) {
                        document.getElementById('val_fc_prod').textContent = `$ ${fc_prod.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }

                    // --- Calculate Population Density (Eq 3.93, 3.94) ---
                    // Before FC_inj, calculate popId value based on calculator inputs
                    const elUnitArea = document.getElementById('input_unit_area');
                    const unitArea = elUnitArea ? parseFloat(elUnitArea.value) : 10000;

                    let persAvg = 0;
                    for (let i = 1; i <= 3; i++) {
                        const elPers = document.getElementById(`input_pers_${i}`);
                        const elTime = document.getElementById(`input_time_${i}`);
                        if (elPers && elTime) {
                            const p = parseFloat(elPers.value) || 0; // use 0 if empty
                            const t = parseFloat(elTime.value) || 0;
                            persAvg += p * (t / 100);
                        }
                    }

                    const calculatedPopDens = (unitArea > 0) ? (persAvg / unitArea) : 0;

                    // Update the readonly input
                    const elPopDensInput = document.getElementById('input_popdens');
                    if (elPopDensInput) {
                        // Limit precision to avoid long decimals
                        elPopDensInput.value = calculatedPopDens;//.toExponential(4); or just number?
                        // User might prefer standard notation if small? 0.0002
                        // If very small, exp is better. Let's use standard for now or simple string
                        // But wait, the loop runs ON CHANGE. 
                        // If I set .value, the next lines read it.
                        // Eq 3.93 result is persAvg. Eq 3.94 is Density.
                    }

                    // --- STEP 4.12.5: Personnel Injury Cost (Eq 3.88) ---
                    // FC_inj = CA_inj * popdens * injcost
                    const popDens = calculatedPopDens; // Use calculated value directly

                    const elInjCost = document.getElementById('input_injcost');
                    const injCost = elInjCost ? parseFloat(elInjCost.value) : 0;

                    // CA_inj is finalInjArea calculated in Step 4.11
                    const fc_inj = finalInjArea * popDens * injCost;

                    if (document.getElementById('val_fc_inj')) {
                        document.getElementById('val_fc_inj').textContent = `$ ${fc_inj.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }

                    // --- STEP 4.12.6: Environmental Cleanup Cost (Eq 3.91) ---
                    // FC_environ = (Sum(gff * vol_env) / gffTotal) * envcost
                    // Sum(gff*vol_env) is volEnvTotal

                    const elEnvCost = document.getElementById('input_envcost');
                    const envCost = elEnvCost ? parseFloat(elEnvCost.value) : 0;

                    let fc_environ = 0;
                    if (totalGffSum > 0) {
                        fc_environ = (volEnvTotal / totalGffSum) * envCost;
                    }

                    // Show warning if NBP < 200F (Cost 0 applied)
                    const envMsg = document.getElementById('env_cost_msg');
                    if (envMsg) {
                        if (nbpF < 200) envMsg.parentNode.classList.remove('hidden');
                        else envMsg.parentNode.classList.add('hidden');
                    }

                    if (document.getElementById('val_fc_environ')) {
                        document.getElementById('val_fc_environ').textContent = `$ ${fc_environ.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }

                    // --- STEP 4.12.7: Final Total Financial Consequence (FC) ---
                    // FC = FC_cmd + FC_affa + FC_prod + FC_inj + FC_environ
                    const fc_total = fc_cmd + fc_affa + fc_prod + fc_inj + fc_environ;

                    if (document.getElementById('val_fc_total')) {
                        document.getElementById('val_fc_total').textContent = `$ ${fc_total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }

                    // Reveal 4.13 Safety Consequence Card
                    const safetyCard = document.getElementById('safety_consequence_card');
                    if (safetyCard) safetyCard.classList.remove('hidden');

                    // --- STEP 4.13: Safety Consequence (Eq 3.92) ---

                    // --- STEP 4.13: Safety Consequence (Eq 3.92) ---
                    // Cf_inj = CA_inj_final * popdens
                    // popdens is already defined (popDens) for FC_inj calculation.
                    // finalInjArea is CA_inj_final

                    const cf_inj = finalInjArea * popDens;

                    // Display 4.13
                    if (document.getElementById('val_c_f_inj')) {
                        document.getElementById('val_c_f_inj').textContent = cf_inj.toFixed(4);
                    }
                }
            } else {
                if (fluidInvCard) fluidInvCard.classList.add('hidden');
            }

        } else {
            if (holeSizesContainer) holeSizesContainer.classList.add('hidden');
        }
    }

    // --- EVENT LISTENERS ---
    const addListener = (id, event) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, updateDisplay);
    };

    if (selectFluid) selectFluid.addEventListener('change', updateDisplay);
    if (selectPhase) selectPhase.addEventListener('change', updateDisplay);
    addListener('input_temperature', 'input');
    addListener('input_diameter', 'input');
    addListener('select_component_type', 'change');

    // Liquid Inputs
    ['input_ps', 'input_patm', 'input_cd', 'input_kvn'].forEach(id => addListener(id, 'input'));

    // Gas Inputs
    ['input_ps_vap', 'input_patm_vap', 'input_cd_vap', 'input_c2_vap'].forEach(id => addListener(id, 'input'));

    ['input_mass_inv', 'input_mass_comp'].forEach(id => addListener(id, 'input'));
    addListener('input_mfrac_tox', 'input');

    // Financial Inputs (Step 4.12)
    addListener('select_material_cost', 'change');
    addListener('input_cost_factor', 'input');
    addListener('input_equipcost', 'input');
    addListener('input_prodcost', 'input');
    addListener('input_outage_mult', 'input');
    // detailed popdens inputs
    addListener('input_unit_area', 'input');
    ['input_pers_1', 'input_time_1', 'input_pers_2', 'input_time_2', 'input_pers_3', 'input_time_3'].forEach(id => addListener(id, 'input'));

    addListener('input_injcost', 'input');
    addListener('input_envcost', 'input');

    // Mitigation
    addListener('select_detection', 'change');
    addListener('select_isolation', 'change');
    addListener('select_mitigation', 'change');

    // Initial call
    updateDisplay();
});
