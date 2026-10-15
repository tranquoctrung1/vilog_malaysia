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
let urlGetSendTime = `${hostname}/GetSendTimeVilog`;
let urlUpdateVilog = `${hostname}/UpdateConfigVilog`;
let urlStopLoggingVilog = `${hostname}/StopLoggingVilog`;

let siteidSelect = null;

let currentSiteId = '';
let currentLocation = '';
let currentSendTime = '';

let isChangeSiteId = false;
let isChangeLocation = false;
let isChangeSendTime = false;
let isChangeLogTime = false;
let currentLogTime = '';

// Snapshot of the values loaded from the server for the currently selected
// site. Used at submit time to detect "user changed nothing" and skip the POST
// (otherwise the endpoint no-ops and we'd still report "Update success").
// null = no site loaded yet / load failed, in which case the check is skipped.
let originalValues = null;

function captureOriginalValues() {
    originalValues = {
        siteId: siteIdConfig.value,
        location: locationSite.value,
        sendTime: sendTime.value,
        logTime: logTime.value,
    };
}

// SEND_TIME_SETS/LOG_TIME_SETS/isKronheType/getSendTimeSet/getLogTimeSet/
// SEND_TIME_MINUTES_MAP/LOG_TIME_MINUTES_MAP/MAX_SEND_LOG_RATIO now live in
// util.js (shared with configVilogTable.js), loaded before this script.

// Rebuild a <select>'s options from a label list, preserving the current value
// when it still exists in the new set.
function renderSelectOptions(selectEl, labels) {
    const previous = selectEl.value;
    selectEl.innerHTML = labels
        .map((label) => `<option value="${label}">${label}</option>`)
        .join('');
    if (labels.includes(previous)) {
        selectEl.value = previous;
    }
}

// Swap the sendTime option list to match the selected meter type. logTime is
// handled separately by refreshLogTimeOptions() since it depends on the
// currently selected sendTime (Kronhe/MAG8000 filters it by ratio).
function applyMeterTypeOptions(type) {
    renderSelectOptions(sendTime, getSendTimeSet(type).labels);
}

// Recompute which logTime options are valid for the current typeMeter +
// sendTime, render them into #logTime (preserving the current value if it's
// still valid — otherwise the browser default-selects the first, smallest
// valid option), and return the effective {minutes, labels} set so callers
// can bucket a raw minutes value against the same set that's on screen.
//
// Enforces sendMinutes/logMinutes <= MAX_SEND_LOG_RATIO for every meter type
// (matches the reference config tool's RebuildLogTimeItems — the ratio filter
// is not Kronhe/MAG8000-specific) by removing any logTime option that would
// violate it — e.g. sendTime=12h (720min) only keeps 60m (720/60=12<=14);
// sendTime=6h (360min) keeps 30m/60m.
function refreshLogTimeOptions() {
    const type = typeMeter.value;
    const fullSet = getLogTimeSet(type);
    let effective = fullSet;

    const sendMinutes = SEND_TIME_MINUTES_MAP[sendTime.value];
    if (sendMinutes) {
        const minutes = [];
        const labels = [];
        fullSet.minutes.forEach((m, i) => {
            if (isValidSendLogPair(type, sendMinutes, m)) {
                minutes.push(m);
                labels.push(fullSet.labels[i]);
            }
        });
        // Every fixed sendTime option has at least one valid logTime, but
        // fall back to the full set rather than leaving logTime empty if
        // sendTime isn't recognized yet (e.g. not loaded/selected).
        if (labels.length > 0) {
            effective = { minutes, labels };
        }
    }

    renderSelectOptions(logTime, effective.labels);
    return effective;
}

// Selects the option matching a measured minutes value. When the device runs
// at an interval that is not in the list (e.g. 10m, or 24h after Stop
// Logging) an extra "not in list" option with value '' is shown instead of
// snapping to the nearest option, so a later save can't silently push that
// neighbour to the device (UpdateVilog refuses to submit '').
function selectMeasuredOption(selectEl, minutes, set, fallback) {
    if (minutes === '' || minutes === null || minutes === undefined) {
        selectEl.value = fallback;
        return;
    }
    const index = set.minutes.indexOf(Number(minutes));
    if (index >= 0) {
        selectEl.value = set.labels[index];
        return;
    }
    const option = document.createElement('option');
    option.value = '';
    option.textContent = `${formatMinutesToHM(Number(minutes))} (current, not in list)`;
    selectEl.prepend(option);
    selectEl.value = '';
}

