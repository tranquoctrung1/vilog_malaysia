let urlGetSite = `${hostname}/GetSiteByUId/`;
let urlGetLoggingTime = `${hostname}/GetLoggingTimeVilog`;
let urlGetSendTime = `${hostname}/GetSendTimeVilog`;
let urlGetAllChannel = `${hostname}/GetAllChannel`;

let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

let fullUrlGetSite = `${urlGetSite}${userName}`;

let tableData = [];

function formatDateTime(date) {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ======================
// FETCH DATA
// ======================
async function fetchAllSitesForTable() {
    try {
        const res = await axios.get(fullUrlGetSite);
        if (res.status === 200) {
            const sites = res.data.filter((site) => site.SiteId && site.LoggerId);

            const promises = sites.map(async (site) => {
                let logTimeMinutes = '';
                try {
                    const logRes = await axios.get(`${urlGetLoggingTime}/${site.SiteId}`);
                    if (logRes.status === 200) {
                        logTimeMinutes = logRes.data;
                    }
                } catch (e) {
                    console.log('Error getting log time for', site.SiteId);
                }

                let sendTimeMinutes = '';
                try {
                    const sendRes = await axios.get(`${urlGetSendTime}/${site.SiteId}`);
                    if (sendRes.status === 200) {
                        sendTimeMinutes = sendRes.data;
                    }
                } catch (e) {
                    console.log('Error getting send time for', site.SiteId);
                }

                let channels = [];
                try {
                    const channelRes = await axios.get(`${urlGetAllChannel}/${site.LoggerId}`);
                    if (channelRes.status === 200 && Array.isArray(channelRes.data)) {
                        channels = channelRes.data;
                    }
                } catch (e) {
                    console.log('Error getting channels for', site.LoggerId);
                }

                const sendSet = getSendTimeSet(site.TypeMeter);
                const logSet = getLogTimeSet(site.TypeMeter);

                const base = {
                    siteId: site.SiteId || '',
                    location: site.Location || '',
                    typeMeter: site.TypeMeter || '',
                    loggerId: site.LoggerId || '',
                    sendTime: bucketMinutesToOptionLabel(sendTimeMinutes, sendSet.minutes, sendSet.labels, ''),
                    logTime: bucketMinutesToOptionLabel(logTimeMinutes, logSet.minutes, logSet.labels, ''),
                    latitude: site.Latitude || '',
                    longitude: site.Longitude || '',
                    status: site.Status || '',
                    _rawData: site
                };

                if (channels.length === 0) {
                    return [{
                        ...base,
                        channelId: '',
                        channelName: '',
                        lastValue: '',
                        latestTime: '',
                        baseMin: '',
                        baseMax: '',
                    }];
                }

                return channels.map((channel) => ({
                    ...base,
                    channelId: channel.ChannelId || '',
                    channelName: channel.ChannelName || '',
                    lastValue: channel.LastValue ?? '',
                    latestTime: channel.TimeStamp ? formatDateTime(channel.TimeStamp) : '',
                    baseMin: channel.BaseMin ?? '',
                    baseMax: channel.BaseMax ?? '',
                }));
            });

            tableData = (await Promise.all(promises)).flat();

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
            <td class="fw-bold">${item.siteId}</td>
            <td>${item.location}</td>
            <td>${typeMeterBadge}</td>
            <td>${sendTimeBadge}</td>
            <td>${logTimeBadge}</td>
            <td>${item.latitude}</td>
            <td>${item.longitude}</td>
            <td>${item.channelId}</td>
            <td>${item.channelName}</td>
            <td>${item.lastValue}</td>
            <td>${item.latestTime}</td>
            <td>${item.baseMin}</td>
            <td>${item.baseMax}</td>
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
        dom: isMobile ? 'frtip' : '<"d-flex justify-content-between align-items-center mb-3"f<"d-flex align-items-center gap-2"B l>>rtip>',
        pageLength: 50,
        lengthMenu: [[13, 25, 50, 100, -1], [13, 25, 50, 100, 'All']],
        order: [[0, 'asc']],
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
            { targets: 0, width: '50px' },
            { targets: 1, width: '250px' },
            { targets: 2, width: '120px' },
            { targets: 3, width: '120px' },
            { targets: 4, width: '120px' },
            { targets: 5, width: '80px' },
            { targets: 6, width: '80px' },
            { targets: 7, width: '100px' },
            { targets: 8, width: '140px' },
            { targets: 9, width: '100px' },
            { targets: 10, width: '160px' },
            { targets: 11, width: '110px' },
            { targets: 12, width: '110px' },
        ],
    });
}

function getTypeMeterBadge(data) {
    const displayText = normalizeTypeMeter(data);
    const badgeClass = displayText === 'Level' ? 'tag-secondary' :
        displayText === 'SU' ? 'tag-info' :
            isKronheType(displayText) ? 'tag-success' :
                'tag-secondary';
    return `<span class="alarm-tag ${badgeClass}">${displayText}</span>`;
}

// ======================
// INITIALIZE
// ======================
$(document).ready(function () {
    fetchAllSitesForTable();
});
