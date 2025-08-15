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

let role = "admin";

let urlGetDataDashBoardVilog = `${hostname}/GetDashBoardVilog/${userName}`;
let urlGetDataDashBoardVilogForChart = `${hostname}/GetData3AVGDashBoardVilogVACC/${userName}`;
let urlGetUserByUserName = `${hostname}/GetUserByUserName/${userName}`;

function getData() {
    let url = urlGetDataDashBoardVilog;
    console.log(url)

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

function getDataForChartVAcc()
{
    let url = `${urlGetDataDashBoardVilogForChart}/1`;

    axios.get(url).then(res => {
        if(res.data.length > 0)
        {
            ClusterColumnChart(res.data, "chartVAcc", 1);
        }
    }).catch(err => console.log(err.message));
}

function getDataForChartVLogger()
{
    let url = `${urlGetDataDashBoardVilogForChart}/2`;

    axios.get(url).then(res => {
        if(res.data.length > 0)
        {
            ClusterColumnChart(res.data, "chartVLogger",2);
        }
    }).catch(err => console.log(err.message));
}

function getDataForChartVMetter()
{
    let url = `${urlGetDataDashBoardVilogForChart}/3`;

    axios.get(url).then(res => {
        if(res.data.length > 0)
        {
            ClusterColumnChart(res.data, "chartVMetter",3);
        }
    }).catch(err => console.log(err.message));
}

function getUser()
{
    let url = urlGetUserByUserName;

    axios.get(url).then(res => {
        if(res.data.length >0)
        {
            if(res.data[0].Role != null && res.data[0].Role != undefined && res.data[0].Role.trim() != "")
            {
                role = res.data[0].Role;
            }
        }

        if(role  == "consumer" || role == "staff")
        {
            chartVAcc.style.height = "600px"
            chartVLogger.style.height = "600px"
            chartVMetter.style.height = "600px"
        }
    }).catch(err => console.log(err.message))
}


function CreateDataTable(data) {
    tableData.innerHTML = '';

    if (data.length > 0) {
        let header = '';
        let body = '';

        header += `<tr>
		<th class="font-white">Location</th>
		<th class="font-white">Accquy Battery</th>
		<th class="font-white">Logger Battery</th>
		<th class="font-white">Metter Battery</th>
		<th class="font-white">Temperature </th>
		<th class="font-white">Humidity</th>
		<th class="font-white">Status</th>
	   </tr>`;

        for (let item of data) {
            let contentError = '';
            let background = '';
            let isError = false;
            if (item.Status != null && item.Status != undefined) {
                if (isError == false) {
                    switch (item.Status) {
                        case 2:
                            contentError = `Data delay `;
                            background = '#f1c40f';
                            isError = true;
                            break;
                        case 3:
                            contentError = `Difference `;
                            background = '#e67e22';
                            isError = true;
                            break;
                        case 4:
                            contentError = `Over threshold `;
                            background = '#e74c3c';
                            isError = true;
                            break;
                        case 5:
                            contentError = `Accquy not charging  `;
                            background = '#c0392b';
                            isError = true;
                            break;
                        case 6:
                            contentError = `Low energy reserve `;
                            background = '#f39c12';
                            isError = true;
                            break;
                        case 7:
                            contentError = `Stop working. `;
                            background = '#d35400';
                            isError = true;
                            break;
                        case 8:
                            contentError = `Reduced performance. `;
                            background = '#34495e';
                            isError = true;
                            break;
                        default:
                            contentError = `Normal . `;
                            background = '#2ecc71';
                            isError = true;
                            break;
                    }
                }
            }

            body += `<tr style="background-color: ${background}">
			<td class="font-white">${item.Location}</td>
			<td class="font-white">${item.BatSolarChannel}</td>
			<td class="font-white">${item.BatLoggerChannel}</td>
			<td class="font-white">${item.BatMetterChannel}</td>
			<td class="font-white">${item.Temp}</td>
			<td class="font-white">${item.Humidity}</td>
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
                    .columns([0, 6])
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
                    title: `Bang_Du_Lieu_Vilog`,
                },
                {
                    extend: 'csvHtml5',
                    title: `Bang_Du_Lieu_Vilog`,
                },
                {
                    extend: 'pdfHtml5',
                    title: `Bang_Du_Lieu_Vilog`,
                },
            ],
        });
    }
}


function countErrorSite(data) {
    let obj = {};
    obj.Normal = 0;
    obj.Delay = 0;
    obj.NoBalance = 0;
    obj.OverThreshold = 0;
    obj.NoCharge = 0;
    obj.LowPower = 0;
    obj.StopWorking = 0;
    obj.LowPerformance = 0;

    let result = [];

    if (data.length > 0) {
        for (let item of data) {
            if (item.Status != null && item.Status != undefined) {
                if (item.Status == 10) {
                    obj.Normal += 1;
                } else if (item.Status == 2) {
                    obj.Delay += 1;
                } else if (item.Status == 3) {
                    obj.NoBalance += 1;
                } else if (item.Status == 4) {
                    obj.OverThreshold += 1;
                } else if (item.Status == 5) {
                    obj.NoCharge += 1;
                } else if (item.Status == 6) {
                    obj.LowPower += 1;
                } else if (item.Status == 7) {
                    obj.StopWorking += 1;
                } else if (item.Status == 8) {
                    obj.LowPerformance += 1;
                }
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
                label: 'Data delay.',
                value: obj.Delay,
                color: am4core.color('#f1c40f'),
            };

            result.push(objDelay);
        }

        if (obj.NoBalance > 0) {
            let objNoBalance = {
                label: 'Data Diff',
                value: obj.NoBalance,
                color: am4core.color('#e67e22'),
            };

            result.push(objNoBalance);
        }

        if (obj.OverThreshold > 0) {
            let objOverThreshold = {
                label: 'Over Threshold',
                value: obj.OverThreshold,
                color: am4core.color('#e74c3c'),
            };

            result.push(objOverThreshold);
        }

        if (obj.NoCharge > 0) {
            let objNoCharge = {
                label: 'Accquy not charging',
                value: obj.NoCharge,
                color: am4core.color('#c0392b'),
            };

            result.push(objNoCharge);
        }

        if (obj.LowPower > 0) {
            let objLowPower = {
                label: 'Low Energy Storage',
                value: obj.LowPower,
                color: am4core.color('#f39c12'),
            };

            result.push(objLowPower);
        }

        if (obj.StopWorking > 0) {
            let objStopWorking = {
                label: 'Stop working ',
                value: obj.StopWorking,
                color: am4core.color('#d35400'),
            };

            result.push(objStopWorking);
        }

        if (obj.LowPerformance > 0) {
            let objLowPerformance = {
                label: 'Reduced Performance',
                value: obj.LowPerformance,
                color: am4core.color('#34495e'),
            };

            result.push(objLowPerformance);
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

function convertDataToChartAcc(data, chart) {
    let result = [];

    if (data.length > 0) {
        for (let item of data) {
            if (
                item.BatSolarChannel != null &&
                item.BatSolarChannel != undefined
            ) {
                let obj = {};
                obj.label = item.Location;
                obj.color = am4core.color('#2980b9');
                obj.value = item.BatSolarChannel;
                obj.basemin = 11.5;
                obj.basemax = 14.5;

                result.push(obj);
            }
        }
    }

    return result;
}

function ClusterColumnChart(data, chartname, type) {
    // type 1 is a V acc chart
    // type 2 is a V logger chart
    // type 3 is a V metter chart

    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end
    am4core.addLicense('ch-custom-attribution');

    var chart = am4core.create(chartname, am4charts.XYChart);
    chart.colors.step = 2;

    chart.legend = new am4charts.Legend();
    chart.legend.position = 'top';
    chart.legend.paddingBottom = 20;
    chart.legend.labels.template.maxWidth = 95;

    var xAxis;
    var yAxis;    
    var lineMin;
    var lineMax; 
    

    if(role == "consumer" || role == "staff")
    {
        xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        xAxis.dataFields.category = 'location';
        xAxis.renderer.cellStartLocation = 0.1;
        xAxis.renderer.cellEndLocation = 0.9;
        xAxis.renderer.grid.template.location = 0;
        xAxis.renderer.labels.template.rotation = 45;
        xAxis.renderer.labels.template.horizontalCenter = "left";
        xAxis.renderer.labels.template.location = 0.5;

        yAxis = chart.yAxes.push(new am4charts.ValueAxis());
        yAxis.min = 0;

        if(type == 1)
        {
            lineMax = chart.series.push(new am4charts.LineSeries());
            lineMax.tooltipText = "High: {valueY}";
            lineMax.dataFields.categoryX = "location";
            lineMax.dataFields.valueY = 'basemax';
            lineMax.yAxis = yAxis;
            lineMax.name = "Low"
            lineMax.stroke = am4core.color("#e74c3c");
            lineMax.strokeWidth = 2;
        }
        lineMin = chart.series.push(new am4charts.LineSeries());
        lineMin.tooltipText = "Low: {valueY}";
        lineMin.dataFields.categoryX = "location";
        lineMin.dataFields.valueY = 'basemin';
        lineMin.yAxis = yAxis;
        lineMin.name = "Low";
        lineMin.stroke = am4core.color("#e74c3c");
        lineMin.strokeWidth = 2;
    }
    else 
    {
        xAxis = chart.yAxes.push(new am4charts.CategoryAxis());
        xAxis.dataFields.category = 'location';
        xAxis.renderer.cellStartLocation = 0.1;
        xAxis.renderer.cellEndLocation = 0.9;
        xAxis.renderer.grid.template.location = 0;

        yAxis = chart.xAxes.push(new am4charts.ValueAxis());
        yAxis.min = 0;

        if(type == 1)
        {
            lineMax = chart.series.push(new am4charts.LineSeries());
            lineMax.tooltipText = "High: {valueX}";
            lineMax.dataFields.categoryY = "location";
            lineMax.dataFields.valueX = 'basemax';
            lineMax.yAxis = xAxis;
            lineMax.name = "High"
            lineMax.stroke = am4core.color("#e74c3c");
            lineMax.strokeWidth = 2;
        }
        lineMin = chart.series.push(new am4charts.LineSeries());
        lineMin.tooltipText = "Low: {valueX}";
        lineMin.dataFields.categoryY = "location";
        lineMin.dataFields.valueX = 'basemin';
        lineMin.yAxis = xAxis;
        lineMin.name = "Low"
        lineMin.stroke = am4core.color("#e74c3c");
        lineMin.strokeWidth = 2;
    }

    //add chart cursor
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.behavior = 'zoomY';

    function createSeries(value, name) {
        var series = chart.series.push(new am4charts.ColumnSeries());
        if(role == "consumer" || role == "staff")
        {
            series.dataFields.valueY = value;
            series.dataFields.categoryX = 'location';
            series.tooltipText = '{name}: {valueY.value}';
            
        }
        else 
        {
            series.dataFields.valueX = value;
            series.dataFields.categoryY = 'location';
            series.tooltipText = '{name}: {valueX.value}';
        }
        
        series.name = name;

        series.events.on('hidden', arrangeColumns);
        series.events.on('shown', arrangeColumns);

        return series;
    }

    chart.data = data;

    createSeries('prev2Day', '2 days ago');
    createSeries('prevDay', '1 days ago');
    createSeries('currentDay', 'Current date');



    function arrangeColumns() {
        var series = chart.series.getIndex(0);

        var w =
            1 -
            xAxis.renderer.cellStartLocation -
            (1 - xAxis.renderer.cellEndLocation);
        if (series.dataItems.length > 1) {
            var x0 = xAxis.getX(series.dataItems.getIndex(0), 'categoryX');
            var x1 = xAxis.getX(series.dataItems.getIndex(1), 'categoryX');
            var delta = ((x1 - x0) / chart.series.length) * w;
            if (am4core.isNumber(delta)) {
                var middle = chart.series.length / 2;

                var newIndex = 0;
                chart.series.each(function (series) {
                    if (!series.isHidden && !series.isHiding) {
                        series.dummyData = newIndex;
                        newIndex++;
                    } else {
                        series.dummyData = chart.series.indexOf(series);
                    }
                });
                var visibleCount = newIndex;
                var newMiddle = visibleCount / 2;

                chart.series.each(function (series) {
                    var trueIndex = chart.series.indexOf(series);
                    var newIndex = series.dummyData;

                    var dx =
                        (newIndex - trueIndex + middle - newMiddle) * delta;

                    series.animate(
                        { property: 'dx', to: dx },
                        series.interpolationDuration,
                        series.interpolationEasing,
                    );
                    series.bulletsContainer.animate(
                        { property: 'dx', to: dx },
                        series.interpolationDuration,
                        series.interpolationEasing,
                    );
                });
            }
        }
    }
}

document.addEventListener(
    'DOMContentLoaded',
    function () {

        getUser();

        setTimeout(() => {
            getData();
        }, 0);

        setTimeout(() => {
            getDataForChartVAcc();
        }, 100);

        setTimeout(() => {
            getDataForChartVLogger();
        }, 100);

        setTimeout(() => {
            getDataForChartVMetter();
        }, 100);
    },
    false,
);


setInterval(() => {
    setTimeout(() => {
        getData();
    }, 0);

    setTimeout(() => {
        getDataForChartVAcc();
    }, 100);

    setTimeout(() => {
        getDataForChartVLogger();
    }, 100);

    setTimeout(() => {
        getDataForChartVMetter();
    }, 100);
}, intervalGetData);
