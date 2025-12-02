let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

const urlGetStatusSite = `${hostname}/GetStatusSite/${userName}`;

const vlogTableBody = document.getElementById('vlogTableBody');

let totalSites = 0;
let disconnectedSites = 0;
let dataPresent = 0;
let alarmSites = 0;
let sites = [];
let siteDelay = [];
let siteHasValue = [];
let siteAlarm = [];

function getStatusSite() {
    axios
        .get(urlGetStatusSite)
        .then((res) => {
            if (res?.data) {
                totalSite = res.data.totalSite;
                disconnectedSites = res.data.totalSiteDelay;
                dataPresent = res.data.totalSiteHasValue;
                alarmSites = res.data.totalSiteAlarm;

                siteDelay = res.data.siteDelay;
                siteHasValue = res.data.siteHasValue;
                siteAlarm = res.data.siteAlarm;
                sites = res.data.sites;

                $('#kpi-total').text(totalSites);
                $('#kpi-disconnected').text(disconnectedSites);
                $('#kpi-data-present').text(dataPresent);
                $('#kpi-alarm').text(alarmSites);

                renderVilogTable(res.data);

                drawTable();
            }
        })
        .catch((err) => {
            console.error(err);
        });
}

function findValueChannel(data, siteid) {
    const obj = {
        signal: null,
        flow: null,
        reverse: null,
        battery: null,
        net: null,
    };

    const find = data.find((s) => s.SiteId === siteid);
    if (find !== undefined) {
        const flowChannel = find.ListChannel.find(
            (c) => c.ForwardFlow === true,
        );
        const reverseChannel = find.ListChannel.find(
            (c) => c.ReverseFlow === true,
        );

        let batteryChannel = null;
        let signalChannel = null;
        let netChannel = null;

        if (find.TypeMeter === 'SU') {
            batteryChannel = find.ListChannel.find(
                (c) => c.ChannelId === `${find.LoggerId}_110`,
            );
            signalChannel = find.ListChannel.find(
                (c) => c.ChannelId === `${find.LoggerId}_109`,
            );
            netChannel = find.ListChannel.find(
                (c) => c.ChannelId === `${find.LoggerId}_108`,
            );
        } else if (find.TypeMeter === 'Kronhe') {
            batteryChannel = find.ListChannel.find(
                (c) => c.ChannelId === `${find.LoggerId}_06`,
            );
            signalChannel = find.ListChannel.find(
                (c) => c.ChannelId === `${find.LoggerId}_07`,
            );
            netChannel = find.ListChannel.find(
                (c) => c.ChannelId === `${find.LoggerId}_100`,
            );
        }

        if (flowChannel !== undefined && flowChannel !== null) {
            obj.flow = flowChannel.LastValue;
        }
        if (reverseChannel !== undefined && reverseChannel !== null) {
            obj.reverse = reverseChannel.LastValue;
        }
        if (batteryChannel !== undefined && batteryChannel !== null) {
            obj.battery = batteryChannel.LastValue;
        }
        if (signalChannel !== undefined && signalChannel !== null) {
            obj.signal = signalChannel.LastValue;
        }
        if (netChannel !== undefined && netChannel !== null) {
            obj.net = netChannel.LastValue;
        }
        return obj;
    }
}

