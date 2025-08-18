let tableData = document.getElementById('tableData');
let chartTypeError = document.getElementById('chartTypeError');
let chartVAcc = document.getElementById('chartVAcc');
let chartVLogger = document.getElementById('chartVLogger');
let chartVMetter = document.getElementById('chartVMetter');

let intervalGetData = 1000 * 60 * 2;

let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

let role = 'admin';

let urlGetDataDashBoardVilog = `${hostname}/GetDashBoardVilog/${userName}`;
let urlGetDataDashBoardVilogForChart = `${hostname}/GetData3AVGDashBoardVilogVACC/${userName}`;
let urlGetUserByUserName = `${hostname}/GetUserByUserName/${userName}`;

function getData() {
    let url = urlGetDataDashBoardVilog;

    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                setTimeout(() => {
                    CreateDataTable(res.data);
                }, 100);
                setTimeout(() => {
                    let data = countErrorSite(res.data);
                    drawPieChart(data);
                }, 100);
            }
        })
        .catch((err) => {
            console.log(err.message);
        });
}

function getUser() {
    let url = urlGetUserByUserName;

    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                if (
                    res.data[0].Role != null &&
                    res.data[0].Role != undefined &&
                    res.data[0].Role.trim() != ''
                ) {
                    role = res.data[0].Role;
                }
            }

            if (role == 'consumer' || role == 'staff') {
                chartVAcc.style.height = '600px';
                chartVLogger.style.height = '600px';
                chartVMetter.style.height = '600px';
            }
        })
        .catch((err) => console.log(err.message));
}

function CreateDataTable(data) {
    tableData.innerHTML = '';

    if (data.length > 0) {
        let header = '';
        let body = '';

        header += `<tr>
        <th class="font-white">SiteId</th>
		<th class="font-white">Location</th>
		<th class="font-white">Forward Flow</th>
		<th class="font-white">Reverse Flow</th>
		<th class="font-white">Forward Index</th>
		<th class="font-white">Reverse Index</th>
		<th class="font-white">Net Total</th>
        <th class="font-white">Battery Logger</th>
        <th class="font-white">Status</th>
		<th class="font-white">Alarm</th>
	   </tr>`;

        for (let item of data) {
            let contentError = '';
            let background = '';
            let isError = false;
            if (item.Status.length > 0) {
                const status = Math.min(...item.Status.map((x) => x.Status));

                if (isError == false) {
                    switch (status) {
                        case 2:
                            contentError = `Disconnected`;
                            background = '#f1c40f';
                            isError = true;
                            break;
                        case 4:
                            contentError = `Low alarm data`;
                            background = '#e74c3c';
                            isError = true;
                            break;
                        default:
                            contentError = `Normal . `;
                            background = '#2ecc71';
                            isError = true;
                            break;
                    }
                }
            } else {
                contentError = ``;
                background = '#95a5a6';
            }

            body += `<tr style="background-color: ${background}">
            <td class="font-white">${item.SiteId}</td>
			<td class="font-white">${item.Location}</td>
			<td class="font-white">${
                item.ForwardFlow !== null && item.ForwardFlow !== undefined
                    ? item.ForwardFlow
                    : 'NO DATA'
            }</td>
			<td class="font-white">${
                item.ReverseFlow !== null && item.ReverseFlow !== undefined
                    ? item.ReverseFlow
                    : 'NO DATA'
            }</td>
			<td class="font-white">${
                item.IndexForward !== null && item.IndexForward !== undefined
                    ? item.IndexForward
                    : 'NO DATA'
            }</td>
			<td class="font-white">${
                item.IndexReverse !== null && item.IndexReverse !== undefined
                    ? item.IndexReverse
                    : 'NO DATA'
            }</td>
			<td class="font-white">${
                item.IndexTotal !== null && item.IndexTotal !== undefined
                    ? item.IndexTotal
                    : 'NO DATA'
            }</td>
            <td class="font-white">${
                item.BatteryLogger !== null && item.BatteryLogger !== undefined
                    ? item.BatteryLogger
                    : 'NO DATA'
            }</td>
            <td class="font-white">${
                item.StatusLogger !== null ? item.StatusLogger : ''
            }</td>
			<td class="font-white">${contentError}</td>
		</tr>`;
        }

        tableData.innerHTML = `<table class="table table-bordered dataTable no-footer" id="dataTable2" cellspacing="0" style="width: 100%;overflow-y:auto" role="grid" aria-describedby="dataTable_info"> 
		<thead class="table-header"> ${header} 
		</thead> 
		<tbody>  ${body} 
		</tbody> 
		<tfoot>${header}</tfoot>
		</table > `;

        $('#dataTable2').DataTable({
            pageLength: 20,
            order: [[0, 'desc']],
            initComplete: function () {
                this.api()
                    .columns([0, 9])
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
                                    .search(
                                        val ? '^' + val + '$' : '',
                                        true,
                                        false,
                                    )
                                    .draw();
                            });
                        column
                            .data()
                            .unique()
                            .sort()
                            .each(function (d, j) {
                                select.append(
                                    '<option value="' +
                                        d +
                                        '">' +
                                        d +
                                        '</option>',
                                );
                            });
                    });
            },
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excelHtml5',
                    title: `Data_Overview_Vilog`,
                },
                {
                    extend: 'csvHtml5',
                    title: `Data_Overview_Vilog`,
                },
                {
                    extend: 'pdfHtml5',
                    title: `Data_Overview_Vilog`,
                },
            ],
        });
    }
}

function countErrorSite(data) {
    let obj = {};
    obj.Normal = 0;
    obj.Delay = 0;
    obj.OverFlow = 0;

    let result = [];

    if (data.length > 0) {
        for (let item of data) {
            if (item.Status.length > 0) {
                const status = Math.min(...item.Status.map((x) => x.Status));

                switch (status) {
                    case 2:
                        obj.Delay += 1;
                        break;
                    case 4:
                        obj.OverFlow += 1;
                        break;
                    case 4:
                        obj.OverFlow += 1;
                        break;
                    default:
                        obj.Normal += 1;
                        break;
                }
            } else {
            }
        }

        if (obj.Normal > 0) {
            let objNormal = {
                label: 'Normal ',
                value: obj.Normal,
                color: am4core.color('#2ecc71'),
            };

            result.push(objNormal);
        }

        if (obj.Delay > 0) {
            let objDelay = {
                label: 'Disconnected',
                value: obj.Delay,
                color: am4core.color('#f1c40f'),
            };

            result.push(objDelay);
        }

        if (obj.OverFlow > 0) {
            let objOverFlow = {
                label: 'Over Flow',
                value: obj.OverFlow,
                color: am4core.color('#e74c3c'),
            };

            result.push(objOverFlow);
        }
    }

    return result;
}

function drawPieChart(data) {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end
    am4core.addLicense('ch-custom-attribution');

    var chart = am4core.create('chartTypeError', am4charts.PieChart3D);
    chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

    chart.legend = new am4charts.Legend();

    chart.data = data;

    var series = chart.series.push(new am4charts.PieSeries3D());
    series.dataFields.value = 'value';
    series.dataFields.category = 'label';
    series.slices.template.propertyFields.fill = 'color';
    series.labels.template.text = '{category}: {value.value}';
    series.slices.template.tooltipText = '{category}: {value.value}';
}

document.addEventListener(
    'DOMContentLoaded',
    function () {
        getUser();

        setTimeout(() => {
            getData();
        }, 0);
    },
    false,
);

setInterval(() => {
    setTimeout(() => {
        getData();
    }, 0);
}, intervalGetData);
