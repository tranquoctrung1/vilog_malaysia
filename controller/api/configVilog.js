const SiteModel = require('../../model/site');
const mongoose = require('mongoose');
const client = require('../../mqtt/client');

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

function mergeStringsByLength(arr, maxLength = 150) {
    const result = [];
    let current = '';

    for (const s of arr) {
        // Nếu thêm vào bị vượt quá giới hạn
        if (current.length + s.length > maxLength) {
            result.push(current);
            current = '';
        }

        current += s;
    }

    // Thêm phần còn lại
    if (current.length > 0) {
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

        if (data.typeMeter === 'SU') {
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
        }

        stringMqtt.push(
            `AT+SERVADDR=${process.env.MQTT_HOST},${process.env.MQTT_PORT};`,
        );

        stringMqtt.push(`AT+5VT=1000;`);

        stringMqtt.push(`AT+BAUDR=9600;`);
        stringMqtt.push(`AT+PARITY=2;`);
        stringMqtt.push(`AT+MBFUN=1;`);
        stringMqtt.push(
            `AT+SUBTOPIC=Vilog_${data.location}_${data.siteId}_SUB;`,
        );
        stringMqtt.push(
            `AT+PUBTOPIC=Vilog_${data.location}_${data.siteId}_PUB;`,
        );

        if (data.typeMeter === 'SU') {
            let id = 1;
            let id_hex = id.toString(16);

            if (id_hex.length < 1) {
                id_hex = '0' + id_hex;
            }

            stringMqtt.push(`AT+CMDEAR=1,15;`);
            stringMqtt.push(`AT+COMMAND1= ${id_hex} 03 01 10 00 10,1;`);
            stringMqtt.push(`AT+DATACUT1=37,2,4~35;`);
            stringMqtt.push(`AT+CMDDL1=200;`);
            stringMqtt.push(`AT+COMMAND2= ${id_hex} 03 02 10 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT2=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL2=200;`);
            stringMqtt.push(`AT+COMMAND2= ${id_hex} 03 02 10 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT2=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL2=200;`);
            stringMqtt.push(`AT+COMMAND3= ${id_hex} 03 02 20 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT3=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL3=200;`);
            stringMqtt.push(`AT+COMMAND4= ${id_hex} 03 02 30 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT4=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL4=200;`);
            stringMqtt.push(`AT+COMMAND5= ${id_hex} 03 02 40 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT5=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL5=200;`);
            stringMqtt.push(`AT+COMMAND6= ${id_hex} 03 02 50 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT6=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL6=200;`);
            stringMqtt.push(`AT+COMMAND7= ${id_hex} 03 02 60 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT7=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL7=200;`);
            stringMqtt.push(`AT+COMMAND8= ${id_hex} 03 02 70 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT8=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL8=200;`);
            stringMqtt.push(`AT+COMMAND9= ${id_hex} 03 02 80 00 0F,1;`);
            stringMqtt.push(`AT+DATACUT9=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDL9=200;`);
            stringMqtt.push(`AT+COMMANDA= ${id_hex} 03 02 90 00 0F,1;`);
            stringMqtt.push(`AT+DATACUTA=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDLA=200;`);
            stringMqtt.push(`AT+COMMANDB= ${id_hex} 03 02 A0 00 0F,1;`);
            stringMqtt.push(`AT+DATACUTB=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDLB=200;`);
            stringMqtt.push(`AT+COMMANDC= ${id_hex} 03 02 B0 00 0F,1;`);
            stringMqtt.push(`AT+DATACUTC=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDLC=200;`);
            stringMqtt.push(`AT+COMMANDD= ${id_hex} 03 02 C0 00 0F,1;`);
            stringMqtt.push(`AT+DATACUTD=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDLD=200;`);
            stringMqtt.push(`AT+COMMANDE= ${id_hex} 03 02 D0 00 0F,1;`);
            stringMqtt.push(`AT+DATACUTE=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDLE=200;`);
            stringMqtt.push(`AT+COMMANDF= ${id_hex} 03 02 E0 00 0F,1;`);
            stringMqtt.push(`AT+DATACUTF=35,2,4~33;`);
            stringMqtt.push(`AT+CMDDLF=200;`);

            stringMqtt.push(`AT+CLOCKLOG=1,65535,0,0;`);
        } else if (data.typeMeter === 'Kronhe') {
            let id = 1;
            let id_hex = id.toString(16);

            if (id_hex.length < 1) {
                id_hex = '0' + id_hex;
            }

            stringMqtt.push(`AT+CMDEAR=1,15;`);
            stringMqtt.push(`AT+COMMAND1= ${id_hex} 04 0F A2 00 02,1;`);
            stringMqtt.push(`AT+DATACUT1=9,2,4~7;`);
            stringMqtt.push(`AT+CMDDL1=200;`);
            stringMqtt.push(`AT+COMMAND2= ${id_hex} 04 0F A8 00 06,1;`);
            stringMqtt.push(`AT+DATACUT2=17,2,4~15;`);
            stringMqtt.push(`AT+CMDDL2=200;`);
            stringMqtt.push(`AT+COMMAND3= ${id_hex}04 0F B6 00 02,1;`);
            stringMqtt.push(`AT+DATACUT3=9,2,4~7;`);
            stringMqtt.push(`AT+CMDDL3=200;`);
            stringMqtt.push(`AT+COMMAND4= ${id_hex} 04 0F BC 00 02,1;`);
            stringMqtt.push(`AT+DATACUT4=9,2,4~7;`);
            stringMqtt.push(`AT+CMDDL4=200;`);

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

            stringMqtt.push(`AT+PRO=3,5;`);
        }

        const result = mergeStringsByLength(stringMqtt, 150);

        for (const item of result) {
            try {
                client.publish(
                    topic,
                    JSON.stringify(item),
                    { qos: 1, retain: false },
                    (err) => {
                        if (err) {
                            return res
                                .status(500)
                                .json({ error: 'Publish failed' });
                        }
                    },
                );
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
            await sleep(500);
        }

        res.status(200).json(1);
    } catch (err) {
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
            JSON.stringify('AT+TDC=86400'),
            { qos: 1, retain: false },
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
