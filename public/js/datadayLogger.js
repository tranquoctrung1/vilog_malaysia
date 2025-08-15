let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetDataDayLogger = `${hostname}/GetDataDayLogger`;
let selectedSite = null;

let loading = document.getElementById('loading');

// add hide
loading.classList.add('hide');

function fetchSites() {
    axios
        .get(urlGetSites)
        .then((res) => {
            createOptionsInSelectBox(res.data, 'selectSite');
            selectedSite = new TomSelect('#selectSite', {
                plugins: ['remove_button'], // Adds "x" to remove items
                create: false, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                placeholder: 'Choose site..',
            });
        })
        .catch((err) => console.log(err));
}

fetchSites();

let viewDataDayLogger = document.getElementById('viewDataDayLogger');

viewDataDayLogger.addEventListener('click', function (e) {
    loading.classList.add('show');
    loading.classList.remove('hide');

    let startDate = document.getElementById('startDate');
    let endDate = document.getElementById('endDate');
    let siteid = selectedSite.getValue();

    if (siteid.length <= 0) {
        swal('Err', 'Please choose location', 'error');
    } else if (
        startDate.value == '' ||
        startDate.value == null ||
        startDate.value == undefined
    ) {
        swal('Err', 'Not null start date', 'error');
    } else if (
        endDate.value == '' ||
        endDate.value == null ||
        endDate.value == undefined
    ) {
        swal('Err', 'Not null end date', 'error');
    } else {
        let start = new Date(startDate.value);
        let end = new Date(endDate.value);

        let totalMilisecondStart = start.getTime();
        let totalMilisecondEnd = end.getTime();

        const temp = [];

        for (const id of siteid) {
            let url = `${urlGetDataDayLogger}/${id}/${totalMilisecondStart}/${totalMilisecondEnd}`;

            temp.push(axios.get(url));
        }

        Promise.all(temp)
            .then((res) => {
                let data = [];
                for (const d of res) {
                    data.push(...d.data);
                }
                fillDataTable(data);
            })
            .catch((err) => console.log(err));
    }
});

function fillDataTable(data) {
    loading.classList.add('hide');
    loading.classList.remove('show');

    createTablePlaceHolder();

    createHeader(data);
    createBody(data);
    createFooter(data);

    $('#example').DataTable({
        initComplete: function () {
            this.api()
                .columns([])
                .every(function () {
                    var column = this;
                    var select = $(
                        '<select><option value=""></option></select>',
                    )
                        .appendTo($(column.footer()).empty())
                        .on('change', function () {
                            var val = $.fn.dataTable.util.escapeRegex(
                                $(this).val(),
                            );
                            column
                                .search(val ? '^' + val + '$' : '', true, false)
                                .draw();
                        });
                    column
                        .data()
                        .unique()
                        .sort()
                        .each(function (d, j) {
                            select.append(
                                '<option value="' + d + '">' + d + '</option>',
                            );
                        });
                });
        },
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'excelHtml5',
                title: `Data_Vilog_Daily_From_${startDate}_To_${endDate}`,
            },
            {
                extend: 'csvHtml5',
                title: `Data_Vilog_Daily_From_${startDate}_To_${endDate}`,
            },
            {
                extend: 'pdfHtml5',
                title: `Data_Vilog_Daily_From_${startDate}_To_${endDate}`,
            },
        ],
    });
}

function createHeader(data) {
    let head = document.getElementById('head');

    head.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<tr>
            <th>Timestamp</th>
            <th>SiteId</th>
            <th>Location</th>
            <th>Flow max</th>
            <th>Flow Min</th>
            <th>Consumption</th>
            <th>Battery Logger Max</th>
            <th>Battery Logger Min</th>
            <th>Battery Meter Max</th>
            <th>Battery Meter Min</th>
            <th>Press Max</th>
            <th>Press Min</th>
      </tr>`;
    }

    head.innerHTML = content;
}

function createBody(data) {
    let body = document.getElementById('body');

    body.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        for (let item of data) {
            content += `<tr>`;
            content += `<td>${ConvertDataIntoTable(
                convertDateToString(convertDateFromApi(item.TimeStamp)),
            )}</td>`;
            content += `<td>${item.SiteId}</td>`;
            content += `<td>${item.Location}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MaxFlow)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MinFlow)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.NetIndex)}</td>`;
            content += `<td>${ConvertDataIntoTable(
                item.MaxBatteryLogger,
            )}</td>`;
            content += `<td>${ConvertDataIntoTable(
                item.MinBatteryLogger,
            )}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MaxBatteryMeter)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MinBatteryMeter)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MaxPressure)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MinPressure)}</td>`;
            content += `</tr>`;
        }
    }

    body.innerHTML = content;
}

function createFooter(data) {
    let foot = document.getElementById('foot');

    foot.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        let totalValue = 0;
        for (let item of data) {
            totalValue += parseFloat(item.NetIndex);
        }
        content += `<tr>
                <th colspan="5">Sum consumption </th>
                <th>${ConvertDataIntoTable(totalValue)}</th>
                <th colspan="6"></th>
      </tr>`;
    }

    foot.innerHTML = content;
}
