console.log(">>> FMS JS FILE PARSED <<<");
document.addEventListener('DOMContentLoaded', function () {
    console.log("FMS Calculation Script Loaded");

    // Path to the JSON data
    const JSON_PATH = '/static/formula_app/data/json/fms_questionnaire.json';

    // Container where the questionnaire will be rendered
    const container = document.getElementById('fms-questionnaire-container');
    console.log("Container found:", container);

    if (!container) {
        console.error("FMS Container NOT found!");
        return;
    }

    // Fetch and render data
    console.log("Fetching JSON from:", JSON_PATH);
    fetch(JSON_PATH)
        .then(response => {
            console.log("Response received:", response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text().then(text => { // Read as text first to debug
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error("JSON Parse Error. Content snippet:", text.substring(0, 100));
                    throw e;
                }
            });
        })
        .then(data => {
            console.log("Data parsed successfully. Object keys:", Object.keys(data));
            renderQuestionnaire(data);
        })
        .catch(error => {
            console.error('Error loading FMS questionnaire:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Error loading questionnaire data: ${error.message}</span>
                </div>`;
        });

    function renderQuestionnaire(data) {
        container.innerHTML = ''; // Clear loading placeholder

        data.sections.forEach((section, index) => {
            // Create Section Wrapper
            const sectionCard = document.createElement('div');
            sectionCard.className = 'card bg-white shadow-lg border border-gray-200 mb-8';

            // Header
            const header = document.createElement('div');
            header.className = 'card-body p-6 border-b border-gray-100 bg-gray-50';
            header.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 class="card-title text-blue-900 text-xl font-bold">
                           ${section.id} - ${section.title}
                        </h2>
                        <span class="badge badge-primary badge-outline mt-2">Section Weight: ${section.weight}%</span>
                    </div>
                    <div class="text-left md:text-right w-full md:w-auto bg-blue-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                         <span class="text-sm text-gray-500 uppercase tracking-wide font-semibold">Total Score</span>
                         <div class="text-2xl font-bold text-blue-600" id="section-score-${index}">0 / 100</div>
                    </div>
                </div>
            `;
            sectionCard.appendChild(header);

            // Container for List items (Replacing Table)
            const listContainer = document.createElement('div');
            listContainer.className = 'divide-y divide-gray-100';

            // HEADER ROW (DESKTOP ONLY - REFACTORED FOR BETTER SPACE)
            const gridHeader = document.createElement('div');
            gridHeader.className = 'hidden lg:grid grid-cols-12 gap-4 p-4 bg-blue-50 font-bold text-blue-900 text-sm uppercase tracking-wide';
            gridHeader.innerHTML = `
                <div class="col-span-1 text-center">Item</div>
                <div class="col-span-8">Description (Question & Guidance)</div>
                <div class="col-span-3 grid grid-cols-2 gap-4 text-center">
                     <div>Max</div>
                     <div>Score</div>
                </div>
            `;
            listContainer.appendChild(gridHeader);

            // Rows
            section.questions.forEach(q => {
                const row = document.createElement('div');
                row.className = 'p-4 lg:p-4 hover:bg-gray-50 transition-colors';

                // Guidance Text handling
                const guidanceText = q.guidance ? q.guidance : 'No specific guidance';
                const hasGuidance = q.guidance && q.guidance.length > 0;

                row.innerHTML = `
                    <div class="flex flex-col lg:grid lg:grid-cols-12 lg:gap-4 items-start">
                        
                        <!-- ITEM ID -->
                        <div class="mb-2 lg:mb-0 lg:col-span-1 lg:text-center pt-1">
                            <span class="badge badge-ghost font-bold text-gray-500">${q.id}</span>
                        </div>

                        <!-- CONTENT WRAPPER: QUESTION + GUIDANCE STACKED -->
                        <div class="w-full lg:col-span-8 mb-4 lg:mb-0">
                             
                             <!-- QUESTION -->
                             <p class="text-gray-900 font-semibold text-lg leading-tight mb-2">${q.question}</p>

                             <!-- GUIDANCE (Stacked Below) -->
                             <div class="text-sm text-gray-600 bg-blue-50/50 p-3 rounded border border-blue-100 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-400 shrink-0 mt-0.5">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                <span>${guidanceText}</span>
                             </div>

                        </div>

                        <!-- SCORES (Flex row for mobile alignment, Grid col for desktop) -->
                        <div class="w-full lg:col-span-3 grid grid-cols-2 gap-4 lg:items-start lg:pt-1">
                            
                            <!-- POSSIBLE SCORE -->
                            <div class="text-center border-r border-gray-200 lg:border-none flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:gap-1 px-4 lg:px-0 bg-gray-50 lg:bg-transparent p-2 rounded lg:rounded-none">
                                <span class="lg:hidden text-xs text-gray-400 uppercase font-bold">Max Score</span>
                                <span class="font-bold text-gray-500 text-xl">${q.possible_score}</span>
                            </div>

                            <!-- ACTUAL SCORE INPUT -->
                            <div class="text-center flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:gap-1 px-4 lg:px-0 bg-gray-50 lg:bg-transparent p-2 rounded lg:rounded-none">
                                <span class="lg:hidden text-xs text-gray-400 uppercase font-bold">Your Score</span>
                                <input type="number" 
                                       min="0" 
                                       max="${q.possible_score}" 
                                       class="input input-bordered input-sm w-20 lg:w-full max-w-[5rem] text-center text-blue-800 font-bold fms-input"
                                       data-section-index="${index}"
                                       data-max-score="${q.possible_score}"
                                       placeholder="0">
                            </div>
                        </div>

                    </div>
                `;
                listContainer.appendChild(row);
            });

            sectionCard.appendChild(listContainer);
            container.appendChild(sectionCard);
        });

        // Show Result Card
        document.getElementById('fms-result-card').classList.remove('hidden');
        document.getElementById('fms-result-card').classList.remove('translate-y-4');

        // Store section weights for calculation
        const sectionWeights = data.sections.map(s => s.weight);

        function calculateFMS() {
            let totalPscore = 0;

            // Iterate through each section
            sectionWeights.forEach((weight, index) => {
                // 1. Sum inputs for this section
                const inputs = document.querySelectorAll(`.fms-input[data-section-index="${index}"]`);
                let sectionRawScore = 0;

                inputs.forEach(input => {
                    const val = parseFloat(input.value);
                    if (!isNaN(val)) {
                        sectionRawScore += val;
                    }
                });

                // Cap at 100 just in case logic fails elsewhere, though inputs are capped
                if (sectionRawScore > 100) sectionRawScore = 100;

                // 2. Update Header UI
                const scoreDisplay = document.getElementById(`section-score-${index}`);
                if (scoreDisplay) scoreDisplay.textContent = `${sectionRawScore} / 100`;

                // 3. Calculate Weighted Contribution
                // Contribution = RawScore * (Weight / 100)
                // Example: Score 50, Weight 17 -> 50 * 0.17 = 8.5
                const weightedContribution = sectionRawScore * (weight / 100);
                totalPscore += weightedContribution;
            });

            // 4. Calculate FMS
            // Formula: Fms = 2.38 * e^(-0.012 * pscore)
            const fms = 2.38 * Math.exp(-0.012 * totalPscore);

            // 5. Update Result UI
            document.getElementById('total-pscore-display').textContent = totalPscore.toFixed(1);
            document.getElementById('pscore-progress').value = totalPscore;
            document.getElementById('fms-factor-display').textContent = fms.toFixed(3);

            // 6. Save to SessionStorage for Dashboard
            sessionStorage.setItem('fms_result', fms);
        }

        // State Persistence Logic
        function saveInputs() {
            const state = {};
            document.querySelectorAll('.fms-input').forEach(input => {
                const sectionIdx = input.getAttribute('data-section-index');
                // Finding the question index within the section logic requires a more robust ID strategy or DOM traversal.
                // Simpler approach: Use a unique data attribute generated during render?
                // Actually, let's just use the `input` index in the global list or structural traversal.
                // Better: during render, add a unique ID to input based on section and question index.
            });
            // Refactored approach below
        }

        // REDEFINING RENDER LOOP TO ADD UNIQUE IDs FOR PERSISTENCE
        // We need to modify the render loop to add `data-q-uid` to inputs for simpler mapping.
        // Since I cannot easily jump back to the render loop in this replacement chunk, 
        // I will implement a save/restore based on "Section Index + Question Index" order.

        function saveInputs() {
            const state = {};
            document.querySelectorAll('.fms-input').forEach(input => {
                const uid = input.id; // We'll rely on the fact we need to ADD IDs during render or use a logical map
                if (uid) {
                    state[uid] = input.value;
                }
            });
            sessionStorage.setItem('fms_inputs_state', JSON.stringify(state));
        }

        function restoreInputs() {
            const raw = sessionStorage.getItem('fms_inputs_state');
            if (!raw) return;

            try {
                const state = JSON.parse(raw);
                Object.keys(state).forEach(uid => {
                    const input = document.getElementById(uid);
                    if (input) {
                        input.value = state[uid];
                    }
                });
            } catch (e) { console.error("FMS Restore Error", e); }
        }

        // Strict Input Validation & Calculation Trigger
        document.querySelectorAll('.fms-input').forEach((input, qGlobalIndex) => {

            // ASSIGN UNIQUE ID FOR PERSISTENCE
            // Format: fms-input-{sectionIndex}-{qIndex}
            // Since we don't have qIndex in this scope easily without DOM traversal, let's use the unique ID from JSON if available?
            // The JSON has `q.id` (e.g. "9a"). Let's assume unique across sections? Usually yes.
            // But wait, I can just use a global index or the DOM position.
            // Let's generate a robust ID based on its data attributes.
            const sIdx = input.getAttribute('data-section-index');
            // Find its index among inputs of the same section
            const sectionInputs = document.querySelectorAll(`.fms-input[data-section-index="${sIdx}"]`);
            let qIdx = -1;
            sectionInputs.forEach((el, idx) => { if (el === input) qIdx = idx; });

            const uniqueID = `fms-in-${sIdx}-${qIdx}`;
            input.id = uniqueID;

            // 1. Prevent invalid keystrokes (e, E, +, -, .)
            input.addEventListener('keydown', function (e) {
                if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                    e.preventDefault();
                }
            });

            // 2. Prevent pasting non-digits
            input.addEventListener('paste', function (e) {
                const pastedData = (e.clipboardData || window.clipboardData).getData('text');
                if (!/^\d+$/.test(pastedData)) {
                    e.preventDefault();
                }
            });

            // 3. Clean input on change & Calculate
            input.addEventListener('input', function () {
                // Remove any non-digit chars
                this.value = this.value.replace(/[^0-9]/g, '');

                let max = parseInt(this.getAttribute('data-max-score'));
                let val = parseInt(this.value);

                if (isNaN(val)) {
                    // Allow empty, treat as 0 in calc
                } else if (val < 0) {
                    this.value = 0;
                } else if (val > max) {
                    this.value = max;
                }

                saveInputs(); // Save State
                calculateFMS(); // Recalculate
            });
        });

        // RESTORE AND CALC
        restoreInputs();
        calculateFMS();
    }
});
