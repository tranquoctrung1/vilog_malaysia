let infoHtml;
let dInfoHtml;
let labelHtml;
let dLabelHtml;
let img = '/images/green.png';
let isSetView = false;
let sites = [];

let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

let markers = [];

const urlGetSiteByUid = `${hostname}/GetSiteByUId/${userName}`;
const urlGetChannels = `${hostname}/GetChannelByLoggerId/`;
const urlGetCurrentTimeStamp = `${hostname}/GetCurrentTimeStamp`;
const urlGetDataMultipleChannel = `${hostname}/GetMultipleChannelData`;
const urlGetStatusSite = `${hostname}/GetStatusSite/${userName}`;

let totalSite = document.getElementById('totalSite');
let totalSiteHasValue = document.getElementById('totalSiteHasValue');
let totalSiteActing = document.getElementById('totalSiteActing');
let totalSiteDelay = document.getElementById('totalSiteDelay');
let totalSiteNoValue = document.getElementById('totalSiteNoValue');
let totalSiteAlarm = document.getElementById('totalSiteAlarm');

function initMap() {
    map = L.map('map', {
        contextmenu: true,
        contextmenuWidth: 140,
        contextmenuItems: [
            {
                text: 'Hide Lable',
                callback: hideLable,
            },
            {
                text: 'Show Lable',
                callback: showLable,
            },
            '-',
            {
                text: 'Zoom in',
                callback: zoomIn,
            },
            {
                text: 'Zoom out',
                callback: zoomOut,
            },
        ],
    });

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution:
            '<strong style="color: #0078a8">Copyright &copy by Bavitech</strong>',
        maxZoom: 18,
    }).addTo(map);

    axios
        .get(urlGetSiteByUid)
        .then(function (res) {
            sites = [...res.data];
            for (let site of res.data) {
                let logger = '';
                if (isSetView == false) {
                    if (
                        site.Latitude != null &&
                        site.Latitude != undefined &&
                        site.Longitude != null &&
                        site.Longitude != undefined
                    ) {
                        map.setView([site.Latitude, site.Longitude], 16);

                        isSetView = true;
                    }
                }

                if (
                    site.LoggerId != null &&
                    site.LoggerId != undefined &&
                    site.LoggerId.trim() != ''
                ) {
                    logger = site.LoggerId.trim();
                } else {
                    logger = 'nothing';
                }

                axios
                    .get(urlGetChannels + logger)
                    .then(function (res) {
                        let isErrorDelay = false;
                        let contentError = '';
                        labelHtml =
                            '<table cellspacing="0" cellpadding="0" style="width: 180px; font-size: 0.85rem"><tr><td colspan="2" style="text-align:center;font-weight:bold;color:blue;background-color:white; "><span>' +
                            site.Location +
                            '</span></td></tr>' +
                            `<tr><td colspan="2" style="text-align:center;font-weight:bold;color:red;background-color:white; "><marquee id="error-site${site.SiteId}"></marquee></td></tr>`;
                        infoHtml =
                            '<span style="font-weight:bold">Location: ' +
                            site.Location +
                            '</span>' +
                            '<br/><span>Logger Id: ' +
                            site.LoggerId +
                            '</span>' +
                            '</br><span>Index: ';
                        index = 0;
                        dLabelHtml = '';
                        dInfoHtml = '';
                        let checkStatusChannel = true;
                        let checkStatusValue = true;
                        for (let channel of res.data) {
                            if (channel.Status != null) {
                                switch (channel.Status) {
                                    case 1:
                                        img = '/images/green.png';
                                        break;
                                    case 2:
                                        if (isErrorDelay == false) {
                                            contentError += `${channel.ChannelName}: Data delay. `;
                                            isErrorDelay = true;
                                        }
                                        img = '/images/yellow.png';
                                        break;
                                    // case 3:
                                    //     img = '/images/oranges.png';
                                    //     contentError += `${channel.ChannelName}: Diff data previous day. `;
                                    //     break;
                                    // case 4:
                                    //     img = '/images/red.png';
                                    //     contentError += `${channel.ChannelName}: Over Threshold `;
                                    //     break;
                                    // case 9:
                                    //     img = '/images/oranges.png';
                                    //     contentError += `${channel.ChannelName}: Accquy not charging . `;
                                    //     break;
                                    // case 5:
                                    //     img = '/images/red.png';
                                    //     contentError += `${channel.ChannelName}: Low energy storage. `;
                                    //     break;
                                    // case 6:
                                    //     img = '/images/red.png';
                                    //     contentError += `${channel.ChannelName}: Stop worrking . `;
                                    //     break;
                                    // case 8:
                                    //     img = '/images/red.png';
                                    //     contentError += `${channel.ChannelName}: Performance is reduced `;
                                    //     break;

                                    default:
                                        img = '/images/green.png';
                                        break;
                                }
                            }

                            if (
                                channel.LastIndex != null &&
                                channel.LastIndex != 'undefined'
                            ) {
                                if (
                                    channel.ForwardFlow == true &&
                                    channel.ReverseFlow == false
                                ) {
                                    index += channel.LastIndex;
                                } else if (
                                    channel.ReverseFlow == true &&
                                    channel.ForwardFlow == false
                                ) {
                                    index -= channel.LastIndex;
                                }
                            }
                            strDate = convertDateToString(
                                convertDateFromApi(channel.TimeStamp),
                            );
                            if (
                                channel.LastValue != null &&
                                channel.LastValue != 'undefined'
                            ) {
                                val = channel.LastValue;
                            } else {
                                val = 'NO DATA';
                            }

                            if (channel.allowChart == true) {
                                if (site.TypeMeter === 'SU') {
                                    if (checkStatusChannel === true) {
                                        dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Status Flow Meter</td></tr>`;
                                        checkStatusChannel = false;
                                    }

                                    if (
                                        checkStatusChannel === false &&
                                        checkStatusValue === true
                                    ) {
                                        if (channel.ChannelName[0] === '2') {
                                            dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Mesurement Value</td></tr>`;
                                            checkStatusValue = false;
                                        }
                                    }

                                    if (channel.ChannelName[0] === '1') {
                                        if (val === 0) {
                                            val = 'No';
                                        } else {
                                            val = 'Yes';
                                        }
                                    }
                                } else if (site.TypeMeter === 'Kronhe') {
                                    if (
                                        channel.ChannelName[0] === '6' ||
                                        channel.OtherChannel === true
                                    ) {
                                        if (val <= 0) {
                                            val = 'No error';
                                        } else if (val === 1) {
                                            val = ' Flow measurement ';
                                        } else if (val === 2) {
                                            val = ' < 10% battery ';
                                        } else if (val === 4) {
                                            val = ' EEPROM error ';
                                        } else if (val === 8) {
                                            val = ' Communication error ';
                                        } else if (val === 16) {
                                            val = ' Empty pipe';
                                        } else if (val === 32) {
                                            val = 'Mains power failure ';
                                        }
                                    }
                                }
                                dInfoHtml +=
                                    '<tr><td> ' +
                                    channel.ChannelName +
                                    '</td>' +
                                    '<td style="text-align:right;color:red">' +
                                    val +
                                    '</td>' +
                                    '<td style="color:red">' +
                                    channel.Unit +
                                    '</td>' +
                                    '<td>' +
                                    strDate +
                                    '</td>' +
                                    `<td><a href="#"  style="
                padding: 3px;
                color: #30a0c1;
                box-shadow: 0 0 5px 0 rgb(0 0 0 / 20%);
                border-radius: 3px;" onclick="openChart('${channel.ChannelId}','${site.Location} ',' ${channel.ChannelName}','${channel.Unit}');"> <i class="fa fa-bar-chart" aria-hidden="true"></i> </a></td></tr>`;
                            } else {
                                dInfoHtml +=
                                    '<tr><td> ' +
                                    channel.ChannelName +
                                    '</td>' +
                                    '<td style="text-align:right;color:red">' +
                                    val +
                                    '</td>' +
                                    '<td style="color:red">' +
                                    channel.Unit +
                                    '</td>' +
                                    '<td>' +
                                    strDate +
                                    '</td>' +
                                    `</tr>`;
                            }

                            dLabelHtml +=
                                '<tr style="background-color:#3498db"><td style="text-align:center;font-weight:bold;color:white;"><span>' +
                                channel.ChannelName +
                                ': ' +
                                val +
                                ' (' +
                                channel.Unit +
                                ')' +
                                '</span></td><td style="text-align:right">' +
                                '' +
                                '</td></tr>';
                        }

                        dLabelHtml += '</table>';
                        labelHtml += dLabelHtml;
                        infoHtml +=
                            '<span style="font-weight:bold;color:blue;">' +
                            Math.round(Math.abs(index)) +
                            '</span></span>';
                        infoHtml +=
                            '<br/><table cellpadding="5" cellspacing="5">';
                        infoHtml += dInfoHtml;
                        //infoHtml += "<tr><td><a href=\"javascript:void(0);\" onclick=\"openChartMinMaxPre('" + s.LoggerId + "');\">MinMax Pressure Day</a></td></tr>"

                        +'</table>';

                        //LOAD TO MAP
                        var greenIcon = new L.Icon({
                            iconUrl: img,
                            iconSize: [20, 20],
                            iconAnchor: [
                                (site.LabelAnchorX = null
                                    ? 40
                                    : site.LabelAnchorX),
                                (site.LabelAnchorY = null
                                    ? 0
                                    : site.LabelAnchorY),
                            ],
                        });

                        let marker = new L.marker(
                            [
                                parseFloat(site.Latitude),
                                parseFloat(site.Longitude),
                            ],
                            { icon: greenIcon, id: `m_${site.SiteId}` },
                        )
                            .addTo(map)
                            .bindTooltip(labelHtml, {
                                interactive: true,
                                direction: 'bottom',
                                permanent: true,
                                offset: [10, 19],
                            })
                            .on('click', onMarkerClick);

                        let popUp = new L.Popup({
                            autoClose: false,
                            closeOnClick: false,
                            offset: [10, 8],
                        })
                            .setContent(infoHtml)
                            .setLatLng([
                                parseFloat(site.Latitude),
                                parseFloat(site.Longitude),
                            ]);

                        marker.bindPopup(popUp);

                        markers.push(marker);

                        document.getElementById(
                            `error-site${site.SiteId}`,
                        ).innerHTML = contentError;
                    })
                    .catch((err) => console.log(err));
            }
            // no site has lat and lon
            if (isSetView == false) {
                map.setView([10.823099, 106.629662], 11);
            }
        })
        .catch((err) => console.log(err));
}

