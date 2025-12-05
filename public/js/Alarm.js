const hostnameAlarm = `http://43.216.183.205:3000/api`;

let tableAlarm = document.getElementById('tableAlarm');
let amountAlarm = document.getElementById('amountAlarm');
let hideAlarm = document.getElementById('hideAlarm');
let contentWrap = document.getElementById('contentWrap');
let closeAlarmModal = document.getElementById('closeAlarmModal');

let userNameByAlarm = document.getElementById('userName').innerHTML;

let isShowAlarm = false;
let isHoverOutAlarm = false;
let isClickedOutAlarm = false;

if (
    userNameByAlarm == null ||
    userNameByAlarm == undefined ||
    userNameByAlarm.trim() == ''
) {
    userNameByAlarm = 'admin';
}

const urlGetLatestAlarmData = `${hostnameAlarm}/GetLatestHistoryAlarm/${userNameByAlarm}`;

async function GetAlarm() {
    axios.get(urlGetLatestAlarmData).then(async function (res) {
        let bodyAlarm = '';
        for (let site of res.data) {
            bodyAlarm += createTd(site, site.SiteId, site.Type, site.Type);
        }

        let headAlarm = createHeaderAlarm(res.data);
        amountAlarm.innerHTML = res.data.length;
        tableAlarm.innerHTML = headAlarm + '<tbody>' + bodyAlarm + '</tbody>';

        const isMobile = /Mobi|Android/i.test(navigator.userAgent);

        $('#tableAlarm').DataTable({
            language: {
                search: 'Search:',
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                paginate: { previous: 'Previous', next: 'Next' },
            },
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
            dom: isMobile ? 'frtip' : 'lBrtip',
            buttons: isMobile
                ? []
                : [
                      {
                          extend: 'excel',
                          text: '<i class="fas fa-file-excel me-1"></i> Excel',
                          className: 'btn btn-sm buttons-excel',
                          filename: 'list_latest_alarm',
                      },
                      {
                          extend: 'csv',
                          text: '<i class="fas fa-file-csv me-1"></i> CSV',
                          className: 'btn btn-sm buttons-csv',
                          filename: 'list_latest_alarm',
                      },
                      {
                          extend: 'pdf',
                          text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                          className: 'btn btn-sm buttons-pdf',
                          filename: 'list_latest_alarm',
                      },
                  ],
            responsive: isMobile
                ? {
                      details: {
                          type: 'inline',
                          display:
                              DataTable.Responsive.display.childRowImmediate,
                      },
                  }
                : false,
            columnDefs: [
                { responsivePriority: 1, targets: 0 },
                { responsivePriority: 2, targets: -1 },
                { responsivePriority: 10000, targets: [3, 4, 5] },
            ],
        });
    });
}

GetAlarm();

function createHeaderAlarm(data) {
    let content = '';

    if (data.length > 0) {
        content += `<thead>
            <th class="">SiteId</th>
            <th class="">Sitename</th>
            <th class="">Channel</th>
            <th class="">TimeStamp Data</th>
            <th class="">TimeStamp Alarm</th>
            <th class="">Status</th>
        </thead>`;
    }

    return content;
}

function createTd(data, siteid, status, statusColor) {
    let content = '';
    let color = `text-success`;
    let text = `Discconnected`;

    if (status === 1) {
        color = 'text-warning';
    } else {
        color = `text-danger`;
        text = `Alarm`;
    }

    content += `<tr>
            <td class="${color}" style="font-size: .9rem;">${data.SiteId}</td>
            <td class="${color}" style="font-size: .9rem;">${data.Location}</td>
            <td class="${color}" style="font-size: .9rem;">${
                data.ChannelName
            }</td>
            <td class="${color}" style="font-size: .9rem;">${convertDateToString(
                convertDateFromApi(data.TimeStampHasValue),
            )}</td>
     <td class="${color}" style="font-size: .9rem;">${convertDateToString(
         convertDateFromApi(data.TimeStampAlarm),
     )}</td>
              <td class="${color}" style="font-size: .9rem;">${
                  data.Content
              }</td>
        </tr>`;

    return content;
}

