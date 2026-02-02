/**
 * RISK MATRIX CALCULATIONS
 * Combines POF and COF to determine overall risk level
 * API 580/581 Compliant
 */

// =============================================================================
// CONFIGURATION HELPERS
// =============================================================================

/**
 * Get current matrix configuration from radio buttons
 */
function getMatrixConfig() {
    return {
        computationType: document.querySelector('input[name="computation_type"]:checked')?.value || 'quantitative',
        consequenceMetric: document.querySelector('input[name="consequence_metric"]:checked')?.value || 'fc',
        probabilityMetric: document.querySelector('input[name="probability_metric"]:checked')?.value || 'pf'
    };
}

// =============================================================================
// DAMAGE FACTOR (Df) CALCULATIONS
// =============================================================================

/**
 * Calculate Df for thinning mechanisms
 */
function calculateThinningDfMax() {
    const mechanisms = ['co2', 'hcl', 'h2so4', 'hf', 'amine',
        'alkaline', 'acid', 'soil', 'h2s_h2', 'sulfidic'];
    let maxDf = 0;
    mechanisms.forEach(mech => {
        const isActive = document.getElementById(`id_mech_thinning_${mech}_active`)?.checked;
        if (isActive) {
            const rate = parseFloat(document.getElementById(`id_${mech}_corrosion_rate_mpy`)?.value) || 0;
            const df = calculateGeneralThinningDF(rate);
            if (df > maxDf) maxDf = df;
        }
    });
    return maxDf;
}

/**
 * Calculate Df for cracking mechanisms
 */
function calculateCrackingDfMax() {
    const mechanisms = ['scc_caustic', 'scc_amine', 'scc_ssc', 'scc_hic_h2s',
        'scc_acscc', 'scc_pascc', 'scc_clscc', 'scc_hsc_hf'];
    let maxDf = 0;
    mechanisms.forEach(mechId => {
        const isActive = document.getElementById(`id_mechanism_${mechId}_active`)?.checked;
        if (isActive) {
            const df = parseFloat(document.getElementById(`res_${mechId}_df`)?.textContent) || 0;
            if (df > maxDf) maxDf = df;
        }
    });
    return maxDf;
}

/**
 * Calculate Df for external damage mechanisms  
 */
function calculateExternalDfMax() {
    let maxDf = 0;

    if (document.getElementById('id_mech_ext_corrosion_active')?.checked) {
        const rate = parseFloat(document.getElementById('id_external_corrosion_rate_mpy')?.value) || 0;
        const df = calculateGeneralThinningDF(rate);
        if (df > maxDf) maxDf = df;
    }

    if (document.getElementById('id_mech_cui_active')?.checked) {
        const rate = parseFloat(document.getElementById('id_cui_corrosion_rate_mpy')?.value) || 0;
        const df = calculateGeneralThinningDF(rate);
        if (df > maxDf) maxDf = df;
    }

    return maxDf;
}

/**
 * Calculate Df for metallurgical mechanisms
 */
function calculateMetallurgicalDfMax() {
    let maxDf = 0;

    if (document.getElementById('id_mechanism_brittle_fracture_active')?.checked) {
        const df = parseFloat(document.getElementById('id_brittle_damage_factor')?.value) || 0;
        if (df > maxDf) maxDf = df;
    }

    if (document.getElementById('id_mechanism_htha_active')?.checked) {
        const df = parseFloat(document.getElementById('id_htha_damage_factor')?.value) || 0;
        if (df > maxDf) maxDf = df;
    }

    return maxDf;
}

/**
 * Convert corrosion rate to Damage Factor
 * Based on formula_app_adapter.js logic
 */
function calculateGeneralThinningDF(rateMpy) {
    if (rateMpy <= 0) return 0;
    if (rateMpy < 0.01) return 1;
    if (rateMpy < 0.05) return 10;
    if (rateMpy < 0.1) return 50;
    if (rateMpy < 0.5) return 100;
    return 1000;
}

/**
 * Convert Df to POF category (1-4)
 * Same logic as dfToPof() in formula_app_adapter.js
 */
