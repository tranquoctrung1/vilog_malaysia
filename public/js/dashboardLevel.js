let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

const urlGetStatusSite = `${hostname}/GetStatusSite/${userName}`;

const TANK_W = 150;
const TANK_H = 220;
const V_TOP = 18;
const V_BOTTOM = 18;
const V_HEIGHT = TANK_H - V_TOP - V_BOTTOM;

const tankStates = {};

function getWaterColor(level, base, warn) {
    if (level > base) return '#2196f3';
    if (level > warn) return '#ff9800';
    return '#f44336';
}

function lightenColor(hex, pct) {
    let num = parseInt(hex.replace('#', ''), 16);
    let amt = Math.round(2.55 * pct);
    let R = Math.min(255, Math.max(0, (num >> 16) + amt));
    let G = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    let B = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

function createWavePath(currentLevel, phase, amp, speed, offset, min, max) {
    const percent = Math.min(
        1,
        Math.max(0, (currentLevel - min) / (max - min)),
    );
    const baseY = V_TOP + V_HEIGHT - percent * V_HEIGHT;
    let d = `M 0 ${TANK_H}`;
    for (let x = 0; x <= TANK_W; x++) {
        let y = amp * Math.sin(x * 0.04 + phase * speed) + baseY + offset;
        d += ` L ${x} ${y}`;
    }
    d += ` L ${TANK_W} ${TANK_H} Z`;
    return d;
}

function drawRuler(rulerEl, min, max) {
    rulerEl.innerHTML = '';
    const range = max - min;

    let labelStep, tickStep, decimals;
    if (range <= 1) {
        labelStep = 0.2;
        tickStep = 0.04;
        decimals = 1;
    } else if (range <= 3) {
        labelStep = 0.5;
        tickStep = 0.1;
        decimals = 1;
    } else if (range <= 10) {
        labelStep = 1;
        tickStep = 0.2;
        decimals = 0;
    } else {
        labelStep = 2;
        tickStep = 0.5;
        decimals = 0;
    }

    const eps = tickStep * 0.01;
    for (
        let v = min;
        v <= max + eps;
        v = Math.round((v + tickStep) * 1e6) / 1e6
    ) {
        const percent = (v - min) / range;
        const y = V_TOP + V_HEIGHT - percent * V_HEIGHT;
        const isMajor =
            Math.round(v * 1e6) % Math.round(labelStep * 1e6) <
            Math.round(eps * 1e6) + 1;

        const tick = document.createElement('div');
        tick.className = 'tick' + (isMajor ? ' major' : '');
        tick.style.top = y + 'px';

        const line = document.createElement('div');
        line.className = 'tick-line';
        tick.appendChild(line);
        rulerEl.appendChild(tick);

        if (isMajor) {
            const label = document.createElement('div');
            label.className = 'tick-label';
            label.style.top = y + 'px';
            label.innerText = v.toFixed(decimals) + 'M';
            rulerEl.appendChild(label);
        }
    }
}

function startAnimation(id, min, max, base, warn) {
    const state = tankStates[id];
    if (!state || state.running) return;
    state.running = true;

    function frame() {
        if (!tankStates[id]) return;
        state.phase += 0.05;
        state.current += (state.target - state.current) * 0.05;

        const front = document.getElementById(`waveFront_${id}`);
        const back = document.getElementById(`waveBack_${id}`);
        const valueEl = document.getElementById(`tankValue_${id}`);
        if (!front || !back) return;

        const color = getWaterColor(state.current, base, warn);
        front.setAttribute('fill', color);
        back.setAttribute('fill', lightenColor(color, 40));
        front.setAttribute(
            'd',
            createWavePath(state.current, state.phase, 2, 1.2, 0, min, max),
        );
        back.setAttribute(
            'd',
            createWavePath(state.current, state.phase, 4, 0.8, 2, min, max),
        );
        if (valueEl) valueEl.innerText = state.current.toFixed(2) + ' M';

        requestAnimationFrame(frame);
    }
    frame();
}

function createCard(
    id,
    name,
    level,
    min,
    max,
    base,
    warn,
    signal,
    battery,
    isDisconnected,
    isAlarm,
) {
    const sig = signal != null ? parseInt(signal) : null;
    const sigPct =
        sig != null && sig > 0 ? Math.min(100, (sig / 50) * 100) : -1;
    const sigColor =
        sigPct < 0
            ? '#aaa'
            : sigPct < 40
              ? '#dc3545'
              : sigPct < 60
                ? '#ffc107'
                : '#198754';

    let statusHtml;
    if (isDisconnected) {
        statusHtml = '<span class="status-tag tag-warning">Disconnected</span>';
    } else if (isAlarm) {
        statusHtml = '<span class="status-tag tag-danger">Alarm</span>';
    } else {
        statusHtml = '<span class="status-tag tag-success">Normal</span>';
    }

    const col = document.createElement('div');
    col.className = 'col-12 col-md-4';
    col.innerHTML = `
    <div class="tank-card">
        <div class="tank-site-name">${name}</div>
        <div class="tank-wrapper">
            <div class="tank">
                <svg width="${TANK_W}" height="${TANK_H}">
                    <defs>
                        <clipPath id="clipTank_${id}">
                            <rect x="0" y="0" width="${TANK_W}" height="${TANK_H}" rx="80" ry="30"></rect>
                        </clipPath>
                    </defs>
                    <g clip-path="url(#clipTank_${id})">
                        <path id="waveBack_${id}"></path>
                        <path id="waveFront_${id}"></path>
                    </g>
                </svg>
            </div>
            <div class="ruler" id="ruler_${id}"></div>
        </div>
        <div class="tank-value" id="tankValue_${id}">${level.toFixed(2)} M</div>
        <div id="tankStatus_${id}">${statusHtml}</div>
        <div class="tank-meta">
            <span><i class="fas fa-signal" style="color:${sigColor}"></i> <span id="tankSignalText_${id}">${sig != null ? sig + ' dB' : '--'}</span></span>
            <span><i class="fas fa-battery-half" style="color:#198754"></i> <span id="tankBatteryText_${id}">${battery != null ? parseFloat(battery).toFixed(1) + ' V' : '--'}</span></span>
        </div>
    </div>`;
    return col;
}

function renderCards(data) {
    const container = document.getElementById('levelCardsContainer');
    if (!container) return;

    const levelSites = data.sites.filter((s) => s.SiteId === '001');
    if (levelSites.length === 0) {
        container.innerHTML = '<p class="text-muted">No Level sites found.</p>';
        return;
    }

    container.innerHTML = '';

    for (const site of levelSites) {
        const id = site.SiteId;

        const levelChannel = site.ListChannel.find(
            (c) => c.ChannelId === `${site.LoggerId}_200`,
        );
        const batteryChannel = site.ListChannel.find(
            (c) => c.ChannelId === `${site.LoggerId}_05`,
        );
        const signalChannel = site.ListChannel.find(
            (c) => c.ChannelId === `${site.LoggerId}_07`,
        );

        const min = levelChannel?.BaseMin != null ? levelChannel.BaseMin : 0;
        const max =
            levelChannel?.BaseMax != null && levelChannel.BaseMax > min
                ? levelChannel.BaseMax
                : 7;
        const base =
            levelChannel?.BaseLine != null ? levelChannel.BaseLine : max * 0.5;
        const warn = (base + min) / 3;

        const level = levelChannel?.LastValue ?? 0;
        const battery = batteryChannel?.LastValue ?? null;
        const signal = signalChannel?.LastValue ?? null;

        const isDisconnected = data.siteDelay.some((s) => s.SiteId === id);
        const isAlarm = data.siteAlarm.some((s) => s.SiteId === id);

        tankStates[id] = {
            current: level,
            target: level,
            phase: 0,
            running: false,
        };

        const col = createCard(
            id,
            site.Location || id,
            level,
            min,
            max,
            base,
            warn,
            signal,
            battery,
            isDisconnected,
            isAlarm,
        );
        container.appendChild(col);
        drawRuler(document.getElementById(`ruler_${id}`), min, max);
        startAnimation(id, min, max, base, warn);
    }
}

let levelData = null;

function fetchData() {
    axios
        .get(urlGetStatusSite)
        .then((res) => {
            if (res?.data) {
                levelData = res.data;
                renderCards(res.data);
            }
        })
        .catch((err) => console.error(err));
}

document.addEventListener('DOMContentLoaded', fetchData);

function getSiteBucketLevel(channelList) {
    if (!channelList || channelList.length <= 0) {
        return 'siteDelay';
    }
    if (channelList.some((c) => c.Status === 2)) {
        return 'siteDelay';
    }
    if (channelList.some((c) => c.Status === 4)) {
        return 'siteAlarm';
    }
    return 'siteHasValue';
}

function applyRealtimeToDashboardLevel(loggerId, channelId, value, timeStamp, status) {
    if (!levelData) {
        return;
    }

    const site = levelData.sites.find(
        (s) => (s.LoggerId || '').trim() === loggerId,
    );
    if (!site || !tankStates[site.SiteId]) {
        return;
    }

    const id = site.SiteId;
    const channel = site.ListChannel.find((c) => c.ChannelId === channelId);
    if (!channel) {
        return;
    }

    if (value !== undefined) {
        channel.LastValue = value;
    }
    channel.Status = status;

    if (channelId === `${loggerId}_200`) {
        tankStates[id].target = value;
    } else if (channelId === `${loggerId}_07`) {
        const el = document.getElementById(`tankSignalText_${id}`);
        if (el) {
            el.innerText = value != null ? value + ' dB' : '--';
        }
    } else if (channelId === `${loggerId}_05`) {
        const el = document.getElementById(`tankBatteryText_${id}`);
        if (el) {
            el.innerText =
                value != null ? parseFloat(value).toFixed(1) + ' V' : '--';
        }
    }

    const bucket = getSiteBucketLevel(site.ListChannel);

    [levelData.siteDelay, levelData.siteAlarm, levelData.siteHasValue].forEach(
        (list) => {
            const idx = list.findIndex((s) => s.SiteId === id);
            if (idx !== -1) {
                list.splice(idx, 1);
            }
        },
    );
    if (bucket === 'siteDelay') {
        levelData.siteDelay.push(site);
    } else if (bucket === 'siteAlarm') {
        levelData.siteAlarm.push(site);
    } else {
        levelData.siteHasValue.push(site);
    }

    const statusEl = document.getElementById(`tankStatus_${id}`);
    if (statusEl) {
        if (bucket === 'siteDelay') {
            statusEl.innerHTML =
                '<span class="status-tag tag-warning">Disconnected</span>';
        } else if (bucket === 'siteAlarm') {
            statusEl.innerHTML =
                '<span class="status-tag tag-danger">Alarm</span>';
        } else {
            statusEl.innerHTML =
                '<span class="status-tag tag-success">Normal</span>';
        }
    }
}

const dashboardLevelSocket = io();

dashboardLevelSocket.on('realtime-update', function (data) {
    if (!data || !data.loggerId || !data.ChannelId) {
        return;
    }

    applyRealtimeToDashboardLevel(
        data.loggerId,
        data.ChannelId,
        data.Value,
        data.TimeStamp,
        data.Status,
    );
});

dashboardLevelSocket.on('channel-status-update', function (data) {
    if (!data || !data.loggerId || !data.ChannelId || data.Status == null) {
        return;
    }

    applyRealtimeToDashboardLevel(
        data.loggerId,
        data.ChannelId,
        undefined,
        undefined,
        data.Status,
    );
});
