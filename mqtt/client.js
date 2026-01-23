const mqtt = require('mqtt');
require('dotenv').config();

const client = mqtt.connect(
    `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
);

client.on('connect', () => {
    console.log('✅ MQTT connected');
});

client.on('error', (err) => {
    console.error('❌ MQTT error:', err);
});

module.exports = client;