function dfToPofCategory(df) {
    if (df <= 0) return 0;
    if (df < 10) return 1;
    if (df < 100) return 2;
    if (df < 1000) return 3;
    return 4;
}

/**
 * Get aggregated maximum Df from all mechanisms
 */
function calculateDfTotal() {
    const thinningDf = calculateThinningDfMax();
    const crackingDf = calculateCrackingDfMax();
    const externalDf = calculateExternalDfMax();
    const metallurgicalDf = calculateMetallurgicalDfMax();

    return Math.max(thinningDf, crackingDf, externalDf, metallurgicalDf);
}

// Initialize Risk Matrix Grid
function initRiskMatrix() {
    const container = document.getElementById('risk-matrix-grid');
    if (!container) {
        console.error('[Risk Matrix] Container not found');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Get current configuration
    const config = getMatrixConfig();
    console.log('[Risk Matrix] Starting initialization with config:', config);

    // Determine axis labels based on mode
    let pofLevels, pofLabels, yAxisLabel;

    if (config.probabilityMetric === 'df') {
        // Df mode - 4 ranges
        pofLevels = ['', '4', '3', '2', '1'];  // Top to bottom
        pofLabels = ['Df', '≥1000', '100-1000', '10-100', '<10'];
        yAxisLabel = 'Df';
    } else {
        // Pf mode - 5 levels  
        pofLevels = ['', '5', '4', '3', '2', '1'];
        pofLabels = ['POF', 'FREQUENT', 'LIKELY', 'OCCASIONAL', 'UNLIKELY', 'RARE'];
        yAxisLabel = 'POF';
    }

    // X-axis labels based on consequence metric
    let cofCategories = ['', 'A', 'B', 'C', 'D', 'E'];
    let cofLabels, xAxisLabel;

    if (config.consequenceMetric === 'ca') {
        cofLabels = ['CA', 'NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'];
        xAxisLabel = 'CA';
    } else {
        cofLabels = ['COF', 'NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'];
        xAxisLabel = 'FC';
    }

    const gridRows = pofLevels.length; // 5 or 6 depending on mode
    const gridCols = 6; // Always 6 (label + 5 COF categories)

    let cellCount = 0;

    // Build grid - dynamic rows based on mode
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            const cell = document.createElement('div');

            // Y-axis labels (left column)
            if (col === 0 && row >= 0) {
                const isDataRow = row < (gridRows - 1);
                cell.className = 'axis-label' + (isDataRow ? ' axis-label-y' : '');
                cell.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                    color: #374151;
                    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                    text-align: center;
                    padding: 6px;
                    border-radius: 4px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                `;
                if (isDataRow) {
                    cell.innerHTML = `<div class="text-center"><div class="font-bold" style="font-size: 14px; margin-bottom: 2px;">${pofLevels[row + 1]}</div><div style="font-size: 9px; line-height: 1.2;">${pofLabels[row + 1]}</div></div>`;
                } else {
                    cell.innerHTML = `<div class="font-bold" style="font-size: 12px;">${pofLabels[0]}</div>`;
                }
                container.appendChild(cell);
                continue;
            }

            // X-axis labels (bottom row)
            if (row === (gridRows - 1) && col > 0) {
                cell.className = 'axis-label';
                cell.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                    color: #374151;
                    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                    text-align: center;
                    padding: 6px;
                    border-radius: 4px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                `;
                cell.innerHTML = `<div class="text-center"><div class="font-bold" style="font-size: 14px; margin-bottom: 2px;">${cofCategories[col]}</div><div style="font-size: 9px; line-height: 1.2;">${cofLabels[col]}</div></div>`;
                container.appendChild(cell);
                continue;
            }

            // Risk cells (excluding axis labels)
            const maxPofLevel = pofLevels.length - 2; // Max POF level (5 for Pf, 4 for Df)
            if (col > 0 && row < (gridRows - 1)) {
                // Calculate POF value for this cell (from top to bottom)
                const pofValue = maxPofLevel + 1 - row; // Top row = max value
                const cofCategory = cofCategories[col];
                const riskScore = pofValue + col; // Calculate risk score for display

                // Calculate risk level
                const riskLevel = calculateRiskLevel(pofValue, col);

                // Apply beautiful inline styles with colors and effects
                cell.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    color: white;
                    font-size: 24px;
                    cursor: help;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    position: relative;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                    ${getRiskColorStyle(riskLevel)}
                `;

                // Add hover effect via event listeners
                cell.addEventListener('mouseenter', function () {
                    this.style.transform = 'scale(1.08)';
                    this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    this.style.zIndex = '100';
                });

                cell.addEventListener('mouseleave', function () {
                    if (!this.classList.contains('current-position-active')) {
                        this.style.transform = 'scale(1)';
                        this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                        this.style.zIndex = '1';
                    }
                });

                cell.dataset.pof = pofValue;
                cell.dataset.cof = cofCategory;

                const titleText = `POF: ${pofValue}, COF: ${cofCategory}
${riskLevel.toUpperCase()} RISK
Score: ${riskScore}`;
                cell.title = titleText;

                // Add risk score as visible content
                cell.textContent = riskScore;

                container.appendChild(cell);
                cellCount++;
                console.log(`[Risk Matrix] Cell ${cellCount}: POF=${pofValue}, COF=${cofCategory}, Level=${riskLevel}, Score=${riskScore}`);
            }
        }
    }

    console.log(`[Risk Matrix] ✅ Initialized with ${cellCount} risk cells`);
}

// Calculate risk level based on POF (1-5) and COF index (1-5)
function calculateRiskLevel(pof, cofIndex) {
    // Simple risk scoring: sum of POF + COF index
    const riskScore = pof + cofIndex;

    // Risk thresholds (API 580 guideline)
    if (riskScore <= 3) return 'low';           // Green
    if (riskScore <= 5) return 'medium';        // Yellow
    if (riskScore <= 7) return 'medium-high';   // Orange
    return 'high';                               // Red
}

function getRiskColorStyle(level) {
    const colors = {
        'low': 'background: linear-gradient(135deg, #10b981 0%, #059669 100%);',
        'medium': 'background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);',
        'medium-high': 'background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);',
        'high': 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);'
    };
    return colors[level] || colors['low'];
}

function getRiskColorClass(level) {
    const colors = {
        'low': 'risk-low',
        'medium': 'risk-medium',
        'medium-high': 'risk-medium-high',
        'high': 'risk-high'
    };
    return colors[level] || 'risk-low';
}

// Update Risk Matrix with current POF and COF
function updateRiskMatrix() {
    console.log('[Risk Matrix] Updating...');

    // Get configuration
    const config = getMatrixConfig();
    console.log('[Risk Matrix] Configuration:', config);

    // Calculate POF/Df based on selected mode
    let currentProbability, probabilityValue;

    if (config.probabilityMetric === 'df') {
        // Use Damage Factor
        const dfTotal = calculateDfTotal();
        currentProbability = dfToPofCategory(dfTotal); // Convert to 1-4 scale
        probabilityValue = dfTotal; // Keep original Df value for display
        console.log(`[Risk Matrix] Df Total: ${dfTotal}, Category: ${currentProbability}`);
    } else {
        // Use Probability of Failure (Pf)
        const pofMetalLoss = parseInt(document.getElementById('pof_metal_loss')?.textContent) || 0;
        const pofCracking = parseInt(document.getElementById('pof_cracking')?.textContent) || 0;
        const pofExternal = parseInt(document.getElementById('pof_external')?.textContent) || 0;
        const pofMetallurgical = parseInt(document.getElementById('pof_metallurgical')?.textContent) || 0;
        const pofMechanical = parseInt(document.getElementById('pof_mechanical')?.textContent) || 0;
        const pofOther = parseInt(document.getElementById('pof_other')?.textContent) || 0;

        currentProbability = Math.max(pofMetalLoss, pofCracking, pofExternal, pofMetallurgical, pofMechanical, pofOther);
        probabilityValue = currentProbability;
        console.log(`[Risk Matrix] POF: ${currentProbability}`);
    }

    // Calculate COF category based on selected metric
    let cofCategory;

    if (config.consequenceMetric === 'ca') {
        // Use Consequence Area
        cofCategory = calculateCACategory();
    } else {
        // Use Financial Consequence
        cofCategory = calculateCOFCategory();
    }

    console.log(`[Risk Matrix] Current values: Probability=${currentProbability}, COF=${cofCategory}`);

    // Regenerate matrix if mode changed
    const container = document.getElementById('risk-matrix-grid');
    if (container && container.dataset.currentMode !== config.probabilityMetric) {
        console.log('[Risk Matrix] Mode changed, regenerating grid...');
        container.dataset.currentMode = config.probabilityMetric;
        initRiskMatrix();
    }

    // Update summary cards
    updatePOFCard(currentProbability, probabilityValue, config);
    updateCOFCard(cofCategory, config);

    // Highlight current cell in matrix
    highlightCurrentRisk(currentProbability, cofCategory);

    // Update risk level card
    updateRiskLevelCard(currentProbability, cofCategory);

    // Update details breakdown
    updateDetailsBreakdown(currentProbability, cofCategory, config);
}

function updatePOFCard(value, rawValue, config) {
    const metric = config.probabilityMetric === 'df' ? 'Df' : 'POF';

    if (config.probabilityMetric === 'df') {
        // Df mode - show range
        const labels = {
            0: 'Not Calculated',
            1: 'Df Range 1 (<10)',
            2: 'Df Range 2 (10-100)',
            3: 'Df Range 3 (100-1000)',
            4: 'Df Range 4 (≥1000)'
        };
        document.getElementById('risk_pof_value').textContent = rawValue || '--';
        document.getElementById('risk_pof_label').textContent = labels[value] || 'Range --';
    } else {
        // Pf mode - show level
        const labels = {
            0: 'Not Calculated',
            1: 'Level 1 - Rare',
            2: 'Level 2 - Unlikely',
            3: 'Level 3 - Occasional',
            4: 'Level 4 - Likely',
            5: 'Level 5 - Frequent'
        };
        document.getElementById('risk_pof_value').textContent = value || '--';
        document.getElementById('risk_pof_label').textContent = labels[value] || 'Level --';
    }
}

function updateCOFCard(cofCategory, config) {
    const metric = config.consequenceMetric === 'ca' ? 'CA' : 'FC';

    const labels = {
        'A': `Category A - Negligible (${metric})`,
        'B': `Category B - Minor (${metric})`,
        'C': `Category C - Moderate (${metric})`,
        'D': `Category D - Major (${metric})`,
        'E': `Category E - Catastrophic (${metric})`
    };

    document.getElementById('risk_cof_category').textContent = cofCategory || '--';
    document.getElementById('risk_cof_label').textContent = labels[cofCategory] || 'Category --';
}

function calculateCOFCategory() {
    // Financial Consequence - existing logic
    const fcTotalEl = document.getElementById('val_fc_total');
    if (!fcTotalEl) return 'A';

    const fcText = fcTotalEl.textContent || '0';
    const fcTotal = parseFloat(fcText.replace(/[^0-9.]/g, '')) || 0;

    console.log('[Risk Matrix] Financial Consequence Total:', fcTotal);

    // API 580 Table 5.1 - Financial Consequence Categories
    if (fcTotal < 10000) return 'A';
    if (fcTotal < 100000) return 'B';
    if (fcTotal < 1000000) return 'C';
    if (fcTotal < 10000000) return 'D';
    return 'E';
}

function calculateCACategory() {
    // Consequence Area
    const cmdArea = parseFloat(document.getElementById('val_final_cmd')?.textContent) || 0;
    const injArea = parseFloat(document.getElementById('val_final_inj')?.textContent) || 0;

    // Use maximum area
    const totalArea = Math.max(cmdArea, injArea);

    console.log('[Risk Matrix] Consequence Area - CMD:', cmdArea, 'INJ:', injArea, 'Max:', totalArea);

    // API 581 Table C.2 - Consequence Area Categories (ft²)
    // These thresholds may need adjustment based on API 581 standards
    if (totalArea < 1000) return 'A';
    if (totalArea < 5000) return 'B';
    if (totalArea < 15000) return 'C';
    if (totalArea < 40000) return 'D';
    return 'E';
}

function highlightCurrentRisk(pof, cofCategory) {
    // Remove previous highlight AND checkmarks
    document.querySelectorAll('[data-pof]').forEach(cell => {
        if (cell.dataset.pof && cell.dataset.cof) {
            cell.classList.remove('current-position-active');
            cell.style.border = 'none';
            cell.style.transform = 'scale(1)';
            cell.style.zIndex = '1';

            // Remove any checkmarks from previous highlights
            const oldCheckmark = cell.querySelector('div[data-checkmark]');
            if (oldCheckmark) {
                oldCheckmark.remove();
            }
        }
    });

    if (pof === 0 || !cofCategory) {
        console.log('[Risk Matrix] No valid POF/COF to highlight');
        return;
    }

    // Find and highlight current cell
    const currentCell = document.querySelector(`[data-pof="${pof}"][data-cof="${cofCategory}"]`);
    if (currentCell) {
        currentCell.classList.add('current-position-active');
        currentCell.style.border = '4px solid #1e40af';
        currentCell.style.boxShadow = '0 0 30px rgba(30, 64, 175, 0.7), 0 8px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        currentCell.style.transform = 'scale(1.08)';
        currentCell.style.zIndex = '200';

        // Add checkmark
        const checkmark = document.createElement('div');
        checkmark.dataset.checkmark = 'true'; // Add identifier for removal
        checkmark.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            font-size: 18px;
            font-weight: bold;
            color: rgba(255, 255, 255, 0.95);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        `;
        checkmark.textContent = '✓';
        currentCell.appendChild(checkmark);

        console.log(`[Risk Matrix] ✓ Highlighted cell: POF=${pof}, COF=${cofCategory}`);
    } else {
        console.warn(`[Risk Matrix] ⚠ Cell not found: POF=${pof}, COF=${cofCategory}`);
    }
}

function updateRiskLevelCard(pof, cofCategory) {
    const cofIndex = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 }[cofCategory] || 0;
    const riskLevel = calculateRiskLevel(pof, cofIndex);

    const card = document.getElementById('risk_level_card');
    const valueEl = document.getElementById('risk_level_value');
    const priorityEl = document.getElementById('risk_priority');

    const riskData = {
        'low': {
            text: 'LOW RISK',
            borderColor: 'border-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-900',
            priority: 'Priority 4 - Acceptable'
        },
        'medium': {
            text: 'MEDIUM RISK',
            borderColor: 'border-yellow-500',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-900',
            priority: 'Priority 3 - Monitor'
        },
        'medium-high': {
            text: 'MEDIUM-HIGH RISK',
            borderColor: 'border-orange-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-900',
            priority: 'Priority 2 - Mitigation Required'
        },
        'high': {
            text: 'HIGH RISK',
            borderColor: 'border-red-600',
            bgColor: 'bg-red-50',
            textColor: 'text-red-900',
            priority: 'Priority 1 - Immediate Action Required'
        }
    };

    const data = riskData[riskLevel];
    if (data && card && valueEl && priorityEl) {
        card.className = `card shadow-md border-t-4 ${data.borderColor}`;
        card.querySelector('.card-body').className = `card-body p-4 ${data.bgColor}`;
        valueEl.textContent = data.text;
        valueEl.className = `text-2xl font-bold ${data.textColor}`;
        priorityEl.textContent = data.priority;
    }
}

