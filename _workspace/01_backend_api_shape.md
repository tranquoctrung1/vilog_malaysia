# historyAlarm backend optimization — API shape (unchanged)

## Route (unchanged)
`GET /api/GetHistoryAlarmData/:start/:end/:username` — mounted in `router/api/api.js`, handled by `controller/api/historyAlarm.js#GetHistoryAlarm`.

Params:
- `start`, `end` — epoch ms strings, parsed via `new Date(parseInt(...))`, then shifted `+8` hours.
- `username` — looked up via `UserModel.findOne({ Username: username })` to resolve permitted sites.

## Response shape (unchanged, confirmed)
`res.json(result)` where `result` is a plain JSON array of HistoryAlarm documents (now plain JS objects via `.lean()`, not Mongoose documents — JSON.stringify output is byte-identical since no virtuals/methods were used). Each element has the same fields as before:

```json
[
  {
    "_id": "...",
    "SiteId": "string",
    "Location": "string",
    "ChanneId": "string",
    "ChannelName": "string",
    "LoggerId": "string",
    "Content": "string",
    "TimeStampHasValue": "ISODate string",
    "TimeStampAlarm": "ISODate string",
    "Type": 0,
    "__v": 0
  },
  ...
]
```

Sort order unchanged: `TimeStampAlarm` descending. No pagination, no cap — full result set returned for the date range (required for client-side Excel/CSV/PDF export).

**Verification notes:**
- `index.js` calls `mongoose.connect(...)` with no `autoIndex` option set, so mongoose 8's default (`autoIndex: true`) applies — the new `historyAlarm.index(...)` declarations will be built automatically on next app start/connect. No manual `createIndex` step needed.
- Grepped the repo for writers to the `t_History_Alarm` collection (raw driver, `insertMany`, `new HistoryAlarm`, etc.) — only `model/historyAlarm.js` references that collection name; no other writer bypasses the Mongoose model. So `.lean()` output is field-identical to the previously-hydrated output (no custom `toJSON`/`toObject` transforms or plugins found on this schema either).
- `node --check` passed on both edited files; `require('./model/historyAlarm')` compiles the schema standalone without errors.

`GetLatestHistoryAlarm` (`/api/GetLatestHistoryAlarm/:username`) was left untouched — not used by the historyAlarm page, out of scope.

## Files changed
- `model/historyAlarm.js` — added two indexes:
  - `historyAlarm.index({ TimeStampAlarm: -1 })` — covers the unrestricted-permission query path.
  - `historyAlarm.index({ SiteId: 1, TimeStampAlarm: -1 })` — covers the permission-restricted query path (`SiteId: { $in: [...] }` + `TimeStampAlarm` range, sorted desc).
- `controller/api/historyAlarm.js` — added `.lean()` to both `HistoryAlarm.find(...)` calls inside `GetHistoryAlarm` (the unrestricted branch and the `SiteId`-restricted branch). `GetLatestHistoryAlarm` left exactly as-is.

## Notes for frontend-engineer
No change needed on your side — response is the same array shape, same field names, same sort order, same lack of pagination. This was a pure backend data-access optimization (index + lean hydration skip).
