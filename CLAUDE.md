## Harness: node_malaysia feature dev (water-utility monitoring app)

**Goal:** Build/modify/verify Express+Mongoose+Pug+MQTT features consistently across backend, frontend, and integration QA.

**Trigger:** For feature work (new page, report, dashboard, alarm, telemetry, or any multi-file change), use the `feature-dev-orchestrator` skill. Simple questions can be answered directly.

**Search:** `graphify-out/graph.json` already built for this repo. For "where is X", "what calls Y", "how does Z work" questions, use `/graphify query "<question>"` instead of manual Grep/Explore sweeps — faster and traversal-aware. Re-run `/graphify --update` after large refactors so the graph doesn't go stale.

**Change log:**
| Date | Change | Target | Reason |
|------|--------|--------|--------|
| 2026-06-16 | Initial harness build | all (agents: backend-engineer, frontend-engineer, qa-reviewer; skills: express-mvc-pattern, pug-frontend-pattern, mqtt-realtime-pattern, integration-qa, feature-dev-orchestrator) | Project had no harness; built one matching Express MVC + Pug + MQTT architecture |
| 2026-07-22 | Add graphify search rule | CLAUDE.md | Graph already built (graphify-out/); prefer graph query over manual grep sweeps for codebase questions |
