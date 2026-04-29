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
      "home-verify-mesh",
      "home-build-doc-index",
      "home-verify-doc-index",
      "home-docs-prep-hub",
      "home-verify-doc-library-p31ca-mirror",
      "home-mirror-fixer",
      "home-mirror-fixer-apply",
      "home-verify-runbooks",
      "home-test-doc-library-e2e",
      "home-test-physics-learn-e2e",
      "home-test-k4market-smoke",
      "home-ecosystem-glass",
      "home-ecosystem-plan",
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
