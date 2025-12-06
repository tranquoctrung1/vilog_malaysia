let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

let urlGetTabledDataCurrent = `${hostname}/GetTableDataCurrent/${userName}`;

let siteCardsContainer = document.getElementById('siteCardsContainer');

function getData() {
    axios
        .get(urlGetTabledDataCurrent)
        .then((res) => {
            res.data = res.data.sort((a, b) =>
                a.Location.localeCompare(b.Location),
            );

            renderCard(res.data);
        })
        .catch((err) => {
            console.error(err);
        });
}

function renderStatusChannelSU(data) {
    let content = ``;
    for (const item of data) {
        let status = 'status-success';
        let value = 'No';

        if (item.isDelay == true) {
            status = 'status-warning';
        } else if (item.isError === true) {
            status = 'status-danger';
            value = 'Yes';
        }

        if (item.Value === 1) {
            value = 'Yes';
        }

        if (item.ChannelName[0] === '1') {
            content += `<div class="channel-item">
                        <span class="channel-label">${item.ChannelName}</span>
                        <span class="channel-value ${status}">${value}</span>
                    </div>`;
        }
    }

    return content;
}

function renderValueChannelSU(data) {
    let content = ``;
    for (const item of data) {
        let status = 'status-success';
        let value = 'No';

        if (item.isDelay == true) {
            status = 'status-warning';
        } else if (item.isError === true) {
            status = 'status-danger';
        }

        if (item.ChannelName[0] === '2') {
            let channelSplit = item.ChannelId.split('_');
            if (channelSplit[channelSplit.length - 1] === '109') {
                let signal = '(Bad)';
                if (item.Value > 25) {
                    signal = '(Good)';
                } else if (item.Value > 20) {
                    signal = '(Medium)';
                }
                content += `<div class="channel-item">
                            <span class="channel-label">${item.ChannelName}</span>
                            <span class="channel-value ${status}">${item.Value} ${item.Unit} ${signal}</span>
                        </div>`;
            } else if (channelSplit[channelSplit.length - 1] === '110') {
                let battery = '(Bad)';
                if (item.Value > 3.6) {
                    battery = '(Good)';
                } else if (item.Value > 3.3) {
                    battery = '(Medium)';
                }
                content += `<div class="channel-item">
                            <span class="channel-label">${item.ChannelName}</span>
                            <span class="channel-value ${status}">${item.Value} ${item.Unit} ${battery}</span>
                        </div>`;
            } else {
                content += `<div class="channel-item">
                            <span class="channel-label">${item.ChannelName}</span>
                            <span class="channel-value ${status}">${item.Value} ${item.Unit}</span>
                        </div>`;
            }
        }
    }

    return content;
}

function renderValueChannelKronhe(data) {
    let content = ``;
    for (const item of data) {
        let status = 'status-success';
        let value = 'No';

        if (item.isDelay == true) {
            status = 'status-warning';
        } else if (item.isError === true) {
            status = 'status-danger';
        }

        let channelSplit = item.ChannelId.split('_');
        if (channelSplit[channelSplit.length - 1] === '07') {
            let signal = '(Bad)';
            if (item.Value > 25) {
                signal = '(Good)';
            } else if (item.Value > 20) {
                signal = '(Medium)';
            }
            content += `<div class="channel-item">
                            <span class="channel-label">${item.ChannelName}</span>
                            <span class="channel-value ${status}">${item.Value} ${item.Unit} ${signal}</span>
                        </div>`;
        } else if (channelSplit[channelSplit.length - 1] === '06') {
            let battery = '(Bad)';
            if (item.Value > 3.6) {
                battery = '(Good)';
            } else if (item.Value > 3.3) {
                battery = '(Medium)';
            }
            content += `<div class="channel-item">
                            <span class="channel-label">${item.ChannelName}</span>
                            <span class="channel-value ${status}">${item.Value} ${item.Unit} ${battery}</span>
                        </div>`;
        } else {
            content += `<div class="channel-item">
                            <span class="channel-label">${item.ChannelName}</span>
                            <span class="channel-value ${status}">${item.Value} ${item.Unit}</span>
                        </div>`;
        }
    }

    return content;
}

