let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetDataDayLogger = `${hostname}/GetDataDayLogger`;
let selectedSite = null;

let dailyDataTableBody = document.getElementById('dailyDataTableBody');
let sumConsumption = document.getElementById('sumConsumption');

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
    if ($.fn.DataTable.isDataTable('#dailyDataTable')) {
        $('#dailyDataTable').DataTable().clear().destroy();
    }

    createBody(data);
    createFooter(data);

    $('#dailyDataTable').DataTable({
        language: {
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: { previous: 'Previous', next: 'Next' },
        },
        pageLength: 20,
        order: [[0, 'desc']],
        columnDefs: [
            { type: 'date', targets: 0 },
            { type: 'num', targets: [3, 4, 5, 6, 7, 8, 9] },
        ],
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
                extend: 'excel',
                text: '<i class="fas fa-file-excel me-1"></i> Excel',
                className: 'btn btn-sm buttons-excel',
                filename: `Data_Vilog_Daily_From_${startDate}_To_${endDate}`,
            },
            {
                extend: 'csv',
                text: '<i class="fas fa-file-csv me-1"></i> CSV',
                className: 'btn btn-sm buttons-csv',
                filename: `Data_Vilog_Daily_From_${startDate}_To_${endDate}`,
            },
            {
                extend: 'pdf',
                text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                className: 'btn btn-sm buttons-pdf',
                filename: `Data_Vilog_Daily_From_${startDate}_To_${endDate}`,
            },
        ],

        footerCallback: function (row, data, start, end, display) {
            var api = this.api();

            var totalConsumption = api
                .column(5, { page: 'current' })
                .data()
                .reduce(function (a, b) {
                    var val = parseFloat(b.replace(/<[^>]*>?/gm, '')) || 0;
                    return a + val;
                }, 0);

            $('#sumConsumption').html(totalConsumption.toFixed(2));
        },
    });
}

function createBody(data) {
    dailyDataTableBody.innerHTML = '';

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
                item.MaxBatteryLogger,
            )}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MaxPressure)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.MinPressure)}</td>`;
            content += `</tr>`;
        }
    }

    dailyDataTableBody.innerHTML = content;
}

function createFooter(data) {
    sumConsumption.innerHTML = '';

    if (CheckExistsData(data)) {
        let totalValue = 0;
        for (let item of data) {
            totalValue += parseFloat(item.NetIndex);
        }
        sumConsumption.innerHTML = totalValue;
    } else {
        sumConsumption.innerHTML = '';
    }
}
