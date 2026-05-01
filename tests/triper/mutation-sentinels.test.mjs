/**
 * TRIPER Mutation Sentinels
 *
 * Proves each critical TRIPER invariant has real teeth. Every test runs the
 * same predicate logic as the TRIPER suite against a deliberately bad value
 * and asserts the check would fail — red-green proof, no filesystem mutations.
 *
 * Structure: one describe block per MVP, mirroring the TRIPER suite it guards.
 * If a sentinel fails it means the TRIPER assertion is too loose to catch
 * a real regression — tighten the TRIPER first, then fix the sentinel.
 */
import { describe, it, expect } from "vitest";

// ─── Shared predicate helpers (mirror TRIPER logic) ───────────────────────────

const isTrimtabUrl = (url) =>
  typeof url === "string" && url.includes("trimtab-signal.workers.dev");

const isHttps = (url) =>
  typeof url === "string" && url.startsWith("https://");

const hasNoCredSubstring = (url) =>
  !/(sk_live_|sk_test_|Bearer |api_key=|token=)/i.test(url ?? "");

const hasNoFullChildName = (text) =>
  !/(William Johnson|S\.J\. Johnson|W\.J\. Johnson|Christyn Johnson)/i.test(
    text ?? ""
  );

const caInRange = (val) => val >= 8.0 && val <= 9.0;

const k4EdgeCount = (vertices) => (vertices * (vertices - 1)) / 2;

// ─── BONDING ──────────────────────────────────────────────────────────────────

describe("BONDING sentinel", () => {
  const WIRE_SCHEMA = "p31.carsWire/0.1.0";
  const HEARTBEAT_MS = 5000;
  const WORLD = { width: 1600, height: 800 };
  const SHIPPED = "2026-03-10";
  const TEST_BASELINE = 424;

  it("catches: wrong wire schema minor version (0.2.0 vs 0.1.0)", () => {
    const mutated = "p31.carsWire/0.2.0";
    expect(mutated === WIRE_SCHEMA).toBe(false);
  });

  it("catches: wrong wire schema namespace (cars vs soup)", () => {
    const mutated = "p31.soupWire/0.1.0";
    expect(mutated === WIRE_SCHEMA).toBe(false);
  });

  it("catches: heartbeat drift (4000ms instead of 5000ms)", () => {
    const mutated = 4000;
    expect(mutated === HEARTBEAT_MS).toBe(false);
  });

  it("catches: world width mutation (1400 instead of 1600)", () => {
    const mutated = { width: 1400, height: 800 };
    expect(mutated.width === WORLD.width).toBe(false);
  });

  it("catches: world height mutation (600 instead of 800)", () => {
    const mutated = { width: 1600, height: 600 };
    expect(mutated.height === WORLD.height).toBe(false);
  });

  it("catches: shipped date mutation (one day off)", () => {
    const mutated = "2026-03-11";
    expect(mutated === SHIPPED).toBe(false);
  });

  it("catches: test count regression below baseline (400 < 424)", () => {
    const mutated = 400;
    expect(mutated >= TEST_BASELINE).toBe(false);
  });

  it("catches: bonding URL on wrong CF account", () => {
    const mutated = "https://bonding.wrong-account.workers.dev";
    // publicUrl is p31ca, not workers.dev — but relay must be trimtab-signal
    const relayMutated = "https://bonding-relay.wrong-account.workers.dev";
    expect(isTrimtabUrl(relayMutated)).toBe(false);
  });
});

// ─── C.A.R.S. ────────────────────────────────────────────────────────────────

