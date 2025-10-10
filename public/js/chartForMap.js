// global url
let urlGetDataLogger = `${hostname}/GetDataLogger`;

// global variable
let channelIdForViewChart;
let locationForChart;
let unitForChart;
let channelNameForChart;
let mutipleChannels = [];
let isMultipleViewChart = false;

let talbeChart = document.getElementById('talbeChart');
let chartDataLogger = document.getElementById('chartDataLogger');
let modalMinFlow = document.getElementById('modalMinFlow');
let modalMaxFlow = document.getElementById('modalMaxFlow');
let modalMinNet = document.getElementById('modalMinNet');
let modalMaxNet = document.getElementById('modalMaxNet');
let modalMinBatteryLogger = document.getElementById('modalMinBatteryLogger');
let modalMaxBatteryLogger = document.getElementById('modalMaxBatteryLogger');
let modalMinBatteryMeter = document.getElementById('modalMinBatteryMeter');
let modalMaxBatteryMeter = document.getElementById('modalMaxBatteryMeter');
let modalConsumption = document.getElementById('modalConsumption');

let chart;

function openChart(channelId, location, channelName, units) {
    if (channelId != null && channelId != undefined && channelId.trim() != '') {
        channelIdForViewChart = channelId;
        locationForChart = location;
        unitForChart = units;
        channelNameForChart = channelName;

        isMultipleViewChart = false;

        for (let item of mutipleChannels) {
            document.getElementById(`${item}`).checked = false;
        }
        let channelForCheckView = document.getElementById(`${channelId}`);
        channelForCheckView.checked = true;
        mutipleChannels = [];
        mutipleChannels.push(channelId);

        // show chart
        $('#chart').modal('show');

        // get Data
        let startDate = document.getElementById('startDate');
        let endDate = document.getElementById('endDate');

        // get timestamp from api
        let url = `${urlGetCurrentTimeStamp}/${channelId}`;

        axios
            .get(url)
            .then((res) => {
                if (CheckExistsData(res.data)) {
                    let date = convertDateFromApi(res.data[0].TimeStamp);
                    let tDate = convertDateFromApi(res.data[0].TimeStamp);
                    tDate.setDate(tDate.getDate() - 1);

                    endDate.value = convertDateToDateTimeLocalInputTag(date);
                    startDate.value = convertDateToDateTimeLocalInputTag(tDate);

                    date.setHours(date.getHours() + 7);
                    tDate.setHours(tDate.getHours() + 7);

                    let totalMilisecondStart = tDate.getTime();
                    let totalMilisecondEnd = date.getTime();

                    let urlDataLogger = `${urlGetDataLogger}/${channelIdForViewChart}/${totalMilisecondStart}/${totalMilisecondEnd}/0`;

                    axios
                        .get(urlDataLogger)
                        .then((response) => {
                            drawChart(
                                channelIdForViewChart,
                                locationForChart,
                                channelNameForChart,
                                unitForChart,
                                response.data.DataLogger,
                            );

                            fillDataChannel(response.data);
                        })
                        .catch((err) => console.log(err));
                }
            })
            .catch((err) => console.log(err));
    } else {
        swal('Err', 'Not channel code', 'error');
    }
}

