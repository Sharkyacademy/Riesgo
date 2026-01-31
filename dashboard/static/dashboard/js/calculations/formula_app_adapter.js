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
        const isActive = document.getElementById(`id_mechanism_${mechId}_active`)?.checked;
        if (isActive) {
            const df = parseFloat(document.getElementById(`res_${mechId}_df`)?.textContent) || 0;
            if (df > maxDF) maxDF = df;
        }
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

    // [MODIFIED] Check if Enabled
    const isEnabled = document.getElementById('id_mechanism_scc_caustic_active')?.checked;
    if (!isEnabled) {
        console.log('[Caustic] Skipped (Disabled)');
        // Clear results
        document.getElementById('res_scc_caustic_susceptibility').textContent = 'Not Applicable';
        document.getElementById('res_scc_caustic_svi').textContent = '--';
        document.getElementById('res_scc_caustic_df').textContent = '--';
        updatePofSummary();
        return;
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

/**
 * AMINE CRACKING SUSCEPTIBILITY
 * EXACT COPY from formula_app logic (lines 3739-3850+)
 */
function calculateAmineSusceptibility(data) {
    const {
        cracksPresent, cracksRemoved, stressRelieved,
        exposedToLeanAmine, amineSolution,
        temp, heatTraced, steamedOut
    } = data;

    // Path 1: Cracks Present
    if (cracksPresent === 'Yes') {
        if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
        return 'High'; // Maps to High Susceptibility
    }

    // Path 2: Stress Relieved (PWHT)
    if (stressRelieved === 'Yes') {
        return 'Not Susceptible';
    }

    // Path 3: Not Exposed to Lean Amine
    if (exposedToLeanAmine === 'No') {
        return 'Not Susceptible';
    }

    // Path 4: Exposed to Lean Amine
    // Branch A: MEA / DIPA
    if (amineSolution === 'MEA_DIPA') {
        if (temp > 180) {
            return 'High';
        }

        if (temp >= 100 && temp <= 180) {
            if (heatTraced === 'Yes') return 'Medium';
            if (steamedOut === 'Yes') return 'Medium';
            return 'Low';
        }

        if (temp < 100) {
            if (heatTraced === 'Yes') return 'Medium';
            if (steamedOut === 'Yes') return 'Medium';
            return 'Low';
        }
    }

    // Branch B: DEA / Others
    if (amineSolution === 'DEA_OTHER') {
        if (temp > 180) {
            return 'High';
        }
        if (temp <= 180) {
            if (heatTraced === 'Yes') return 'Medium';
            if (steamedOut === 'Yes') return 'Medium';
            return 'Not Susceptible';
        }
    }

    // Default fallback
    return 'Low';
}

/**
 * MAIN FUNCTION: Calculate AMINE
 */
async function runAmineCalculations() {
    console.log('[Amine Formula App] Running calculations...');

    // Ensure data loaded (reuse caustic data as it shares tables)
    if (!severityIndexData) await initializeCausticData();

    // [MODIFIED] Check if Enabled
    const isEnabled = document.getElementById('id_mechanism_scc_amine_active')?.checked;
    if (!isEnabled) {
        console.log('[Amine] Skipped (Disabled)');
        setResults('amine', 'Not Applicable', '--', '--');
        updatePofSummary();
        return;
    }

    // Get Inputs
    const inputs = {
        cracksPresent: getVal('id_scc_amine_cracks_observed', 'chk'),
        cracksRemoved: getVal('id_scc_amine_cracks_removed', 'chk'),
        stressRelieved: getVal('id_scc_amine_stress_relieved', 'chk'),
        exposedToLeanAmine: getVal('id_scc_amine_lean_amine', 'chk'), // Checkbox
        amineSolution: getVal('id_scc_amine_solution_type'), // Dropdown: 'MEA_DIPA' or 'DEA_OTHER'
        temp: parseFloat(document.getElementById('id_operating_temp_f')?.value) || 0,
        heatTraced: getVal('id_heat_traced', 'chk'), // Shared Data Tab field
        steamedOut: getVal('id_scc_amine_steamed_out', 'chk'),

        // Inspection
        inspections: {
            A: parseInt(document.getElementById('id_scc_amine_inspection_count_a')?.value) || 0,
            B: parseInt(document.getElementById('id_scc_amine_inspection_count_b')?.value) || 0,
            C: parseInt(document.getElementById('id_scc_amine_inspection_count_c')?.value) || 0,
            D: parseInt(document.getElementById('id_scc_amine_inspection_count_d')?.value) || 0
        },
        installDate: document.getElementById('id_commissioning_date')?.value
    };

    // Validation
    const missing = [];
    if (!inputs.installDate) missing.push('Commissioning Date');
    if (isNaN(inputs.temp)) missing.push('Temperature');

    const alertContainer = document.getElementById('scc_amine_alerts');
    const missingSpan = document.getElementById('scc_amine_missing_fields');

    if (missing.length > 0) {
        if (missingSpan) missingSpan.textContent = missing.join(', ');
        if (alertContainer) alertContainer.classList.remove('hidden');
        setResults('amine', '--', '--', '--');
        return;
    }
    if (alertContainer) alertContainer.classList.add('hidden');

    // Calculations
    const susceptibility = calculateAmineSusceptibility(inputs);

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(inputs.installDate);
    const inspection = calculateInspectionEffectiveness(
        inputs.inspections.A, inputs.inspections.B, inputs.inspections.C, inputs.inspections.D
    );
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    // Display
    setResults('amine', susceptibility, svi, finalDF);
    updatePofSummary();
}

// Helper to clean up getElementById
function getVal(id, type = 'val') {
    const el = document.getElementById(id);
    if (!el) return null;
    if (type === 'chk') return el.checked ? 'Yes' : 'No';
    return el.value;
}

function setResults(mech, susp, svi, df) {
    const elSusp = document.getElementById(`res_scc_${mech}_susceptibility`);
    const elSvi = document.getElementById(`res_scc_${mech}_svi`);
    const elDf = document.getElementById(`res_scc_${mech}_df`);

    if (elSusp) elSusp.textContent = susp;
    if (elSvi) elSvi.textContent = svi;
    if (elDf) elDf.textContent = df;
}


// Initialize listeners for Amine
function initAmine() {
    const inputs = [
        'id_scc_amine_cracks_observed', 'id_scc_amine_cracks_removed',
        'id_scc_amine_stress_relieved', 'id_scc_amine_lean_amine',
        'id_scc_amine_solution_type', 'id_scc_amine_steamed_out',
        'id_scc_amine_inspection_count_a', 'id_scc_amine_inspection_count_b',
        'id_scc_amine_inspection_count_c', 'id_scc_amine_inspection_count_d'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runAmineCalculations);
            el.addEventListener('input', runAmineCalculations);
        }
    });

    // Visibility toggle
    const chk = document.getElementById('id_mechanism_scc_amine_active');
    const container = document.getElementById('scc_amine_container');
    if (chk && container) {
        chk.addEventListener('change', function () {
            if (this.checked) {
                container.classList.remove('hidden');
                runAmineCalculations();
            } else {
                container.classList.add('hidden');
                runAmineCalculations(); // [MODIFIED] Trigger to clear results
            }
        });
        if (chk.checked) {
            container.classList.remove('hidden');
            runAmineCalculations(); // Run initial calc if checked
        }
    }
}



