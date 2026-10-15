# Changelog

<!-- release-marker -->

## [V1.10] - 2026-10-15
### Added
- BLP license gate: /license/activate and /license/info pages, 15-minute heartbeat, Ed25519 token verification; License menu visible to admins only.
- configVilog: logTime options 1m/2m/3m/6m for Kronhe/MAG8000, GetSendTimeVilog endpoint, publishedAt field.
- MAG8000 alarm bit decoding in data tables and on the map.

### Changed
- historyAlarm: added indexes, lean() queries, fixed DataTable (single init, exports use fresh data).
- gzip response compression, 7-day cache for /vendor.
- Data tables: centered columns, correct time sorting.

### Fixed
- DeleteSite now also removes the logger channels and data collections (when no other site shares the logger).
- Sites with invalid Latitude/Longitude are skipped on the map.
- sendTime 24h typo (1656 -> 1440 minutes).

## [V1.9] - 2026-07-22
### Added
- Added HTTPS support alongside HTTP (pfx cert), updated client links to production domain

## [V1.8] - 2026-07-10
### Fixed
- Filter sites missing SiteId/LoggerId across table, select, and status endpoints.

## [V1.7] - 2026-07-09
### Added
- Range-based permission model for consumers/staff: `consumerSiteRange`, `staffSiteRange`, `helper/sitePermission.js`.
- Server-side status computation applied to channel, site, data logger, and dashboard.

### Docs
- Design spec for range-based consumer/staff permissions.

## [V1.6] - 2026-07-01
### Added
- Integrated Socket.IO, bridging MQTT (`Vilog_RealTime`) messages to the realtime frontend.
- Realtime map marker updates and server-side disconnect detection, applied to `dashboardVilog` and the new `dashboardLevel` page.
- Design spec and implementation plan for the realtime socket architecture.

### Fixed
- Crash when `user` is null in `GetSiteByUid` / `GetStatusSite` (added null-checks).
- Marker/popup "jump" bug on the map after realtime updates.

## [V1.5] - 2026-06-22 – 2026-06-28
### Added
- New `/configVilog` and `/configVilogTable` pages, with auth guard and added channel data columns.

### Fixed
- Missing "Stop Logging" button class in `configVilog`.
- Slow map page load and delayed popup chart — channel fetch requests are now batched.

### Changed
- Vendored CDN JS/CSS libraries locally instead of loading from external CDNs; updated views accordingly.

## [V1.4] - 2026-05-06 – 2026-05-18
### Added
- New "Dashboard Level" page (controller, router, view).
- Assign-all / unassign-all buttons on consumer & staff permission pages.
- Marker tooltip auto-opens on map zoom (threshold z ≥ 14).

### Changed
- Bumped Node target to v22; added GZip compression for builds.

## [V1.3] - 2026-01-23 – 2026-03-20
### Added
- Config Vilog page and MQTT client wiring for logger configuration.
- Telegram alert configuration (controller/model/router/view) with configurable ranges.

### Changed
- Refinements to data logger and channel APIs (including SWOC API integration).

## [V1.2] - 2025-11-27 – 2025-12-30
### Fixed
- Corrected Malaysia timezone handling for site/channel/status data.
- Fixed mobile layout issue on the login page.

### Changed
- UI refinements across header, footer, sidebar, login, and permission pages.

### Added
- Device token API endpoint (for the SWOC mobile app).

## [V1.1] - 2025-10-10 – 2025-11-04
### Added
- Dashboard Vilog page and map view.
- History alarm page, data-online page, site config page, create-user page.
- Consumer/staff permission pages.

### Fixed
- Dashboard and "table data current" controller bugs.

## [V1.0] - 2025-08-15 – 2025-09-16
### Added
- Initial application scaffold: auth, controllers/models/routers/views for dashboards, quantity/pressure reports, alarms, camera, logger data (day/hour/month), display groups, and user/role/site management.

### Fixed
- Early bug fixes to `dashboardVilog`, `dataLogger`, and `tableDataCurrent` controllers; channel/site API fixes.
