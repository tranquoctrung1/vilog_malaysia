# Realtime map marker update via socket.io (2026-07-01)

## Problem

Map marker popup/label chỉ được cập nhật khi user reload trang (page load gọi
`GetSiteByUId` / `GetChannelByLoggerId` / `GetStatusSite`). Dữ liệu meter thực
tế được ingest liên tục bởi mqtt app (C#) và insert vào MongoDB, nhưng node
dashboard không hay biết cho tới lần load API tiếp theo → delay hiển thị.

## Goal

Sau khi mqtt app decode message MQTT và insert DB, đồng thời phát (emit) dữ
liệu đó lên để node cập nhật popup content + label của marker tương ứng trên
map theo thời gian thực, không cần reload trang / gọi lại API.

## Scope

- KHÔNG đổi initial load: page load vẫn gọi API như cũ để dựng toàn bộ marker.
- KHÔNG đổi schema DB / thêm field mới vào Mongo — mqtt app tiếp tục chỉ lưu
  `Value` + `TimeStamp` như hiện tại (`DataLoggerModel`).
- Chỉ thêm: 1 kênh push riêng để đồng bộ UI, tách biệt khỏi luồng ghi DB.

## Architecture

Tận dụng MQTT broker sẵn có (`vilog.viwater.vn:1883`), không thêm hạ tầng mới:

```
Meter → MQTT (raw topic) → mqtt app (C#) decode → [song song]
                                                    ├─ insert Mongo (như cũ, Value+TimeStamp)
                                                    └─ publish JSON full RealTimeModel
                                                       → topic "Vilog_RealTime/{LoggerId}/{ChannelId}"
                                                                                              ↓
                                                node app: mqtt/client.js subscribe topic trên
                                                    ↓
                                                socket.io init (index.js), io.emit('realtime-update', payload)
                                                    ↓
                                                browser map.js: nhận socket event,
                                                update marker popup+label tại chỗ (không reload API)
```

## Components

### C# (mqtt app — `MQTT_Vilog_Malaysia_No_Check_Imei`)

- File mới `MQTT/RealtimePublisher.cs`: dùng lại kết nối MQTTnet hiện có
  (`IMqttClient`), `PublishAsync` JSON serialize (Newtonsoft.Json — đã có
  sẵn dependency).
- Gọi ngay sau `channelConfigAction.BulkUpdateValues(chUpdates)` trong mỗi
  method của `HandleDataAction.cs` (Kronhe, KronheOverTime, SU, Level,
  LevelOverTime). Ba loại meter dùng 3 model realtime khác nhau
  (LogKronheModel, RealTimeModel, LogLevelModel) nên không có 1 class chung
  — thay vào đó publish trực tiếp từ `chUpdates` (list `(channelId,
  DataLoggerModel value, isIndex)` đã được build sẵn trong mỗi method cho
  `BulkUpdateValues`), mỗi channel value (không phải index) → 1 message
  `{ChannelId, Value, TimeStamp}` lên topic
  `Vilog_RealTime/{LoggerId}/{ChannelId}`. Cách này tận dụng cấu trúc code
  có sẵn, đồng nhất giữa 5 method, không cần field-map riêng cho từng loại
  meter.
- QoS 0 — chấp nhận mất gói vì đây là kênh UI phụ trợ, không phải nguồn dữ
  liệu chính (DB insert vẫn là source of truth).
- Publish bọc try/catch — lỗi publish KHÔNG được làm fail luồng insert DB
  chính.

### Node app (`node_malaysia`)

- `index.js`: init socket.io thật sự (hiện tại dòng 10 chỉ `require('socket.io')`
  chưa gọi `io(server)`).
- `mqtt/client.js`: thêm `client.subscribe('Vilog_RealTime/#')`, handler parse
  JSON payload, gọi `io.emit('realtime-update', payload)`.
- Payload gồm `LoggerId` + `ChannelId` để client biết update marker nào.

### Client (`public/js/map.js`)

- Sau khi marker ban đầu load xong (giữ nguyên flow hiện tại), thêm
  `const socket = io()`, listen event `realtime-update`.
- Map `LoggerId`+`ChannelId` → marker đang có trong bộ nhớ (dict
  markersByLoggerId — thêm nếu chưa có).
- Update popup HTML (lastIndex, timestamp, status) + label trên marker
  in-place, không tạo lại marker, không gọi lại API.
- Status màu tính lại inline ngay tại client: message mới tới = data tươi →
  set status OK (xanh) + timestamp mới, không gọi lại `GetStatusSite`.
  **[SUPERSEDED bởi phần "Server-side Status computation" bên dưới]** — client
  không còn tự hardcode Status=1, nhận Status đã tính từ server.

## Error handling & edge cases

- **MQTT publish fail (C#)**: try/catch, log lỗi, không throw — DB insert vẫn
  commit bình thường.
- **Node mất kết nối MQTT / socket.io**: MQTT.js tự reconnect mặc định, tự
  subscribe lại topic sau reconnect — không cần thêm logic.
- **Client browser socket disconnect**: socket.io client tự reconnect mặc
  định; không có cơ chế catch-up dữ liệu bị miss trong lúc disconnect — chấp
  nhận được vì đây chỉ là lớp hiển thị phụ trợ, không phải nguồn sự thật.
  User F5 để lấy state mới nhất nếu cần.
- **Marker không tồn tại khi nhận event** (site mới chưa kịp load, hoặc
  LoggerId lệch): client check tồn tại trước khi update, không tồn tại thì bỏ
  qua — không lỗi, không tạo marker mới.
- **Nhiều tab/nhiều user xem map**: `io.emit()` broadcast toàn bộ client
  connect — không cần room/namespace, mọi user xem chung 1 map.
- **Race: socket event tới trước khi API load xong marker**: event bị bỏ qua
  (marker chưa tồn tại) — chấp nhận vì gói tiếp theo (interval logger kế
  tiếp) sẽ update đúng, không cần buffer/queue.

## Testing

- **C#**: unit test `RealtimePublisher` — mock `IMqttClient`, assert publish
  đúng topic + payload đúng shape; assert exception trong publish không
  propagate ra `HandleDataAction`.
- **Node**: test `mqtt/client.js` subscribe handler — giả lập message tới
  topic `Vilog_RealTime/#`, assert `io.emit('realtime-update', ...)` được gọi
  đúng payload.
- **Manual/integration**: publish tay message MQTT lên topic mới (MQTT
  Explorer / mosquitto_pub), quan sát: (1) socket.io client nhận event, (2)
  marker popup/label đổi không cần F5, (3) LoggerId lạ không crash trang.
- **Load**: không cần test tải riêng — traffic thấp, theo interval logger
  của từng channel, không phải per-second stream.

---

## Update 2026-07-01 (v2): Server-side Status computation + disconnect detection

### Problem

v1 chỉ xử lý trường hợp "data mới tới → xanh" (client hardcode `Status=1`).
Hai trường hợp còn thiếu:
1. Giá trị vượt ngưỡng (`BaseMin`/`BaseMax`) → phải vàng/đỏ alarm ngay khi
   nhận, không chờ poll.
2. Mất kết nối (không có message mới trong `TimeDelay` phút) — realtime
   thuần push-based không tự phát hiện được việc "không có gì xảy ra".

### Scope

- KHÔNG đổi bảng/collection nào, KHÔNG đổi payload MQTT từ C# (vẫn
  `{ChannelId, Value, TimeStamp}` — threshold/site data đã có sẵn ở Node,
  không cần C# gửi thêm).
- Chỉ sửa `mqtt/client.js` (Node) + `public/js/map.js` (client).

### Architecture

```
mqtt/client.js nhận "Vilog_RealTime/{loggerId}/{ChannelId}"
    ↓
Promise.all([ChannelModel.findOne({ChannelId}), SiteModel.findOne({LoggerId})])
    ↓
computeStatus(Value, BaseMin, BaseMax) → 1 (ok) hoặc 4 (alarm)
    ↓
channelFreshnessCache.set(`${loggerId}_${ChannelId}`, {TimeStamp, timeDelay, lastStatus: status})
    ↓
io.emit('realtime-update', {loggerId, ChannelId, Value, TimeStamp, Status: status})

setInterval(30s):
  duyệt channelFreshnessCache
    nếu (now - TimeStamp) > timeDelay*60000 VÀ lastStatus !== 2:
      lastStatus = 2
      io.emit('channel-status-update', {loggerId, ChannelId, Status: 2})
```

### Components

- **`mqtt/client.js`**:
  - `computeStatus(value, baseMin, baseMax)` — pure function: trả `4` nếu
    `baseMin != null && value < baseMin`, hoặc `baseMax != null && value >
    baseMax`; ngược lại trả `1`.
  - `channelFreshnessCache = new Map()` — key `${loggerId}_${ChannelId}`,
    value `{TimeStamp: Date, timeDelay: number, lastStatus: number}`.
  - Message handler (`Vilog_RealTime/#`): query song song Channel (lấy
    `BaseMin`/`BaseMax`) + Site (lấy `TimeDelay`, default 60 nếu null —
    khớp logic `buildChannelResultForLogger` hiện có ở
    `controller/api/channel.js:263-272`), tính status, update cache, emit
    `realtime-update` kèm `Status`.
  - `setInterval(checkStaleChannels, 30000)`: quét cache, channel vượt
    `timeDelay` mà `lastStatus !== 2` → set `lastStatus=2`, emit
    `channel-status-update`. Channel có data mới lại (qua message handler ở
    trên) tự reset `lastStatus` về giá trị mới tính — tự "tỉnh" lại, không
    cần logic riêng.

- **`public/js/map.js`**:
  - `applyChannelUpdateToMarker(loggerId, channelId, value, timeStamp,
    status)` — nhận thêm `status` từ payload, set `channel.Status = status`
    (bỏ hardcode `= 1` cũ).
  - Thêm listener `realtimeSocket.on('channel-status-update', ...)` — gọi
    lại flow patch marker (tái dùng `buildSiteContent`), chỉ đổi
    `channel.Status`, giữ nguyên `LastValue`/`TimeStamp` cache hiện có.

### Error handling & edge cases

- Site/Channel không tìm thấy (null) lúc lookup trong message handler → bỏ
  qua, không emit, không crash (site/channel có thể chưa provision xong).
- `channelFreshnessCache` mất khi Node restart — chấp nhận, không phải
  source of truth; channel cũ tự có status đúng ở message tiếp theo hoặc ở
  lần load trang kế (API vẫn tính đúng từ DB qua
  `buildChannelResultForLogger`).
- `BaseMin`/`BaseMax` null (chưa cấu hình ngưỡng) → không check alarm, giữ
  `Status=1` nếu chưa vượt `timeDelay`.
- Không emit lặp lại `channel-status-update` cho cùng 1 channel đã
  `lastStatus=2` — tránh spam socket mỗi 30s cho channel đã biết mất kết
  nối từ trước.

### Testing

- Unit test `computeStatus(value, baseMin, baseMax)` — case: trong ngưỡng,
  dưới `BaseMin`, trên `BaseMax`, `BaseMin`/`BaseMax` null.
- Unit test staleness-check logic — mock `Date.now`: entry cũ (vượt
  `timeDelay`) → emit đúng 1 lần; entry mới → không emit; entry đã
  `lastStatus=2` → không emit lặp lại lần quét tiếp theo.
- Manual: publish tay message với Value vượt `BaseMax` → xem marker đổi
  đúng màu alarm ngay; đợi qua `timeDelay` không gửi gì thêm → xem marker tự
  chuyển vàng trong vòng ~30s, không cần reload/F5.
