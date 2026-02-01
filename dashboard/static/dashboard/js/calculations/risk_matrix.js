/**
 * RISK MATRIX CALCULATIONS
 * Combines POF and COF to determine overall risk level
 * API 580/581 Compliant
 */

// Initialize Risk Matrix Grid
function initRiskMatrix() {
    const container = document.getElementById('risk-matrix-grid');
    if (!container) {
        console.error('[Risk Matrix] Container not found');
        return;
    }

    // Clear existing content
    container.innerHTML = '';
    console.log('[Risk Matrix] Starting initialization...');

    // Y-axis labels (POF) - from top to bottom: 5, 4, 3, 2, 1
    const pofLevels = ['', '5', '4', '3', '2', '1'];
    const pofLabels = ['POF', 'FREQUENT', 'LIKELY', 'OCCASIONAL', 'UNLIKELY', 'RARE'];

    // X-axis labels (COF)
    const cofCategories = ['', 'A', 'B', 'C', 'D', 'E'];
    const cofLabels = ['COF', 'NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'];

    let cellCount = 0;

    // Build grid (6 rows x 6 cols = 36 cells)
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            const cell = document.createElement('div');

            // Y-axis labels (left column)
            if (col === 0 && row >= 0) {
                cell.className = 'axis-label' + (row < 5 ? ' axis-label-y' : '');
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
                if (row < 5) {
                    cell.innerHTML = `<div class="text-center"><div class="font-bold" style="font-size: 14px; margin-bottom: 2px;">${pofLevels[row + 1]}</div><div style="font-size: 9px; line-height: 1.2;">${pofLabels[row + 1]}</div></div>`;
                } else {
                    cell.innerHTML = `<div class="font-bold" style="font-size: 12px;">${pofLabels[0]}</div>`;
                }
                container.appendChild(cell);
                continue;
            }

            // X-axis labels (bottom row)
            if (row === 5 && col > 0) {
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

            // Risk cells
            if (col > 0 && row < 5) {
                const pofValue = 6 - row; // Invert for correct order (top = 5, bottom = 1)
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

    // Get max POF from all damage mechanisms
    const pofMetalLoss = parseInt(document.getElementById('pof_metal_loss')?.textContent) || 0;
    const pofCracking = parseInt(document.getElementById('pof_cracking')?.textContent) || 0;
    const pofExternal = parseInt(document.getElementById('pof_external')?.textContent) || 0;
    const pofMetallurgical = parseInt(document.getElementById('pof_metallurgical')?.textContent) || 0;
    const pofMechanical = parseInt(document.getElementById('pof_mechanical')?.textContent) || 0;
    const pofOther = parseInt(document.getElementById('pof_other')?.textContent) || 0;

    const maxPOF = Math.max(pofMetalLoss, pofCracking, pofExternal, pofMetallurgical, pofMechanical, pofOther);

    // Get COF category
    const cofCategory = calculateCOFCategory();

    console.log(`[Risk Matrix] Current values: POF=${maxPOF}, COF=${cofCategory}`);

    // Update summary cards
    updatePOFCard(maxPOF);
    updateCOFCard(cofCategory);

    // Highlight current cell in matrix
    highlightCurrentRisk(maxPOF, cofCategory);

    // Update risk level card
    updateRiskLevelCard(maxPOF, cofCategory);

    // Update details breakdown
    updateDetailsBreakdown(pofMetalLoss, pofCracking, pofExternal, pofMetallurgical, maxPOF, cofCategory);
}

function updatePOFCard(maxPOF) {
    const labels = {
        0: 'Not Calculated',
        1: 'Level 1 - Rare',
        2: 'Level 2 - Unlikely',
        3: 'Level 3 - Occasional',
        4: 'Level 4 - Likely',
        5: 'Level 5 - Frequent'
    };

    document.getElementById('risk_pof_value').textContent = maxPOF || '--';
    document.getElementById('risk_pof_label').textContent = labels[maxPOF] || 'Level --';
}

function updateCOFCard(cofCategory) {
    const labels = {
        'A': 'Category A - Negligible',
        'B': 'Category B - Minor',
        'C': 'Category C - Moderate',
        'D': 'Category D - Major',
        'E': 'Category E - Catastrophic'
    };

    document.getElementById('risk_cof_category').textContent = cofCategory || '--';
    document.getElementById('risk_cof_label').textContent = labels[cofCategory] || 'Category --';
}

function calculateCOFCategory() {
    // Try to get COF from consequence tab if calculated
    // Look for financial consequence total
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

function highlightCurrentRisk(pof, cofCategory) {
    // Remove previous highlight
    document.querySelectorAll('[data-pof]').forEach(cell => {
        if (cell.dataset.pof && cell.dataset.cof) {
            cell.classList.remove('current-position-active');
            cell.style.border = 'none';
            cell.style.transform = 'scale(1)';
            cell.style.zIndex = '1';
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

function updateDetailsBreakdown(pofMetalLoss, pofCracking, pofExternal, pofMetallurgical, maxPOF, cofCategory) {
    // Update POF details
    document.getElementById('detail_pof_metal_loss').textContent = pofMetalLoss || '0';
    document.getElementById('detail_pof_cracking').textContent = pofCracking || '0';
    document.getElementById('detail_pof_external').textContent = pofExternal || '0';
    document.getElementById('detail_pof_metallurgical').textContent = pofMetallurgical || '0';
    document.getElementById('detail_pof_final').textContent = maxPOF || '0';

    // Update COF details - get from consequence tab if available
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
}

console.log('[Risk Matrix] 📊 Module loaded successfully');
