# P31 user navigation tree & link audit

**Generated:** 2026-05-03T02:28:43.926Z — rerun `npm run nav:report`.

| Artifact | Purpose |
|----------|---------|
| This file | Human review: fan-out, orphans, jitterbug-style traversal |
| `docs/generated/nav-edges-bonding.tsv` | Directed edges BondingSoup |
| `docs/generated/nav-edges-p31ca-public.tsv` | Directed edges hub `public/` |

## Concepts

| Term | Definition |
|------|-------------|
| **Directed graph** | Page = vertex; `<a href>` = tagged edge toward another asset |
| **Fan-out** | Immediate choices on one page (= out-degree toward local `.html` files) |
| **Jitterbug traversal** | Any user session = a walk along directed edges — Fuller's jitterbug unfolds the same polyhedron combinatorially; here we unfold *every* instantaneous choice per page.
| **Orphans** | Files in crawl universe whose graph has no inbound path from seeded entry points |

## C.A.R.S. / bonding-soup (repo root demo server)

**Filesystem root:** `.`

**Seeds:** `soup.html`, `fleet-portal.html`, `cognitive-passport/index.html`, `docs/doc-library/index.html`, `docs/physics-learn/index.html`, `p31-personal-howto.html`, `p31-device-setup.html`, `poets-room.html`

**Traversal stops at edges into:** `andromeda/*` *(pages still counted as reachable targets from outside; crawler does not open them).*

| Metric | Count | Notes |
|--------|------:|-------|
| HTML in crawl universe | 27 | |
| Reachable internally | 25 | BFS from seeds |
| Orphans | 12 | in universe only |
| Broken (no file after redirects) | 7 | |
| Outbound https / other hosts | 221 | |
| `/` SPA home links | 12 | not missing — deploy root |
| `.md` anchors | 48 | prose, not shipped HTML routes |
| Non-HTML file links | 3 | e.g. `.nvmrc`, config |
| `_redirects` entries loaded | 0 | |

### Orphan HTML (12) — not reached from seeds

- `agents.html`
- `command-center-cli.html`
- `command-center-terminal.html`
- `demo-tour.html`
- `launch-readiness.html`
- `p31-quantum-material-u.html`
- `docs/p31-delta-glossary.html`
- `spikes/d20-geodesic-icosahedron/omnibus-icosa-three-r128.html`
- `spikes/d20-geodesic-icosahedron/react/index.html`
- `spikes/posner-stable/index.html`
- `spikes/sovereign-geodesic-preview/index.html`
- `spikes/spatial-chat/spike-02-demo.html`

### Markdown-linked: 48 anchors (skipped for HTML QA)

### Broken filesystem targets

| From | href | note |
|------|------|------|
| `launch.html` | `./` | missing |
| `demos/index.html` | `../` | missing |
| `demos/index.html` | `/connect` | unresolved / path |
| `glass-box.html` | `/reports/index.json` | unresolved / path |
| `glass-box.html` | `/verify-pulse.json` | unresolved / path |
| `glass-box.html` | `/reports/promoted/index.json` | unresolved / path |
| `demos/the-pulse.html` | `../` | missing |

### Fan-out (distinct internal `.html` targets)

| Page | Out-degree |
|------|------------|
| `soup.html` | 19 |
| `p31-personal-howto.html` | 13 |
| `p31-device-setup.html` | 8 |
| `docs/doc-library/index.html` | 7 |
| `docs/physics-learn/labs.html` | 6 |
| `launch.html` | 6 |
| `cognitive-passport/index.html` | 5 |
| `docs/physics-learn/index.html` | 5 |
| `demos/index.html` | 4 |
| `poets-room.html` | 4 |
| `demos/the-pulse.html` | 3 |
| `p31-slicer.html` | 3 |
| `demos/the-same-shape.html` | 2 |
| `glass-box-widget.html` | 2 |
| `glass-box.html` | 2 |
| `p31-sovereign-lab.html` | 2 |
| `andromeda/04_SOFTWARE/p31ca/public/connect.html` | 0 |
| `andromeda/04_SOFTWARE/p31ca/public/initial-build.html` | 0 |
| `andromeda/04_SOFTWARE/p31ca/public/k4market.html` | 0 |
| `andromeda/04_SOFTWARE/p31ca/public/mesh-start.html` | 0 |
| `andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html` | 0 |
| `andromeda/04_SOFTWARE/p31ca/public/vibe.html` | 0 |
| `fleet-portal.html` | 0 |
| `garden-phos-probe.html` | 0 |
| `social-cards/index.html` | 0 |

### Edge sample (140 rows; full dump → generated TSV)