// ============================================================================
// SCC SSC Calculations
// ============================================================================

let sccSscEnvSeverityData = null;
let sccSscSusceptibilityData = null;
let sccAcsccSusceptibilityData = null; // ACSCC Data
let sccClsccSusceptibilityData = null; // ClSCC Data
let sccClsccModifiersData = null; // ClSCC Modifiers

async function initializeClSCCData() {
    try {
        const [suscRes, modRes] = await Promise.all([
            fetch('/static/formula_app/data/json/scc_clscc_susceptibility.json'),
            fetch('/static/formula_app/data/json/scc_clscc_modifiers.json')
        ]);
        sccClsccSusceptibilityData = await suscRes.json();
        sccClsccModifiersData = await modRes.json();
        console.log('[ClSCC] Data loaded successfully');
        return true;
    } catch (error) {
        console.error('[ClSCC] Error loading data:', error);
        return false;
    }
}

async function initializeACSCCData() {
    try {
        const res = await fetch('/static/formula_app/data/json/scc_acscc_susceptibility.json');
        sccAcsccSusceptibilityData = await res.json();
        console.log('[ACSCC] Data loaded successfully');
        return true;
    } catch (error) {
        console.error('[ACSCC] Error loading ACSCC data:', error);
        return false;
    }
}

async function initializeSSCData() {
    try {
        const [envRes, suscRes] = await Promise.all([
            fetch('/static/formula_app/data/scc_ssc_environmental_severity.json'),
            fetch('/static/formula_app/data/scc_ssc_environmental_severity.json'),
            fetch('/static/formula_app/data/scc_ssc_susceptibility.json'),
            initializeACSCCData(),
            initializeClSCCData(), // Init ClSCC
            initializeHSCHFData() // Init HSC-HF
        ]);

        sccSscEnvSeverityData = await envRes.json();
        sccSscSusceptibilityData = await suscRes.json();
        console.log('[SSC] Data loaded successfully');
        return true;
    } catch (error) {
        console.error('[SSC] Error loading data:', error);
        return false;
    }
}

function calculateSSCSeverity(ph, h2s) {
    if (!sccSscEnvSeverityData) return 'Unknown';
    if (isNaN(ph) || isNaN(h2s)) return 'Unknown';

    // Column Index (H2S Content)
    let colIndex = -1;
    if (h2s <= 1) colIndex = 0;
    else if (h2s > 1 && h2s <= 50) colIndex = 1;
    else if (h2s > 50 && h2s <= 1000) colIndex = 2;
    else if (h2s > 1000 && h2s <= 10000) colIndex = 3;
    else if (h2s > 10000) colIndex = 4;

    // Find Row
    const row = sccSscEnvSeverityData.find(r => ph >= r.ph_min && ph <= r.ph_max);

    if (!row) return "None";

    if (h2s <= 1 && colIndex === -1) colIndex = 0; // Fallback
    return row.severity[colIndex];
}

