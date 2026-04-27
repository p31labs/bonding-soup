# Mobile ops — Phase 6 (integration: Chromebook + iPhone)

**CWP:** `CWP-P31-MOBILE-OPS-2026-01`  
**Use when:** You want a **single proof** that local ops + edge + two devices line up (same Wi‑Fi for LAN pieces).

## Chromebook (same session)

- [ ] `npm run morning` (or `P31_CMD_CENTER_LAN=1 npm run command-center`) — converge OK, **3131** live  
- [ ] `curl` local + LAN IP for command center **200** (Phases 1–3)  
- [ ] `npm run mobile-ops:phase3` (command bar)  
- [ ] `npm run mobile-ops:phase4` (create bar — scripts only)  
- [ ] `npm run mobile-ops:phase5` (connect bar — edge)  
- [ ] `npm run mobile-ops:phase2` (production static sweep)  
- [ ] p31ca: `cd andromeda/04_SOFTWARE/p31ca && npm run verify` **exit 0** before a deploy test  

## iPhone (same Wi‑Fi, manual)

- [ ] Safari → `http://<LAN-IP>:3131` — command center loads  
- [ ] **Add to Home Screen** — opens **standalone** (Phase 2)  
- [ ] [https://p31ca.org/ops/](https://p31ca.org/ops/) — glass table + shift line  
- [ ] [https://p31ca.org/connect](https://p31ca.org/connect) — page loads; passkey: Face ID (manual)  
- [ ] [https://bonding.p31ca.org/](https://bonding.p31ca.org/) — play / touch  
- [ ] [https://p31ca.org/dome/](https://p31ca.org/dome/) — WebGL (device-dependent)  

## One-liner “all automated gates” (no iPhone)

```bash
npm run mobile-ops:phase2 && \
npm run mobile-ops:phase3 && \
npm run mobile-ops:phase4 && \
npm run mobile-ops:phase5
```

**Version:** 1.0.0 — 2026-04-28
