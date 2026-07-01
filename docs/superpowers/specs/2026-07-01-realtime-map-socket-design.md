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
