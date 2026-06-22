---
name: express-mvc-pattern
description: Use whenever adding or modifying a backend feature in this Express/Mongoose app — new page route, new API endpoint, new alarm/report/logger type, permission rule, or controller logic. Covers the exact router→middleware→controller→model layering and registration steps this codebase requires. Trigger on "add a route/page/endpoint", "new controller", "add a model field", "wire up X in index.js".
---

# Express MVC Pattern (node_malaysia)

This app is a water-utility monitoring system. Every feature follows a fixed 4-layer flow:

```
index.js  -->  router/<name>.js  -->  middleware/auth.js (Auth.auth)  -->  controller/<name>.js  -->  model/<Name>.js
```

## Steps to add a new feature page

1. **Model** (`model/<Name>.js`) — define/extend a Mongoose schema only if new data needs storing. Reuse an existing model when possible (e.g. alarms reuse `Alarm.js`, device samples reuse `DeviceLogger.js`/`Logger.js`).
2. **Controller** (`controller/<name>.js`) — async function exported as `module.exports.<FnName>`. Reads `req.cookies`/`req.params`/`req.body`, queries the model, calls `res.render('<viewName>', {...})` for pages or `res.json(...)` for API routes. Pull shared chrome data (title, companyName, username, sidebar content) the same way `controller/dashboard.js` does via `settings.json` + `RouterConfigMiddelware.RouterConfig`.
3. **Router** (`router/<name>.js`) — thin Express Router that maps a path to the controller function. Mirror the structure of an existing router file in this directory before writing a new one.
4. **Register in `index.js`** — add `const X = require('./router/x');` near the other route requires, then `app.use('/x', Auth.auth, X);` in the route-mounting block. Pages that should be visible only to certain roles must additionally line up with `RouterConfigModel` (see permission rule below) — don't skip this or the page silently 404s via `middleware/permissionPage.js`.
5. **API-only routes** live under `router/api/` and are mounted at `/api` in `index.js` (separate from page routes) — use this path when building a JSON endpoint instead of a page.

## Permission rule (important)

Pages are gated per-Role via `RouterConfigModel`. A route only becomes reachable in the rendered sidebar/nav if its URL exists in `RouterConfigModel.Function[].Children[].url` for the user's `Role`. When adding a new page that should appear for a role, that role's `RouterConfig` document needs the new URL added — this is data, not code, so check `model/routerConfig.js` and existing seed/admin flows rather than hardcoding logic in middleware.

## Conventions to preserve

- One file per feature per layer, same base filename across model/controller/router/view.
- Controllers are `async function`, no try/catch needed for the happy path — `express-async-errors` (required in `index.js`) forwards rejections to the global error handler (`res.status(500).render('500')`).
- Cookies (`req.cookies.username`) are the session identity mechanism here, not `express-session` (currently commented out in `index.js`) — don't reintroduce session-based auth without discussing scope.
- New `node_modules` dependencies must be added to `package.json`'s `pkg.scripts`/`pkg.assets` arrays or they won't exist in the packaged `dist/app.exe` binary build.
