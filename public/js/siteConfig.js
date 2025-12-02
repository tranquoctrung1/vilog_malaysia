let displayGroup = document.getElementById('displayGroup');
let siteid = document.getElementById('site');
let locationSite = document.getElementById('location');
let lat = document.getElementById('lat');
let loggerId = document.getElementById('loggerId');
let long = document.getElementById('long');
let startDay = document.getElementById('startDay');
let startHour = document.getElementById('startHour');
let timeDelay = document.getElementById('timeDelay');
let status = document.getElementById('status');
let available = document.getElementById('available');
let pipeSize = document.getElementById('pipeSize');
let interval = document.getElementById('interval');
let note = document.getElementById('note');
let id = document.getElementById('id');
let isPrimayer = document.getElementById('isPrimayer');
let MNF = document.getElementById('MNF');
let typeMeter = document.getElementById('typeMeter');
let IMEI = document.getElementById('IMEI');

let urlGetSiteByDisplayGroup = `${hostname}/GetSiteByDisplayGroup`;
let urlGetSiteBySiteId = `${hostname}/GetSiteBySiteId`;
let urlInsertSite = `${hostname}/InsertSite`;
let urlUpdateSite = `${hostname}/UpdateSite`;
let urlDeleteSite = `${hostname}/DeleteSite`;

let siteidSelect = null;

function fetchDisplayGroupForSite() {
    axios
        .get(urlGetDisplayGroup)
        .then((res) => {
            createOptionsInDisplayGroupSelectBox(res.data, 'displayGroup');
            new TomSelect('#displayGroup', {
                create: true, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
                maxOptions: null,
            });
        })
        .catch((err) => console.log(err));
}

fetchDisplayGroupForSite();

function fetchSiteForDisplayGroup(displayGroup) {
    let url = `${urlGetSiteByDisplayGroup}/${displayGroup}`;

    axios
        .get(url)
        .then((res) => {
            if (siteidSelect !== null) {
                siteidSelect.destroy();
            }
            createOptionsInSelectBox(res.data, 'site');
            siteidSelect = new TomSelect('#site', {
                create: true, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
                maxOptions: null,
            });
        })
        .catch((err) => console.log(err));
}

displayGroup.addEventListener('change', function (e) {
    fetchSiteForDisplayGroup(e.target.value);
});

site.addEventListener('change', function (e) {
    let url = `${urlGetSiteBySiteId}/${e.target.value}`;

    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                locationSite.value = fillDataIntoInputTag(res.data[0].Location);
                lat.value = fillDataIntoInputTag(res.data[0].Latitude);
                long.value = fillDataIntoInputTag(res.data[0].Longitude);
                loggerId.value = fillDataIntoInputTag(res.data[0].LoggerId);
                startDay.value = fillDataIntoInputTag(res.data[0].StartDay);
                startHour.value = fillDataIntoInputTag(res.data[0].StartHour);
                status.value = fillDataIntoInputTag(res.data[0].Status);
                pipeSize.value = fillDataIntoInputTag(res.data[0].PipeSize);
                available.value = fillDataIntoInputTag(res.data[0].Available);
                timeDelay.value = fillDataIntoInputTag(res.data[0].TimeDelay);
                note.value = fillDataIntoInputTag(res.data[0].Note);
                interval.value = fillDataIntoInputTag(res.data[0].InterVal);
                id.value = fillDataIntoInputTag(res.data[0]._id);
                typeMeter.value = fillDataIntoInputTag(res.data[0].TypeMeter);
                IMEI.value = fillDataIntoInputTag(res.data[0].IMEI);
            }
        })
        .catch((err) => console.log(err));
});

function SetEmptySite() {
    siteid.value = '';
    locationSite.value = '';
    lat.value = '';
    long.value = '';
    loggerId.value = '';
    startDay.value = '';
    startHour.value = '';
    status.value = '';
    pipeSize.value = '';
    available.value = '';
    timeDelay.value = '';
    note.value = '';
    id.value = '';
    isPrimayer.checked = false;
    MNF.value = '';
    typeMeter.value = '';
    IMEI.value = '';
}

let btnInsert = document.getElementById('btnInsert');

