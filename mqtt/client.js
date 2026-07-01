const mqtt = require('mqtt');
require('dotenv').config();
const ChannelModel = require('../model/Channel');
const SiteModel = require('../model/site');

const client = mqtt.connect(
    `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
);

let ioInstance = null;

const DEFAULT_TIME_DELAY_MINUTES = 60;
const MIN_STALE_CHECK_INTERVAL_MS = 30000;
const FALLBACK_STALE_CHECK_INTERVAL_MS = 60000;

// key: `${loggerId}_${channelId}` -> { TimeStamp, timeDelay, lastStatus }
const channelFreshnessCache = new Map();

function computeStatus(value, baseMin, baseMax) {
    if (value == null) {
        return 1;
    }
    if (baseMin != null && value < baseMin) {
        return 4;
    }
    if (baseMax != null && value > baseMax) {
        return 4;
    }
    return 1;
}

function checkStaleChannels() {
    const now = Date.now();

    for (const [key, entry] of channelFreshnessCache) {
        if (entry.lastStatus === 2) {
            continue;
        }

        const ageMs = now - new Date(entry.TimeStamp).getTime();
        if (ageMs > entry.timeDelay * 60000) {
            entry.lastStatus = 2;

            if (ioInstance) {
                ioInstance.emit('channel-status-update', {
                    loggerId: entry.loggerId,
                    ChannelId: entry.channelId,
                    Status: 2,
                });
            }
        }
    }
}

client.on('connect', () => {
    console.log('✅ MQTT connected');
    client.subscribe('Vilog_RealTime/#', (err) => {
        if (err) {
            console.error('❌ Failed to subscribe Vilog_RealTime/#:', err);
        }
    });
});

client.on('error', (err) => {
    console.error('❌ MQTT error:', err);
});

client.on('message', (topic, message) => {
    if (!topic.startsWith('Vilog_RealTime/')) {
        return;
    }

    (async () => {
        try {
            const parts = topic.split('/');
            const loggerId = parts[1];
            const payload = JSON.parse(message.toString());

            const [channel, site] = await Promise.all([
                ChannelModel.findOne({ ChannelId: payload.ChannelId }),
                SiteModel.findOne({ LoggerId: loggerId }),
            ]);

            if (!channel) {
                return;
            }

            const timeDelay =
                site != null &&
                site.TimeDelay != null &&
                site.TimeDelay !== 'null'
                    ? site.TimeDelay
                    : DEFAULT_TIME_DELAY_MINUTES;

            const status = computeStatus(
                payload.Value,
                channel.BaseMin,
                channel.BaseMax,
            );

            const cacheKey = `${loggerId}_${payload.ChannelId}`;
            channelFreshnessCache.set(cacheKey, {
                loggerId,
                channelId: payload.ChannelId,
                TimeStamp: payload.TimeStamp,
                timeDelay,
                lastStatus: status,
            });

            if (ioInstance) {
                ioInstance.emit('realtime-update', {
                    loggerId,
                    ...payload,
                    Status: status,
                });
            }
        } catch (err) {
            console.error('❌ Failed to process realtime MQTT payload:', err);
        }
    })();
});

function computeNextCheckDelayMs() {
    if (channelFreshnessCache.size === 0) {
        return FALLBACK_STALE_CHECK_INTERVAL_MS;
    }

    let minTimeDelay = Infinity;
    for (const entry of channelFreshnessCache.values()) {
        if (entry.timeDelay < minTimeDelay) {
            minTimeDelay = entry.timeDelay;
        }
    }

    // TimeDelay tính bằng phút; chu kỳ check = TimeDelay/60 phút
    // (vd TimeDelay=361 phút -> check mỗi ~6 phút), sàn ở MIN_STALE_CHECK_INTERVAL_MS
    // để tránh quét quá dày khi TimeDelay nhỏ.
    const checkIntervalMs = (minTimeDelay / 60) * 60000;
    return Math.max(checkIntervalMs, MIN_STALE_CHECK_INTERVAL_MS);
}

function scheduleNextStaleCheck() {
    checkStaleChannels();
    setTimeout(scheduleNextStaleCheck, computeNextCheckDelayMs());
}

scheduleNextStaleCheck();

function attachSocketIO(io) {
    ioInstance = io;
}

client.attachSocketIO = attachSocketIO;
client.computeStatus = computeStatus;
client.checkStaleChannels = checkStaleChannels;
client.computeNextCheckDelayMs = computeNextCheckDelayMs;
client.channelFreshnessCache = channelFreshnessCache;

module.exports = client;
