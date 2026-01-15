export const ResolutionFactors = {
    // Table 4.6 - Adjustments to Release Based on Detection and Isolation Systems
    // Format: Detection: { Isolation: Factor }
    // If combination is not found, default to 0.00
    'A': {
        'A': 0.25,
        'B': 0.20,
        'C': 0.10
    },
    'B': {
        'A': 0.15, // Not explicitly defined, defaulting to B/B or logic check? 
        // Actually B/A (Auto Iso without Auto Det) is unlikely. 
        // However, Table 4.7 groups "B / A or B". 
        // If B/A exists, Table 4.6 doesn't list it. Safe to return 0 or map to B/B? 
        // Let's sticking strictly to table: A/A, A/B, A/C, B/B, B/C(from A or B / C).
        'B': 0.15,
        'C': 0.10  // "A or B" with C
    },
    'C': {
        'A': 0.00,
        'B': 0.00,
        'C': 0.00
    }
};

export const LeakDurationRules = [
    // Table 4.7 - Leak Durations
    // Each rule has: det (array), iso (array), durations (object by size range)
    // Sizes: 
    //   Result 1: < 1/4 in (< 0.25)
    //   Result 2: 1/4 in to 1 in (0.25 < d <= 1)
    //   Result 3: 1 in to 4 in (1 < d <= 4)
    //   Result 4: > 4 in (d > 4) -> "4 in (102mm) diameter" usually means d4 Rupture case
    {
        det: ['A'],
        iso: ['A'],
        durations: {
            d1: 20, // min
            d2: 10,
            d3: 5,
            d4: 60 // Usually rupture is limited? Table says "60 minutes for d4 = D >= 4 in" -> wait, rupture is usually total volume? 
            // Note in Table 4.7: "NOTE There is no total leak duration provided in Table 4.7 for the rupture case... if greater than 4 in".
            // API 581 usually caps rupture release by inventory. 
            // We will return 60 but logic must handle "Inventory Limited" later.
        }
    },
    {
        det: ['A'],
        iso: ['B'],
        durations: {
            d1: 30,
            d2: 20,
            d3: 10,
            d4: 60
        }
    },
    {
        det: ['A'],
        iso: ['C'],
        durations: {
            d1: 40,
            d2: 30,
            d3: 20,
            d4: 60
        }
    },
    {
        det: ['B'],
        iso: ['A', 'B'], // "A or B"
        durations: {
            d1: 40,
            d2: 30,
            d3: 20,
            d4: 60
        }
    },
    {
        det: ['B'],
        iso: ['C'],
        durations: {
            d1: 60, // 1 hour
            d2: 30,
            d3: 20,
            d4: 60
        }
    },
    {
        det: ['C'],
        iso: ['A', 'B', 'C'], // "A, B, or C"
        durations: {
            d1: 60, // 1 hour
            d2: 40,
            d3: 20,
            d4: 60
        }
    }
];

// Table 4.5 Descriptions
export const DetectionDescriptions = {
    'A': "Instrumentation designed specifically to detect material losses by changes in operating conditions (i.e. loss of pressure or flow) in the system.",
    'B': "Suitably located detectors to determine when the material is present outside the pressure-containing envelope.",
    'C': "Visual detection, cameras, or detectors with marginal coverage."
};

export const IsolationDescriptions = {
    'A': "Isolation or shutdown systems activated directly from process instrumentation or detectors, with no operator intervention.",
    'B': "Isolation or shutdown systems activated by operators in the control room or other suitable locations remote from the leak.",
    'C': "Isolation dependent on manually operated valves."
};

export function getReductionFactor(det, iso) {
    if (!det || !iso) return 0.0;
    const detRow = ResolutionFactors[det];
    if (detRow) {
        if (detRow[iso] !== undefined) return detRow[iso];
    }
    return 0.00;
}

export function getLeakDuration(det, iso, diameter) {
    // diameter in inches
    if (!det || !iso || isNaN(diameter)) return 0;

    // Find rule
    const rule = LeakDurationRules.find(r => r.det.includes(det) && r.iso.includes(iso));
    if (!rule) return 60; // Default worst case?

    // Determine category based on diameter
    // Table 4.7 Ranges:
    // < 1/4
    // 1/4 to 1
    // 1 to 4
    // > 4

    // Exact mapping to our hole sizes d1, d2, d3, d4??
    // Actually our d1 is 0.25 (which is 1/4). Table says "< 1/4". 
    // Usually d1=Small is usually <= 0.25. 
    // API logic:
    // If d <= 0.25 -> Use d1 value.
    // If 0.25 < d <= 1 -> Use d2 value.
    // If 1 < d <= 4 -> Use d3 value.
    // If d > 4 -> Use d4 value.

    if (diameter <= 0.25) return rule.durations.d1;
    if (diameter <= 1.0) return rule.durations.d2;
    if (diameter <= 4.0) return rule.durations.d3;
    return rule.durations.d4;
}