function renderVilogTable(data) {
    let content = ``;

    let temp = [];

    for (const item of data.siteDelay) {
        const valueChannel = findValueChannel(data.sites, item.SiteId);

        temp.push(item.SiteId);
        content += ` <tr data-status="Disconnected" data-alarm="No" data-flow="${ConvertDataIntoTable(
            valueChannel.flow,
        )}">
                        <td>${item.SiteId}</td>
                        <td>${item.Location}</td>
                        <td>Disconnected</td>
                        <td data-signal="${ConvertDataIntoTable(
                            valueChannel.signal,
                        )}">${ConvertDataIntoTable(valueChannel.signal)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.flow)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.reverse)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.net)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.battery)}</td>
                        <td>Yes</td>
                    </tr>`;
    }

    for (const item of data.siteAlarm) {
        const valueChannel = findValueChannel(data.sites, item.SiteId);

        const find = temp.find((el) => el === item.SiteId);
        if (find === undefined) {
            temp.push(item.SiteId);
            content += ` <tr data-status="DataPresent" data-alarm="Yes" data-flow="${ConvertDataIntoTable(
                valueChannel.flow,
            )}">
                        <td>${item.SiteId}</td>
                        <td>${item.Location}</td>
                        <td>DataPresent</td>
                        <td data-signal="${ConvertDataIntoTable(
                            valueChannel.signal,
                        )}">${ConvertDataIntoTable(valueChannel.signal)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.flow)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.reverse)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.net)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.battery)}</td>
                        <td>Yes</td>
                    </tr>`;
        }
    }

    for (const item of siteHasValue) {
        const valueChannel = findValueChannel(data.sites, item.SiteId);

        const find = temp.find((el) => el === item.SiteId);
        if (find === undefined) {
            temp.push(item.SiteId);
            content += ` <tr data-status="DataPresent" data-alarm="No" data-flow="${ConvertDataIntoTable(
                valueChannel.flow,
            )}">
                        <td>${item.SiteId}</td>
                        <td>${item.Location}</td>
                        <td>DataPresent</td>
                        <td data-signal="${ConvertDataIntoTable(
                            valueChannel.signal,
                        )}">${ConvertDataIntoTable(valueChannel.signal)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.flow)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.reverse)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.net)}</td>
                        <td>${ConvertDataIntoTable(valueChannel.battery)}</td>
                        <td>No</td>
                    </tr>`;
        }
    }

    vlogTableBody.innerHTML = content;
}

