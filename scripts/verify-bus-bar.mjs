#!/usr/bin/env node
/**
 * verify-bus-bar.mjs — structural integrity of the bus bar block in
 * andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json.
 *
 * Doctrine: the bus bar is the spine of the whole site. It declares
 * the 11 slots, the 3 roles (stranger / user / operator), and the
 * product → slot map that confines the 9-MVP cage. If any of the
 * three internal pointers go stale (a slot ID disappears, a role
 * lists a missing slot, a product points at a slot that no longer
 * exists), the BUS2 nav-by-role component will silently drop links
 * and the cage constraint will silently expand. This verifier
 * catches that at CI time.
 *
 * Three structural rules enforced:
 *   1. productSlots: every KEY must exist in registryAppUrlInvariants
 *      OR be in the documented subdomain-only allowlist (currently
 *      just 'bonding', which lives at bonding.p31ca.org).
 *   2. productSlots: every VALUE must be a key in slots.
 *   3. navByRole: every entry in every role list must be a key in slots.
 *
 * Plus three cage-doctrine rules:
 *   4. busBar.constraints.maxProducts must equal 9 (the calcium cage
 *      around PHOS — see PHOS-VOICE-DRAFT.md §3.3).
 *   5. navByRole.stranger ⊂ navByRole.user ⊂ navByRole.operator
 *      (each higher role is a strict superset of lower roles' slot
 *      visibility — no role can have a slot the next-up role lacks).
 *   6. slots[*].phosVoiceKey, when present, must reference a key
 *      that exists in p31-phos-voice.json (no orphan voice routes
 *      in nav).
 *
 * Partial-clone-friendly: exits 0 with a skip note when the andromeda
 * tree is missing (home-only checkout). Strict mode (P31_VERIFY_BUS_BAR_STRICT=1)
 * fails instead of skipping — used by CI.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const GROUND_TRUTH = path.join(
  ROOT,
  "andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json",
);
const PHOS_VOICE = path.join(
  ROOT,
  "andromeda/04_SOFTWARE/p31ca/public/lib/p31-phos-voice.json",
);
const HUB_APP_IDS = path.join(
  ROOT,
  "andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs",
);

const SUBDOMAIN_ONLY_ALLOWLIST = new Set([
  "bonding", // bonding.p31ca.org — separate origin, intentional
]);

const REQUIRED_CAGE_PRODUCT_COUNT = 9;

/**
 * Mirror the path-normalization used by p31-phos-guide.mjs voiceForPage()
 * so verifier-time matching reflects runtime-time matching:
 *   1. strip trailing slash
 *   2. strip .html suffix
 * Lookup hits if EITHER normalized form is a key in the voice file.
 */
function normalizeVoiceKeys(rawKey) {
  const stripped = rawKey.replace(/\/+$/, "") || "/";
  const noHtml = stripped.replace(/\.html$/, "");
  return [rawKey, stripped, noHtml];
}

async function loadHubProductIds() {
  if (!fs.existsSync(HUB_APP_IDS)) return null;
  try {
    const mod = await import(`file://${HUB_APP_IDS}`);
    const order = mod.HUB_COCKPIT_ORDER || [];
    const all = mod.HUB_ALL_CARD_ORDER || [];
    return new Set([...order, ...all]);
  } catch {
    return null;
  }
}

function skip(reason) {
  console.log(`verify-bus-bar: skip — ${reason}`);
  process.exit(0);
}

function fail(errors) {
  console.error("verify-bus-bar: FAIL");
  for (const e of errors) console.error("  - " + e);
  console.error(`verify-bus-bar: ${errors.length} structural error(s)`);
  process.exit(1);
}

