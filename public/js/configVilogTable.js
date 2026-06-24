let urlGetSite = `${hostname}/GetSiteByUId/`;
let urlGetLoggingTime = `${hostname}/GetLoggingTimeVilog`;

let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

let fullUrlGetSite = `${urlGetSite}${userName}`;

let tableData = [];

// ======================
// CONVERT FUNCTIONS
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

// ======================
// FETCH DATA
// ======================
async function fetchAllSitesForTable() {
    try {
        const res = await axios.get(fullUrlGetSite);
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

            drawTable(tableData);
        }
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// ======================
// RENDER TABLE
// ======================
function drawTable(data) {
    // === Render HTML content ===
    let content = '';
    for (const item of data) {
        const typeMeterBadge = getTypeMeterBadge(item.typeMeter);
        const sendTimeBadge = item.sendTime ? `<span class="alarm-tag tag-info">${item.sendTime}</span>` : '-';
        const logTimeBadge = item.logTime ? `<span class="alarm-tag tag-warning">${item.logTime}</span>` : '-';

        content += `<tr>
            <td>${item.No}</td>
            <td class="fw-bold">${item.siteId}</td>
            <td>${item.location}</td>
            <td>${typeMeterBadge}</td>
            <td>${item.loggerId}</td>
            <td>${sendTimeBadge}</td>
            <td>${logTimeBadge}</td>
            <td>${item.latitude}</td>
            <td>${item.longitude}</td>
        </tr>`;
    }

    $('#siteListTableBody').html(content);

    // === Check for mobile ===
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // === Initialize DataTable ===
    $('#siteListTable').DataTable({
        retrieve: true,
        language: {
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: {
                first: 'First',
                last: 'Last',
                next: 'Next',
                previous: 'Previous'
            }
        },
        dom: isMobile ? 'frtip' : '<"d-flex justify-content-between align-items-center mb-3"<"d-flex align-items-center gap-2"B l>f>rtip>',
        pageLength: 13,
        lengthMenu: [[13, 25, 50, 100, -1], [13, 25, 50, 100, 'All']],
        order: [[1, 'asc']],
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
            { targets: 0, width: '30px' }, 
            { targets: 1, width: '50px' }, 
            { targets: 2, width: '120px' }, 
            { targets: 3, width: '120px' },
            { targets: 4, width: '120px' },
            { targets: 5, width: '120px' }, 
            { targets: 6, width: '120px' }, 
            { targets: 7, width: '140px' },  
            { targets: 8, width: '140px' }, 
        ],
    });
}

function getTypeMeterBadge(data) {
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

// ======================
// INITIALIZE
// ======================
$(document).ready(function () {
    fetchAllSitesForTable();
});
