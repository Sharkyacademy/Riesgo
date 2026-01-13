
document.addEventListener("DOMContentLoaded", function () {
    const equipmentSelect = document.getElementById("equipment");
    const componentSelect = document.getElementById("component");


    const has_cladding = document.getElementById("has_cladding");
    const cladding_row = document.getElementById("cladding_row");
    const cladding_input = document.getElementById("cladding_input");

    const has_internal_liner = document.getElementById("has_internal_liner");
    const internal_liner_row = document.getElementById("internal_liner_row");
    const internal_liner_input = document.getElementById("internal_liner_input");


    has_cladding.addEventListener("change", function () {

        const isYes = this.value === "yes";

        if (!cladding_row) {
            console.error("Error");
            return;
        }

        if (isYes) {
            cladding_row.classList.remove("hidden");
            if (cladding_input) {
                cladding_input.setAttribute("required", "required");
            }
        } else {
            cladding_row.classList.add("hidden");
            if (cladding_input) {
                cladding_input.removeAttribute("required");
                cladding_input.value = 0;
            }
        }

    });

    has_internal_liner.addEventListener("change", function () {

        const isYes = this.value === "yes";
        if (!internal_liner_row) {
            console.error("Error");
            return;
        }

        if (isYes) {
            internal_liner_row.classList.remove("hidden");
            if (internal_liner_input) {
                internal_liner_input.setAttribute("required", "required");
            }
        } else {
            internal_liner_row.classList.add("hidden");
            if (internal_liner_input) {
                internal_liner_input.removeAttribute("required");
                internal_liner_input.value = 0;
            }
        }

    });

    let currentFetchId = 0; // Guard for race conditions

    async function loadComponents(equipmentId) {
        // 1. Clear immediately to show feedback
        componentSelect.innerHTML = '<option value="" disabled selected>Select component</option>';
        if (!equipmentId) return;

        // 2. Increment fetch ID
        currentFetchId++;
        const thisFetchId = currentFetchId;

        // Use Django URL if available, else fallback
        const urlBase = (window.djangoUrls && window.djangoUrls.getComponents)
            ? window.djangoUrls.getComponents
            : 'api/get-components/';

        try {
            const response = await fetch(`${urlBase}?equipment_id=${equipmentId}`);
            if (!response.ok) throw new Error("HTTP " + response.status);

            const data = await response.json();

            // 3. Check if this is still the latest request
            if (thisFetchId !== currentFetchId) {
                console.warn("Ignoring stale component fetch.");
                return;
            }

            // 4. Force Clear AGAIN before appending to ensure no duplicates
            componentSelect.innerHTML = '<option value="" disabled selected>Select component</option>';

            const seenIds = new Set();
            data.forEach(component => {
                if (seenIds.has(component.id)) return; // Double protection
                seenIds.add(component.id);

                const option = document.createElement("option");
                option.value = component.id;
                option.textContent = component.name;
                componentSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching components: ", error);
            if (thisFetchId === currentFetchId) {
                componentSelect.innerHTML = '<option value="" disabled selected>Error loading components</option>';
            }
        }

    }

    equipmentSelect.addEventListener("change", function () {
        loadComponents(this.value);
    });

    // FIX: Assign the function, do not execute it!
    window.loadComponents = loadComponents;

});