function createTdLostWater(data) {
    let content = '';

    content += `<tr>
            <td>${data.SiteId}</td>
            <td></td>
            <td></td>
            <td></td>
              <td>Leakage loss</td>
        </tr>`;

    return content;
}

hideAlarm.addEventListener('click', function (e) {
    $('#alarmModal').show();
    $('#hamburgerButton').toggleClass('is-active');
    $('#bodySidebar').toggleClass('sidebar-hide');
    // if ($('#boxAlarm').hasClass('d-none')) {
    //     $('#boxAlarm').removeClass('d-none');
    //     // $("#boxAlarm").addClass("d-block");
    //     $('#boxAlarm').slideDown('slow');
    //     isShowAlarm = true;
    //     isHoverOutAlarm = true;
    //     isClickedOutAlarm = true;
    // } else {
    //     $('#boxAlarm').slideToggle('slow');
    //     if (isShowAlarm == true) {
    //         isShowAlarm = false;
    //         isHoverOutAlarm = true;
    //         isClickedOutAlarm = true;
    //     } else {
    //         isShowAlarm = true;
    //         isHoverOutAlarm = true;
    //         isClickedOutAlarm = true;
    //     }
    // }
});

// contentWrap.addEventListener('click', function () {
//     if (isHoverOutAlarm == true && isShowAlarm == true) {
//         $('#boxAlarm').slideUp('slow');
//         isHoverOutAlarm = true;
//         isShowAlarm = false;
//     }
// });

// setInterval(() => {
//     GetAlarm();
// }, 1000 * 60 * 2);

let sidebar = document.getElementById('sidebar');
let bodySidebar = document.getElementById('bodySidebar');

// sidebar.addEventListener("click", function (e) {
//   $("#bodySidebar").toggleClass("sidebar-hide");
// });

sidebar.addEventListener('mouseover', function (e) {
    $('#bodySidebar').removeClass('sidebar-hide');
});

sidebar.addEventListener('mouseout', function (e) {
    $('#bodySidebar').addClass('sidebar-hide');
});

function convertDateFromApi(date) {
    if (
        date != null &&
        date != undefined &&
        date.toString().trim() != '' &&
        date != 'NO DATA'
    ) {
        let result = new Date(date);
        result.setHours(result.getHours() - 7);

        return result;
    }
    return 'NO DATA';
}

function convertDateToString(date) {
    if (
        date != null &&
        date != undefined &&
        date.toString().trim() != '' &&
        date != 'NO DATA'
    ) {
        let year = date.getFullYear();
        let month =
            date.getMonth() + 1 >= 10
                ? date.getMonth() + 1
                : `0${date.getMonth() + 1}`;
        let day = date.getDate() >= 10 ? date.getDate() : `0${date.getDate()}`;
        let hours =
            date.getHours() >= 10 ? date.getHours() : `0${date.getHours()}`;
        let minute =
            date.getMinutes() >= 10
                ? date.getMinutes()
                : `0${date.getMinutes()}`;
        let second =
            date.getSeconds() >= 10
                ? date.getSeconds()
                : `0${date.getSeconds()}`;

        return `${day}/${month}/${year} ${hours}:${minute}:${second}`;
    }
    return 'NO DATA';
}

function oncloseAlarmModal() {
    $('#alarmModal').hide();
}

// function onMinimizeAlarmModal() {
//     $('#alarmModal').removeClass('modal-maximized');
//     $('#alarmModal').addClass('modal-minimized');
// }

// function onMaximizeAlarmModal() {
//     $('#alarmModal').removeClass('modal-minimized');
//     $('#alarmModal').addClass('modal-maximized');
// }

if (/Mobi|Android/i.test(navigator.userAgent)) {
    const link = document.querySelector('a[href="/dataOnline"]');
    if (link) link.style.display = 'none';
}
