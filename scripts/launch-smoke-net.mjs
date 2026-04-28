#!/usr/bin/env node
/**
 * Post-deploy smoke: GET public launch endpoints (MAP hub, donate-api health, creator-economy JSON).
 * Run after Cloudflare Pages + Workers deploy. Requires outbound HTTPS.
 *
 * Skip: P31_LAUNCH_SMOKE_SKIP=1
 * Strict (default): non-2xx → exit 1
 */
import { setTimeout as delay } from "node:timers/promises";

const SKIP = process.env.P31_LAUNCH_SMOKE_SKIP === "1";

const TARGETS = [
  {
    name: "hub MAP /donate",
    url: "https://p31ca.org/donate",
    ok: (r) => r.status >= 200 && r.status < 400,
  },
  {
    name: "donate-api health",
    url: "https://donate-api.phosphorus31.org/health",
    ok: (r) => r.status === 200,
  },
  {
    name: "creator-economy.json",
    url: "https://p31ca.org/creator-economy.json",
    ok: (r) => r.status === 200,
  },
];

async function one(target) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const r = await fetch(target.url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { Accept: "*/*" },
    });
    clearTimeout(t);
    if (!target.ok(r)) {
      console.error(`[launch-smoke-net] FAIL ${target.name} ${r.status} ${target.url}`);
      return false;
    }
    console.log(`[launch-smoke-net] OK   ${target.name} ${r.status}`);
    return true;
  } catch (e) {
    clearTimeout(t);
    console.error(
      `[launch-smoke-net] FAIL ${target.name} ${target.url}`,
      e && e.message ? e.message : e
    );
    return false;
  }
}

async function main() {
  if (SKIP) {
    console.log("launch-smoke-net: skipped (P31_LAUNCH_SMOKE_SKIP=1)");
    process.exit(0);
  }
  console.log("launch-smoke-net: probing public endpoints…");
  let ok = true;
  for (const t of TARGETS) {
    if (!(await one(t))) ok = false;
    await delay(120);
  }
  if (!ok) {
    console.error("launch-smoke-net: FAILED — fix deploy or network, then re-run.");
    process.exit(1);
  }
  console.log("launch-smoke-net: all probes passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
