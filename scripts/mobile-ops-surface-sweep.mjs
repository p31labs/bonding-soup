#!/usr/bin/env node
/**
 * CWP mobile ops — Phase 2: production surface sweep (viewport + P31 shell hints in HTML).
 * Does not run Playwright; use for quick regression after deploy.
 */
const urls = [
  "https://p31ca.org/",
  "https://p31ca.org/dome/",
  "https://p31ca.org/connect",
  "https://p31ca.org/ops/",
  "https://p31ca.org/education/",
  "https://p31ca.org/delta-hiring/",
  "https://p31ca.org/k4market.html",
  "https://bonding.p31ca.org/",
];

async function fetchText(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(url, { redirect: "follow", signal: c.signal, headers: { "user-agent": "P31-mobile-ops-sweep/1" } });
    const text = await r.text();
    return { status: r.status, text };
  } finally {
    clearTimeout(t);
  }
}

function main() {
  console.log("P31 mobile ops — Phase 2 production sweep\n");
  console.log(
    "URL".padEnd(50) + "HTTP  viewport  shell/responsive\n" + "─".repeat(78),
  );
  (async () => {
    for (const url of urls) {
      try {
        const { status, text } = await fetchText(url);
        const lower = text.toLowerCase();
        const v = /viewport|width=device-width/i.test(text) ? "y" : "n";
        const s =
          /p31-responsive|p31-shell|p31-style|p31--mesh|p31ca|p31 delta|tailwindcss|cdn\.tailwindcss|id="app"/i.test(
            text,
          ) || lower.includes("astro")
            ? "y"
            : "n";
        const st = String(status);
        console.log(url.padEnd(50) + st.padStart(3) + "   " + v + "         " + s);
      } catch (e) {
        const m = e && /** @type {{ message?: string }} */ (e).message;
        console.log(url.padEnd(50) + "ERR" + "   " + (m || String(e)).slice(0, 32));
      }
    }
    console.log("\nviewport: y = likely mobile-friendly; shell: y = P31 tokens or static hub markers.");
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

main();