function drawTable() {
    // GLOBAL FILTER STATE
    var currentStatusFilter = 'Total';

    // 1. Function to generate Signal Progress Bar
    function getSignalProgressBar(signalValue) {
        signalValue = parseInt(signalValue);
        var MAX_SIGNAL = 50;

        if (isNaN(signalValue) || signalValue <= 0) {
            return '<div class="signal-text">N/A</div>';
        }

        var percentage = Math.min(100, (signalValue / MAX_SIGNAL) * 100);

        var bgClass;
        if (percentage < 40) {
            bgClass = 'bg-danger';
        } else if (percentage < 60) {
            bgClass = 'bg-warning';
        } else {
            bgClass = 'bg-success';
        }

        return (
            '' +
            '<div class="d-flex align-items-center">' +
            '<div class="progress" style="width: 80px; height: 10px; margin-right: 10px;">' +
            '<div class="progress-bar ' +
            bgClass +
            '" role="progressbar" style="width: ' +
            percentage +
            '%;" aria-valuenow="' +
            signalValue +
            '" aria-valuemin="0" aria-valuemax="' +
            MAX_SIGNAL +
            '"></div>' +
            '</div>' +
            '<div class="signal-text">' +
            signalValue +
            ' dB</div>' +
            '</div>'
        );
    }

    $('#vlogTable tbody tr').each(function () {
        var $row = $(this);
        var status = $row.data('status');
        var flow = $row.data('flow');
        var signalCell = $row.find('td:eq(3)');
        var signalText = signalCell.attr('data-signal');
        var signal = parseInt(signalText);
        var alarm = $row.find('td:eq(8)').text();

        totalSites++;

        // Status Tagging (Cột 2)
        if (status === 'DataPresent') {
            $row.find('td:eq(2)').html(
                '<span class="status-tag tag-success">DataPresent</span>',
            );
            //dataPresent++;
        } else {
            $row.find('td:eq(2)').html(
                '<span class="status-tag tag-warning">Disconnected</span>',
            );
            //disconnectedSites++;
        }
        // Alarm Tagging (Cột 7)
        if (alarm === 'Yes') {
            $row.find('td:eq(8)').html(
                '<span class="status-tag tag-danger">ALARM</span>',
            );
            //alarmSites++;
        } else {
            $row.find('td:eq(8)').html(
                '<span class="status-tag tag-success">NORMAL</span>',
            );
        }

        // Insert signal progress bar
        signalCell.html(getSignalProgressBar(signal));
    });

    // 3. Custom DataTables filter
    $.fn.dataTable.ext.search.push(
        function (settings, searchData, index, rowData, counter) {
            var $row = $('#vlogTable').DataTable().row(index).node();
            var rowStatus = $($row).data('status');
            var rowFlow = $($row).data('flow');
            var rowAlarm = $($row).data('alarm');

            if (currentStatusFilter === 'Total') {
                return true;
            } else if (currentStatusFilter === 'DataPresent') {
                return rowStatus === 'DataPresent';
            } else if (currentStatusFilter === 'Disconnected') {
                return rowStatus === 'Disconnected';
            } else if (currentStatusFilter === 'Alarm') {
                return rowAlarm === 'Yes';
            }

            return false;
        },
    );

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // 4. Initialize DataTable
    var table = $('#vlogTable').DataTable({
        language: {
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: { previous: 'Previous', next: 'Next' },
        },
        dom: isMobile ? 'frtip' : 'lBrtip',
        pageLength: 50,
        buttons: isMobile
            ? []
            : [
                  {
                      extend: 'excel',
                      text: '<i class="fas fa-file-excel me-1"></i> Excel',
                      className: 'btn btn-sm buttons-excel',
                      filename: 'list_vilog',
                  },
                  {
                      extend: 'csv',
                      text: '<i class="fas fa-file-csv me-1"></i> CSV',
                      className: 'btn btn-sm buttons-csv',
                      filename: 'list_vilog',
                  },
                  {
                      extend: 'pdf',
                      text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                      className: 'btn btn-sm buttons-pdf',
                      filename: 'list_vilog',
                  },
              ],
        responsive: isMobile
            ? {
                  details: {
                      type: 'inline',
                      display: $.fn.dataTable.Responsive.display.childRow,
                  },
              }
            : false,
        columnDefs: [
            { responsivePriority: 1, targets: 0 },
            { responsivePriority: 2, targets: -1 },
            { orderable: true, targets: [0, 1, 4, 6] },
            { type: 'num', targets: 3 },
        ],
    });

    // 6. Filtering based on KPI Cards
    $('.card-kpi').on('click', function () {
        var filterType = $(this).data('filter');

        $('.card-kpi').removeClass('active-filter');
        $(this).addClass('active-filter');

        // update global filter and redraw table
        currentStatusFilter = filterType;

        // clear global search and column searches then redraw (applies custom filter)
        table.search('').columns().search('').draw();
    });

    // Highlight Total card by default
    $('#kpi-total').closest('.card-kpi').addClass('active-filter');

    // Optional: Update KPI counts to reflect visible rows after filter applied
    // This recalculates counts on every draw and updates KPI numbers accordingly.
    table.on('draw', function () {
        var rows = table.rows({ filter: 'applied' }).nodes();
        var vTotal = rows.length;
        var vDisconnected = 0;
        var vDataPresent = 0;
        var vAlarm = 0;

        $(rows).each(function () {
            var $r = $(this);
            var st = $r.data('status');
            var fl = $r.data('flow');
            var al = $r.data('alarm');

            if (st === 'DataPresent') vDataPresent++;
            else if (st === 'Disconnected') vDisconnected++;
            if (al === 'Yes') vAlarm++;
        });

        // // If the current filter is Total we prefer to show the original totals,
        // // but if a filter is applied show the filtered KPI values.
        if (currentStatusFilter === 'Total') {
            $('#kpi-total').text(totalSites);
            $('#kpi-disconnected').text(disconnectedSites);
            $('#kpi-data-present').text(dataPresent);
            $('#kpi-alarm').text(alarmSites);
        }
        // else {
        //     $('#kpi-total').text(vTotal);
        //     $('#kpi-disconnected').text(vDisconnected);
        //     $('#kpi-data-present').text(vDataPresent);
        //     $('#kpi-alarm').text(vAlarm);
        // }
    });

    // Trigger initial draw to allow KPIs to reflect initial filter (Total)
    table.draw();
}

$(document).ready(function () {
    // 2. Initial Data Processing & KPI Calculation

    getStatusSite();
});
