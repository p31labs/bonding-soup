/**
 * P31 CLI ASCII — no figlet subprocess; renders everywhere UTF-8 is OK.
 * Wide / compact / mini chosen from terminal width in splash.mjs + boot.mjs.
 */

/** Full-width signature block (~76 cols): mesh frame + phosphor typography */
export const BANNER_HERO = `
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ▓▓░  ██████╗ ██╗ ██████╗     ██████╗ ██╗ ██████╗        ░▓▓
    ▓▓░  ██╔══██╗██║██╔═══██╗    ██╔══██╗██║██╔════╝        ░▓▓
    ▓▓░  ██████╔╝██║██║   ██║    ██████╔╝██║██║             ░▓▓
    ▓▓░  ██╔═══╝ ██║██║   ██║    ██╔═══╝ ██║██║             ░▓▓
    ▓▓░  ██║     ██║╚██████╔╝ ██╗██║     ██║╚██████╗        ░▓▓
    ▓▓░  ╚═╝     ╚═╝ ╚═════╝  ╚═╝╚═╝     ╚═╝ ╚═════╝        ░▓▓
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`.trim();

/** Mid terminal (~56–75 cols): lean block + rule */
export const BANNER_COMPACT = `
    ██████╗ ██████╗     ██╗
    ██╔══██╗██╔══██╗   ███║
    ██████╔╝██████╔╝   ╚██║
    ██╔═══╝ ██╔══██╗    ██║
    ██║     ██║  ██╗    ██║
    ╚═╝     ╚═╝  ╚═╝    ╚═╝
    ─────────────────────────`.trim();

/** Very narrow terminals */
export const BANNER_MINI = [
  "",
  "  ■ P31 ■  local mesh control plane",
  "  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─",
].join("\n");

export const TAGLINE = "local mesh · build · connect";

/** Edge operator line (optional second line under tagline) */
export const SUBHEAD = "andromeda node · K₄ edges · zero-budget edge";
