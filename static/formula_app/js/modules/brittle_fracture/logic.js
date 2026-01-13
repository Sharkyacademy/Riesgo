
// Logic functions for Brittle Fracture Module

export function interpolate(x, x1, y1, x2, y2) {
    if (Math.abs(x2 - x1) < 1e-6) return y1; // Avoid div by zero
    return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
}

export function calculateDeltaFattMethod2(sce, serviceLifeYears) {
    if (serviceLifeYears <= 0) throw new Error("Service Life invalid (check Installation Date).");
    const ageHours = serviceLifeYears * 8760; // Approximate hours
    // Eq 2.E.4: 0.67 * (log10(age) - 0.91) * SCE
    return 0.67 * (Math.log10(ageHours) - 0.91) * sce; 
}

export function calculateDeltaFattMethod3_JFactor(si, mn, p, sn) {
    // Formula: J = (Si + Mn) * (P + Sn) * 10^4
    const j = (si + mn) * (p + sn) * 10000;
    // Eq 2.E.5 Correlation
    return -77.321 + (0.57570 * j) - (0.00055147 * j * j);
}

export function calculateDeltaFattMethod3_XBar(p, sb, sn, as) {
    // Formula: X-bar = (10P + 5Sb + 4Sn + As) * 100
    const x = (10 * p + 5 * sb + 4 * sn + as) * 100;
    // Eq 2.E.6 Correlation
    return -87.335 + (11.437 * x) - (0.1472 * x * x);
}

export function calculateDeltaFattMethod4(year) {
    if (year > 1988) return 150;
    else if (year >= 1981) return 250;
    else if (year >= 1973) return 300;
    else return 350; // Pre-1972
}

export function calculateMpt(tRef, deltaFatt) {
    return tRef + deltaFatt;
}

export function calculateBaseDf(deltaT, thickness, tableData) {
    // Get Thickness Columns
    const tCols = tableData.thicknesses; // [0.25, 0.5, ...]
    
    // Get Rows (DeltaT)
    const rows = tableData.rows; // [{delta_t: 100, values: [...]}, ...]

    // 1. Find bounding Thickness indices
    let tIdx1 = 0;
    let tIdx2 = 0;

    if (thickness <= tCols[0]) {
        tIdx1 = 0; tIdx2 = 0;
    } else if (thickness >= tCols[tCols.length - 1]) {
        tIdx1 = tCols.length - 1; tIdx2 = tCols.length - 1;
    } else {
        for(let i=0; i < tCols.length - 1; i++) {
            if (thickness >= tCols[i] && thickness <= tCols[i+1]) {
                tIdx1 = i;
                tIdx2 = i+1;
                break;
            }
        }
    }

    // 2. Find bounding Row indices (DeltaT)
    // rows are sorted DESCENDING (100 down to -100)
    let rIdx1 = 0; // Higher temp (usually index 0)
    let rIdx2 = 0;

    if (deltaT >= rows[0].delta_t) {
        rIdx1 = 0; rIdx2 = 0;
    } else if (deltaT <= rows[rows.length - 1].delta_t) {
        rIdx1 = rows.length - 1; rIdx2 = rows.length - 1;
    } else {
        for(let i=0; i < rows.length - 1; i++) {
            // Because descending: if val is between row[i] (higher) and row[i+1] (lower)
            if (deltaT <= rows[i].delta_t && deltaT >= rows[i+1].delta_t) {
                rIdx1 = i;
                rIdx2 = i+1;
                break;
            }
        }
    }

    // 3. Calculation Function
    const getDfAtRow = (rIdx, thick, tI1, tI2, tCols) => {
        const rowVals = rows[rIdx].values;
        const val1 = rowVals[tI1];
        const val2 = rowVals[tI2];
        
        if (tI1 === tI2) return val1;
        return interpolate(thick, tCols[tI1], val1, tCols[tI2], val2);
    };

    const dfRow1 = getDfAtRow(rIdx1, thickness, tIdx1, tIdx2, tCols);
    const dfRow2 = getDfAtRow(rIdx2, thickness, tIdx1, tIdx2, tCols);

    // Now interpolate between Row 1 and Row 2 for the target Temp
    const t1 = rows[rIdx1].delta_t;
    const t2 = rows[rIdx2].delta_t;
    
    let finalDf = 0;
    if (rIdx1 === rIdx2) {
        finalDf = dfRow1;
    } else {
        finalDf = interpolate(deltaT, t1, dfRow1, t2, dfRow2);
    }
    
    return finalDf;
}

export function calculateBrit885Df(diff, brit885TableData) {
    let df = 0;
    
    // Handle out of bounds
    if (diff > 100) {
        df = 0;
    } else if (diff < -100) {
        df = 1381;
    } else {
        // Interpolate
        for (let i = 0; i < brit885TableData.length - 1; i++) {
            const p1 = brit885TableData[i];
            const p2 = brit885TableData[i + 1];
            
            if (diff <= p1.temp_diff_f && diff >= p2.temp_diff_f) {
                // Linear interpolation formula: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
                const x = diff;
                const x1 = p1.temp_diff_f;
                const y1 = p1.df;
                const x2 = p2.temp_diff_f;
                const y2 = p2.df;
                
                df = y1 + (x - x1) * (y2 - y1) / (x2 - x1);
                break;
            }
        }
    }
    return Math.round(df);
}

export function calculateSigmaDf(tMin, sigmaAmount, sigmaTableData) {
    // Map sigmaAmount to JSON key
    let key = 'df_low';
    if (sigmaAmount === 'Medium') key = 'df_medium';
    if (sigmaAmount === 'High') key = 'df_high';

    let df = 0;
    
    // Handle out of bounds (Table range: -50 to 1200 F)
    if (tMin > 1200) {
        // Use 1200 value
        df = sigmaTableData[0][key]; 
    } else if (tMin < -50) {
        // Use -50 value
        df = sigmaTableData[sigmaTableData.length - 1][key];
    } else {
        // Interpolate
        for (let i = 0; i < sigmaTableData.length - 1; i++) {
            const p1 = sigmaTableData[i];
            const p2 = sigmaTableData[i + 1];
            
            if (tMin <= p1.temp_f && tMin >= p2.temp_f) {
                // Linear interpolation
                const x = tMin;
                const x1 = p1.temp_f;
                const y1 = p1[key];
                const x2 = p2.temp_f;
                const y2 = p2[key];
                
                df = y1 + (x - x1) * (y2 - y1) / (x2 - x1);
                break;
            }
        }
    }
    return parseFloat(df.toFixed(2));
}

export function calculateGoverningDf(dfBrit, dfTempe, df885, dfSigma) {
    // Equation 2.7: max[(Df_brit + Df_tempe), Df_885, Df_sigma]
    const term1 = (dfBrit || 0) + (dfTempe || 0);
    return Math.max(term1, df885 || 0, dfSigma || 0);
}
