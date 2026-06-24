let siteListTable;
let tableData = [];

let username = document.getElementById('userName').innerHTML;
if (username == null || username == undefined || username.trim() == '') {
    username = 'admin';
}

let urlGetSite = `${hostname}/GetSiteByUId/${username}`;
let urlGetLoggingTime = `${hostname}/GetLoggingTimeVilog`;

// ======================
// TABLE FUNCTIONS
// ======================
function convertTimeDelayToString(timeDelay) {
    if (timeDelay === undefined || timeDelay === null) return '15m';
    if (timeDelay >= 720) return '12h';
    if (timeDelay >= 360) return '6h';
    if (timeDelay >= 180) return '3h';
    if (timeDelay >= 120) return '2h';
    if (timeDelay >= 60) return '1h';
    if (timeDelay >= 30) return '30m';
    return '15m';
}

function convertLogTimeToString(minutes) {
    if (!minutes || minutes === 0) return '15m';
    if (minutes === 360) return '6h';
    return minutes + 'm';
}

async function fetchAllSitesForTable() {
    try {
        const res = await axios.get(urlGetSite);
        if (res.status === 200) {
            const sites = res.data;

            const promises = sites.map(async (site) => {
                let logTimeMinutes = 15;
                try {
                    const logRes = await axios.get(`${urlGetLoggingTime}/${site.SiteId}`);
                    if (logRes.status === 200) {
                        logTimeMinutes = logRes.data || 15;
                    }
                } catch (e) {
                    console.log('Error getting log time for', site.SiteId);
                }

                return {
                    No: 0,
                    siteId: site.SiteId || '',
                    location: site.Location || '',
                    typeMeter: site.TypeMeter || '',
                    loggerId: site.LoggerId || '',
                    sendTime: convertTimeDelayToString(site.TimeDelay),
                    logTime: convertLogTimeToString(logTimeMinutes),
                    latitude: site.Latitude || '',
                    longitude: site.Longitude || '',
                    status: site.Status || '',
                    _rawData: site
                };
            });

            tableData = await Promise.all(promises);

            tableData.forEach((item, index) => {
                item.No = index + 1;
            });

            loadTableData(tableData);
        }
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

function loadTableData(data) {
    if (siteListTable) {
        siteListTable.destroy();
    }

    siteListTable = $('#siteListTable').DataTable({
        data: data,
        columns: [
            { data: 'No' },
            { data: 'siteId', className: 'fw-bold' },
            { data: 'location' },
            { data: 'typeMeter',
                render: function (data) {
                    const raw = data == null ? '' : data.toString().trim();
                    const isEmpty =
                        raw === '' ||
                        raw.toLowerCase() === 'null' ||
                        raw.toLowerCase() === 'undefined' ||
                        raw === '-';
                    const displayText = isEmpty ? 'Level' : data;
                    const badgeClass = isEmpty ? 'tag-secondary' :
                        data === 'SU' ? 'tag-info' :
                            data === 'Kronhe' ? 'tag-success' :
                                'tag-secondary';
                    return `<span class="alarm-tag ${badgeClass}">${displayText}</span>`;
                }
            },
            { data: 'loggerId' },
            {
                data: 'sendTime',
                render: function (data) {
                    return data ? `<span class="alarm-tag tag-info">${data}</span>` : '-';
                }
            },
            {
                data: 'logTime',
                render: function (data) {
                    return data ? `<span class="alarm-tag tag-warning">${data}</span>` : '-';
                }
            },
            { data: 'latitude' },
            { data: 'longitude' }
        ],
        dom: '<"d-flex justify-content-between align-items-center mb-3"lf><"d-flex justify-content-start"B>rtip',
        buttons: [
            { extend: 'excel', className: 'btn btn-sm', text: '<i class="fas fa-file-excel me-1"></i> Excel', filename: 'list_vilog' },
            { extend: 'csv', className: 'btn btn-sm', text: '<i class="fas fa-file-csv me-1"></i> CSV', filename: 'list_vilog' },
            { extend: 'pdf', className: 'btn btn-sm', text: '<i class="fas fa-file-pdf me-1"></i> PDF', filename: 'list_vilog' }
        ],
        responsive: true,
        pageLength: 13,
        lengthMenu: [[13, 25, 50, 100, -1], [13, 25, 50, 100, "All"]],
        order: [[1, 'asc']],
        language: {
            search: "Search:",
            lengthMenu: "Show _MENU_ entries",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            paginate: {
                first: "First",
                last: "Last",
                next: "Next",
                previous: "Previous"
            }
        }
    });
}

// ======================
// INITIALIZE
// ======================
document.addEventListener('DOMContentLoaded', function () {
    fetchAllSitesForTable();
});