async function main() {
  const strict = process.env.P31_VERIFY_BUS_BAR_STRICT === "1";

  if (!fs.existsSync(GROUND_TRUTH)) {
    if (strict) {
      console.error("verify-bus-bar: FAIL — ground-truth missing in strict mode");
      console.error(`  expected: ${GROUND_TRUTH}`);
      process.exit(1);
    }
    skip("andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json missing (partial clone)");
  }

  const gt = JSON.parse(fs.readFileSync(GROUND_TRUTH, "utf8"));
  const errors = [];

  if (!gt.busBar || typeof gt.busBar !== "object") {
    fail(["busBar block missing from ground-truth"]);
  }
  const { busBar } = gt;
  const slots = busBar.slots || {};
  const productSlots = busBar.productSlots || {};
  const navByRole = busBar.navByRole || {};
  const registryIds = new Set(
    (gt.registryAppUrlInvariants || []).map((e) => e.id),
  );
  const hubProductIds = await loadHubProductIds();
  // Use the broader hub registry when available; fall back to the
  // ground-truth invariant subset when partial-clone hides the hub scripts.
  const validProductIds = hubProductIds || registryIds;
  const productSource = hubProductIds
    ? "hub-app-ids.mjs (HUB_COCKPIT_ORDER ∪ HUB_ALL_CARD_ORDER)"
    : "ground-truth registryAppUrlInvariants";
  const slotKeys = new Set(Object.keys(slots));

  // Rule 1: every productSlots KEY exists in the hub product registry
  // OR is subdomain-only allowlisted
  for (const productId of Object.keys(productSlots)) {
    if (productId.startsWith("_")) continue;
    if (validProductIds.has(productId)) continue;
    if (SUBDOMAIN_ONLY_ALLOWLIST.has(productId)) continue;
    errors.push(
      `productSlots["${productId}"]: not in ${productSource} and not in subdomain-only allowlist`,
    );
  }

  // Rule 2: every productSlots VALUE is a key in slots
  for (const [productId, slotId] of Object.entries(productSlots)) {
    if (productId.startsWith("_")) continue;
    if (!slotKeys.has(slotId)) {
      errors.push(
        `productSlots["${productId}"] → "${slotId}": slot does not exist in busBar.slots`,
      );
    }
  }

  // Rule 3: every navByRole entry is a key in slots
  for (const [role, slotIds] of Object.entries(navByRole)) {
    if (role.startsWith("_")) continue;
    if (!Array.isArray(slotIds)) continue;
    for (const slotId of slotIds) {
      if (!slotKeys.has(slotId)) {
        errors.push(
          `navByRole.${role}: "${slotId}" does not exist in busBar.slots`,
        );
      }
    }
  }

  // Rule 4: cage constraint (9 products, the calcium cage around PHOS)
  if (busBar.constraints && typeof busBar.constraints.maxProducts === "number") {
    if (busBar.constraints.maxProducts !== REQUIRED_CAGE_PRODUCT_COUNT) {
      errors.push(
        `busBar.constraints.maxProducts = ${busBar.constraints.maxProducts}; expected ${REQUIRED_CAGE_PRODUCT_COUNT} (cage doctrine, PHOS-VOICE-DRAFT.md §3.3)`,
      );
    }
  }

  // Rule 5: role visibility is strictly nested (stranger ⊂ user ⊂ operator)
  const stranger = new Set(navByRole.stranger || []);
  const user = new Set(navByRole.user || []);
  const operator = new Set(navByRole.operator || []);
  for (const s of stranger) {
    if (!user.has(s)) {
      errors.push(
        `navByRole.stranger contains "${s}" but navByRole.user does not — role visibility must be nested`,
      );
    }
  }
  for (const s of user) {
    if (!operator.has(s)) {
      errors.push(
        `navByRole.user contains "${s}" but navByRole.operator does not — role visibility must be nested`,
      );
    }
  }

  // Rule 6: phosVoiceKey references must hit a real voice key
  // (after the same normalization the runtime PHOS guide does — strip
  // trailing slash, strip .html — so /passport/ ≡ /passport ≡ /passport.html).
  if (fs.existsSync(PHOS_VOICE)) {
    const voice = JSON.parse(fs.readFileSync(PHOS_VOICE, "utf8"));
    const voiceKeys = new Set(
      Object.keys(voice.routes || voice).filter((k) => !k.startsWith("_")),
    );
    for (const [slotId, slot] of Object.entries(slots)) {
      if (!slot || !slot.phosVoiceKey) continue;
      const candidates = normalizeVoiceKeys(slot.phosVoiceKey);
      const hit = candidates.some((c) => voiceKeys.has(c));
      if (!hit) {
        errors.push(
          `slots.${slotId}.phosVoiceKey = "${slot.phosVoiceKey}": no matching key in p31-phos-voice.json (tried ${candidates.map((c) => `"${c}"`).join(", ")})`,
        );
      }
    }
  }

  if (errors.length > 0) fail(errors);

  const slotCount = slotKeys.size;
  const productCount = Object.keys(productSlots).filter(
    (k) => !k.startsWith("_"),
  ).length;
  const roleCount = Object.keys(navByRole).filter(
    (k) => !k.startsWith("_"),
  ).length;

  console.log(
    `verify-bus-bar: OK — ${slotCount} slots, ${productCount} product mappings, ${roleCount} roles (stranger=${stranger.size}, user=${user.size}, operator=${operator.size}); cage constraint = ${REQUIRED_CAGE_PRODUCT_COUNT} products`,
  );
}

main().catch((e) => {
  console.error("verify-bus-bar: FAIL — unhandled error");
  console.error(e);
  process.exit(1);
});