| From | href | → |
|------|------|---|
| `cognitive-passport/index.html` | ../andromeda/04_SOFTWARE/p31ca/public/vibe.html | `andromeda/04_SOFTWARE/p31ca/public/vibe.html` |
| `cognitive-passport/index.html` | ../demos/index.html | `demos/index.html` |
| `cognitive-passport/index.html` | ../glass-box.html | `glass-box.html` |
| `cognitive-passport/index.html` | ../p31-sovereign-lab.html | `p31-sovereign-lab.html` |
| `cognitive-passport/index.html` | ../soup.html | `soup.html` |
| `demos/index.html` | ./the-pulse.html | `demos/the-pulse.html` |
| `demos/index.html` | ./the-same-shape.html | `demos/the-same-shape.html` |
| `demos/index.html` | ../glass-box-widget.html | `glass-box-widget.html` |
| `demos/index.html` | ../glass-box.html | `glass-box.html` |
| `demos/the-pulse.html` | ./ | `demos/index.html` |
| `demos/the-pulse.html` | ./the-same-shape.html | `demos/the-same-shape.html` |
| `demos/the-pulse.html` | ../glass-box.html | `glass-box.html` |
| `demos/the-same-shape.html` | ./ | `demos/index.html` |
| `demos/the-same-shape.html` | ./the-pulse.html | `demos/the-pulse.html` |
| `docs/doc-library/index.html` | ../../andromeda/04_SOFTWARE/p31ca/public/connect.html | `andromeda/04_SOFTWARE/p31ca/public/connect.html` |
| `docs/doc-library/index.html` | ../../andromeda/04_SOFTWARE/p31ca/public/initial-build.html | `andromeda/04_SOFTWARE/p31ca/public/initial-build.html` |
| `docs/doc-library/index.html` | ../../andromeda/04_SOFTWARE/p31ca/public/k4market.html | `andromeda/04_SOFTWARE/p31ca/public/k4market.html` |
| `docs/doc-library/index.html` | ../physics-learn/index.html | `docs/physics-learn/index.html` |
| `docs/doc-library/index.html` | ../../p31-personal-howto.html | `p31-personal-howto.html` |
| `docs/doc-library/index.html` | ../../poets-room.html | `poets-room.html` |
| `docs/doc-library/index.html` | ../../soup.html | `soup.html` |
| `docs/physics-learn/index.html` | ../../cognitive-passport/index.html | `cognitive-passport/index.html` |
| `docs/physics-learn/index.html` | ../doc-library/index.html | `docs/doc-library/index.html` |
| `docs/physics-learn/index.html` | labs.html | `docs/physics-learn/labs.html` |
| `docs/physics-learn/index.html` | ../../poets-room.html | `poets-room.html` |
| `docs/physics-learn/index.html` | ../../soup.html | `soup.html` |
| `docs/physics-learn/labs.html` | ../../andromeda/04_SOFTWARE/p31ca/public/k4market.html | `andromeda/04_SOFTWARE/p31ca/public/k4market.html` |
| `docs/physics-learn/labs.html` | ../doc-library/index.html | `docs/doc-library/index.html` |
| `docs/physics-learn/labs.html` | index.html | `docs/physics-learn/index.html` |
| `docs/physics-learn/labs.html` | ../../p31-personal-howto.html | `p31-personal-howto.html` |
| `docs/physics-learn/labs.html` | ../../poets-room.html | `poets-room.html` |
| `docs/physics-learn/labs.html` | ../../soup.html | `soup.html` |
| `glass-box-widget.html` | /demos/index.html | `demos/index.html` |
| `glass-box-widget.html` | /glass-box.html | `glass-box.html` |
| `glass-box.html` | /demos/index.html | `demos/index.html` |
| `glass-box.html` | /glass-box-widget.html | `glass-box-widget.html` |
| `launch.html` | cognitive-passport/ | `cognitive-passport/index.html` |
| `launch.html` | demos/ | `demos/index.html` |
| `launch.html` | demos/the-pulse.html | `demos/the-pulse.html` |
| `launch.html` | demos/the-same-shape.html | `demos/the-same-shape.html` |
| `launch.html` | glass-box.html | `glass-box.html` |
| `launch.html` | social-cards/ | `social-cards/index.html` |
| `p31-device-setup.html` | demos/index.html | `demos/index.html` |
| `p31-device-setup.html` | docs/doc-library/index.html | `docs/doc-library/index.html` |
| `p31-device-setup.html` | fleet-portal.html | `fleet-portal.html` |
| `p31-device-setup.html` | glass-box.html | `glass-box.html` |
| `p31-device-setup.html` | p31-personal-howto.html | `p31-personal-howto.html` |
| `p31-device-setup.html` | p31-slicer.html | `p31-slicer.html` |
| `p31-device-setup.html` | p31-sovereign-lab.html | `p31-sovereign-lab.html` |
| `p31-device-setup.html` | soup.html | `soup.html` |
| `p31-personal-howto.html` | andromeda/04_SOFTWARE/p31ca/public/k4market.html | `andromeda/04_SOFTWARE/p31ca/public/k4market.html` |
| `p31-personal-howto.html` | andromeda/04_SOFTWARE/p31ca/public/vibe.html | `andromeda/04_SOFTWARE/p31ca/public/vibe.html` |
| `p31-personal-howto.html` | cognitive-passport/index.html | `cognitive-passport/index.html` |
| `p31-personal-howto.html` | demos/index.html | `demos/index.html` |
| `p31-personal-howto.html` | docs/doc-library/index.html | `docs/doc-library/index.html` |
| `p31-personal-howto.html` | docs/physics-learn/index.html | `docs/physics-learn/index.html` |
| `p31-personal-howto.html` | fleet-portal.html | `fleet-portal.html` |
| `p31-personal-howto.html` | glass-box.html | `glass-box.html` |
| `p31-personal-howto.html` | p31-device-setup.html | `p31-device-setup.html` |
| `p31-personal-howto.html` | p31-slicer.html | `p31-slicer.html` |
| `p31-personal-howto.html` | p31-sovereign-lab.html | `p31-sovereign-lab.html` |
| `p31-personal-howto.html` | poets-room.html | `poets-room.html` |
| `p31-personal-howto.html` | soup.html | `soup.html` |
| `p31-slicer.html` | docs/doc-library/index.html | `docs/doc-library/index.html` |
| `p31-slicer.html` | p31-sovereign-lab.html | `p31-sovereign-lab.html` |
| `p31-slicer.html` | soup.html | `soup.html` |
| `p31-sovereign-lab.html` | p31-slicer.html | `p31-slicer.html` |
| `p31-sovereign-lab.html` | soup.html | `soup.html` |
| `poets-room.html` | docs/physics-learn/index.html | `docs/physics-learn/index.html` |
| `poets-room.html` | p31-slicer.html | `p31-slicer.html` |
| `poets-room.html` | p31-sovereign-lab.html | `p31-sovereign-lab.html` |
| `poets-room.html` | soup.html | `soup.html` |
| `soup.html` | andromeda/04_SOFTWARE/p31ca/public/connect.html | `andromeda/04_SOFTWARE/p31ca/public/connect.html` |
| `soup.html` | andromeda/04_SOFTWARE/p31ca/public/initial-build.html | `andromeda/04_SOFTWARE/p31ca/public/initial-build.html` |
| `soup.html` | andromeda/04_SOFTWARE/p31ca/public/k4market.html | `andromeda/04_SOFTWARE/p31ca/public/k4market.html` |
| `soup.html` | andromeda/04_SOFTWARE/p31ca/public/mesh-start.html | `andromeda/04_SOFTWARE/p31ca/public/mesh-start.html` |
| `soup.html` | andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html | `andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html` |
| `soup.html` | andromeda/04_SOFTWARE/p31ca/public/vibe.html | `andromeda/04_SOFTWARE/p31ca/public/vibe.html` |
| `soup.html` | cognitive-passport/index.html | `cognitive-passport/index.html` |
| `soup.html` | demos/index.html | `demos/index.html` |
| `soup.html` | docs/doc-library/index.html | `docs/doc-library/index.html` |
| `soup.html` | docs/physics-learn/index.html | `docs/physics-learn/index.html` |
| `soup.html` | fleet-portal.html | `fleet-portal.html` |
| `soup.html` | garden-phos-probe.html | `garden-phos-probe.html` |
| `soup.html` | glass-box.html | `glass-box.html` |
| `soup.html` | launch.html | `launch.html` |
| `soup.html` | p31-device-setup.html | `p31-device-setup.html` |
| `soup.html` | p31-personal-howto.html | `p31-personal-howto.html` |
| `soup.html` | p31-slicer.html | `p31-slicer.html` |
| `soup.html` | p31-sovereign-lab.html | `p31-sovereign-lab.html` |
| `soup.html` | poets-room.html | `poets-room.html` |

