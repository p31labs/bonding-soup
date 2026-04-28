/** Shared ANSI-safe ASCII blocks (splash + boot-payload). Single source for wordmark geometry. */

/** Wire body only (apex ⬡ colored separately in boot). */
export const TETRA_WIRE = [
  "     /|\\",
  "    / | \\",
  "   /__|__\\",
  "  /\\  |  /\\",
  " /__\\_|_/__\\",
].join("\n");

/** Apex + wire — for splash (no per-line ANSI) */
export const TETRA_LINES = ["      ⬡", TETRA_WIRE].join("\n");

/** Branded ##### wordmark — same bytes in splash + boot */
export const P31_HASH_WORDMARK = [
  "#####   #####      ##",
  "#   #       #       #",
  "#####   #####       #",
  "#           #       #",
  "#       #####   #####",
].join("\n");