function fillDataChannel(data) {
    modalMinFlow.innerHTML = `${data.MinFlow} m3/h`;
    modalMaxFlow.innerHTML = `${data.MaxFlow} m3/h`;
    modalMinNet.innerHTML = `${data.MinNet} m3`;
    modalMaxNet.innerHTML = `${data.MaxNet} m3`;
    modalConsumption.innerHTML = `${data.Consumption} m3`;
    if (data.MaxBatteryLogger !== undefined) {
        modalMaxBatteryLogger.style.display = 'block';
        modalMaxBatteryLogger.innerHTML = `Max Battery Logger: ${data.MaxBatteryLogger} V`;
    } else {
        modalMaxBatteryLogger.style.display = 'none';
    }
    if (data.MinBatteryLogger !== undefined) {
        modalMinBatteryLogger.style.display = 'block';
        modalMinBatteryLogger.innerHTML = `Min Battery Logger: ${data.MinBatteryLogger} V`;
    } else {
        modalMinBatteryLogger.style.display = 'none';
    }

    if (data.MaxBatteryMeter !== undefined) {
        modalMaxBatteryMeter.style.display = 'block';
        modalMaxBatteryMeter.innerHTML = `Max Battery Meter: ${data.MaxBatteryMeter} V`;
    } else {
        modalMaxBatteryMeter.style.display = 'none';
    }
    if (data.MinBatteryMeter !== undefined) {
        modalMinBatteryMeter.style.display = 'block';
        modalMinBatteryMeter.innerHTML = `Min Battery Meter: ${data.MinBatteryMeter} V`;
    } else {
        modalMinBatteryMeter.style.display = 'none';
    }
}

function viewChart() {
    //resetState();

    if (isMultipleViewChart == false) {
        if (
            channelIdForViewChart != null &&
            channelIdForViewChart != undefined &&
            channelIdForViewChart.trim() != ''
        ) {
            let startDate = document.getElementById('startDate');
            let endDate = document.getElementById('endDate');

            let start = new Date(startDate.value);
            let end = new Date(endDate.value);

            start.setHours(start.getHours() + 7);
            end.setHours(end.getHours() + 7);

            let totalMilisecondStart = start.getTime();
            let totalMilisecondEnd = end.getTime();

            let url = `${urlGetDataLogger}/${channelIdForViewChart}/${totalMilisecondStart}/${totalMilisecondEnd}/0`;

            axios
                .get(url)
                .then((res) => {
                    drawChart(
                        channelIdForViewChart,
                        locationForChart,
                        channelNameForChart,
                        unitForChart,
                        res.data.DataLogger,
                    );

                    fillDataChannel(res.data);
                })
                .catch((err) => console.log(err));
        } else {
            swal('Err', 'Not channel code', 'error');
        }
    } else {
        btnViewMutipleChannel.click();
    }
}

