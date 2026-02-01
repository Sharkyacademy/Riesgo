// FMS (Failure Management Systems Factor) Calculation Logic
// Loads questionnaire from JSON and calculates FMS factor

document.addEventListener('DOMContentLoaded', function () {
    console.log('[FMS] Module loaded');

    const JSON_PATH = '/static/formula_app/data/json/fms_questionnaire.json';
    const container = document.getElementById('fms-questionnaire-container');
    const resultCard = document.getElementById('fms-result-card');
    const dispPscore = document.getElementById('disp_fms_pscore');
    const dispFmsFactor = document.getElementById('disp_fms_factor');
    const pscoreProgress = document.getElementById('fms-pscore-progress');
    const inputFmsFactor = document.getElementById('id_fms_factor');
    const inputFmsPscore = document.getElementById('id_fms_pscore');

    if (!container) {
        console.error('[FMS] Container not found');
        return;
    }

    // Fetch and render questionnaire
    fetch(JSON_PATH)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('[FMS] Data loaded:', data.sections.length, 'sections');
            renderQuestionnaire(data);
        })
        .catch(error => {
            console.error('[FMS] Load error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Error loading FMS questionnaire: ${error.message}</span>
                </div>`;
        });

    function renderQuestionnaire(data) {
        container.innerHTML = '';

        data.sections.forEach((section, sIdx) => {
            const sectionCard = document.createElement('div');
            sectionCard.className = 'card bg-white shadow-lg border border-gray-200 mb-6';

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
                         <div class="text-2xl font-bold text-blue-600" id="section-score-${sIdx}">0 / 100</div>
                    </div>
                </div>
            `;
            sectionCard.appendChild(header);

            const listContainer = document.createElement('div');
            listContainer.className = 'divide-y divide-gray-100';

            // Header row (desktop)
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

            // Questions
            section.questions.forEach((q, qIdx) => {
                const row = document.createElement('div');
                row.className = 'p-4 lg:p-4 hover:bg-gray-50 transition-colors';

                const guidanceText = q.guidance || 'No specific guidance';

                row.innerHTML = `
                    <div class="flex flex-col lg:grid lg:grid-cols-12 lg:gap-4 items-start">
                        <div class="mb-2 lg:mb-0 lg:col-span-1 lg:text-center pt-1">
                            <span class="badge badge-ghost font-bold text-gray-500">${q.id}</span>
                        </div>
                        <div class="w-full lg:col-span-8 mb-4 lg:mb-0">
                             <p class="text-gray-900 font-semibold text-lg leading-tight mb-2">${q.question}</p>
                             <div class="text-sm text-gray-600 bg-blue-50/50 p-3 rounded border border-blue-100 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-400 shrink-0 mt-0.5">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                <span>${guidanceText}</span>
                             </div>
                        </div>
                        <div class="w-full lg:col-span-3 grid grid-cols-2 gap-4 lg:items-start lg:pt-1">
                            <div class="text-center border-r border-gray-200 lg:border-none flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:gap-1 px-4 lg:px-0 bg-gray-50 lg:bg-transparent p-2 rounded lg:rounded-none">
                                <span class="lg:hidden text-xs text-gray-400 uppercase font-bold">Max Score</span>
                                <span class="font-bold text-gray-500 text-xl">${q.possible_score}</span>
                            </div>
                            <div class="text-center flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:gap-1 px-4 lg:px-0 bg-gray-50 lg:bg-transparent p-2 rounded lg:rounded-none">
                                <span class="lg:hidden text-xs text-gray-400 uppercase font-bold">Your Score</span>
                                <input type="number" 
                                       min="0" 
                                       max="${q.possible_score}" 
                                       class="input input-bordered input-sm w-20 lg:w-full max-w-[5rem] text-center text-blue-800 font-bold fms-input"
                                       data-section-index="${sIdx}"
                                       data-max-score="${q.possible_score}"
                                       id="fms-in-${sIdx}-${qIdx}"
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

        // Show result card
        if (resultCard) {
            resultCard.classList.remove('hidden');
        }

        // Store section weights
        const sectionWeights = data.sections.map(s => s.weight);

        // Calculate FMS
        function calculateFMS() {
            let totalPscore = 0;

            sectionWeights.forEach((weight, sIdx) => {
                const inputs = document.querySelectorAll(`.fms-input[data-section-index="${sIdx}"]`);
                let sectionRawScore = 0;

                inputs.forEach(input => {
                    const val = parseFloat(input.value);
                    if (!isNaN(val)) sectionRawScore += val;
                });

                if (sectionRawScore > 100) sectionRawScore = 100;

                const scoreDisplay = document.getElementById(`section-score-${sIdx}`);
                if (scoreDisplay) scoreDisplay.textContent = `${sectionRawScore} / 100`;

                const weightedContribution = sectionRawScore * (weight / 100);
                totalPscore += weightedContribution;
            });

            // FMS Formula: FMS = 2.38 * e^(-0.012 * pscore)
            const fms = 2.38 * Math.exp(-0.012 * totalPscore);

            // Update UI
            if (dispPscore) dispPscore.textContent = totalPscore.toFixed(1);
            if (pscoreProgress) pscoreProgress.value = totalPscore;
            if (dispFmsFactor) dispFmsFactor.textContent = fms.toFixed(3);

            // Update form fields
            if (inputFmsFactor) inputFmsFactor.value = fms.toFixed(3);
            if (inputFmsPscore) inputFmsPscore.value = totalPscore.toFixed(2);

            // Save to sessionStorage
            sessionStorage.setItem('fms_result', fms);
            sessionStorage.setItem('fms_pscore', totalPscore);

            console.log('[FMS] Calculated - P-score:', totalPscore, 'FMS:', fms);
        }

        // Save/Restore inputs
        function saveInputs() {
            const state = {};
            document.querySelectorAll('.fms-input').forEach(input => {
                if (input.id) state[input.id] = input.value;
            });
            sessionStorage.setItem('fms_inputs_state', JSON.stringify(state));
        }

        function restoreInputs() {
            const raw = sessionStorage.getItem('fms_inputs_state');
            if (!raw) return;
            try {
                const state = JSON.parse(raw);
                Object.keys(state).forEach(id => {
                    const input = document.getElementById(id);
                    if (input) input.value = state[id];
                });
            } catch (e) {
                console.error('[FMS] Restore error', e);
            }
        }

        // Input validation & listeners
        document.querySelectorAll('.fms-input').forEach(input => {
            // Prevent invalid keystrokes
            input.addEventListener('keydown', function (e) {
                if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                    e.preventDefault();
                }
            });

            // Prevent pasting non-digits
            input.addEventListener('paste', function (e) {
                const pastedData = (e.clipboardData || window.clipboardData).getData('text');
                if (!/^\d+$/.test(pastedData)) {
                    e.preventDefault();
                }
            });

            // Clean input & calculate
            input.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, '');
                const max = parseInt(this.getAttribute('data-max-score'));
                let val = parseInt(this.value);

                if (!isNaN(val)) {
                    if (val < 0) this.value = 0;
                    else if (val > max) this.value = max;
                }

                saveInputs();
                calculateFMS();
            });
        });

        // Restore and initial calc
        restoreInputs();
        calculateFMS();
    }
});
