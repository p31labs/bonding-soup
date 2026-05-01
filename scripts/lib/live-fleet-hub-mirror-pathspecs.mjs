/**
 * Git pathspecs under Andromeda for artifacts driven by home `p31-live-fleet.json`.
 * Used by verify-live-fleet-p31ca-mirror.mjs (must be clean after sync + build:fleet-entities).
 */
export const LIVE_FLEET_HUB_MIRROR_GIT_PATHSPECS = [
  "04_SOFTWARE/p31ca/public/p31-live-fleet.json",
  "04_SOFTWARE/p31ca/public/p31-fleet-entities.json",
  "04_SOFTWARE/p31ca/public/agent/",
];
