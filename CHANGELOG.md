# Changelog

Quy ước version: bắt đầu từ **V1.0**, mỗi lần thay đổi/release sẽ tăng thêm **0.1** (V1.0 → V1.1 → V1.2 → ... → V1.9 → V1.10 → V1.11 ...). Version được lưu ở `package.json` (dạng semver `major.minor.0`, ví dụ V1.7 = `1.7.0`).

Mục mới nhất nằm trên cùng. Từ V1.8 trở đi, mục changelog được sinh tự động bởi `npm run release` (xem `scripts/release.js`) — không sửa tay phần trên `<!-- release-marker -->

## [V1.9] - 2026-07-22
### Added
- Ho tro chay HTTPS song song HTTP (pfx cert), sua link client tro ve domain vilog.pws.com.my

## [V1.8] - 2026-07-10
### Fixed
- filter sites missing SiteId/LoggerId across table, select, and status endpoints` bên dưới nếu không cần thiết, script sẽ tự chèn vào đúng vị trí.

<!-- release-marker -->

## [V1.7] - 2026-07-09
### Added
- Mô hình phân quyền theo dải (range) cho consumer/staff: `consumerSiteRange`, `staffSiteRange`, `helper/sitePermission.js`.
- Tính toán trạng thái (status) phía server áp dụng cho channel, site, data logger, dashboard.

### Docs
- Spec thiết kế phân quyền range-based cho consumer/staff.

## [V1.6] - 2026-07-01
### Added
- Tích hợp Socket.IO, cầu nối tin nhắn MQTT (`Vilog_RealTime`) sang frontend realtime.
- Cập nhật marker bản đồ realtime + phát hiện mất kết nối (disconnect) phía server, áp dụng cho `dashboardVilog` và trang mới `dashboardLevel`.
- Spec thiết kế + kế hoạch triển khai cho kiến trúc realtime socket.

### Fixed
- Crash khi `user` null trong `GetSiteByUid` / `GetStatusSite` (thêm null-check).
- Lỗi marker/popup bị "nhảy" trên bản đồ sau khi cập nhật realtime.

## [V1.5] - 2026-06-22 – 2026-06-28
### Added
- Trang `/configVilog` và `/configVilogTable` mới, có auth guard, thêm cột dữ liệu channel.

### Fixed
- Thiếu class nút "Stop Logging" trong `configVilog`.
- Bản đồ tải chậm, popup chart bị delay — gộp (batch) request lấy channel.

### Changed
- Chuyển các thư viện CDN (JS/CSS) về host local thay vì tải từ CDN ngoài; cập nhật view tương ứng.

## [V1.4] - 2026-05-06 – 2026-05-18
### Added
- Trang "Dashboard Level" mới (controller, router, view).
- Nút assign-all / unassign-all trên trang phân quyền consumer & staff.
- Tự mở tooltip marker khi zoom bản đồ (ngưỡng z ≥ 14).

### Changed
- Nâng target Node lên bản 22; thêm nén GZip cho bản build.

## [V1.3] - 2026-01-23 – 2026-03-20
### Added
- Trang Config Vilog + kết nối MQTT client để cấu hình logger.
- Cấu hình cảnh báo Telegram (controller/model/router/view) với ngưỡng theo dải (range).

### Changed
- Tinh chỉnh API data logger và channel (kèm tích hợp SWOC API).

## [V1.2] - 2025-11-27 – 2025-12-30
### Fixed
- Xử lý đúng timezone Malaysia cho dữ liệu site/channel/status.
- Lỗi giao diện mobile ở trang đăng nhập.

### Changed
- Tinh chỉnh UI: header, footer, sidebar, login, trang phân quyền.

### Added
- API device token (phục vụ app SWOC mobile).

## [V1.1] - 2025-10-10 – 2025-11-04
### Added
- Trang Dashboard Vilog và bản đồ (map view).
- Trang lịch sử cảnh báo (history alarm), trang data-online, trang cấu hình site, trang tạo user.
- Trang phân quyền consumer/staff.

### Fixed
- Lỗi controller dashboard và "table data current".

## [V1.0] - 2025-08-15 – 2025-09-16
### Added
- Khung ứng dụng ban đầu: auth, controller/model/router/view cho dashboard, báo cáo lưu lượng/áp suất, cảnh báo, camera, dữ liệu logger (ngày/giờ/tháng), display group, quản lý user/role/site.

### Fixed
- Sửa lỗi ban đầu ở controller `dashboardVilog`, `dataLogger`, `tableDataCurrent`; sửa API channel/site.