### Mermaid (reachable spine excerpt — readability)

```mermaid
flowchart LR
  nbef7411702["andromeda/04_SOFTWARE/p31ca/public/connect.htm…"]
  n65061aec09["andromeda/04_SOFTWARE/p31ca/public/initial-bui…"]
  ne94a8f9605["andromeda/04_SOFTWARE/p31ca/public/k4market.ht…"]
  n1cae61e20e["andromeda/04_SOFTWARE/p31ca/public/mesh-start.…"]
  n7c80b15a01["andromeda/04_SOFTWARE/p31ca/public/planetary-o…"]
  n63b5e07347["andromeda/04_SOFTWARE/p31ca/public/vibe.html…"]
  nd010492873["cognitive-passport/index.html…"]
  n4958e6ad8f["demos/index.html…"]
  n9e6f82be7b["demos/the-pulse.html…"]
  nbe7ad6b866["demos/the-same-shape.html…"]
  n646d9281bb["docs/doc-library/index.html…"]
  n802af462c9["docs/physics-learn/index.html…"]
  nf70f0b8c57["docs/physics-learn/labs.html…"]
  nec1d1c34b5["fleet-portal.html…"]
  n5b0f4c9016["garden-phos-probe.html…"]
  nc1f0ffb738["glass-box-widget.html…"]
  n0f7eccba3e["glass-box.html…"]
  n98e73ccc99["launch.html…"]
  nd9acc59220["p31-device-setup.html…"]
  n3bff1e10dd["p31-personal-howto.html…"]
  ne4bbd69c06["p31-slicer.html…"]
  na2ae092104["p31-sovereign-lab.html…"]
  na2975ab07d["poets-room.html…"]
  n7e44471659["social-cards/index.html…"]
  n593b681a87["soup.html…"]
  n593b681a87 --> n646d9281bb
  n593b681a87 --> n802af462c9
  n593b681a87 --> ne4bbd69c06
  n593b681a87 --> na2ae092104
  n593b681a87 --> ne94a8f9605
  n593b681a87 --> n98e73ccc99
  n593b681a87 --> nec1d1c34b5
  n593b681a87 --> n3bff1e10dd
  n593b681a87 --> nd9acc59220
  n593b681a87 --> na2975ab07d
  n593b681a87 --> n5b0f4c9016
  n593b681a87 --> nd010492873
  n593b681a87 --> n4958e6ad8f
  n593b681a87 --> n0f7eccba3e
  n593b681a87 --> n63b5e07347
  n593b681a87 --> n7c80b15a01
  n593b681a87 --> n1cae61e20e
  n593b681a87 --> nbef7411702
  n593b681a87 --> n65061aec09
  nd010492873 --> n593b681a87
  nd010492873 --> na2ae092104
  nd010492873 --> n4958e6ad8f
  nd010492873 --> n0f7eccba3e
  nd010492873 --> n63b5e07347
  n646d9281bb --> n802af462c9
  n646d9281bb --> ne94a8f9605
  n646d9281bb --> na2975ab07d
  n646d9281bb --> n593b681a87
  n646d9281bb --> n65061aec09
  n646d9281bb --> nbef7411702
  n646d9281bb --> n3bff1e10dd
  n802af462c9 --> nf70f0b8c57
  n802af462c9 --> na2975ab07d
  n802af462c9 --> n593b681a87
  n802af462c9 --> n646d9281bb
  n802af462c9 --> nd010492873
  n3bff1e10dd --> nd9acc59220
  n3bff1e10dd --> n593b681a87
  n3bff1e10dd --> n646d9281bb
  n3bff1e10dd --> n802af462c9
  n3bff1e10dd --> ne4bbd69c06
  n3bff1e10dd --> na2ae092104
  n3bff1e10dd --> ne94a8f9605
  n3bff1e10dd --> nec1d1c34b5
  n3bff1e10dd --> na2975ab07d
  n3bff1e10dd --> n4958e6ad8f
  n3bff1e10dd --> n0f7eccba3e
  n3bff1e10dd --> nd010492873
  n3bff1e10dd --> n63b5e07347
  nd9acc59220 --> na2ae092104
  nd9acc59220 --> ne4bbd69c06
  nd9acc59220 --> n3bff1e10dd
  nd9acc59220 --> n593b681a87
  nd9acc59220 --> n646d9281bb
  nd9acc59220 --> nec1d1c34b5
  nd9acc59220 --> n4958e6ad8f
  nd9acc59220 --> n0f7eccba3e
  na2975ab07d --> n802af462c9
  na2975ab07d --> n593b681a87
  na2975ab07d --> na2ae092104
  na2975ab07d --> ne4bbd69c06
  ne4bbd69c06 --> n593b681a87
  ne4bbd69c06 --> na2ae092104
  ne4bbd69c06 --> n646d9281bb
  na2ae092104 --> ne4bbd69c06
  na2ae092104 --> n593b681a87
  n98e73ccc99 --> nbe7ad6b866
  n98e73ccc99 --> n9e6f82be7b
  n98e73ccc99 --> n7e44471659
  n98e73ccc99 --> n4958e6ad8f
  n98e73ccc99 --> nd010492873
  n98e73ccc99 --> n0f7eccba3e
  n4958e6ad8f --> nbe7ad6b866
  n4958e6ad8f --> n9e6f82be7b
  n4958e6ad8f --> n0f7eccba3e
  n4958e6ad8f --> nc1f0ffb738
  n0f7eccba3e --> n4958e6ad8f
  n0f7eccba3e --> nc1f0ffb738
  nf70f0b8c57 --> n802af462c9
  nf70f0b8c57 --> na2975ab07d
  nf70f0b8c57 --> n593b681a87
  nf70f0b8c57 --> n646d9281bb
  nf70f0b8c57 --> ne94a8f9605
  nf70f0b8c57 --> n3bff1e10dd
  nbe7ad6b866 --> n9e6f82be7b
  nbe7ad6b866 --> n4958e6ad8f
  n9e6f82be7b --> nbe7ad6b866
  n9e6f82be7b --> n4958e6ad8f
  n9e6f82be7b --> n0f7eccba3e
  nc1f0ffb738 --> n0f7eccba3e
  nc1f0ffb738 --> n4958e6ad8f
```

