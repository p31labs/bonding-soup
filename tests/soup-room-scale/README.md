# `tests/soup-room-scale/` — scaffold

Reserved for **automated** room-scale checks (e.g. Playwright: two contexts, shared `room`, roster + reconnect).

**Today:** run the manual runbook **`docs/SOUP-ROOM-SCALE-RUNBOOK.md`** and the protocol gate **`npm run soup:room-scale`** (includes **`npm run test:mock-ws`**).

When you add specs here, register them in root **`package.json`** and, if they become part of the ship bar, **`p31-alignment.json`** **`verifyPipeline`** per **`docs/P31-ALIGNMENT-SYSTEM.md`**.
