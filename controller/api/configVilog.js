const SiteModel = require('../../model/site');
const mongoose = require('mongoose');
const client = require('../../mqtt/client');
const ConfigVilogModel = require('../../model/ConfigVilog');

require('dotenv').config();

// sendTime label -> AT+TDC seconds. Unknown labels are rejected (400) instead
// of silently falling back to a default interval.
const SEND_TIME_SECONDS = {
    '1m': 60,
    '5m': 300,
    '10m': 600,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '2h': 7200,
    '3h': 10800,
    '4h': 14400,
    '6h': 21600,
    '12h': 43200,
    '24h': 86400,
};

// logTime label -> minutes.
const LOG_TIME_MINUTES = {
    '1m': 1,
    '2m': 2,
    '3m': 3,
    '5m': 5,
    '6m': 6,
    '10m': 10,
    '15m': 15,
    '30m': 30,
    '60m': 60,
};

const MAX_SEND_LOG_RATIO = 14;

// Characters that would break the MQTT topic or let a value smuggle extra AT
// commands into the payload (';' ends a command, '{' '}' frame a chunk, '#'
// '+' are topic wildcards). New SiteId/Location values also go inside
// AT+SUBTOPIC=..., so ',', '=' and '"' are refused there too, and '_' because
// the MQTT_Vilog ingester splits Vilog_<Site>_<ID>_PUB on '_' (a renamed
// device with '_' in its new name would be ignored).
const UNSAFE_TOPIC_CHARS = /[;{}#+\x00-\x1f]/;
const UNSAFE_NEW_VALUE_CHARS = /[;{}#+,="_\x00-\x1f]/;
const MAX_FIELD_LENGTH = 64;

// Device clock is Malaysia local time (UTC+8, no DST). Computed from an
// explicit offset so the result doesn't depend on the server's time zone.
const DEVICE_UTC_OFFSET_HOURS = Number(process.env.VILOG_UTC_OFFSET_HOURS || 8);

function getDataLoggerModel(collectionSuffix) {
    const DataLoggerSchema = new mongoose.Schema({
        TimeStamp: Date,
        Value: Number,
    });

    delete mongoose.models.DataLogger;

    return mongoose.model(
        'DataLogger',
        DataLoggerSchema,
        't_Data_Logger_' + collectionSuffix,
    );
}

// TypeMeter is stored empty/null for legacy "Level" sites — same rule as the
// client's normalizeTypeMeter (public/js/util.js).
function normalizeTypeMeter(raw) {
    const trimmed = raw == null ? '' : raw.toString().trim();
    const isEmpty =
        trimmed === '' ||
        trimmed.toLowerCase() === 'null' ||
        trimmed.toLowerCase() === 'undefined' ||
        trimmed === '-';
    return isEmpty ? 'Level' : trimmed;
}

// Rounds a measured interval (minutes) before it is sent to the client.
// Below 8 minutes the measured 1-minute resolution is kept so the short
// options (1/2/3/5/6) each round-trip to their own value; at/above 8 every
// option is a multiple of 5, so round-to-5 absorbs timestamp jitter. Values
// that still match no option (e.g. 10 or 1440) are shown by the client as
// "not in list" instead of being snapped to a neighbour.
function roundToNearestOption(minutes) {
    if (minutes < 8) {
        return Math.round(minutes);
    }
    return Math.round(minutes / 5) * 5;
}

// Walks the newest docs (newest first) and returns the first gap between
// consecutive docs that is > 0 and <= thresholdMinutes, checking at most
// maxAttempts pairs. Returns null if none qualify.
async function computeDiffMinutesWithRetry(
    collectionSuffix,
    thresholdMinutes,
    maxAttempts = 5,
) {
    const DataLogger = getDataLoggerModel(collectionSuffix);

    const docs = await DataLogger.find({ TimeStamp: { $ne: null } })
        .sort({ TimeStamp: -1 })
        .limit(maxAttempts + 1)
        .select('TimeStamp')
        .lean();

    for (let i = 0; i < docs.length - 1; i++) {
        const diffMs = docs[i].TimeStamp - docs[i + 1].TimeStamp;
        const diffMinutes = Math.round(diffMs / 60000);

        if (diffMinutes > 0 && diffMinutes <= thresholdMinutes) {
            return diffMinutes;
        }
    }

    return null;
}

function getSignalChannelSuffix(typeMeter) {
    if (typeMeter === 'SU') return '109';
    if (
        typeMeter === 'Kronhe' ||
        typeMeter === 'MAG8000' ||
        typeMeter === 'Level'
    ) {
        return '07';
    }
    return null;
}

module.exports.GetLoggingTimeVilog = async (req, res) => {
    try {
        const siteid = req.params.siteid;

        const sites = await SiteModel.find({ SiteId: siteid });

        if (sites.length > 0) {
            const channelForward = sites[0].LoggerId + '_02';

            const diffMinutes = await computeDiffMinutesWithRetry(
                channelForward,
                360,
                5,
            );

            if (diffMinutes === null) {
                res.status(200).json(15);
            } else {
                res.status(200).json(roundToNearestOption(diffMinutes));
            }
        } else {
            res.status(200).json(15);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports.GetSendTimeVilog = async (req, res) => {
    try {
        const siteid = req.params.siteid;

        const sites = await SiteModel.find({ SiteId: siteid });

        if (sites.length > 0) {
            const signalSuffix = getSignalChannelSuffix(
                normalizeTypeMeter(sites[0].TypeMeter),
            );

            let diffMinutes = null;

            if (signalSuffix !== null) {
                const channelSignal = sites[0].LoggerId + '_' + signalSuffix;

                // 1500 (> 24h) so a stopped logger (AT+TDC=86400) is still
                // measured as 1440 instead of falling back to a default.
                diffMinutes = await computeDiffMinutesWithRetry(
                    channelSignal,
                    1500,
                    5,
                );
            }

            if (diffMinutes === null) {
                const timeDelay = sites[0].TimeDelay;

                if (timeDelay !== undefined && timeDelay !== null) {
                    res.status(200).json(roundToNearestOption(timeDelay));
                } else {
                    res.status(200).json(15);
                }
            } else {
                res.status(200).json(roundToNearestOption(diffMinutes));
            }
        } else {
            res.status(200).json(15);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

function writeCommand(cmdCode, data) {
    const msg = `AT+CFGDEV=01 06 01 ${cmdCode} ${data},1;`;
    return msg;
}

function toHex2(value, isYear = false) {
    if (isYear) {
        // 2-byte register value: 2026 -> "07 EA"
        const hex = value.toString(16).toUpperCase().padStart(4, '0');
        return hex.match(/.{2}/g).join(' ');
    }

    return value.toString(16).toUpperCase().padStart(2, '0');
}

// Packs commands into {...} chunks of at most maxLength chars (the trailing
// ';' of the last command in a chunk is dropped). A single command longer
// than maxLength goes out alone rather than producing an empty chunk.
function mergeStringsByLength(arr, maxLength = 140) {
    const result = [];
    let current = '';

    for (const s of arr) {
        if (current.length > 0 && current.length + s.length > maxLength) {
            result.push(`{${current.slice(0, -1)}}`);
            current = '';
        }

        current += s;
    }

    if (current.length > 0) {
        result.push(`{${current.slice(0, -1)}}`);
    }

    return result;
}

function buildTopicLocation(location, typeMeter) {
    return typeMeter === 'MAG8000' ? `MAG_${location}` : location;
}

// Device-local wall clock (UTC + DEVICE_UTC_OFFSET_HOURS) for a given instant.
function getDeviceClock(date) {
    const local = new Date(date.getTime() + DEVICE_UTC_OFFSET_HOURS * 3600000);
    return {
        year: local.getUTCFullYear(),
        month: local.getUTCMonth() + 1,
        day: local.getUTCDate(),
        hour: local.getUTCHours(),
        minute: local.getUTCMinutes(),
    };
}

function isStringField(value) {
    return typeof value === 'string' && value.length <= MAX_FIELD_LENGTH;
}

// Validates the target device fields shared by UpdateConfigVilog and
// StopLoggingVilog. Returns an error message, or null when safe to use.
function validateTarget(data) {
    if (!data || !isStringField(data.oldSiteId) || data.oldSiteId === '') {
        return 'Invalid oldSiteId';
    }
    if (!isStringField(data.oldLocation) || data.oldLocation === '') {
        return 'Invalid oldLocation';
    }
    if (
        UNSAFE_TOPIC_CHARS.test(data.oldSiteId) ||
        UNSAFE_TOPIC_CHARS.test(data.oldLocation)
    ) {
        return 'oldSiteId/oldLocation contain invalid characters';
    }
    if (data.typeMeter != null && !isStringField(data.typeMeter)) {
        return 'Invalid typeMeter';
    }
    return null;
}

function validateUpdate(data) {
    const targetError = validateTarget(data);
    if (targetError) return targetError;

    for (const field of ['siteId', 'location', 'sendTime', 'logTime']) {
        if (!isStringField(data[field])) {
            return `Invalid ${field}`;
        }
    }
    if (
        UNSAFE_NEW_VALUE_CHARS.test(data.siteId) ||
        UNSAFE_NEW_VALUE_CHARS.test(data.location)
    ) {
        return 'Site Id / SiteName must not contain ; { } # + , = " _ characters';
    }
    if (data.sendTime !== '' && !(data.sendTime in SEND_TIME_SECONDS)) {
        return `Unsupported sendTime: ${data.sendTime}`;
    }
    if (data.logTime !== '' && !(data.logTime in LOG_TIME_MINUTES)) {
        return `Unsupported logTime: ${data.logTime}`;
    }
    return null;
}

function buildRenameCommands(siteId, location, typeMeter) {
    const newLocation = buildTopicLocation(location, typeMeter);
    return [
        `AT+SUBTOPIC=Vilog_${newLocation}_${siteId}_SUB;`,
        `AT+PUBTOPIC=Vilog_${newLocation}_${siteId}_PUB;`,
    ];
}

// Every command for a device goes to the same retained _SUB topic, so a new
// publish replaces whatever the device has not read yet. If the latest
// pending config for this topic is a rename (MQTT_Vilog marks it complete
// only once data arrives on the new topic), it must be re-sent with the new
// command or the rename is silently lost. Returns {siteId, location} or null.
async function findPendingRename(oldSiteId, oldLocation) {
    const pending = await ConfigVilogModel.findOne({
        oldSiteId,
        oldLocation,
        isComplete: false,
    })
        .sort({ _id: -1 })
        .lean();
    if (!pending || !pending.siteId || !pending.location) return null;
    if (pending.siteId === oldSiteId && pending.location === oldLocation) {
        return null;
    }
    return { siteId: pending.siteId, location: pending.location };
}

// A renamed device must not take a SiteId already used by another site (or
// already promised to another device by a pending rename): MQTT_Vilog would
// merge both loggers' sites/channels/data under the same id.
async function findSiteIdConflict(data) {
    if (data.siteId === data.oldSiteId) return null;
    const usedBySite = await SiteModel.exists({
        $or: [{ SiteId: data.siteId }, { LoggerId: data.siteId }],
    });
    if (usedBySite) {
        return `Site Id ${data.siteId} is already used by another site`;
    }
    const usedByPending = await ConfigVilogModel.exists({
        siteId: data.siteId,
        isComplete: false,
        oldSiteId: { $ne: data.oldSiteId },
    });
    if (usedByPending) {
        return `Site Id ${data.siteId} is already pending for another logger`;
    }
    return null;
}

function publishAsync(topic, message) {
    return new Promise((resolve, reject) => {
        client.publish(topic, message, { qos: 1, retain: true }, (err) =>
            err ? reject(err) : resolve(),
        );
    });
}

module.exports.UpdateConfigVilog = async (req, res) => {
    try {
        const data = req.body;

        const validationError = validateUpdate(data);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        if (!client.connected) {
            return res.status(500).json({ error: 'MQTT not connected' });
        }

        const typeMeter = normalizeTypeMeter(data.typeMeter);

        const topic = `Vilog_${buildTopicLocation(data.oldLocation, typeMeter)}_${data.oldSiteId}_SUB`;

        let stringMqtt = [];

        let checkChangeTime = false;

        let carriedRename = null;
        if (data.siteId !== '' && data.location !== '') {
            const conflict = await findSiteIdConflict(data);
            if (conflict) {
                return res.status(400).json({ error: conflict });
            }
        } else {
            carriedRename = await findPendingRename(
                data.oldSiteId,
                data.oldLocation,
            );
            if (carriedRename) {
                data.siteId = carriedRename.siteId;
                data.location = carriedRename.location;
            }
        }

        if (data.siteId !== '' && data.location !== '') {
            stringMqtt.push(
                ...buildRenameCommands(data.siteId, data.location, typeMeter),
            );
        }

        if (data.sendTime !== '') {
            stringMqtt.push(`AT+TDC=${SEND_TIME_SECONDS[data.sendTime]};`);
            checkChangeTime = true;
        }

        if (typeMeter === 'SU') {
            if (data.logTime !== '') {
                // Aichi Tokei (SU) intervalLogTime is a plain 2-byte hex
                // encoding of the raw minute value (reference: VilogLDC
                // SerialCom/Form1.vb Config(), Aichi Tokei branch).
                const logTimeMinutes = LOG_TIME_MINUTES[data.logTime];
                const intervalLogTime = toHex2(logTimeMinutes, true);

                const now = getDeviceClock(new Date());
                // Logging starts at the next full hour. Derived from now+1h
                // so the date also rolls over correctly at 23:xx.
                const start = getDeviceClock(new Date(Date.now() + 3600000));

                stringMqtt.push(writeCommand('0B', toHex2(now.year, true)));
                stringMqtt.push(
                    writeCommand('0C', `${toHex2(now.month)} ${toHex2(now.day)}`),
                );
                stringMqtt.push(
                    writeCommand(
                        '0D',
                        `${toHex2(now.hour)} ${toHex2(now.minute)}`,
                    ),
                );

                stringMqtt.push(writeCommand('01', toHex2(start.year, true)));
                stringMqtt.push(
                    writeCommand(
                        '02',
                        `${toHex2(start.month)} ${toHex2(start.day)}`,
                    ),
                );
                stringMqtt.push(writeCommand('03', `${toHex2(start.hour)} 00`));

                stringMqtt.push(writeCommand('04', intervalLogTime));

                // Reference: VilogLDC SerialCom/Form1.vb Config(), Aichi Tokei
                // branch also sends this alongside the CFGDEV 0x04 hex write.
                stringMqtt.push(`AT+CLOCKLOG=1,${logTimeMinutes},0,0;`);

                checkChangeTime = true;
            }
        } else if (
            typeMeter === 'Kronhe' ||
            typeMeter === 'MAG8000' ||
            typeMeter === 'Level'
        ) {
            // Kronhe, MAG8000 (Siemens MAG8000) and Level (Bavitech BVT) all
            // use the same AT+CLOCKLOG=1,0,<logTime>,<setTime> command
            // (reference: VilogLDC SerialCom/Form1.vb Config(), Krohne/Siemens
            // MAG8000/Level Sensor branches).
            if (data.sendTime !== '' && data.logTime !== '') {
                const timeSend = SEND_TIME_SECONDS[data.sendTime] / 60;
                const timeLog = LOG_TIME_MINUTES[data.logTime];

                const setTime = timeSend / timeLog;

                // setTime is written straight into the device AT+CLOCKLOG
                // command as a whole count of log samples per send; a
                // fractional, zero or > 14 value would misconfigure the
                // logger in the field, so refuse before publishing anything.
                if (
                    !Number.isInteger(setTime) ||
                    setTime < 1 ||
                    setTime > MAX_SEND_LOG_RATIO
                ) {
                    return res.status(400).json({
                        error: `Send Time / Log Time must be a whole number between 1 and ${MAX_SEND_LOG_RATIO} (got ${data.sendTime} / ${data.logTime})`,
                    });
                }

                stringMqtt.push(`AT+CLOCKLOG=1,0,${timeLog},${setTime};`);
                checkChangeTime = true;
            }
        }

        if (checkChangeTime === true) {
            stringMqtt.push(`ATZ;`);
        }

        if (stringMqtt.length === 0) {
            return res.status(400).json({ error: 'Nothing to change' });
        }

        const result = mergeStringsByLength(stringMqtt, 150);

        for (const item of result) {
            await publishAsync(topic, item);
        }

        // Pending config record. MQTT_Vilog flips isComplete once the device
        // has applied it (and clears the retained _SUB message).
        await ConfigVilogModel.create({
            oldSiteId: data.oldSiteId,
            oldLocation: data.oldLocation,
            siteId: data.siteId,
            location: data.location,
            typeMeter: typeMeter,
            logTime: data.logTime,
            sendTime: data.sendTime,
            isComplete: false,
            publishedAt: new Date(),
        });

        res.status(200).json(
            carriedRename ? { result: 1, pendingRename: carriedRename } : 1,
        );
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports.StopLoggingVilog = async (req, res) => {
    try {
        const data = req.body;

        const validationError = validateTarget(data);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        if (!client.connected) {
            return res.status(500).json({ error: 'MQTT not connected' });
        }

        const typeMeter = normalizeTypeMeter(data.typeMeter);

        const topic = `Vilog_${buildTopicLocation(data.oldLocation, typeMeter)}_${data.oldSiteId}_SUB`;

        // Keep a pending rename in the retained message (see findPendingRename).
        const carriedRename = await findPendingRename(
            data.oldSiteId,
            data.oldLocation,
        );

        const stringMqtt = carriedRename
            ? buildRenameCommands(
                  carriedRename.siteId,
                  carriedRename.location,
                  typeMeter,
              )
            : [];
        // Same AT+TDC + ATZ sequence UpdateConfigVilog uses for a send-time
        // change, so the 24h interval is applied the same way.
        stringMqtt.push(`AT+TDC=${SEND_TIME_SECONDS['24h']};`);
        stringMqtt.push(`ATZ;`);

        for (const item of mergeStringsByLength(stringMqtt, 150)) {
            await publishAsync(topic, item);
        }

        // Recorded like a send-time change so MQTT_Vilog clears the retained
        // stop command once the device has picked it up (before, it stayed
        // retained forever and was re-applied on every wake-up).
        await ConfigVilogModel.create({
            oldSiteId: data.oldSiteId,
            oldLocation: data.oldLocation,
            siteId: carriedRename ? carriedRename.siteId : '',
            location: carriedRename ? carriedRename.location : '',
            typeMeter: typeMeter,
            logTime: '',
            sendTime: '24h',
            isComplete: false,
            publishedAt: new Date(),
        });

        res.status(200).json(
            carriedRename ? { result: 1, pendingRename: carriedRename } : 1,
        );
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};
