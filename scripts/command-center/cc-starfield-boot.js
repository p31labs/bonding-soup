/**
 * Command-center ambient starfield + pulse hook for completed actions.
 */
(async () => {
  const canvas = document.getElementById("cc-starfield");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  try {
    const mod = await import("/assets/p31-starfield.js");
    /** Same-origin proxy → Worker `GET /api/state` (incl. public remembrance slice) when `P31_SIMPLEX_ORIGIN` is set; else Gray Rock defaults. */
    const stateUrl =
      typeof location !== "undefined" && location.origin
        ? `${location.origin}/api/simplex-state`
        : undefined;
    const { config, hints } = await mod.resolveStarfieldConfig(stateUrl);
    const api = mod.initStarfield(canvas, config, {
      surface: "command-center",
      touchRipple: true,
      pulsePollUrl: `${location.origin}/api/mesh-pulse`,
    });
    api.ingestTouchHints(hints);
    window.__p31StarfieldPulse = () => api.pulseCommit();
  } catch {
    /* Gray Rock */
  }
})();
