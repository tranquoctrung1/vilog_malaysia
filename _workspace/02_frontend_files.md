# historyAlarm UI rendering optimization — frontend changes

## Files changed

- `D:\project\node_malaysia\public\js\historyAlarm.js` — rewritten (bug fix).
- `D:\project\node_malaysia\views\historyAlarm.pug` — **not changed**. No markup
  change was needed; `tbody#alarmTableBody` stays as-is and is now fully
  managed by the DataTables API instead of raw `innerHTML` writes.

## What changed and why

**Bug fixed:** `drawTable()` previously called `$('#alarmTable').DataTable({ retrieve: true, ... })`
on every load/"View" click. `renderDataTable()` wiped `alarmTableBody.innerHTML`
and rebuilt `<tr>`s as raw HTML on each refresh, destroying the DOM nodes the
existing DataTables instance tracked internally; with `retrieve: true`,
re-calling `.DataTable()` just returned the existing API instance without
re-scanning the DOM, so its internal data cache (used for sort/search/paging
and — critically — the Excel/CSV/PDF export buttons) kept pointing at stale,
destroyed rows after any filter change.

**Fix applied:**
- `alarmDataTable` is now initialized exactly once, guarded by
  `if (!alarmDataTable) { alarmDataTable = $('#alarmTable').DataTable(getDataTableOptions()); }`.
  `retrieve: true` was removed — it's no longer needed since init only ever
  runs once.
- `renderDataTable()` (string concatenation into `innerHTML`) was replaced by
  `buildRowsData(data)`, which returns an array of row objects keyed by
  column index (`{0:..,1:..,...,5:.., DT_RowAttr:{...}}`) instead of building
  one giant HTML string.
- Every subsequent refresh (initial load and every "View" click) now goes
  through `drawTable(rowsData)` → `alarmDataTable.clear(); alarmDataTable.rows.add(rowsData); alarmDataTable.draw();`,
  which updates DataTables' internal cache and the live DOM together, so
  sorting/search/paging and the export buttons stay in sync with the latest
  data.
- The jQuery-based `getAlarmTag` post-pass over `tbody tr` (previously run
  inside `drawTable()` after the raw HTML insert) was converted into a plain
  function called while building each row's cell 5 value, before insertion —
  same `tag-warning` (disconnect/delay) vs `tag-danger` logic, same
  `<span class="alarm-tag ...">` markup.
- Content typo-fixes (waring→warning, Comunication→Communication,
  Lower→Low) were extracted into `normalizeAlarmContent()`, same logic as
  before, applied before building the row.
- `data-alarm-type` is preserved on the rendered `<tr>` via DataTables'
  `DT_RowAttr: { 'data-alarm-type': content }` row option (grepped the repo —
  this attribute is only read/written inside `historyAlarm.js` itself, no
  other file depends on it).
- Cells 0–4 are coerced to strings (`` `${...}` ``) to match the old
  template-literal output exactly when a field (e.g. `SiteId`) is missing on
  a record — avoids a DataTables "Requested unknown parameter" warning/alert
  that an `undefined` cell value would otherwise trigger with the new
  object-row data source. Cell 5 (`Content`) is left as-is; a missing
  `Content` already threw at `.toLowerCase()` before this change, same as
  now.
- Column rendering is unchanged: same 6 columns, same `columnDefs` filter/sort
  render for column 5 (strips the `<span>` tag for filter/sort via
  `$(data).text()`), same `order: [[4, 'desc']]`, same export button config
  (Excel/CSV/PDF), same mobile-responsive `dom`/`responsive`/`columnDefs`
  branching based on `/Mobi|Android/i.test(navigator.userAgent)`.
- Default initial load behavior is unchanged: on `$(document).ready`, start =
  now − 30 days, end = now, same `#startHour`/`#endHour` population logic,
  same call into `getDataHistoryAlarm`.

## API shape/consumption — unchanged

- Still calls `GET ${hostname}/gethistoryalarmdata/:start/:end/:username`
  via axios, same URL construction (`start`/`end` as epoch ms from
  `new Date(...).getTime()`, `username` from `#userName` DOM element,
  defaulting to `'admin'`).
- Still consumes the response as a plain array of HistoryAlarm docs and
  reads exactly the same fields: `SiteId, Location, ChannelName,
  TimeStampHasValue, TimeStampAlarm, Content`. No new fields are read, no
  fields are dropped, no shape assumptions changed.
- No socket.io events are used on this page (none before, none now).

## Dependencies / globals relied on (unchanged)

- `hostname` global from `/js/hostname.js` (loaded before `historyAlarm.js`
  in `views/historyAlarm.pug`).
- `convertDateToString` / `convertDateFromApi` from `/js/util.js` — this
  script tag loads *after* `historyAlarm.js` in the pug file, but this was
  already true before the change and is safe because both functions are
  only invoked inside the async axios `.then()` callback, which runs after
  all `<script>` tags (including `util.js`) have executed.
- jQuery, DataTables core + buttons/responsive extensions, JSZip, pdfmake —
  all already whitelisted and loaded in `views/historyAlarm.pug`; no new
  library was introduced.

## Verification

- `node --check public/js/historyAlarm.js` passes (syntax only).
- Not browser-tested in this pass — the app requires a running Mongo
  instance and passes through a license gate (`middleware/licenseGate.js`),
  which wasn't exercised here. qa-reviewer should confirm end-to-end
  (initial load renders ~30 days of alarms once, then clicking "View" with a
  narrower/wider range updates the table in place without a second
  `.DataTable()` init error, and exporting via Excel/CSV/PDF reflects the
  currently-filtered/sorted data, not stale data from a previous load).