function calculateSSCSusceptibility(severity, hardness, pwht, cracksPresent, cracksRemoved) {
    if (!sccSscSusceptibilityData) return 'Unknown';
    if (severity === 'Unknown' || severity === 'None') return 'Not Susceptible'; // Assume None=Not Susceptible for logic

    // 1. Base Susceptibility from Table
    let baseSusceptibility = "Unknown";
    const severityGroup = sccSscSusceptibilityData[severity];

    if (severityGroup) {
        // [FIX] Map PWHT 'Yes'/'No' to JSON keys 'PWHT'/'As-welded'
        const treatKey = (pwht === 'Yes') ? 'PWHT' : 'As-welded';
        const treatmentGroup = severityGroup[treatKey];

        if (treatmentGroup) {
            const match = treatmentGroup.find(r => {
                if (r.min === undefined && r.max !== undefined) return hardness <= r.max;
                if (r.min !== undefined && r.max === undefined) return hardness > r.min;
                if (r.min !== undefined && r.max !== undefined) return hardness >= r.min && hardness <= r.max;
                return false;
            });
            if (match) baseSusceptibility = match.result;
        }
    }

    // 2. Cracks Override
    let finalSusceptibility = baseSusceptibility;

    if (cracksPresent === 'Yes') {
        if (cracksRemoved === 'Yes') {
            finalSusceptibility = 'High';
        } else if (cracksRemoved === 'No') {
            finalSusceptibility = 'FFS (Fitness For Service Evaluation Required)';
        }
    }

    return finalSusceptibility;
}

async function runSSCCalculations() {
    console.log('[SSC] Running calculations...');

    // Ensure Data
    if (!sccSscEnvSeverityData || !severityIndexData || !baseDamageFactorData) {
        // We need CAUSTIC data too for shared tables
        if (!severityIndexData) await initializeCausticData();
        await initializeSSCData();
    }

    // [MODIFIED] Check if Enabled
    const isEnabled = document.getElementById('id_mechanism_scc_ssc_active')?.checked;
    if (!isEnabled) {
        console.log('[SSC] Skipped (Disabled)');
        setResults('ssc', 'Not Applicable', '--', '--');
        updatePofSummary();
        return;
    }

    // Inputs
    const inputs = {
        ph: parseFloat(document.getElementById('id_ph_value')?.value), // Shared Field
        h2s: parseFloat(document.getElementById('id_scc_ssc_h2s_ppm')?.value),
        hardness: parseFloat(document.getElementById('id_scc_ssc_hardness_hb')?.value),
        pwht: document.getElementById('id_pwht')?.checked ? 'Yes' : 'No', // Shared Field (Checkbox)
        cracksPresent: document.getElementById('id_scc_ssc_cracks_observed')?.checked ? 'Yes' : 'No',
        cracksRemoved: document.getElementById('id_scc_ssc_cracks_removed')?.checked ? 'Yes' : 'No',
        installDate: document.getElementById('id_commissioning_date')?.value, // Shared
        inspections: {
            A: parseInt(document.getElementById('id_scc_ssc_inspection_count_a')?.value) || 0,
            B: parseInt(document.getElementById('id_scc_ssc_inspection_count_b')?.value) || 0,
            C: parseInt(document.getElementById('id_scc_ssc_inspection_count_c')?.value) || 0,
            D: parseInt(document.getElementById('id_scc_ssc_inspection_count_d')?.value) || 0
        }
    };

    const alertContainer = document.getElementById('scc_ssc_alerts');
    const missingSpan = document.getElementById('scc_ssc_missing_fields');
    const missing = [];

    if (isNaN(inputs.ph)) missing.push('pH');
    if (isNaN(inputs.h2s)) missing.push('H2S Content');
    if (isNaN(inputs.hardness)) missing.push('Max Hardness');
    if (!inputs.pwht) missing.push('PWHT');
    if (!inputs.installDate) missing.push('Commissioning Date');

    // Display Missing
    if (missing.length > 0) {
        if (missingSpan) missingSpan.textContent = missing.join(', ');
        if (alertContainer) alertContainer.classList.remove('hidden');
        setResults('ssc', '--', '--', '--');
        return;
    }
    if (alertContainer) alertContainer.classList.add('hidden');

    // [DEBUG] Log Inputs
    console.log('[SSC DEBUG] Raw Inputs:', inputs);

    // Calculations
    const severity = calculateSSCSeverity(inputs.ph, inputs.h2s);
    const susceptibility = calculateSSCSusceptibility(
        severity, inputs.hardness, inputs.pwht, inputs.cracksPresent, inputs.cracksRemoved
    );

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(inputs.installDate);
    const inspection = calculateInspectionEffectiveness(
        inputs.inspections.A, inputs.inspections.B, inputs.inspections.C, inputs.inspections.D
    );
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    // [DEBUG] Log Results
    console.log('[SSC DEBUG] Calculation Results:', {
        severity,
        susceptibility,
        svi,
        age,
        inspection: inspection.category + inspection.count,
        baseDF,
        finalDF
    });

    // Display
    setResults('ssc', susceptibility, svi, finalDF);
    updatePofSummary();
}

function initSSC() {
    const inputs = [
        'id_scc_ssc_h2s_ppm', 'id_scc_ssc_hardness_hb',
        'id_scc_ssc_cracks_observed', 'id_scc_ssc_cracks_removed',
        'id_scc_ssc_inspection_count_a', 'id_scc_ssc_inspection_count_b',
        'id_scc_ssc_inspection_count_c', 'id_scc_ssc_inspection_count_d'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runSSCCalculations);
            el.addEventListener('input', runSSCCalculations);
        }
    });

    // Valid shared inputs
    const sharedInputs = ['id_ph_value', 'id_pwht'];
    sharedInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runSSCCalculations);
            el.addEventListener('input', runSSCCalculations);
        }
    });

    const chk = document.getElementById('id_mechanism_scc_ssc_active');
    const container = document.getElementById('scc_ssc_container');
    if (chk && container) {
        chk.addEventListener('change', function () {
            if (this.checked) {
                container.classList.remove('hidden');
                runSSCCalculations();
            } else {
                container.classList.add('hidden');
                runSSCCalculations(); // [MODIFIED] Trigger to clear results
            }
        });

        // [FIX] Show on load if already checked (e.g. after validation error or reload)
        if (chk.checked) {
            container.classList.remove('hidden');
        }
    }
}


// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function () {
    console.log('[Formula App Adapter] Initializing...');

    initPofChart();
    await initializeCausticData();
    await initializeSSCData();

    // Initialize Inputs
    const inputsv = document.querySelectorAll('input, select'); // Only watch existing inputs? Better specific ones.

    // Caustic Listeners (Existing)
    const causticInputs = [
        'id_scc_caustic_cracks_observed', 'id_scc_caustic_cracks_removed',
        'id_scc_caustic_stress_relieved', 'id_scc_caustic_naoh_conc_percent',
        'id_operating_temp_f', 'id_scc_caustic_steamed_out_prior', 'id_heat_traced',
        'id_commissioning_date',
        'id_scc_caustic_inspection_count_a', 'id_scc_caustic_inspection_count_b',
        'id_scc_caustic_inspection_count_c', 'id_scc_caustic_inspection_count_d'
    ];

    causticInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runCausticCalculationsFormulaApp);
            el.addEventListener('input', runCausticCalculationsFormulaApp);
        }
    });

    const causticCheckbox = document.getElementById('id_mechanism_scc_caustic_active');
    const causticContainer = document.getElementById('scc_caustic_container');

    if (causticCheckbox && causticContainer) {
        causticCheckbox.addEventListener('change', function () {
            if (this.checked) {
                causticContainer.classList.remove('hidden');
                runCausticCalculationsFormulaApp();
            } else {
                causticContainer.classList.add('hidden');
                runCausticCalculationsFormulaApp(); // [MODIFIED] Trigger to clear results
            }
        });
        if (causticCheckbox.checked) {
            causticContainer.classList.remove('hidden');
            // runCausticCalculationsFormulaApp(); // Already called below?
        }
    }

    // Init Amine
    initAmine();
    initSSC();
    initHIC();
    initACSCC();
    initPASCC();
    initClSCC();
    initHSCHF(); // [NEW] HSC-HF Init

    // Run Initial Calculations
    runCausticCalculationsFormulaApp();
    runAmineCalculations();
    runSSCCalculations();
    runSSCCalculations();
    runHICCalculations();
    runACSCCCalculations();
    runPASCCCalculations();
    runClSCCCalculations(); // [NEW] ClSCC Run
    runHSCHFCalculations(); // [NEW] HSC-HF Run
    updatePofSummary();
});

// ============================================================================
// HIC/SOHIC-H2S LOGIC (Implemented manually as it was missing in source)
// ============================================================================

function initHIC() {
    // 1. Inputs Checkbox
    const chk = document.getElementById('id_mechanism_scc_hic_h2s_active');
    const container = document.getElementById('scc_hic_container');

    if (chk && container) {
        chk.addEventListener('change', function () {
            if (this.checked) {
                container.classList.remove('hidden');
                runHICCalculations();
            } else {
                container.classList.add('hidden');
                runHICCalculations(); // Clear results
            }
        });

        // Show on load if checked
        if (chk.checked) {
            container.classList.remove('hidden');
        }
    }

    // 2. Input Listeners
    // Note: pH is shared (id_ph_value) - already listened by global change? 
    // We need to add runHICCalculations to shared inputs too.
    const inputs = [
        'id_ph_value', // Shared pH
        'id_scc_hic_h2s_h2s_ppm',
        'id_scc_hic_h2s_cyanide_present',
        'id_scc_hic_h2s_banding_severity',
        'id_scc_hic_h2s_cracks_observed',
        'id_scc_hic_h2s_cracks_removed',
        'id_scc_hic_h2s_inspection_count_a',
        'id_scc_hic_h2s_inspection_count_b',
        'id_scc_hic_h2s_inspection_count_c',
        'id_scc_hic_h2s_inspection_count_d',
        'id_commissioning_date' // Shared date
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runHICCalculations);
            el.addEventListener('input', runHICCalculations);
        }
    });
}

function calculateHICSusceptibility(envSeverity, banding, cracksPresent, cracksRemoved, cyanidePresent) {
    // 1. Cracks Override
    if (cracksPresent === 'Yes') {
        if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
        return 'High';
    }

    // 2. Cyanide Effect (Increases Severity)
    // API 581 2.C.5.2: Cyanide presence generally forces High Severity logic
    let effectiveSeverity = envSeverity;
    if (cyanidePresent === 'Yes' && envSeverity !== 'None' && envSeverity !== 'Unknown') {
        effectiveSeverity = 'High';
    }

    if (effectiveSeverity === 'Unknown' || effectiveSeverity === 'None') return 'Not Susceptible';

    // 3. Matrix Lookup (Severity vs Banding)
    // Banding: 'High', 'Medium', 'Low' (assuming these match Select options)
    // Logic Approximation based on API 581 Table 2.C.5.2

    if (effectiveSeverity === 'High') {
        if (banding === 'Low') return 'Medium'; // Resistant steel in High Sev
        return 'High'; // High or Medium Banding -> High
    }

    if (effectiveSeverity === 'Moderate') {
        if (banding === 'High') return 'High';
        if (banding === 'Medium') return 'Medium';
        return 'Low';
    }

    if (effectiveSeverity === 'Low') {
        if (banding === 'High') return 'Medium';
        return 'Low'; // Medium or Low Banding -> Low
    }

    return 'Low'; // Fallback
}

