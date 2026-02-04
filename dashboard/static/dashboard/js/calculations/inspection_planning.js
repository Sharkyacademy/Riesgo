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
        const isActive = document.getElementById(mech.checkbox)?.checked;
        if (isActive) {
            let rate = parseFloat(document.getElementById(mech.rate)?.value) || 0;

            // Fallback: Try reading from the display element (e.g., "5.5 mpy")
            if (rate === 0) {
                const displayId = `${mech.id}_rate_display`; // Convention: co2_rate_display
                const displayEl = document.getElementById(displayId);
                if (displayEl) {
                    rate = parseFloat(displayEl.textContent) || 0;
                }
            }

            if (rate > 0) {
                totalDF += calculateGeneralThinningDF_Projected(rate, ageInYears);
            }
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
            const baseDfVal = parseFloat(baseDfEl?.textContent) || 0;
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

    const maxDfVal = parseFloat(document.getElementById('inp_target_max_df')?.value) || DEFAULT_MAX_DF;

    // Config: Max Y-Axis is Target * 4 (Zoom effect)
    const yAxisMax = maxDfVal * 4;

    // Get Commission date for Age 0
    const commDateStr = document.getElementById('id_commissioning_date')?.value;
    const commDate = commDateStr ? new Date(commDateStr) : new Date();
    const currentYear = new Date().getFullYear();
    const commYear = commDate.getFullYear();
    const currentAge = (new Date() - commDate) / (1000 * 60 * 60 * 24 * 365.25);

    // 1. Detect Intersection First (Precision Pass)
    let intersectionAge = null;
    let foundIntersection = false;

    // Scan closely from now to +50 years
    for (let age = currentAge; age <= currentAge + 50; age += 0.1) {
        const totalDF = calculateProjectedTotalDF(age);
        if (totalDF >= maxDfVal) {
            foundIntersection = true;
            intersectionAge = age;
            break;
        }
    }

    // 2. Generate Data Points (Visualization Pass)
    const labels = [];
    const dataPoints = [];
    const maxLimitPoints = [];
    const inspectionPoints = []; // Only one point generally

    // Chart limits
    const startAge = Math.max(0, currentAge - 5);
    const endAge = currentAge + 25; // View window
    const step = 0.5;

    for (let age = startAge; age <= endAge; age += step) {
        const yearVal = commYear + age;
        labels.push(yearVal.toFixed(1));
        maxLimitPoints.push(maxDfVal);

        let totalDF = 0;

        if (foundIntersection && age > intersectionAge) {
            // Post-Inspection Simulation (Sawtooth Drop)
            // We assume inspection "resets" effective age for damage accumulation
            // Effectively: NewAge = (Age - IntersectionAge) + small_offset
            const effectiveAge = (age - intersectionAge) + 1.0; // Assume 1 year base after repair/inspection

            // Re-calculate using the same function but with "reset" age
            // Note: This is a simplification. Real life involves thickness measurements updates etc.
            totalDF = calculateProjectedTotalDF(effectiveAge);

            // Mark the intersection point exactly once (closest step)
            if (dataPoints.length > 0 && age - step <= intersectionAge && age > intersectionAge) {
                // Push null to others to keep alignment? No, we use a scatter dataset for the point.
            }

        } else {
            // Normal Projection
            totalDF = calculateProjectedTotalDF(age);
        }

        dataPoints.push(totalDF);
    }

    // Create specific point for the Intersection (Scatter dataset)
    let intersectionDateObj = null;
    if (foundIntersection) {
        const intersectYear = commYear + intersectionAge;
        const intersectMs = commDate.getTime() + (intersectionAge * 365.25 * 24 * 60 * 60 * 1000);
        intersectionDateObj = new Date(intersectMs);

        // Find index in labels to place point approx? 
        // Or simpler: We create a validation point array that aligns with dataPoints
        // Let's refine: We just put the point at the closest step for visual simplicity
        // or we use a Scatter dataset with x: Year, y: Value.
        // Mixed Line + Scatter is best.
    }

    // Render Chart
    if (inspectionChart) inspectionChart.destroy();

    // Gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    const datasets = [
        {
            type: 'line',
            label: 'Total Damage Factor',
            data: dataPoints,
            borderColor: '#2563eb', // Blue-600
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
        // We need to map the intersectionAge to the X-Axis "Label" index approx
        // Or simpler: We create a validation point array that aligns with dataPoints
        const pointData = dataPoints.map((val, idx) => {
            const age = startAge + (idx * step);
            // If this step is the closest to intersectionAge
            if (Math.abs(age - intersectionAge) < step / 2) {
                return maxDfVal; // Place on the line
            }
            return null;
        });

        datasets.push({
            type: 'line',
            label: 'Action Required',
            data: pointData,
            borderColor: '#16a34a', // Green-600 points
            backgroundColor: '#ffffff',
            borderWidth: 2,
            pointRadius: 8, // Big visible point
            pointHoverRadius: 10,
            pointBorderWidth: 3,
            showLine: false // Just the point
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
                            if (context.dataset.label === 'Action Required') return `Inspect Here!`;
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}`;
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
                    // LIMIT Y-AXIS VISIBILITY as requested
                    min: 0,
                    max: yAxisMax, // Zoom in
                    title: { display: true, text: 'Damage Factor' }
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
        resultDf.textContent = maxDfVal.toFixed(1);
    } else {
        resultTitle.textContent = "> 25 Years";
        resultTime.textContent = "Safe for long term";
        resultTime.className = "text-2xl font-bold text-green-600";
        resultDf.textContent = calculateProjectedTotalDF(endAge).toFixed(1) + " (at max range)";
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