// func draw chart
function drawChart(channelId, location, channelname, units, data) {
    // if (chart != null && chart != undefined) {
    //     chart.dispose();
    // }
    // console.log(data);

    // // Themes begin
    // am4core.useTheme(am4themes_animated);
    // am4core.addLicense('ch-custom-attribution');
    // // Themes end

    // chart = am4core.create('chartDataLogger', am4charts.XYChart);
    // chart.paddingRight = 20;

    // var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    // dateAxis.renderer.grid.template.location = 0;
    // dateAxis.minZoomCount = 5;

    // // this makes the data to be grouped (in the future)
    // // dateAxis.groupData = true;
    // // dateAxis.groupCount = 500;

    // var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    // var series = chart.series.push(new am4charts.LineSeries());
    // series.dataFields.dateX = 'TimeStamp';
    // series.dataFields.valueY = `${channelId}`;
    // series.tooltipText = `{valueY} ${units}`;
    // series.tooltip.pointerOrientation = 'vertical';
    // series.tooltip.background.fillOpacity = 0.5;
    // series.name = `${channelname}`;
    // if (units == 'm') {
    //     series.stroke = am4core.color('#ff0000');
    // } else if (units == 'm3/h') {
    //     series.stroke = am4core.color('#3498db');
    // } else {
    //     series.stroke = am4core.color('#2ecc71');
    // }
    // series.legendSettings.valueText = '{valueY.close}';
    // series.legendSettings.itemValueText = '{valueY}';

    // //// Make bullets grow on hover
    // // var bullet = series.bullets.push(new am4charts.CircleBullet());
    // // bullet.circle.strokeWidth = 1;
    // // bullet.circle.radius = 2;
    // // bullet.circle.fill = am4core.color("#fff");

    // // var bullethover = bullet.states.create("hover");
    // // bullethover.properties.scale = 1.3;

    // chart.cursor = new am4charts.XYCursor();
    // chart.cursor.xAxis = dateAxis;

    // var scrollbarX = new am4core.Scrollbar();
    // scrollbarX.marginBottom = 20;
    // chart.scrollbarX = scrollbarX;

    // chart.legend = new am4charts.Legend();
    // chart.legend.position = 'bottom';
    // chart.legend.scrollable = true;
    // chart.legend.labels.template.text = '[bold {color}]{name}[/]';

    // chart.exporting.menu = new am4core.ExportMenu();

    let dataForChart = [];

    for (let item of data) {
        if (
            item.TimeStamp != null &&
            item.TimeStamp != undefined &&
            item.TimeStamp.toString().trim() != ''
        ) {
            if (item.Value != null && item.Value != undefined) {
                let obj = {};
                obj.TimeStamp = convertDateFromApi(item.TimeStamp);
                obj[`${channelId}`] = item.Value;

                dataForChart.push(obj);
            }
        }
    }

    const trace = {
        x: data.map((d) => new Date(d.TimeStamp)),
        y: data.map((d) => d.Value),
        mode: 'lines+markers',
        type: 'scatter',
        line: { shape: 'spline', width: 2 },
        marker: { size: 5 },
        name: `${location} | ${channelname}`,
        hovertemplate: `%{customdata}: %{y}<extra></extra> ${units}`, // 👈 custom tooltip
        customdata: data.map((d) => convertDateToString(new Date(d.TimeStamp))), // 👈 formatted timestamp
    };

    const layout = {
        title: `${channelId}_${channelname}`,
        xaxis: { title: 'Time', type: 'date' },
        yaxis: { title: 'Value' },
        showlegend: true,
        legend: {
            orientation: 'h', // 👈 horizontal legend
            yanchor: 'top',
            y: -0.2, // 👈 move below the chart
            xanchor: 'center',
            x: 0.5,
        },
    };

    const config = {
        displayModeBar: true, // 👈 always show toolbar
        displaylogo: false, // hide Plotly logo
        responsive: true, // auto resize on window change
        scrollZoom: true, // allow mouse wheel zoom
        modeBarButtonsToRemove: [], // keep all buttons
    };

    Plotly.newPlot('chartDataLogger', [trace], layout, config);

    createTableSingle(dataForChart, channelname, channelId);
}

function onChangeInputChannel(e) {
    let index = mutipleChannels.indexOf(e.id);

    if (e.checked == false) {
        if (index > -1) {
            mutipleChannels.splice(index, 1);
        }
    } else {
        if (index == -1) {
            mutipleChannels.push(e.id);
        }
    }
}

// event for draw chart multiple channel

let btnViewMutipleChannel = document.getElementById('viewMutipleChannel');

btnViewMutipleChannel.addEventListener('click', async function () {
    isMultipleViewChart = true;
    let startDateToViewChart;
    let endDateToViewChart;
    // show chart
    $('#chart').modal('show');

    // get Data
    let startDate = document.getElementById('startDate');
    let endDate = document.getElementById('endDate');

    if (
        startDate.value == null ||
        startDate.value == undefined ||
        startDate.value.trim() == '' ||
        endDate.value.trim() == '' ||
        (endDate.value == null && endDate.value == undefined)
    ) {
        for (let channel of mutipleChannels) {
            // get timestamp from api
            let url = `${urlGetCurrentTimeStamp}/${channel}`;

            let res = await axios.get(url);

            if (CheckExistsData(res.data)) {
                let date = convertDateFromApi(res.data[0].TimeStamp);
                let tDate = convertDateFromApi(res.data[0].TimeStamp);
                tDate.setDate(tDate.getDate() - 1);

                endDate.value = convertDateToDateTimeLocalInputTag(date);
                startDate.value = convertDateToDateTimeLocalInputTag(tDate);

                date.setHours(date.getHours() + 7);
                tDate.setHours(tDate.getHours() + 7);

                let totalMilisecondStart = tDate.getTime();
                let totalMilisecondEnd = date.getTime();
                startDateToViewChart = totalMilisecondStart;
                endDateToViewChart = totalMilisecondEnd;
                break;
            }
        }
    } else {
        let start = new Date(startDate.value);
        let end = new Date(endDate.value);

        start.setHours(start.getHours() + 7);
        end.setHours(end.getHours() + 7);

        let totalMilisecondStart = start.getTime();
        let totalMilisecondEnd = end.getTime();
        startDateToViewChart = totalMilisecondStart;
        endDateToViewChart = totalMilisecondEnd;
    }
    let mutipleChannelsApi = mutipleChannels.join('|');

    let url = `${urlGetDataMultipleChannel}/${mutipleChannelsApi}/${startDateToViewChart}/${endDateToViewChart}`;
    axios
        .get(url)
        .then((res) => {
            drawChartMultiple(res.data);
        })
        .catch((err) => console.log(err));
});

