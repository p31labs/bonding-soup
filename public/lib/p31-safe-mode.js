/**
 * p31-safe-mode.js — Shared SOULSAFE / Gray Rock protocol
 * Canonical safe mode for all P31 surfaces.
 *
 * Usage: <script src="/public/lib/p31-safe-mode.js"></script>
 * The script auto-initializes on DOMContentLoaded.
 *
 * Three trigger paths (all checked on init):
 *   1. OS preference: prefers-reduced-motion
 *   2. URL param: ?safe=1
 *   3. localStorage: p31-safe-mode = 'on'
 *
 * Surfaces with WebGL/canvas teardown needs should listen:
 *   document.addEventListener('p31:safe-mode', (e) => {
 *     if (e.detail.active) { ... full context teardown ... }
 *   });
 */

(function () {
  'use strict';

  function engage() {
    document.body.classList.add('safe-mode');
    localStorage.setItem('p31-safe-mode', 'on');
    document.dispatchEvent(new CustomEvent('p31:safe-mode', { detail: { active: true } }));
  }

  function disengage() {
    document.body.classList.remove('safe-mode');
    localStorage.setItem('p31-safe-mode', 'off');
    document.dispatchEvent(new CustomEvent('p31:safe-mode', { detail: { active: false } }));
  }

  function toggle() {
    document.body.classList.contains('safe-mode') ? disengage() : engage();
  }

  function init() {
    // 1. OS preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) engage();
    // 2. URL param
    if (new URLSearchParams(location.search).has('safe')) engage();
    // 3. localStorage
    if (localStorage.getItem('p31-safe-mode') === 'on') engage();

    // Wire any button with id="safeModeBtn" or class="btn-safe" or class="safe-toggle"
    const btns = document.querySelectorAll('#safeModeBtn, .btn-safe, .safe-toggle');
    btns.forEach(btn => btn.addEventListener('click', toggle));

    // Also wire buttons using onclick that call toggle directly
    window.p31SafeMode = { engage, disengage, toggle };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