function hideLable(e) {
    map.eachLayer(function (layer) {
        layer.closeTooltip();
    });
}

function showLable(e) {
    map.eachLayer(function (layer) {
        layer.openTooltip(layer._latlng);
    });
}

function zoomIn(e) {
    map.zoomIn();
}

function zoomOut(e) {
    map.zoomOut();
}

initMap();

function openMarker(e) {
    let id = e.dataset.site;
    map.eachLayer(function (layer) {
        if (layer.options.id == `m_${id}`) {
            layer.fire('click');
            map.panTo(layer._latlng);
        }
    });
}

function updateMap() {
    $.each(sites, function (i, site) {
        if (
            site.LoggerId != null &&
            site.LoggerId != undefined &&
            site.LoggerId.trim() != ''
        ) {
            logger = site.LoggerId.trim();
        } else {
            logger = 'nothing';
        }

        axios
            .get(urlGetChannels + logger)
            .then(function (res) {
                let isErrorDelay = false;
                let contentError = '';
                labelHtml =
                    '<table cellspacing="0" cellpadding="0" style="width: 180px; font-size: 0.85rem"><tr><td colspan="2" style="text-align:center;font-weight:bold;color:blue;background-color:white; "><span>' +
                    site.Location +
                    '</span></td></tr>' +
                    `<tr><td colspan="2" style="text-align:center;font-weight:bold;color:red;background-color:white; "><marquee id="error-site${site.SiteId}"></marquee></td></tr>`;
                infoHtml =
                    '<span style="font-weight:bold">Location: ' +
                    site.Location +
                    '</span>' +
                    '<br/><span>Logger Id: ' +
                    site.LoggerId +
                    '</span>' +
                    '</br><span>Index: ';
                index = 0;
                dLabelHtml = '';
                dInfoHtml = '';
                let checkStatusChannel = true;
                let checkStatusValue = true;
                for (let channel of res.data) {
                    if (channel.Status != null) {
                        switch (channel.Status) {
                            case 1:
                                img = '/images/green.png';
                                break;
                            case 2:
                                if (isErrorDelay == false) {
                                    contentError += `${channel.ChannelName}: Data delay. `;
                                    isErrorDelay = true;
                                }
                                img = '/images/yellow.png';
                                break;
                            // case 3:
                            //     img = '/images/oranges.png';
                            //     contentError += `${channel.ChannelName}: Diff data previous day. `;
                            //     break;
                            // case 4:
                            //     img = '/images/red.png';
                            //     contentError += `${channel.ChannelName}: Over threshold . `;
                            //     break;
                            // case 9:
                            //     img = '/images/oranges.png';
                            //     contentError += `${channel.ChannelName}: Accquy not charging. `;
                            //     break;
                            // case 5:
                            //     img = '/images/red.png';
                            //     contentError += `${channel.ChannelName}: Low energy storage. `;
                            //     break;
                            // case 6:
                            //     img = '/images/red.png';
                            //     contentError += `${channel.ChannelName}: Stop working. `;
                            //     break;
                            // case 7:
                            //   img = "/images/red.png";
                            //   contentError += `${channel.ChannelName}: Điện áp hàng ngày thấp. `;
                            //   break;
                            // case 8:
                            //     img = '/images/red.png';
                            //     contentError += `${channel.ChannelName}: Performance is reduced. `;
                            //     break;

                            default:
                                img = '/images/green.png';
                                break;
                        }
                    }

                    if (
                        channel.LastIndex != null &&
                        channel.LastIndex != 'undefined'
                    ) {
                        if (
                            channel.ForwardFlow == true &&
                            channel.ReverseFlow == false
                        ) {
                            index += channel.LastIndex;
                        } else if (
                            channel.ReverseFlow == true &&
                            channel.ForwardFlow == false
                        ) {
                            index -= channel.LastIndex;
                        }
                    }
                    strDate = convertDateToString(
                        convertDateFromApi(channel.TimeStamp),
                    );
                    if (
                        channel.LastValue != null &&
                        channel.LastValue != 'undefined'
                    ) {
                        val = channel.LastValue;
                    } else {
                        val = 'NO DATA';
                    }
                    if (channel.allowChart == true) {
                        if (site.TypeMeter === 'SU') {
                            if (checkStatusChannel === true) {
                                dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Status Flow Meter</td></tr>`;
                                checkStatusChannel = false;
                            }

                            if (
                                checkStatusChannel === false &&
                                checkStatusValue === true
                            ) {
                                if (channel.ChannelName[0] === '2') {
                                    dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Mesurement Value</td></tr>`;
                                    checkStatusValue = false;
                                }
                            }

                            if (channel.ChannelName[0] === '1') {
                                if (val === 0) {
                                    val = 'No';
                                } else {
                                    val = 'Yes';
                                }
                            }
                        } else if (site.TypeMeter === 'Kronhe') {
                            if (
                                channel.ChannelName[0] === '6' ||
                                channel.OtherChannel === true
                            ) {
                                if (val <= 0) {
                                    val = 'No error';
                                } else if (val === 1) {
                                    val = ' Flow measurement ';
                                } else if (val === 2) {
                                    val = ' < 10% battery ';
                                } else if (val === 4) {
                                    val = ' EEPROM error ';
                                } else if (val === 8) {
                                    val = ' Communication error ';
                                } else if (val === 16) {
                                    val = ' Empty pipe';
                                } else if (val === 32) {
                                    val = 'Mains power failure ';
                                }
                            }
                        }
                        dInfoHtml +=
                            '<tr><td> ' +
                            channel.ChannelName +
                            '</td>' +
                            '<td style="text-align:right;color:red">' +
                            val +
                            '</td>' +
                            '<td style="color:red">' +
                            channel.Unit +
                            '</td>' +
                            '<td>' +
                            strDate +
                            '</td>' +
                            `<td><a href="#"  style="
            padding: 3px;
            color: #30a0c1;
            box-shadow: 0 0 5px 0 rgb(0 0 0 / 20%);
            border-radius: 3px;" onclick="openChart('${channel.ChannelId}','${site.Location} ',' ${channel.ChannelName}','${channel.Unit}');"> <i class="fa fa-bar-chart" aria-hidden="true"></i> </a></td></tr>`;
                    } else {
                        dInfoHtml +=
                            '<tr><td> ' +
                            channel.ChannelName +
                            '</td>' +
                            '<td style="text-align:right;color:red">' +
                            val +
                            '</td>' +
                            '<td style="color:red">' +
                            channel.Unit +
                            '</td>' +
                            '<td>' +
                            strDate +
                            '</td>' +
                            `</tr>`;
                    }

                    dLabelHtml +=
                        '<tr style="background-color:#3498db"><td style="text-align:center;font-weight:bold;color:white;"><span>' +
                        channel.ChannelName +
                        ': ' +
                        val +
                        ' (' +
                        channel.Unit +
                        ')' +
                        '</span></td><td style="text-align:right">' +
                        '' +
                        '</td></tr>';
                }

                dLabelHtml += '</table>';
                labelHtml += dLabelHtml;
                infoHtml +=
                    '<span style="font-weight:bold;color:blue;">' +
                    Math.round(Math.abs(index)) +
                    '</span></span>';
                infoHtml += '<br/><table cellpadding="5" cellspacing="5">';
                infoHtml += dInfoHtml;
                //infoHtml += "<tr><td><a href=\"javascript:void(0);\" onclick=\"openChartMinMaxPre('" + s.LoggerId + "');\">MinMax Pressure Day</a></td></tr>"

                +'</table>';

                //LOAD TO MAP
                var greenIcon = new L.Icon({
                    iconUrl: img,
                    iconSize: [20, 20],
                    iconAnchor: [
                        (site.LabelAnchorX = null ? 40 : site.LabelAnchorX),
                        (site.LabelAnchorY = null ? 0 : site.LabelAnchorY),
                    ],
                });

                markers.forEach(function (marker) {
                    if (marker.options.id == `m_${site.SiteId}`) {
                        marker.setIcon(greenIcon);
                        marker.getPopup().setContent(infoHtml);
                        marker.getPopup().update();
                        marker.getTooltip().setContent(labelHtml);
                        marker.getTooltip().update();
                    }
                });
                document.getElementById(`error-site${site.SiteId}`).innerHTML =
                    contentError;
            })
            .catch((err) => console.log(err));
    });
}

let prevMarker;
function onMarkerClick(e) {
    if (prevMarker != null && prevMarker != undefined) {
        prevMarker.closePopup();
    }
    prevMarker = this;
}

function getStatusSite() {
    let url = `${urlGetStatusSite}`;

    axios
        .get(url)
        .then((res) => {
            totalSite.innerHTML = fillDataIntoInputTag(res.data.totalSite);
            totalSiteAlarm.innerHTML = fillDataIntoInputTag(
                res.data.totalSiteAlarm,
            );
            totalSiteNoValue.innerHTML = fillDataIntoInputTag(
                res.data.totalSiteNoValue,
            );
            totalSiteActing.innerHTML = fillDataIntoInputTag(
                res.data.totalSiteActing,
            );
            totalSiteDelay.innerHTML = fillDataIntoInputTag(
                res.data.totalSiteDelay,
            );
            totalSiteHasValue.innerHTML = fillDataIntoInputTag(
                res.data.totalSiteHasValue,
            );
        })
        .catch((err) => console(err));
}

setTimeout(() => {
    getStatusSite();
}, 500);

setInterval(updateMap, 1000 * 60 * 60);
