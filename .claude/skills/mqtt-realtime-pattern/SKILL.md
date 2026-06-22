---
name: mqtt-realtime-pattern
description: Use whenever adding or modifying device telemetry ingestion, MQTT topic subscriptions, alarm thresholds, or realtime data forwarding to the browser in this water-utility app. Trigger on "new sensor/device data", "MQTT topic", "alarm rule", "lost water detection", "realtime dashboard data", "telegram alert".
---

# MQTT Realtime Pattern (node_malaysia)

## Pipeline

```
Device (MQTT publish) --> mqtt/client.js (subscribe) --> model/DeviceLogger.js / Logger.js / DataManual.js (persist)
                                                       --> socket.io emit (index.js) --> browser (views/script/*.js)
                                                       --> alarm check --> model/Alarm.js / Telegram.js (notify)
```

## Adding a new telemetry feature

1. **Subscribe**: extend `mqtt/client.js` with the new topic. Don't create a second MQTT client instance — this app uses one shared connection.
2. **Persist**: write sampled values through the existing logger models (`DeviceLogger.js`, `Logger.js` for periodic samples, `DataManual.js` for manually-entered readings) unless the data genuinely doesn't fit those shapes.
3. **Alarm logic**: threshold/anomaly checks (e.g. lost-water detection) live alongside the ingestion handler and write to `model/Alarm.js`; if a Telegram notification is required, route through `model/Telegram.js` / `TelegramRange.js` and the `configTelegram` controller pattern — don't call the Telegram API directly from a new ad-hoc spot.
4. **Forward to browser**: emit a socket.io event from `index.js`'s socket setup so a live dashboard widget can subscribe. Pick a specific, namespaced event name (e.g. `device:level:update`) and document it for `frontend-engineer`.

## Things to preserve

- Single MQTT client (`mqtt/client.js`) — all new subscriptions go through it, not a new `mqtt.connect()` call elsewhere.
- Logger granularity already exists at hour/day/month levels (`dataHourLogger`, `dataDayLogger`, `dataMonthLogger` controllers/routers) — reuse this rollup pattern for new aggregate views instead of building a new aggregation scheme.
- Alarm history is queried via `historyAlarm` controller/router — new alarm types should be queryable the same way, not via a separate one-off endpoint.
