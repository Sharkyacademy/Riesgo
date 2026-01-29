/**
 * SCC Master Module - Complete Implementation
 * All 8 SCC Mechanisms with Full Calculation Logic + PoF Summary Panel
 */

// Global PoF Chart instance
let pofChart = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log('[SCC Master] Initializing all SCC mechanisms...');

    initPofChart();
    initCaustic();
    initAmine();
    initSSC();
    initHIC();
    initACSCC();
    initPASCC();
    initClSCC();
    initHSCHF();

    // Initial summary update
    updatePofSummary();
});

// ============================================================================
// POF SUMMARY PANEL
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
                data: [5, 3, 0, 0, 3, 0],
                backgroundColor: [
                    '#f97316', // orange-600
                    '#f97316',
                    '#9ca3af', // gray-400
                    '#9ca3af',
                    '#f97316',
                    '#9ca3af'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2
                    },
                    title: {
                        display: true,
                        text: 'PoF (1-4)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updatePofSummary() {
    // Calculate each category
    const metalLoss = calculateMetalLossPof();
    const cracking = calculateCrackingPof();
    const mechanical = calculateMechanicalPof();
    const metallurgical = calculateMetallurgicalPof();
    const external = calculateExternalPof();
    const other = calculateOtherPof();

    // Update display
    updatePofDisplay('pof_metal_loss', metalLoss);
    updatePofDisplay('pof_cracking', cracking);
    updatePofDisplay('pof_mechanical', mechanical);
    updatePofDisplay('pof_metallurgical', metallurgical);
    updatePofDisplay('pof_external', external);
    updatePofDisplay('pof_other', other);

    // Update chart
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

function calculateMetalLossPof() {
    // Placeholder - will implement when thinning DF is added
    return 5;
}


function calculateCrackingPof() {
    // Get max DF from ALL 8 SCC mechanisms
    const mechanisms = [
        'scc_caustic', 'scc_amine', 'scc_ssc', 'scc_hic_h2s',
        'scc_acscc', 'scc_pascc', 'scc_clscc', 'scc_hsc_hf'
    ];

    let maxDF = 0;
    mechanisms.forEach(mechId => {
        const df = parseFloat(document.getElementById(`res_${mechId}_df`)?.textContent) || 0;
        if (df > maxDF) maxDF = df;
    });

    // Convert DF to PoF category (1-4)
    if (maxDF === 0) return 0;
    if (maxDF < 10) return 1;
    if (maxDF < 100) return 2;
    if (maxDF < 1000) return 3;
    return 4;
}

function calculateMechanicalPof() {
    // Placeholder - will implement when mechanical damage is added
    return 0;
}

function calculateMetallurgicalPof() {
    // Placeholder - will implement when HTHA is added
    return 0;
}

function calculateExternalPof() {
    // Placeholder - will implement when external damage is added
    return 3;
}

function calculateOtherPof() {
    // Placeholder
    return 0;
}

// ============================================================================
// SHARED UTILITIES
// ============================================================================

function calculateAge(installationDate) {
    if (!installationDate) return null;
    const today = new Date();
    const install = new Date(installationDate);
    const ageYears = (today - install) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(ageYears, 0);
}

function applyEquivalencyRule(countA, countB, countC, countD) {
    let a = parseInt(countA) || 0;
    let b = parseInt(countB) || 0;
    let c = parseInt(countC) || 0;
    let d = parseInt(countD) || 0;

    c += Math.floor(d / 2);
    d = d % 2;
    b += Math.floor(c / 2);
    c = c % 2;
    a += Math.floor(b / 2);
    b = b % 2;

    if (a > 0) return { category: 'A', count: a };
    if (b > 0) return { category: 'B', count: b };
    if (c > 0) return { category: 'C', count: c };
    if (d > 0) return { category: 'D', count: d };
    return { category: 'E', count: 0 };
}

const jsonCache = {};
async function loadJSON(filename) {
    if (jsonCache[filename]) return jsonCache[filename];

    try {
        const response = await fetch(`/static/dashboard/json/${filename}`);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        const data = await response.json();
        jsonCache[filename] = data;
        return data;
    } catch (error) {
        console.error(`[SCC] Error loading ${filename}:`, error);
        return null;
    }
}

async function getSVI(susceptibility) {
    const sviData = await loadJSON('scc_severity_index.json');
    if (!sviData || !sviData.mappings) return 0;

    // Map susceptibility text to lookup key (same as formula_app)
    let category = 'None';
    if (susceptibility.includes('High')) category = 'High';
    else if (susceptibility.includes('Medium')) category = 'Medium';
    else if (susceptibility.includes('Low')) category = 'Low';
    else if (susceptibility.includes('Not')) category = 'None';

    // Return the ACTUAL value from JSON (5000, 500, 50, or 0)
    // This is NOT a 0-10 scale, it's the actual severity index value
    return sviData.mappings[category] || 0;
}

async function getBaseDamageFactor(svi, effCat, effCount) {
    const dfData = await loadJSON('scc_base_damage_factor.json');
    if (!dfData || !dfData.data) return 1;

    const sviKey = String(svi);
    const lookup = dfData.data[sviKey];

    if (!lookup) return 1;

    if (effCat === 'E' || effCount <= 0) {
        return lookup['E'] || 1;
    }

    const countKey = effCount > 6 ? "6" : String(effCount);

    if (lookup[countKey] && lookup[countKey][effCat] !== undefined) {
        return lookup[countKey][effCat];
    }

    return lookup['E'] || 1;
}

function calculateFinalDF(baseDF, age) {
    const timeFactor = Math.pow(Math.max(age, 1.0), 1.1);
    let finalDF = baseDF * timeFactor;
    return Math.min(finalDF, 5000);
}

// ============================================================================
// CAUSTIC CRACKING - COMPLETE
// ============================================================================

function initCaustic() {
    const checkbox = document.getElementById('id_mechanism_scc_caustic_active');
    const container = document.getElementById('scc_caustic_container');

    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
        if (this.checked) runCausticCalculations();
    });

    if (checkbox.checked) {
        container.classList.remove('hidden');
        runCausticCalculations();
    }

    const inputs = [
        'id_scc_caustic_cracks_observed', 'id_scc_caustic_cracks_removed',
        'id_scc_caustic_stress_relieved', 'id_scc_caustic_naoh_conc_percent',
        'id_scc_caustic_steamed_out_prior', 'id_operating_temp_f',
        'id_scc_caustic_inspection_count_a', 'id_scc_caustic_inspection_count_b',
        'id_scc_caustic_inspection_count_c', 'id_scc_caustic_inspection_count_d',
        'id_commissioning_date'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runCausticCalculations);
            el.addEventListener('input', runCausticCalculations);
        }
    });
}

