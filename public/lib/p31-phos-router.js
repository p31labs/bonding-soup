/**
 * p31-phos-router.js — PHOS Navigation Router (Phase 1: Text + Chips)
 * Schema: p31.phosRouter/1.0.0
 *
 * Static, local, zero-API. Fuzzy text search against intent catalog + decision tree chips.
 * Route confirmation always shown before navigation.
 *
 * Usage: <script src="/public/lib/p31-phos-router.js"></script>
 * Injects the router UI into the page on DOMContentLoaded.
 */

(function () {
  'use strict';

  const CATALOG_PATH = '/public/data/phos-intent-catalog.json';
  const COLLAPSE_DELAY = 5000;
  const FUSE_THRESHOLD = 0.45;

  // Decision tree — Level 0 chips → Level 1 chips → terminal surface
  const DECISION_TREE = [
    {
      id: 'myself', label: 'For myself', icon: '🧬',
      children: [
        { id: 'tools', label: 'Tools', icon: '⚙️', surfaces: ['passport', 'vibe', 'ops', 'geodesic'] },
        { id: 'docs', label: 'Research / docs', icon: '📚', surfaces: ['doc-library', 'delta-language', 'psych-e2e', 'physics-learn'] },
        { id: 'status', label: 'System status', icon: '🔬', surfaces: ['glass-box', 'fleet-portal', 'observatory', 'launch'] }
      ]
    },
    {
      id: 'family', label: 'For my family', icon: '🌱',
      children: [
        { id: 'kids', label: 'Kids\' space', icon: '🌱', surfaces: ['garden', 'geodesic'] },
        { id: 'hub', label: 'Family hub', icon: '⚛️', surfaces: ['soup', 'buffer', 'cortex'] }
      ]
    },
    {
      id: 'building', label: 'Building something', icon: '🔧',
      children: [
        { id: 'task', label: 'New task / WCD', icon: '🔧', surfaces: ['build', 'vibe', 'ops'] },
        { id: 'agents', label: 'Agent fleet', icon: '🧬', surfaces: ['cortex', 'fleet-portal', 'observatory'] }
      ]
    },
    {
      id: 'looking', label: 'Just looking', icon: '👋',
      surfaces: ['soup', 'welcome', 'doc-library', 'glass-box']
    }
  ];

  let catalog = [];
  let fuseInstance = null;
  let collapseTimer = null;
  let container = null;

  // ─── Minimal fuzzy search (no deps) ─────────────────────────────────────
  function fuzzyScore(needle, haystack) {
    needle = needle.toLowerCase();
    haystack = haystack.toLowerCase();
    if (haystack.includes(needle)) return 1;
    let score = 0, ni = 0;
    for (let hi = 0; hi < haystack.length && ni < needle.length; hi++) {
      if (haystack[hi] === needle[ni]) { score++; ni++; }
    }
    return ni === needle.length ? score / haystack.length : 0;
  }

  function search(query) {
    if (!query || query.length < 2) return [];
    const results = [];
    for (const intent of catalog) {
      let best = 0;
      for (const phrase of intent.phrases) {
        const s = fuzzyScore(query, phrase);
        if (s > best) best = s;
      }
      const labelScore = fuzzyScore(query, intent.label);
      if (labelScore > best) best = labelScore;
      if (best > FUSE_THRESHOLD) results.push({ intent, score: best });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 3).map(r => r.intent);
  }

  // ─── UI ──────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('phos-router-styles')) return;
    const s = document.createElement('style');
    s.id = 'phos-router-styles';
    s.textContent = `
      .phos-router { position: fixed; bottom: 5rem; right: 2rem; z-index: 100; width: 320px; font-family: "JetBrains Mono", monospace; }
      .phos-router-toggle { width: 44px; height: 44px; border-radius: 50%; background: rgba(10,12,15,0.9); border: 1px solid rgba(93,202,165,0.3); color: var(--p31-teal, #5DCAA5); font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: auto; transition: all 0.2s; box-shadow: 0 0 16px rgba(93,202,165,0.2); }
      .phos-router-toggle:hover { border-color: rgba(93,202,165,0.6); box-shadow: 0 0 24px rgba(93,202,165,0.4); }
      .phos-router-panel { background: rgba(15,17,21,0.97); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; margin-top: 0.5rem; display: none; box-shadow: 0 16px 48px rgba(0,0,0,0.6); }
      .phos-router-panel.open { display: block; }
      .phos-router-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.6rem 0.75rem; color: var(--p31-cloud, #d8d6d0); font-family: inherit; font-size: 0.8rem; outline: none; margin-bottom: 0.75rem; box-sizing: border-box; }
      .phos-router-input:focus { border-color: var(--p31-teal, #5DCAA5); }
      .phos-router-input::placeholder { color: var(--p31-muted, #6b7280); }
      .phos-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
      .phos-chip { padding: 0.35rem 0.7rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; background: rgba(255,255,255,0.04); color: var(--p31-cloud, #d8d6d0); font-size: 0.72rem; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
      .phos-chip:hover, .phos-chip:focus { border-color: var(--p31-teal, #5DCAA5); color: var(--p31-teal, #5DCAA5); background: rgba(93,202,165,0.08); outline: none; }
      .phos-chip.active { border-color: var(--p31-teal, #5DCAA5); color: var(--p31-teal, #5DCAA5); background: rgba(93,202,165,0.12); }
      .phos-confirm { background: rgba(93,202,165,0.08); border: 1px solid rgba(93,202,165,0.3); border-radius: 8px; padding: 0.75rem; margin-top: 0.5rem; font-size: 0.78rem; }
      .phos-confirm-label { color: var(--p31-muted, #6b7280); margin-bottom: 0.4rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; }
      .phos-confirm-name { color: var(--p31-teal, #5DCAA5); font-weight: 700; margin-bottom: 0.5rem; }
      .phos-confirm-btns { display: flex; gap: 0.5rem; }
      .phos-go { flex: 1; padding: 0.5rem; border: 1px solid rgba(93,202,165,0.5); border-radius: 6px; background: rgba(93,202,165,0.15); color: var(--p31-teal, #5DCAA5); font-family: inherit; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; }
      .phos-go:hover { background: rgba(93,202,165,0.25); }
      .phos-cancel { padding: 0.5rem 0.75rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; background: transparent; color: var(--p31-muted, #6b7280); font-family: inherit; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; }
      .phos-cancel:hover { color: var(--p31-cloud, #d8d6d0); }
      .phos-back { font-size: 0.7rem; color: var(--p31-muted, #6b7280); cursor: pointer; margin-bottom: 0.5rem; display: inline-block; }
      .phos-back:hover { color: var(--p31-cloud, #d8d6d0); }
      body.safe-mode .phos-router { transition: none !important; }
      body.safe-mode .phos-router * { transition: none !important; animation: none !important; }
      @media (max-width: 480px) { .phos-router { right: 1rem; width: calc(100vw - 2rem); } }
    `;
    document.head.appendChild(s);
  }

  function build() {
    container = document.createElement('div');
    container.className = 'phos-router';
    container.setAttribute('aria-label', 'P31 navigation assistant');
    container.innerHTML = `
      <button class="phos-router-toggle" id="phosRouterToggle" aria-label="Open navigation" aria-expanded="false">🔍</button>
      <div class="phos-router-panel" id="phosRouterPanel" role="search">
        <input class="phos-router-input" id="phosRouterInput" type="search"
               placeholder="Where do you want to go?" aria-label="Search destinations" autocomplete="off">
        <div class="phos-chips" id="phosRouterChips" role="list"></div>
        <div id="phosRouterConfirm" style="display:none"></div>
      </div>`;
    document.body.appendChild(container);

    document.getElementById('phosRouterToggle').addEventListener('click', togglePanel);
    document.getElementById('phosRouterInput').addEventListener('input', onInput);
    document.getElementById('phosRouterInput').addEventListener('keydown', onKeydown);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

    renderLevel0();
  }

  function togglePanel() {
    const panel = document.getElementById('phosRouterPanel');
    const btn = document.getElementById('phosRouterToggle');
    const isOpen = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      resetCollapse();
      document.getElementById('phosRouterInput').focus();
    }
  }

  function closePanel() {
    document.getElementById('phosRouterPanel').classList.remove('open');
    document.getElementById('phosRouterToggle').setAttribute('aria-expanded', 'false');
  }

  function resetCollapse() {
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(closePanel, COLLAPSE_DELAY);
  }

  // ─── Decision tree ────────────────────────────────────────────────────────
  function renderLevel0() {
    const chips = document.getElementById('phosRouterChips');
    chips.innerHTML = '';
    document.getElementById('phosRouterConfirm').style.display = 'none';

    // urgentMode: single chip to buffer
    if (document.body.dataset.p31Urgent === 'true') {
      renderConfirm(catalog.find(i => i.id === 'buffer') || { label: 'The Buffer', path: '/buffer.html', icon: '🛡️' });
      return;
    }

    DECISION_TREE.forEach(node => {
      const chip = makeChip(node.icon + ' ' + node.label, () => {
        if (node.surfaces) renderSurfaces(node.surfaces);
        else renderLevel1(node);
      });
      chips.appendChild(chip);
    });
  }

  function renderLevel1(node) {
    const chips = document.getElementById('phosRouterChips');
    chips.innerHTML = `<span class="phos-back" tabindex="0" role="button">← Back</span>`;
    chips.querySelector('.phos-back').addEventListener('click', renderLevel0);
    chips.querySelector('.phos-back').addEventListener('keydown', e => { if (e.key === 'Enter') renderLevel0(); });

    node.children.forEach(child => {
      const chip = makeChip(child.icon + ' ' + child.label, () => renderSurfaces(child.surfaces));
      chips.appendChild(chip);
    });
  }

  function renderSurfaces(ids) {
    const chips = document.getElementById('phosRouterChips');
    chips.innerHTML = `<span class="phos-back" tabindex="0" role="button">← Back</span>`;
    chips.querySelector('.phos-back').addEventListener('click', renderLevel0);
    chips.querySelector('.phos-back').addEventListener('keydown', e => { if (e.key === 'Enter') renderLevel0(); });

    ids.forEach(id => {
      const intent = catalog.find(i => i.id === id);
      if (!intent) return;
      const chip = makeChip(intent.icon + ' ' + intent.label, () => renderConfirm(intent));
      chips.appendChild(chip);
    });
  }

  function renderConfirm(intent) {
    const el = document.getElementById('phosRouterConfirm');
    el.style.display = 'block';
    el.innerHTML = `
      <div class="phos-confirm">
        <div class="phos-confirm-label">[RESOLVED]</div>
        <div class="phos-confirm-name">${intent.icon || ''} ${intent.label}</div>
        <div class="phos-confirm-btns">
          <button class="phos-go" id="phosGo">Go →</button>
          <button class="phos-cancel" id="phosCancel">Not this</button>
        </div>
      </div>`;
    document.getElementById('phosGo').addEventListener('click', () => { window.location.href = intent.path; });
    document.getElementById('phosCancel').addEventListener('click', () => {
      el.style.display = 'none';
      renderLevel0();
    });
    document.getElementById('phosGo').focus();
  }

  // ─── Text search ──────────────────────────────────────────────────────────
  function onInput(e) {
    resetCollapse();
    const q = e.target.value.trim();
    if (!q) { renderLevel0(); return; }
    const results = search(q);
    const chips = document.getElementById('phosRouterChips');
    chips.innerHTML = '';
    document.getElementById('phosRouterConfirm').style.display = 'none';
    if (!results.length) {
      chips.innerHTML = `<span style="color:var(--p31-muted,#6b7280);font-size:0.75rem">No match — try a chip below</span>`;
      return;
    }
    results.forEach(intent => {
      const chip = makeChip(intent.icon + ' ' + intent.label, () => renderConfirm(intent));
      chips.appendChild(chip);
    });
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      const first = document.querySelector('.phos-chip');
      if (first) first.click();
    }
  }

  function makeChip(label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'phos-chip';
    btn.setAttribute('role', 'listitem');
    btn.textContent = label;
    btn.addEventListener('click', () => { resetCollapse(); onClick(); });
    btn.addEventListener('keydown', e => { if (e.key === 'Enter') onClick(); });
    return btn;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  async function init() {
    injectStyles();
    try {
      const res = await fetch(CATALOG_PATH);
      const data = await res.json();
      catalog = data.intents || [];
    } catch (e) {
      catalog = [];
    }
    build();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
