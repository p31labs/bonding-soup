/**
 * Command center — whitelisted actions only (execFile, never shell).
 * Consumed by p31-local-command-center.mjs — single source of truth.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.join(__dirname, "..", "..");
export const andromedaRoot = path.join(repoRoot, "andromeda");
export const p31caPkg = path.join(andromedaRoot, "04_SOFTWARE", "p31ca");

export function pathExists(p) {
  return fs.existsSync(p);
}

export const ACTIONS = {
  // —— Local static server (long-running; spawned detached)
  "home-demo": {
    title: "Start demo server (port 8080 — same as npm run demo)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "demo"],
    background: true,
    network: true,
    confirm:
      "Starts Python http.server on 8080 in the background (see docs/SOUP-LOCAL-DEMO.md; P31_DEMO_PORT=… if port busy). Second click may fail if port busy. Continue?",
  },
  "home-geodesic-preview": {
    title: "demo:geodesic-preview (Vite — GeodesicRoom GET /state UI on port 5174)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "demo:geodesic-preview"],
    background: true,
    network: true,
    confirm:
      "Starts Vite for spikes/sovereign-geodesic-preview (port 5174; see vite.config). Uses /api proxy to geodesic-room Worker. Continue?",
  },

  // —— Daily & diagnostics
  "home-doctor": {
    title: "Doctor (Node, remotes, gh, Andromeda origin)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "doctor"],
  },
  "home-connection": {
    title: "connection (CONNECTION spine — deploy · ecosystem · env · edge)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "connection"],
  },
  "home-verify": {
    title: "verify (default ship bar: alignment + facts + passport + … + tsc)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify"],
    slow: true,
  },
  "home-build": {
    title: "build (Soup only — tsc → dist/)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "build"],
  },
  "home-soup-prep": {
    title: "soup:prep (tsc + dist/ + static assets for soup.html)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "soup:prep"],
    slow: true,
  },
  "home-soup-prep-check": {
    title: "soup:prep:check (no build — re-verify dist + assets after verify)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "soup:prep:check"],
  },
  "home-soup-room-scale": {
    title: "soup:room-scale (mock-ws probe — Phase 1 gate)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "soup:room-scale"],
    network: true,
    slow: true,
  },
  "home-verify-alignment": {
    title: "verify:alignment (registry + sources JSON)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:alignment"],
  },
  "home-verify-facts": {
    title: "verify:facts (p31.facts/1.0.0 — mesh keys, paths, policy substring guard)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:facts"],
  },
  "home-verify-subscriptions": {
    title: "verify:subscriptions (p31.subscriptions/1.0.0 — AI subscription stack contract)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:subscriptions"],
  },
  "home-verify-simplex": {
    title: "verify:simplex (simplex-v7 Worker — tsc + Vitest; SIMPLEX + SENTINEL)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:simplex"],
  },
  // —— Ollama fleet (local)
  "ollama-fleet-status": {
    title: "Fleet status (Ollama /api/tags + /api/ps)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/ollama-fleet-status.mjs"],
    network: true,
  },
  "ollama-setup": {
    title: "Ollama fleet setup (create / refresh all 10 personas)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "ollama:setup"],
    slow: true,
    confirm:
      "Runs scripts/p31-fleet-ten/setup.sh (ollama create for each persona). Requires ollama on PATH and enough disk for base weights. Continue?",
  },
  "ollama-verify": {
    title: "Ollama fleet smoke (verify.sh — OK markers + triage JSON)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "ollama:verify"],
    slow: true,
  },
  "ollama-bench": {
    title: "Ollama fleet benchmark (benchmark.sh)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "ollama:bench"],
    slow: true,
  },
  "ollama-tunnel-start": {
    title: "Ollama Cloudflare tunnel (trycloudflare → ~/.p31/ollama-tunnel.json)",
    cwd: repoRoot,
    cmd: "bash",
    args: ["scripts/ollama-tunnel.sh"],
    background: true,
    network: true,
    confirm:
      "Starts cloudflared with a public HTTPS URL to local :11434. Ephemeral URL — do not use for counsel/triage/phos (Cursor cloud sees model-picker traffic). Continue?",
  },
  "ollama-mcp-verify": {
    title: "verify:ollama-mcp (static + MCP tools/list handshake)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:ollama-mcp"],
  },
  "home-verify-fleet-llm-bridge": {
    title: "verify:fleet-llm-bridge (models.json ↔ Continue ↔ cursor rule — fleet vs cloud posture)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:fleet-llm-bridge"],
  },
  "ollama-gpu-monitor": {
    title: "GPU monitor (rocm-smi)",
    cwd: repoRoot,
    cmd: "rocm-smi",
    args: [],
    slow: true,
  },

  // —— SIMPLEX controls (operator token required)
  "simplex-health": {
    title: "SIMPLEX health (GET /api/health)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "health"],
    network: true,
  },
  "simplex-breakers": {
    title: "Breakers: status (GET /api/admin/breakers)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breakers"],
    network: true,
  },
  "simplex-estop": {
    title: "E-STOP ALL (POST /api/admin/estop)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "estop"],
    network: true,
    hitl: true,
    confirm: "E-STOP ALL will turn OFF all breakers (agents, sentinel, forge, medic, herald, email, safe_mode). Continue?",
  },
  "simplex-breaker-agents-on": {
    title: "Breaker: AGENTS ON",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "agents", "on"],
    network: true,
  },
  "simplex-breaker-agents-off": {
    title: "Breaker: AGENTS OFF",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "agents", "off"],
    network: true,
    hitl: true,
    confirm: "Turn AGENTS OFF (disables all agent dispatch, including manual /api/agent/*). Continue?",
  },
  "simplex-breaker-sentinel-on": {
    title: "Breaker: SENTINEL ON",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "sentinel", "on"],
    network: true,
  },
  "simplex-breaker-sentinel-off": {
    title: "Breaker: SENTINEL OFF",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "sentinel", "off"],
    network: true,
    hitl: true,
    confirm: "Turn SENTINEL OFF (disables biometric/home dispatch). Continue?",
  },
  "simplex-breaker-forge-on": {
    title: "Breaker: FORGE ON",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "forge", "on"],
    network: true,
  },
  "simplex-breaker-forge-off": {
    title: "Breaker: FORGE OFF",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "forge", "off"],
    network: true,
  },
  "simplex-breaker-medic-on": {
    title: "Breaker: MEDIC ON",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "medic", "on"],
    network: true,
  },
  "simplex-breaker-medic-off": {
    title: "Breaker: MEDIC OFF",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "medic", "off"],
    network: true,
  },
  "simplex-breaker-herald-on": {
    title: "Breaker: HERALD ON",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "herald", "on"],
    network: true,
  },
  "simplex-breaker-herald-off": {
    title: "Breaker: HERALD OFF",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "breaker", "herald", "off"],
    network: true,
  },

  // —— Agent control
  "simplex-fire-steward": {
    title: "Fire STEWARD (POST /api/agent/STEWARD)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "agent", "STEWARD"],
    network: true,
    slow: true,
  },
  "simplex-fire-oracle": {
    title: "Fire ORACLE (POST /api/agent/ORACLE)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "agent", "ORACLE"],
    network: true,
    slow: true,
  },

  // —— Telemetry
  "simplex-telemetry-spoons": {
    title: "Telemetry: spoon history (24h)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "telemetry", "spoons", "24"],
    network: true,
  },
  "simplex-telemetry-tomograph": {
    title: "Telemetry: tomograph (last 10)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "telemetry", "tomograph", "10"],
    network: true,
  },
  "simplex-telemetry-accommodation": {
    title: "Telemetry: accommodation log (today)",
    cwd: repoRoot,
    cmd: "node",
    args: ["scripts/command-center/simplex-cli.mjs", "telemetry", "accommodation", "1"],
    network: true,
  },
  "home-simplex-verify-all": {
    title: "simplex:verify-all (simplex-v7 + simplex-email + simplex-bootstrap — one chain)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "simplex:verify-all"],
    slow: true,
  },
  "home-effective-bar": {
    title: "p31:effective-bar (verify matrix — run / skip / degraded for this checkout)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "p31:effective-bar"],
  },
  "home-mirror-fixer": {
    title: "p31:mirror-fixer (sync doc-library mirror — dry-run; prints git add if drift)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "p31:mirror-fixer"],
  },
  "home-mirror-fixer-apply": {
    title: "p31:mirror-fixer:apply (stage hub mirror paths in andromeda/ — no commit)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "p31:mirror-fixer:apply"],
    hitl: true,
    confirm: "Runs git add under andromeda/ for doc-library mirror paths. Review before commit. Continue?",
  },
  "home-office-ready": {
    title: "office:ready (Discovery venv + p31-office doctor + zenodo script presence)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "office:ready"],
  },
  "home-verify-semgrep-parity": {
    title: "verify:semgrep-parity (warn if Semgrep missing — matches p31:all local behavior)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:semgrep-parity"],
  },
  "home-verify-runbooks": {
    title: "verify:runbooks (incident runbook README links resolve)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:runbooks"],
  },
  "home-verify-delta-language": {
    title: "verify:delta-language (DELTA lexicon JSON + glossary; hub mirror when p31ca present)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:delta-language"],
  },
  "home-verify-public-voice": {
    title: "verify:public-voice (PUBLIC-VOICE.md anchors + Tier B/C grep guardrails)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:public-voice"],
  },
  "home-verify-atmosphere-ramp": {
    title: "verify:atmosphere-ramp (ramps + routes vs p31-universal-canon)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:atmosphere-ramp"],
  },
  "home-simplex-bootstrap-dry": {
    title:
      "simplex:bootstrap:dry (print Cloudflare bootstrap steps — D1/KV/queue/schema; no API calls)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "simplex:bootstrap:dry"],
  },
  "home-simplex-bootstrap-apply": {
    title:
      "simplex:bootstrap:apply (wrangler — create D1/KV if REPLACE_*, queue, remote schema; needs login)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "simplex:bootstrap:apply"],
    network: true,
    slow: true,
    hitl: true,
    confirm:
      "Runs wrangler against your Cloudflare account (may create D1, KV, queue; applies remote schema). Continue?",
  },
  "home-mesh-budgets": {
    title: "mesh:budgets (k4-personal + glass row latency SLOs — no network)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "mesh:budgets"],
  },
  "home-remember-probe-status": {
    title:
      "remember:probe status (SIMPLEX Worker — needs OPERATOR_SECRET; bereavement + remembered counts)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "remember:probe", "status"],
    network: true,
  },
  "home-build-fleet-portal-live": {
    title: "build:fleet-portal:live (ecosystem:glass then fleet portal — merges probe colors into ATC)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "build:fleet-portal:live"],
    network: true,
    slow: true,
  },
  "home-build-fleet-portal": {
    title: "build:fleet-portal (live URL index → fleet-portal.html; polish copies to p31ca public)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "build:fleet-portal"],
  },
  "home-build-fleet-entities": {
    title:
      "build:fleet-entities (p31-fleet-entities.json + /agent/* stubs — reads p31ca public/p31-live-fleet.json; see p31-alignment live-fleet-to-fleet-entities-hub)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "build:fleet-entities"],
  },
  "home-apply-constants": {
    title: "apply:constants (JSON → ground-truth fragments, generated TS)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "apply:constants"],
    hitl: true,
  },
  "home-sync-passport": {
    title: "sync:passport (cognitive-passport → p31ca mirror)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "sync:passport"],
  },
  "home-sync-sovereign-p31ca": {
    title: "sync:sovereign-p31ca (Sovereign Lab + slicer + STL → p31ca public)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "sync:sovereign-p31ca"],
  },
  "home-inventory-cf": {
    title: "inventory:cf (wrangler inventory markdown)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "inventory:cf"],
    network: true,
  },
  "home-build-doc-index": {
    title: "build:doc-index (markdown → docs/doc-library/index.json)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "build:doc-index"],
  },
  "home-verify-doc-index": {
    title: "verify:doc-index (fingerprint + Minisearch smoke + vendor + worker)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:doc-index"],
  },
  "home-docs-prep-hub": {
    title: "docs:prep:hub (build:doc-index + sync doc-library → p31ca public)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "docs:prep:hub"],
  },
  "home-verify-doc-library-p31ca-mirror": {
    title: "verify:doc-library:p31ca-mirror (sync + fail if Andromeda mirror uncommitted)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:doc-library:p31ca-mirror"],
  },
  "home-docs-hub-simulate": {
    title: "docs:hub:simulate (build + verify index + temp mirror diff vs p31ca/public — no Andromeda writes)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "docs:hub:simulate"],
  },
  "home-docs-hub-automate": {
    title: "docs:hub:automate (prep:hub + verify mirror — full sync + git drift gate)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "docs:hub:automate"],
  },
  "home-test-simulations": {
    title: "test:simulations (doc hub mirrors + DELTA + geodesic wire JSON fixtures)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "test:simulations"],
  },
  "home-verify-mesh-offline": {
    title: "verify:mesh-offline (k4-personal wrangler dry-run only — no live /api/mesh)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:mesh-offline"],
  },
  "home-verify-geodesic-wire-fixtures": {
    title: "verify:geodesic-wire-fixtures (static GeodesicRoom wire message shapes)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:geodesic-wire-fixtures"],
  },
  "home-github-org-check": {
    title: "github:org:check (strict — same as CI: repos-metadata + REPOS.md cross-check)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:check"],
  },
  "home-github-org-plan": {
    title: "github:org:plan (check + bootstrap .github clone + dry-run metadata + sync)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:plan"],
    network: true,
  },
  "home-github-org-metadata": {
    title: "github:org:metadata (gh API — About + topics; needs gh auth)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:metadata"],
    network: true,
    confirm: "Writes GitHub metadata for all repos in repos-metadata.json (non-skip). Continue?",
  },
  "home-github-org-sync-push": {
    title: "github:org:sync --push (REPOS.md + profile map → default clone or P31_GITHUB_ORG_REPO)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:sync", "--", "--push"],
    network: true,
    confirm: "Commits and pushes to the org .github clone (set P31_GITHUB_ORG_REPO or use .p31-work/dotgithub-sync). Continue?",
  },
  "home-github-org-apply": {
    title: "github:org:apply --yes (bootstrap + metadata API + sync push — full org alignment)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:apply", "--", "--yes"],
    network: true,
    confirm:
      "Requires valve mode apply (~/.p31/github-org-valve.json or P31_GITHUB_ORG_VALVE_MODE=apply) or bypass P31_GITHUB_ORG_VALVE_BYPASS=1. Patches GitHub About/topics and pushes p31labs/.github. gh auth. Continue?",
  },
  "home-github-org-valve-closed": {
    title: "github-org valve → closed (blocks apply + auto)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:valve", "--", "set", "closed"],
  },
  "home-github-org-valve-dry": {
    title: "github-org valve → dry-run (auto runs plan only)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:valve", "--", "set", "dry-run"],
  },
  "home-github-org-valve-open": {
    title: "github-org valve → apply (allows github:org:apply — still needs --yes)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:valve", "--", "set", "apply"],
    confirm: "Opens the apply valve on this machine. Mis-keys still need Apply + gh. Continue?",
  },
  "home-github-org-auto": {
    title: "github:org:auto (cron-shaped — respects valve; runs plan, never apply)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "github:org:auto"],
    network: true,
    slow: true,
  },
  "home-test-doc-library-e2e": {
    title: "test:doc-library:e2e (Playwright — static server + headless search; install chromium once: npx playwright install chromium)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "test:doc-library:e2e"],
    slow: true,
  },
  "home-test-physics-learn-e2e": {
    title: "test:physics-learn:e2e (Playwright — eight-room codec + interactives)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "test:physics-learn:e2e"],
    slow: true,
  },
  "home-test-k4market-smoke": {
    title: "test:k4market:smoke (k4market shell + WebGL; launch timeout 20s; P31_…_SKIP on fail in sandboxes)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "test:k4market:smoke"],
    slow: true,
  },

  // —— CI-shaped
  "home-release-check": {
    title: "release:check / p31:ci (verify + k4 + mesh + full p31ca Astro build)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "release:check"],
    slow: true,
    network: true,
  },
  "home-p31-ci-all": {
    title: "p31:ci:all (strict mesh + p31-ci + security)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "p31:ci:all"],
    slow: true,
    network: true,
    confirm: "Runs strict mesh + full p31-ci with security. Uses network (live mesh). Continue?",
  },
  "home-validate-full": {
    title: "validate:full (scorecard + extended audits → /tmp report)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "validate:full"],
    slow: true,
    network: true,
    confirm: "validate:full runs extended checks and may hit live services. Continue?",
  },
  "home-p31-all": {
    title: "p31:all (CI + validate:full + fleet + e2e + glass + semgrep soft)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "p31:all"],
    slow: true,
    network: true,
    confirm:
      "p31:all can take 15–30+ minutes (Playwright, mesh, probes). Stay on Wi‑Fi. Run only when you mean “full fleet”. Continue?",
  },
  "home-semgrep-p31ca": {
    title: "semgrep:p31ca (SAST — p/javascript + p/typescript + p/security-audit on src + workers)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "semgrep:p31ca"],
    slow: true,
    confirm:
      "Semgrep scans p31ca only (needs CLI: pipx install semgrep). Many warnings are expected — soft in p31:all. Continue?",
  },

  // —— Verify slices
  "home-verify-monetary": {
    title: "verify:monetary (ecosystem + constants + economy)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:monetary"],
  },
  "home-verify-map": {
    title: "verify:map-pipeline (MAP / donate static checks)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:map-pipeline"],
  },
  "home-verify-mesh": {
    title: "verify:mesh (k4 bundle + live /api/*)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:mesh"],
    network: true,
  },
  "home-verify-ecosystem": {
    title: "verify:ecosystem (p31-ecosystem.json + p31-live-fleet anchors)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "verify:ecosystem"],
  },
  "home-ecosystem-glass": {
    title: "ecosystem:glass (probes → table + /tmp/p31_glass_report.json)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "ecosystem:glass"],
    network: true,
  },
  "home-ecosystem-plan": {
    title: "ecosystem:plan (ordered deploy list — read-only plan)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "ecosystem:plan"],
  },
  "home-ecosystem-deploy-dry": {
    title: "ecosystem:deploy:dry (ordered argv dry-run — no P31_ECOSYSTEM_DEPLOY)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "ecosystem:deploy:dry"],
  },
  "home-list-p31-env": {
    title: "list:p31-env (P31_* catalog — secrets names only)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "list:p31-env"],
  },

  // —— Operator shift (local HITL)
  "home-operator-shift-status": {
    title: "operator:shift-status (~/.p31/operator-shift.jsonl)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "operator:shift-status"],
    hitl: true,
  },
  "home-operator-shift-in": {
    title: "operator:shift-in (tag in — local log)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "operator:shift-in"],
    hitl: true,
  },
  "home-operator-shift-out": {
    title: "operator:shift-out (tag out — local log)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "operator:shift-out"],
    hitl: true,
  },

  // —— Polish & release
  "home-polish": {
    title: "polish (apply:constants + live-fleet + release:local + security — slow)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "polish"],
    slow: true,
    network: true,
    confirm: "polish runs release:local and security; may take several minutes. Continue?",
  },
  "home-frictionless": {
    title: "frictionless (doctor + release:local mesh loose)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "frictionless"],
    slow: true,
  },
  "home-release-public": {
    title: "release:public (verify + strict mesh + hub:ci + security)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "release:public"],
    slow: true,
    network: true,
    confirm: "release:public is a full public-release gate. Continue?",
  },

  // —— Git & PR
  "home-git-hooks": { title: "git:hooks (core.hooksPath = .githooks)", cwd: repoRoot, cmd: "npm", args: ["run", "git:hooks"] },
  "home-git-autopush-status": { title: "git:autopush:status", cwd: repoRoot, cmd: "npm", args: ["run", "git:autopush:status"] },
  "home-git-autopush-on": { title: "git:autopush:on", cwd: repoRoot, cmd: "npm", args: ["run", "git:autopush:on"] },
  "home-git-autopush-off": { title: "git:autopush:off", cwd: repoRoot, cmd: "npm", args: ["run", "git:autopush:off"] },
  "home-git-remotes": { title: "git:remotes (origin + andromeda)", cwd: repoRoot, cmd: "npm", args: ["run", "git:remotes"] },
  "home-automation-autoclean": {
    title: "automation:autoclean (dry-run — delete local branches merged into main)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "automation:autoclean"],
  },
  "home-automation-autoclean-apply": {
    title: "automation:autoclean:apply (delete merged local branches — destructive)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "automation:autoclean:apply"],
    hitl: true,
    confirm: "Deletes local git branches already merged into main (not remote). Continue?",
  },
  "home-pr": {
    title: "pr (ship branch, gh auto-merge if configured)",
    cwd: repoRoot,
    cmd: "npm",
    args: ["run", "pr"],
    hitl: true,
  },
  "home-fix-gh": { title: "fix:gh (gh auth setup-git)", cwd: repoRoot, cmd: "npm", args: ["run", "fix:gh"] },

  // —— Andromeda (repo root = andromeda/)
  "andromeda-git-hooks": { title: "Andromeda: git:hooks", cwd: andromedaRoot, cmd: "npm", args: ["run", "git:hooks"] },
  "andromeda-prepush": { title: "Andromeda: prepush:check", cwd: andromedaRoot, cmd: "npm", args: ["run", "prepush:check"] },
  "andromeda-pr": { title: "Andromeda: pnpm pr", cwd: andromedaRoot, cmd: "pnpm", args: ["pr"], hitl: true },
  "andromeda-fix-gh": { title: "Andromeda: fix:gh", cwd: andromedaRoot, cmd: "npm", args: ["run", "fix:gh"] },
  "andromeda-polish": {
    title: "Andromeda: polish (quality + p31ca hub:ci + security)",
    cwd: andromedaRoot,
    cmd: "npm",
    args: ["run", "polish"],
    slow: true,
    network: true,
    confirm: "Andromeda polish can take a long time. Continue?",
  },
  "p31ca-hub-ci": {
    title: "p31ca hub:ci (about + verify + build + dist check)",
    cwd: p31caPkg,
    cmd: "npm",
    args: ["run", "hub:ci"],
    slow: true,
  },
  "p31ca-hub-diff": {
    title: "p31ca hub:diff (ground-truth + Worker SPA + hub index diff)",
    cwd: p31caPkg,
    cmd: "npm",
    args: ["run", "hub:diff"],
  },
};

export const P31CA_PUBLIC_BASE =
  "http://127.0.0.1:8080/andromeda/04_SOFTWARE/p31ca/public";

/** Local static preview links when `npm run demo` is on :8080. */
export function getLocalPreviewLinks(hasP31caFn) {
  const links = [
    { href: "http://127.0.0.1:8080/soup.html", label: "C.A.R.S." },
    { href: "http://127.0.0.1:8080/cognitive-passport/index.html", label: "Cognitive Passport" },
    { href: "http://127.0.0.1:8080/docs/doc-library/index.html", label: "Document library" },
    { href: "http://127.0.0.1:8080/docs/physics-learn/index.html", label: "Physics learn" },
  ];
  if (hasP31caFn()) {
    links.push(
      { href: `${P31CA_PUBLIC_BASE}/initial-build.html`, label: "Create (initial build)" },
      { href: `${P31CA_PUBLIC_BASE}/connect.html`, label: "Connect (K₄)" },
      { href: "https://p31ca.org/lab", label: "Hub Sovereign Lab (/lab)" },
      { href: "https://p31ca.org/slicer", label: "Hub slicer (/slicer)" },
    );
  }
  links.push(
    { href: "http://127.0.0.1:8080/poets-room.html", label: "Poets room" },
    { href: "http://127.0.0.1:8080/p31-personal-howto.html", label: "Personal how-to" },
    { href: "http://127.0.0.1:8080/p31-sovereign-lab.html", label: "Sovereign Lab" },
    { href: "http://127.0.0.1:8080/p31-slicer.html", label: "Browser slicer" },
    { href: "http://127.0.0.1:5174/", label: "Geodesic state (5174)" },
  );
  return links;
}

