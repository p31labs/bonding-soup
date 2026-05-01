# MESH — TRIPER Pre-flight Checklist

**K₄ topology is immutable. 4 vertices. 6 edges. Single account.**

## Structural (automated — `npm run test:triper:mesh`)
- [ ] K₄: 4 vertices, 6 edges (complete graph invariant)
- [ ] All mesh Worker URLs are HTTPS
- [ ] All mesh Worker URLs use trimtab-signal.workers.dev
- [ ] Passkey API base path is relative (not absolute)
- [ ] Remembrance warm white is #f5f0e8
- [ ] No credentials in mesh constants
- [ ] No full child names in mesh constants
- [ ] Fleet sources include p31-constants.json
- [ ] Glass probes cover k4-personal, k4-cage, bonding-relay
- [ ] p31-mesh package exists
- [ ] k4-agent-hub-client package exists

## Execution (automated — `npm run triper:exec mesh`)
- [ ] verify:mesh-offline passes
- [ ] verify:mesh-canon passes
- [ ] verify:k4-agent-hub passes
- [ ] verify:ecosystem passes
- [ ] k4-agent-hub:smoke:offline passes

## Live Mesh (manual — run MESH_LIVE_STRICT=1)
- [ ] k4-personal /api/health returns 200
- [ ] k4-cage /api/health returns 200
- [ ] k4-hubs /api/hubs returns hub list
- [ ] bonding-relay is reachable
- [ ] geodesic-room is reachable
- [ ] All 12 workers in fleet respond

## K₄ Invariants (never change these)
- [ ] cage vertices: {will, sj, wj, christyn}
- [ ] personal mesh isolated from cage (no vertex leakage)
- [ ] Edge count: 6 (K₄ complete graph)
- [ ] Worker account: trimtab-signal (single account)

## Regression Guards
- [ ] k4-cage URL domain unchanged
- [ ] k4-personal URL domain unchanged
- [ ] edgeLabWorkerUrl still cf-edge-lab prefix
- [ ] geodesicRoomWorkerUrl still geodesic-room prefix

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
Mesh live check: PASS / SKIP (network)
TRIPER cert: PASS / FAIL
Notes: ___________
```
