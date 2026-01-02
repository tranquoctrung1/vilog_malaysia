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
let statusSites = [];

const urlGetSiteByUid = `${hostname}/GetSiteByUId/${userName}`;
const urlGetChannels = `${hostname}/GetChannelByLoggerId/`;
const urlGetCurrentTimeStamp = `${hostname}/GetCurrentTimeStamp`;
const urlGetDataMultipleChannel = `${hostname}/GetMultipleChannelData`;
const urlGetStatusSite = `${hostname}/GetStatusSite/${userName}`;

let totalSite = document.getElementById('totalSite');
let totalSiteHasValue = document.getElementById('totalSiteHasValue');
let totalSiteDelay = document.getElementById('totalSiteDelay');
let totalSiteAlarm = document.getElementById('totalSiteAlarm');
let legend = document.getElementById('legend');
let tbodyStatistic = document.getElementById('tbodyStatistic');
let statisticLabel = document.getElementById('statisticLabel');

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

    L.Control.Watermark = L.Control.extend({
        onAdd: function (map) {
            return legend;
        },
        onRemove: function (map) {
            // Nothing to do here
        },
    });

    L.control.watermark = function (opts) {
        return new L.Control.Watermark(opts);
    };

    L.control.watermark({ position: 'bottomleft' }).addTo(map);

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
                            '<table cellspacing="0" cellpadding="0" style="min-width: 300px; font-size: 0.85rem"><tr><td colspan="2" style="text-align:center;font-weight:bold;color:black;background-color:white; "><span>' +
                            site.Location +
                            '</span></td></tr>' +
                            `<tr><td colspan="2" style="text-align:center;font-weight:bold;color:red;background-color:white; "><marquee id="error-site${site.SiteId}"></marquee></td></tr>`;
                        infoHtml =
                            '<span style="font-weight:bold">Sitename: ' +
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
                            if (channel.ChannelName.includes('Mem')) {
                                channel.ChannelName =
                                    channel.ChannelName.replace(
                                        'Mem',
                                        'Memory',
                                    );
                            } else if (channel.ChannelName.includes('Com')) {
                                channel.ChannelName =
                                    channel.ChannelName.replace('Com', 'Comm');
                            }
                            if (
                                channel.ChannelName.length > 3 &&
                                channel.ChannelName.charAt(3) === '.'
                            ) {
                                channel.ChannelName =
                                    channel.ChannelName.substring(0, 3) +
                                    channel.ChannelName.substring(4);
                            }
                            channel.ChannelName = capitalizeWords(
                                channel.ChannelName,
                            );
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
                                        dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Flow Meter Status</td></tr>`;
                                        checkStatusChannel = false;
                                    }

                                    if (
                                        checkStatusChannel === false &&
                                        checkStatusValue === true
                                    ) {
                                        if (channel.ChannelName[0] === '2') {
                                            dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Measurement Value</td></tr>`;
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
                                    `<td><span   style="
                padding: 3px;
                color: #30a0c1;
                box-shadow: 0 0 5px 0 rgb(0 0 0 / 20%);
                cursor: pointer;
                border-radius: 3px;" onclick="openChart('${channel.ChannelId}','${site.Location} ',' ${channel.ChannelName}','${channel.Unit}', '${site.TypeMeter}');"> <i class="fa fa-bar-chart" aria-hidden="true"></i> </span></td></tr>`;
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
                                '<tr style="background-color:#fff"><td style="font-weight:500;color:#636e72;"><span>' +
                                channel.ChannelName +
                                ': ' +
                                '</span></td>' +
                                '<td style="font-weight:500;color:#636e72;">' +
                                val +
                                ' (' +
                                channel.Unit +
                                ')' +
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
                    '<table cellspacing="0" cellpadding="0" style="min-width: 300px; font-size: 0.85rem"><tr><td colspan="2" style="text-align:center;font-weight:bold;color:black;background-color:white; "><span>' +
                    site.Location +
                    '</span></td></tr>' +
                    `<tr><td colspan="2" style="text-align:center;font-weight:bold;color:red;background-color:white; "><marquee id="error-site${site.SiteId}"></marquee></td></tr>`;
                infoHtml =
                    '<span style="font-weight:bold">Sitename: ' +
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
                    if (channel.ChannelName.includes('Mem')) {
                        channel.ChannelName = channel.ChannelName.replace(
                            'Mem',
                            'Memory',
                        );
                    } else if (channel.ChannelName.includes('Com')) {
                        channel.ChannelName = channel.ChannelName.replace(
                            'Com',
                            'Comm',
                        );
                    }
                    if (
                        channel.ChannelName.length > 3 &&
                        channel.ChannelName.charAt(3) === '.'
                    ) {
                        channel.ChannelName =
                            channel.ChannelName.substring(0, 3) +
                            channel.ChannelName.substring(4);
                    }
                    channel.ChannelName = capitalizeWords(channel.ChannelName);
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
                                dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Flow Meter Status</td></tr>`;
                                checkStatusChannel = false;
                            }

                            if (
                                checkStatusChannel === false &&
                                checkStatusValue === true
                            ) {
                                if (channel.ChannelName[0] === '2') {
                                    dInfoHtml += `<tr><td colspan="4"  style="color:red; text-align: center">Measurement Value</td></tr>`;
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
                            `<td><span  style="
            padding: 3px;
            color: #30a0c1;
            cursor: pointer;
            box-shadow: 0 0 5px 0 rgb(0 0 0 / 20%);
            border-radius: 3px;" onclick="openChart('${channel.ChannelId}','${site.Location} ',' ${channel.ChannelName}','${channel.Unit}', '${site.TypeMeter}');"> <i class="fa fa-bar-chart" aria-hidden="true"></i> </span></td></tr>`;
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
                        '<tr style="background-color:#fff"><td style="font-weight:500;color:#636e72;"><span>' +
                        channel.ChannelName +
                        ': ' +
                        '</span></td>' +
                        '<td style="font-weight:500;color:#636e72;">' +
                        val +
                        ' (' +
                        channel.Unit +
                        ')' +
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
            totalSiteDelay.innerHTML = fillDataIntoInputTag(
                res.data.totalSiteDelay,
            );
            totalSiteHasValue.innerHTML = fillDataIntoInputTag(
                res.data.totalSiteHasValue,
            );

            statusSites = res.data;
        })
        .catch((err) => console(err));
}

