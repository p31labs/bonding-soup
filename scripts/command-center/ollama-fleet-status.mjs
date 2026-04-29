#!/usr/bin/env node
/**
 * Local Ollama fleet status for command center output.
 */

const host = String(process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').trim().replace(/\/$/, '');

async function tryJson(path) {
  const r = await fetch(host + path, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
  return await r.json();
}

function pickLoaded(ps) {
  if (!ps || typeof ps !== 'object') return null;
  const models = Array.isArray(ps.models) ? ps.models : [];
  if (models.length === 0) return null;
  const m = models[0];
  return m && typeof m === 'object' ? m : null;
}

try {
  const tags = await tryJson('/api/tags');
  const ps = await tryJson('/api/ps').catch(() => null);
  const models = Array.isArray(tags.models) ? tags.models : [];
  const p31 = models.filter((m) => m && typeof m.name === 'string' && m.name.startsWith('p31-'));
  const loaded = pickLoaded(ps);
  const out = {
    ok: true,
    host,
    models_total: models.length,
    models_p31: p31.length,
    loaded_model: loaded ? loaded.name : null,
  };
  console.log(JSON.stringify(out, null, 2));
} catch (e) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        host,
        error: String(e && e.message ? e.message : e),
        hint: 'Is ollama running? (curl http://127.0.0.1:11434/api/tags)',
      },
      null,
      2
    )
  );
  process.exit(2);
}

