let urlGetHistoryAlarm = `${hostname}/gethistoryalarmdata`;

let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

// DataTables instance — initialized exactly once, then reused via
// table.clear()/rows.add()/draw() on every subsequent data refresh so the
// Excel/CSV/PDF export buttons (which read from the DataTables cache, not
// the live DOM) never go stale after a "View" click.
let alarmDataTable = null;

function getAlarmTag(content) {
    let tagClass = 'tag-secondary';
    const lower = content.toLowerCase();

    if (lower.includes('disconnect') || lower.includes('delay'))
        tagClass = 'tag-warning';
    else tagClass = 'tag-danger';
    return `<span class="alarm-tag ${tagClass}">${content.toUpperCase()}</span>`;
}

function normalizeAlarmContent(content) {
    const lower = content.toLowerCase();

    if (lower.includes('waring')) {
        return content.replace('waring', 'warning');
    } else if (lower.includes('comunication')) {
        return content.replace('Comunication', 'Communication');
    } else if (lower.includes('lower')) {
        return content.replace('Lower', 'Low');
    }

    return content;
}

// Builds the row data DataTables needs (object-per-row keyed by column
// index) instead of one giant concatenated HTML string. DT_RowAttr keeps
// the `data-alarm-type` attribute on the rendered <tr>.
function buildRowsData(data) {
    const rows = [];

    for (const item of data) {
        const content = normalizeAlarmContent(String(item.Content ?? ''));

        rows.push({
            0: `${item.SiteId}`,
            1: `${item.Location}`,
            2: `${item.ChannelName}`,
            3: `${convertDateToString(
                convertDateFromApi(item.TimeStampHasValue),
            )}`,
            4: `${convertDateToString(
                convertDateFromApi(item.TimeStampAlarm),
            )}`,
            5: getAlarmTag(content),
            DT_RowAttr: { 'data-alarm-type': content },
        });
    }

    return rows;
}

// Export libs are heavy (pdfmake + fonts ~2.1MB, jszip ~95KB), so they are
// loaded on first export click instead of on page load. Promise is cached;
// dropped on error so the next click retries.
const exportScriptPromises = {};

function loadScript(src) {
    if (!exportScriptPromises[src]) {
        exportScriptPromises[src] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => {
                delete exportScriptPromises[src];
                reject(new Error(`Failed to load ${src}`));
            };
            document.head.appendChild(script);
        });
    }
    return exportScriptPromises[src];
}

function loadExportLibs(type) {
    if (type === 'excelHtml5') {
        if (window.JSZip) return Promise.resolve();
        return loadScript('/vendor/jszip/jszip.min.js');
    }
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
    // vfs_fonts registers itself on window.pdfMake, so pdfmake must load first
    return loadScript('/vendor/pdfmake/pdfmake.min.js').then(() =>
        loadScript('/vendor/pdfmake/vfs_fonts.js'),
    );
}

// Buttons drops excel/pdf buttons whose lib is missing at init, so force
// `available` and load the lib inside the action before running the stock one.
function lazyExportButton(type, options) {
    return Object.assign({}, options, {
        extend: type,
        available: () => true,
        action: function (e, dt, node, config, cb) {
            loadExportLibs(type)
                .then(() => {
                    $.fn.dataTable.ext.buttons[type].action.call(
                        this,
                        e,
                        dt,
                        node,
                        config,
                        cb,
                    );
                })
                .catch((err) => {
                    console.error(err);
                    cb();
                });
        },
    });
}

function getDataTableOptions() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    return {
        language: {
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: { previous: 'Previous', next: 'Next' },
        },
        dom: isMobile ? 'frtip' : 'lBrtip',
        pageLength: 50,
        // Only build <tr> nodes for the visible page; exports read the data cache.
        deferRender: true,
        order: [[4, 'desc']],
        buttons: isMobile
            ? []
            : [
                  lazyExportButton('excelHtml5', {
                      text: '<i class="fas fa-file-excel me-1"></i> Excel',
                      className: 'btn btn-sm buttons-excel',
                      filename: 'list_alarm',
                  }),
                  {
                      extend: 'csv',
                      text: '<i class="fas fa-file-csv me-1"></i> CSV',
                      className: 'btn btn-sm buttons-csv',
                      filename: 'list_alarm',
                  },
                  lazyExportButton('pdfHtml5', {
                      text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                      className: 'btn btn-sm buttons-pdf',
                      filename: 'list_alarm',
                  }),
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
            {
                targets: 5,
                render: function (data, type) {
                    if (type === 'filter' || type === 'sort') {
                        return $(data).text();
                    }
                    return data;
                },
            },
        ],
        data: [],
    };
}

// Initializes DataTables exactly once (guarded), then on every call simply
// swaps the data through the DataTables API so its internal cache (used by
// sorting/search/paging and the export buttons) never desyncs from the DOM.
function drawTable(rowsData) {
    if (!alarmDataTable) {
        alarmDataTable = $('#alarmTable').DataTable(getDataTableOptions());
    }

    alarmDataTable.clear();
    alarmDataTable.rows.add(rowsData);
    alarmDataTable.draw();
}

function getDataHistoryAlarm(start, end) {
    let url = `${urlGetHistoryAlarm}/${start}/${end}/${userName}`;

    axios
        .get(url)
        .then((res) => {
            const rowsData = buildRowsData(res.data);
            drawTable(rowsData);
        })
        .catch((err) => console.log(err.message));
}

// === View Button Logic ===
$('#viewButton').on('click', function () {
    const startTime = $('#startHour').val();
    const endTime = $('#endHour').val();

    if (!startTime || !endTime) {
        alert('Please enter start time and end time!!!');
        return;
    }

    getDataHistoryAlarm(
        new Date(startTime).getTime(),
        new Date(endTime).getTime(),
    );
});

$(document).ready(function () {
    // === Default DateTime Initialization ===
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    $('#endHour').val(end);

    const sevenDaysAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000 * 7);
    const start = `${sevenDaysAgo.getFullYear()}-${pad(
        sevenDaysAgo.getMonth() + 1,
    )}-${pad(sevenDaysAgo.getDate())}T${pad(sevenDaysAgo.getHours())}:${pad(
        sevenDaysAgo.getMinutes(),
    )}`;
    $('#startHour').val(start);

    getDataHistoryAlarm(sevenDaysAgo.getTime(), now.getTime());
});
