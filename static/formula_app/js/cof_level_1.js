import { RepresentativeFluids } from '../data/cof/table4_1_1.js';
import { FluidProperties } from '../data/cof/table4_1_2.js';

document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const selectFluid = document.getElementById('select_fluid');
    const fluidDetails = document.getElementById('fluid_details');
    const displayType = document.getElementById('fluid_type_display');
    const displayExamples = document.getElementById('fluid_examples_display');

    // Step 4.1.2 Elements
    const propertiesCard = document.getElementById('properties_card');
    const propMw = document.getElementById('prop_mw');
    const propDensity = document.getElementById('prop_density');
    const propNbp = document.getElementById('prop_nbp');
    const propAit = document.getElementById('prop_ait');
    const propAmbient = document.getElementById('prop_ambient');
    const propCpEq = document.getElementById('prop_cp_eq');
    const propCpA = document.getElementById('prop_cp_a');
    const propCpB = document.getElementById('prop_cp_b');
    const propCpC = document.getElementById('prop_cp_c');
    const propCpD = document.getElementById('prop_cp_d');
    const propCpE = document.getElementById('prop_cp_e');


    // Populate Select Dropdown
    if (selectFluid) {
        RepresentativeFluids.forEach(fluid => {
            const option = document.createElement('option');
            option.value = fluid.label;
            option.textContent = fluid.label;
            selectFluid.appendChild(option);
        });

        // Event Listener for Change
        selectFluid.addEventListener('change', (e) => {
            const selectedLabel = e.target.value;
            const selectedFluid = RepresentativeFluids.find(f => f.label === selectedLabel);
            const props = FluidProperties[selectedLabel];

            if (selectedFluid) {
                // Update Step 4.1.1 Display
                displayType.textContent = selectedFluid.type;
                displayExamples.textContent = selectedFluid.examples;
                fluidDetails.classList.remove('hidden');
            }

            if (props) {
                // Update Step 4.1.2 Display
                propMw.textContent = props.mw;
                propDensity.textContent = props.liquid_density;
                propNbp.textContent = props.nbp;
                propAit.textContent = props.ait !== null ? props.ait : 'N/A';

                propAmbient.textContent = props.ambient_state;
                // Color badge based on state
                propAmbient.className = `badge badge-lg font-bold ${props.ambient_state === 'Gas' ? 'badge-warning' : 'badge-info'}`;

                // Map Cp Eq to Latex
                let cpEqLatex = '-';
                if (props.cp_eq === 1) {
                    cpEqLatex = '\\(C_p = A + BT + CT^2 + DT^3\\)';
                } else if (props.cp_eq === 2) {
                    cpEqLatex = '\\(C_p = A + B \\left(\\frac{C/T}{\\sinh(C/T)}\\right)^2 + D \\left(\\frac{E/T}{\\cosh(E/T)}\\right)^2\\)';
                } else if (props.cp_eq === 3) {
                    cpEqLatex = '\\(C_p = A + BT + CT^2 + DT^3 + ET^4\\)';
                }

                propCpEq.innerHTML = cpEqLatex;

                // Trigger MathJax Reprocess
                if (window.MathJax) {
                    window.MathJax.typesetPromise([propCpEq]);
                }

                propCpA.textContent = props.a !== null ? props.a.toExponential(2) : '-';
                propCpB.textContent = props.b !== null ? props.b.toExponential(2) : '-';
                propCpC.textContent = props.c !== null ? props.c.toExponential(2) : '-';
                propCpD.textContent = props.d !== null ? props.d.toExponential(2) : '-';
                propCpE.textContent = props.e !== null ? props.e.toExponential(2) : '-';

                propertiesCard.classList.remove('hidden');
            } else {
                console.warn(`No properties found for ${selectedLabel}`);
                propertiesCard.classList.add('hidden');
            }
        });
    }
});