btnInsert.addEventListener('click', function (e) {
    if (
        siteid.value == null ||
        siteid.value == undefined ||
        siteid.value.trim() == ''
    ) {
        swal('Err', 'Please input point code', 'error');
    } else if (
        interval.value == null ||
        interval.value == undefined ||
        interval.value.trim() == ''
    ) {
        swal('Err', 'Not null timestapm', 'error');
    } else {
        const obj = {
            SiteId: CreateDataNullForPost(siteid.value),
            Location: CreateDataNullForPost(locationSite.value),
            Latitude: CreateDataNullForPost(lat.value),
            Longitude: CreateDataNullForPost(long.value),
            DisplayGroup: CreateDataNullForPost(displayGroup.value),
            LoggerId: CreateDataNullForPost(loggerId.value),
            StartDay: CreateDataNullForPost(startDay.value),
            StartHour: CreateDataNullForPost(startHour.value),
            Status: CreateDataNullForPost(status.value),
            PipeSize: CreateDataNullForPost(pipeSize.value),
            InterVal: CreateDataNullForPost(interval.value),
            Available: CreateDataNullForPost(available.value),
            TimeDelay: CreateDataNullForPost(timeDelay.value),
            Note: CreateDataNullForPost(note.value),
            IsPrimayer: false,
            MNF: null,
            TypeMeter: CreateDataNullForPost(typeMeter.value),
            IMEI: CreateDataNullForPost(IMEI.value),
        };

        let url = `${urlInsertSite}/`;

        axios
            .post(url, obj)
            .then((res) => {
                if (res.data != 0) {
                    swal('Done', 'Add success', 'success');
                    id.value = res.data;
                    fetchSiteForDisplayGroup(displayGroup.value);
                } else {
                    swal('Err', 'Add failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
});

let btnUpdate = document.getElementById('btnUpdate');
btnUpdate.addEventListener('click', function (e) {
    if (
        siteid.value == null ||
        siteid.value == undefined ||
        siteid.value.trim() == ''
    ) {
        swal('Err', 'Not null point code', 'error');
    } else if (
        interval.value == null ||
        interval.value == undefined ||
        interval.value.trim() == ''
    ) {
        swal('Err', 'Not null timestamp', 'error');
    } else {
        const obj = {
            id: CreateDataNullForPost(id.value),
            SiteId: CreateDataNullForPost(siteid.value),
            Location: CreateDataNullForPost(locationSite.value),
            Latitude: CreateDataNullForPost(lat.value),
            Longitude: CreateDataNullForPost(long.value),
            DisplayGroup: CreateDataNullForPost(displayGroup.value),
            LoggerId: CreateDataNullForPost(loggerId.value),
            StartDay: CreateDataNullForPost(startDay.value),
            StartHour: CreateDataNullForPost(startHour.value),
            Status: CreateDataNullForPost(status.value),
            PipeSize: CreateDataNullForPost(pipeSize.value),
            InterVal: CreateDataNullForPost(interval.value),
            Available: CreateDataNullForPost(available.value),
            TimeDelay: CreateDataNullForPost(timeDelay.value),
            Note: CreateDataNullForPost(note.value),
            IsPrimayer: false,
            MNF: null,
            TypeMeter: CreateDataNullForPost(typeMeter.value),
            IMEI: CreateDataNullForPost(IMEI.value),
        };

        let url = `${urlUpdateSite}`;

        axios
            .post(url, obj)
            .then((res) => {
                if (res.data != 0) {
                    swal('Done', 'Update success', 'success');
                    fetchSiteForDisplayGroup(displayGroup.value);
                } else {
                    swal('Err', 'Update failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
});

let btnDelete = document.getElementById('btnDelete');
btnDelete.addEventListener('click', function (e) {
    if (
        siteid.value == null ||
        siteid.value == undefined ||
        siteid.value.trim() == ''
    ) {
        swal('Err', 'Not null point code', 'error');
    } else {
        swal({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((willDelete) => {
            if (willDelete) {
                const obj = {
                    id: CreateDataNullForPost(id.value),
                };

                let url = `${urlDeleteSite}`;

                axios
                    .post(url, obj)
                    .then((res) => {
                        if (res.data != 0) {
                            swal('Done', 'Delete success', 'success');
                            SetEmptySite();
                            fetchSiteForDisplayGroup(displayGroup.value);
                        } else {
                            swal('Err', 'Delete failed', 'error');
                        }
                    })
                    .catch((err) => console.log(err));
            }
        });
    }
});

let map;

let marker;

map = L.map('map', {}).setView([3.103577, 101.702153], 12);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '',
    maxZoom: 18,
}).addTo(map);

map.on('click', onMapClick);
// hide map
document.getElementById('map').classList.add('hide');
function showMap() {
    let showMap = document.getElementById('map');
    if (showMap.classList.contains('hide')) {
        showMap.classList.remove('hide');
        showMap.classList.add('show');
    } else if (showMap.classList.contains('show')) {
        showMap.classList.remove('show');
        showMap.classList.add('hide');
    }
}

function onMapClick(e) {
    marker = L.marker(e.latlng).addTo(map);
    marker
        .bindPopup(
            `<strong>Location: ${marker.getLatLng().lat}, ${
                marker.getLatLng().lng
            }</strong>`,
        )
        .openPopup();
    long.value = marker.getLatLng().lng;
    lat.value = marker.getLatLng().lat;
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            marker = L.marker([
                position.coords.latitude,
                position.coords.longitude,
            ]).addTo(map);
            marker
                .bindPopup(
                    `<strong>Location: ${marker.getLatLng().lat}, ${
                        marker.getLatLng().lng
                    }</strong>`,
                )
                .openPopup();
            long.value = marker.getLatLng().lng;
            lat.value = marker.getLatLng().lat;
        });
    } else {
        swal('Err', 'Geolocation not support browers', 'error');
    }
}
