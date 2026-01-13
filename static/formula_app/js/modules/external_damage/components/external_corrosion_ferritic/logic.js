
import { interpolate } from '../../../../utils.js';

export function calculateAge(installDateStr) {
    if(!installDateStr) return -1;
    const installDate = new Date(installDateStr);
    const today = new Date(); 
    const diffTime = today - installDate;
    return diffTime / (31557600000); // 365.25 days in ms
}

export function calculateCrB(driver, temp, unit, baseRatesData) {
    // dataset: metric or imperial
    const dataset = (unit === "C") ? baseRatesData.metric : baseRatesData.imperial;
    const data = dataset.data; 
    data.sort((a, b) => a.temp - b.temp);

    let rate = 0;
    if (temp <= data[0].temp) {
        rate = data[0][driver]; 
    } else if (temp >= data[data.length - 1].temp) {
        rate = data[data.length - 1][driver];
    } else {
        // Find Interval
        for(let i=0; i < data.length - 1; i++) {
            if (temp >= data[i].temp && temp <= data[i+1].temp) {
                rate = interpolate(temp, data[i].temp, data[i][driver], data[i+1].temp, data[i+1][driver]);
                break;
            }
        }
    }
    return rate;
}

export function calculateFinalCr(crB, fIns, fCm, fIc, fEq, fIf) {
    const maxEqIf = Math.max(fEq, fIf);
    return crB * fIns * fCm * fIc * maxEqIf; // Eq 2.D.14
}

export function calculateStep5Trde(t, le, hasInspection) {
    if (hasInspection) {
        return t - le;
    } else {
        return t;
    }
}

export function calculateStep5AgeTke(totalAge, inspDateStr, hasInspection) {
    if (hasInspection && inspDateStr) {
        const inspDate = new Date(inspDateStr);
        const today = new Date();
        const diffTime = today - inspDate;
        const calc = diffTime / 31557600000;
        return calc < 0 ? 0 : calc;
    } else if (hasInspection && !inspDateStr) {
        return 0;
    } else {
        return totalAge; // No measured loss
    }
}

export function calculateCoatingAge(coatingDateStr) {
    if (!coatingDateStr) return 0;
    const d = new Date(coatingDateStr);
    const now = new Date();
    const dif = Math.abs(now - d);
    return dif / (1000 * 60 * 60 * 24 * 365.25);
}

export function calculateCoatAdj(ageTke, ageCoat, cage, coatingFailed) {
    if (ageTke >= ageCoat) {
        // Case 1: Inspection before/same time as coating
        return Math.min(cage, ageCoat);
    } else {
        // Case 2: Inspection after coating
        if (coatingFailed === "Yes") return 0;
        
        // Eq 2.D.18
        const term1 = Math.min(cage, ageCoat);
        const term2 = Math.min(cage, ageCoat - ageTke);
        return term1 - term2;
    }
}

export function calculateStep9Age(ageTke, coatAdj) {
    let age = ageTke - coatAdj;
    return age < 0 ? 0 : age;
}

export function calculateArt(cr, age, trde) {
    if(trde === 0) return 0;
    return (cr * age) / trde; 
}

export function calculateFsCuif(ys, ts, E) {
    // Eq 2.D.21
    return ((ys + ts) / 2) * E * 1.1;
}

export function calculateSrp(s, e, fs, tmin, trde) {
    if (fs === 0 || trde === 0) return 0;
    // Eq 2.D.22
    // SRp = (S * E / FS) * (tmin / trde)
    return (s * e / fs) * (tmin / trde);
}

// Bayesian Logic (Steps 14-16)
export function calculatePosteriorProbs(nA, nB, nC, nD, confidence, table45Data, table46Data) {
    const priors = table45Data[confidence];
    if(!priors) throw new Error("Invalid Confidence");

    const condA = table46Data["A"];
    const condB = table46Data["B"];
    const condC = table46Data["C"];
    const condD = table46Data["D"];

    // I1 (High / p1)
    const I1 = priors.p1 * 
               Math.pow(condA.p1, nA) * Math.pow(condB.p1, nB) * Math.pow(condC.p1, nC) * Math.pow(condD.p1, nD);

    // I2 (Medium / p2)
    const I2 = priors.p2 * 
               Math.pow(condA.p2, nA) * Math.pow(condB.p2, nB) * Math.pow(condC.p2, nC) * Math.pow(condD.p2, nD);

    // I3 (Low / p3)
    const I3 = priors.p3 * 
               Math.pow(condA.p3, nA) * Math.pow(condB.p3, nB) * Math.pow(condC.p3, nC) * Math.pow(condD.p3, nD);

    const sumI = I1 + I2 + I3;
    let po1 = 0, po2 = 0, po3 = 0;
    
    if (sumI > 0) {
        po1 = I1 / sumI;
        po2 = I2 / sumI;
        po3 = I3 / sumI;
    }

    return { I1, I2, I3, po1, po2, po3 };
}

export function calculateBeta(ds, art, srp) {
    const COV_dt = 0.20;
    const COV_Sf = 0.20;
    const COV_p = 0.05;

    const numerator = 1 - (ds * art) - srp;
    
    const term1 = Math.pow(ds, 2) * Math.pow(art, 2) * Math.pow(COV_dt, 2);
    const term2 = Math.pow((1 - (ds * art)), 2) * Math.pow(COV_Sf, 2);
    const term3 = Math.pow(srp, 2) * Math.pow(COV_p, 2);
    
    const denominator = Math.sqrt(term1 + term2 + term3);
    
    if (denominator === 0) return 0; 
    return numerator / denominator;
}

function stdNormCDF(x) {
    if (x === 0) return 0.5;
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) prob = 1 - prob;
    return prob;
}

export function calculateFinalDfStructural(po1, po2, po3, b1, b2, b3) {
    const term1 = po1 * stdNormCDF(-b1);
    const term2 = po2 * stdNormCDF(-b2);
    const term3 = po3 * stdNormCDF(-b3);
    
    const numerator = term1 + term2 + term3;
    const denominator = 1.56e-4; 
    
    return numerator / denominator;
}