## p31ca.org Pages build (`public/` as served root)

**Filesystem root:** `andromeda/04_SOFTWARE/p31ca/public`

**Seeds:** `welcome.html`, `bonding.html`, `connect.html`, `education/index.html`, `education/portal/index.html`

| Metric | Count | Notes |
|--------|------:|-------|
| HTML in crawl universe | 291 | |
| Reachable internally | 151 | BFS from seeds |
| Orphans | 140 | in universe only |
| Broken (no file after redirects) | 46 | |
| Outbound https / other hosts | 607 | |
| `/` SPA home links | 305 | not missing — deploy root |
| `.md` anchors | 1 | prose, not shipped HTML routes |
| Non-HTML file links | 4 | e.g. `.nvmrc`, config |
| `_redirects` entries loaded | 73 | |

### Orphan HTML (140) — not reached from seeds

- `agent/bonding-relay/index.html`
- `agent/cf-edge-lab/index.html`
- `agent/command-center/index.html`
- `agent/cortex-benefits/index.html`
- `agent/cortex-content/index.html`
- `agent/cortex-finance/index.html`
- `agent/cortex-grant/index.html`
- `agent/cortex-kofi/index.html`
- `agent/cortex-legal/index.html`
- `agent/discord-bot/index.html`
- `agent/donate-api/index.html`
- `agent/genesis-gate/index.html`
- `agent/geodesic-room/index.html`
- `agent/k4-agent-hub/index.html`
- `agent/k4-cage/index.html`
- `agent/k4-hubs/index.html`
- `agent/k4-personal/index.html`
- `agent/kenosis-mesh/index.html`
- `agent/p31-agent-hub/index.html`
- `agent/p31-bouncer/index.html`
- `agent/p31-command-center/index.html`
- `agent/p31-cortex/index.html`
- `agent/p31-forge/index.html`
- `agent/p31-google-bridge/index.html`
- `agent/p31-hearing-ops/index.html`
- `agent/p31-orchestrator/index.html`
- `agent/p31-passkey/index.html`
- `agent/p31-pwa/index.html`
- `agent/p31-quantum-edge/index.html`
- `agent/p31-social-broadcast/index.html`
- `agent/p31-social-worker/index.html`
- `agent/p31-state/index.html`
- `agent/p31-telemetry/index.html`
- `agent/p31-workers/index.html`
- `agent/p31ca/index.html`
- `agent/spaceship-relay/index.html`
- `agent/tetra-hub/index.html`
- `alchemy-about.html`
- `appointment-tracker-about.html`
- `book-about.html`
- `budget-tracker-about.html`
- `builder.html`
- `canon-demo-about.html`
- `cockpit.html`
- `cogpass-bridge.html`
- `contact-locker-about.html`
- `content-forge-about.html`
- `content-forge.html`
- `contract-builder-about.html`
- `contract-builder.html`
- `d20-omnibus-icosa.html`
- `demo-labs.html`
- `demos/alignment-graph.html`
- `demos/k4-mesh.html`
- `demos/larmor-pulse.html`
- `discord-bot-about.html`
- `economy.html`
- `ecosystem.html`
- `editor.html`
- `fleet-agents.html`
- `fluid.html`
- `forge-about.html`
- `forge.html`
- `health.html`
- `ide.html`
- `k4-agent-hubs-about.html`
- `kids-growth-about.html`
- `larmor.html`
- `lattice.html`
- `launch-readiness.html`
- `launch.html`
- `legal-evidence-about.html`
- `lib/starfield-demo.html`
- `liminal-about.html`
- `liminal.html`
- `looper.html`
- `medical-tracker-about.html`
- `movement.html`
- `node-one-about.html`
- `node-zero-about.html`
- … *60 more (see crawl universe glob)*

