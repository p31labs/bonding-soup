/**
 * @fileoverview Validates the operator-console `#cc-boot` JSON shape.
 * Keeps server output and browser parser aligned; every section action id must exist in ACTION_META.
 */

/**
 * @param {unknown} b
 * @throws {Error} with a stable message prefix `boot:` for grepping CI logs
 */
export function assertBootShape(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) {
    throw new Error("boot: root must be a non-array object");
  }
  const o = /** @type {Record<string, unknown>} */ (b);

  if (o.VERSION != null && typeof o.VERSION !== "string") {
    throw new Error("boot: VERSION must be a string if present");
  }
  if (
    o.ESSENTIAL_IDS != null &&
    (!Array.isArray(o.ESSENTIAL_IDS) || !o.ESSENTIAL_IDS.every((x) => typeof x === "string"))
  ) {
    throw new Error("boot: ESSENTIAL_IDS must be an array of strings if present");
  }

  if (!o.ACTION_META || typeof o.ACTION_META !== "object" || Array.isArray(o.ACTION_META)) {
    throw new Error("boot: ACTION_META must be a non-array object");
  }
  if (!Array.isArray(o.SECTIONS)) {
    throw new Error("boot: SECTIONS must be an array");
  }

  const meta = /** @type {Record<string, unknown>} */ (o.ACTION_META);

  for (const [id, m] of Object.entries(meta)) {
    if (!id || typeof id !== "string") {
      throw new Error("boot: ACTION_META keys must be non-empty strings");
    }
    if (!m || typeof m !== "object" || Array.isArray(m)) {
      throw new Error(`boot: ACTION_META[${id}] must be an object`);
    }
    const me = /** @type {Record<string, unknown>} */ (m);
    if (typeof me.title !== "string") {
      throw new Error(`boot: ACTION_META[${id}].title must be a string`);
    }
    if (typeof me.slow !== "boolean") {
      throw new Error(`boot: ACTION_META[${id}].slow must be boolean`);
    }
    if (typeof me.network !== "boolean") {
      throw new Error(`boot: ACTION_META[${id}].network must be boolean`);
    }
    if (typeof me.hitl !== "boolean") {
      throw new Error(`boot: ACTION_META[${id}].hitl must be boolean`);
    }
    if (me.confirm != null && typeof me.confirm !== "string") {
      throw new Error(`boot: ACTION_META[${id}].confirm must be null or string`);
    }
    if (typeof me.protocol !== "string") {
      throw new Error(`boot: ACTION_META[${id}].protocol must be a string`);
    }
  }

  if (o.ESSENTIAL_IDS) {
    const ess = /** @type {unknown[]} */ (o.ESSENTIAL_IDS);
    for (const eid of ess) {
      if (typeof eid === "string" && !(eid in meta)) {
        throw new Error(`boot: ESSENTIAL_IDS references unknown action id "${eid}"`);
      }
    }
  }

  for (let i = 0; i < o.SECTIONS.length; i++) {
    const sec = o.SECTIONS[i];
    if (!sec || typeof sec !== "object" || Array.isArray(sec)) {
      throw new Error(`boot: SECTIONS[${i}] must be an object`);
    }
    const s = /** @type {Record<string, unknown>} */ (sec);
    if (typeof s.title !== "string") {
      throw new Error(`boot: SECTIONS[${i}].title must be a string`);
    }
    if (!Array.isArray(s.ids)) {
      throw new Error(`boot: SECTIONS[${i}].ids must be an array`);
    }
    for (const aid of s.ids) {
      if (typeof aid !== "string") {
        throw new Error(`boot: SECTIONS[${i}].ids must contain only strings`);
      }
      if (!(aid in meta)) {
        throw new Error(`boot: SECTIONS[${i}] references unknown action id "${aid}"`);
      }
    }
    if (s.links != null) {
      if (!Array.isArray(s.links)) {
        throw new Error(`boot: SECTIONS[${i}].links must be an array or omitted`);
      }
      for (let j = 0; j < s.links.length; j++) {
        const L = s.links[j];
        if (!L || typeof L !== "object" || Array.isArray(L)) {
          throw new Error(`boot: SECTIONS[${i}].links[${j}] must be an object`);
        }
        const l = /** @type {Record<string, unknown>} */ (L);
        if (typeof l.href !== "string" || typeof l.label !== "string") {
          throw new Error(`boot: SECTIONS[${i}].links[${j}] needs string href and label`);
        }
      }
    }
  }
}
