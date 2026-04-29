/**
 * Command-center ambient starfield + pulse hook for completed actions.
 */
(async () => {
  const canvas = document.getElementById("cc-starfield");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  try {
    const mod = await import("/assets/p31-starfield.js");
    const { config, hints } = await mod.resolveStarfieldConfig();
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