async function calculateSendTime(siteId) {
    if (!siteId) return;
    const set = getSendTimeSet(typeMeter.value);
    try {
        const response = await axios.get(`${urlGetSendTime}/${siteId}`);
        if (response.status === 200) {
            selectMeasuredOption(sendTime, response.data, set, set.labels[0]);
        }
    } catch (err) {
        console.log('Error calculating send time', err);
        sendTime.value = set.labels[0];
    }
}

// Must run AFTER sendTime.value is settled (calculateSendTime) so the
// ratio filter in refreshLogTimeOptions() sees the right sendTime.
async function calculateLogTime(siteId) {
    if (!siteId) return;
    const set = refreshLogTimeOptions();
    const fallback = set.labels.includes('15m') ? '15m' : set.labels[0];
    try {
        const response = await axios.get(`${urlGetLoggingTime}/${siteId}`);
        if (response.status === 200) {
            selectMeasuredOption(logTime, response.data, set, fallback);
            currentLogTime = logTime.value;
            isChangeLogTime = false;
        }
    } catch (err) {
        console.log('Error calculating log time', err);
        logTime.value = fallback;
        currentLogTime = fallback;
        isChangeLogTime = false;
    }
}

function fetchSites() {
    axios
        .get(urlGetSite)
        .then((res) => {
            if (siteidSelect !== null) {
                siteidSelect.destroy();
            }
            const sites = res.data.filter((site) => site.SiteId);
            createOptionsInSelectBox(sites, 'site');
            siteidSelect = new TomSelect('#site', {
                create: false,
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false,
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
        .then(async (res) => {
            // A new site is being loaded: drop the previous site's snapshot and
            // dirty flags so they can't leak into this site's update.
            originalValues = null;
            isChangeSiteId = false;
            isChangeLocation = false;
            isChangeSendTime = false;
            isChangeLogTime = false;

            if (res.data.length > 0) {
                siteIdConfig.value = fillDataIntoInputTag(res.data[0].SiteId);
                locationSite.value = fillDataIntoInputTag(res.data[0].Location);
                typeMeter.value = normalizeTypeMeter(res.data[0].TypeMeter);
                oldLocation.value = fillDataIntoInputTag(res.data[0].Location);
            }
            // Rebuild the sendTime list for this meter type, then resolve its
            // value BEFORE touching logTime — logTime's valid option set
            // depends on the resolved sendTime (Kronhe/MAG8000 ratio filter),
            // so these must run in sequence, not in parallel.
            applyMeterTypeOptions(typeMeter.value);
            await calculateSendTime(e.target.value);
            await calculateLogTime(e.target.value);
            // Both selects now hold the stored values: snapshot them as the
            // baseline the submit-time diff compares against.
            captureOriginalValues();
        })
        .catch((err) => console.log(err));
});

function logTimeChanged(e) {
    if (e.value !== currentLogTime) {
        isChangeLogTime = true;
    }
}

function sendTimeChanged(e) {
    isChangeSendTime = true;
    // Re-filter logTime's options for the newly picked sendTime. If the
    // current logTime is still valid it's kept; otherwise the browser
    // default-selects the first (smallest, most frequent) valid option —
    // this is what previously had to be hardcoded per sendTime value (e.g.
    // 12h forcing 60m), now handled generically for every sendTime.
    refreshLogTimeOptions();
    currentLogTime = logTime.value;
}

function SetEmptySite() {
    if (siteidSelect !== null) {
        siteidSelect.clear(true);
    } else {
        siteid.value = '';
    }
    siteIdConfig.value = '';
    locationSite.value = '';
    oldLocation.value = '';
    typeMeter.value = '';
    originalValues = null;
}

// Same rule as the server (controller/api/configVilog.js): these characters
// would break the MQTT topic or inject extra AT commands.
const UNSAFE_NEW_VALUE_CHARS = /[;{}#+,="_\x00-\x1f]/;

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

function UpdateVilog() {
    const obj = {};

    if (
        siteid.value == null ||
        siteid.value == undefined ||
        siteid.value.trim() == ''
    ) {
        swal('Err', 'Not null site id', 'error');
    } else {
        // Diff the four editable fields against the values loaded for this
        // site. typeMeter/oldLocation are display-only (disabled inputs), so
        // they can never be the reason an update is needed. sendTimeDiffers
        // must be computed BEFORE the auto-adjust below (it only touches
        // logTime, never sendTime), so it reflects the user's actual edit.
        const base = originalValues;
        const siteIdDiffers = base ? siteIdConfig.value !== base.siteId : false;
        const locationDiffers = base
            ? locationSite.value !== base.location
            : false;
        const sendTimeDiffers = base ? sendTime.value !== base.sendTime : false;

        const changedSiteId = isChangeSiteId || siteIdDiffers;
        const changedLocation = isChangeLocation || locationDiffers;
        const changedSendTime = isChangeSendTime || sendTimeDiffers;

        // Re-filter/auto-adjust logTime to stay within the ratio cap for the
        // submitted sendTime — but only when sendTime is actually part of
        // this submission. Otherwise a rename-only edit on a site stored at
        // e.g. 12h/5m would mutate logTime, get diffed as "changed", and
        // submit an unrequested AT+CLOCKLOG change the user never made.
        // (Normally the select's onChange already keeps logTime valid live;
        // this is the submit-time safety net for the same rule.)
        if (changedSendTime) {
            refreshLogTimeOptions();
        }

        const logTimeDiffers = base ? logTime.value !== base.logTime : false;

        // A field counts as changed if the user touched it (focus/change
        // handlers) OR its value actually differs from what was loaded — the
        // latter also catches the auto-adjust of logTime done just above.
        const changedLogTime = isChangeLogTime || logTimeDiffers;

        // Nothing to change: the form still holds exactly what was loaded, so
        // skip the POST instead of reporting a misleading "Update success".
        if (
            base &&
            !siteIdDiffers &&
            !locationDiffers &&
            !sendTimeDiffers &&
            !logTimeDiffers
        ) {
            swal('Info', 'Nothing to change', 'info');
            return;
        }

        obj.oldSiteId = site.value;
        obj.oldLocation = oldLocation.value;
        obj.typeMeter = typeMeter.value;

        if (changedSiteId || changedLocation) {
            if (
                siteIdConfig.value.trim() === '' ||
                locationSite.value.trim() === ''
            ) {
                swal('Err', 'Site Id and SiteName must not be empty', 'error');
                return;
            }
            if (
                UNSAFE_NEW_VALUE_CHARS.test(siteIdConfig.value) ||
                UNSAFE_NEW_VALUE_CHARS.test(locationSite.value)
            ) {
                swal(
                    'Err',
                    'Site Id / SiteName must not contain ; { } # + , = " _ characters',
                    'error',
                );
                return;
            }
            obj.siteId = siteIdConfig.value;
            obj.location = locationSite.value;
        } else {
            obj.siteId = '';
            obj.location = '';
        }

        // Kronhe/MAG8000/Level write a single AT+CLOCKLOG command that encodes
        // BOTH sendTime and logTime together (setTime = sendMinutes/logMinutes);
        // the device has no way to update just one side of that ratio. So for
        // these types, touching either field must submit both current values
        // together — otherwise the server has half the pair and can't rebuild
        // the command (controller/api/configVilog.js skips it unless both are
        // non-empty). SU's sendTime (AT+TDC) and logTime (CFGDEV 0x04) are
        // fully independent commands, so SU keeps the old one-at-a-time
        // behavior.
        const needsPairedSendLog =
            obj.typeMeter !== 'SU' && (changedSendTime || changedLogTime);

        if (changedSendTime || needsPairedSendLog) {
            obj.sendTime = sendTime.value;
        } else {
            obj.sendTime = '';
        }

        if (changedLogTime || needsPairedSendLog) {
            obj.logTime = logTime.value;
        } else {
            obj.logTime = '';
        }

        // A '' value means the device's current interval is not in the list
        // ("not in list" option): it can't be submitted as-is.
        if (obj.sendTime === '' && (changedSendTime || needsPairedSendLog)) {
            swal('Err', 'Current Send Time is not in the list. Please select a Send Time.', 'error');
            return;
        }
        if (obj.logTime === '' && (changedLogTime || needsPairedSendLog)) {
            swal('Err', 'Current Log Time is not in the list. Please select a Log Time.', 'error');
            return;
        }

        // Client-side mirror of the server rule (non-SU types): sendTimeMinutes
        // / logTimeMinutes must be a whole number 1..14. Validate ONLY what is
        // actually being submitted — the server skips its own ratio check when
        // either field is '' (controller/api/configVilog.js), so validating the
        // displayed-but-unsubmitted values would block unrelated edits (e.g.
        // renaming a site whose stored config is 24h/5m). SU is the only type
        // whose command doesn't derive a ratio (plain hex logTime encoding),
        // so it's excluded here — Kronhe/MAG8000/Level all share the same
        // AT+CLOCKLOG ratio cap server-side.
        if (obj.typeMeter !== 'SU' && obj.sendTime !== '' && obj.logTime !== '') {
            const sendMinutes = SEND_TIME_MINUTES_MAP[obj.sendTime];
            const logMinutes = LOG_TIME_MINUTES_MAP[obj.logTime];
            if (sendMinutes && logMinutes) {
                const ratio = sendMinutes / logMinutes;
                if (!isValidSendLogPair(obj.typeMeter, sendMinutes, logMinutes)) {
                    swal(
                        'Err',
                        `Send Time / Log Time ratio is ${ratio.toFixed(1)} ` +
                            `(${obj.sendTime} / ${obj.logTime}). It must be a ` +
                            `whole number between 1 and ${MAX_SEND_LOG_RATIO}.`,
                        'error',
                    );
                    return;
                }
            }
        }

        axios
            .post(urlUpdateVilog, obj)
            .then((res) => {
                if (res.status === 200) {
                    // The submitted values are the stored values now: rebase
                    // the snapshot so a repeat click is "Nothing to change".
                    captureOriginalValues();
                    isChangeSiteId = false;
                    isChangeLocation = false;
                    isChangeSendTime = false;
                    isChangeLogTime = false;
                    const pendingRename = res.data && res.data.pendingRename;
                    if (obj.siteId !== '') {
                        // MQTT_Vilog renames the Site/channels when the device
                        // first sends data on its new topic.
                        swal(
                            'Done',
                            'Update sent. The site is renamed automatically when the logger sends data with the new Site Id / SiteName.',
                            'success',
                        );
                    } else if (pendingRename) {
                        swal(
                            'Done',
                            `Update sent together with the pending rename to ${pendingRename.siteId} / ${pendingRename.location} (not applied by the logger yet).`,
                            'success',
                        );
                    } else {
                        swal('Done', 'Update success', 'success');
                    }
                } else {
                    swal('Err', 'Update failed', 'error');
                }
            })
            .catch((err) => {
                // Surface the server's error string (e.g. the 400 ratio
                // rejection from a race where another user changed the config
                // just before submit) instead of a generic message.
                const serverMsg =
                    err &&
                    err.response &&
                    err.response.data &&
                    err.response.data.error;
                swal('Err', serverMsg || 'Update failed', 'error');
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
            buttons: ['Cancel', 'Yes, stop logging it!'],
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                const obj = {};
                obj.oldSiteId = site.value;
                obj.oldLocation = oldLocation.value;
                obj.typeMeter = typeMeter.value;

                axios
                    .post(urlStopLoggingVilog, obj)
                    .then((res) => {
                        if (res.data != 0) {
                            swal(
                                'Done',
                                'Stop logging sent. The logger switches to a 24h send interval on its next connection.',
                                'success',
                            );
                            SetEmptySite();
                        } else {
                            swal('Err', 'Stop logging failed', 'error');
                        }
                    })
                    .catch((err) => {
                        const serverMsg =
                            err &&
                            err.response &&
                            err.response.data &&
                            err.response.data.error;
                        swal('Err', serverMsg || 'Stop logging failed', 'error');
                    });
            }
        });
    }
}
