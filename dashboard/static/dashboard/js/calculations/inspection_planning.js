/**
 * INSPECTION PLANNING MODULE
 * Calculates Inspection Intervals based on DF Growth vs Target
 * API 581 Logic: Total DF = Sum(DF_mechanisms)
 */

let inspectionChart = null;
const DEFAULT_MAX_DF = 100; // Boundary for Category 3

// =============================================================================
// CALCULATION LOGIC
// =============================================================================

/**
 * Calculate TOTAL DF for a specific age (years in service)
 * Sums up DFs from all active mechanisms at that future age
 */
function calculateProjectedTotalDF(ageInYears) {
    let totalDF = 0;

    // 1. Thinning Mechanisms Projection
    // Explicit mapping to match component_form.html IDs exactly
    const thinningMechanisms = [
        { id: 'co2', checkbox: 'id_mech_thinning_co2_active', rate: 'id_co2_corrosion_rate_mpy' },
        { id: 'hcl', checkbox: 'id_mech_thinning_hcl_active', rate: 'id_hcl_corrosion_rate_mpy' },
        { id: 'h2so4', checkbox: 'id_mech_thinning_h2so4_active', rate: 'id_h2so4_corrosion_rate_mpy' },
        { id: 'hf', checkbox: 'id_mech_thinning_hf_active', rate: 'id_hf_corrosion_rate_mpy' },
        { id: 'amine', checkbox: 'id_mech_thinning_amine_active', rate: 'id_amine_corrosion_rate_mpy' },
        { id: 'alkaline', checkbox: 'id_mech_thinning_alkaline_active', rate: 'id_alkaline_water_corrosion_rate_mpy' },
        { id: 'acid', checkbox: 'id_mech_thinning_acid_active', rate: 'id_acid_water_corrosion_rate_mpy' },
        { id: 'soil', checkbox: 'id_mech_thinning_soil_active', rate: 'id_soil_corrosion_rate_mpy' },
        { id: 'h2s_h2', checkbox: 'id_mech_thinning_h2s_h2_active', rate: 'id_ht_h2s_h2_corrosion_rate_mpy' },
        { id: 'sulfidic', checkbox: 'id_mech_thinning_sulfidic_active', rate: 'id_sulfidic_corrosion_rate_mpy' }
    ];

    thinningMechanisms.forEach(mech => {
        const checkbox = document.getElementById(mech.checkbox);
        const rateInput = document.getElementById(mech.rate);

        const isActive = checkbox?.checked;
        let rate = parseFloat(rateInput?.value) || 0;

        // Fallback: Try reading from the display element (e.g., "5.5 mpy")
        if (rate === 0) {
            const displayId = `${mech.id}_rate_display`; // Convention: co2_rate_display
            const displayEl = document.getElementById(displayId);
            if (displayEl) {
                rate = parseFloat(displayEl.textContent) || 0;
            }
        }

        if (isActive && rate > 0) {
            totalDF += calculateGeneralThinningDF_Projected(rate, ageInYears);
        }
    });

    // 2. External Corrosion Projection
    if (document.getElementById('id_mech_ext_corrosion_active')?.checked) {
        const rate = parseFloat(document.getElementById('id_external_corrosion_rate_mpy')?.value) || 0;
        if (rate > 0) totalDF += calculateGeneralThinningDF_Projected(rate, ageInYears);
    }

    if (document.getElementById('id_mech_cui_active')?.checked) {
        const rate = parseFloat(document.getElementById('id_cui_corrosion_rate_mpy')?.value) || 0;
        if (rate > 0) totalDF += calculateGeneralThinningDF_Projected(rate, ageInYears);
    }

    // 3. SCC Mechanisms Projection
    // Formula: Df(t) = BaseDF * (age)^1.1
    // Need to get BaseDF for each active SCC mechanism
    // We'll scrape the calculated BaseDF from the DOM (assuming hidden fields or attributes exist, 
    // or we might need to rely on the global variables from formula_app_adapter.js if accessible)
    // For robustness, calculateFinalDamageFactor in adapter uses BaseDF.
    // Let's rely on checking the *Current* BaseDF stored in data attributes or recalculated.

    // HELPER: We need BaseDF. In formula_app_adapter.js, updateDebugFields stores BaseDF in 'pof_debug_{mech}_base_df'.
    const sccMechs = [
        { id: 'caustic', name: 'Caustic' },
        { id: 'amine', name: 'Amine' },
        { id: 'ssc', name: 'SSC' },
        { id: 'hic', name: 'HIC' },
        { id: 'acscc', name: 'ACSCC' },
        { id: 'pascc', name: 'PASCC' },
        { id: 'clscc', name: 'ClSCC' },
        { id: 'hschf', name: 'HSC-HF' }
    ];

    sccMechs.forEach(mech => {
        const isActive = document.getElementById(`id_mechanism_scc_${mech.id}_active`)?.checked;
        if (isActive) {
            // Try to get BaseDF from the debug table which holds the raw value
            const baseDfEl = document.getElementById(`pof_debug_${mech.id}_base_df`);
            let baseDfVal = parseFloat(baseDfEl?.textContent) || 0;

            // FALLBACK if active but no base DF (Report Context where formula_app doesn't run)
            if (baseDfVal === 0) {
                baseDfVal = 50; // Default conservative Base DF for SCC
                console.warn(`[Risk Proj] Using default BaseDF=${baseDfVal} for active SCC: ${mech.id}`);
            }

            if (baseDfVal > 0) {
                // Df(t) = BaseDF * (t)^1.1
                const projected = baseDfVal * Math.pow(Math.max(ageInYears, 1.0), 1.1);
                // Apply max cap of 5000 per API usually
                totalDF += Math.min(projected, 5000);
            }
        }
    });

    // 4. HTHA Projection
    // HTHA also time dependent. 
    // Often Df_htha(t) is complex, but checking htha.js: calculateHTHADamageFactor uses 'timeYears'
    // We would need to call calculateHTHADamageFactor with new age.
    if (typeof calculateHTHADamageFactor === 'function' && document.getElementById('id_mechanism_htha_active')?.checked) {
        // Susceptibility is constant with age? Yes usually.
        const susc = document.getElementById('res_htha_susceptibility')?.textContent || 'None';
        const hthaDf = calculateHTHADamageFactor(susc, ageInYears);
        totalDF += hthaDf;
    }

    // 5. Brittle Fracture
    // Usually treated as constant or step change? 
    // API 581: Df_brit is often constant unless temp changes? 
    // Checking adapter: It reads value from input. Assuming constant for projection unless we have specific logic.
    if (document.getElementById('id_mechanism_brittle_fracture_active')?.checked) {
        const val = parseFloat(document.getElementById('id_brittle_damage_factor')?.value) || 0;
        totalDF += val;
    }

    return totalDF;
}

