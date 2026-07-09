# Frontend — Range Permission UI

Implements the "Range permission" section on the Consumer/Staff permission pages, consuming the
range API contract in `_workspace/01_backend_api_shape.md`. Existing site-list transfer UI left unchanged.

## Files changed

### Views (Pug)
- `views/permissionConsumer.pug` — added a second `.card` ("Range permission") BELOW the existing transfer-list card, inside `.container.py-2`.
- `views/permissionStaff.pug` — same section, staff wording.

New markup (both, identical except placeholder text):
- Form row: `select#rangeField` (options `SiteId` / `LoggerId`), `input#rangeFrom` (number), `input#rangeTo` (number), `button#addRangeBtn` (disabled until a user is selected).
- `div#rangeError` — inline red text area for the 400 `error` message.
- `table#rangeTable` with `tbody#rangeTableBody` — columns Field / From / To / Action(delete). Delete buttons carry class `.delete-range-btn` and `data-range-id`.

No new libraries added (uses already-loaded jQuery + axios + Bootstrap 5 + FontAwesome). No `package.json` `pkg.assets` change needed.

### Client JS
- `public/js/permissionConsumer.js` — appended range logic inside the existing `$(document).ready`.
- `public/js/permissionStaff.js` — same.

## Behaviour / DOM & event details

- **Base URL**: `hostname` (from `public/js/hostname.js`) already ends in `/api`, so calls are
  `${hostname}/GetConsumerSiteRange/:id`, `${hostname}/AddConsumerSiteRange`, `${hostname}/DeleteConsumerSiteRange/:id`
  (`Staff` variants on the staff page).
- **Current user tracking**: reuses the SAME select the transfer UI uses — `#consumerSelect` / `#staffSelect`.
  A separate `.on('change')` handler (additive, does not modify the existing one) refreshes the range table,
  clears the error, and toggles the Add button.
- **Load (GET)**: `loadRanges()` reads `$('#...Select').val()`; empty → placeholder row. Otherwise
  `GET /Get{Consumer,Staff}SiteRange/:id` → renders rows.
- **Add (POST)**: posts JSON `{ IdUser, Field, From, To }` (From/To sent as the raw `<input type=number>`
  string values; backend coerces with `Number()`). On success clears From/To inputs and re-fetches the list.
  On a 400 it reads `err.response.data.error` and shows it in `#rangeError`.
- **Delete (POST)**: `POST /Delete{Consumer,Staff}SiteRange/:rangeId` (id from `data-range-id`), then re-fetch.
- **Add button** enabled only when a user is selected (`updateAddRangeButton()`).

## Expected server data shape (consumed)
- GET list → JSON array of `{ _id, IdUser, Field, From, To }`.
- Add success → created doc (ignored; table re-fetched). Add failure → `400 { error: "<message>" }`.
- Delete → `deletedCount` number (ignored; table re-fetched).

## Notes for QA
- The range `<script>` lives in the existing `/js/permission{Consumer,Staff}.js` already referenced by each
  `.pug` (`block linkcriptbody`) — no new script tag needed.
- Delete uses POST (matches codebase convention), not HTTP DELETE.
