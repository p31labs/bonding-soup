const cv = document.getElementById("od-star-plate");
if (cv instanceof HTMLCanvasElement) {
  void (async () => {
    try {
      const atm = await import("/assets/atmosphere/p31-atmosphere-client.js");
      const resolved = await atm.resolveAtmosphere("operator-desk");
      if (atm.starfieldMountMode(resolved) === "none") {
        cv.style.opacity = "0";
        return;
      }
      const mod = await import("/assets/p31-starfield-static-plate.js");
      const preset = resolved ? atm.staticPlatePreset(resolved) : "operatorDesk";
      mod.initStaticStarPlate(cv, { preset });
    } catch {
      try {
        const mod = await import("/assets/p31-starfield-static-plate.js");
        mod.initStaticStarPlate(cv, { preset: "operatorDesk" });
      } catch {
        /* Gray Rock */
      }
    }
  })();
}