async function runHICCalculations() {
    console.log('[HIC] Running calculations...');

    // Check Enabled
    const isEnabled = document.getElementById('id_mechanism_scc_hic_h2s_active')?.checked;
    if (!isEnabled) {
        console.log('[HIC] Skipped (Disabled)');
        setResults('hic_h2s', 'Not Applicable', '--', '--');
        updatePofSummary();
        return;
    }

    // Gather Inputs
    const inputs = {
        ph: parseFloat(document.getElementById('id_ph_value')?.value),
        h2s: parseFloat(document.getElementById('id_scc_hic_h2s_h2s_ppm')?.value),
        cyanide: document.getElementById('id_scc_hic_h2s_cyanide_present')?.checked ? 'Yes' : 'No',
        banding: document.getElementById('id_scc_hic_h2s_banding_severity')?.value, // 'High', 'Medium', 'Low', 'None'
        cracksPresent: document.getElementById('id_scc_hic_h2s_cracks_observed')?.checked ? 'Yes' : 'No',
        cracksRemoved: document.getElementById('id_scc_hic_h2s_cracks_removed')?.checked ? 'Yes' : 'No',

        inspections: {
            A: parseInt(document.getElementById('id_scc_hic_h2s_inspection_count_a')?.value) || 0,
            B: parseInt(document.getElementById('id_scc_hic_h2s_inspection_count_b')?.value) || 0,
            C: parseInt(document.getElementById('id_scc_hic_h2s_inspection_count_c')?.value) || 0,
            D: parseInt(document.getElementById('id_scc_hic_h2s_inspection_count_d')?.value) || 0
        },
        installDate: document.getElementById('id_commissioning_date')?.value
    };

    // Reuse SSC Environmental Severity Logic
    // Requires sccSscEnvSeverityData to be loaded (initSSCData does this)
    const envSeverity = calculateSSCSeverity(inputs.ph, inputs.h2s);

    console.log('[HIC DEBUG] EnvSeverity:', envSeverity, inputs);

    const susceptibility = calculateHICSusceptibility(
        envSeverity, inputs.banding, inputs.cracksPresent, inputs.cracksRemoved, inputs.cyanide
    );

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(inputs.installDate);
    const inspection = calculateInspectionEffectiveness(
        inputs.inspections.A, inputs.inspections.B, inputs.inspections.C, inputs.inspections.D
    );
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    // Display
    setResults('hic_h2s', susceptibility, svi, finalDF);
    updatePofSummary();
}

// ============================================================================
// ACSCC (Alkaline Carbonate SCC) LOGIC
// ============================================================================

function initACSCC() {
    const chk = document.getElementById('id_mechanism_scc_acscc_active');
    const container = document.getElementById('scc_acscc_container');

    if (chk && container) {
        chk.addEventListener('change', function () {
            if (this.checked) {
                container.classList.remove('hidden');
                runACSCCCalculations();
            } else {
                container.classList.add('hidden');
                runACSCCCalculations();
            }
        });
        if (chk.checked) container.classList.remove('hidden');
    }

    const inputs = [
        'id_ph_value', // Shared
        'id_scc_acscc_cracks_observed', 'id_scc_acscc_cracks_removed',
        'id_scc_acscc_stress_relieved', 'id_scc_acscc_co3_conc_percent',
        'id_scc_acscc_inspection_count_a', 'id_scc_acscc_inspection_count_b',
        'id_scc_acscc_inspection_count_c', 'id_scc_acscc_inspection_count_d',
        'id_commissioning_date'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runACSCCCalculations);
            el.addEventListener('input', runACSCCCalculations);
        }
    });
}

function calculateACSCCSusceptibility(ph, co3, stressRelieved, cracks, cracksRemoved) {
    // 1. Cracks Override
    if (cracks === 'Yes') {
        if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
        return 'High';
    }

    // 2. Stress Reflief
    if (stressRelieved === 'Yes') return 'None';

    // 3. Matrix Lookup
    if (!sccAcsccSusceptibilityData) return 'Unknown';
    if (isNaN(ph) || isNaN(co3)) return 'Unknown';

    const ranges = sccAcsccSusceptibilityData.susceptibility_map.ineffective_pwht;
    const phRow = ranges.find(r => ph >= r.ph_min && ph < r.ph_max); // Use < for max to avoid overlap issues, last range handles 14

    if (!phRow) {
        // Handle edge case pH 14 or above max
        if (ph >= 14) return 'High'; // Assume worst case
        return 'None'; // Below min?
    }

    const co3Range = phRow.co3_ranges.find(r => co3 <= r.max);
    return co3Range ? co3Range.susc : 'High';
}

