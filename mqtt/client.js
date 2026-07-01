const mqtt = require('mqtt');
require('dotenv').config();

const client = mqtt.connect(
    `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
);

let ioInstance = null;

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

    try {
        const parts = topic.split('/');
        const loggerId = parts[1];
        const payload = JSON.parse(message.toString());

        if (ioInstance) {
            ioInstance.emit('realtime-update', { loggerId, ...payload });
        }
    } catch (err) {
        console.error('❌ Failed to parse realtime MQTT payload:', err);
    }
});

function attachSocketIO(io) {
    ioInstance = io;
}

client.attachSocketIO = attachSocketIO;

module.exports = client;
