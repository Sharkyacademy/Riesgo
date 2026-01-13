/*
    This file is responsible for the persistence of the values
    the user enters in the inputs.
*/

document.addEventListener('DOMContentLoaded', async function () {
    console.log("INFO: initializing the loading of persistent data");

    // CHECK IF TABLE4.1_DATA HAS DATA
    if (sessionStorage.getItem('table4.1_data')) {
        // CHECK THAT THE INSTANTIATED FUNCTION IS OF TYPE 'FUNCTION
        // IF SO, IT LOADS.
        if (typeof loadTable41 === 'function') {
            await loadTable41();
        }
    }

    // Apply date restrictions globally on load
    restrictDateInputs();
})

// Global function to restrict all date inputs to today or earlier
function restrictDateInputs() {
    // Generate YYYY-MM-DD in local time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const dateInputs = document.querySelectorAll('input[type="date"]');

    dateInputs.forEach(input => {
        input.setAttribute('max', today);
        // Add event listener to prevent manual entry of future dates
        input.addEventListener('change', function () {
            if (this.value > today) {
                alert("Date cannot be in the future.");
                this.value = "";
            }
        });
    });
}

// Expose for use in dynamic steps
window.restrictDateInputs = restrictDateInputs;
