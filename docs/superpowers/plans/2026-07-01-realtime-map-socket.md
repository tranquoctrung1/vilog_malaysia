# Realtime Map Marker Socket Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After mqtt app (C#) decodes a meter message and inserts it into MongoDB, also publish a lightweight realtime message over the existing MQTT broker so node_malaysia updates the map marker's popup/label live, without waiting for the next page reload or the 2-minute `updateMap()` poll.

**Architecture:** mqtt app publishes one small JSON message per updated channel to topic `Vilog_RealTime/{LoggerId}/{ChannelId}` right after its existing DB insert (fire-and-forget, QoS 0, swallow errors). node_malaysia's existing MQTT client subscribes to `Vilog_RealTime/#` and re-emits each message via socket.io (`realtime-update` event, newly initialized in `index.js`). The browser (`public/js/map.js`) listens for that event and patches the already-rendered Leaflet marker's popup/tooltip in place, reusing the exact same HTML-building logic `updateMap()` already uses (extracted into a shared function so it isn't duplicated a third time).

**Tech Stack:** C# .NET 8 / MQTTnet 5.0.1 / Newtonsoft.Json 13.0.4 (mqtt app), Node.js / Express / socket.io 4.8.1 / mqtt.js 5.14.1 / Leaflet (node_malaysia).

## Global Constraints

- Do not change the MongoDB schema or `DataLoggerModel` — DB writes stay exactly as they are today (spec: [2026-07-01-realtime-map-socket-design.md](../specs/2026-07-01-realtime-map-socket-design.md)).
- Do not change the initial page-load flow — `initMap()` still builds all markers from the existing REST APIs before any socket event can apply.
- Realtime publish failures must never throw out of `HandleDataAction` methods — DB insert is the source of truth and must always complete regardless of MQTT publish success.
- No new client-side test framework — node_malaysia has no test runner configured (`package.json` "test" script is a placeholder); verify the browser/socket path manually (Task 6).
- C# test project (`MQTT_Vilog_Malaysia.Tests`) only has xunit — no Moq. Keep publisher logic split into pure, directly-testable static methods (topic/payload building) vs. the actual `IMqttClient.PublishAsync` call (untested, exercised via manual verification).

---

### Task 1: C# `RealtimePublisher` (topic/payload building + publish)

**Files:**
- Create: `D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia\MQTT\RealtimePublisher.cs`
- Test: `D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia.Tests\RealtimePublisherTests.cs`

**Interfaces:**
- Produces: `RealtimePublisher.Client` (static `IMqttClient?` settable field), `RealtimePublisher.BuildTopic(string loggerId, string channelId) : string`, `RealtimePublisher.BuildPayloadJson(string channelId, double? value, DateTime? timeStamp) : string`, `RealtimePublisher.PublishChannelUpdateAsync(string loggerId, string channelId, double? value, DateTime? timeStamp) : Task` — consumed by Task 2 (sets `Client`) and Task 3 (calls `PublishChannelUpdateAsync`).

- [ ] **Step 1: Write the failing tests for topic/payload building**

```csharp
using MQTT_Vilog_Malaysia.MQTT;
using Newtonsoft.Json.Linq;
using System;
using Xunit;

namespace MQTT_Vilog_Malaysia.Tests
{
    public class RealtimePublisherTests
    {
        [Fact]
        public void BuildTopic_CombinesLoggerAndChannelId()
        {
            string topic = RealtimePublisher.BuildTopic("LOGGER123", "LOGGER123_02");

            Assert.Equal("Vilog_RealTime/LOGGER123/LOGGER123_02", topic);
        }

        [Fact]
        public void BuildPayloadJson_ContainsChannelValueAndTimeStamp()
        {
            DateTime ts = new DateTime(2026, 7, 1, 10, 30, 0, DateTimeKind.Utc);

            string json = RealtimePublisher.BuildPayloadJson("LOGGER123_02", 12.34, ts);
            JObject obj = JObject.Parse(json);

            Assert.Equal("LOGGER123_02", obj["ChannelId"]!.Value<string>());
            Assert.Equal(12.34, obj["Value"]!.Value<double>());
            Assert.Equal(ts, obj["TimeStamp"]!.Value<DateTime>());
        }

        [Fact]
        public void BuildPayloadJson_AllowsNullValueAndTimeStamp()
        {
            string json = RealtimePublisher.BuildPayloadJson("LOGGER123_02", null, null);
            JObject obj = JObject.Parse(json);

            Assert.True(obj["Value"]!.Type == JTokenType.Null);
            Assert.True(obj["TimeStamp"]!.Type == JTokenType.Null);
        }
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia.Tests\MQTT_Vilog_Malaysia.Tests.csproj --filter RealtimePublisherTests`
Expected: FAIL / build error — `RealtimePublisher` does not exist yet.

- [ ] **Step 3: Implement `RealtimePublisher`**

```csharp
using MQTTnet;
using MQTTnet.Protocol;
using Newtonsoft.Json;
using System;
using System.Threading.Tasks;

namespace MQTT_Vilog_Malaysia.MQTT
{
    public static class RealtimePublisher
    {
        public static IMqttClient? Client { get; set; }

        public static string BuildTopic(string loggerId, string channelId)
        {
            return $"Vilog_RealTime/{loggerId}/{channelId}";
        }

        public static string BuildPayloadJson(string channelId, double? value, DateTime? timeStamp)
        {
            return JsonConvert.SerializeObject(new
            {
                ChannelId = channelId,
                Value = value,
                TimeStamp = timeStamp
            });
        }

        public static async Task PublishChannelUpdateAsync(string loggerId, string channelId, double? value, DateTime? timeStamp)
        {
            try
            {
                if (Client == null || string.IsNullOrEmpty(loggerId) || string.IsNullOrEmpty(channelId))
                {
                    return;
                }

                string topic = BuildTopic(loggerId, channelId);
                string payload = BuildPayloadJson(channelId, value, timeStamp);

                MqttApplicationMessage message = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(payload)
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtMostOnce)
                    .Build();

                await Client.PublishAsync(message);
            }
            catch (Exception ex)
            {
                WriteLogAction writeLogAction = new WriteLogAction();
                await writeLogAction.WriteErrorLog($"RealtimePublisher publish failed: {ex.Message}");
            }
        }
    }
}
```

(`WriteLogAction` and its `WriteErrorLog` method already exist and are used the same way throughout `Actions/HandleDataAction.cs` — no new usings needed beyond what's shown since `WriteLogAction` lives in the same `MQTT_Vilog_Malaysia.Actions`/global namespace already referenced elsewhere in this project without an explicit `using` in `Program.cs`. If the compiler reports `WriteLogAction` not found, add `using MQTT_Vilog_Malaysia.Actions;` at the top of `RealtimePublisher.cs`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia.Tests\MQTT_Vilog_Malaysia.Tests.csproj --filter RealtimePublisherTests`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd "D:\project\MQTT_Vilog_Malaysia_No_Check_Imei"
git add MQTT_Vilog_Malaysia/MQTT/RealtimePublisher.cs MQTT_Vilog_Malaysia.Tests/RealtimePublisherTests.cs
git commit -m "feat: add RealtimePublisher for MQTT realtime channel updates"
```

---

### Task 2: Wire `RealtimePublisher.Client` from the live MQTT connection

**Files:**
- Modify: `D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia\MQTT\Subscribe.cs:106`

**Interfaces:**
- Consumes: `RealtimePublisher.Client` setter (Task 1).
- Produces: a live `Client` so `PublishChannelUpdateAsync` (Task 1) actually sends messages once Task 3 calls it.

- [ ] **Step 1: Set `RealtimePublisher.Client` right after the MQTT connection is established**

In `Subscribe.cs`, immediately after line 106 (`await mqttClient.ConnectAsync(mqttClientOptions, CancellationToken.None);`), add:

```csharp
                await mqttClient.ConnectAsync(mqttClientOptions, CancellationToken.None);

                RealtimePublisher.Client = mqttClient;

                await mqttClient.SubscribeAsync(mqttSubscribeOptions, CancellationToken.None);
```

Also update the reconnect handler (`DisconnectedAsync`, around line 84-104) so the reference stays valid after a reconnect — insert the same line right after the reconnect's `ConnectAsync` call:

```csharp
                        try
                        {
                            await mqttClient.ConnectAsync(mqttClientOptions, CancellationToken.None);
                            RealtimePublisher.Client = mqttClient;
                            await mqttClient.SubscribeAsync(mqttSubscribeOptions, CancellationToken.None);
                            Console.WriteLine("MQTT reconnected and re-subscribed.");
                            break;
                        }
```

No new `using` needed — `Subscribe.cs` is already in namespace `MQTT_Vilog_Malaysia.MQTT`, same as `RealtimePublisher`.

- [ ] **Step 2: Build to verify no compile errors**

Run: `dotnet build D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia\MQTT_Vilog_Malaysia.csproj`
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
cd "D:\project\MQTT_Vilog_Malaysia_No_Check_Imei"
git add MQTT_Vilog_Malaysia/MQTT/Subscribe.cs
git commit -m "feat: attach live MQTT client to RealtimePublisher on connect/reconnect"
```

---

### Task 3: Publish a realtime update after every `BulkUpdateValues` in `HandleDataAction`

**Files:**
- Modify: `D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia\Actions\HandleDataAction.cs:1` (add using), and after each of the 5 `await channelConfigAction.BulkUpdateValues(chUpdates);` calls at lines 155, 428, 658, 914, 957.

**Interfaces:**
- Consumes: `RealtimePublisher.PublishChannelUpdateAsync(string loggerId, string channelId, double? value, DateTime? timeStamp)` (Task 1).

- [ ] **Step 1: Add the using directive**

At the top of `HandleDataAction.cs` (after line 1 `using MQTT_Vilog_Malaysia.Models;`), add:

```csharp
using MQTT_Vilog_Malaysia.MQTT;
```

- [ ] **Step 2: Publish after `BulkUpdateValues` in `HandleDataKronheMeter` (currently line 155)**

Replace:

```csharp
                await channelConfigAction.BulkUpdateValues(chUpdates);


                //insert data logger for battery channel
```

with:

```csharp
                await channelConfigAction.BulkUpdateValues(chUpdates);

                foreach (var chUpdate in chUpdates)
                {
                    if (!chUpdate.isIndex)
                    {
                        await RealtimePublisher.PublishChannelUpdateAsync(imei, chUpdate.channelId, chUpdate.value.Value, chUpdate.value.TimeStamp);
                    }
                }

                //insert data logger for battery channel
```

- [ ] **Step 3: Apply the same change in `HandleDataKronheMeterOverTime` (currently line 428)**

Same replacement as Step 2 — this method also has `await channelConfigAction.BulkUpdateValues(chUpdates);` followed by `//insert data logger for battery channel`, with `imei` in scope.

- [ ] **Step 4: Apply the same change in `HandleDataSUMeter` (currently line 658)**

The line reads `// flush all channel-config updates (realtime) in one BulkWrite` then `await channelConfigAction.BulkUpdateValues(chUpdates);`. Insert the same `foreach` loop immediately after that `BulkUpdateValues` call, before the closing `}` of the `if (real != null)` block. `imei` is in scope in this method too.

- [ ] **Step 5: Apply the same change in `HandleDataLevelMeter` (currently line 914)**

Insert the loop immediately after `await channelConfigAction.BulkUpdateValues(chUpdates);` and before `await dataLoggerAction.InsertDataLogger(new List<DataLoggerModel> { dataBattery }, $"{imei}_05");`.

- [ ] **Step 6: Apply the same change in `HandleDataLevelMeterOverTime` (currently line 957)**

Same insertion point pattern as Step 5 in the OverTime variant.

- [ ] **Step 7: Build to verify no compile errors**

Run: `dotnet build D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia\MQTT_Vilog_Malaysia.csproj`
Expected: Build succeeded, 0 errors.

- [ ] **Step 8: Run full C# test suite to confirm nothing else broke**

Run: `dotnet test D:\project\MQTT_Vilog_Malaysia_No_Check_Imei\MQTT_Vilog_Malaysia.Tests\MQTT_Vilog_Malaysia.Tests.csproj`
Expected: PASS (all existing tests + the 3 from Task 1).

- [ ] **Step 9: Commit**

```bash
cd "D:\project\MQTT_Vilog_Malaysia_No_Check_Imei"
git add MQTT_Vilog_Malaysia/Actions/HandleDataAction.cs
git commit -m "feat: publish realtime channel updates after DB insert in HandleDataAction"
```

---

### Task 4: Node — initialize socket.io and bridge `Vilog_RealTime/#` MQTT messages to it

**Files:**
- Modify: `D:\project\node_malaysia\mqtt\client.js`
- Modify: `D:\project\node_malaysia\index.js:190-194`

**Interfaces:**
- Produces: `client.attachSocketIO(io)` (exported from `mqtt/client.js`), socket.io event `realtime-update` with payload `{ loggerId: string, ChannelId: string, Value: number|null, TimeStamp: string|null }` — consumed by Task 5 (browser).

- [ ] **Step 1: Add subscribe + message bridge + `attachSocketIO` to `mqtt/client.js`**

Replace the full contents of `mqtt/client.js`:

```javascript
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
```

- [ ] **Step 2: Initialize socket.io and attach it in `index.js`**

In `index.js`, replace:

```javascript
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
```

with:

```javascript
const server = http.createServer(app);

const io = socket(server);
const mqttClient = require('./mqtt/client');
mqttClient.attachSocketIO(io);

server.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
```

(`socket` is already imported at line 10: `const socket = require('socket.io');` — no new import needed. `require('./mqtt/client')` returns the same cached singleton client already used elsewhere, e.g. `controller/api/configVilog.js`, so this does not open a second MQTT connection.)

- [ ] **Step 3: Manually verify the app still boots and connects**

Run: `cd D:\project\node_malaysia && npm start` (or `node index.js` if `npm start`'s nodemon watch is not desired for a one-off check)
Expected console output: `App is running on port 3000` and `✅ MQTT connected` — no thrown errors on startup.
Stop the process after confirming (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
cd "D:\project\node_malaysia"
git add mqtt/client.js index.js
git commit -m "feat: init socket.io and bridge Vilog_RealTime MQTT messages to it"
```

---

### Task 5: Browser — patch marker popup/label on `realtime-update` without refetching the API

**Files:**
- Modify: `D:\project\node_malaysia\public\js\map.js`
- Modify: `D:\project\node_malaysia\views\home.pug:132-155`

**Interfaces:**
- Consumes: socket.io event `realtime-update` with payload `{ loggerId, ChannelId, Value, TimeStamp }` (Task 4).
- Produces: `buildSiteContent(site, channelList) : { infoHtml, labelHtml, img, contentError }` (extracted, reused within this file), `applyChannelUpdateToMarker(loggerId, channelId, value, timeStamp) : void`.

- [ ] **Step 1: Add the socket.io client script to the map page**

In `views/home.pug`, in the `block linkcriptbody` section, add the socket.io client script before `script(src='/js/map.js')` (currently line 151):

```pug
    script(src="/socket.io/socket.io.js")
    script(src='/js/map.js')
```

(socket.io serves this script automatically once `io(server)` is initialized in `index.js` — no extra static route needed.)

- [ ] **Step 2: Add a module-level cache for the last-fetched channel list per logger**

In `public/js/map.js`, after line 15 (`let statusSites = [];`), add:

```javascript
let channelsByLoggerCache = {};
```

- [ ] **Step 3: Populate the cache in both `initMap()` and `updateMap()`**

In `initMap()`, inside `getChannelsByLoggers(loggers).then(function (channelsByLogger) {` (currently line 120), add as the first line of that callback:

```javascript
                .then(function (channelsByLogger) {
                    channelsByLoggerCache = channelsByLogger;
                    for (let site of sites) {
```

In `updateMap()`, inside its `getChannelsByLoggers(loggers).then(function (channelsByLogger) {` (currently line 462), add the same first line:

```javascript
        .then(function (channelsByLogger) {
            channelsByLoggerCache = channelsByLogger;
            $.each(sites, function (i, site) {
```

- [ ] **Step 4: Extract the per-site content-building logic out of `updateMap()` into `buildSiteContent(site, channelList)`**

`updateMap()`'s `$.each` body (currently lines 463-711) builds `labelHtml`, `infoHtml`, `img`, and `contentError` from `site` and `res.data` (the channel list for that site), then applies them to the matching marker. Extract everything from the start of the loop body up through building `dLabelHtml`/`infoHtml`/`img` (currently lines 473-697, i.e. everything before the `markers.forEach(...)` block at line 699) into a new function placed right before `updateMap()`:

```javascript
function buildSiteContent(site, channelList) {
    let isErrorDelay = false;
    let contentError = '';
    let img = '/images/green.png';
    let index = 0;
    let checkStatusChannel = true;
    let checkStatusValue = true;

    let labelHtml =
        '<table cellspacing="0" cellpadding="0" style="min-width: 300px; font-size: 0.85rem"><tr><td colspan="2" style="text-align:center;font-weight:bold;color:black;background-color:white; "><span>' +
        site.Location +
        '</span></td></tr>' +
        `<tr><td colspan="2" style="text-align:center;font-weight:bold;color:red;background-color:white; "><marquee id="error-site${site.SiteId}"></marquee></td></tr>`;
    let infoHtml =
        '<span style="font-weight:bold">Sitename: ' +
        site.Location +
        '</span>' +
        '<br/><span>Logger Id: ' +
        site.LoggerId +
        '</span>' +
        '</br><span>Index: ';
    let dLabelHtml = '';
    let dInfoHtml = '';

    for (let channel of channelList) {
        if (channel.ChannelName.includes('Mem')) {
            channel.ChannelName = '1.2 Memory Error';
        } else if (channel.ChannelName.includes('Com')) {
            channel.ChannelName = '1.7 Comms Error';
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
        let strDate = convertDateToString(
            convertDateFromApi(channel.TimeStamp),
        );
        let val;
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

    return { infoHtml, labelHtml, img, contentError };
}
```

Then replace the extracted block inside `updateMap()`'s `$.each` callback with a call to it, keeping the marker-patching tail (lines 699-711) unchanged:

```javascript
            $.each(sites, function (i, site) {
                let logger =
                    site.LoggerId != null &&
                    site.LoggerId != undefined &&
                    site.LoggerId.trim() != ''
                        ? site.LoggerId.trim()
                        : 'nothing';

                let res = { data: channelsByLogger[logger] || [] };

                const { infoHtml, labelHtml, img, contentError } =
                    buildSiteContent(site, res.data);

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
                let errorEl = document.getElementById(`error-site${site.SiteId}`);
                if (errorEl) {
                    errorEl.innerHTML = contentError;
                }
            });
```

(`initMap()`'s own marker-creation block is left untouched — it duplicates similar logic today and is out of scope for this change; only `updateMap()`, which this task already has to modify to add the cache line, is refactored.)

- [ ] **Step 5: Add `applyChannelUpdateToMarker` and the socket.io listener**

At the end of `public/js/map.js` (after the existing `setInterval(updateMap, 1000 * 60 * 2);` line), add:

```javascript
function applyChannelUpdateToMarker(loggerId, channelId, value, timeStamp) {
    const channelList = channelsByLoggerCache[loggerId];
    if (!channelList) {
        return;
    }

    const channel = channelList.find((c) => c.ChannelId === channelId);
    if (!channel) {
        return;
    }

    channel.LastValue = value;
    channel.TimeStamp = timeStamp;
    channel.Status = 1;

    const site = sites.find(
        (s) => (s.LoggerId || '').trim() === loggerId,
    );
    if (!site) {
        return;
    }

    const marker = markers.find((m) => m.options.id === `m_${site.SiteId}`);
    if (!marker) {
        return;
    }

    const { infoHtml, labelHtml, img, contentError } = buildSiteContent(
        site,
        channelList,
    );

    var greenIcon = new L.Icon({
        iconUrl: img,
        iconSize: [20, 20],
        iconAnchor: [
            site.LabelAnchorX == null ? 40 : site.LabelAnchorX,
            site.LabelAnchorY == null ? 0 : site.LabelAnchorY,
        ],
    });

    marker.setIcon(greenIcon);
    marker.getPopup().setContent(infoHtml);
    marker.getPopup().update();
    marker.getTooltip().setContent(labelHtml);
    marker.getTooltip().update();

    let errorEl = document.getElementById(`error-site${site.SiteId}`);
    if (errorEl) {
        errorEl.innerHTML = contentError;
    }
}

const realtimeSocket = io();

realtimeSocket.on('realtime-update', function (data) {
    if (!data || !data.loggerId || !data.ChannelId) {
        return;
    }

    applyChannelUpdateToMarker(
        data.loggerId,
        data.ChannelId,
        data.Value,
        data.TimeStamp,
    );
});
```

- [ ] **Step 6: Commit**

```bash
cd "D:\project\node_malaysia"
git add public/js/map.js views/home.pug
git commit -m "feat: apply realtime MQTT updates to map markers via socket.io"
```

---

### Task 6: Manual end-to-end verification

**Files:** none (verification only)

**Interfaces:**
- Consumes: everything from Tasks 1-5.

- [ ] **Step 1: Start node_malaysia**

Run: `cd D:\project\node_malaysia && npm start`
Expected: `App is running on port 3000`, `✅ MQTT connected`.

- [ ] **Step 2: Open the map page and confirm markers still load normally**

Open `http://localhost:3000/` in a browser, confirm markers render with popups/tooltips exactly as before (regression check on Task 5's `updateMap()` refactor — compare popup/tooltip content against current production behavior for at least one site with multiple channels).

- [ ] **Step 3: Publish a fake realtime message and confirm the marker updates without a page reload**

Pick a `LoggerId` and `ChannelId` currently visible on the map (from the browser devtools, inspect `channelsByLoggerCache` via console: `channelsByLoggerCache`). Using `mosquitto_pub` (or MQTT Explorer) against the broker at `vilog.viwater.vn:1883`:

```bash
mosquitto_pub -h vilog.viwater.vn -p 1883 -t "Vilog_RealTime/<LoggerId>/<ChannelId>" -m "{\"ChannelId\":\"<ChannelId>\",\"Value\":99.9,\"TimeStamp\":\"2026-07-01T12:00:00Z\"}"
```

Expected: within ~1s, the marker's popup and tooltip for that site show `99.9` for that channel, and the marker icon turns/stays green — with no network request to `GetChannelsByLoggerIds` or `GetChannelByLoggerId` firing (check browser Network tab).

- [ ] **Step 4: Confirm an unknown LoggerId/ChannelId does not crash the page**

Publish the same message shape with a `LoggerId`/`ChannelId` that doesn't exist in `channelsByLoggerCache`. Expected: no error in the browser console, no visual change, map keeps working.

- [ ] **Step 5: Confirm a mqtt-app publish failure doesn't block DB insert**

Stop the node_malaysia process (so its MQTT subscription drops) while the mqtt app keeps running against real device traffic (or replay a stored payload). Expected: mqtt app logs (`WriteErrorLog` output / console) show no crash, and MongoDB `t_Data_Logger_*` collections keep receiving new documents as before — the missing subscriber only means nobody consumes the `Vilog_RealTime/#` topic, it does not affect `RealtimePublisher`'s fire-and-forget publish or the DB insert path.
