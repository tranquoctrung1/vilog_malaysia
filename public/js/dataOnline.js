let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetChannelBySiteId = `${hostname}/GetChannelBySiteId`;
let urlGetChannelCard = `${hostname}/GetChannelCard`;
let urlGetCurrentTimeStampBySiteId = `${hostname}/GetCurrentTimeStampBySiteId`;
let urlGetDataMultipleChannel = `${hostname}/GetMultipleChannelData`;
let urlGetDataMultipleChannelToCreateTable = `${hostname}/GetDataMultipleChannelToCreateTable`;

let loading = document.getElementById('loading');

let listChannel = [];
let channels = [];
let startDateTime;
let endDateTime;

let chart;
let plotlyTraces = [];

// add hide
loading.classList.add('hide');

function fetchSites() {
    axios
        .get(urlGetSites)
        .then((res) => {
            if (res.data.length > 0) {
                createOptionsInSelectBox(res.data, 'selectSite');

                // first load data
                selectSite.selectedIndex = 1;
                loading.classList.remove('hide');
                loading.classList.add('show');

                LoadListChannel(selectSite.value);
                LoadCurrentTimeStampBySiteId(selectSite.value);
            }
        })
        .catch((err) => console.log(err));
}

fetchSites();

function CardsLoad(siteID, start, end) {
    var url = `${urlGetChannelCard}/${siteID}/${start}/${end}`;
    var html = '';
    axios
        .get(url)
        .then(function (res) {
            loading.classList.remove('show');
            loading.classList.add('hide');

            for (let c of res.data) {
                if (CheckIsDisplay(c.ChannelId) > -1) {
                    html +=
                        '<div class="col-xl-3 col-md-4 mb-4" id="card-' +
                        c.ChannelId +
                        '">' +
                        '<div class="card border-left-primary shadow h-100" style="border-left: 5px solid #74b9ff">' +
                        '<div class="card-body">' +
                        '<div class="row no-gutters align-items-center">' +
                        '<div class="col-7 mr-2">' +
                        '<div class="h5 font-weight-bold text-primary mb-1">' +
                        c.ChannelName +
                        ' (' +
                        c.Unit +
                        ')</div>' +
                        '<div class="h6 font-weight-bold text-success mb-1">' +
                        c.LastValue +
                        '</div>' +
                        '<div class="text-xs"> Updated: ' +
                        convertDateToString(convertDateFromApi(c.TimeStamp)) +
                        '</div>' +
                        '</div>' +
                        '<div class="col-4">' +
                        '<div class="row">' +
                        '<div class="col-12 text-xs text-primary text-center " style="font-weight: bold">MAX</div>' +
                        '<div class="col-12 text-center"  style="font-weight: bold">' +
                        c.MaxValue +
                        '</div>' +
                        '<div class="col-12 text-xs text-primary text-center"  style="font-weight: bold">MIN</div>' +
                        '<div class="col-12 text-center"  style="font-weight: bold">' +
                        c.MinValue +
                        '</div>' +
                        '</div></div>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                } else {
                    html +=
                        '<div class="col-xl-3 col-md-4 mb-4 d-none" id="card-' +
                        c.ChannelId +
                        '">' +
                        '<div class="card border-left-primary shadow h-100" style="border-left: 5px solid #74b9ff">' +
                        '<div class="card-body">' +
                        '<div class="row no-gutters align-items-center">' +
                        '<div class="col-7 mr-2">' +
                        '<div class="h5 font-weight-bold text-primary mb-1">' +
                        c.ChannelName +
                        ' (' +
                        c.Unit +
                        ')</div>' +
                        '<div class="h6 font-weight-bold text-success mb-1">' +
                        c.LastValue +
                        '</div>' +
                        '<div class="text-xs"> Updated: ' +
                        convertDateToString(convertDateFromApi(c.TimeStamp)) +
                        '</div>' +
                        '</div>' +
                        '<div class="col-4">' +
                        '<div class="row">' +
                        '<div class="col-12 text-xs text-primary text-center " style="font-weight: bold">MAX</div>' +
                        '<div class="col-12 text-center"  style="font-weight: bold">' +
                        c.MaxValue +
                        '</div>' +
                        '<div class="col-12 text-xs text-primary text-center"  style="font-weight: bold">MIN</div>' +
                        '<div class="col-12 text-center"  style="font-weight: bold">' +
                        c.MinValue +
                        '</div>' +
                        '</div></div>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                }
            }
            document.getElementById('channel_cards').innerHTML = html;
        })
        .catch((err) => console.log(err));
}
////Cards
function CheckIsDisplay(channelid) {
    return listChannel.indexOf(channelid);
}

function LoadListChannel(siteid) {
    listChannel = [];

    let url = `${urlGetChannelBySiteId}/${siteid}`;
    let bodyModal = document.getElementById('bodyModal');
    bodyModal.innerHTML = '';
    axios
        .get(url)
        .then(function (res) {
            let content = '';
            for (let item of res.data) {
                content += `<div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${item.ChannelId}" id="${item.ChannelId}" data-channel="${item.ChannelId}" checked>
                        <label class="form-check-label" for="${item.ChannelId}">
                        ${item.ChannelName}
                        </label>
                </div>`;
                listChannel.push(item.ChannelId);
            }
            bodyModal.innerHTML = content;
            AllowChangeCheckBox();
        })
        .catch((err) => console.log(err));
}

function AllowChangeCheckBox() {
    let checkBoxs = document.getElementsByClassName('form-check-input');
    for (let checkbox of checkBoxs) {
        checkbox.addEventListener('change', function (e) {
            if (checkbox.checked == true) {
                let cardElement = document.getElementById(
                    `card-${checkbox.dataset.channel}`,
                );
                listChannel.push(checkbox.dataset.channel);
                if (cardElement.classList.contains('d-none')) {
                    cardElement.classList.remove('d-none');
                }

                // Show Plotly series
                showPlotlySeries(checkbox.dataset.channel);
            } else {
                let cardElement = document.getElementById(
                    `card-${checkbox.dataset.channel}`,
                );
                if (!cardElement.classList.contains('d-none')) {
                    cardElement.classList.add('d-none');
                }

                // Hide Plotly series
                hidePlotlySeries(checkbox.dataset.channel);

                let indexOfElement = listChannel.indexOf(
                    checkbox.dataset.channel,
                );
                if (indexOfElement > -1) {
                    listChannel.splice(indexOfElement, 1);
                }
            }
        });
    }
}

// Helper functions for Plotly series visibility
function showPlotlySeries(channelId) {
    const chartElement = document.getElementById('chart');
    if (!chartElement || plotlyTraces.length === 0) return;

    const indices = [];
    const visibility = [];

    // Find traces for this channel
    plotlyTraces.forEach((traceInfo) => {
        if (traceInfo.channelId === channelId) {
            indices.push(traceInfo.traceIndex);
            visibility.push(true);
        }
    });

    if (indices.length > 0) {
        Plotly.restyle(chartElement, { visible: visibility }, indices);
    }
}

function hidePlotlySeries(channelId) {
    const chartElement = document.getElementById('chart');
    if (!chartElement || plotlyTraces.length === 0) return;

    const indices = [];
    const visibility = [];

    // Find traces for this channel
    plotlyTraces.forEach((traceInfo) => {
        if (traceInfo.channelId === channelId) {
            indices.push(traceInfo.traceIndex);
            visibility.push('legendonly');
        }
    });

    if (indices.length > 0) {
        Plotly.restyle(chartElement, { visible: visibility }, indices);
    }
}

let selectSite = document.getElementById('selectSite');

selectSite.addEventListener('change', function (e) {
    loading.classList.remove('hide');
    loading.classList.add('show');

    LoadListChannel(e.target.value);
    LoadCurrentTimeStampBySiteId(e.target.value);
});

let filterChannel = document.getElementById('filterChannel');

filterChannel.addEventListener('click', function () {
    $('#Model').modal('show');
});

function LoadCurrentTimeStampBySiteId(siteId) {
    let startDate = document.getElementById('startDate');
    let endDate = document.getElementById('endDate');

    let url = `${urlGetCurrentTimeStampBySiteId}/${siteId}`;

    axios
        .get(url)
        .then((res) => {
            if (CheckExistsData(res.data)) {
                let end = convertDateFromApi(res.data[0].TimeStamp);
                let t = convertDateFromApi(res.data[0].TimeStamp);

                t.setDate(t.getDate() - 1);
                end.setDate(end.getDate() + 1);

                startDate.value = convertDateToDateInputTag(t);
                endDate.value = convertDateToDateInputTag(end);

                let totalMilisecondStart = t.getTime();
                let totalMilisecondEnd = end.getTime();

                startDateTime = totalMilisecondStart;
                endDateTime = totalMilisecondEnd;

                CardsLoad(siteId, totalMilisecondStart, totalMilisecondEnd);
                GetDataMultipleChannel();
                CreateDataTable();
            }
        })
        .catch((err) => console.log(err));
}

function GetDataMultipleChannel() {
    let mutipleChannels = listChannel.join('|');

    let url = `${urlGetDataMultipleChannel}/${mutipleChannels}/${startDateTime}/${endDateTime}`;

    axios
        .get(url)
        .then((res) => {
            if (CheckExistsData(res.data)) {
                drawChartMultiple(res.data);
            }
        })
        .catch((err) => console.log(err));
}

function drawChartMultiple(data) {
    // Remove existing chart if any
    const chartElement = document.getElementById('chart');
    chartElement.innerHTML = '';

    if (data.length <= 1) {
        chartElement.innerHTML =
            '<div class="chart-placeholder"><i class="fas fa-chart-area me-2"></i>Not enough data to display chart</div>';
        return;
    }

    // Reset plotly traces
    plotlyTraces = [];

    // Prepare data for Plotly
    const plotlyData = [];
    const layout = {
        xaxis: {
            title: 'Time',
            gridcolor: '#f0f0f0',
            showgrid: true,
            tickformat: '%Y-%m-%d %H:%M:%S',
        },
        yaxis: {
            title: 'Value',
            gridcolor: '#f0f0f0',
            showgrid: true,
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        hovermode: 'closest',
        legend: {
            orientation: 'h',
            y: -0.2,
            x: 0.1,
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#e9ecef',
            borderwidth: 1,
        },
        margin: { l: 60, r: 40, t: 60, b: 80 },
        font: { family: 'Arial, sans-serif' },
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        modeBarButtonsToAdd: ['hoverClosestGl2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: 'vilog_data_chart',
            height: 500,
            width: 1000,
            scale: 2,
        },
    };

    // Color palette for lines
    const colors = [
        '#0d6efd',
        '#dc3545',
        '#198754',
        '#ffc107',
        '#6f42c1',
        '#fd7e14',
        '#20c997',
        '#e83e8c',
    ];

    // Create traces for each channel
    data.forEach((channelData, index) => {
        if (channelData.length > 1) {
            const channelInfo = channelData[channelData.length - 1];
            const x = [];
            const y = [];
            const text = [];

            // Process data points
            for (let i = 0; i < channelData.length - 1; i++) {
                if (channelData[i]) {
                    const timestamp = convertDateFromApi(
                        channelData[i].TimeStamp,
                    );
                    x.push(timestamp);
                    y.push(channelData[i].Value);
                    text.push(`Channel: ${channelInfo.channelname}`);
                }
            }

            // Create trace
            const trace = {
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: channelInfo.channelname,
                line: {
                    color: colors[index % colors.length],
                    width: 2,
                },
                hovertemplate:
                    '<b>%{text}</b><br>' +
                    'Time: %{x}<br>' +
                    'Value: %{y}<extra></extra>',
                text: text,
                text: text,
                connectgaps: false,
                visible: true,
            };

            plotlyData.push(trace);

            // Store trace information globally
            plotlyTraces.push({
                channelId: channelInfo.channelid,
                traceIndex: plotlyData.length - 1,
            });
        }
    });

    // Create the chart
    if (plotlyData.length > 0) {
        Plotly.newPlot('chart', plotlyData, layout, config)
            .then(function () {
                // Add resize handler
                window.addEventListener('resize', function () {
                    Plotly.Plots.resize('chart');
                });
            })
            .catch(function (err) {
                chartElement.innerHTML =
                    '<div class="chart-placeholder"><i class="fas fa-exclamation-triangle me-2"></i>Error loading chart</div>';
            });
    } else {
        chartElement.innerHTML =
            '<div class="chart-placeholder"><i class="fas fa-chart-area me-2"></i>No valid data to display</div>';
    }
}

function CreateDataTable() {
    let mutipleChannels = listChannel.join('|');

    let url = `${urlGetDataMultipleChannelToCreateTable}/${mutipleChannels}/${startDateTime}/${endDateTime}`;

    axios
        .get(url)
        .then((res) => {
            let dataTable = document.getElementById('dataTable');
            dataTable.innerHTML = '';

            if (CheckExistsData(res.data)) {
                let header = '';
                let body = '';

                let dataConvert = convertData(res.data);

                if (dataConvert.length > 0) {
                    // Create header from first object properties
                    let firstRow = dataConvert[0];
                    let properties = Object.getOwnPropertyNames(firstRow);

                    // Create header row
                    properties.forEach((prop) => {
                        if (prop === 'TimeStamp') {
                            header += `<th>TimeStamp</th>`;
                        } else {
                            header += `<th>${prop}</th>`;
                        }
                    });

                    // Create body rows
                    dataConvert.forEach((row, index) => {
                        body += `<tr>`;
                        properties.forEach((prop) => {
                            let cellValue = '';
                            if (prop in row) {
                                if (prop === 'TimeStamp') {
                                    cellValue = convertDateToString(row[prop]);
                                } else {
                                    cellValue =
                                        row[prop] !== null &&
                                        row[prop] !== undefined
                                            ? row[prop]
                                            : '';
                                }
                            } else {
                                cellValue = ''; // Handle missing properties
                            }
                            body += `<td>${cellValue}</td>`;
                        });
                        body += `</tr>`;
                    });

                    // Create footer (same as header)
                    let footer = header;

                    dataTable.innerHTML = `
                        <table class="table table-bordered dataTable no-footer" id="dataTable2" cellspacing="0" style="width: 100%;" role="grid" aria-describedby="dataTable_info">
                            <thead>
                                <tr>${header}</tr>
                            </thead>
                            <tbody>${body}</tbody>

                        </table>
                    `;

                    // Initialize DataTable with proper configuration
                    $('#dataTable2').DataTable({
                        pageLength: 20,
                        order: [[0, 'desc']],
                        dom: 'Bfrtip',
                        buttons: [
                            {
                                extend: 'excel',
                                text: '<i class="fas fa-file-excel me-1"></i> Excel',
                                className: 'btn btn-sm buttons-excel',
                                filename: `Data_Detail_From_${convertDateToString(
                                    new Date(startDateTime),
                                )}_To_${convertDateToString(
                                    new Date(endDateTime),
                                )}`,
                            },
                            {
                                extend: 'csv',
                                text: '<i class="fas fa-file-csv me-1"></i> CSV',
                                className: 'btn btn-sm buttons-csv',
                                filename: `Data_Detail_From_${convertDateToString(
                                    new Date(startDateTime),
                                )}_To_${convertDateToString(
                                    new Date(endDateTime),
                                )}`,
                            },
                            {
                                extend: 'pdf',
                                text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                                className: 'btn btn-sm buttons-pdf',
                                filename: `Data_Detail_From_${convertDateToString(
                                    new Date(startDateTime),
                                )}_To_${convertDateToString(
                                    new Date(endDateTime),
                                )}`,
                            },
                        ],
                        language: {
                            search: 'Search:',
                            lengthMenu: 'Show _MENU_ entries',
                            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                            paginate: {
                                previous: 'Previous',
                                next: 'Next',
                            },
                        },
                        // columnDefs: [
                        //     {
                        //         targets: 0, // Timestamp column
                        //         type: 'date',
                        //         render: function (data) {
                        //             return data
                        //                 ? convertDateToString(new Date(data))
                        //                 : '';
                        //         },
                        //     },
                        // ],
                        initComplete: function () {
                            // Add column-specific filtering if needed
                            this.api()
                                .columns()
                                .every(function () {
                                    var column = this;
                                    // Only add filter for timestamp column (index 0)
                                    if (column.index() === 0) {
                                        var select = $(
                                            '<select><option value=""></option></select>',
                                        )
                                            .appendTo(
                                                $(column.footer()).empty(),
                                            )
                                            .on('change', function () {
                                                var val =
                                                    $.fn.dataTable.util.escapeRegex(
                                                        $(this).val(),
                                                    );
                                                column
                                                    .search(
                                                        val
                                                            ? '^' + val + '$'
                                                            : '',
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
                                                if (d) {
                                                    var dateStr =
                                                        convertDateToString(
                                                            new Date(d),
                                                        );
                                                    select.append(
                                                        '<option value="' +
                                                            dateStr +
                                                            '">' +
                                                            dateStr +
                                                            '</option>',
                                                    );
                                                }
                                            });
                                    }
                                });
                        },
                    });
                } else {
                    dataTable.innerHTML =
                        '<div class="alert alert-info">No data available for the selected criteria.</div>';
                }
            } else {
                dataTable.innerHTML =
                    '<div class="alert alert-info">No data available for the selected criteria.</div>';
            }
        })
        .catch((err) => {
            let dataTable = document.getElementById('dataTable');
            dataTable.innerHTML =
                '<div class="alert alert-danger">Error loading data. Please try again.</div>';
        });
}

function convertData(data) {
    const timeMap = {};
    channels = [];

    // 1. Lấy danh sách channel
    data.forEach((arr) => {
        if (arr && arr[0]) {
            channels.push(arr[0].ChannelName);
        }
    });

    // 2. Gom toàn bộ TimeStamp
    data.forEach((channelArr) => {
        channelArr.forEach((item) => {
            const ts = convertDateFromApi(item.TimeStamp);

            if (!timeMap[ts]) {
                timeMap[ts] = { TimeStamp: ts };
            }

            timeMap[ts][item.ChannelName] = item.Value;
        });
    });

    // 3. Fill null cho các channel thiếu
    Object.values(timeMap).forEach((row) => {
        channels.forEach((ch) => {
            if (!(ch in row)) {
                row[ch] = null;
            }
        });
    });

    // 4. Sort theo TimeStamp
    return Object.values(timeMap).sort(
        (a, b) => new Date(a.TimeStamp) - new Date(b.TimeStamp),
    );
}

let viewDataOnline = document.getElementById('viewDataOnline');

viewDataOnline.addEventListener('click', function (e) {
    let startDate = document.getElementById('startDate');
    let endDate = document.getElementById('endDate');
    let siteid = document.getElementById('selectSite').value;

    if (siteid == null || siteid == undefined || siteid.trim() == '') {
        swal('Error', 'Site empty', 'error');
    } else if (
        startDate.value == '' ||
        startDate.value == null ||
        startDate.value == undefined
    ) {
        swal('Error', 'Enter Start Date', 'error');
    } else if (
        endDate.value == '' ||
        endDate.value == null ||
        endDate.value == undefined
    ) {
        swal('Error', 'Enter End Date', 'error');
    } else {
        let start = new Date(startDate.value);
        let end = new Date(endDate.value);

        // start.setHours(start.getHours() + 7);
        // end.setHours(end.getHours() + 7);

        let totalMilisecondStart = start.getTime();
        let totalMilisecondEnd = end.getTime();

        startDateTime = totalMilisecondStart;
        endDateTime = totalMilisecondEnd;

        CardsLoad(siteid, totalMilisecondStart, totalMilisecondEnd);
        GetDataMultipleChannel();
        CreateDataTable();
    }
});

// setInterval(function () {
//   let siteid = document.getElementById("selectSite").value;

//   startDateTime += 300000;
//   endDateTime += 300000;

//   CardsLoad(siteid, startDateTime, endDateTime);
//   GetDataMultipleChannel();
//   CreateDataTable();
// }, 300000);
