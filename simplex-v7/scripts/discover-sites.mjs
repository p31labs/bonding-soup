#!/usr/bin/env node
/** Layer 1 discovery: HEAD/fetch canonical prod URLs — no deploy side effects */
const SITE_URLS = [
  ['p31ca hub', 'https://p31ca.org'],
  ['phosphorus31', 'https://phosphorus31.org'],
  ['BONDING', 'https://bonding.p31ca.org'],
  ['api phosphorus31', 'https://api.phosphorus31.org'],
];

const TIMEOUT_MS = 15_000;

async function probe([label, url]) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return { label, url, ok: res.ok || (res.status >= 300 && res.status < 400), status: res.status };
  } catch (e) {
    clearTimeout(t);
    return { label, url, ok: false, status: null, error: String(e) };
  }
}

const rows = await Promise.all(SITE_URLS.map(probe));

for (const r of rows) {
  console.log(`${r.ok ? 'OK ' : 'ERR'} ${r.status ?? '—'} ${r.label} ${r.url}${r.error ? ` (${r.error})` : ''}`);
}

const failed = rows.filter((r) => !r.ok);
// Layer 1: any live surface missing is a signal; do not fail CI if only edge API is blocked (DNS/tls/sandbox).
process.exitCode = failed.length === SITE_URLS.length ? 1 : 0;
