const SiteModel = require('../../model/site');
const mongoose = require('mongoose');
const client = require('../../mqtt/client');
const ConfigVilogModel = require('../../model/ConfigVilog');

require('dotenv').config();

module.exports.GetLoggingTimeVilog = async (req, res) => {
    let result = 0;

    const siteid = req.params.siteid;

    const sites = await SiteModel.find({ SiteId: siteid });

    if (sites.length > 0) {
        const channelForward = sites[0].LoggerId + '_02';

        const DataLoggerSchema = new mongoose.Schema({
            TimeStamp: Date,
            Value: Number,
        });

        delete mongoose.models.DataLogger;

        const DataLogger = mongoose.model(
            'DataLogger',
            DataLoggerSchema,
            't_Data_Logger_' + channelForward,
        );

        let value = await DataLogger.find({}).sort({ TimeStamp: -1 }).limit(2);

        if (value.length > 0) {
            if (value[0].TimeStamp !== null && value[1].TimeStamp !== null) {
                let diffMs = value[0].TimeStamp - value[1].TimeStamp;
                result = Math.round(diffMs / 60000);
            }
        }

        res.status(200).json(result);
    }
};

function writeCommand(cmdCode, data) {
    const msg = `AT+CFGDEV=01 06 01 ${cmdCode} ${data},1;`;
    return msg;
}

function toHex2(value, isYear = false) {
    if (isYear) {
        // Ví dụ: 2026 → 07 EA (tuỳ device, bạn chỉnh lại nếu cần)
        const hex = value.toString(16).toUpperCase();
        return hex.match(/.{1,2}/g).join(' ');
    }

    return value.toString(16).toUpperCase().padStart(2, '0');
}

function mergeStringsByLength(arr, maxLength = 140) {
    const result = [];
    let current = '';

    for (const s of arr) {
        // Nếu thêm vào bị vượt quá giới hạn
        if (current.length + s.length > maxLength) {
            current = current.slice(0, -1);
            current = `{${current}}`;

            result.push(current);
            current = '';
        }

        current += s;
    }

    // Thêm phần còn lại
    if (current.length > 0) {
        current = current.slice(0, -1);
        current = `{${current}}`;
        result.push(current);
    }

    return result;
}