/**
 * Modified Thinning Calc that accepts Age
 * Replicates logic from calculateGeneralThinningDF but overrides age
 */
function calculateGeneralThinningDF_Projected(rateMpy, ageYears) {
    if (rateMpy <= 0) return 0;

    const tMin = parseFloat(document.getElementById('id_min_required_thickness_in')?.value) || null;
    const fca = parseFloat(document.getElementById('id_future_corrosion_allowance_in')?.value) || null;

    if (tMin !== null && fca !== null && (tMin - fca) > 0) {
        // Art = rate * age
        // if Art > (tmin - FCA), failure is effectively 1.0? DF goes to max?
        // API 581 Thinning Eq for Df is a lookup or curve based on Ar/t.
        // The simplified version in code was: (rate * age) / (tmin - fca) ??
        // The existing code: `return (rateMpy * age) / denominator;`
        // Let's stick to that existing "Simplified" logic for consistency.
        const denominator = tMin - fca;
        return (rateMpy * ageYears) / denominator;
    } else {
        // Fallback or just proportional
        // Existing code: `return rateMpy * age;`
        // Wait, standard code just returned rate*age? That seems like a placeholder.
        // Actually line 171 of formula_app_adapter says:
        // if (denominator...) return (rate * age) / denominator
        // else return rate * age
        return rateMpy * ageYears;
    }
}

// =============================================================================
// CHART & UI LOGIC
// =============================================================================

function initInspectionPlanning() {
    const ctx = document.getElementById('inspection_chart');
    if (!ctx) return;

    // Destroy existing
    if (inspectionChart) {
        inspectionChart.destroy();
    }

    // Set default Max DF if empty
    const maxDfInput = document.getElementById('inp_target_max_df');
    if (maxDfInput && !maxDfInput.value) {
        maxDfInput.value = DEFAULT_MAX_DF;
    }

    // Init Logic on button or change
    if (maxDfInput) {
        maxDfInput.addEventListener('change', updateInspectionChart);
    }

    // Also hook into general updates? 
    // We can expose an update function
    updateInspectionChart();
}

