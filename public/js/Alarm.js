const hostnameAlarm = `http://localhost:3000/api`;

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

const urlGetLatestAlarmData = `${hostnameAlarm}/GetLatestHistoryAlarm`;

async function GetAlarm() {
    axios.get(urlGetLatestAlarmData).then(async function (res) {
        let bodyAlarm = '';

        for (let site of res.data) {
            bodyAlarm += createTd(site, site.SiteId, site.Type, site.Type);
        }

        let headAlarm = createHeaderAlarm(res.data);
        amountAlarm.innerHTML = res.data.length;
        tableAlarm.innerHTML = headAlarm + '<tbody>' + bodyAlarm + '</tbody>';
    });
}

GetAlarm();

function createHeaderAlarm(data) {
    let content = '';

    if (data.length > 0) {
        content += `<thead class="text-center bg-primary" >
            <th style="color: white">Sitename</th>
            <th style="color: white">Channel</th>
            <th style="color: white">Timestamp</th>
            <th style="color: white">Status</th>
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
            <td class="${color}" font-weight: 500">${siteid}</td>
            <td class="${color}" font-weight: 500">${data.ChannelName}</td>
            <td class="${color}" font-weight: 500">${convertDateToString(
        convertDateFromApi(data.TimeStampAlarm),
    )}</td>
              <td class="${color}" font-weight: 500">${text}</td>
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
