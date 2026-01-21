import { RepresentativeFluids } from '../../formula_app/data/cof/table4_1_1.js';
import { FluidProperties } from '../../formula_app/data/cof/table4_1_2.js';
import ComponentGFFs from '../../formula_app/data/cof/gff_table_3_1.js';
import { getReductionFactor, getLeakDuration } from '../../formula_app/data/cof/table4_6_7.js';
import { MitigationSystems, SteamConstants, AcidConstants } from '../../formula_app/data/cof/table4_8_9_10.js';
import { calcFlammableCA } from '../../formula_app/js/cof_level_1_4_8.js';

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
    const inputMassInv = document.getElementById('id_inventory_group_mass');
    const inputMassComp = document.getElementById('id_component_mass');

    // Mitigation
    const selectDetection = document.getElementById('id_detection_class');
    const selectIsolation = document.getElementById('id_isolation_class');
    const selectMitigation = document.getElementById('id_mitigation_system');

    // Financial Inputs ("Data" tab)
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
        // Run validation first
        if (!validateInputs()) {
            // Zero out chart
            updateChart(0, 0, 0, 0);
            return;
        }

        if (!selectFluid) return;

        // 1. Gather Basic Inputs
        const selectedLabel = selectFluid.value;
        const phase = selectPhase ? selectPhase.value : null;
        const tempF = inputTemperature ? parseFloat(inputTemperature.value) : NaN;

        if (!selectedLabel) return;
        const props = FluidProperties[selectedLabel];
        if (!props) return;

        // 2. Phase Determination
        let finalPhase = 'Gas';
        const nbp = props.nbp || 0;
        const ambientState = props.ambient_state || 'Gas';

        if (phase === 'Vapor' || phase === 'Gas') { // Handle "Gas" from Op Phase choices
            finalPhase = 'Gas';
        } else if (phase === 'Liquid') {
            if (ambientState === 'Gas') {
                finalPhase = (nbp > 80) ? 'Liquid' : 'Gas';
            } else {
                finalPhase = 'Liquid';
            }
        } else if (phase === 'Two-Phase') {
            // Default COF handling for Two-Phase? Usually max consequence of Liquid/Gas or specific logic.
            // For Level 1, simplified to Liquid if NBP>80 or similar. 
            // Let's assume Liquid for worst case or default logic
            finalPhase = (nbp > 80) ? 'Liquid' : 'Gas';
        }

        // 3. Hole Sizes & GFF
        const diameter = inputDiameter ? parseFloat(inputDiameter.value) : 0;
        const componentCode = selectComponent ? selectComponent.value : null;

        let d = [0, 0, 0, 0]; // d1, d2, d3, d4
        if (diameter > 0) {
            d[0] = Math.min(diameter, 0.25);
            d[1] = Math.min(diameter, 1);
            d[2] = Math.min(diameter, 4);
            d[3] = Math.min(diameter, 16);
        }

        let gff = [0, 0, 0, 0]; // small, medium, large, rupture
        let gffTotal = 0;
        if (componentCode) {
            const compData = ComponentGFFs.find(c => c.componentType === componentCode);
            if (compData) {
                gff = [compData.gff.small, compData.gff.medium, compData.gff.large, compData.gff.rupture];
                gffTotal = compData.gffTotal;
            }
        }

        // 4. Release Rates (Wn)
        let Wn = [0, 0, 0, 0];
        const Ps = inputPs ? parseFloat(inputPs.value) : 0;
        const Patm = (inputPatm && inputPatm.value) ? parseFloat(inputPatm.value) : 14.7;
        const Cd = (inputCd && inputCd.value) ? parseFloat(inputCd.value) : 0.61;

        let calcWn = (dn) => 0; // Default function

        if (finalPhase === 'Liquid' && Ps > 0) {
            const rho_l = props.liquid_density || 62.4;
            const Kvn = (inputKvn && inputKvn.value) ? parseFloat(inputKvn.value) : 1.0;
            const gc = 32.174;
            calcWn = (dn) => {
                const An = (Math.PI * Math.pow(dn, 2) / 4) / 144; // ft2
                const dP = Math.max(0, (Ps - Patm) * 144);
                return Cd * Kvn * An * Math.sqrt(2 * rho_l * gc * dP);
            };
        } else if (finalPhase === 'Gas' && Ps > 0) {
            const MW = props.mw;
            const k = 1.4; // Simplified
            const R_gas = 1545.3;
            const Ts_R = (tempF || 70) + 459.67;
            const gc = 32.174;

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
        // Update Release Rate Display if needed (hidden in current layout)
        if (document.getElementById('val_wn1')) document.getElementById('val_wn1').textContent = Wn[0].toFixed(2);


        // 5. Consequence Areas (CMD, INJ) & Financials
        let totalCmd = 0;
        let totalInj = 0;

        let FC_cmd = 0;
        let FC_inj = 0;
        let FC_env = 0;
        let FC_prod = 0;

        // Inputs for Financials
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

        for (let i = 0; i < 4; i++) {
            if (gff[i] <= 0) continue;

            const rateN = Wn[i] * (1.0 - factDi);
            if (rateN <= 0) continue;

            // Leak Duration / Mass
            const ldMaxMin = getLeakDuration(detClass, isoClass, d[i]);
            const ldMaxSec = 60 * ldMaxMin;

            // Available Mass logic simplified
            const massAdd = 180 * Math.min(rateN, W_max8);
            const massAvail = Math.min(massComp + massAdd, massInv || (massComp + massAdd));

            const ldN = Math.min(massAvail / rateN, ldMaxSec);
            const massN = Math.min(rateN * ldN, massAvail);

            // Area Calc
            let res = { cmd: 0, inj: 0 };
            const isInst = (d[i] > 0.25 && rateN > 55.6); // Instantaneous Primary flag

            if (["Steam", "Acid"].includes(selectedLabel)) {
                // Simplified Steam/Acid
                if (selectedLabel === "Steam" && SteamConstants) {
                    const { C9, C10 } = SteamConstants; // C5 missing in imports? Assuming simplified
                    // Steam usually just CMD = C9*rate + ...
                    res.inj = 0; // Placeholder
                    res.cmd = rateN * C9;
                }
            } else {
                res = calcFlammableCA(selectedLabel, rateN, massN, tempR, mitFactor, finalPhase, isInst);
            }

            // Weighted Sums for Areas
            totalCmd += res.cmd * gff[i];
            totalInj += res.inj * gff[i];

            // --- FINANCIALS ---
            const cost_cmd_i = res.cmd * equipCostPerSqFt;
            FC_cmd += cost_cmd_i * gff[i];

            const popDensity = 0.002; // Placeholder
            const cost_inj_i = res.inj * popDensity * injCostPerPerson;
            FC_inj += cost_inj_i * gff[i];

            const cost_env_i = massN * 0.005 * envCostPerBbl;
            FC_env += cost_env_i * gff[i];

            const cost_prod_i = (d[i] > 0.25) ? (shutdownDays * prodCostPerDay) : 0;
            FC_prod += cost_prod_i * gff[i];

        }

        // --- NORMALIZE RESULTS (Weighted Average) ---
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

        // --- UPDATE UI ---
        // Areas
        if (document.getElementById('val_final_cmd')) document.getElementById('val_final_cmd').textContent = totalCmd.toFixed(0);
        if (document.getElementById('val_final_inj')) document.getElementById('val_final_inj').textContent = totalInj.toFixed(0);
        if (document.getElementById('val_final_cof')) document.getElementById('val_final_cof').textContent = Math.max(totalCmd, totalInj).toFixed(0);

        // Financials (Consequences Tab)
        if (document.getElementById('val_fc_inj')) document.getElementById('val_fc_inj').textContent = formatCurrency(FC_inj);
        if (document.getElementById('val_fc_env')) document.getElementById('val_fc_env').textContent = formatCurrency(FC_env);
        if (document.getElementById('val_fc_bus')) document.getElementById('val_fc_bus').textContent = formatCurrency(FC_bus);
        if (document.getElementById('val_fc_bus_env')) document.getElementById('val_fc_bus_env').textContent = formatCurrency(FC_bus + FC_env); // As per image label
        if (document.getElementById('val_fc_total')) document.getElementById('val_fc_total').textContent = formatCurrency(FC_total);

        // --- CHART UPDATE ---
        updateChart(FC_inj, FC_bus, FC_env, FC_total);
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


    // --- LISTENERS ---
    // List all inputs that affect calc
    const inputs = [
        selectFluid, selectPhase, inputTemperature, inputDiameter, selectComponent,
        inputPs, inputPatm, inputCd, inputKvn,
        inputMassInv, inputMassComp,
        selectDetection, selectIsolation, selectMitigation,
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