function renderCard(data) {
    let content = ``;

    for (const item of data) {
        let alarm = 'No';
        let status = 'Connected';
        let card = `card-status-info`;
        let tag = `tag-info`;
        let text = `text-info`;
        let latestUpdate = '';

        if (item.isDelay == true) {
            status = 'Disconnected';
            card = `card-status-warning`;
            tag = `tag-warning`;
            text = `text-warning`;
        } else if (item.isDelay === false && item.isError === true) {
            alarm = 'Yes';
            card = `card-status-danger`;
            status = 'Alarm';
            tag = `tag-danger`;
            text = `text-danger`;
        }

        if (item.ListChannel.length > 0) {
            latestUpdate = convertDateToString(
                convertDateFromApi(item.ListChannel[0].TimeStamp),
            );
        }

        if (item.TypeMeter === 'SU') {
            content += `<div class="col-lg-4 col-md-6 mb-4 site-card" data-status="${status}" data-alarm="${alarm}">
                <div class="card card-site-summary p-3 ${card}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="site-header ${text}">${
                                item.SiteId
                            }</div>
                            <div class="site-subheader">Sitename: ${
                                item.Location
                            } </div>
            <div class="site-subheader"> Last Update: <span class="fw-bold">${latestUpdate}</span></div>
                        </div>
                        <span class="status-tag ${tag}">${status}</span>
                    </div>

                    <hr class="my-3">

                    <div class="channel-group-header text-danger"><i class="fas fa-triangle-exclamation"></i> 1. Status & Alarm</div>

                    ${renderStatusChannelSU(item.ListChannel)}

                    <div class="channel-group-header text-primary"><i class="fas fa-chart-line"></i> 2. Flow & System</div>

                   ${renderValueChannelSU(item.ListChannel)}

                </div>
            </div>`;
        } else if (item.TypeMeter === 'Kronhe') {
            content += `<div class="col-lg-4 col-md-6 mb-4 site-card" data-status="${status}" data-alarm="${alarm}">
                <div class="card card-site-summary p-3 ${card}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="site-header ${text}">${
                                item.SiteId
                            }</div>
                            <div class="site-subheader">Sitename: ${
                                item.Location
                            } </div>
            <div class="site-subheader"> Last Update: <span class="fw-bold">${latestUpdate}</span></div>
                        </div>
                        <span class="status-tag ${tag}">${status}</span>
                    </div>

                    <hr class="my-3">
                    <div class="channel-group-header text-primary"><i class="fas fa-chart-line"></i>Flow & System</div>

                   ${renderValueChannelKronhe(item.ListChannel)}

                </div>
            </div>`;
        }
    }

    siteCardsContainer.innerHTML = content;
}

$(document).ready(function () {
    getData();
    // --- Filter logic ---
    $('#statusFilter').on('change', function () {
        const filterValue = $(this).val();
        const $cards = $('.site-card');
        $cards.hide();

        if (filterValue === 'all') {
            $cards.show();
        } else if (filterValue === 'Alarm') {
            $('.site-card[data-alarm="Yes"]').show();
        } else {
            $(`.site-card[data-status="${filterValue}"]`).show();
        }
    });

    // --- Search logic ---
    $('#searchSite').on(
        'keyup',
        debounce(function () {
            const searchText = $(this).val().toLowerCase();
            const $cards = $('.site-card');

            $cards.each(function () {
                const $card = $(this);
                const siteId = $card.find('.site-header').text().toLowerCase();
                const location = $card
                    .find('.site-subheader')
                    .text()
                    .toLowerCase();

                const currentStatusFilter = $('#statusFilter').val();
                let statusMatch = true;

                if (currentStatusFilter !== 'all') {
                    if (currentStatusFilter === 'Alarm') {
                        statusMatch = $card.data('alarm') === 'Yes';
                    } else {
                        statusMatch =
                            $card.data('status') === currentStatusFilter;
                    }
                }

                if (
                    statusMatch &&
                    (siteId.includes(searchText) ||
                        location.includes(searchText))
                ) {
                    $card.show();
                } else {
                    $card.hide();
                }
            });
        }, 1000),
    );

    // --- Click card logic ---
    $('.card-site-summary').on('click', function () {
        const siteId = $(this).find('.site-header').text();
    });
});

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
