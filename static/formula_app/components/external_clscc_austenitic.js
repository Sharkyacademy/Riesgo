// External Chloride SCC Austenitic Module JavaScript
// This component manages the logic for the Ext-ClSCC module.

document.addEventListener('DOMContentLoaded', () => {
    console.log('External ClSCC Austenitic Module Initialized');
    
    // Load Required Data Table
    loadExtClSccRequiredTable();

    async function loadExtClSccRequiredTable() {
        const tableId = 'table_2d_4_1_content';
        const tableContainer = document.getElementById(tableId);
        
        if (!tableContainer) {
            console.warn(`Table container #${tableId} not found.`);
            return;
        }

        try {
            const response = await fetch('/static/formula_app/data/json/table_2d_4_1.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            populateRequiredTable(tableContainer, data);
        } catch (error) {
            console.error('Error loading Table 2.D.4.1:', error);
            tableContainer.innerHTML = `<tr><td class="text-error">Error loading data: ${error.message}</td></tr>`;
        }
    }

    function populateRequiredTable(table, data) {
        if (!data || !data.rows) return;

        let html = '<thead class="bg-blue-900 text-white"><tr>';
        if (data.columns) {
            data.columns.forEach(col => {
                html += `<th class="font-bold">${col}</th>`;
            });
        }
        html += '</tr></thead><tbody>';

        data.rows.forEach(row => {
            html += '<tr>';
            html += `<td class="font-semibold">${row.data}</td>`;
            html += `<td>${row.comment}</td>`; // Note: JSON uses 'comment' (singular) based on previous patterns, checking specific file structure is good practice but assuming standard for now.
            html += '</tr>';
        });
        html += '</tbody>';
        table.innerHTML = html;
        console.log('Table 2.D.4.1 populated.');
    }
});