function updateDetailsBreakdown(currentProbability, cofCategory, config) {
    // Update POF/Df details based on mode
    if (config.probabilityMetric === 'df') {
        // Show Df breakdown
        const thinningDf = calculateThinningDfMax();
        const crackingDf = calculateCrackingDfMax();
        const externalDf = calculateExternalDfMax();
        const metallurgicalDf = calculateMetallurgicalDfMax();

        document.getElementById('detail_pof_metal_loss').textContent = thinningDf || '0';
        document.getElementById('detail_pof_cracking').textContent = crackingDf || '0';
        document.getElementById('detail_pof_external').textContent = externalDf || '0';
        document.getElementById('detail_pof_metallurgical').textContent = metallurgicalDf || '0';
        document.getElementById('detail_pof_final').textContent = calculateDfTotal() || '0';
    } else {
        // Show POF breakdown
        const pofMetalLoss = parseInt(document.getElementById('pof_metal_loss')?.textContent) || 0;
        const pofCracking = parseInt(document.getElementById('pof_cracking')?.textContent) || 0;
        const pofExternal = parseInt(document.getElementById('pof_external')?.textContent) || 0;
        const pofMetallurgical = parseInt(document.getElementById('pof_metallurgical')?.textContent) || 0;

        document.getElementById('detail_pof_metal_loss').textContent = pofMetalLoss || '0';
        document.getElementById('detail_pof_cracking').textContent = pofCracking || '0';
        document.getElementById('detail_pof_external').textContent = pofExternal || '0';
        document.getElementById('detail_pof_metallurgical').textContent = pofMetallurgical || '0';
        document.getElementById('detail_pof_final').textContent = currentProbability || '0';
    }

    // Update COF details based on metric
    if (config.consequenceMetric === 'ca') {
        // Show Consequence Area details
        const cmdArea = document.getElementById('val_final_cmd')?.textContent || '0 ft²';
        const injArea = document.getElementById('val_final_inj')?.textContent || '0 ft²';

        document.getElementById('detail_fc_flam').textContent = cmdArea;
        document.getElementById('detail_fc_toxic').textContent = '—';
        document.getElementById('detail_fc_inj').textContent = injArea;
        document.getElementById('detail_fc_env').textContent = '—';
        document.getElementById('detail_fc_total').textContent = Math.max(parseFloat(cmdArea) || 0, parseFloat(injArea) || 0) + ' ft²';
    } else {
        // Show Financial Consequence details
        const fcFlam = document.getElementById('val_fc_flam')?.textContent || '$0';
        const fcToxic = document.getElementById('val_fc_toxic')?.textContent || '$0';
        const fcInj = document.getElementById('val_fc_inj')?.textContent || '$0';
        const fcEnv = document.getElementById('val_fc_env')?.textContent || '$0';
        const fcTotal = document.getElementById('val_fc_total')?.textContent || '$0';

        document.getElementById('detail_fc_flam').textContent = fcFlam;
        document.getElementById('detail_fc_toxic').textContent = fcToxic;
        document.getElementById('detail_fc_inj').textContent = fcInj;
        document.getElementById('detail_fc_env').textContent = fcEnv;
        document.getElementById('detail_fc_total').textContent = fcTotal;
    }

    document.getElementById('detail_cof_category').textContent = cofCategory || '--';
}

// Hook into existing POF update function
if (typeof window !== 'undefined') {
    // Store original function if it exists
    if (typeof updatePofSummary !== 'undefined') {
        const originalUpdatePofSummary = updatePofSummary;
        window.updatePofSummary = function () {
            originalUpdatePofSummary();

            // Update risk matrix if tab is visible
            const riskTab = document.getElementById('risk-tab-content');
            if (riskTab && !riskTab.classList.contains('hidden')) {
                updateRiskMatrix();
            }
        };
    }

    // Add event listeners for matrix configuration changes
    document.addEventListener('DOMContentLoaded', function () {
        console.log('[Risk Matrix] Setting up configuration listeners...');

        // Listen to all radio button changes
        const radioButtons = document.querySelectorAll('input[name="computation_type"], input[name="consequence_metric"], input[name="probability_metric"]');

        radioButtons.forEach(radio => {
            radio.addEventListener('change', function () {
                console.log('[Risk Matrix] Configuration changed:', this.name, '=', this.value);

                // Update matrix with new configuration
                updateRiskMatrix();
            });
        });

        console.log('[Risk Matrix] Configuration listeners registered for', radioButtons.length, 'radio buttons');
    });
}

console.log('[Risk Matrix] 📊 Module loaded successfully');
