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
            { data: 'No', className: 'text-center' },
            { data: 'siteId', className: 'text-center fw-bold' },
            { data: 'location', className: 'text-center' },
            {
                data: 'typeMeter',
                className: 'text-center',
                render: function(data) {
                    if (!data) return '-';
                    const badgeClass = data === 'SU' ? 'bg-primary' :
                                       data === 'Kronhe' ? 'bg-success' : 'bg-secondary';
                    return `<span class="badge ${badgeClass}">${data}</span>`;
                }
            },
            { data: 'loggerId', className: 'text-center' },
            {
                data: 'sendTime',
                className: 'text-center',
                render: function(data) {
                    return data ? `<span class="badge bg-info">${data}</span>` : '-';
                }
            },
            {
                data: 'logTime',
                className: 'text-center',
                render: function(data) {
                    return data ? `<span class="badge bg-warning text-dark">${data}</span>` : '-';
                }
            },
            {
                data: 'latitude',
                className: 'text-center',
                render: function(data) {
                    return data || '-';
                }
            },
            {
                data: 'longitude',
                className: 'text-center',
                render: function(data) {
                    return data || '-';
                }
            },
            {
                data: 'status',
                className: 'text-center',
                render: function(data) {
                    if (!data) return '-';
                    const badgeClass = data === 'Active' ? 'bg-success' : 'bg-secondary';
                    return `<span class="badge ${badgeClass}">${data}</span>`;
                }
            }
        ],
        dom: 'Bfrtip',
        buttons: [
            { extend: 'csv', className: 'btn btn-success', text: '<i class="fas fa-file-csv me-1"></i> CSV' },
            { extend: 'excel', className: 'btn btn-success', text: '<i class="fas fa-file-excel me-1"></i> Excel' },
            { extend: 'pdf', className: 'btn btn-danger', text: '<i class="fas fa-file-pdf me-1"></i> PDF' }
        ],
        responsive: true,
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
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
        },
        initComplete: function() {
            forceHeaderStyle();
        },
        drawCallback: function() {
            forceHeaderStyle();
        }
    });

    function forceHeaderStyle() {
        const headers = document.querySelectorAll('#siteListTable thead th');
        headers.forEach(th => {
            th.style.backgroundColor = '#2c3e50';
            th.style.color = 'white';
            th.style.fontWeight = '600';
            th.style.textAlign = 'center';
            th.style.verticalAlign = 'middle';
            th.style.borderColor = '#1a252f';
        });
    }
}

// ======================
// INITIALIZE
// ======================
document.addEventListener('DOMContentLoaded', function() {
    fetchAllSitesForTable();
});