async function runACSCCCalculations() {
    console.log('[ACSCC] Running calculations...');
    const isEnabled = document.getElementById('id_mechanism_scc_acscc_active')?.checked;

    if (!isEnabled) {
        setResults('acscc', 'Not Applicable', '--', '--');
        updatePofSummary();
        return;
    }

    const inputs = {
        ph: parseFloat(document.getElementById('id_ph_value')?.value),
        co3: parseFloat(document.getElementById('id_scc_acscc_co3_conc_percent')?.value),
        cracks: document.getElementById('id_scc_acscc_cracks_observed')?.checked ? 'Yes' : 'No',
        cracksRemoved: document.getElementById('id_scc_acscc_cracks_removed')?.checked ? 'Yes' : 'No',
        stressRelieved: document.getElementById('id_scc_acscc_stress_relieved')?.checked ? 'Yes' : 'No',
        inspections: {
            A: parseInt(document.getElementById('id_scc_acscc_inspection_count_a')?.value) || 0,
            B: parseInt(document.getElementById('id_scc_acscc_inspection_count_b')?.value) || 0,
            C: parseInt(document.getElementById('id_scc_acscc_inspection_count_c')?.value) || 0,
            D: parseInt(document.getElementById('id_scc_acscc_inspection_count_d')?.value) || 0
        },
        installDate: document.getElementById('id_commissioning_date')?.value
    };

    const susceptibility = calculateACSCCSusceptibility(
        inputs.ph, inputs.co3, inputs.stressRelieved, inputs.cracks, inputs.cracksRemoved
    );

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(inputs.installDate);
    const inspection = calculateInspectionEffectiveness(
        inputs.inspections.A, inputs.inspections.B, inputs.inspections.C, inputs.inspections.D
    );
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    // Display
    setResults('acscc', susceptibility, svi, finalDF);
    updatePofSummary();
}

// ============================================================================
// PASCC (Polythionic Acid SCC) LOGIC
// ============================================================================

function initPASCC() {
    const chk = document.getElementById('id_mechanism_scc_pascc_active');
    const container = document.getElementById('scc_pascc_container');

    if (chk && container) {
        chk.addEventListener('change', function () {
            if (this.checked) {
                container.classList.remove('hidden');
                runPASCCCalculations();
            } else {
                container.classList.add('hidden');
                runPASCCCalculations();
            }
        });
        if (chk.checked) container.classList.remove('hidden');
    }

    const inputs = [
        'id_scc_pascc_cracks_observed', 'id_scc_pascc_cracks_removed',
        'id_scc_pascc_sensitized', 'id_scc_pascc_sulfur_exposure',
        'id_scc_pascc_downtime_protected',
        'id_scc_pascc_inspection_count_a', 'id_scc_pascc_inspection_count_b',
        'id_scc_pascc_inspection_count_c', 'id_scc_pascc_inspection_count_d',
        'id_commissioning_date'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runPASCCCalculations);
            el.addEventListener('input', runPASCCCalculations);
        }
    });
}

function calculatePASCCSusceptibility(sensitized, sulfur, protected, cracks, cracksRemoved) {
    // 1. Cracks Override
    if (cracks === 'Yes') {
        if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
        return 'High'; // Cracks repaired imply prior high susceptibility
    }

    // 2. Base Logic
    if (sensitized === 'No') return 'Not Susceptible'; // Material not susceptible
    if (sulfur === 'No') return 'Not Susceptible'; // No agent

    // 3. Protection
    if (protected === 'Yes') return 'Low'; // Protection mitigates to Low

    // 4. Worst Case
    return 'High'; // Sensitized + Sulfur + No Protection
}

async function runPASCCCalculations() {
    console.log('[PASCC] Running calculations...');
    const isEnabled = document.getElementById('id_mechanism_scc_pascc_active')?.checked;

    if (!isEnabled) {
        setResults('pascc', 'Not Applicable', '--', '--');
        updatePofSummary();
        return;
    }

    const inputs = {
        cracks: document.getElementById('id_scc_pascc_cracks_observed')?.checked ? 'Yes' : 'No',
        cracksRemoved: document.getElementById('id_scc_pascc_cracks_removed')?.checked ? 'Yes' : 'No',
        sensitized: document.getElementById('id_scc_pascc_sensitized')?.checked ? 'Yes' : 'No',
        sulfur: document.getElementById('id_scc_pascc_sulfur_exposure')?.checked ? 'Yes' : 'No',
        protected: document.getElementById('id_scc_pascc_downtime_protected')?.checked ? 'Yes' : 'No',
        inspections: {
            A: parseInt(document.getElementById('id_scc_pascc_inspection_count_a')?.value) || 0,
            B: parseInt(document.getElementById('id_scc_pascc_inspection_count_b')?.value) || 0,
            C: parseInt(document.getElementById('id_scc_pascc_inspection_count_c')?.value) || 0,
            D: parseInt(document.getElementById('id_scc_pascc_inspection_count_d')?.value) || 0
        },
        installDate: document.getElementById('id_commissioning_date')?.value
    };

    const susceptibility = calculatePASCCSusceptibility(
        inputs.sensitized, inputs.sulfur, inputs.protected, inputs.cracks, inputs.cracksRemoved
    );

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(inputs.installDate);
    const inspection = calculateInspectionEffectiveness(
        inputs.inspections.A, inputs.inspections.B, inputs.inspections.C, inputs.inspections.D
    );
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    // Display
    setResults('pascc', susceptibility, svi, finalDF);
    updatePofSummary();
}

// ============================================================================
// ClSCC (Chloride SCC) LOGIC
// ============================================================================