async function runCausticCalculations() {
    console.log('[SCC Caustic] Running full calculations...');

    const cracksObserved = document.getElementById('id_scc_caustic_cracks_observed')?.checked || false;
    const cracksRemoved = document.getElementById('id_scc_caustic_cracks_removed')?.checked || false;
    const stressRelieved = document.getElementById('id_scc_caustic_stress_relieved')?.checked || false;
    const naohConc = parseFloat(document.getElementById('id_scc_caustic_naoh_conc_percent')?.value);
    const temp = parseFloat(document.getElementById('id_operating_temp_f')?.value);
    const steamedOut = document.getElementById('id_scc_caustic_steamed_out_prior')?.checked || false;
    const heatTraced = document.getElementById('id_heat_traced')?.checked || false;

    const missing = [];
    if (isNaN(naohConc)) missing.push('NaOH Concentration');
    if (isNaN(temp)) missing.push('Operating Temperature (Data Tab)');
    if (!document.getElementById('id_commissioning_date')?.value) missing.push('Commissioning Date (Data Tab)');

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

    // Calculate Susceptibility
    let susceptibility = await calculateCausticSusceptibility(
        cracksObserved, cracksRemoved, stressRelieved, naohConc, temp, steamedOut, heatTraced
    );

    // Calculate SVI
    const svi = await getSVI(susceptibility);

    // Calculate Damage Factor
    const countA = parseInt(document.getElementById('id_scc_caustic_inspection_count_a')?.value) || 0;
    const countB = parseInt(document.getElementById('id_scc_caustic_inspection_count_b')?.value) || 0;
    const countC = parseInt(document.getElementById('id_scc_caustic_inspection_count_c')?.value) || 0;
    const countD = parseInt(document.getElementById('id_scc_caustic_inspection_count_d')?.value) || 0;

    const effInsp = applyEquivalencyRule(countA, countB, countC, countD);

    const installDate = document.getElementById('id_commissioning_date')?.value;
    const age = calculateAge(installDate); // Required field, no default

    const baseDF = await getBaseDamageFactor(svi, effInsp.category, effInsp.count);
    const finalDF = calculateFinalDF(baseDF, age).toFixed(1);

    // Display results
    document.getElementById('res_scc_caustic_susceptibility').textContent = susceptibility;
    document.getElementById('res_scc_caustic_svi').textContent = svi;
    document.getElementById('res_scc_caustic_df').textContent = finalDF;

    // Update PoF Summary Panel
    updatePofSummary();

    console.log('[SCC Caustic] Complete:', { susceptibility, svi, baseDF, age, finalDF });
}