function renderTableStatistic(data, type) {
    if ($.fn.DataTable.isDataTable('#tableStatistic')) {
        $('#tableStatistic').DataTable().clear().destroy();
    }

    let content = ``;

    let hasContent = false;

    if (type === 'sites') {
        statisticLabel.innerHTML = `Site List: Total Sites`;
        if (data.sites.length > 0) {
            let temp = [];

            for (const item of data.siteDelay) {
                temp.push(item.SiteId);
                content += `<tr>
                            <td>${item.SiteId}</td>
                            <td>${item.Location}</td>
                            <td class="text-warning">Disconnected</td>
                            <td class="text-warning">Disconnected</td>
                        </tr>`;
                hasContent = true;
            }

            for (const item of data.siteAlarm) {
                const find = temp.find((el) => el === item.SiteId);
                if (find === undefined) {
                    temp.push(item.SiteId);
                    content += `<tr>
                            <td>${item.SiteId}</td>
                            <td>${item.Location}</td>
                            <td class="text-success">Connected</td>
                            <td class="text-danger">Alarm</td>
                        </tr>`;
                    hasContent = true;
                }
            }

            for (const item of data.siteHasValue) {
                const find = temp.find((el) => el === item.SiteId);
                if (find === undefined) {
                    temp.push(item.SiteId);
                    content += `<tr>
                            <td>${item.SiteId}</td>
                            <td>${item.Location}</td>
                            <td class="text-success">Connected</td>
                            <td class="text-info">Data Present</td>
                        </tr>`;
                    hasContent = true;
                }
            }
        } else {
            content += `<tr>
                            <td colspan="4">No Data Available</td>
                        </tr>`;
        }
    } else {
        if (data[type].length > 0) {
            let status = ``;
            let alarm = ``;
            let statusClassName = ``;
            let alarmClassName = ``;
            hasContent = true;

            if (type === 'siteHasValue') {
                status = `Connected`;
                alarm = `Data Present`;
                statusClassName = `text-success`;
                alarmClassName = `text-info`;
                statisticLabel.innerHTML = `Site List: Data Present`;
            } else if (type === 'siteDelay') {
                status = `Disconnected`;
                alarm = `Disconnected`;
                statusClassName = `text-warning`;
                alarmClassName = `text-warning`;
                statisticLabel.innerHTML = `Site List: Disconnected`;
            } else if (type === 'siteAlarm') {
                status = `Connected`;
                alarm = `Alarm`;
                statusClassName = `text-success`;
                alarmClassName = `text-danger`;
                statisticLabel.innerHTML = `Site List: Alarm`;
            }
            for (const item of data[type]) {
                content += `<tr>
                                <td>${item.SiteId}</td>
                                <td>${item.Location}</td>
                                <td class="${statusClassName}">${status}</td>
                                <td class="${alarmClassName}">${alarm}</td>
                            </tr>`;
            }
        } else {
            content += `<tr>
                            <td colspan="4">No Data Available</td>
                        </tr>`;
        }
    }

    tbodyStatistic.innerHTML = content;

    if (hasContent === true) {
        $('#tableStatistic').DataTable({
            language: {
                search: 'Search:',
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                paginate: { previous: 'Previous', next: 'Next' },
            },
            pageLength: 10,
            order: [[0, 'desc']],
            initComplete: function () {
                this.api()
                    .columns([0])
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
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excel',
                    text: '<i class="fas fa-file-excel me-1"></i> Excel',
                    className: 'btn btn-sm buttons-excel',
                    filename: `user_list`,
                },
                {
                    extend: 'csv',
                    text: '<i class="fas fa-file-csv me-1"></i> CSV',
                    className: 'btn btn-sm buttons-csv',
                    filename: `user_list`,
                },
                {
                    extend: 'pdf',
                    text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                    className: 'btn btn-sm buttons-pdf',
                    filename: `user_list`,
                },
            ],
        });
    }
}

function showStatistic(e) {
    renderTableStatistic(statusSites, e.dataset.status);
    $('#staictis').show();
}

function closeStatisticModal() {
    $('#staictis').hide();
}

function capitalizeWords(str) {
    return str
        .trim()
        .split(' ')
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

setTimeout(() => {
    getStatusSite();
}, 500);

setInterval(updateMap, 1000 * 60 * 2);