function drawChartMultiple(data) {
    // if (chart != null && chart != undefined) {
    //     chart.dispose();
    // }
    // if (data.length > 1) {
    //     am4core.useTheme(am4themes_animated);
    //     // Themes end
    //     // Create chart instance
    //     chart = am4core.create('chartDataLogger', am4charts.XYChart);
    //     am4core.addLicense('ch-custom-attribution');

    //     // Create axes
    //     var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    //     var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    //     for (var i = 0; i < data.length; i++) {
    //         if (data[i].length > 1) {
    //             createSeries(data[i], data[i][data[i].length - 1]);
    //         }
    //     }

    //     // Create series
    //     function createSeries(s, name) {
    //         var series = chart.series.push(new am4charts.LineSeries());
    //         series.dataFields.valueY = 'Value';
    //         series.dataFields.dateX = 'TimeStamp';
    //         series.name = `${name.location} | ${name.channelname}`;
    //         series.tooltipText = '{valueY}';
    //         series.tooltip.pointerOrientation = 'vertical';
    //         series.tooltip.background.fillOpacity = 0.5;
    //         series.legendSettings.valueText = '{valueY.close}';
    //         series.legendSettings.itemValueText = '{valueY}';

    //         var segment = series.segments.template;
    //         segment.interactionsEnabled = true;

    //         var hoverState = segment.states.create('hover');
    //         hoverState.properties.strokeWidth = 3;

    //         var dimmed = segment.states.create('dimmed');
    //         dimmed.properties.stroke = am4core.color('#dadada');

    //         segment.events.on('over', function (event) {
    //             processOver(event.target.parent.parent.parent);
    //         });

    //         segment.events.on('out', function (event) {
    //             processOut(event.target.parent.parent.parent);
    //         });
    //         for (let i = 0; i < s.length - 1; i++) {
    //             s[i].TimeStamp = convertDateFromApi(s[i].TimeStamp);
    //         }
    //         series.data = s;
    //         return series;
    //     }

    //     chart.legend = new am4charts.Legend();
    //     chart.legend.position = 'bottom';
    //     chart.legend.scrollable = true;
    //     chart.legend.labels.template.text = '[bold {color}]{name}[/]';

    //     chart.cursor = new am4charts.XYCursor();
    //     chart.cursor.xAxis = dateAxis;

    //     var scrollbarX = new am4core.Scrollbar();
    //     scrollbarX.marginBottom = 20;
    //     chart.scrollbarX = scrollbarX;

    //     // setTimeout(function() {
    //     //   chart.legend.markers.getIndex(0).opacity = 0.3;
    //     // }, 3000)
    //     chart.legend.markers.template.states.create(
    //         'dimmed',
    //     ).properties.opacity = 0.3;
    //     chart.legend.labels.template.states.create(
    //         'dimmed',
    //     ).properties.opacity = 0.3;

    //     chart.legend.itemContainers.template.events.on(
    //         'over',
    //         function (event) {
    //             processOver(event.target.dataItem.dataContext);
    //         },
    //     );

    //     chart.legend.itemContainers.template.events.on('out', function (event) {
    //         processOut(event.target.dataItem.dataContext);
    //     });

    //     function processOver(hoveredSeries) {
    //         hoveredSeries.toFront();

    //         hoveredSeries.segments.each(function (segment) {
    //             segment.setState('hover');
    //         });

    //         hoveredSeries.legendDataItem.marker.setState('default');
    //         hoveredSeries.legendDataItem.label.setState('default');

    //         chart.series.each(function (series) {
    //             if (series != hoveredSeries) {
    //                 series.segments.each(function (segment) {
    //                     segment.setState('dimmed');
    //                 });
    //                 series.bulletsContainer.setState('dimmed');
    //                 series.legendDataItem.marker.setState('dimmed');
    //                 series.legendDataItem.label.setState('dimmed');
    //             }
    //         });
    //     }

    //     function processOut() {
    //         chart.series.each(function (series) {
    //             series.segments.each(function (segment) {
    //                 segment.setState('default');
    //             });
    //             series.bulletsContainer.setState('default');
    //             series.legendDataItem.marker.setState('default');
    //             series.legendDataItem.label.setState('default');
    //         });
    //     }

    //     // document.getElementById("button").addEventListener("click", function () {
    //     //   processOver(chart.series.getIndex(3));
    //     // });
    // }
    const dataForChart = [...data];

    const dataNameChart = [];
    for (let i = 0; i < dataForChart.length; i++) {
        dataNameChart.push(dataForChart[i][dataForChart[i].length - 1]);
    }

    let count = 0;

    if (dataForChart.length > 0) {
        const traces = dataForChart.map((group) => {
            return {
                x: group.map((d) => new Date(d.TimeStamp)),
                y: group.map((d) => d.Value),
                mode: 'lines+markers',
                type: 'scatter',
                name: `${dataNameChart[count].location} | ${dataNameChart[count].channelname}`,
                line: { shape: 'spline', width: 2 },
                marker: { size: 6 },
                hovertemplate: `%{customdata}: %{y}<extra></extra>`,
                customdata: group.map((d) =>
                    convertDateToString(new Date(d.TimeStamp)),
                ),
            };
        });

        // ✅ Layout configuration
        const layout = {
            title: 'Data Chart Mutiple Channel',
            xaxis: { title: 'Time', type: 'date' },
            yaxis: { title: 'Value' },
            showlegend: true,
            legend: {
                orientation: 'h',
                yanchor: 'top',
                y: -0.25,
                xanchor: 'center',
                x: 0.5,
            },
        };

        // ✅ Plot configuration
        const config = {
            displayModeBar: true,
            displaylogo: false,
            responsive: true,
            scrollZoom: true,
        };

        // ✅ Draw chart
        Plotly.newPlot('chartDataLogger', traces, layout, config);
    }

    console.log(data);

    createTableMultiple(data);
}

