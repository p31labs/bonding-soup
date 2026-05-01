/**
 * Pure builder for `p31.launchLane/0.1.0` (no filesystem).
 * `updated` is derived from PRS policy dates only for stable `npm run verify:launch-lane-sync`.
 */

/**
 * @param {any} prs
 * @param {any} fleet
 */
export function buildLaunchLaneDocument(prs, fleet) {
  if (!prs.launchGovernance) {
    throw new Error("buildLaunchLane: missing launchGovernance on PRS JSON");
  }
  const dims = prs.scoringSystem.dimensions.map((d) => d.id);
  const lg = prs.launchGovernance;
  const pagesIds = Array.isArray(lg.governedPagesIds) ? lg.governedPagesIds : [];

  function sum(score) {
    return dims.reduce((a, k) => a + score[k], 0);
  }

  const wv = Array.isArray(fleet.workersVerified) ? fleet.workersVerified : [];
  const fleetById = Object.fromEntries(wv.map((w) => [w.id, w]));

  /** @type {Record<string, any>[]} */
  const entries = [];

  for (const it of prs.items) {
    if (it.kind === "worker" || (it.kind === "pages" && pagesIds.includes(it.id))) {
      const total = sum(it.score);
      const tier = total >= lg.minGovernedScore ? "governed-ok" : "governed-short";
      let tierPrsUi = "P4";
      if (total >= 85) tierPrsUi = "P0";
      else if (total >= 70) tierPrsUi = "P1";
      else if (total >= 50) tierPrsUi = "P2";
      else if (total >= 25) tierPrsUi = "P3";
      /** @type {Record<string, any>} */
      const row = {
        id: it.id,
        kind: it.kind,
        label: it.label,
        prsTotal: total,
        tier,
        tierPrsUi,
        score: it.score,
      };
      if (it.kind === "worker") {
        const f = fleetById[it.id];
        if (f) {
          row.fleet = {
            workersDev: f.workersDev ?? null,
            healthPaths: f.healthPaths ?? null,
            customDomain: f.customDomain ?? null,
            deploy: f.deploy ?? null,
          };
        }
      }
      entries.push(row);
    }
  }

  const dateStamp =
    typeof lg.updated === "string" && lg.updated.trim()
      ? lg.updated.trim()
      : typeof prs.updated === "string" && prs.updated.trim()
        ? prs.updated.trim()
        : new Date().toISOString().slice(0, 10);

  return {
    schema: "p31.launchLane/0.1.0",
    updated: `${dateStamp}T12:00:00.000Z`,
    governance: {
      minGovernedScore: lg.minGovernedScore,
      minGovernedFloorPerDimension: lg.minGovernedFloorPerDimension,
      governedPagesIds: pagesIds,
    },
    sites: fleet.sites ?? null,
    governed: entries.sort((a, b) => a.id.localeCompare(b.id)),
  };
}