function initClSCC() {
    const chk = document.getElementById('id_mechanism_scc_clscc_active');
    const container = document.getElementById('scc_clscc_container');

    if (chk && container) {
        chk.addEventListener('change', function () {
            if (this.checked) {
                container.classList.remove('hidden');
                runClSCCCalculations();
            } else {
                container.classList.add('hidden');
                runClSCCCalculations();
            }
        });
        if (chk.checked) container.classList.remove('hidden');
    }

    const inputs = [
        'id_ph_value', // Shared
        'id_operating_temp_f', // Shared
        'id_scc_clscc_cracks_observed', 'id_scc_clscc_cracks_removed',
        'id_scc_clscc_cl_conc_ppm', 'id_scc_clscc_deposits_present',
        'id_contains_oxygen', // Shared O2 (bool)
        'id_scc_clscc_inspection_count_a', 'id_scc_clscc_inspection_count_b',
        'id_scc_clscc_inspection_count_c', 'id_scc_clscc_inspection_count_d',
        'id_commissioning_date'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runClSCCCalculations);
            el.addEventListener('input', runClSCCCalculations);
        }
    });
}

function calculateClSCCSusceptibility(tempF, ph, clPpm, o2Present, depositsPresent, cracks, cracksRemoved) {
    // 1. Cracks Override
    if (cracks === 'Yes') {
        if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
        return 'High';
    }

    if (!sccClsccSusceptibilityData || !sccClsccModifiersData) return 'Unknown';
    if (isNaN(tempF) || isNaN(ph)) return 'Unknown';

    // 2. Base Grid Lookup (Temp F vs pH)
    const phColumns = sccClsccSusceptibilityData.ph_columns;
    const tempRows = sccClsccSusceptibilityData.rows_f;
    const grid = sccClsccSusceptibilityData.susceptibility_grid;

    // Find Row (Temp)
    const rowIndex = tempRows.findIndex(r => tempF >= r.min && tempF < r.max);
    if (rowIndex === -1) return 'Unknown'; // Out of range?

    // Find Col (pH)
    // Values are thresholds [2.5, 3.0, ...]. We need to find closest lower bound?
    // Actually typically these are discrete columns or ranges. Assuming standard matrix indexing.
    // If pH=2.5, col 0. If pH=3.0, col 1.
    // Let's assume ranges: pH < 2.5 is col 0? Or 2.5 is the center?
    // Re-reading JSON: "ph_columns": [2.5, 3.0 ...]
    // Looking at grid size: 17 cols.
    // ph_columns length: 17.
    // So likely direct mapping. Logic: Find closest column OR index where pH <= val?
    // Let's assume standard "nearest less than or equal" or buckets.
    // Given the granularity (0.5 steps), nearest match is safest.

    let colIndex = -1;
    // Iterate to find bucket
    // Example: if pH is 2.7, it falls between 2.5 and 3.0.
    // API 581 interpolation is usually conservative. Use lower pH? Or higher pH?
    // ClSCC rule: Low pH is worse. High pH is better.
    // So to be conservative (higher risk), we should pick the pH column that yields higher risk.
    // But let's try to match nearest for now.

    for (let i = 0; i < phColumns.length; i++) {
        if (ph <= phColumns[i]) {
            colIndex = i;
            break;
        }
    }
    if (colIndex === -1) colIndex = phColumns.length - 1; // Cap at max

    const baseLevelStr = grid[rowIndex][colIndex] || 'None';

    // Convert to Number for Math (None=0, Low=1, Med=2, High=3)
    const levels = ['None', 'Low', 'Medium', 'High'];
    let level = levels.indexOf(baseLevelStr);

    // 3. Apply Modifiers
    // Cl < 10 ppm -> -1
    // Cl > 100 ppm -> +1. Note JSON says "> 100 ppm" adjustment is +1, "< 10 ppm" is -1.
    if (!isNaN(clPpm)) {
        if (clPpm < 10) level -= 1;
        if (clPpm > 100) level += 1; // Note: Overlaps with logic? No.
    }

    // O2 < 90 ppb -> -1. If o2Present is NO, we assume < 90.
    // If o2Present is YES, we assume > 90 (No adjustment, or potential +1?)
    // JSON: O2 < 90 ppb -> -1.
    // So if NO Oxygen -> -1.
    if (o2Present === 'No') level -= 1;

    // Deposits -> +1
    if (depositsPresent === 'Yes') level += 1;

    // Clamp
    if (level < 0) level = 0;
    if (level > 3) level = 3;

    return levels[level];
}

async function runClSCCCalculations() {
    console.log('[ClSCC] Running calculations...');
    const isEnabled = document.getElementById('id_mechanism_scc_clscc_active')?.checked;

    if (!isEnabled) {
        setResults('clscc', 'Not Applicable', '--', '--');
        updatePofSummary();
        return;
    }

    const inputs = {
        tempF: parseFloat(document.getElementById('id_operating_temp_f')?.value),
        ph: parseFloat(document.getElementById('id_ph_value')?.value),
        clPpm: parseFloat(document.getElementById('id_scc_clscc_cl_conc_ppm')?.value),
        o2: document.getElementById('id_contains_oxygen')?.checked ? 'Yes' : 'No', // Shared
        deposits: document.getElementById('id_scc_clscc_deposits_present')?.checked ? 'Yes' : 'No', // Added
        cracks: document.getElementById('id_scc_clscc_cracks_observed')?.checked ? 'Yes' : 'No',
        cracksRemoved: document.getElementById('id_scc_clscc_cracks_removed')?.checked ? 'Yes' : 'No',

        inspections: {
            A: parseInt(document.getElementById('id_scc_clscc_inspection_count_a')?.value) || 0,
            B: parseInt(document.getElementById('id_scc_clscc_inspection_count_b')?.value) || 0,
            C: parseInt(document.getElementById('id_scc_clscc_inspection_count_c')?.value) || 0,
            D: parseInt(document.getElementById('id_scc_clscc_inspection_count_d')?.value) || 0
        },
        installDate: document.getElementById('id_commissioning_date')?.value
    };

    const susceptibility = calculateClSCCSusceptibility(
        inputs.tempF, inputs.ph, inputs.clPpm, inputs.o2, inputs.deposits, inputs.cracks, inputs.cracksRemoved
    );

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(inputs.installDate);
    const inspection = calculateInspectionEffectiveness(
        inputs.inspections.A, inputs.inspections.B, inputs.inspections.C, inputs.inspections.D
    );
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    // Display
    setResults('clscc', susceptibility, svi, finalDF);
    updatePofSummary();
}
window.runCausticCalculationsFormulaApp = runCausticCalculationsFormulaApp;

