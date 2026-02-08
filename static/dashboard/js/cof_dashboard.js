import { RepresentativeFluids } from '../../formula_app/data/cof/table4_1_1.js';
import { FluidProperties } from '../../formula_app/data/cof/table4_1_2.js';
import ComponentGFFs from '../../formula_app/data/cof/gff_table_3_1.js';
import { getReductionFactor, getLeakDuration } from '../../formula_app/data/cof/table4_6_7.js';
import { MitigationSystems, SteamConstants, AcidConstants } from '../../formula_app/data/cof/table4_8_9_10.js';
import { calcFlammableCA } from '../../formula_app/js/cof_level_1_4_8.js';
import { ComponentCostData, MaterialCostFactors } from '../../formula_app/data/cof/table4_15_16.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    // Mapping to user-visible fields in "Operating & Process" / "Design" tabs
    const selectFluid = document.getElementById('id_rbix_fluid'); // User Selection
    const selectPhase = document.getElementById('id_operational_fluid_phase');
    const inputTemperature = document.getElementById('id_operating_temp_f');
    const inputDiameter = document.getElementById('id_component_diameter'); // "Size Diameter (inches)"
    const selectComponent = document.getElementById('id_rbix_component_type'); // "RBIX Component Type"

    // Pressure & Release
    const inputPs = document.getElementById('id_operating_pressure_psia'); // "Operating Pressure"
    const inputPatm = document.getElementById('id_atm_pressure');
    const inputCd = document.getElementById('id_discharge_coeff');
    const inputKvn = document.getElementById('id_viscosity_correction');

    // Inventory
    const inputMassInv = document.getElementById('id_component_group_fluid_mass_lb');
    const inputMassComp = document.getElementById('id_component_fluid_mass_lb');

    // Mitigation
    const selectDetection = document.getElementById('id_detection_class');
    const selectIsolation = document.getElementById('id_isolation_class');
    const selectMitigation = document.getElementById('id_mitigation_system');

    // Financial Inputs ("Data" tab)
    const selectMaterialConstruction = document.getElementById('id_material_construction');
    const inputCostFactor = document.getElementById('id_cost_factor');
    const inputEquipCost = document.getElementById('id_equipment_cost_per_sqft');
    const inputInjCost = document.getElementById('id_injury_cost_per_person');
    const inputEnvCost = document.getElementById('id_environmental_cost_per_bbl');
    const inputProdCost = document.getElementById('id_production_cost_per_day');
    const inputOutageMult = document.getElementById('id_outage_multiplier');

    // Validation Elements
    const alertContainer = document.getElementById('cof-validation-alert');
    const missingList = document.getElementById('cof-missing-fields-list');

    // Chart Globals
    let cofChart = null;


    function validateInputs() {
        let missing = [];

        if (!selectFluid || !selectFluid.value) missing.push("RBIX Fluid");
        if (!inputTemperature || isNaN(parseFloat(inputTemperature.value))) missing.push("Operating Temperature");
        if (!inputDiameter || isNaN(parseFloat(inputDiameter.value)) || parseFloat(inputDiameter.value) <= 0) missing.push("Size Diameter (inches)");
        if (!selectComponent || !selectComponent.value) missing.push("RBIX Component Type");
        if (!inputPs || isNaN(parseFloat(inputPs.value))) missing.push("Operating Pressure");

        // Phase check
        if (selectPhase && !selectPhase.value) missing.push("Operational Fluid Phase");

        if (missing.length > 0) {
            if (alertContainer && missingList) {
                missingList.innerHTML = missing.map(f => `<span class="badge badge-error gap-2 mr-2 mb-2">${f}</span>`).join('');
                alertContainer.classList.remove('hidden');
                alertContainer.classList.add('flex');
            }
            return false;
        } else {
            if (alertContainer) {
                alertContainer.classList.add('hidden');
                alertContainer.classList.remove('flex');
            }
            return true;
        }
    }


    // --- MAIN CALCULATION FUNCTION ---
    function updateDashboardCOF() {
        // Gather Basic Inputs (Safe defaults for display)
        const selectedLabel = selectFluid ? selectFluid.value : '-';
        const phase = selectPhase ? selectPhase.value : '-';
        const tempF = inputTemperature && inputTemperature.value ? parseFloat(inputTemperature.value) : null;
        const Ps = inputPs && inputPs.value ? parseFloat(inputPs.value) : null;
        const d_input = inputDiameter && inputDiameter.value ? parseFloat(inputDiameter.value) : 0;

        // --- 1. ALWAYS UPDATE DEBUG DISPLAY WITH AVAILABLE DATA ---
        setText('debug_fluid_name', selectedLabel);
        setText('debug_op_phase', phase);
        setText('debug_temp', tempF);
        setText('debug_ps', Ps);

        // Fluid Props
        let props = null;
        if (selectedLabel && FluidProperties[selectedLabel]) {
            props = FluidProperties[selectedLabel];
            setText('debug_mw', props.mw);
            setText('debug_density', props.liquid_density);
            setText('debug_nbp', props.nbp);
            setText('debug_amb_state', props.ambient_state);
            setText('debug_ait', props.ait);
        } else {
            setText('debug_mw', '-');
            setText('debug_density', '-');
            setText('debug_nbp', '-');
            setText('debug_amb_state', '-');
            setText('debug_ait', '-');
        }

        // Phase Determination Display
        let finalPhase = 'Gas'; // Default
        if (props) {
            const nbp = props.nbp || 0;
            const ambientState = props.ambient_state || 'Gas';

            if (phase === 'Vapor' || phase === 'Gas') {
                finalPhase = 'Gas';
            } else if (phase === 'Liquid') {
                if (ambientState === 'Gas') {
                    finalPhase = (nbp > 80) ? 'Liquid' : 'Gas';
                } else {
                    finalPhase = 'Liquid';
                }
            } else if (phase === 'Two-Phase') {
                finalPhase = (nbp > 80) ? 'Liquid' : 'Gas';
            }
            setText('debug_final_phase', finalPhase);
        } else {
            setText('debug_final_phase', '-');
        }

        // Diameter Display
        let d = [0, 0, 0, 0];
        if (d_input > 0) {
            d[0] = Math.min(d_input, 0.25);
            d[1] = Math.min(d_input, 1);
            d[2] = Math.min(d_input, 4);
            d[3] = Math.min(d_input, 16);
            setText('debug_d1', d[0].toFixed(2));
            setText('debug_d2', d[1].toFixed(2));
            setText('debug_d3', d[2].toFixed(2));
            setText('debug_d4', d[3].toFixed(2));
        } else {
            setText('debug_d1', '-');
            setText('debug_d2', '-');
            setText('debug_d3', '-');
            setText('debug_d4', '-');
        }

        // Flow Regime Debug
        let flowRegime = '-';
        if (props && Ps !== null && tempF !== null) {
            const Patm = (inputPatm && inputPatm.value) ? parseFloat(inputPatm.value) : 14.7;
            if (finalPhase === 'Liquid' && Ps > 0) {
                flowRegime = 'Liquid Flow';
            } else if (finalPhase === 'Gas' && Ps > 0) {
                const MW = props.mw;
                const k = 1.4;
                const termK = k / (k - 1);
                const Ptrans = Patm * Math.pow((k + 1) / 2, termK); // Ptrans check
                flowRegime = (Ps > Ptrans) ? 'Sonic' : 'Subsonic';
            }
            setText('debug_regime', flowRegime);
        } else {
            setText('debug_regime', '-');
        }


        // --- 2. VALIDATION CHECK FOR CALCULATION ---
        if (!validateInputs()) {
            // Zero out chart and downstream debugs
            updateChart(0, 0, 0, 0);
            // Clear other specific specific calculated fields if needed
            return;
        }

        // --- 3. FULL CALCULATION (If Validation Passed) ---
        if (!props) return;

        const diameter = d_input;
        const componentCode = selectComponent ? selectComponent.value : null;

        // GFF Logic
        let gff = [0, 0, 0, 0];
        let gffTotal = 0;
        if (componentCode) {
            const compData = ComponentGFFs.find(c => c.componentType === componentCode);
            if (compData) {
                gff = [compData.gff.small, compData.gff.medium, compData.gff.large, compData.gff.rupture];
                gffTotal = compData.gffTotal;
            }
        }

        // Release Rates
        let Wn = [0, 0, 0, 0];
        const Patm = (inputPatm && inputPatm.value) ? parseFloat(inputPatm.value) : 14.7;
        const Cd = (inputCd && inputCd.value) ? parseFloat(inputCd.value) : 0.61;

        let calcWn = (dn) => 0;

        if (finalPhase === 'Liquid' && Ps > 0) {
            const rho_l = props.liquid_density || 62.4;
            const Kvn = (inputKvn && inputKvn.value) ? parseFloat(inputKvn.value) : 1.0;
            const gc = 32.2; //Valor real: 32.174, valor según API 581: 32.2
            calcWn = (dn) => {
                const An = (Math.PI * Math.pow(dn, 2) / 4) / 144; // ft2
                const dP = Math.max(0, (Ps - Patm) * 144);
                return Cd * Kvn * An * Math.sqrt(2 * rho_l * gc * dP);
            };
        } else if (finalPhase === 'Gas' && Ps > 0) {
            const MW = props.mw;
            const k = 1.4;
            const R_gas = 1545.3;
            const Ts_R = (tempF || 70) + 459.67;
            const gc = 32.2; //Valor real: 32.174, valor según API 581: 32.2
            const termK = k / (k - 1);
            const Ptrans = Patm * Math.pow((k + 1) / 2, termK);
            const isSonic = Ps > Ptrans;

            calcWn = (dn) => {
                const An = Math.PI * Math.pow(dn, 2) / 4; // in2
                if (isSonic) {
                    const term1 = (k * MW * gc) / (R_gas * Ts_R);
                    const term2 = Math.pow(2 / (k + 1), (k + 1) / (k - 1));
                    return Cd * An * Ps * Math.sqrt(term1 * term2);
                } else {
                    const term1 = (MW * gc) / (R_gas * Ts_R);
                    const term2 = (2 * k) / (k - 1);
                    const pr = Patm / Ps;
                    if (pr >= 1) return 0;
                    const term3 = Math.pow(pr, 2 / k);
                    const term4 = 1 - Math.pow(pr, (k - 1) / k);
                    return Cd * An * Ps * Math.sqrt(term1 * term2 * term3 * term4);
                }
            };
        }

        Wn = d.map(dn => calcWn(dn));

        setText('debug_wn1', Wn[0].toFixed(2));
        setText('debug_wn2', Wn[1].toFixed(2));
        setText('debug_wn3', Wn[2].toFixed(2));
        setText('debug_wn4', Wn[3].toFixed(2));

        if (document.getElementById('val_wn1')) document.getElementById('val_wn1').textContent = Wn[0].toFixed(2);


        // Consequence Areas & Financials
        let totalCmd = 0;
        let totalInj = 0;

        let FC_cmd = 0;
        let FC_inj = 0;
        let FC_env = 0;
        let FC_prod = 0;
        // Inputs for Financials
        // API 581 Table 4.16: Material Cost Factors (multipliers)
        const materialName = selectMaterialConstruction ? selectMaterialConstruction.value : 'Carbon Steel';
        const materialFactor = MaterialCostFactors[materialName] || 1.0; // Table 4.16 multiplier
        const costFactor = inputCostFactor ? parseFloat(inputCostFactor.value) : 1.0; // CFAC adjustment

        const equipCostPerSqFt = inputEquipCost ? parseFloat(inputEquipCost.value) : 0;
        const injCostPerPerson = inputInjCost ? parseFloat(inputInjCost.value) : 0; // Serious Injury Cost
        const envCostPerBbl = inputEnvCost ? parseFloat(inputEnvCost.value) : 0;
        const prodCostPerDay = inputProdCost ? parseFloat(inputProdCost.value) : 0;
        const shutdownDays = inputOutageMult ? parseFloat(inputOutageMult.value) : 0;

        // Loop Holes
        const W_max8 = calcWn(Math.min(diameter, 8.0));
        const massInv = inputMassInv ? parseFloat(inputMassInv.value) : 0;
        const massComp = inputMassComp ? parseFloat(inputMassComp.value) : 0;

        const detClass = selectDetection ? selectDetection.value : 'C';
        const isoClass = selectIsolation ? selectIsolation.value : 'C';
        const factDi = getReductionFactor(detClass, isoClass);
        const mitKey = selectMitigation ? selectMitigation.value : 'None';
        const mitFactor = MitigationSystems[mitKey] ? MitigationSystems[mitKey].factor : 0.0;
        const tempR = (tempF || 70) + 459.67;

        setText('debug_factdi', factDi.toFixed(2));

        let massAvailDebug = 0;

        for (let i = 0; i < 4; i++) {
            // if (gff[i] <= 0) { console.log('gff[i] <= 0', gff[i]); continue; }

            const rateN = Wn[i] * (1.0 - factDi);
            setText('debug_raten' + (i + 1), rateN.toFixed(2));

            if (rateN <= 0) {
                console.log('rateN <= 0', rateN);
                const errEl = document.getElementById('debug_rtype' + (i + 1));
                if (errEl) errEl.textContent = 'Err:Rate0';
                continue;
            }

            // Release Type Logic (API 581)
            // d <= 0.25 inch -> Continuous
            // Releasing > 10,000 lbs in 3 minutes (> 55.56 lb/s) -> Instantaneous
            let rTypeS = "Continuous";
            if (d[i] <= 0.25) {
                rTypeS = "Continuous";
            } else if (rateN > 55.56) {
                rTypeS = "Instantaneous";
            }
            setText('debug_rtype' + (i + 1), rTypeS);

            const ldMaxMin = getLeakDuration(detClass, isoClass, d[i]);
            const ldMaxSec = 60 * ldMaxMin;

            const massAdd = 180 * Math.min(rateN, W_max8);
            const massAvail = Math.min(massComp + massAdd, massInv || (massComp + massAdd));

            if (i === 0) massAvailDebug = massAvail;

            const ldN = Math.min(massAvail / rateN, ldMaxSec);
            const massN = Math.min(rateN * ldN, massAvail);

            setText('debug_ld' + (i + 1), ldN.toFixed(1));
            setText('debug_massn' + (i + 1), massN.toFixed(1));

            let res = { cmd: 0, inj: 0 };
            const isInst = (d[i] > 0.25 && rateN > 55.6);

            // UI Update for Release Type
            const rTypeEl = document.getElementById('debug_rtype' + (i + 1));
            console.log(`[DEBUG] i=${i}, d=${d[i]}, rateN=${rateN}, isInst=${isInst}, El=${!!rTypeEl}`);
            if (rTypeEl) {
                if (isInst) {
                    rTypeEl.textContent = 'Inst.';
                    rTypeEl.className = 'bg-red-50 text-red-600 font-bold';
                } else {
                    rTypeEl.textContent = 'Cont.';
                    rTypeEl.className = 'bg-green-50 text-green-600 font-bold';
                }
            }

            if (["Steam", "Acid"].includes(selectedLabel)) {
                if (selectedLabel === "Steam" && SteamConstants) {
                    const { C9, C10 } = SteamConstants;
                    res.inj = 0;
                    res.cmd = rateN * C9;
                }
            } else {
                res = calcFlammableCA(selectedLabel, rateN, massN, tempR, mitFactor, finalPhase, isInst);
            }

            setText('debug_cmd' + (i + 1), res.cmd.toFixed(0));
            setText('debug_inj' + (i + 1), res.inj.toFixed(0));

            totalCmd += res.cmd * gff[i];
            totalInj += res.inj * gff[i];

            // --- FINANCIALS ---
            // FC_cmd: Component Damage Cost (API 581 Section 4.12.2)
            // Formula: FC_cmd = Base Cost × Material Factor (Table 4.16) × CFAC
            const cost_cmd_i = res.cmd * equipCostPerSqFt * materialFactor * costFactor;
            FC_cmd += cost_cmd_i * gff[i];

            const popDensity = 0.002;
            const cost_inj_i = res.inj * popDensity * injCostPerPerson;
            FC_inj += cost_inj_i * gff[i];

            const cost_env_i = massN * 0.005 * envCostPerBbl;
            FC_env += cost_env_i * gff[i];

            const cost_prod_i = (d[i] > 0.25) ? (shutdownDays * prodCostPerDay) : 0;
            FC_prod += cost_prod_i * gff[i];
        }

        setText('debug_mass_avail', massAvailDebug.toFixed(1));

        // Normalization
        if (gffTotal > 0) {
            totalCmd /= gffTotal;
            totalInj /= gffTotal;
            FC_cmd /= gffTotal;
            FC_inj /= gffTotal;
            FC_env /= gffTotal;
            FC_prod /= gffTotal;
        }

        const FC_bus = FC_cmd + FC_prod; // Business
        const FC_total = FC_bus + FC_inj + FC_env;

        // UI Update
        if (document.getElementById('val_final_cmd')) document.getElementById('val_final_cmd').textContent = totalCmd.toFixed(0);
        if (document.getElementById('val_final_inj')) document.getElementById('val_final_inj').textContent = totalInj.toFixed(0);
        if (document.getElementById('val_final_cof')) document.getElementById('val_final_cof').textContent = Math.max(totalCmd, totalInj).toFixed(0);

        // Financials (Consequences Tab)
        if (document.getElementById('val_fc_inj')) document.getElementById('val_fc_inj').textContent = formatCurrency(FC_inj);
        if (document.getElementById('val_fc_env')) document.getElementById('val_fc_env').textContent = formatCurrency(FC_env);
        if (document.getElementById('val_fc_bus')) document.getElementById('val_fc_bus').textContent = formatCurrency(FC_bus);
        if (document.getElementById('val_fc_bus_env')) document.getElementById('val_fc_bus_env').textContent = formatCurrency(FC_bus + FC_env); // As per image label
        if (document.getElementById('val_fc_total')) document.getElementById('val_fc_total').textContent = formatCurrency(FC_total);

        // --- PERSISTENCE: Write to Hidden Inputs for Database Storage ---
        const calcCofInput = document.getElementById('id_calculated_cof');
        if (calcCofInput) {
            calcCofInput.value = FC_total.toFixed(2);
            console.log('[COF Persistence] Wrote CoF to hidden input:', FC_total.toFixed(2));
        } else {
            console.warn('[COF Persistence] Hidden input id_calculated_cof not found!');
        }

        const finalCA = Math.max(totalCmd, totalInj);
        const calcCaInput = document.getElementById('id_calculated_consequence_area');
        if (calcCaInput) {
            calcCaInput.value = finalCA.toFixed(4);
            console.log('[COF Persistence] Wrote CA to hidden input:', finalCA.toFixed(4));
        } else {
            console.warn('[COF Persistence] Hidden input id_calculated_consequence_area not found!');
        }

        updateChart(FC_inj, FC_bus, FC_env, FC_total);

        // Update Risk Matrix if it exists (so it shows latest COF values)
        if (typeof updateRiskMatrix === 'function') {
            setTimeout(() => updateRiskMatrix(), 100);
        }
    }

    function formatCurrency(val) {
        return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        // Or just number: val.toFixed(2)
    }

    // --- CHART.JS RENDER ---
    function updateChart(safety, business, environment, total) {
        const ctx = document.getElementById('cofChart');
        if (!ctx) return;

        if (cofChart) {
            cofChart.data.datasets[0].data = [safety, business, environment, total];
            cofChart.update();
        } else {
            // Check if Chart is defined
            if (typeof Chart === 'undefined') return;

            cofChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Safety', 'Business', 'Environment', 'Total'],
                    datasets: [{
                        label: 'Consequence ($)',
                        data: [safety, business, environment, total],
                        backgroundColor: [
                            'rgba(249, 115, 22, 0.8)', // Orange (Safety)
                            'rgba(234, 179, 8, 0.8)',  // Yellow (Business)
                            'rgba(34, 197, 94, 0.8)',  // Green (Env)
                            'rgba(168, 85, 247, 0.8)'  // Purple (Total)
                        ],
                        borderColor: [
                            'rgba(249, 115, 22, 1)',
                            'rgba(234, 179, 8, 1)',
                            'rgba(34, 197, 94, 1)',
                            'rgba(168, 85, 247, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Consequence ($)'
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Consequence Summary' }
                    }
                }
            });
        }
    }


    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val !== null && val !== undefined ? val : '-';
    }

    // --- LISTENERS ---
    // List all inputs that affect calc
    const inputs = [
        selectFluid, selectPhase, inputTemperature, inputDiameter, selectComponent,
        inputPs, inputPatm, inputCd, inputKvn,
        inputMassInv, inputMassComp,
        selectDetection, selectIsolation, selectMitigation,
        selectMaterialConstruction, inputCostFactor,
        inputEquipCost, inputInjCost, inputEnvCost, inputProdCost, inputOutageMult
    ];

    inputs.forEach(el => {
        if (el) {
            el.addEventListener('change', updateDashboardCOF);
            el.addEventListener('input', updateDashboardCOF);
        }
    });

    // Initial Calculation
    setTimeout(updateDashboardCOF, 500); // Small delay to ensure Chart.js loaded
});