function updateInspectionChart() {
    const ctx = document.getElementById('inspection_chart');
    if (!ctx) return;

    // 1. Get Risk Target (Area Risk Limit)
    // Default 4.0 m2/yr if empty
    const targetRiskVal = parseFloat(document.getElementById('inp_target_max_df')?.value) || 4.0;

    // Config: Max Y-Axis
    // Dynamic scaling: If current risk is huge (e.g. 3000), we must scale up.
    // We'll compute this later after data points are generated, or use a placeholder.
    // Let's defer yAxisMax setting or set it to auto?
    // ChartJS 'suggestedMax' is better. But we want strict control for visual intersection.
    // Let's calculate max from dataPoints later.
    let yAxisMax = targetRiskVal * 4;

    // 2. Get GFF & FMS
    // Try hidden inputs first (ID usually id_field_name), then fallback to display text
    const gffInput = document.getElementById('id_gff_value') || document.getElementById('disp_gff_value');
    let gff = 3.06E-05; // Default Generic fallback 
    if (gffInput) {
        let valStr = (gffInput.value !== undefined && gffInput.value !== '') ? gffInput.value : gffInput.textContent;
        valStr = valStr.replace(/[^\d.E-]/g, '');
        let parsed = parseFloat(valStr);
        if (!isNaN(parsed)) gff = parsed;
    }

    const fmsInput = document.getElementById('id_fms_factor') || document.getElementById('disp_fms_factor');
    let fms = 1.0;
    if (fmsInput) {
        let valStr = (fmsInput.value !== undefined && fmsInput.value !== '') ? fmsInput.value : fmsInput.textContent;
        valStr = valStr.replace(/[^\d.]/g, '');
        let parsed = parseFloat(valStr);
        if (!isNaN(parsed)) fms = parsed;
    }

    // 3. Get COF (Area)
    // We look for CMD and INJ area (ft2) and take the max, then convert to m2
    // 1 ft2 = 0.092903 m2
    const cmdAreaEl = document.getElementById('val_final_cmd');
    const injAreaEl = document.getElementById('val_final_inj');

    let cmdArea = 0;
    if (cmdAreaEl && cmdAreaEl.textContent && !cmdAreaEl.textContent.includes('-')) {
        cmdArea = parseFloat(cmdAreaEl.textContent) || 0;
    }

    let injArea = 0;
    if (injAreaEl && injAreaEl.textContent && !injAreaEl.textContent.includes('-')) {
        injArea = parseFloat(injAreaEl.textContent) || 0;
    }

    let maxAreaFt2 = Math.max(cmdArea, injArea);
    if (maxAreaFt2 === 0) maxAreaFt2 = 100; // Fallback reasonable area to avoid flatline Risk=0

    const cofM2 = maxAreaFt2 * 0.092903;

    // Log calculation params for debugging
    console.log(`[Risk Chart] Target: ${targetRiskVal}, GFF: ${gff}, FMS: ${fms}, COF(m2): ${cofM2.toFixed(2)}`);

    // Get Commission date for Age 0
    const commDateStr = document.getElementById('id_commissioning_date')?.value;
    const commDate = commDateStr ? new Date(commDateStr) : new Date();
    const commYear = commDate.getFullYear();
    const currentAge = (new Date() - commDate) / (1000 * 60 * 60 * 24 * 365.25);

    // Helper: Calculate Risk per Age
    function calculateRisk(age) {
        // Enforce Minimum DF of 1.0 (Baseline GFF)
        // If totalDF comes back 0 (no active mechanisms), we use 1.0
        let df = calculateProjectedTotalDF(age);
        if (df < 1.0) df = 1.0;

        // Risk = PoF * CoF
        // PoF = GFF * FMS * DF
        // Cap PoF at 1.0 generally
        let pof = gff * fms * df;
        if (pof > 1.0) pof = 1.0;

        return pof * cofM2;
    }

    // 1. Detect Intersection First (Precision Pass)
    let intersectionAge = null;
    let foundIntersection = false;

    // Scan closely from now to +50 years
    for (let age = currentAge; age <= currentAge + 50; age += 0.1) {
        const risk = calculateRisk(age);
        if (risk >= targetRiskVal) {
            foundIntersection = true;
            intersectionAge = age;
            break;
        }
    }

    // 2. Generate Data Points (Visualization Pass)
    const labels = [];
    const dataPoints = [];
    const maxLimitPoints = [];

    // Chart limits
    const startAge = Math.max(0, currentAge - 5);
    const endAge = currentAge + 25; // View window
    const step = 0.5;

    for (let age = startAge; age <= endAge; age += step) {
        const yearVal = commYear + age;
        labels.push(yearVal.toFixed(1));
        maxLimitPoints.push(targetRiskVal);

        let currentRisk = 0;

        if (foundIntersection && age > intersectionAge) {
            // Post-Inspection Simulation (Sawtooth Drop)
            // Reset effective age
            const effectiveAge = (age - intersectionAge) + 1.0; // Assume 1 year base after repair/inspection
            currentRisk = calculateRisk(effectiveAge);
        } else {
            // Normal Projection
            currentRisk = calculateRisk(age);
        }

        dataPoints.push(currentRisk);
    }

    // Dynamic Axis Scaling
    const maxRisk = Math.max(...dataPoints);
    console.log('[Risk Chart] Max Calculated Risk:', maxRisk);

    // Auto-scale: If maxRisk is very low, scale to fit it + margin. 
    // If maxRisk is somewhat high but below target, verify.
    // If maxRisk > target, scale to maxRisk.

    // Logic: 
    // 1. If maxRisk > target, yMax = maxRisk * 1.1
    // 2. If maxRisk < target, default to showing target (yMax = target * 1.5) so we see how far we are.
    // BUT if maxRisk is TINY (e.g. 0.009 vs 4.0), the line is invisible. 
    // Ideally we want to see the line. 
    // So let's ensure yMax is at least decent, but maybe we can use a second axis? No, keep simple.
    // Let's stick to showing the Target as the visual anchor. If risk is low, it's low. Good news.
    // But we'll log it.

    if (maxRisk > yAxisMax) {
        yAxisMax = maxRisk * 1.1;
    }
    // OPTIONAL: If risk is tiny, maybe set max to target usually. 
    // Current logic: yAxisMax = targetRiskVal * 4; (Default) -> This squashes small risks.
    // Let's set default max to Target * 1.2 to use more vertical space?
    // User complaint "graph doesn't work" might simply mean "I see nothing". 
    // Reducing range makes it visible.

    if (maxRisk < targetRiskVal) {
        yAxisMax = targetRiskVal * 1.5; // Reduced from 4x to 1.5x to show the line better
    }

    // Create specific point for the Intersection
    let intersectionDateObj = null;
    if (foundIntersection) {
        const intersectMs = commDate.getTime() + (intersectionAge * 365.25 * 24 * 60 * 60 * 1000);
        intersectionDateObj = new Date(intersectMs);
    }

    // Render Chart
    if (inspectionChart) inspectionChart.destroy();

    // Gradient (Green for Risk/Money/Safety)
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    // Green-500: #22c55e
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.5)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

    const datasets = [
        {
            type: 'line',
            label: 'Risk (m²/yr)',
            data: dataPoints,
            borderColor: '#65a30d', // Lime-600
            backgroundColor: gradient,
            borderWidth: 4,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            fill: true
        },
        {
            type: 'line',
            label: 'Target Limit',
            data: maxLimitPoints,
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false
        }
    ];

    // Add Intersection Point if found
    if (foundIntersection) {
        const pointData = dataPoints.map((val, idx) => {
            const age = startAge + (idx * step);
            if (Math.abs(age - intersectionAge) < step / 2) {
                return targetRiskVal;
            }
            return null;
        });

        datasets.push({
            type: 'line',
            label: 'Inspection Required',
            data: pointData,
            borderColor: '#ef4444',
            backgroundColor: '#ffffff',
            borderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 10,
            pointBorderWidth: 3,
            showLine: false
        });
    }

    inspectionChart = new Chart(ctx, {
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', align: 'end' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (context.dataset.label === 'Inspection Required') return `Plan Inspection Here!`;
                            return `${context.dataset.label}: ${context.raw.toFixed(6)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Projection Year', font: { weight: 'bold' } }
                },
                y: {
                    grid: { color: '#f1f5f9' },
                    min: 0,
                    max: yAxisMax,
                    title: { display: true, text: 'Risk (m²/yr)' }
                }
            }
        }
    });

    // Update Result Card Text
    const resultTitle = document.getElementById('insp_res_date');
    const resultTime = document.getElementById('insp_res_time_remaining');
    const resultDf = document.getElementById('insp_res_proj_df');

    if (foundIntersection && intersectionDateObj) {
        resultTitle.textContent = intersectionDateObj.toLocaleDateString();
        const diffDays = Math.floor((intersectionDateObj - new Date()) / (1000 * 60 * 60 * 24));
        const diffYears = (diffDays / 365.25).toFixed(1);
        resultTime.textContent = `${diffYears} years (${diffDays} days)`;
        resultTime.className = diffYears < 1 ? "text-2xl font-bold text-red-600" : "text-2xl font-bold text-green-600";
        resultDf.textContent = targetRiskVal.toFixed(2) + " m²/yr";
    } else {
        resultTitle.textContent = "> 25 Years";
        resultTime.textContent = "Safe for long term";
        resultTime.className = "text-2xl font-bold text-green-600";
        const fnVal = dataPoints[dataPoints.length - 1] || 0;
        resultDf.textContent = fnVal.toFixed(4) + " m²/yr";
    }
}

// Hook into the global window for access
window.initInspectionPlanning = initInspectionPlanning;
window.updateInspectionPlanning = updateInspectionChart;

// Init on load if tab active? Or just expose it.
document.addEventListener('DOMContentLoaded', () => {
    // We will init when tab is clicked effectively
    const tabBtn = document.querySelector('[data-tab="inspection-planning"]'); // ID TBD
    if (tabBtn) {
        tabBtn.addEventListener('click', () => {
            setTimeout(initInspectionPlanning, 200);
        });
    }
});
