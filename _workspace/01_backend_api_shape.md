# Backend API Shape — Range-based Permission

Backend for the range-permission feature (spec: `docs/superpowers/specs/2026-07-09-range-permission-design.md`).
This file is the contract for the frontend-engineer building the "Range permission" UI in
`views/permissionConsumer.pug` / `views/permissionStaff.pug`.

All range endpoints live under the existing `/api` mount (`router/api/api.js`, mounted in `index.js` as
`app.use('/api', Api)`). The front-end already talks to `/api/...` (e.g. `/api/UpdateConsumerSite`,
`/api/GetSitePremissionConsumer/:userId`) for the existing site-list transfer UI — the new range calls
follow the exact same base path and axios usage.

The range document shape (both consumer and staff collections) is:

```
{
  "_id":    "665f...",   // string (Mongo ObjectId) — needed for delete
  "IdUser": "6650...",   // string — the target user's _id (User._id)
  "Field":  "SiteId",    // string — either "SiteId" or "LoggerId"
  "From":   1,           // number (inclusive lower bound)
  "To":     100          // number (inclusive upper bound)
}
```

`Field` compares against `Site.SiteId` or `Site.LoggerId` (stored as numeric strings). A user sees a site
when that site's chosen field value (as an integer) is between `From` and `To` inclusive — unioned with the
existing individually-assigned sites.

---

## Consumer endpoints

### 1. List ranges — `GET /api/GetConsumerSiteRange/:userId`

- `:userId` = the consumer user's `_id`. If it is the literal string `null` it is treated as empty.
- Request body: none.
- Response `200`: JSON array of range docs (empty array if none).

```json
[
  { "_id": "665f0a1b2c3d4e5f60718293", "IdUser": "6650aabbccddee0011223344", "Field": "SiteId",   "From": 1,   "To": 100 },
  { "_id": "665f0a1b2c3d4e5f60718294", "IdUser": "6650aabbccddee0011223344", "Field": "LoggerId", "From": 500, "To": 600 }
]
```

### 2. Add range — `POST /api/AddConsumerSiteRange`

- Request body (JSON, `Content-Type: application/json`):

```json
{ "IdUser": "6650aabbccddee0011223344", "Field": "SiteId", "From": 1, "To": 100 }
```

- `IdUser` (string, required) — target user's `_id`.
- `Field` (string, required) — must be exactly `"SiteId"` or `"LoggerId"`.
- `From` (number, required) — coerced with `Number()`; must be numeric.
- `To` (number, required) — coerced with `Number()`; must be numeric; `From <= To`.

- Response `200` (success): the created range document (includes generated `_id`):

```json
{ "_id": "665f0a1b2c3d4e5f60718295", "IdUser": "6650aabbccddee0011223344", "Field": "SiteId", "From": 1, "To": 100, "__v": 0 }
```

- Response `400` (validation failure): `{ "error": "<message>" }`. Possible messages:
  - `"IdUser is required"`
  - `"Field must be 'SiteId' or 'LoggerId'"`
  - `"From and To must be numeric"`
  - `"From must be less than or equal to To"`

### 3. Delete range — `POST /api/DeleteConsumerSiteRange/:id`

- `:id` = the range document's `_id`.
- Request body: none.
- Response `200`: a number — `deletedCount` (`1` if a doc was deleted, `0` if no match).

---

## Staff endpoints

Identical shapes; only the path segment differs (`Staff` instead of `Consumer`) and it reads/writes the
`t_Staff_Site_Range` collection.

- List:   `GET  /api/GetStaffSiteRange/:userId`  → array of range docs (same shape as above)
- Add:    `POST /api/AddStaffSiteRange`          → body `{ IdUser, Field, From, To }`; returns created doc or `400 {error}`
- Delete: `POST /api/DeleteStaffSiteRange/:id`   → returns `deletedCount` number

---

## Notes for the frontend

- Delete uses `POST` (not the HTTP `DELETE` verb) to match this codebase's existing convention
  (`/api/DeleteConsumerSite`, `/api/DeleteStaff/:id`, etc.).
- After a successful Add or Delete, re-fetch `GET /api/Get{Consumer,Staff}SiteRange/:userId` to refresh the
  list table — Add returns the single new doc, Delete returns only a count.
- `From`/`To` may be sent as strings from an `<input type="number">`; the backend coerces via `Number()`,
  so either numeric or numeric-string is accepted.
- The existing site-list transfer UI (`GetSitePremissionConsumer` / `UpdateConsumerSite` etc.) is unchanged —
  add the range section *below* it per the spec.

---

## Files created / modified

### Created
- `model/consumerSiteRange.js` — Mongoose model, collection `t_Consumer_Site_Range`, schema `{IdUser, Field, From, To}`.
- `model/staffSiteRange.js` — Mongoose model, collection `t_Staff_Site_Range`, same schema.
- `helper/sitePermission.js` — exports `getPermittedSiteIds(user)`; returns `null` (admin/unknown role → no filter),
  or an array of permitted `Site._id` strings (union of individually-assigned sites + range-matched sites via
  `$expr`/`$toInt`), or `[]` when nothing is permitted / user missing.
- `controller/api/consumerSiteRange.js` — `GetRanges`, `AddRange`, `DeleteRange`.
- `controller/api/staffSiteRange.js` — `GetRanges`, `AddRange`, `DeleteRange`.

### Modified
- `router/api/api.js` — required the two new controllers; registered 6 routes
  (`GET/POST/POST` for consumer and staff range endpoints).
- `controller/api/site.js` — `GetSiteForSWOC`, `GetSiteByUid` now use `getPermittedSiteIds`.
- `controller/api/statusSite.js` — `GetStatusSite` uses the helper.
- `controller/api/channel.js` — `GetChannelConfigSWOC`, `GetLastDataChannelConfigSWOC`,
  `GetLastDataChannelConfigTimeStampSWOC`, `GetChannelsSWOC` use the helper (4 blocks).
- `controller/api/dataLogger.js` — `GetDataLoggerByTimeStampAndAllSiteSWOC` uses the helper.
- `controller/api/tableDataCurrent.js` — `GetTableDataCurrent` uses the helper.
- `controller/api/historyAlarm.js` — `GetHistoryAlarm`, `GetLatestHistoryAlarm` use the helper.
- `controller/api/dashboardVilog.js` — `GetDataDashBoardVilog` uses the helper.
- `controller/api/dataLoggerDashboardVilog.js` — `GetDataLoggerAVG3DayVACC` uses the helper.

No `index.js` change was needed: range routes live in `router/api/api.js`, already mounted at `/api`.
