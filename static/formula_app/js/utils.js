/**
 * Centralized Utility Functions for Formula App
 */

/**
 * Validates a list of input elements.
 * Checks if value is present and not empty.
 * Optional: Adds/removes 'input-error' class for visual feedback.
 * 
 * @param {Array<HTMLElement>} inputs - Array of input/select elements to validate.
 * @returns {boolean} - True if all inputs are valid, false otherwise.
 */
export function validateInputs(inputs) {
    let allValid = true;
    inputs.forEach(inp => {
        if (!inp) return; 
        
        const val = inp.value;
        if (!val || val.trim() === '') {
            allValid = false;
            // Optional: Visual feedback
            inp.classList.add('input-error');
        } else {
            inp.classList.remove('input-error');
        }
    });
    return allValid;
}

/**
 * Linear Interpolation
 * @param {number} x - The x value to interpolate for.
 * @param {number} x1 - The x value of the first point.
 * @param {number} y1 - The y value of the first point.
 * @param {number} x2 - The x value of the second point.
 * @param {number} y2 - The y value of the second point.
 * @returns {number} - The interpolated y value.
 */
export function interpolate(x, x1, y1, x2, y2) {
    if (x2 === x1) return y1;
    return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
}
