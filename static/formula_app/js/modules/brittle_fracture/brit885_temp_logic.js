    // -------------------------------------------------------------------------
    // 885°F Embrittlement Logic
    // -------------------------------------------------------------------------

    const btnBrit885Confirm = document.getElementById('btn_brit885_confirm');
    if (btnBrit885Confirm) {
        btnBrit885Confirm.addEventListener('click', handleBrit885Step1);
    }

    function handleBrit885Step1() {
        const adminControlsSelect = document.getElementById('brit885_admin_controls');
        const minOpTempInput = document.getElementById('brit885_min_op_temp');
        const resultContainer = document.getElementById('brit885_step1_result');
        const step2Container = document.getElementById('brit885_step2_container');
        const step3Container = document.getElementById('brit885_step3_container');
        const msgDiv = document.getElementById('brit885_step1_msg');

        if (!adminControlsSelect || !minOpTempInput || !resultContainer) {
            console.error("885 Step 1 elements missing");
            return;
        }

        const adminControls = adminControlsSelect.value;
        const minOpTemp = parseFloat(minOpTempInput.value);

        if (!adminControls) {
            alert("Please select if Administrative Controls are present.");
            return;
        }

        // Reset displays
        resultContainer.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');

        resultContainer.classList.remove('hidden');

        let Brit885Data = JSON.parse(sessionStorage.getItem('brit885_data') || '{}');
        Brit885Data.adminControls = adminControls;

        if (adminControls === 'Yes') {
            // Protocol A: Use Min Operating Temp as Tmin
            if (isNaN(minOpTemp)) {
                 alert("Please enter a valid Minimum Operating Temperature.");
                 resultContainer.classList.add('hidden');
                 return;
            }

            msgDiv.innerHTML = `
                Administrative controls <strong>prevent</strong> pressurization below a critical temperature.<br>
                <span class="text-green-600 font-bold">Protocol A:</span> Use Minimum Operating Temperature as T<sub>min</sub>.
            `;
            
            Brit885Data.tMin = minOpTemp;
            Brit885Data.protocol = 'A';
            
            // Proceed to Step 3
            step3Container.classList.remove('hidden');

        } else {
            // Protocol B: Determine Tmin (Step 2)
             msgDiv.innerHTML = `
                Administrative controls do <strong>NOT</strong> prevent pressurization.<br>
                <span class="text-orange-600 font-bold">Protocol B:</span> Proceed to Step 2 to determine T<sub>min</sub>.
            `;
            
            Brit885Data.protocol = 'B';
            
            // Proceed to Step 2
            step2Container.classList.remove('hidden');
        }
        
        sessionStorage.setItem('brit885_data', JSON.stringify(Brit885Data));
    }
