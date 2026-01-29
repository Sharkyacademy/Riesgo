/**
 * SCC Caustic Calculations - Formula App Code (API 581 Compliant)
 * EXACT COPY from formula_app/js/scc_interactions.js
 * This ensures 100% identical results between dashboard and formula_app
 */

// Load JSON data files
let causticChartData = null;
let severityIndexData = null;
let baseDamageFactorData = null;

// PoF Chart instance
let pofChart = null;

// ============================================================================
// DATA INITIALIZATION
// ============================================================================

async function initializeCausticData() {
    try {
        const [chartRes, sviRes, dfRes] = await Promise.all([
            fetch('/static/dashboard/json/scc_caustic_chart.json'),
            fetch('/static/dashboard/json/scc_severity_index.json'),
            fetch('/static/dashboard/json/scc_base_damage_factor.json')
        ]);

        causticChartData = await chartRes.json();
        severityIndexData = await sviRes.json();
        baseDamageFactorData = await dfRes.json();

        console.log('[Caustic] Data loaded successfully');
        return true;
    } catch (error) {
        console.error('[Caustic] Error loading JSON data:', error);
        return false;
    }
}

// ============================================================================
// POF SUMMARY PANEL FUNCTIONS
// ============================================================================

function initPofChart() {
    const ctx = document.getElementById('pof_chart');
    if (!ctx) return;

    pofChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Metal Loss', 'Cracking', 'Mechanical', 'Metallurgical', 'External', 'Other'],
            datasets: [{
                label: 'Probability',
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: ['#9ca3af', '#9ca3af', '#9ca3af', '#9ca3af', '#9ca3af', '#9ca3af'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: { stepSize: 1 },
                    title: { display: true, text: 'PoF (1-4)' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updatePofSummary() {
    const metalLoss = 0; // Placeholder
    const cracking = calculateCrackingPof();
    const mechanical = 0; // Placeholder
    const metallurgical = 0; // Placeholder
    const external = 0; // Placeholder
    const other = 0; // Placeholder

    updatePofDisplay('pof_metal_loss', metalLoss);
    updatePofDisplay('pof_cracking', cracking);
    updatePofDisplay('pof_mechanical', mechanical);
    updatePofDisplay('pof_metallurgical', metallurgical);
    updatePofDisplay('pof_external', external);
    updatePofDisplay('pof_other', other);

    if (pofChart) {
        pofChart.data.datasets[0].data = [metalLoss, cracking, mechanical, metallurgical, external, other];
        pofChart.data.datasets[0].backgroundColor = [
            metalLoss > 0 ? '#f97316' : '#9ca3af',
            cracking > 0 ? '#f97316' : '#9ca3af',
            mechanical > 0 ? '#f97316' : '#9ca3af',
            metallurgical > 0 ? '#f97316' : '#9ca3af',
            external > 0 ? '#f97316' : '#9ca3af',
            other > 0 ? '#f97316' : '#9ca3af'
        ];
        pofChart.update();
    }
}

function updatePofDisplay(elementId, value) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = value > 0 ? value : '0';
    el.className = value > 0 ? 'text-2xl font-bold text-orange-600' : 'text-2xl font-bold text-gray-400';
}

function calculateCrackingPof() {
    const mechanisms = [
        'scc_caustic', 'scc_amine', 'scc_ssc', 'scc_hic_h2s',
        'scc_acscc', 'scc_pascc', 'scc_clscc', 'scc_hsc_hf'
    ];

    let maxDF = 0;
    mechanisms.forEach(mechId => {
        const df = parseFloat(document.getElementById(`res_${mechId}_df`)?.textContent) || 0;
        if (df > maxDF) maxDF = df;
    });

    if (maxDF === 0) return 0;
    if (maxDF < 10) return 1;
    if (maxDF < 100) return 2;
    if (maxDF < 1000) return 3;
    return 4;
}

// ============================================================================
// FORMULA APP CALCULATION FUNCTIONS
// ============================================================================

/**
 * STEP 1: Calculate Susceptibility
 * EXACT COPY from formula_app lines 692-754
 */
function calculateCausticSusceptibility(cracksPresent, cracksRemoved, stressRelieved, naohConc, temp, steamedOut, heatTraced) {
    if (cracksPresent === 'Yes') {
        if (cracksRemoved === 'No') {
            return 'FFS (Fitness For Service Evaluation Required)';
        }
        return 'High Susceptibility';
    }

    if (stressRelieved === 'Yes') {
        return 'Not Susceptible';
    }

    const areaA = isPointInAreaA(naohConc, temp);

    if (areaA) {
        if (naohConc < 5) {
            if (heatTraced === 'Yes') return 'Medium Susceptibility';
            if (steamedOut === 'Yes') return 'Low Susceptibility';
            return 'Not Susceptible';
        } else {
            if (heatTraced === 'Yes') return 'High Susceptibility';
            if (steamedOut === 'Yes') return 'Medium Susceptibility';
            return 'Not Susceptible';
        }
    } else {
        if (naohConc < 5) {
            return 'Medium Susceptibility';
        } else {
            if (heatTraced === 'Yes') return 'High Susceptibility';
            if (steamedOut === 'Yes') return 'Medium Susceptibility';
            return 'High Susceptibility';
        }
    }
}

function isPointInAreaA(naohConc, temp) {
    if (!causticChartData || naohConc === null || temp === null) {
        return false;
    }

    const points = causticChartData;

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        if (naohConc >= p1.naoh && naohConc <= p2.naoh) {
            const ratio = (naohConc - p1.naoh) / (p2.naoh - p1.naoh);
            const maxTemp = p1.t + ratio * (p2.t - p1.t);
            return temp <= maxTemp;
        }
    }

    return false;
}

/**
 * STEP 2: Get Severity Index (SVI)
 */
function getSVI(susceptibility) {
    if (!severityIndexData || !susceptibility) {
        return 0;
    }

    const mappings = severityIndexData.mappings;
    let category = 'None';

    if (susceptibility.includes('High')) {
        category = 'High';
    } else if (susceptibility.includes('Medium')) {
        category = 'Medium';
    } else if (susceptibility.includes('Low')) {
        category = 'Low';
    } else if (susceptibility.includes('Not')) {
        category = 'None';
    }

    return mappings[category] || 0;
}

/**
 * STEP 3: Calculate Age
 */
function calculateAgeFromDate(dateVal) {
    if (!dateVal) {
        return null;
    }

    const installDate = new Date(dateVal);
    const currentDate = new Date();
    const diffTime = currentDate - installDate;

    if (diffTime < 0) {
        alert("Installation date cannot be in the future.");
        return null;
    }

    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return parseFloat(diffYears.toFixed(2));
}

/**
 * STEP 4: Calculate Inspection Effectiveness
 * API 581 Part 2 Section 3.4.3 - 2:1 Equivalency Rule
 */
function calculateInspectionEffectiveness(countA, countB, countC, countD) {
    let a = parseInt(countA) || 0;
    let b = parseInt(countB) || 0;
    let c = parseInt(countC) || 0;
    let d = parseInt(countD) || 0;

    if (d >= 2) {
        c += Math.floor(d / 2);
        d = d % 2;
    }

    if (c >= 2) {
        b += Math.floor(c / 2);
        c = c % 2;
    }

    if (b >= 2) {
        a += Math.floor(b / 2);
        b = b % 2;
    }

    let finalEffCat = 'E';
    let finalEffCount = 0;

    if (a > 0) {
        finalEffCat = 'A';
        finalEffCount = a;
    } else if (b > 0) {
        finalEffCat = 'B';
        finalEffCount = b;
    } else if (c > 0) {
        finalEffCat = 'C';
        finalEffCount = c;
    } else if (d > 0) {
        finalEffCat = 'D';
        finalEffCount = d;
    }

    return {
        category: finalEffCat,
        count: finalEffCount
    };
}

/**
 * STEP 5: Get Base Damage Factor
 */
function getBaseDamageFactor(svi, effCat, effCount) {
    if (!baseDamageFactorData) {
        return null;
    }

    const data = baseDamageFactorData.data;
    const sviKey = String(svi);

    if (!data[sviKey]) {
        console.warn(`No data for SVI=${sviKey}`);
        return null;
    }

    const lookup = data[sviKey];

    if (effCat === 'E' || effCount <= 0) {
        return lookup['E'] || null;
    }

    const countKey = effCount > 6 ? "6" : String(effCount);

    if (lookup[countKey] && lookup[countKey][effCat] !== undefined) {
        return lookup[countKey][effCat];
    }

    return lookup['E'] || null;
}

/**
 * STEP 6: Calculate Final Damage Factor
 * Equation 2.C.3: Df = min(BaseDF * (max(age, 1.0))^1.1, 5000)
 */
function calculateFinalDamageFactor(baseDF, age) {
    if (isNaN(baseDF) || isNaN(age)) {
        return null;
    }

    const timeFactor = Math.pow(Math.max(age, 1.0), 1.1);
    let finalDF = baseDF * timeFactor;

    if (finalDF > 5000) {
        finalDF = 5000;
    }

    return parseFloat(finalDF.toFixed(1));
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

async function runCausticCalculationsFormulaApp() {
    console.log('[Caustic Formula App] Running calculations...');

    if (!causticChartData || !severityIndexData || !baseDamageFactorData) {
        const loaded = await initializeCausticData();
        if (!loaded) {
            console.error('[Caustic] Failed to load data');
            return;
        }
    }

    const cracksObserved = document.getElementById('id_scc_caustic_cracks_observed')?.checked ? 'Yes' : 'No';
    const cracksRemoved = document.getElementById('id_scc_caustic_cracks_removed')?.checked ? 'Yes' : 'No';
    const stressRelieved = document.getElementById('id_scc_caustic_stress_relieved')?.checked ? 'Yes' : 'No';
    const naohConc = parseFloat(document.getElementById('id_scc_caustic_naoh_conc_percent')?.value);
    const temp = parseFloat(document.getElementById('id_operating_temp_f')?.value);
    const steamedOut = document.getElementById('id_scc_caustic_steamed_out_prior')?.checked ? 'Yes' : 'No';
    const heatTraced = document.getElementById('id_heat_traced')?.checked ? 'Yes' : 'No';
    const installDate = document.getElementById('id_commissioning_date')?.value;

    const countA = parseInt(document.getElementById('id_scc_caustic_inspection_count_a')?.value) || 0;
    const countB = parseInt(document.getElementById('id_scc_caustic_inspection_count_b')?.value) || 0;
    const countC = parseInt(document.getElementById('id_scc_caustic_inspection_count_c')?.value) || 0;
    const countD = parseInt(document.getElementById('id_scc_caustic_inspection_count_d')?.value) || 0;

    const missing = [];
    if (isNaN(naohConc)) missing.push('NaOH Concentration');
    if (isNaN(temp)) missing.push('Operating Temperature (Data Tab)');
    if (!installDate) missing.push('Commissioning Date (Data Tab)');

    const alertContainer = document.getElementById('scc_caustic_alerts');
    const missingSpan = document.getElementById('scc_caustic_missing_fields');

    if (missing.length > 0) {
        if (missingSpan) missingSpan.textContent = missing.join(', ');
        if (alertContainer) alertContainer.classList.remove('hidden');

        document.getElementById('res_scc_caustic_susceptibility').textContent = '--';
        document.getElementById('res_scc_caustic_svi').textContent = '--';
        document.getElementById('res_scc_caustic_df').textContent = '--';
        return;
    }

    if (alertContainer) alertContainer.classList.add('hidden');

    const susceptibility = calculateCausticSusceptibility(
        cracksObserved, cracksRemoved, stressRelieved, naohConc, temp, steamedOut, heatTraced
    );

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(installDate);
    const inspection = calculateInspectionEffectiveness(countA, countB, countC, countD);
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    console.log(`[DEBUG] Date: ${installDate}, Age: ${age}, BaseDF: ${baseDF}, FinalDF: ${finalDF}`);

    document.getElementById('res_scc_caustic_susceptibility').textContent = susceptibility;
    document.getElementById('res_scc_caustic_svi').textContent = svi;
    document.getElementById('res_scc_caustic_df').textContent = finalDF;

    updatePofSummary();

    console.log('[Caustic Formula App] Complete:', {
        susceptibility,
        svi,
        age,
        inspection,
        baseDF,
        finalDF
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function () {
    console.log('[Caustic Formula App] Initializing...');

    initPofChart();
    await initializeCausticData();
    updatePofSummary();

    const inputs = [
        'id_scc_caustic_cracks_observed', 'id_scc_caustic_cracks_removed',
        'id_scc_caustic_stress_relieved', 'id_scc_caustic_naoh_conc_percent',
        'id_scc_caustic_steamed_out_prior', 'id_operating_temp_f', 'id_heat_traced',
        'id_scc_caustic_inspection_count_a', 'id_scc_caustic_inspection_count_b',
        'id_scc_caustic_inspection_count_c', 'id_scc_caustic_inspection_count_d',
        'id_commissioning_date'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runCausticCalculationsFormulaApp);
            el.addEventListener('input', runCausticCalculationsFormulaApp);
        }
    });


    // Setup visibility toggle for Caustic Mechanism
    const causticCheckbox = document.getElementById('id_mechanism_scc_caustic_active');
    const causticContainer = document.getElementById('scc_caustic_container');

    if (causticCheckbox && causticContainer) {
        causticCheckbox.addEventListener('change', function () {
            if (this.checked) {
                causticContainer.classList.remove('hidden');
                runCausticCalculationsFormulaApp();
            } else {
                causticContainer.classList.add('hidden');
            }
        });

        // Initial state check
        if (causticCheckbox.checked) {
            causticContainer.classList.remove('hidden');
        }
    }
});

window.runCausticCalculationsFormulaApp = runCausticCalculationsFormulaApp;
console.log('[Caustic Formula App] Module loaded - API 581 compliant calculations ready');
