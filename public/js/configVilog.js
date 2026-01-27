let siteid = document.getElementById('site');
let siteIdConfig = document.getElementById('siteid');
let locationSite = document.getElementById('location');
let oldLocation = document.getElementById('oldLocation');
let typeMeter = document.getElementById('typeMeter');
let sendTime = document.getElementById('sendTime');
let logTime = document.getElementById('logTime');

let username = document.getElementById('userName').innerHTML;
if (username == null || username == undefined || username.trim() == '') {
    username = 'admin';
}

let urlGetSite = `${hostname}/GetSiteByUId/${username}`;
let urlGetSiteBySiteId = `${hostname}/GetSiteBySiteId`;
let urlGetLoggingTime = `${hostname}/GetLoggingTimeVilog`;
let urlUpdateVilog = `${hostname}/UpdateConfigVilog`;
let urlStopLoggingVilog = `${hostname}/StopLoggingVilog`;

let siteidSelect = null;

let currentSiteId = '';
let currentLocation = '';
let currentSendTime = '';
let currentLogTime = '';

let isChangeSiteId = false;
let isChangeLocation = false;
let isChangeSendTime = false;
let isChangeLogTime = false;

function fetchSites() {
    axios
        .get(urlGetSite)
        .then((res) => {
            if (siteidSelect !== null) {
                siteidSelect.destroy();
            }
            createOptionsInSelectBox(res.data, 'site');
            siteidSelect = new TomSelect('#site', {
                create: false, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
                maxOptions: null,
            });
        })
        .catch((err) => console.log(err));
}

fetchSites();

site.addEventListener('change', function (e) {
    let url = `${urlGetSiteBySiteId}/${e.target.value}`;

    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                siteIdConfig.value = fillDataIntoInputTag(res.data[0].SiteId);
                locationSite.value = fillDataIntoInputTag(res.data[0].Location);
                typeMeter.value = fillDataIntoInputTag(res.data[0].TypeMeter);
                oldLocation.value = fillDataIntoInputTag(res.data[0].Location);

                const timeDelay = res.data[0].TimeDelay;

                if (timeDelay !== undefined) {
                    if (timeDelay >= 720) {
                        sendTime.value = '12h';
                    } else if (timeDelay >= 360) {
                        sendTime.value = '6h';
                    } else if (timeDelay >= 120) {
                        sendTime.value = '2h';
                    } else if (timeDelay >= 60) {
                        sendTime.value = '1h';
                    } else if (timeDelay >= 30) {
                        sendTime.value = '30m';
                    } else {
                        sendTime.value = '15m';
                    }
                }
            }
        })
        .catch((err) => console.log(err));

    url = `${urlGetLoggingTime}/${e.target.value}`;

    axios
        .get(url)
        .then((res) => {
            if (res.status === 200) {
                if (res.data === 360) {
                    logTime.value = '6h';
                } else {
                    logTime.value = res.data + 'm';
                }
            }
        })
        .catch((err) => console.log(err));
});

function sendTimeChanged(e) {
    const interval = e.value;
    if (interval === '12h') {
        logTime.value = '60m';
    } else if (interval == '6h' && logTime.value === '15m') {
        logTime.value = '30m';
    }

    isChangeSendTime = true;
}

function SetEmptySite() {
    siteid.value = '';
    locationSite.value = '';

    typeMeter.value = '';
}

function onForcusInSiteId(e) {
    currentSiteId = e.value;
    isChangeSiteId = false;
}

function onForcusOutSiteId(e) {
    if (currentSiteId !== e.value) {
        currentSiteId = e.value;
        isChangeSiteId = true;
    }
}

function onForcusInLocation(e) {
    currentLocation = e.value;
    isChangeLocation = false;
}

function onForcusOutLocation(e) {
    if (currentLocation !== e.value) {
        currentLocation = e.value;
        isChangeLocation = true;
    }
}

function logTimeChange(e) {
    isChangeLogTime = true;
}

function UpdateVilog() {
    const obj = {};

    if (
        siteid.value == null ||
        siteid.value == undefined ||
        siteid.value.trim() == ''
    ) {
        swal('Err', 'Not null site id', 'error');
    } else {
        const interval = sendTime.value;
        if (interval === '12h') {
            logTime.value = '60m';
        } else if (interval == '6h' && logTime.value === '15m') {
            logTime.value = '30m';
        }

        obj.oldSiteId = site.value;
        obj.oldLocation = oldLocation.value;
        obj.typeMeter = typeMeter.value;

        if (isChangeSiteId || isChangeLocation) {
            obj.siteId = siteIdConfig.value;
            obj.location = locationSite.value;
        } else {
            obj.siteId = '';
            obj.location = '';
        }

        if (isChangeSendTime || isChangeLogTime) {
            obj.sendTime = sendTime.value;
            obj.logTime = logTime.value;
        } else {
            obj.sendTime = '';
            obj.logTime = '';
        }

        axios
            .post(urlUpdateVilog, obj)
            .then((res) => {
                if (res.status === 200) {
                    swal('Done', 'Update success', 'success');
                } else {
                    swal('Err', 'Update failed', 'error');
                }
            })
            .catch((err) => {
                swal('Err', 'Update failed', 'error');
            });
    }
}

function StopLogging() {
    if (
        siteid.value == null ||
        siteid.value == undefined ||
        siteid.value.trim() == ''
    ) {
        swal('Err', 'Not null site id', 'error');
    } else {
        swal({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, stop logging it!',
        }).then((willDelete) => {
            if (willDelete) {
                const obj = {};
                obj.oldSiteId = site.value;
                obj.oldLocation = oldLocation.value;
                obj.typeMeter = typeMeter.value;

                obj.siteId = siteIdConfig.value;
                obj.location = locationSite.value;
                obj.typeMeter = typeMeter.value;
                obj.sendTime = sendTime.value;
                obj.logTime = logTime.value;

                axios
                    .post(urlStopLoggingVilog, obj)
                    .then((res) => {
                        if (res.data != 0) {
                            swal('Done', 'Stop logging success', 'success');
                            SetEmptySite();
                        } else {
                            swal('Err', 'Stop logging failed', 'error');
                        }
                    })
                    .catch((err) => console.log(err));
            }
        });
    }
}