### Markdown-linked (not counted as broken)

- `p31-slicer.html` → `design-assets/stl/README.md`

### Broken filesystem targets

| From | href | note |
|------|------|------|
| `family-sovereign-pack.html` | `/p31-super-centaur-pack.json` | unresolved / path |
| `family-sovereign-pack.html` | `/creator-economy.json` | unresolved / path |
| `family-sovereign-pack.html` | `/p31-welcome-packages.json` | unresolved / path |
| `demos/index.html` | `../` | missing |
| `p31-super-centaur-starter.html` | `/p31-super-centaur-pack.json` | unresolved / path |
| `p31-super-centaur-starter.html` | `/p31-super-centaur-pack.json` | unresolved / path |
| `p31-super-centaur-starter.html` | `/p31-welcome-packages.json` | unresolved / path |
| `p31-super-centaur-starter.html` | `/creator-economy.json` | unresolved / path |
| `glass-box.html` | `/reports/index.json` | unresolved / path |
| `glass-box.html` | `/verify-pulse.json` | unresolved / path |
| `glass-box.html` | `/reports/promoted/index.json` | unresolved / path |
| `security-disclosure.html` | `/.well-known/security.txt` | unresolved / path |
| `security-disclosure.html` | `/.well-known/security.txt` | unresolved / path |
| `security-disclosure.html` | `/.well-known/security.txt` | unresolved / path |
| `quantum-clock.html` | `/dome/` | unresolved / path |
| `messaging-hub.html` | `/integrations/` | missing |
| `messaging-hub.html` | `/ops/` | unresolved / path |
| `messaging-hub.html` | `/integrations/` | missing |
| `messaging-hub.html` | `/appointment-tracker` | unresolved / path |
| `messaging-hub.html` | `/love-ledger` | unresolved / path |
| `messaging-hub.html` | `/medical-tracker` | unresolved / path |
| `messaging-hub.html` | `/somatic-anchor` | unresolved / path |
| `messaging-hub.html` | `/legal-evidence` | unresolved / path |
| `messaging-hub.html` | `/contact-locker` | unresolved / path |
| `messaging-hub.html` | `/sleep-tracker` | unresolved / path |
| `messaging-hub.html` | `/budget-tracker` | unresolved / path |
| `messaging-hub.html` | `/p31-mesh-constants.json` | unresolved / path |
| `demos/the-pulse.html` | `../` | missing |
| `p31-canon-demo.html` | `/p31-style.css` | unresolved / path |
| `open-source.html` | `/creator-economy.json` | unresolved / path |
| `open-source.html` | `/p31-super-centaur-pack.json` | unresolved / path |
| `open-source.html` | `/p31-public-surface.json` | unresolved / path |
| `education/modules/mesh-maps.html` | `/ops/` | unresolved / path |
| `integrations-about.html` | `/integrations/index.html` | unresolved / path |
| `integrations-about.html` | `/integrations/index.html` | unresolved / path |
| `integrations-about.html` | `/integrations/index.html` | unresolved / path |
| `integrations-about.html` | `/integrations/index.html` | unresolved / path |
| `integrations-about.html` | `/integrations/index.html` | unresolved / path |
| `dev-workbench.html` | `/orchestrator` | unresolved / path |
| `financials.html` | `/creator-economy.json` | unresolved / path |
| `live-fleet-demo.html` | `/ops/` | unresolved / path |
| `live-fleet-demo.html` | `/p31-live-fleet.json` | unresolved / path |
| `live-fleet-demo.html` | `/ops/` | unresolved / path |
| `vision.html` | `/dome/` | unresolved / path |
| `vision.html` | `/ops/` | unresolved / path |
| `quantum-family.html` | `/garden-zone-8b.json` | unresolved / path |

### Fan-out (distinct internal `.html` targets)

| Page | Out-degree |
|------|------------|
| `education/index.html` | 18 |
| `vision.html` | 17 |
| `delta.html` | 14 |
| `family-sovereign-pack.html` | 14 |
| `mesh-start.html` | 13 |
| `kids-home.html` | 11 |
| `messaging-hub.html` | 11 |
| `vibe.html` | 10 |
| `education-about.html` | 9 |
| `education/about.html` | 9 |
| `education/modules/index.html` | 9 |
| `financials.html` | 9 |
| `p31-super-centaur-starter.html` | 9 |
| `status.html` | 9 |
| `welcome.html` | 9 |
| `code-of-conduct.html` | 8 |
| `connect.html` | 8 |
| `manifesto.html` | 8 |
| `planetary-onboard.html` | 8 |
| `roadmap.html` | 8 |
| `security.html` | 8 |
| `telemetry-policy.html` | 8 |
| `transparency.html` | 8 |
| `attractor-about.html` | 7 |
| `axiom-about.html` | 7 |
| `bridge-about.html` | 7 |
| `buffer-about.html` | 7 |
| `collider-about.html` | 7 |
| `cortex-about.html` | 7 |
| `donate-about.html` | 7 |
| `echo-about.html` | 7 |
| `ede-about.html` | 7 |
| `education/ethics.html` | 7 |
| `k4market-about.html` | 7 |
| `kenosis-about.html` | 7 |
| `kinematics-about.html` | 7 |
| `live-fleet-demo.html` | 7 |
| `mission-control-about.html` | 7 |
| `observatory-about.html` | 7 |
| `phenix-os-about.html` | 7 |
| `planetary-onboard-about.html` | 7 |
| `poets-about.html` | 7 |
| … | *see TSV* |

### Edge sample (140 rows; full dump → generated TSV)