/** Section order — titles are operator-facing; ids reference {@link ACTIONS}. */
export const SECTIONS_RAW = [
  {
    id: "chromebook-iphone",
    title: "Devices · Chromebook & iPhone (this port)",
    ids: [],
    links: [
      {
        href: "https://github.com/p31labs/bonding-soup/blob/main/docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md",
        label: "Spine · Chromebook + mobile",
      },
      {
        href: "https://github.com/p31labs/bonding-soup/blob/main/docs/P31-CHROMEBOOK-COMMAND-READINESS.md",
        label: "Chromebook readiness",
      },
      {
        href: "https://github.com/p31labs/bonding-soup/blob/main/docs/P31-IPHONE-COMMAND-READINESS.md",
        label: "iPhone readiness",
      },
      { href: "http://127.0.0.1:8080/p31-device-setup.html", label: "Device setup wizard (:8080)" },
    ],
  },
  {
    id: "local",
    title: "Local previews (demo :8080 — Geodesic preview :5174)",
    ids: ["home-demo", "home-geodesic-preview"],
  },
  {
    id: "ollama",
    title: "Ollama fleet",
    ids: [
      "ollama-fleet-status",
      "ollama-setup",
      "ollama-verify",
      "ollama-bench",
      "ollama-tunnel-start",
      "ollama-mcp-verify",
      "home-verify-fleet-llm-bridge",
      "ollama-gpu-monitor",
    ],
  },
  {
    id: "simplex",
    title: "SIMPLEX control plane",
    ids: [
      "simplex-health",
      "simplex-breakers",
      "simplex-estop",
      "simplex-breaker-agents-on",
      "simplex-breaker-agents-off",
      "simplex-breaker-sentinel-on",
      "simplex-breaker-sentinel-off",
      "simplex-breaker-forge-on",
      "simplex-breaker-forge-off",
      "simplex-breaker-medic-on",
      "simplex-breaker-medic-off",
      "simplex-breaker-herald-on",
      "simplex-breaker-herald-off",
      "simplex-fire-steward",
      "simplex-fire-oracle",
      "simplex-telemetry-spoons",
      "simplex-telemetry-tomograph",
      "simplex-telemetry-accommodation",
    ],
  },
  {
    id: "github-org",
    title: "GitHub org (map + metadata)",
    ids: [
      "home-github-org-check",
      "home-github-org-plan",
      "home-github-org-valve-closed",
      "home-github-org-valve-dry",
      "home-github-org-valve-open",
      "home-github-org-auto",
      "home-github-org-metadata",
      "home-github-org-sync-push",
      "home-github-org-apply",
    ],
    links: [
      {
        href: "https://github.com/p31labs/bonding-soup/blob/main/docs/P31-GITHUB-ORG-REPOS.md",
        label: "Org map runbook",
      },
      {
        href: "https://github.com/p31labs/bonding-soup/blob/main/docs/github-org-bundle/README.md",
        label: "Bundle + PAT (CI)",
      },
    ],
  },
  {
    id: "diagnostics",
    title: "Diagnostics & ship bar",
    ids: [
      "home-doctor",
      "home-connection",
      "home-build",
      "home-soup-prep",
      "home-soup-prep-check",
      "home-soup-room-scale",
      "home-verify-alignment",
      "home-verify-facts",
      "home-verify-simplex",
      "home-simplex-verify-all",
      "home-simplex-bootstrap-dry",
      "home-simplex-bootstrap-apply",
      "home-mesh-budgets",
      "home-remember-probe-status",
      "home-build-fleet-portal",
      "home-build-fleet-portal-live",
      "home-build-fleet-entities",
      "home-verify",
      "home-effective-bar",
      "home-office-ready",
      "home-verify-semgrep-parity",
      "home-apply-constants",
      "home-sync-passport",
      "home-sync-sovereign-p31ca",
      "home-inventory-cf",
    ],
  },
  {
    id: "ci",
    title: "CI & full gates",
    ids: [
      "home-release-check",
      "home-p31-ci-all",
      "home-validate-full",
      "home-p31-all",
      "home-semgrep-p31ca",
    ],
  },
  {
    id: "slices",
    title: "Verify slices & probes",
    ids: [
      "home-verify-monetary",
      "home-verify-map",
      "home-verify-mesh-offline",
      "home-verify-mesh",
      "home-verify-ecosystem",
      "home-build-doc-index",
      "home-verify-doc-index",
      "home-docs-prep-hub",
      "home-verify-doc-library-p31ca-mirror",
      "home-docs-hub-simulate",
      "home-docs-hub-automate",
      "home-test-simulations",
      "home-verify-geodesic-wire-fixtures",
      "home-mirror-fixer",
      "home-mirror-fixer-apply",
      "home-verify-runbooks",
      "home-verify-delta-language",
      "home-verify-public-voice",
      "home-verify-atmosphere-ramp",
      "home-test-doc-library-e2e",
      "home-test-physics-learn-e2e",
      "home-test-k4market-smoke",
      "home-ecosystem-glass",
      "home-ecosystem-plan",
      "home-ecosystem-deploy-dry",
      "home-list-p31-env",
    ],
  },
  {
    id: "operator",
    title: "Operator shift",
    ids: ["home-operator-shift-status", "home-operator-shift-in", "home-operator-shift-out"],
  },
  { id: "ship", title: "Polish & release", ids: ["home-frictionless", "home-polish", "home-release-public"] },
  {
    id: "git",
    title: "Git & PR",
    ids: [
      "home-git-hooks",
      "home-git-autopush-status",
      "home-git-autopush-on",
      "home-git-autopush-off",
      "home-git-remotes",
      "home-automation-autoclean",
      "home-automation-autoclean-apply",
      "home-pr",
      "home-fix-gh",
    ],
  },
  {
    id: "andromeda",
    title: "Andromeda · p31ca",
    ids: [
      "andromeda-git-hooks",
      "andromeda-prepush",
      "p31ca-hub-ci",
      "p31ca-hub-diff",
      "andromeda-polish",
      "andromeda-pr",
      "andromeda-fix-gh",
    ],
  },
];

/** Calm lane — essentials only when the UI is locked down. */
export const ESSENTIAL_ACTION_IDS = ["home-doctor", "home-verify", "home-connection"];

export function filterSections(hasA, hasP) {
  return SECTIONS_RAW.map((sec) => {
    const ids = sec.ids.filter((id) => {
      if (id.startsWith("andromeda-") && !hasA) return false;
      if ((id === "p31ca-hub-ci" || id === "p31ca-hub-diff") && !hasP) return false;
      return true;
    });
    if (sec.id === "local") {
      return { ...sec, ids, links: getLocalPreviewLinks(() => hasP) };
    }
    return { ...sec, ids };
  }).filter((s) => s.ids.length > 0 || (s.links && s.links.length > 0));
}

export function hasAndromedaTree() {
  return pathExists(path.join(andromedaRoot, "package.json"));
}

export function hasP31caPackage() {
  return pathExists(path.join(p31caPkg, "package.json"));
}
