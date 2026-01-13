document.addEventListener('DOMContentLoaded', () => {
    const selMaterial = document.getElementById('sel_ext_unified_material');
    const selInsulation = document.getElementById('sel_ext_unified_insulation');
    const inpTemp = document.getElementById('inp_ext_unified_temp');
    const selUnit = document.getElementById('sel_ext_unified_temp_unit');
    const statusBadge = document.getElementById('ext_unified_status');

    const secExtCorrFerr = document.getElementById('sec_ext_corr_ferritic');
    const secCuiFerr = document.getElementById('sec_cui_ferritic_target');
    const secExtClSccAus = document.getElementById('sec_ext_clscc_austenitic');
    const secCuiClSccAus = document.getElementById('sec_cui_clscc_austenitic');

    const allSections = [secExtCorrFerr, secCuiFerr, secExtClSccAus, secCuiClSccAus];

    console.log('Interaction Script Loaded. Sections found:', {
        secExtCorrFerr: !!secExtCorrFerr,
        secCuiFerr: !!secCuiFerr,
        secExtClSccAus: !!secExtClSccAus,
        secCuiClSccAus: !!secCuiClSccAus
    });

    const btnCheck = document.getElementById('btn_check_ext_applicability');

    // Button Listener
    if (btnCheck) {
        btnCheck.addEventListener('click', checkUnifiedScreening);
    }

    // Optional: Clear or reset sections if inputs change? 
    // For now, based on user request, we just wait for the button click to re-evaluate.
    // But we might want to hide existing results if inputs change to avoid confusion.
    [selMaterial, selInsulation, inpTemp, selUnit].forEach(inp => {
        if(inp) {
            inp.addEventListener('change', () => {
                if(statusBadge) {
                    statusBadge.className = "badge badge-lg p-4 badge-ghost";
                    statusBadge.innerText = "Inputs changed - Click 'Determine' to update";
                }
            });
        }
    });

    function checkUnifiedScreening() {
        if (!selMaterial || !selInsulation || !inpTemp || !selUnit) return;

        const mat = selMaterial.value; 
        const ins = selInsulation.value;
        const tempVal = parseFloat(inpTemp.value);
        const unit = selUnit.value; 

        console.log('Unified Screening Check:', { mat, ins, tempVal, unit });

        // Hide ALL sections
        allSections.forEach(sec => {
            if(sec) sec.classList.add('hidden');
        });

        // Reset Badge
        if(statusBadge) {
            statusBadge.className = "badge badge-lg p-4 badge-ghost";
            statusBadge.innerText = "Pending Inputs...";
        }

        if (!mat || !ins || isNaN(tempVal)) return;

        // Convert to F
        let tempF = tempVal;
        if (unit === 'C') tempF = (tempVal * 9/5) + 32;
        
        console.log('Calculated Temp F:', tempF);

        let activeMech = null;

        // Logic Tree
        if (mat === 'Ferritic') {
            if (ins === 'No') {
                if (tempF >= 10 && tempF <= 250) {
                    activeMech = { name: "External Corrosion (Ferritic)", sec: secExtCorrFerr };
                }
            } else if (ins === 'Yes') {
                if (tempF >= 10 && tempF <= 350) {
                    activeMech = { name: "CUI (Ferritic)", sec: secCuiFerr };
                }
            }
        } else if (mat === 'Austenitic') {
            if (tempF >= 120 && tempF <= 300) {
                if (ins === 'No') {
                    activeMech = { name: "External ClSCC (Austenitic)", sec: secExtClSccAus };
                } else if (ins === 'Yes') {
                    activeMech = { name: "CUI ClSCC (Austenitic)", sec: secCuiClSccAus };
                }
            }
        }

        // Show Active
        if (activeMech) {
            console.log('Active Mechanism Found:', activeMech.name);
            // alert('Active Mechanism: ' + activeMech.name); // Uncomment for nuclear debug

            if(statusBadge) {
                statusBadge.className = "badge badge-lg p-4 badge-success text-white font-bold";
                statusBadge.innerText = activeMech.name;
            }
            if(activeMech.sec) {
                console.log(`Revealing section: ${activeMech.name} (ID: ${activeMech.sec.id})`);
                activeMech.sec.classList.remove('hidden');
                activeMech.sec.style.display = 'block'; // Force display just in case
            }
        } else {
            console.log('No Active Mechanism for conditions');
            if(statusBadge) {
                statusBadge.className = "badge badge-lg p-4 badge-warning font-bold";
                statusBadge.innerText = "No Mechanism Applicable";
            }
        }
    }
});