| From | href | → |
|------|------|---|
| `accessibility.html` | /accessibility | `accessibility.html` |
| `accessibility.html` | /contact | `contact.html` |
| `accessibility.html` | /oss | `open-source.html` |
| `accessibility.html` | /privacy | `privacy.html` |
| `accessibility.html` | /security | `security.html` |
| `accessibility.html` | /terms | `terms.html` |
| `agents.html` | agents.html?alive=1 | `agents.html` |
| `agents.html` | fleet-portal.html | `fleet-portal.html` |
| `agents.html` | /passport-generator.html | `passport-generator.html` |
| `alchemy.html` | bonding.html | `bonding.html` |
| `alchemy.html` | kenosis.html | `kenosis.html` |
| `alchemy.html` | node-one.html | `node-one.html` |
| `alchemy.html` | quantum-core.html | `quantum-core.html` |
| `attractor-about.html` | /attractor.html | `attractor.html` |
| `attractor-about.html` | /collider-about.html | `collider-about.html` |
| `attractor-about.html` | /mesh | `connect.html` |
| `attractor-about.html` | /geodesic.html | `geodesic.html` |
| `attractor-about.html` | /build | `initial-build.html` |
| `attractor-about.html` | /kenosis-about.html | `kenosis-about.html` |
| `attractor-about.html` | /observatory-about.html | `observatory-about.html` |
| `attractor-sim.html` | attractor.html | `attractor.html` |
| `attractor.html` | alchemy.html | `alchemy.html` |
| `attractor.html` | attractor-sim.html | `attractor-sim.html` |
| `attractor.html` | kenosis.html | `kenosis.html` |
| `attractor.html` | spaceship-earth.html | `spaceship-earth.html` |
| `auth.html` | /planetary-onboard.html | `planetary-onboard.html` |
| `axiom-about.html` | /axiom.html | `axiom.html` |
| `axiom-about.html` | /bonding-about.html | `bonding-about.html` |
| `axiom-about.html` | /collider-about.html | `collider-about.html` |
| `axiom-about.html` | /mesh | `connect.html` |
| `axiom-about.html` | /geodesic.html | `geodesic.html` |
| `axiom-about.html` | /build | `initial-build.html` |
| `axiom-about.html` | /sovereign-about.html | `sovereign-about.html` |
| `bonding-about.html` | /attractor-about.html | `attractor-about.html` |
| `bonding-about.html` | /axiom-about.html | `axiom-about.html` |
| `bonding-about.html` | /collider-about.html | `collider-about.html` |
| `bonding-about.html` | /mesh | `connect.html` |
| `bonding-about.html` | /geodesic.html | `geodesic.html` |
| `bonding-about.html` | /build | `initial-build.html` |
| `bonding.html` | alchemy.html | `alchemy.html` |
| `bonding.html` | cortex.html | `cortex.html` |
| `bonding.html` | genesis-gate.html | `genesis-gate.html` |
| `bonding.html` | spaceship-earth.html | `spaceship-earth.html` |
| `book.html` | bonding.html | `bonding.html` |
| `book.html` | discord-bot.html | `discord-bot.html` |
| `book.html` | spaceship-earth.html | `spaceship-earth.html` |
| `bridge-about.html` | /bridge.html | `bridge.html` |
| `bridge-about.html` | /mesh | `connect.html` |
| `bridge-about.html` | /donate-about.html | `donate-about.html` |
| `bridge-about.html` | /geodesic.html | `geodesic.html` |
| `bridge-about.html` | /build | `initial-build.html` |
| `bridge-about.html` | /love-ledger-about.html | `love-ledger-about.html` |
| `bridge-about.html` | /quantum-family-about.html | `quantum-family-about.html` |
| `buffer-about.html` | /buffer.html | `buffer.html` |
| `buffer-about.html` | /mesh | `connect.html` |
| `buffer-about.html` | /ede-about.html | `ede-about.html` |
| `buffer-about.html` | /geodesic.html | `geodesic.html` |
| `buffer-about.html` | /build | `initial-build.html` |
| `buffer-about.html` | /somatic-anchor-about.html | `somatic-anchor-about.html` |
| `buffer-about.html` | /spaceship-earth-about.html | `spaceship-earth-about.html` |
| `buffer.html` | cortex.html | `cortex.html` |
| `buffer.html` | guardian.html | `guardian.html` |
| `buffer.html` | node-one.html | `node-one.html` |
| `buffer.html` | spaceship-earth.html | `spaceship-earth.html` |
| `code-of-conduct.html` | /accessibility | `accessibility.html` |
| `code-of-conduct.html` | /code-of-conduct | `code-of-conduct.html` |
| `code-of-conduct.html` | /financials | `financials.html` |
| `code-of-conduct.html` | /manifesto | `manifesto.html` |
| `code-of-conduct.html` | /privacy | `privacy.html` |
| `code-of-conduct.html` | /roadmap | `roadmap.html` |
| `code-of-conduct.html` | /security | `security.html` |
| `code-of-conduct.html` | /status | `status.html` |
| `collider-about.html` | /attractor-about.html | `attractor-about.html` |
| `collider-about.html` | /axiom-about.html | `axiom-about.html` |
| `collider-about.html` | /bonding-about.html | `bonding-about.html` |
| `collider-about.html` | /collider.html | `collider.html` |
| `collider-about.html` | /mesh | `connect.html` |
| `collider-about.html` | /geodesic.html | `geodesic.html` |
| `collider-about.html` | /build | `initial-build.html` |
| `connect-about.html` | /connect.html | `connect.html` |
| `connect-about.html` | /geodesic.html | `geodesic.html` |
| `connect-about.html` | /build | `initial-build.html` |
| `connect-about.html` | /k4market-about.html | `k4market-about.html` |
| `connect-about.html` | /observatory-about.html | `observatory-about.html` |
| `connect-about.html` | /planetary-onboard-about.html | `planetary-onboard-about.html` |
| `connect.html` | /visuals | `demos/index.html` |
| `connect.html` | /geodesic.html | `geodesic.html` |
| `connect.html` | /glass-box | `glass-box.html` |
| `connect.html` | /build | `initial-build.html` |
| `connect.html` | /slicer | `p31-slicer.html` |
| `connect.html` | /lab | `p31-sovereign-lab.html` |
| `connect.html` | /centaur | `p31-super-centaur-starter.html` |
| `connect.html` | /cars | `social-molecules.html` |
| `contact.html` | /accessibility | `accessibility.html` |
| `contact.html` | /oss | `open-source.html` |
| `contact.html` | /privacy | `privacy.html` |
| `contact.html` | /security | `security.html` |
| `contact.html` | /terms | `terms.html` |
| `cortex-about.html` | /mesh | `connect.html` |
| `cortex-about.html` | /cortex.html | `cortex.html` |
| `cortex-about.html` | /genesis-gate-about.html | `genesis-gate-about.html` |
| `cortex-about.html` | /geodesic.html | `geodesic.html` |
| `cortex-about.html` | /build | `initial-build.html` |
| `cortex-about.html` | /kenosis-about.html | `kenosis-about.html` |
| `cortex-about.html` | /spaceship-earth-about.html | `spaceship-earth-about.html` |
| `cortex.html` | discord-bot.html | `discord-bot.html` |
| `cortex.html` | donate.html | `donate.html` |
| `cortex.html` | genesis-gate.html | `genesis-gate.html` |
| `cortex.html` | kenosis.html | `kenosis.html` |
| `delta-language.html` | /delta.html | `delta.html` |
| `delta.html` | /connect.html | `connect.html` |
| `delta.html` | /delta-language.html | `delta-language.html` |
| `delta.html` | /delta.html | `delta.html` |
| `delta.html` | /visuals | `demos/index.html` |
| `delta.html` | /family-sovereign-pack.html | `family-sovereign-pack.html` |
| `delta.html` | /geodesic.html | `geodesic.html` |
| `delta.html` | /glass-box | `glass-box.html` |
| `delta.html` | /build | `initial-build.html` |
| `delta.html` | /mesh-start.html | `mesh-start.html` |
| `delta.html` | /slicer | `p31-slicer.html` |
| `delta.html` | /lab | `p31-sovereign-lab.html` |
| `delta.html` | /p31-super-centaur-starter.html | `p31-super-centaur-starter.html` |
| `delta.html` | /planetary-onboard.html | `planetary-onboard.html` |
| `delta.html` | /cars | `social-molecules.html` |
| `demos/index.html` | /connect | `connect.html` |
| `demos/index.html` | ./the-pulse.html | `demos/the-pulse.html` |
| `demos/index.html` | ./the-same-shape.html | `demos/the-same-shape.html` |
| `demos/index.html` | ../glass-box-widget.html | `glass-box-widget.html` |
| `demos/index.html` | ../glass-box.html | `glass-box.html` |
| `demos/the-pulse.html` | ./ | `demos/index.html` |
| `demos/the-pulse.html` | ./the-same-shape.html | `demos/the-same-shape.html` |
| `demos/the-pulse.html` | ../glass-box.html | `glass-box.html` |
| `demos/the-same-shape.html` | ./ | `demos/index.html` |
| `demos/the-same-shape.html` | ./the-pulse.html | `demos/the-pulse.html` |
| `dev-workbench.html` | /mesh-start.html | `mesh-start.html` |
| `discord-bot.html` | bonding.html | `bonding.html` |
| `discord-bot.html` | book.html | `book.html` |
| `discord-bot.html` | cortex.html | `cortex.html` |
| `discord-bot.html` | donate.html | `donate.html` |
| `doc-library/index.html` | /connect.html | `connect.html` |

