/**
 * Command center — static star plate (same night sky, breaker-panel / precision mode).
 * @see docs/P31-UNIVERSAL-UI-VISION.md + design-assets/atmosphere/p31-atmosphere-client.js
 */
(async () => {
  const canvas = document.getElementById("cc-starfield");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  try {
    const atm = await import("/assets/atmosphere/p31-atmosphere-client.js");
    const resolved = await atm.resolveAtmosphere("command-center");
    if (atm.starfieldMountMode(resolved) === "none") {
      canvas.style.opacity = "0";
      window.__p31StarfieldPulse = function () {};
      return;
    }
    const mod = await import("/assets/p31-starfield-static-plate.js");
    const preset = resolved ? atm.staticPlatePreset(resolved) : "commandCenter";
    mod.initStaticStarPlate(canvas, { preset });
  } catch {
    try {
      const mod = await import("/assets/p31-starfield-static-plate.js");
      mod.initStaticStarPlate(canvas, { preset: "commandCenter" });
    } catch {
      /* Gray Rock */
    }
  }
  window.__p31StarfieldPulse = function () {
    /* static plate: no-op pulse (commit feedback stays in UI) */
  };
})();