function createTableSingle(data, channelName, channelid) {
    let header = `<tr><th>TimeStamp</th><th>${channelName}</th></tr>`;

    let body = '';

    for (let item of data) {
        body += `<tr><td>${convertDateToString(
            item.TimeStamp,
        )}</td><td>${ConvertDataIntoTable(item[`${channelid}`])}</td></tr>`;
    }

    talbeChart.innerHTML = '';

    talbeChart.innerHTML = `<table class="table table-bordered dataTable no-footer" id="dataTable2" cellspacing="0" style="width: 100%;overflow-y:auto" role="grid" aria-describedby="dataTable_info"> 
        <thead> ${header} 
        </thead> 
        <tbody>  ${body} 
        </tbody> 
        </table > `;
    $('#dataTable2').DataTable({
        pageLength: 5,
        order: [[0, 'desc']],
        initComplete: function () {
            this.api()
                .columns([0])
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
                title: `Data_Historical`,
            },
            {
                extend: 'csvHtml5',
                title: `Data_Historical`,
            },
            {
                extend: 'pdfHtml5',
                title: `Data_Historical`,
            },
        ],
    });
}

function convertData(data) {
    if (CheckExistsData(data)) {
        let max = data[0].length;
        let index = 0;
        let listChannelMutiple = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i].length > 0) {
                if (max < data[i].length) {
                    max = data[i].length;
                    index = i;
                }
                listChannelMutiple.push(
                    `${data[i][data[i].length - 1].location}|${
                        data[i][data[i].length - 1].channelname
                    }`,
                );
            }
        }
        let listData = [];

        for (let i = 0; i < data[index].length - 1; i++) {
            let obj = {};
            obj.TimeStamp = data[index][i].TimeStamp;
            obj[`${listChannelMutiple[index]}`] = ConvertDataIntoTable(
                data[index][i].Value,
            );

            listData.push(obj);
        }

        for (let item of listData) {
            for (let i = 0; i < data.length; i++) {
                if (i != index && data[i].length > 1) {
                    try {
                        let value = data[i].find((e) => {
                            return (
                                new Date(e.TimeStamp).getTime() ==
                                new Date(item.TimeStamp).getTime()
                            );
                        });
                        if (value == null || value == undefined) {
                            item[`${listChannelMutiple[i]}`] = '';
                        } else {
                            item[`${listChannelMutiple[i]}`] =
                                ConvertDataIntoTable(value.Value);
                        }
                    } catch (err) {
                        item[`${listChannelMutiple[i]}`] = '';
                    }
                }
            }
        }

        return listData;
    } else {
        return [];
    }
}