### Mermaid (reachable spine excerpt — readability)

```mermaid
flowchart LR
  n5d48ed3031["accessibility.html…"]
  n4614233f98["agents.html…"]
  n62141ef5d0["alchemy.html…"]
  n546f1d8400["attractor-about.html…"]
  nb6969cb331["attractor-sim.html…"]
  n1ea6a3e1b6["attractor.html…"]
  n3c222e79a8["auth.html…"]
  nf7279271a3["axiom-about.html…"]
  nd5a55ddcaa["axiom.html…"]
  nb80e61c268["bonding-about.html…"]
  nfa9a9e7f1a["bonding.html…"]
  nf945b4abd7["book.html…"]
  ndbb1c2c55e["bridge-about.html…"]
  n1c72b26f4a["bridge.html…"]
  nd74242dcd1["buffer-about.html…"]
  n26275e526f["buffer.html…"]
  n492d4db1c8["code-of-conduct.html…"]
  n1e835df47f["collider-about.html…"]
  n86a5707c75["collider.html…"]
  n51adc3c85e["connect-about.html…"]
  n59542675d9["connect.html…"]
  n1436176043["contact.html…"]
  n4b6daf067f["cortex-about.html…"]
  n6af323b574["cortex.html…"]
  ned0e96761f["delta-hiring/index.html…"]
  ne9f19e31d2["delta-language.html…"]
  n4d8ec14cf0["delta.html…"]
  n4958e6ad8f["demos/index.html…"]
  n9e6f82be7b["demos/the-pulse.html…"]
  nbe7ad6b866["demos/the-same-shape.html…"]
  ne0d9e897c5["dev-workbench.html…"]
  n2d2bbd46b4["discord-bot.html…"]
  n2bf83402de["doc-library/index.html…"]
  n152bd4229a["donate-about.html…"]
  n673fd6c69e["donate.html…"]
  n55c865f539["echo-about.html…"]
  n0fbf05a227["echo.html…"]
  n9d22263065["ede-about.html…"]
  na65219a5d1["ede.html…"]
  naaa4d2d638["education-about.html…"]
  naf37f5f4e6["education/about.html…"]
  nbacff9f860["education/ethics.html…"]
  nce0df18f86["education/index.html…"]
  n38023fd53e["education/labs/cognitive-passport-slice.html…"]
  n60610310cb["education/labs/doc-library-tour.html…"]
  na256fb0921["education/labs/geodesic-first-room.html…"]
  n0cb5b19bfb["education/labs/index.html…"]
  n29145e53b2["education/labs/mesh-snapshot.html…"]
  nfa9a9e7f1a --> n6af323b574
  nfa9a9e7f1a --> n62141ef5d0
  n59542675d9 --> n4958e6ad8f
  nce0df18f86 --> n59542675d9
  nce0df18f86 --> naf37f5f4e6
  nce0df18f86 --> nbacff9f860
  nce0df18f86 --> n0cb5b19bfb
  nce0df18f86 --> naaa4d2d638
  nce0df18f86 --> na65219a5d1
  nce0df18f86 --> n1436176043
  n4d8ec14cf0 --> ne9f19e31d2
  n4d8ec14cf0 --> n4d8ec14cf0
  n4d8ec14cf0 --> n59542675d9
  n4d8ec14cf0 --> n4958e6ad8f
  n4958e6ad8f --> nbe7ad6b866
  n4958e6ad8f --> n9e6f82be7b
  n4958e6ad8f --> n59542675d9
  n6af323b574 --> n2d2bbd46b4
  n6af323b574 --> n673fd6c69e
  n62141ef5d0 --> nfa9a9e7f1a
  naf37f5f4e6 --> nce0df18f86
  naf37f5f4e6 --> naf37f5f4e6
  naf37f5f4e6 --> nbacff9f860
  naf37f5f4e6 --> n0cb5b19bfb
  nbacff9f860 --> nce0df18f86
  nbacff9f860 --> naf37f5f4e6
  nbacff9f860 --> nbacff9f860
  nbacff9f860 --> n0cb5b19bfb
  n0cb5b19bfb --> n29145e53b2
  n0cb5b19bfb --> n38023fd53e
  n0cb5b19bfb --> n60610310cb
  n0cb5b19bfb --> na256fb0921
  n0cb5b19bfb --> nce0df18f86
  naaa4d2d638 --> nce0df18f86
  naaa4d2d638 --> n51adc3c85e
  naaa4d2d638 --> n59542675d9
  n1436176043 --> n5d48ed3031
  ne9f19e31d2 --> n4d8ec14cf0
  n9d22263065 --> na65219a5d1
  n9d22263065 --> nd74242dcd1
  n9d22263065 --> n4b6daf067f
  n9d22263065 --> n59542675d9
  nbe7ad6b866 --> n9e6f82be7b
  nbe7ad6b866 --> n4958e6ad8f
  n9e6f82be7b --> nbe7ad6b866
  n9e6f82be7b --> n4958e6ad8f
  n2bf83402de --> n59542675d9
  n1ea6a3e1b6 --> nb6969cb331
  n1ea6a3e1b6 --> n62141ef5d0
  n26275e526f --> n6af323b574
  n2d2bbd46b4 --> n6af323b574
  n2d2bbd46b4 --> n673fd6c69e
  n2d2bbd46b4 --> nfa9a9e7f1a
  n2d2bbd46b4 --> nf945b4abd7
  n5d48ed3031 --> n1436176043
  n5d48ed3031 --> n5d48ed3031
  n29145e53b2 --> n0cb5b19bfb
  n38023fd53e --> n0cb5b19bfb
  n60610310cb --> n0cb5b19bfb
  na256fb0921 --> n0cb5b19bfb
  n51adc3c85e --> n59542675d9
  nd74242dcd1 --> n26275e526f
  nd74242dcd1 --> n9d22263065
  nd74242dcd1 --> n59542675d9
  n4b6daf067f --> n6af323b574
  n4b6daf067f --> n59542675d9
  nb6969cb331 --> n1ea6a3e1b6
  nf945b4abd7 --> nfa9a9e7f1a
  nf945b4abd7 --> n2d2bbd46b4
  nb80e61c268 --> n546f1d8400
  nb80e61c268 --> n1e835df47f
  nb80e61c268 --> nf7279271a3
  nb80e61c268 --> n59542675d9
  n492d4db1c8 --> n492d4db1c8
  n492d4db1c8 --> n5d48ed3031
  n1e835df47f --> n86a5707c75
  n1e835df47f --> nf7279271a3
  n1e835df47f --> nb80e61c268
  n1e835df47f --> n546f1d8400
  n1e835df47f --> n59542675d9
  nf7279271a3 --> nd5a55ddcaa
  nf7279271a3 --> n1e835df47f
  nf7279271a3 --> nb80e61c268
  nf7279271a3 --> n59542675d9
  ndbb1c2c55e --> n1c72b26f4a
  ndbb1c2c55e --> n152bd4229a
  ndbb1c2c55e --> n59542675d9
  n546f1d8400 --> n1ea6a3e1b6
  n546f1d8400 --> n1e835df47f
  n546f1d8400 --> n59542675d9
  n4614233f98 --> n4614233f98
  n152bd4229a --> n673fd6c69e
  n152bd4229a --> n4b6daf067f
  n152bd4229a --> n59542675d9
  n55c865f539 --> n0fbf05a227
  n55c865f539 --> n59542675d9
```

## Combined rollup

| Zone | Universe | Reachable | Orphans | Broken | External hosts | SPA `/` refs | `.md` hrefs |
|------|----------|-----------|---------|--------|----------------|-------------|-----------|
| Bonding static | 27 | 25 | 12 | 7 | 221 | 12 | 48 |
| p31ca Pages | 291 | 151 | 140 | 46 | 607 | 305 | 1 |

*CI exit code follows script: warnings only (`npm run nav:report` exits 0). Use manual review of Broken table.*