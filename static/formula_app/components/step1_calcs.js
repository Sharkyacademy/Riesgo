const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

//Operacion para obtener el age del equipo.
function step1_calculations() {

    console.log("hola");

    //get table data to use the values.
    const result_JSON_table = sessionStorage.getItem('table4.1_data');

    if (!result_JSON_table) {
        return null;
    }

    const table_data = JSON.parse(result_JSON_table);

    // STEP1 CALCS

    let age = 0;
    let age_liner = 0;
    const start_date = new Date(table_data.start_date);

    //age calc
    if (start_date instanceof Date) {
        //calc age
        const timeDifferenceMS = Date.now() - start_date.getTime();
        age = timeDifferenceMS / MS_PER_YEAR;
        sessionStorage.setItem('comp_age', age.toFixed(3));
    }

    //age liner calc
    const internal_liner = new Date(table_data.internal_liner);

    if (table_data.has_internal_liner === 'yes' && !isNaN(internal_liner)) {
        const timeDifferenceMS = Date.now() - internal_liner.getTime();
        age_liner = timeDifferenceMS / MS_PER_YEAR;
        sessionStorage.setItem('comp_age_liner', age_liner.toFixed(3));

    }

    //mesage to show
    var step1_confirmation = document.getElementById("step1_confirmation");

    console.log(step1_confirmation);

    const rounded_age = age.toFixed(2);

    if (!step1_confirmation) {
        console.error("Eror: id not found: step1_confirmation");
        return;
    }

    let confirmation_message = `We already have those values from the table above: t = ${table_data.thickness} mm; age = ${rounded_age} years`

    if (table_data.has_cladding === 'yes' && table_data.cladding > 0) {
        confirmation_message += `; t<sub>cm</sub> = ${table_data.cladding}`;
    }

    if (age_liner > 0) {
        const rounded_age_liner = age_liner.toFixed(2);
        confirmation_message += `; age<sub>liner</sub> = ${rounded_age_liner} years`;
    }

    step1_confirmation.innerHTML = confirmation_message;

    document.getElementById("step1_confirmation").classList.remove("hidden");
}
