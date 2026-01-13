// CUI Ferritic Module JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log("CUI Ferritic JS loaded");
    loadCUIRequiredDataTable();
});

async function loadCUIRequiredDataTable() {
    const tableContainer = document.getElementById('table_2d_3_1_cui_content');
    if (!tableContainer) {
        console.warn('CUI Table container #table_2d_3_1_cui_content not found!');
        return;
    }

    try {
        const response = await fetch('/static/formula_app/data/json/table_2d_3_1.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        populateCUITable(tableContainer, data);
    } catch (error) {
        console.error('Error loading Table 2.D.3.1:', error);
        tableContainer.innerHTML = `<tr><td class="text-error">Error loading data: ${error.message}</td></tr>`;
    }
}

function populateCUITable(tableContainer, data) {
     if(!data || !data.rows) return;
     
     // Create Header
     let html = '<thead class="bg-blue-900 text-white"><tr>';
     // Check for 'columns' (preferred) or 'headers'
     const headers = data.columns || data.headers;
     if (headers) {
         headers.forEach(h => {
             html += `<th class="font-bold text-base">${h}</th>`;
         });
     }
     html += '</tr></thead><tbody>';

     // Create Rows
     data.rows.forEach(row => {
         html += '<tr>';
         html += `<td class="font-semibold align-top whitespace-nowrap">${row.data}</td>`;
         html += `<td class="align-top">${row.comment || row.comments || ''}</td>`;
         html += '</tr>';
     });
     html += '</tbody>';
     
     tableContainer.innerHTML = html;
     console.log("CUI Table Populated.");
}
