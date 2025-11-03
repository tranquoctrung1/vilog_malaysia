let urlGetHistoryAlarm = `${hostname}/gethistoryalarmdata`;

let alarmTableBody = document.getElementById('alarmTableBody');

function getDataHistoryAlarm(start, end) {
    let url = `${urlGetHistoryAlarm}/${start}/${end}`;

    axios
        .get(url)
        .then((res) => {
            renderDataTable(res.data);

            drawTable();
        })
        .catch((err) => console.log(err.message));
}

function renderDataTable(data) {
    let content = ``;

    for (const item of data) {
        content += `<tr data-alarm-type="${item.Content}">
                            <td>${item.SiteId}</td>
                            <td>${item.Location}</td>
                            <td>${item.ChannelName}</td>
                            <td>${convertDateToString(
                                convertDateFromApi(item.TimeStampHasValue),
                            )}</td>
                            <td>${convertDateToString(
                                convertDateFromApi(item.TimeStampAlarm),
                            )}</td>
                            <td>${item.Content}</td>
                        </tr>`;
    }

    alarmTableBody.innerHTML = content;
}

function drawTable() {
    function getAlarmTag(content) {
        let tagClass = 'tag-secondary';
        const lower = content.toLowerCase();

        if (lower.includes('disconnect') || lower.includes('delay'))
            tagClass = 'tag-warning';
        else tagClass = 'tag-danger';
        return `<span class="alarm-tag ${tagClass}">${content.toUpperCase()}</span>`;
    }

    // === Add Tag to Alarm Column ===
    $('#alarmTable tbody tr').each(function () {
        const $row = $(this);
        const content = $row.find('td:eq(5)').text();
        $row.find('td:eq(5)').html(getAlarmTag(content));
    });

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // === Initialize DataTable ===
    $('#alarmTable').DataTable({
        retrieve: true,
        language: {
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: { previous: 'Previous', next: 'Next' },
        },
        dom: isMobile ? 'frtip' : 'lBrtip',
        pageLength: 50,
        order: [[4, 'desc']],
        buttons: isMobile
            ? []
            : [
                  {
                      extend: 'excel',
                      text: '<i class="fas fa-file-excel me-1"></i> Excel',
                      className: 'btn btn-sm buttons-excel',
                      filename: 'list_alarm',
                  },
                  {
                      extend: 'csv',
                      text: '<i class="fas fa-file-csv me-1"></i> CSV',
                      className: 'btn btn-sm buttons-csv',
                      filename: 'list_alarm',
                  },
                  {
                      extend: 'pdf',
                      text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                      className: 'btn btn-sm buttons-pdf',
                      filename: 'list_alarm',
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
    });
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

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000 * 30);
    const start = `${oneDayAgo.getFullYear()}-${pad(
        oneDayAgo.getMonth() + 1,
    )}-${pad(oneDayAgo.getDate())}T${pad(oneDayAgo.getHours())}:${pad(
        oneDayAgo.getMinutes(),
    )}`;
    $('#startHour').val(start);

    getDataHistoryAlarm(oneDayAgo.getTime(), now.getTime());
});
