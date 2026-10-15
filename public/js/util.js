// minutes (or '' when no data) -> "Nm" (< 60m) or "Nh" (>= 60m, rounded to nearest hour)
function formatMinutesToHM(minutes) {
    if (minutes === '' || minutes === null || minutes === undefined) return '';

    if (minutes >= 60) {
        return Math.round(minutes / 60) + 'h';
    }

    return minutes + 'm';
}

// Vilog sendTime/logTime allowed option sets, shared by the config form
// (configVilog.js) and the read-only table view (configVilogTable.js) so both
// pages bucket raw minute values into the exact same fixed set instead of
// drifting apart. Kronhe/MAG8000 gets the wider logTime set (short intervals);
// SU (and anything else) only ever shows 15m/30m/60m.
const SEND_TIME_SETS = {
    default: {
        minutes: [15, 30, 60, 120, 180, 360, 720],
        labels: ['15m', '30m', '1h', '2h', '3h', '6h', '12h'],
    },
    kronhe: {
        minutes: [15, 30, 60, 120, 180, 360, 720],
        labels: ['15m', '30m', '1h', '2h', '3h', '6h', '12h'],
    },
};
// Same 1/2/3/5/6/15/30/60m set for every meter type — matches the reference
// VilogLDC config tool (SerialCom/Form1.vb, LogTimeCandidatesForSensor()),
// where Aichi Tokei (SU), Krohne, Siemens MAG8000 and the Bavitech Level
// Sensor all share one logTime candidate list, ratio-filtered against sendTime.
const LOG_TIME_SETS = {
    default: {
        minutes: [1, 2, 3, 5, 6, 15, 30, 60],
        labels: ['1m', '2m', '3m', '5m', '6m', '15m', '30m', '60m'],
    },
    kronhe: {
        minutes: [1, 2, 3, 5, 6, 15, 30, 60],
        labels: ['1m', '2m', '3m', '5m', '6m', '15m', '30m', '60m'],
    },
};

const SEND_TIME_MINUTES_MAP = {
    '10m': 10, '15m': 15, '30m': 30, '1h': 60, '2h': 120,
    '3h': 180, '6h': 360, '12h': 720, '24h': 1440,
};
const LOG_TIME_MINUTES_MAP = {
    '1m': 1, '2m': 2, '3m': 3, '5m': 5, '6m': 6,
    '15m': 15, '30m': 30, '60m': 60,
};
const MAX_SEND_LOG_RATIO = 14;

// Mirror of the server rule (controller/api/configVilog.js): every type caps
// sendMinutes/logMinutes at MAX_SEND_LOG_RATIO; Kronhe/MAG8000/Level also
// write that ratio into AT+CLOCKLOG as a sample count, so it must be a whole
// number >= 1 (e.g. 15m/2m = 7.5 or 15m/30m = 0.5 are refused).
function isValidSendLogPair(type, sendMinutes, logMinutes) {
    const ratio = sendMinutes / logMinutes;
    if (ratio > MAX_SEND_LOG_RATIO) return false;
    if (type === 'SU') return true;
    return Number.isInteger(ratio) && ratio >= 1;
}

// TypeMeter is stored empty/null for legacy "Level" sites — normalize so every
// page (configVilog, configVilogTable) shows "Level" instead of a blank field.
function normalizeTypeMeter(raw) {
    const trimmed = raw == null ? '' : raw.toString().trim();
    const isEmpty =
        trimmed === '' ||
        trimmed.toLowerCase() === 'null' ||
        trimmed.toLowerCase() === 'undefined' ||
        trimmed === '-';
    return isEmpty ? 'Level' : trimmed;
}

function isKronheType(type) {
    return type === 'Kronhe' || type === 'MAG8000';
}

function getSendTimeSet(type) {
    return isKronheType(type) ? SEND_TIME_SETS.kronhe : SEND_TIME_SETS.default;
}

function getLogTimeSet(type) {
    return isKronheType(type) ? LOG_TIME_SETS.kronhe : LOG_TIME_SETS.default;
}

// picks the label of the option whose minute value is closest to `minutes`
function bucketMinutesToOptionLabel(minutes, optionsMinutes, optionsLabels, defaultLabel) {
    if (minutes === '' || minutes === null || minutes === undefined) {
        return defaultLabel;
    }

    let closestIndex = 0;
    let minDiff = Infinity;

    for (let i = 0; i < optionsMinutes.length; i++) {
        const diff = Math.abs(optionsMinutes[i] - minutes);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }

    return optionsLabels[closestIndex];
}