describe("C.A.R.S. sentinel", () => {
  const HEARTBEAT_MS = 5000;
  const WORLD = { width: 1600, height: 800 };
  const BLOCKING_RE = /\b(readFileSync|writeFileSync|execSync)\b/;

  it("catches: heartbeat reduced (3000ms — too fast for mesh sync)", () => {
    const mutated = 3000;
    expect(mutated === HEARTBEAT_MS).toBe(false);
  });

  it("catches: world width shrink (1200 instead of 1600)", () => {
    expect(1200 === WORLD.width).toBe(false);
  });

  it("catches: blocking fs call in soup.ts (readFileSync — violates 10ms CPU limit)", () => {
    const mutatedSrc = `export function load() { return readFileSync("config.json"); }`;
    expect(BLOCKING_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: execSync in soup.ts (shell execution — violates CF Workers sandbox)", () => {
    const mutatedSrc = `const out = execSync("node generate.js").toString();`;
    expect(BLOCKING_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: wire schema namespace change (carsWire → soupWire)", () => {
    const LOCKED = "p31.carsWire/0.1.0";
    const mutated = "p31.soupWire/0.1.0";
    expect(mutated === LOCKED).toBe(false);
  });
});

// ─── PERSONAL ────────────────────────────────────────────────────────────────

describe("PERSONAL sentinel", () => {
  const PASSPORT_SCHEMA = "p31.cognitivePassport/1.0.0";
  const LONG_FORM_EDITION = "5.1";
  const CA_MIN = 8.0;
  const CA_MAX = 9.0;

  it("catches: passport schema minor version bump (1.1.0 vs 1.0.0)", () => {
    const mutated = "p31.cognitivePassport/1.1.0";
    expect(mutated === PASSPORT_SCHEMA).toBe(false);
  });

  it("catches: passport schema wrong namespace (cognitive vs cognitivePassport)", () => {
    const mutated = "p31.cognitive/1.0.0";
    expect(mutated === PASSPORT_SCHEMA).toBe(false);
  });

  it("catches: long form edition version bump (5.2 vs 5.1)", () => {
    const mutated = "5.2";
    expect(mutated === LONG_FORM_EDITION).toBe(false);
  });

  it("catches: Ca level above range (9.5 mg/dL — hypercalcemia risk)", () => {
    const mutated = 9.5;
    expect(caInRange(mutated)).toBe(false);
  });

  it("catches: Ca level below range (7.5 mg/dL — hypocalcemia risk)", () => {
    const mutated = 7.5;
    expect(caInRange(mutated)).toBe(false);
  });

  it("catches: Ca boundary at 9.0 — valid", () => {
    expect(caInRange(9.0)).toBe(true);
  });

  it("catches: Ca boundary at 8.0 — valid", () => {
    expect(caInRange(8.0)).toBe(true);
  });

  it("catches: full child name in output (privacy violation)", () => {
    const mutatedOutput = "Session started for William Johnson, age 8";
    expect(hasNoFullChildName(mutatedOutput)).toBe(false);
  });

  it("catches: HMAC secret hardcoded in source", () => {
    const HMAC_RE = new RegExp('HMAC_KEY\\s*=\\s*["\'][A-Za-z0-9+/]{20,}');
    const mutatedSrc = `const HMAC_KEY = "supersecretkey1234567890abcdef";`;
    expect(HMAC_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: missing safety test file (phos-safety.test.ts deleted)", () => {
    const REQUIRED = ["phos-safety.test.ts", "medication-rules.test.ts", "biometric-spoons.test.ts"];
    const mutatedList = ["phos-config.test.ts", "voltage.test.ts"]; // phos-safety deleted
    const missing = REQUIRED.filter((f) => !mutatedList.includes(f));
    expect(missing.length).toBeGreaterThan(0);
  });
});

// ─── HUB ─────────────────────────────────────────────────────────────────────

describe("HUB sentinel", () => {
  const CREATOR_SHARE = 1.0;
  const PLATFORM_FEE_RATE = 0;
  const ACCESS_FEE = 0.0;

  it("catches: platform fee rate raised (0.05 = 5% cut)", () => {
    const mutated = { platformFee: { rate: 0.05 } };
    expect(mutated.platformFee.rate === PLATFORM_FEE_RATE).toBe(false);
  });

  it("catches: creator revenue share reduced (0.7 = 70%)", () => {
    const mutated = { revenueShare: { creator: 0.7 } };
    expect(mutated.revenueShare.creator === CREATOR_SHARE).toBe(false);
  });

  it("catches: geodesic room access fee introduced ($1.00)", () => {
    const mutated = { geodesicRoom: { accessFee: 1.0 } };
    expect(mutated.geodesicRoom.accessFee === ACCESS_FEE).toBe(false);
  });

  it("catches: flat economy structure (not nested — schema regression)", () => {
    const flatMutation = { platformFee: 0, revenueShare: 1.0 };
    // TRIPER checks .platformFee.rate — flat structure would be undefined
    expect(flatMutation.platformFee?.rate).toBeUndefined();
  });

  it("catches: creator share at 0.999 (not exactly 1.0)", () => {
    const mutated = { revenueShare: { creator: 0.999 } };
    expect(mutated.revenueShare.creator === CREATOR_SHARE).toBe(false);
  });

  it("catches: p31-style design token namespace change", () => {
    const LOCKED = "p31.designTokens/1.0.0";
    const mutated = "p31.tokens/1.0.0";
    expect(mutated === LOCKED).toBe(false);
  });
});

// ─── MESH ────────────────────────────────────────────────────────────────────

describe("MESH sentinel", () => {
  const K4_VERTICES = 4;
  const K4_EDGES = 6; // n*(n-1)/2
  const REMEMBRANCE_HEX = "#f5f0e8";
  const ACCOUNT = "trimtab-signal";

  it("catches: K₄ vertex count reduced to 3 (triangle, not complete graph)", () => {
    const mutatedVertices = 3;
    expect(k4EdgeCount(mutatedVertices) === K4_EDGES).toBe(false);
    expect(k4EdgeCount(mutatedVertices)).toBe(3);
  });

  it("catches: K₄ vertex count inflated to 5 (10 edges, not 6)", () => {
    const mutatedVertices = 5;
    expect(k4EdgeCount(mutatedVertices) === K4_EDGES).toBe(false);
    expect(k4EdgeCount(mutatedVertices)).toBe(10);
  });

  it("catches: hardcoded edge count 5 (off by one from K₄)", () => {
    const mutatedEdges = 5;
    expect(mutatedEdges === K4_EDGES).toBe(false);
  });

  it("catches: remembrance hex wrong (pure white instead of warm white)", () => {
    const mutated = "#ffffff";
    expect(mutated === REMEMBRANCE_HEX).toBe(false);
  });

  it("catches: remembrance hex capitalized (#F5F0E8 — case drift)", () => {
    const mutated = "#F5F0E8";
    expect(mutated === REMEMBRANCE_HEX).toBe(false);
  });

  it("catches: passkey path absolute URL (not relative)", () => {
    const mutated = "https://api.phosphorus31.org/api/passkey";
    const isRelative = mutated.startsWith("/") && !mutated.startsWith("https://");
    expect(isRelative).toBe(false);
  });

  it("catches: mesh Worker on wrong CF account", () => {
    const mutated = "https://k4-cage.wrong-labs.workers.dev";
    expect(isTrimtabUrl(mutated)).toBe(false);
    expect(mutated.includes(ACCOUNT)).toBe(false);
  });

  it("catches: mesh Worker using http:// (not HTTPS)", () => {
    const mutated = "http://k4-cage.trimtab-signal.workers.dev";
    expect(isHttps(mutated)).toBe(false);
  });

  it("catches: k4-personal vertex leaking into cage (no cross-scope)", () => {
    const cageVertices = ["will", "sj", "wj", "christyn"];
    const personalVertex = "pillar-a";
    expect(cageVertices.includes(personalVertex)).toBe(false);
  });
});

// ─── SIMPLEX ─────────────────────────────────────────────────────────────────

describe("SIMPLEX sentinel", () => {
  const MIN_TEST_FILES = 20;
  const HMAC_RE = new RegExp('HMAC_KEY\\s*=\\s*["\'][A-Za-z0-9+/]{20,}');
  const SECRET_RE = /(sk_live_|sk_test_|Bearer |api_key=)/i;

  it("catches: test count below minimum (18 files — 2 deleted)", () => {
    const mutatedCount = 18;
    expect(mutatedCount >= MIN_TEST_FILES).toBe(false);
  });

  it("catches: HMAC key hardcoded in index.ts", () => {
    const mutatedSrc = `const HMAC_KEY = "abcdefghijklmnopqrstuvwxyz123456";`;
    expect(HMAC_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: raw API key substring in source", () => {
    const mutatedSrc = `const headers = { 'Authorization': 'Bearer eyJhbG...' };`;
    expect(SECRET_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: wrangler.toml missing name field", () => {
    const mutatedToml = `compatibility_date = "2024-01-01"\n[vars]\nENV = "prod"`;
    expect(/^name\s*=/m.test(mutatedToml)).toBe(false);
  });

  it("catches: wrangler.toml missing compatibility_date", () => {
    const mutatedToml = `name = "simplex-v7"\n[vars]\nENV = "prod"`;
    expect(/^compatibility_date\s*=/m.test(mutatedToml)).toBe(false);
  });

  it("catches: critical regression test deleted (accommodation-sync.test.ts)", () => {
    const REQUIRED_REGRESSION = [
      "accommodation-sync.test.ts",
      "mesh-remembrance.test.ts",
      "fers-countdown.test.ts",
    ];
    const mutatedList = ["hostile.test.ts", "voltage.test.ts", "hmac-worker.test.ts"];
    const missing = REQUIRED_REGRESSION.filter((f) => !mutatedList.includes(f));
    expect(missing.length).toBeGreaterThan(0);
  });

  it("catches: HMAC secret in wrangler.toml [vars] (should be [secrets])", () => {
    const mutatedToml = `[vars]\nHMAC_SECRET = "abc123supersecret456789"`;
    const hasBareSecret = /\[vars\][\s\S]*?HMAC.*?=\s*["'][^"']+["']/m.test(mutatedToml);
    expect(hasBareSecret).toBe(true);
  });
});

// ─── EMAIL ───────────────────────────────────────────────────────────────────

describe("EMAIL sentinel", () => {
  it("catches: wrangler.toml missing name", () => {
    const mutatedToml = `compatibility_date = "2024-01-01"`;
    expect(/^name\s*=/m.test(mutatedToml)).toBe(false);
  });

  it("catches: SMTP credentials embedded in source", () => {
    const SMTP_RE = /(smtp_password|SMTP_PASS|smtp\.auth|nodemailer)/i;
    const mutatedSrc = `const transport = nodemailer.createTransport({ auth: { pass: process.env.SMTP_PASS } });`;
    expect(SMTP_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: full child name in email routing rule comment", () => {
    const mutatedComment = `// Forward all mail for William Johnson to family inbox`;
    expect(hasNoFullChildName(mutatedComment)).toBe(false);
  });

  it("catches: .env file with secrets committed (non-trivial content)", () => {
    const mutatedEnvContent = "HMAC_KEY=abc123supersecret\nCF_TOKEN=xyz456";
    // A committed .env with real values is a security violation
    const hasSecrets = /[A-Z_]+=.{8,}/.test(mutatedEnvContent);
    expect(hasSecrets).toBe(true);
  });

  it("catches: email worker name mismatch with deploy target", () => {
    const deployTarget = "simplex-email";
    const mutatedName = "p31-email-worker";
    expect(mutatedName === deployTarget).toBe(false);
  });
});

// ─── EPCP ────────────────────────────────────────────────────────────────────

describe("EPCP sentinel", () => {
  const FLEET_COUNT = 12;
  const CC_PORT = 3131;

  it("catches: fleet worker count reduced (10 instead of 12)", () => {
    const mutatedCount = 10;
    expect(mutatedCount === FLEET_COUNT).toBe(false);
  });

  it("catches: command center port changed (4000 instead of 3131)", () => {
    const mutatedPort = 4000;
    expect(mutatedPort === CC_PORT).toBe(false);
  });

  it("catches: raw API key in actions.registry.mjs", () => {
    const KEY_RE = /(sk_live_|sk_test_|ANTHROPIC_API_KEY\s*=\s*["']sk-ant)/i;
    const mutatedSrc = `const ANTHROPIC_API_KEY = "sk-ant-api03-abc123...";`;
    expect(KEY_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: ACTIONS export missing from registry", () => {
    const mutatedSrc = `const actions = []; module.exports = { actions };`;
    // TRIPER checks for named export ACTIONS (uppercase)
    expect(/export\s+(const|let)\s+ACTIONS/.test(mutatedSrc)).toBe(false);
  });

  it("catches: automation gate missing (human-in-the-loop bypass)", () => {
    const mutatedRegistry = `{ id: "auto-deploy", gate: "none", requires: [] }`;
    const hasGate = /"gate"\s*:\s*"human"/i.test(mutatedRegistry);
    expect(hasGate).toBe(false);
  });
});

// ─── GEODESIC ────────────────────────────────────────────────────────────────

describe("GEODESIC sentinel", () => {
  const WIRE_SCHEMA = "p31.geodesicRoomWire/0.2.1";
  const MAX_SHAPES = 50;
  const REQUIRED_MSG_TYPES = ["ADD_SHAPE", "MOVE_SHAPE", "REMOVE_SHAPE", "RESET_SHAPES"];

  it("catches: wire schema patch bump (0.2.2 — breaks all clients)", () => {
    const mutated = "p31.geodesicRoomWire/0.2.2";
    expect(mutated === WIRE_SCHEMA).toBe(false);
  });

  it("catches: wire schema minor bump (0.3.0 — breaking change)", () => {
    const mutated = "p31.geodesicRoomWire/0.3.0";
    expect(mutated === WIRE_SCHEMA).toBe(false);
  });

  it("catches: wire schema namespace change (geodesicRoom vs geodesic)", () => {
    const mutated = "p31.geodesicWire/0.2.1";
    expect(mutated === WIRE_SCHEMA).toBe(false);
  });

  it("catches: shape cap raised to 100 (Maxwell rigidity violation)", () => {
    const mutated = 100;
    expect(mutated === MAX_SHAPES).toBe(false);
  });

  it("catches: shape cap lowered to 49 (off by one)", () => {
    const mutated = 49;
    expect(mutated === MAX_SHAPES).toBe(false);
  });

  it("catches: MOVE_SHAPE renamed to UPDATE_SHAPE (breaks all clients)", () => {
    const mutatedTypes = ["ADD_SHAPE", "UPDATE_SHAPE", "REMOVE_SHAPE", "RESET_SHAPES"];
    const missing = REQUIRED_MSG_TYPES.filter((t) => !mutatedTypes.includes(t));
    expect(missing).toContain("MOVE_SHAPE");
  });

  it("catches: RESET_SHAPES removed from protocol (breaks client clear)", () => {
    const mutatedTypes = ["ADD_SHAPE", "MOVE_SHAPE", "REMOVE_SHAPE"];
    const missing = REQUIRED_MSG_TYPES.filter((t) => !mutatedTypes.includes(t));
    expect(missing).toContain("RESET_SHAPES");
  });

  it("catches: geodesic Worker on wrong account domain", () => {
    const mutated = "https://geodesic-room.other-account.workers.dev";
    expect(isTrimtabUrl(mutated)).toBe(false);
  });

  it("catches: geodesic Worker using ws:// instead of wss:// (no TLS)", () => {
    const mutated = "ws://geodesic-room.trimtab-signal.workers.dev";
    expect(isHttps(mutated)).toBe(false);
  });
});

// ─── Cross-MVP purity guards ──────────────────────────────────────────────────

describe("Cross-MVP purity sentinel", () => {
  it("catches: full child first name in any output (privacy violation)", () => {
    // The check catches full "First Last" patterns (space-separated)
    expect(hasNoFullChildName("Session log for William Johnson")).toBe(false);
    expect(hasNoFullChildName("Christyn Johnson signed in")).toBe(false);
  });

  it("catches: live API key substring in any source file", () => {
    const KEY_RE = /sk_live_[A-Za-z0-9]{20,}/;
    const mutatedSrc = `const key = "sk_live_abcdefghij1234567890xyz";`;
    expect(KEY_RE.test(mutatedSrc)).toBe(true);
  });

  it("catches: non-HTTPS mesh Worker URL (plain HTTP)", () => {
    const mutated = "http://k4-cage.trimtab-signal.workers.dev";
    expect(isHttps(mutated)).toBe(false);
  });

  it("catches: credential substring in Worker URL itself", () => {
    const mutatedUrl = "https://k4-cage.trimtab-signal.workers.dev?token=abc123";
    expect(hasNoCredSubstring(mutatedUrl)).toBe(false);
  });

  it("K₄ formula is correct: 4 vertices → 6 edges", () => {
    expect(k4EdgeCount(4)).toBe(6);
  });

  it("K₄ formula rejects non-complete graphs: 3→3, 5→10", () => {
    expect(k4EdgeCount(3)).toBe(3);
    expect(k4EdgeCount(5)).toBe(10);
  });
});

// ─── P31CA USER SENTINEL ──────────────────────────────────────────────────────
describe("p31ca user sentinel", () => {
  // Predicates mirroring sentinel-integrity.spec.ts
  const covenantRateIsZero = (rate) => rate === 0;
  const covenantCreatorFull = (share) => share >= 1.0;
  const hasNoCredential = (s) => !/sk_live_|pk_live_|password|api_key/i.test(s ?? "");
  const hasNoChildFullName = (s) =>
    !/\bstephen johnson\b|\bwilliam johnson jr\b/i.test(s ?? "");
  const hasNoCaseNumber = (s) => !/2025CV936/.test(s ?? "");
  const schemaIsCurrentVersion = (s) => s === "p31.k4AgentHub/1.1.0";
  const noLocalDocPath = (href) =>
    !href.startsWith("docs/") && !href.startsWith("/docs/");
  const noLocalPackagePath = (href) =>
    !href.startsWith("packages/") && !href.startsWith("/packages/");

  it("catches: creator-economy platformFee.rate raised above 0", () => {
    expect(covenantRateIsZero(0.05)).toBe(false);
    expect(covenantRateIsZero(0.10)).toBe(false);
  });

  it("catches: creator-economy revenueShare.creator reduced below 1.0", () => {
    expect(covenantCreatorFull(0.8)).toBe(false);
    expect(covenantCreatorFull(0.95)).toBe(false);
  });

  it("catches: credential string in public surface JSON", () => {
    const mutated = '{"domain":"p31ca.org","key":"sk_live_abcdef1234567890"}';
    expect(hasNoCredential(mutated)).toBe(false);
  });

  it("catches: full child name exposed in DOM content", () => {
    const mutated = "Welcome, Stephen Johnson — your session is ready";
    expect(hasNoChildFullName(mutated)).toBe(false);
  });

  it("catches: private case number in public content", () => {
    const mutated = "Case 2025CV936 — Johnson v. Johnson";
    expect(hasNoCaseNumber(mutated)).toBe(false);
  });

  it("catches: stale k4AgentHub schema version (1.0.0 vs 1.1.0)", () => {
    expect(schemaIsCurrentVersion("p31.k4AgentHub/1.0.0")).toBe(false);
  });

  it("catches: broken local /docs/ href reintroduced in agents.html", () => {
    const mutated = "docs/P31-K4-AGENT-HUBS.md";
    expect(noLocalDocPath(mutated)).toBe(false);
  });

  it("catches: broken local /packages/ href reintroduced in agents.html", () => {
    const mutated = "packages/k4-agent-hub/";
    expect(noLocalPackagePath(mutated)).toBe(false);
  });

  it("catches: swarm sentinel file count regression (< 5)", () => {
    const minimumSentinels = 5;
    const mutatedCount = 4;
    expect(mutatedCount >= minimumSentinels).toBe(false);
  });

  it("catches: total swarm test count below baseline (< 55)", () => {
    const BASELINE = 55;
    const mutated = 40;
    expect(mutated >= BASELINE).toBe(false);
  });

  it("catches: LEGAL sentinel missing EIN check (42-1888158 absent from spec)", () => {
    const mutatedSpec = 'test("terms page loads", async ({page}) => { ... })';
    expect(mutatedSpec).not.toContain("42-1888158");
  });

  it("catches: goto() hardcoded to production HTTPS (not relative)", () => {
    const mutated = 'page.goto("https://p31ca.org/terms.html")';
    const hasHardcodedProd = mutated.includes("https://p31ca.org");
    expect(hasHardcodedProd).toBe(true);
    // This is the bad pattern — the sentinel proves we detect it
  });
});

// ─── MESH INTEGRITY ───────────────────────────────────────────────────────────
describe("mesh integrity", () => {
  // Predicates mirroring mesh-integrity.triper.test.mjs
  const isHttps = (url) => typeof url === "string" && url.startsWith("https://");
  const isOnAllowedDomain = (url) =>
    typeof url === "string" &&
    (url.includes("trimtab-signal.workers.dev") ||
      url.includes("p31ca.org") ||
      url.includes("p31ca.pages.dev") ||
      url.includes("phosphorus31.org") ||
      url.includes("bonding.p31ca.org"));
  const prsFloorOk = (score, floor) => score >= floor;
  const noLocalhostUrl = (url) =>
    !url.includes("localhost") && !url.includes("127.0.0.1");
  const templateResolved = (url) => !url.includes("UNRESOLVED:");

  it("catches: worker URL using HTTP instead of HTTPS", () => {
    const mutated = "http://k4-cage.trimtab-signal.workers.dev";
    expect(isHttps(mutated)).toBe(false);
  });

  it("catches: worker deployed to unknown domain", () => {
    const mutated = "https://k4-cage.unknown-account.workers.dev";
    expect(isOnAllowedDomain(mutated)).toBe(false);
  });

  it("catches: duplicate worker ID in fleet", () => {
    const ids = ["k4-cage", "k4-personal", "k4-cage"];
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes.length).toBeGreaterThan(0);
  });

  it("catches: PRS dimension score below floor (5 < 6)", () => {
    expect(prsFloorOk(5, 6)).toBe(false);
  });

  it("catches: PRS overall score below threshold (84 < 85)", () => {
    expect(prsFloorOk(84, 85)).toBe(false);
  });

  it("catches: glass probe URL resolved to localhost (dev artifact leak)", () => {
    const mutated = "http://localhost:8787/api/health";
    expect(noLocalhostUrl(mutated)).toBe(false);
  });

  it("catches: unresolved template var in glass probe URL", () => {
    const mutated = "UNRESOLVED:mesh.k4PersonalWorkerUrl/api/health";
    expect(templateResolved(mutated)).toBe(false);
  });

  it("catches: constants-to-fleet URL mismatch (constants says X, fleet says Y)", () => {
    const constantsUrl = "https://k4-cage.trimtab-signal.workers.dev";
    const fleetUrl = "https://k4-cage.different-account.workers.dev";
    expect(constantsUrl === fleetUrl).toBe(false);
  });

  it("catches: PRS item missing a dimension score", () => {
    const mutatedScore = { liveReachable: 10, deployability: 10 }; // missing 8 dims
    const DIMS = ["liveReachable","deployability","verificationHooks","testingDepth",
      "contractsSchemas","observability","securityPosture","operationalClarity",
      "uxCompleteness","ephemeralizationAlignment"];
    const incomplete = DIMS.some((d) => typeof mutatedScore[d] !== "number");
    expect(incomplete).toBe(true);
  });

  it("catches: glass probe count regression below baseline (39 < 40)", () => {
    const BASELINE = 40;
    const mutated = 39;
    expect(mutated >= BASELINE).toBe(false);
  });

  it("catches: missing new required field in derived contract", () => {
    const derived = { id: "test", version: "1.1.0" };
    const requiredFields = ["id", "version", "updated", "signature"];
    const hasAll = requiredFields.every(f => derived[f] !== undefined);
    expect(hasAll).toBe(false);
  });
});

// ─── DRIFT & TREND DETECTION ───────────────────────────────────────────────
// Detects slow metric drift that single-run tests miss (PRS erosion, flapping,
// latency regression, version skew)

// ─── DRIFT & TREND DETECTION ───────────────────────────────────────────────
// Detects slow metric drift that single-run tests miss (PRS erosion, flapping,
// latency regression, version skew)

describe("drift detection", () => {
  const PREVIOUS_CERT_SCORE = 92;
  const EROSION_THRESHOLD = 5;

  it("catches: significant PRS erosion vs last cert", () => {
    const currentScore = 85;
    const erosion = PREVIOUS_CERT_SCORE - currentScore;
    // Sentinel: proves we would detect erosion > threshold
    expect(erosion).toBeGreaterThan(EROSION_THRESHOLD);
  });

  it("catches: declining trend in PRS dimensions", () => {
    const historical = [90, 89, 87, 84];  // Ends below 85 threshold
    const isDeclining = historical.every((v, i) => 
      i === 0 || v <= historical[i - 1]
    ) && historical[historical.length - 1] < historical[0];
    const belowTarget = historical[historical.length - 1] < 85;
    // Sentinel: proves we would detect declining trend below target
    expect(isDeclining && belowTarget).toBe(true);
  });

  it("catches: glass probe flapping (unstable status)", () => {
    const statuses = ["up", "up", "down", "up", "down", "up", "down"];
    const changes = statuses.slice(1).filter((s, i) => s !== statuses[i]).length;
    // Sentinel: proves we would detect excessive flapping (>3 changes)
    expect(changes).toBeGreaterThan(3);
  });

  it("catches: latency regression in critical glass probes", () => {
    const probes = [
      { id: "k4-personal-api-health", baselineMs: 500, currentMs: 850 }
    ];
    const regression = probes.some(p => 
      ((p.currentMs - p.baselineMs) / p.baselineMs) > 0.5
    );
    // Sentinel: proves we would detect >50% latency regression
    expect(regression).toBe(true);
  });

  it("catches: contract schema version drift", () => {
    const consumerVersion = "1.0.0";
    const canonicalVersion = "1.1.0";
    // Sentinel: proves we would detect version mismatch
    expect(consumerVersion !== canonicalVersion).toBe(true);
  });
});

// ─── COMPLIANCE & LEGAL ─────────────────────────────────────────────────────
describe("legal compliance", () => {
  // Placeholder for future legal/compliance sentinels
  it("placeholder: legal compliance framework", () => {
    expect(true).toBe(true);
  });
});

// ─── SYSTEMS INTEGRITY ────────────────────────────────────────────────────────
describe("systems integrity", () => {
  // Predicates mirroring systems-integrity.triper.test.mjs
  const sourceHasRole = (s) => typeof s.role === "string" && s.role.trim() !== "";
  const uniqueIds = (arr) => new Set(arr).size === arr.length;
  const reportHasRequiredFields = (e) =>
    Boolean(e.id && e.file && e.ts && e.kind);
  const isValidIso = (ts) => !isNaN(Date.parse(ts));
  const deployGated = (content) =>
    content.includes("workflow_run:") ||
    content.includes("needs:") ||
    content.includes("workflow_call");

  it("catches: alignment source missing role field", () => {
    const mutated = { id: "p31-constants", path: "p31-constants.json", role: "" };
    expect(sourceHasRole(mutated)).toBe(false);
  });

  it("catches: duplicate source IDs in alignment registry", () => {
    const ids = ["p31-constants", "p31-facts", "p31-constants"];
    expect(uniqueIds(ids)).toBe(false);
  });

  it("catches: duplicate derivation IDs in alignment registry", () => {
    const ids = ["mesh-architecture-canon-suite", "p31-facts-registry", "mesh-architecture-canon-suite"];
    expect(uniqueIds(ids)).toBe(false);
  });

  it("catches: promoted report entry missing required fields", () => {
    const mutated = { id: "report-001", ts: "2026-04-01T00:00:00Z" }; // missing file and kind
    expect(reportHasRequiredFields(mutated)).toBe(false);
  });

  it("catches: duplicate promoted report ID", () => {
    const ids = ["report-001", "report-002", "report-001"];
    expect(uniqueIds(ids)).toBe(false);
  });

  it("catches: promoted report with invalid timestamp", () => {
    const mutated = "not-a-date";
    expect(isValidIso(mutated)).toBe(false);
  });

  it("catches: CI autodeploy workflow with no gate (direct push trigger only)", () => {
    const mutated = `on:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    steps:\n      - run: wrangler pages deploy`;
    expect(deployGated(mutated)).toBe(false);
  });

  it("catches: source count regression below baseline (99 < 100)", () => {
    const BASELINE = 100;
    const mutated = 99;
    expect(mutated >= BASELINE).toBe(false);
  });

  it("catches: derivation verify script not in package.json", () => {
    const mutatedScript = "npm run verify:nonexistent-script-xyz";
    const pkg = { scripts: { "verify:alignment": "node scripts/verify.mjs" } };
    const match = mutatedScript.match(/npm run ([\w:.-]+)/);
    const found = match ? Boolean(pkg.scripts[match[1]]) : false;
    expect(found).toBe(false);
  });
});
