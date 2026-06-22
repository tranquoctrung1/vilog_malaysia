---
name: pug-frontend-pattern
description: Use whenever building or editing a Pug view, dashboard widget, report table, chart, or client-side script/CSS in this app's views/ or public/ directories. Covers naming conventions, shared partials, and the whitelisted client libraries (bootstrap/jquery/axios/amcharts4) this packaged binary ships with. Trigger on "add a page/view", "new dashboard widget", "add a chart/table/report UI", "edit views/*.pug".
---

# Pug Frontend Pattern (node_malaysia)

## File layout

- `views/<name>.pug` — one view per route, same base filename as its controller/router counterpart (e.g. `dashboardLevel.js` controller → `views/dashboardLevel.pug`).
- `views/partial/` — shared layout fragments (nav, header, sidebar). Include these instead of duplicating chrome markup.
- `views/script/` — page-specific client JS (chart init, table population, socket listeners). One script per view, loaded from the matching `.pug`.
- `views/css/` — page-specific styles.

## Available client libraries (do not add new ones casually)

Served as static paths configured in `index.js` — only these are bundled into the pkg binary:
- `/bootstrap`, `/jquery`, `/popper`, `/axios`, `/amcharts4`
- Adding a different chart/UI library means: (1) it must be in `node_modules`, (2) `index.js` needs a new static mount, (3) `package.json` `pkg.assets` needs the dist path added, or it silently disappears from `dist/app.exe`.

## Data flow into a view

A controller calls `res.render('<viewName>', { title, companyName, username, content, ...featureData })`. Before writing a `.pug` file, get the exact object shape from `backend-engineer` (or read the controller directly) — Pug fails silently/renders blank on `undefined` access in some cases, so mismatched field names are a common defect (this is what `qa-reviewer` checks for).

## Realtime widgets

Live device data and alarms arrive via `socket.io-client` connecting to the server's socket.io instance (set up in `index.js`, fed by `mqtt/client.js`). When building a realtime widget:
1. Confirm the exact socket event name and payload shape with whoever owns the backend side.
2. Use `amcharts4` for charts and plain DOM/jQuery updates for tables/numbers — follow an existing script in `views/script/` for the connect/update pattern rather than inventing a new one.

## Forms

Forms `action`/AJAX posts must match the controller's expected `req.body` field names exactly — check `controller/<name>.js` before naming form inputs.