function convertDateFromApi(date) {
    if (
        date != null &&
        date != undefined &&
        date.toString().trim() != '' &&
        date != 'NO DATA'
    ) {
        let result = new Date(date);
        result.setHours(result.getHours() - 8);

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

function convertDateToStringNotTime(date) {
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

        return `${day}/${month}/${year}`;
    }
    return 'NO DATA';
}

function CheckExistsData(data) {
    if (data.length > 0) {
        return true;
    }
    return false;
}

function convertDateToDateTimeLocalInputTag(date) {
    if (date != null && date != undefined && date.toString().trim() != '') {
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

        return `${year}-${month}-${day}T${hours}:${minute}:${second}`;
    }
    return '';
}

function convertDateToDateInputTag(date) {
    if (date != null && date != undefined && date.toString().trim() != '') {
        let year = date.getFullYear();
        let month =
            date.getMonth() + 1 >= 10
                ? date.getMonth() + 1
                : `0${date.getMonth() + 1}`;
        let day = date.getDate() >= 10 ? date.getDate() : `0${date.getDate()}`;

        return `${year}-${month}-${day}`;
    }
    return '';
}

function ConvertDataIntoTable(data) {
    if (data != null && data != undefined && data.toString().trim() != '') {
        if (typeof data == 'number') {
            return data.toFixed(2);
        } else {
            return data;
        }
    } else {
        return '';
    }
}

function createOptionsInSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<option selected value="">Choose location</option>`;
        for (let item of data) {
            content += `<option value="${item.SiteId}">${item.SiteId}| ${item.Location}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsSiteAndLoggerIdInSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<option selected value="">chọn vị trí</option>`;
        for (let item of data) {
            content += `<option value="${item.LoggerId}">${item.SiteId}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInSelectBoxAndSelectFirstValue(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    let count = 0;

    if (CheckExistsData(data)) {
        //content += `<option value="">chọn vị trí</option>`;
        for (let item of data) {
            if (count == 0) {
                content += `<option selected="selected" value="${item.SiteId}">${item.SiteId}</option>`;
            } else {
                content += `<option value="${item.SiteId}">${item.SiteId}</option>`;
            }

            count++;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInSelectBoxWithSelectedValue(data, idDom, selectedValue) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        if (
            selectedValue == '' ||
            selectedValue == null ||
            selectedValue == undefined
        ) {
            content += `<option selected value="">Choose location</option>`;
            for (let item of data) {
                content += `<option value="${item.SiteId}">${item.SiteId}</option>`;
            }
        } else {
            for (let item of data) {
                if (item.SiteId == selectedValue) {
                    content += `<option selected value="${item.SiteId}">${item.SiteId}</option>`;
                } else {
                    content += `<option value="${item.SiteId}">${item.SiteId}</option>`;
                }
            }
        }
    }

    domSelect.innerHTML = content;
}

function createTablePlaceHolder() {
    let tablePlaceHolder = document.getElementById('tablePlaceHolder');
    tablePlaceHolder.innerHTML = `<table class="table table-hover" id="example" style="width: 100%; text-align: center; font-weight: 500">
  <thead id="head"></thead>
  <tbody id="body">
      <div class="loading"><img class="hide" id="loading" src="/images/loading.svg" /></div>
  </tbody>
  <tfoot id="foot"></tfoot>
</table>`;
}

function createOptionsInSerialLoggerSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        for (let item of data) {
            content += `<option value="${item.Serial}">${item.Serial}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInDisplayGroupSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<option value="">select display group</option>`;
        for (let item of data) {
            content += `<option value="${item.Group}">${item.Group}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInChannelConfigSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<option value="">select channel id</option>`;
        for (let item of data) {
            content += `<option value="${item.ChannelId}">${item.ChannelId}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInStaffAndConsumerSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<option value="">choose consumer</option>`;
        for (let item of data) {
            content += `<option value="${item.FullName}">${item.FullName}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInRoleSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<option value="">choose role</option>`;
        for (let item of data) {
            content += `<option value="${item.Role}">${item.Role}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInUserNameSelectBox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        content += `<option value="">choose username</option>`;
        for (let item of data) {
            content += `<option value="${item.Username}">${item.Username}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInUserNameSelectBoxStaffPermission(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    content += `<option value="" selected disabled>-- Select a Staff Member --</option>`;

    if (CheckExistsData(data)) {
        for (let item of data) {
            content += `<option value="${item._id}">${item.Username}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInUserNameSelectConsumerBoxPermission(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';

    content += `<option value="" selected disabled>-- Select a Consumer Member --</option>`;

    if (CheckExistsData(data)) {
        for (let item of data) {
            content += `<option value="${item._id}">${item.Username}</option>`;
        }
    }

    domSelect.innerHTML = content;
}

function createOptionsInNameStationSelectox(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';
    let i = 0;

    let content = '';

    if (CheckExistsData(data)) {
        for (let item of data) {
            if (i == 0) {
                content += `<option value="${item}" selected>${item}</option>`;
            } else {
                content += `<option value="${item}">${item}</option>`;
            }
            i++;
        }
    }

    domSelect.innerHTML = content;
}

function CreateDataNullForPost(data) {
    if (data == null || data == undefined || data.toString().trim() == '') {
        return 'null';
    } else {
        return data.toString();
    }
}

function fillDataIntoInputTag(data) {
    if (
        data == null ||
        data == undefined ||
        data.toString().trim() == '' ||
        data == 'null'
    ) {
        return '';
    } else return data;
}

function createDataForListSite(data, idDom) {
    let domSelect = document.getElementById(`${idDom}`);

    domSelect.innerHTML = '';

    let content = '';
    //content += `<li class="item d-none" data-id=""><span>Danh sach</span></li>`;
    if (CheckExistsData(data)) {
        for (let item of data) {
            content += `<li class=site-list-item item data-id="${item._id}"><span>${item.SiteId}</span></li>`;
        }
    }

    domSelect.innerHTML = content;
}

window.showToast = function (type, message) {
    // You can integrate with a toast library like Toastify or use Bootstrap toast
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    toast.style.cssText =
        'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
};

// Format date
window.formatDate = function (date) {
    return new Date(date).toLocaleString();
};