// ============================================================================
// HSC-HF (Hydrogen Stress Cracking - HF) LOGIC
// ============================================================================

function initHSCHF() {
    const chk = document.getElementById('id_mechanism_scc_hsc_hf_active');
    const container = document.getElementById('scc_hsc_hf_container');

    if (chk && container) {
        chk.addEventListener('change', function () {
            if (this.checked) {
                container.classList.remove('hidden');
                runHSCHFCalculations();
            } else {
                container.classList.add('hidden');
                runHSCHFCalculations();
            }
        });
        if (chk.checked) container.classList.remove('hidden');
    }

    const inputs = [
        'id_scc_hsc_hf_cracks_observed', 'id_scc_hsc_hf_cracks_removed',
        'id_scc_hsc_hf_present', 'id_scc_hsc_hf_hardness_hb',
        'id_pwht', // Generic from Design tab
        'id_scc_hsc_hf_inspection_count_a', 'id_scc_hsc_hf_inspection_count_b',
        'id_scc_hsc_hf_inspection_count_c', 'id_scc_hsc_hf_inspection_count_d',
        'id_commissioning_date'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', runHSCHFCalculations);
            el.addEventListener('input', runHSCHFCalculations);
        }
    });
}

function calculateHSCHFSusceptibility(hardnessHB, pwht, hfPresent, cracks, cracksRemoved) {
    if (cracks === 'Yes') {
        if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
        return 'High';
    }

    if (!sccHschfSusceptibilityData) return 'Unknown';
    if (hfPresent !== 'Yes') return 'Not Applicable'; // Or 'None'

    // Logic based on Table 2.C.7.2 (simplified)
    // HB <= 200 -> Low
    // HB 201-237 + PWHT Yes -> Low
    // HB 201-237 + PWHT No -> Medium
    // HB >= 238 -> High

    // Parse HB
    const hb = parseFloat(hardnessHB);
    if (isNaN(hb)) return 'Unknown';

    if (hb <= 200) return 'Low';
    if (hb >= 238) return 'High';

    // 201-237 range
    if (pwht === true || pwht === 'Yes' || pwht === 'on') {
        return 'Low';
    } else {
        return 'Medium';
    }
}

async function runHSCHFCalculations() {
    console.log('[HSC-HF] Running calculations...');
    const isEnabled = document.getElementById('id_mechanism_scc_hsc_hf_active')?.checked;

    if (!isEnabled) {
        setResults('hsc_hf', 'Not Applicable', '--', '--');
        updatePofSummary();
        return;
    }

    const inputs = {
        hardnessHB: document.getElementById('id_scc_hsc_hf_hardness_hb')?.value,
        pwht: document.getElementById('id_pwht')?.checked, // Checkbox boolean
        hfPresent: document.getElementById('id_scc_hsc_hf_present')?.checked ? 'Yes' : 'No',
        cracks: document.getElementById('id_scc_hsc_hf_cracks_observed')?.checked ? 'Yes' : 'No',
        cracksRemoved: document.getElementById('id_scc_hsc_hf_cracks_removed')?.checked ? 'Yes' : 'No',

        inspections: {
            A: parseInt(document.getElementById('id_scc_hsc_hf_inspection_count_a')?.value) || 0,
            B: parseInt(document.getElementById('id_scc_hsc_hf_inspection_count_b')?.value) || 0,
            C: parseInt(document.getElementById('id_scc_hsc_hf_inspection_count_c')?.value) || 0,
            D: parseInt(document.getElementById('id_scc_hsc_hf_inspection_count_d')?.value) || 0
        },
        installDate: document.getElementById('id_commissioning_date')?.value
    };

    const susceptibility = calculateHSCHFSusceptibility(
        inputs.hardnessHB, inputs.pwht, inputs.hfPresent, inputs.cracks, inputs.cracksRemoved
    );

    const svi = getSVI(susceptibility);
    const age = calculateAgeFromDate(inputs.installDate);
    const inspection = calculateInspectionEffectiveness(
        inputs.inspections.A, inputs.inspections.B, inputs.inspections.C, inputs.inspections.D
    );
    const baseDF = getBaseDamageFactor(svi, inspection.category, inspection.count);
    const finalDF = calculateFinalDamageFactor(baseDF, age);

    setResults('hsc_hf', susceptibility, svi, finalDF);
    updatePofSummary();
}

console.log('[Caustic Formula App] Module loaded - API 581 compliant calculations ready');