function sleep(ms = 500) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.UpdateConfigVilog = async (req, res) => {
    try {
        const data = req.body;

        if (!client.connected) {
            return res.status(500).json({ error: 'MQTT not connected' });
        }

        const topic = `Vilog_${data.oldLocation}_${data.oldSiteId}_SUB`;

        let stringMqtt = [];

        let checkChangeTime = false;

        if (data.siteId !== '' && data.location !== '') {
            stringMqtt.push(
                `AT+SUBTOPIC=Vilog_${data.location}_${data.siteId}_SUB;`,
            );
            stringMqtt.push(
                `AT+PUBTOPIC=Vilog_${data.location}_${data.siteId}_PUB;`,
            );
        }

        if (data.sendTime !== '') {
            if (data.sendTime === '1m') {
                stringMqtt.push('AT+TDC=60;');
            } else if (data.sendTime === '5m') {
                stringMqtt.push('AT+TDC=300;');
            } else if (data.sendTime === '10m') {
                stringMqtt.push('AT+TDC=600;');
            } else if (data.sendTime === '15m') {
                stringMqtt.push('AT+TDC=900;');
            } else if (data.sendTime === '30m') {
                stringMqtt.push('AT+TDC=1800;');
            } else if (data.sendTime === '1h') {
                stringMqtt.push('AT+TDC=3600;');
            } else if (data.sendTime === '2h') {
                stringMqtt.push('AT+TDC=7200;');
            } else if (data.sendTime === '3h') {
                stringMqtt.push('AT+TDC=10800;');
            } else if (data.sendTime === '4h') {
                stringMqtt.push('AT+TDC=14400;');
            } else if (data.sendTime === '6h') {
                stringMqtt.push('AT+TDC=21600;');
            } else if (data.sendTime === '12h') {
                stringMqtt.push('AT+TDC=43200;');
            } else if (data.sendTime === '24h') {
                stringMqtt.push('AT+TDC=86400;');
            }

            checkChangeTime = true;
        }

        if (data.typeMeter === 'SU') {
            if (data.logTime !== '') {
                let intervalLogTime = `00 0F`;

                if (data.logTime === '15m') {
                    intervalLogTime = `00 0F`;
                } else if (data.logTime === '30m') {
                    intervalLogTime = `00 1E`;
                } else if (data.logTime === '60m') {
                    intervalLogTime = `00 3C`;
                } else {
                    intervalLogTime = `00 0F`;
                }

                const ts = new Date();

                // Helper giống LocalDateTime
                const getYear = () => ts.getFullYear();
                const getMonthValue = () => ts.getMonth() + 1; // JS month: 0–11
                const getDayOfMonth = () => ts.getDate();
                const getHour = () => ts.getHours();
                const getMinute = () => ts.getMinutes();

                stringMqtt.push(writeCommand('0B', toHex2(getYear(), true)));
                stringMqtt.push(
                    writeCommand(
                        '0C',
                        `${toHex2(getMonthValue())} ${toHex2(getDayOfMonth())}`,
                    ),
                );
                stringMqtt.push(
                    writeCommand(
                        '0D',
                        `${toHex2(getHour())} ${toHex2(getMinute())}`,
                    ),
                );

                stringMqtt.push(writeCommand('01', toHex2(getYear(), true)));
                stringMqtt.push(
                    writeCommand(
                        '02',
                        `${toHex2(getMonthValue())} ${toHex2(getDayOfMonth())}`,
                    ),
                );
                stringMqtt.push(
                    writeCommand('03', `${toHex2((getHour() + 1) % 24)} 00`),
                );

                stringMqtt.push(writeCommand('04', intervalLogTime));

                checkChangeTime = true;
            }
        } else if (data.typeMeter === 'Kronhe') {
            if (data.sendTime !== '' && data.logTime !== '') {
                let timeSend = 10;

                if (data.sendTime === '10m') {
                    timeSend = 10;
                } else if (data.sendTime === '15m') {
                    timeSend = 15;
                } else if (data.sendTime === '30m') {
                    timeSend = 30;
                } else if (data.sendTime === '1h') {
                    timeSend = 60;
                } else if (data.sendTime === '2h') {
                    timeSend = 60 * 2;
                } else if (data.sendTime === '3h') {
                    timeSend = 60 * 3;
                } else if (data.sendTime === '6h') {
                    timeSend = 60 * 6;
                } else if (data.sendTime === '12h') {
                    timeSend = 60 * 12;
                } else if (data.sendTime === '24h') {
                    timeSend = 69 * 24;
                }

                let timeLog = 5;

                if (data.logTime === '5m') {
                    timeLog = 5;
                } else if (data.logTime === '10m') {
                    timeLog = 10;
                } else if (data.logTime === '15m') {
                    timeLog = 15;
                } else if (data.logTime === '30m') {
                    timeLog = 30;
                } else if (data.logTime === '60m') {
                    timeLog = 60;
                }

                let setTime = timeSend / timeLog;

                stringMqtt.push(`AT+CLOCKLOG=1,0,${timeLog},${setTime};`);
                checkChangeTime = true;
            }
        }

        if (checkChangeTime === true) {
            stringMqtt.push(`ATZ;`);
        }

        if (
            data.siteId !== '' ||
            data.location !== '' ||
            data.sendTime !== '' ||
            data.logTime !== ''
        ) {
            let check = await ConfigVilogModel.find({
                oldSiteId: data.oldSiteId,
                isComplete: false,
            });

            if (check.length === 0) {
                const obj = { ...data, isComplete: false };

                await ConfigVilogModel.insertMany([obj]);
            }
        }

        const result = mergeStringsByLength(stringMqtt, 150);

        try {
            for (const item of result) {
                await new Promise((resolve, reject) => {
                    client.publish(
                        topic,
                        item,
                        { qos: 1, retain: true },
                        (err) => (err ? reject(err) : resolve()),
                    );
                });
            }

            res.status(200).json(1);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports.StopLoggingVilog = async (req, res) => {
    const data = req.body;

    try {
        if (!client.connected) {
            return res.status(500).json({ error: 'MQTT not connected' });
        }

        const topic = `Vilog_${data.oldLocation}_${data.oldSiteId}_SUB`;

        client.publish(
            topic,
            '{AT+TDC=86400}',
            { qos: 1, retain: true },
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Publish failed' });
                }
            },
        );

        res.status(200).json(1);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
