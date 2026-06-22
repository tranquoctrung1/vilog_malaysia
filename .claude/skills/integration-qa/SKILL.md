---
name: integration-qa
description: Use after backend and/or frontend changes are made to this app, or whenever asked to verify/review/double-check a feature end-to-end. Checks router registration, permission wiring, controller-to-view data shape matches, and MQTT/socket event name matches. Trigger on "verify this works", "review the change", "check it's wired up correctly", "did I miss anything".
---

# Integration QA (node_malaysia)

This app's most common defect class is **silent interface mismatch** between layers — not missing files. Check these specific seams:

## 1. Route registration
- Is the new router required and mounted in `index.js`, with `Auth.auth` (or the correct middleware) in the `app.use(...)` call?
- Missing registration doesn't error — it falls through to the catch-all 404 handler. Test by tracing the path string from `views`/nav link back to `index.js`.

## 2. Permission wiring
- If the page should appear in a role's sidebar, does `RouterConfigModel.Function[].Children[].url` for that role contain the exact URL string used in `index.js`'s `app.use(path, ...)`? `middleware/permissionPage.js` compares these exactly — trailing slashes or case differences break it silently.

## 3. Controller → view data shape
- Open the controller's `res.render('<view>', {...})` call and the `.pug` file side by side.
- Every variable the `.pug` references (`#{var}`, `if var`, etc.) must exist in the object passed by the controller. Flag any name that doesn't match exactly (typos, case, singular/plural).

## 4. MQTT / socket event names
- The event name emitted server-side (`socket.emit('name', payload)` in `index.js` or wherever realtime forwarding happens) must exactly match what `views/script/*.js` listens for (`socket.on('name', ...)`).
- Payload field names on both sides must match — check this the same way as #3.

## 5. pkg build assets (if a new dependency/static path was added)
- New `node_modules` packages used by `views/*.pug` must appear in `package.json`'s `pkg.assets`, or `dist/app.exe` (the packaged binary) will be missing them at runtime even though dev mode works fine.

## Reporting format

One line per check: `PASS|FAIL <file:line> — <what was checked>`. For FAILs, name the exact mismatch (e.g. `controller passes "userName", view reads "username"`) so the fix is a one-line change.
