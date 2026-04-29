#!/usr/bin/env node
/**
 * Local helper for the command center.
 * Calls SIMPLEX v7 Worker endpoints with operator auth and prints JSON.
 */

const origin = String(process.env.P31_SIMPLEX_ORIGIN || '').trim().replace(/\/$/, '');
const token = String(process.env.P31_SIMPLEX_OPERATOR_TOKEN || process.env.P31_SIMPLEX_OPERATOR_SECRET || '').trim();

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

if (!origin) die('Missing P31_SIMPLEX_ORIGIN (e.g. https://api.phosphorus31.org)');
if (!token) die('Missing P31_SIMPLEX_OPERATOR_TOKEN (must match Worker OPERATOR_SECRET)');

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd) die('Usage: simplex-cli <health|state|agent|breaker|estop|telemetry> ...');

function headers() {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function fetchJson(path, init) {
  const r = await fetch(origin + path, init);
  const text = await r.text();
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    die(`Upstream non-JSON (${r.status}): ${text.slice(0, 400)}`);
  }
  if (!r.ok) {
    console.error(JSON.stringify(j, null, 2));
    process.exit(2);
  }
  return j;
}

if (cmd === 'health') {
  const j = await fetchJson('/api/health', { method: 'GET', headers: { Accept: 'application/json' } });
  console.log(JSON.stringify(j, null, 2));
  process.exit(0);
}

if (cmd === 'state') {
  const j = await fetchJson('/api/state', { method: 'GET', headers: { Accept: 'application/json' } });
  console.log(JSON.stringify(j, null, 2));
  process.exit(0);
}

if (cmd === 'agent') {
  const id = String(rest[0] || '').trim().toUpperCase();
  if (!id) die('Usage: simplex-cli agent <STEWARD|ORACLE|...>');
  const j = await fetchJson(`/api/agent/${encodeURIComponent(id)}`, { method: 'POST', headers: headers() });
  console.log(JSON.stringify(j, null, 2));
  process.exit(0);
}

if (cmd === 'breaker') {
  const target = String(rest[0] || '').trim();
  const state = String(rest[1] || '').trim();
  if (!target || !state) die('Usage: simplex-cli breaker <agents|email|sentinel|medic|herald|forge|safe_mode> <on|off>');
  const j = await fetchJson('/api/admin/breaker', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ target, state }),
  });
  console.log(JSON.stringify(j, null, 2));
  process.exit(0);
}

if (cmd === 'estop') {
  const j = await fetchJson('/api/admin/estop', { method: 'POST', headers: headers(), body: JSON.stringify({}) });
  console.log(JSON.stringify(j, null, 2));
  process.exit(0);
}

if (cmd === 'breakers') {
  const j = await fetchJson('/api/admin/breakers', { method: 'GET', headers: headers() });
  console.log(JSON.stringify(j, null, 2));
  process.exit(0);
}

if (cmd === 'telemetry') {
  const kind = String(rest[0] || '').trim();
  if (kind === 'tomograph') {
    const limit = rest[1] ? Number(rest[1]) : undefined;
    const qs = limit ? `?limit=${encodeURIComponent(String(limit))}` : '';
    const j = await fetchJson(`/api/telemetry/tomograph${qs}`, { method: 'GET', headers: headers() });
    console.log(JSON.stringify(j, null, 2));
    process.exit(0);
  }
  if (kind === 'spoons') {
    const hours = rest[1] ? Number(rest[1]) : undefined;
    const qs = hours ? `?hours=${encodeURIComponent(String(hours))}` : '';
    const j = await fetchJson(`/api/telemetry/spoons${qs}`, { method: 'GET', headers: headers() });
    console.log(JSON.stringify(j, null, 2));
    process.exit(0);
  }
  if (kind === 'accommodation') {
    const days = rest[1] ? Number(rest[1]) : undefined;
    const qs = days ? `?days=${encodeURIComponent(String(days))}` : '';
    const j = await fetchJson(`/api/telemetry/accommodation${qs}`, { method: 'GET', headers: headers() });
    console.log(JSON.stringify(j, null, 2));
    process.exit(0);
  }
  die('Usage: simplex-cli telemetry <tomograph|spoons|accommodation> [n]');
}

die(`Unknown command: ${cmd}`);

