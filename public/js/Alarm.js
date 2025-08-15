const hostnameAlarm = `http://157.66.81.22:3003/api`;

let tableAlarm = document.getElementById('tableAlarm');
let amountAlarm = document.getElementById('amountAlarm');
let hideAlarm = document.getElementById('hideAlarm');
let contentWrap = document.getElementById('contentWrap');

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

const urlGetSiteByUidByAlarm = `${hostnameAlarm}/GetSiteByUId/${userNameByAlarm}`;
const urlGetChannelsByAlarm = `${hostnameAlarm}/GetChannelByLoggerId/`;
const urlGetAlarmLostWaterAlarm = `${hostnameAlarm}/GetAlarmLostWater`;

async function GetAlarm() {
    axios.get(urlGetSiteByUidByAlarm).then(async function (res) {
        let bodyAlarm = '';
        let countAlarm = 0;

        for (let site of res.data) {
            let logger = '';

            if (
                site.LoggerId != null &&
                site.LoggerId != undefined &&
                site.LoggerId.trim() != ''
            ) {
                logger = site.LoggerId.trim();
            } else {
                logger = 'nothing';
            }

            let result = await axios.get(urlGetChannelsByAlarm + logger);

            for (let channel of result.data) {
                switch (channel.Status) {
                    case 2:
                        bodyAlarm += createTd(
                            channel,
                            site.SiteId,
                            'Disconected',
                            channel.Status,
                        );
                        countAlarm += 1;
                        break;
                    case 4:
                        bodyAlarm += createTd(
                            channel,
                            site.SiteId,
                            'Over threshold',
                            channel.Status,
                        );
                        countAlarm += 1;
                        break;
                }
            }
        }

        let headAlarm = createHeaderAlarm(res.data);
        amountAlarm.innerHTML = countAlarm.toString();
        tableAlarm.innerHTML =
            headAlarm + "<tbody class='text-center'>" + bodyAlarm + '</tbody>';
    });
}

GetAlarm();

function createHeaderAlarm(data) {
    let content = '';

    if (data.length > 0) {
        content += `<thead class="text-center bg-primary" >
            <th style="color: white">Location</th>
            <th style="color: white">Channel</th>
            <th style="color: white">Value</th>
            <th style="color: white">Timestamp</th>
            <th style="color: white">Status</th>
        </thead>`;
    }

    return content;
}

function createTd(data, siteid, status, statusColor) {
    let content = '';

    let backgroundColor = '';
    let color = '';

    if (statusColor == 2) {
        backgroundColor = '#f1c40f';
        color = 'white';
    } else if (statusColor == 4) {
        backgroundColor = '#e74c3c';
        color = 'white';
    }

    content += `<tr style="background-color: ${backgroundColor}">
            <td style="color:${color}; font-weight: 500">${fillDataIntoInputTag(
        siteid,
    )}</td>
            <td style="color:${color}; font-weight: 500">${fillDataIntoInputTag(
        data.ChannelName,
    )}</td>
            <td style="color:${color}; font-weight: 500">${fillDataIntoInputTag(
        data.LastValue,
    )}</td>
            <td style="color:${color}; font-weight: 500">${convertDateToString(
        convertDateFromApi(data.TimeStamp),
    )}</td>
              <td style="color:${color}; font-weight: 500">${status}</td>
        </tr>`;

    return content;
}

function createTdLostWater(data) {
    let content = '';

    content += `<tr>
            <td>${fillDataIntoInputTag(data.SiteId)}</td>
            <td></td>
            <td></td>
            <td></td>
              <td>Leakage loss</td>
        </tr>`;

    return content;
}

hideAlarm.addEventListener('click', function (e) {
    if ($('#boxAlarm').hasClass('d-none')) {
        $('#boxAlarm').removeClass('d-none');
        // $("#boxAlarm").addClass("d-block");
        $('#boxAlarm').slideDown('slow');
        isShowAlarm = true;
        isHoverOutAlarm = true;
        isClickedOutAlarm = true;
    } else {
        $('#boxAlarm').slideToggle('slow');
        if (isShowAlarm == true) {
            isShowAlarm = false;
            isHoverOutAlarm = true;
            isClickedOutAlarm = true;
        } else {
            isShowAlarm = true;
            isHoverOutAlarm = true;
            isClickedOutAlarm = true;
        }
    }
});

$('#boxAlarm').on('mouseout', function (e) {
    isHoverOutAlarm = true;
});

$('#boxAlarm').on('mouseover', function (e) {
    isHoverOutAlarm = false;
});

contentWrap.addEventListener('click', function () {
    if (isHoverOutAlarm == true && isShowAlarm == true) {
        $('#boxAlarm').slideUp('slow');
        isHoverOutAlarm = true;
        isShowAlarm = false;
    }
});

setInterval(() => {
    GetAlarm();
}, 1000 * 60 * 2);

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