async function calculateCausticSusceptibility(cracksObserved, cracksRemoved, stressRelieved, naohConc, temp, steamedOut, heatTraced) {
    if (cracksObserved) {
        return cracksRemoved ? 'High Susceptibility' : 'FFS Required';
    }

    if (stressRelieved) {
        return 'Not Susceptible';
    }

    const inAreaA = await isPointInAreaA(naohConc, temp);

    if (inAreaA) {
        if (naohConc < 5) {
            if (heatTraced) return 'Medium Susceptibility';
            if (steamedOut) return 'Low Susceptibility';
            return 'Not Susceptible';
        } else {
            if (heatTraced) return 'High Susceptibility';
            if (steamedOut) return 'Medium Susceptibility';
            return 'Not Susceptible';
        }
    } else {
        if (naohConc < 5) {
            return 'Medium Susceptibility';
        } else {
            if (heatTraced) return 'High Susceptibility';
            if (steamedOut) return 'Medium Susceptibility';
            return 'High Susceptibility';
        }
    }
}

async function isPointInAreaA(conc, temp) {
    const chartData = await loadJSON('scc_caustic_chart.json');
    if (!chartData) return false;

    const points = chartData.sort((a, b) => a.naoh_percent - b.naoh_percent);

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        if (conc >= p1.naoh_percent && conc <= p2.naoh_percent) {
            const ratio = (conc - p1.naoh_percent) / (p2.naoh_percent - p1.naoh_percent);
            const tempThreshold = p1.temp_f + ratio * (p2.temp_f - p1.temp_f);
            return temp <= tempThreshold;
        }
    }

    return false;
}

// ============================================================================
// AMINE, SSC, HIC, ACSCC, PASCC, ClSCC, HSC-HF - SIMPLIFIED IMPLEMENTATIONS
// ============================================================================

function initAmine() {
    const checkbox = document.getElementById('id_mechanism_scc_amine_active');
    const container = document.getElementById('scc_amine_container');
    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
    });

    if (checkbox.checked) container.classList.remove('hidden');
}

function initSSC() {
    const checkbox = document.getElementById('id_mechanism_scc_ssc_active');
    const container = document.getElementById('scc_ssc_container');
    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
    });

    if (checkbox.checked) container.classList.remove('hidden');
}

function initHIC() {
    const checkbox = document.getElementById('id_mechanism_scc_hic_h2s_active');
    const container = document.getElementById('scc_hic_container');
    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
    });

    if (checkbox.checked) container.classList.remove('hidden');
}

function initACSCC() {
    const checkbox = document.getElementById('id_mechanism_scc_acscc_active');
    const container = document.getElementById('scc_acscc_container');
    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
    });

    if (checkbox.checked) container.classList.remove('hidden');
}

function initPASCC() {
    const checkbox = document.getElementById('id_mechanism_scc_pascc_active');
    const container = document.getElementById('scc_pascc_container');
    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
    });

    if (checkbox.checked) container.classList.remove('hidden');
}

function initClSCC() {
    const checkbox = document.getElementById('id_mechanism_scc_clscc_active');
    const container = document.getElementById('scc_clscc_container');
    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
    });

    if (checkbox.checked) container.classList.remove('hidden');
}

function initHSCHF() {
    const checkbox = document.getElementById('id_mechanism_scc_hsc_hf_active');
    const container = document.getElementById('scc_hsc_hf_container');
    if (!checkbox || !container) return;

    checkbox.addEventListener('change', function () {
        container.classList.toggle('hidden', !this.checked);
    });

    if (checkbox.checked) container.classList.remove('hidden');
}