function createTableMultiple(data) {
    let convertDataTable = convertData(data);

    console.log(convertDataTable);

    if (CheckExistsData(convertDataTable)) {
        let header = '';
        header += `<tr>`;

        for (let pro in convertDataTable[0]) {
            if (pro == 'TimeStamp') {
                header += `<th>TimeStamp</th>`;
            } else {
                header += `<th>${pro}</th>`;
            }
        }
        header += `</tr>`;

        let body = '';

        for (let item of convertDataTable) {
            body += `<tr>`;
            for (let pro in item) {
                if (pro == 'TimeStamp') {
                    body += `<td>${convertDateToString(
                        new Date(item[pro]),
                    )}</td>`;
                } else {
                    body += `<td>${ConvertDataIntoTable(item[pro])}</td>`;
                }
            }
            body += `</tr>`;
        }

        talbeChart.innerHTML = '';

        talbeChart.innerHTML = `<table class="table table-bordered dataTable no-footer" id="dataTable2" cellspacing="0" style="width: 100%;overflow-y:auto" role="grid" aria-describedby="dataTable_info"> 
        <thead> ${header} 
        </thead> 
        <tbody>  ${body} 
        </tbody> 
        </table > `;
        $('#dataTable2').DataTable({
            pageLength: 5,
            order: [[0, 'desc']],
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
                    title: `Du_Lieu_Lich_Su`,
                },
                {
                    extend: 'csvHtml5',
                    title: `Du_Lieu_Lich_Su`,
                },
                {
                    extend: 'pdfHtml5',
                    title: `Du_Lieu_Lich_Su`,
                },
            ],
        });
    }
}

function viewTable() {
    if (talbeChart.classList.contains('d-none')) {
        talbeChart.classList.remove('d-none');
        chartDataLogger.classList.add('d-none');
    }
}

function viewOnChart() {
    if (chartDataLogger.classList.contains('d-none')) {
        talbeChart.classList.add('d-none');
        chartDataLogger.classList.remove('d-none');
    }
}

function resetState() {
    if (chartDataLogger.classList.contains('d-none')) {
        chartDataLogger.classList.remove('d-none');
    }

    if (!talbeChart.classList.contains('d-none')) {
        talbeChart.classList.add('d-none');
    }
}
