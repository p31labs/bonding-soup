/**
 * @file P31 operator control plane — browser shell V2 (gate · essentials · sections).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "p31_cc_gate_v2";
  const STORAGE_ASIDE_PANE = "p31_cc_aside_pane_v1";
  const STORAGE_HISTORY = "p31_cc_history_v1";
  const HISTORY_MAX = 24;

  const bootEl = document.getElementById("cc-boot");
  if (!bootEl) return;

  /** @typedef {{ title: string, slow?: boolean, network?: boolean, hitl?: boolean, confirm?: string | null, protocol?: string }} ActionMeta */
  /** @typedef {{ id?: string, title: string, ids: string[], links?: { href: string, label: string }[] }} SectionSpec */

  /** @type {{ VERSION?: string, ESSENTIAL_IDS: string[], ACTION_META: Record<string, ActionMeta>, SECTIONS: SectionSpec[], CONNECTION?: Record<string, unknown>, JOY_SPIN?: string[] }} */
  const boot = JSON.parse(bootEl.textContent);

  const { ACTION_META, SECTIONS } = boot;
  const ESSENTIAL_IDS = Array.isArray(boot.ESSENTIAL_IDS) ? boot.ESSENTIAL_IDS : [];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nowIsoShort() {
    const d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0") +
      " " +
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0")
    );
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function getViewportBox() {
    const vv = window.visualViewport;
    const w = vv && typeof vv.width === "number" ? vv.width : window.innerWidth || 0;
    const h = vv && typeof vv.height === "number" ? vv.height : window.innerHeight || 0;
    return { w: Math.max(0, Math.round(w)), h: Math.max(0, Math.round(h)) };
  }

  function readSubjectPrefs() {
    try {
      if (window.p31SubjectPrefs && typeof window.p31SubjectPrefs.get === "function") {
        return window.p31SubjectPrefs.get();
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function detectDeviceProfile() {
    const box = getViewportBox();
    const w = box.w;
    const h = box.h;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const hover = window.matchMedia("(hover: hover)").matches;
    const prefs = readSubjectPrefs() || {};

    let device = "desktop";
    if (w > 0 && w < 740) device = "phone";
    else if (w > 0 && w < 1060) device = "tablet";

    const densityRaw = typeof prefs.density === "string" ? prefs.density : "";
    const density =
      densityRaw === "compact" || densityRaw === "spacious" ? densityRaw : "comfortable";

    const motionRaw = typeof prefs.motion === "string" ? prefs.motion : "";
    const motion =
      motionRaw === "none" || motionRaw === "full" ? motionRaw : prefersReducedMotion ? "reduced" : "reduced";

    const contrastRaw = typeof prefs.contrast === "string" ? prefs.contrast : "";
    const contrast = contrastRaw === "high" || contrastRaw === "max" ? contrastRaw : "standard";

    return {
      device,
      pointer: coarse ? "coarse" : "fine",
      hover: hover ? "hover" : "none",
      w,
      h,
      dpr: clamp(Number(window.devicePixelRatio || 1), 1, 3),
      density,
      motion,
      contrast,
    };
  }

  function applyProfileAttrs(p) {
    const root = document.documentElement;
    root.setAttribute("data-cc-device", p.device);
    root.setAttribute("data-cc-pointer", p.pointer);
    root.setAttribute("data-cc-hover", p.hover);
    root.setAttribute("data-cc-density", p.density);
    root.setAttribute("data-cc-motion", p.motion);
    root.setAttribute("data-cc-contrast", p.contrast);
    root.setAttribute("data-cc-vw", String(p.w));
    root.setAttribute("data-cc-vh", String(p.h));
  }

  function updateLayoutDebug(profile, note) {
    const el = document.getElementById("cc-layout-debug");
    if (!el) return;
    const slots = {
      primaryTop: !!document.getElementById("cc-slot-primary-top"),
      primaryMid: !!document.getElementById("cc-slot-primary-mid"),
      primaryBottom: !!document.getElementById("cc-slot-primary-bottom"),
    };
    const asideParent = document.getElementById("cc-aside")?.parentElement;
    const asideParentId = asideParent && asideParent.id ? "#" + asideParent.id : asideParent?.className || "—";
    const openCount = Number(document.body.getAttribute("data-cc-sections-open") || "0");
    el.textContent =
      "P31 Command Center layout\n" +
      "updated: " +
      nowIsoShort() +
      "\n\n" +
      "profile: " +
      JSON.stringify(profile, null, 2) +
      "\n\n" +
      "sections_open: " +
      openCount +
      "\n" +
      "aside_parent: " +
      asideParentId +
      "\n" +
      "slots: " +
      JSON.stringify(slots) +
      (note ? "\n\nnote: " + note : "");
  }

  function tagsHtml(id) {
    const m = ACTION_META[id] || {};
    const bits = [];
    if (m.slow) bits.push('<span class="cc-pill cc-pill--slow">slow</span>');
    if (m.network) bits.push('<span class="cc-pill cc-pill--net">net</span>');
    if (m.hitl) bits.push('<span class="cc-pill cc-pill--hitl">hitl</span>');
    return bits.length ? '<span class="cc-act__meta">' + bits.join("") + "</span>" : "";
  }

  function setTermStatus(text, variant, opts) {
    opts = opts || {};
    const st = document.getElementById("cc-term-status");
    if (st) {
      st.textContent = text;
      st.className = "cc-term-status cc-term-status--" + variant;
    }
    const spin = document.getElementById("cc-k4-spin");
    if (!spin) return;
    if (variant === "run") {
      const mode = opts.spin === "breath" || opts.spin === "ghost" ? opts.spin : "wye";
      spin.dataset.spin = mode;
      spin.hidden = false;
    } else {
      spin.hidden = true;
    }
  }

  /** @param {string} id */
  function spinnerModeForAction(id, meta) {
    const m = meta || {};
    if (m.network) return "breath";
    if (/mesh|connection/i.test(id)) return "ghost";
    return "wye";
  }

  /** @returns {'armed'|'locked'} */
  function readGateState() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "armed" ? "armed" : "locked";
    } catch {
      return "locked";
    }
  }

  /** @param {'armed'|'locked'} s */
  function writeGateState(s) {
    try {
      sessionStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* private mode etc. */
    }
  }

  function applyGateToButtons() {
    const armed = readGateState() === "armed";
    document.body.setAttribute("data-cc-gate-armed", armed ? "1" : "0");
    const indicator = document.getElementById("cc-gate-indicator");
    const label = document.getElementById("cc-gate-label");
    const btnUnlock = document.getElementById("cc-gate-unlock");
    const btnLock = document.getElementById("cc-gate-lock");

    if (indicator) {
      indicator.setAttribute("data-state", armed ? "armed" : "locked");
    }
    if (label) {
      label.innerHTML = armed
        ? "<strong>Armed</strong> — whitelisted runs enabled for this tab"
        : "<strong>Locked</strong> — automation disabled";
    }
    if (btnUnlock) btnUnlock.disabled = armed;
    if (btnLock) btnLock.disabled = !armed;

    document.querySelectorAll("button.cc-action, button.cc-act--essential").forEach((b) => {
      b.disabled = !armed;
      b.setAttribute("aria-disabled", armed ? "false" : "true");
    });
  }

  function confirmInPage(message) {
    return new Promise((resolve) => {
      const mod = document.getElementById("cc-modal");
      const msg = document.getElementById("cc-modal-msg");
      const ok = document.getElementById("cc-modal-ok");
      const cancel = document.getElementById("cc-modal-cancel");
      const bd = document.querySelector("[data-cc-modal-dismiss]");
      if (!mod || !msg || !ok || !cancel) {
        resolve(window.confirm(message));
        return;
      }
      msg.textContent = message;
      mod.hidden = false;
      function cleanup(result) {
        mod.hidden = true;
        ok.removeEventListener("click", onOk);
        cancel.removeEventListener("click", onCancel);
        if (bd) bd.removeEventListener("click", onCancel);
        document.removeEventListener("keydown", onKey);
        resolve(result);
      }
      function onOk() {
        cleanup(true);
      }
      function onCancel() {
        cleanup(false);
      }
      function onKey(e) {
        if (e.key === "Escape") onCancel();
      }
      ok.addEventListener("click", onOk);
      cancel.addEventListener("click", onCancel);
      if (bd) bd.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKey);
      ok.focus();
    });
  }

  /** @param {string} id */
  async function go(id) {
    if (readGateState() !== "armed") {
      const out = document.getElementById("out");
      if (out) {
        out.textContent = "Unlock the automation gate first.\n";
      }
      setTermStatus("blocked", "bad");
      return;
    }

    const m = ACTION_META[id];
    if (m && m.confirm) {
      const ok = await confirmInPage(m.confirm);
      if (!ok) return;
    }

    const out = document.getElementById("out");
    if (!out) return;

    const metaGo = ACTION_META[id] || {};
    document.querySelectorAll("button.cc-action, button.cc-act--essential").forEach((b) => {
      b.disabled = true;
    });
    setTermStatus("running", "run", { spin: spinnerModeForAction(id, metaGo) });
    out.textContent = "Running " + id + "…\n";

    const startedAt = Date.now();
    fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: id }),
    })
      .then((r) => r.json())
      .then((j) => {
        const endedAt = Date.now();
        out.textContent = (j.stderr || "") + (j.stdout || "") + (j.code ? "\n[exit " + j.code + "]" : "");
        setTermStatus(j.code ? "failed" : "ok", j.code ? "bad" : "ok");
        try {
          pushHistoryEntry({
            id,
            title: (ACTION_META[id] && ACTION_META[id].title) || id,
            startedAt,
            endedAt,
            code: Number(j.code || 0),
            stderrLen: (j.stderr || "").length,
            stdoutLen: (j.stdout || "").length,
          });
        } catch {
          /* ignore */
        }
        if (!j.code && !prefersReducedMotion) {
          document.body.classList.add("cc-run-celebrate");
          window.setTimeout(function () {
            document.body.classList.remove("cc-run-celebrate");
          }, 900);
        }
      })
      .catch((e) => {
        const endedAt = Date.now();
        out.textContent = String(e);
        setTermStatus("failed", "bad");
        try {
          pushHistoryEntry({
            id,
            title: (ACTION_META[id] && ACTION_META[id].title) || id,
            startedAt,
            endedAt,
            code: 1,
            stderrLen: 0,
            stdoutLen: 0,
            error: String(e && e.message ? e.message : e),
          });
        } catch {
          /* ignore */
        }
      })
      .finally(() => {
        applyGateToButtons();
        renderHistoryPane();
        try {
          if (typeof window.__p31StarfieldPulse === "function") window.__p31StarfieldPulse();
        } catch {
          /* ignore */
        }
      });
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY);
      if (!raw) return [];
      const j = JSON.parse(raw);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }

  function writeHistory(list) {
    try {
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  function pushHistoryEntry(entry) {
    const list = readHistory();
    list.unshift(entry);
    if (list.length > HISTORY_MAX) list.length = HISTORY_MAX;
    writeHistory(list);
  }

  function formatMs(ms) {
    if (!Number.isFinite(ms) || ms < 0) return "—";
    if (ms < 1000) return Math.round(ms) + "ms";
    if (ms < 60_000) return (ms / 1000).toFixed(1) + "s";
    return Math.round(ms / 60_000) + "m";
  }

  function renderHistoryPane() {
    const host = document.getElementById("cc-history-body");
    if (!host) return;
    const list = readHistory();
    host.innerHTML = "";
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "cc-pane-empty";
      p.textContent = "No runs yet.";
      host.appendChild(p);
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "cc-history";
    for (const e of list) {
      const row = document.createElement("div");
      row.className = "cc-history__row";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cc-history__run cc-btn cc-btn--ghost";
      btn.textContent = (e.title || e.id || "run") + (e.code ? " (exit " + e.code + ")" : "");
      btn.addEventListener("click", () => go(String(e.id || "")));

      const meta = document.createElement("div");
      meta.className = "cc-history__meta cc-mono";
      const dur = formatMs(Number(e.endedAt || 0) - Number(e.startedAt || 0));
      const t = new Date(Number(e.startedAt || 0));
      const stamp =
        Number.isFinite(t.getTime()) ? String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0") : "—";
      meta.textContent = stamp + " · " + dur + " · out " + Number(e.stdoutLen || 0) + " · err " + Number(e.stderrLen || 0);

      row.appendChild(btn);
      row.appendChild(meta);
      wrap.appendChild(row);
    }
    host.appendChild(wrap);
  }

  function applyActionFilter() {
    const raw = document.getElementById("cc-filter");
    const q = ((raw && raw.value) || "").trim().toLowerCase();
    document.querySelectorAll(".cc-section-wrap").forEach((sec) => {
      let any = false;
      sec.querySelectorAll("button.cc-action").forEach((btn) => {
        const show = !q || (btn.textContent && btn.textContent.toLowerCase().includes(q));
        btn.style.display = show ? "" : "none";
        if (show) any = true;
      });
      sec.querySelectorAll("a.cc-link").forEach((a) => {
        const show = !q || (a.textContent && a.textContent.toLowerCase().includes(q));
        a.style.display = show ? "" : "none";
        if (show) any = true;
      });
      sec.style.display = any ? "" : "none";
    });
  }

  function rewriteLocalhostLinks() {
    const h = location.hostname;
    if (h === "127.0.0.1" || h === "localhost") return;
    document.querySelectorAll('a[href*="127.0.0.1"]').forEach((a) => {
      try {
        const raw = a.getAttribute("href");
        if (!raw) return;
        const u = new URL(raw, location.href);
        if (u.hostname !== "127.0.0.1") return;
        u.hostname = h;
        a.href = u.toString();
      } catch {
        /* ignore */
      }
    });
  }

  function mountEssentials() {
    const host = document.getElementById("cc-essential-buttons");
    if (!host) return;
    for (const id of ESSENTIAL_IDS) {
      const m = ACTION_META[id];
      if (!m) continue;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cc-act cc-act--essential";
      b.dataset.actionId = id;
      if (m.protocol) b.title = m.protocol;
      b.innerHTML =
        '<span class="cc-act__title"></span>' +
        tagsHtml(id) +
        (m.protocol ? '<code class="cc-act__proto">' + escapeHtml(m.protocol) + "</code>" : "");
      const t = b.querySelector(".cc-act__title");
      if (t) t.textContent = m.title;
      b.addEventListener("click", () => go(id));
      host.appendChild(b);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function mountSections() {
    const hostEl = document.getElementById("sections");
    if (!hostEl) return;

    SECTIONS.forEach((sec, secIdx) => {
      const det = document.createElement("details");
      det.className = "cc-section-wrap";
      if (!prefersReducedMotion) det.style.setProperty("--cc-stagger", String(secIdx * 40));

      const sum = document.createElement("summary");
      sum.className = "cc-section-summary";
      const nActs = sec.ids && sec.ids.length ? sec.ids.length : 0;
      sum.textContent =
        nActs === 0 ? sec.title : sec.title + " (" + nActs + " action" + (nActs === 1 ? "" : "s") + ")";
      det.appendChild(sum);

      const inner = document.createElement("div");
      inner.className = "cc-section-inner";

      if (sec.ids && sec.ids.length) {
        const g = document.createElement("div");
        g.className = "cc-grid";
        for (const id of sec.ids) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "cc-action";
          b.dataset.actionId = id;
          const meta = ACTION_META[id];
          if (meta && meta.protocol) b.title = meta.protocol;
          b.innerHTML =
            '<span class="cc-act__title"></span>' +
            tagsHtml(id) +
            (meta && meta.protocol
              ? '<code class="cc-act__proto">' + escapeHtml(meta.protocol) + "</code>"
              : "");
          const titleEl = b.querySelector(".cc-act__title");
          if (titleEl) titleEl.textContent = (meta && meta.title) || id;
          b.addEventListener("click", () => go(id));
          g.appendChild(b);
        }
        inner.appendChild(g);
      }

      if (sec.links && sec.links.length) {
        const lh = document.createElement("p");
        lh.className = "cc-links-heading";
        lh.textContent = "Open";
        inner.appendChild(lh);
        const lg = document.createElement("div");
        lg.className = "cc-grid cc-grid--links";
        for (const L of sec.links) {
          const a = document.createElement("a");
          a.className = "cc-link";
          a.href = L.href;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = L.label;
          lg.appendChild(a);
        }
        inner.appendChild(lg);
      }

      det.appendChild(inner);
      hostEl.appendChild(det);
    });
  }

  function countOpenSections() {
    const secs = Array.from(document.querySelectorAll("details.cc-section-wrap"));
    let open = 0;
    for (const d of secs) if (d.open) open += 1;
    document.body.setAttribute("data-cc-sections-open", String(open));
    document.body.setAttribute("data-cc-sections-total", String(secs.length));
    document.body.toggleAttribute("data-cc-sections-all-closed", open === 0);
    return open;
  }

  function bindSectionOpenTracking() {
    document.addEventListener(
      "toggle",
      (e) => {
        const t = e.target;
        if (!(t instanceof HTMLDetailsElement)) return;
        if (!t.classList.contains("cc-section-wrap")) return;
        countOpenSections();
      },
      true
    );
  }

  function readAsidePane() {
    try {
      const raw = localStorage.getItem(STORAGE_ASIDE_PANE);
      return raw === "history" || raw === "simplex" || raw === "layout" || raw === "terminal" ? raw : "terminal";
    } catch {
      return "terminal";
    }
  }

  function writeAsidePane(id) {
    try {
      localStorage.setItem(STORAGE_ASIDE_PANE, id);
    } catch {
      /* ignore */
    }
  }

  function setAsidePane(id) {
    const panes = Array.from(document.querySelectorAll(".cc-aside-pane[data-cc-pane]"));
    const tabs = Array.from(document.querySelectorAll(".cc-aside-tab[data-cc-pane]"));
    for (const p of panes) {
      const on = p.getAttribute("data-cc-pane") === id;
      p.hidden = !on;
    }
    for (const t of tabs) {
      const on = t.getAttribute("data-cc-pane") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.classList.toggle("is-on", on);
    }
    document.documentElement.setAttribute("data-cc-aside-pane", id);
    writeAsidePane(id);
  }

  function bindAsideTabs() {
    const tabs = Array.from(document.querySelectorAll(".cc-aside-tab[data-cc-pane]"));
    if (!tabs.length) return;
    tabs.forEach((t) => {
      t.addEventListener("click", () => setAsidePane(String(t.getAttribute("data-cc-pane") || "terminal")));
    });
    setAsidePane(readAsidePane());
  }

  function bindHistoryTools() {
    document.getElementById("cc-history-clear")?.addEventListener("click", () => {
      writeHistory([]);
      renderHistoryPane();
    });
    renderHistoryPane();
  }

  function updateSimplexMini(payload, workerHealth) {
    const healthEl = document.getElementById("cc-simplex-mini-health");
    const cronEl = document.getElementById("cc-simplex-mini-cron");
    const liveEl = document.getElementById("cc-simplex-mini-live");
    const updEl = document.getElementById("cc-simplex-mini-updated");
    if (!healthEl || !cronEl || !liveEl || !updEl) return;

    if (!payload || payload.ok !== true) {
      healthEl.textContent = "offline";
      cronEl.textContent = "—";
      liveEl.textContent = "0";
      updEl.textContent = nowIsoShort();
      return;
    }

    healthEl.textContent = "ok";
    liveEl.textContent = "1";
    let cronLabel = "unknown";
    if (workerHealth && typeof workerHealth === "object" && workerHealth.ok === true && workerHealth.health) {
      const wh = /** @type {Record<string, unknown>} */ (workerHealth.health);
      const rt = wh.runtime && typeof wh.runtime === "object" ? /** @type {Record<string, unknown>} */ (wh.runtime) : null;
      const crons = rt && rt.crons && typeof rt.crons === "object" ? /** @type {Record<string, unknown>} */ (rt.crons) : null;
      const mode = crons && typeof crons.mode === "string" ? crons.mode : "";
      if (mode) cronLabel = mode;
      const cnt = crons && typeof crons.count === "number" ? crons.count : NaN;
      if (Number.isFinite(cnt)) cronLabel += " (" + cnt + ")";
    }
    cronEl.textContent = cronLabel;
    updEl.textContent = nowIsoShort();
  }

  function bindGate() {
    const u = document.getElementById("cc-gate-unlock");
    const l = document.getElementById("cc-gate-lock");
    if (u)
      u.addEventListener("click", () => {
        writeGateState("armed");
        applyGateToButtons();
      });
    if (l)
      l.addEventListener("click", () => {
        writeGateState("locked");
        applyGateToButtons();
        const out = document.getElementById("out");
        if (out) out.prepend("[e-stop] Automation locked.\n");
        setTermStatus("idle", "idle");
      });
  }

  function bindOutputTools() {
    const out = document.getElementById("out");
    document.getElementById("cc-out-copy")?.addEventListener("click", async () => {
      if (!out) return;
      try {
        await navigator.clipboard.writeText(out.textContent || "");
        setTermStatus("copied", "ok");
      } catch {
        setTermStatus("failed", "bad");
      }
    });
    document.getElementById("cc-out-clear")?.addEventListener("click", () => {
      if (out) out.textContent = "— Cleared.\n";
      setTermStatus("idle", "idle");
    });
  }

  function bindFilter() {
    const filt = document.getElementById("cc-filter");
    if (filt) filt.addEventListener("input", applyActionFilter);
    let gChord = false;
    let gChordTimer = 0;
    document.addEventListener("keydown", (e) => {
      const tag = e.target && e.target.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (inField) return;
        e.preventDefault();
        const hk = document.getElementById("cc-hotkeys");
        if (hk) {
          hk.open = !hk.open;
          hk.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
      }

      if (!inField && (e.key === "g" || e.key === "G")) {
        gChord = true;
        window.clearTimeout(gChordTimer);
        gChordTimer = window.setTimeout(function () {
          gChord = false;
        }, 1100);
        return;
      }
      if (!inField && gChord && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        gChord = false;
        window.clearTimeout(gChordTimer);
        document.getElementById("cc-simplex-strip")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (!inField && gChord && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        gChord = false;
        window.clearTimeout(gChordTimer);
        document.getElementById("cc-ecosystem-strip")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (!inField && gChord && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        gChord = false;
        window.clearTimeout(gChordTimer);
        setAsidePane("layout");
        const aside = document.getElementById("cc-aside");
        aside?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        window.setTimeout(() => {
          document.getElementById("cc-tab-layout")?.focus();
        }, 280);
        return;
      }

      if (e.key === "Escape" && filt && document.activeElement === filt) {
        filt.value = "";
        applyActionFilter();
        filt.blur();
        return;
      }
      if (e.key !== "/" || document.activeElement === filt) return;
      const t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      e.preventDefault();
      filt && filt.focus();
    });
  }

  /** Wall clock for FERS close — matches simplex-v7/src/lib/fers-countdown.ts */
  const FERS_DEADLINE_MS = Date.parse("2026-09-30T21:00:00.000Z");
  function fersDaysRemaining() {
    return Math.ceil((FERS_DEADLINE_MS - Date.now()) / 86400000);
  }

  function formatAge(ms) {
    if (ms < 1500) return "just now";
    if (ms < 60_000) return Math.round(ms / 1000) + "s ago";
    if (ms < 3_600_000) return Math.round(ms / 60_000) + "m ago";
    return Math.round(ms / 3_600_000) + "h ago";
  }

  /**
   * @param {unknown} payload simplex-state proxy payload
   * @param {unknown} workerHealth proxy payload for Worker /api/health
   */
  function renderSimplexStrip(payload, workerHealth, fetchStartedAt) {
    const wrap = document.getElementById("cc-simplex-strip");
    if (!wrap) return;
    const text = wrap.querySelector(".cc-simplex-strip__text");
    const sub = document.getElementById("cc-simplex-sub");
    const spin = wrap.querySelector(".cc-simplex-strip__spin");
    const t0 = typeof fetchStartedAt === "number" && Number.isFinite(fetchStartedAt) ? fetchStartedAt : Date.now();
    wrap.removeAttribute("data-loading");
    if (spin) spin.hidden = true;
    wrap.removeAttribute("data-cc-live");
    wrap.removeAttribute("data-cc-cron");

    if (!payload || payload.ok !== true || !payload.state || typeof payload.state !== "object") {
      if (text) text.textContent = "SIMPLEX: offline (local-only mode)";
      if (sub) sub.textContent = "";
      wrap.title = "Set P31_SIMPLEX_ORIGIN to your Worker origin (no trailing slash).";
      updateSimplexMini({ ok: false }, { ok: false });
      return;
    }

    const state = /** @type {Record<string, unknown>} */ (payload.state);
    const health =
      payload.health && typeof payload.health === "object"
        ? /** @type {Record<string, unknown>} */ (payload.health)
        : null;

    const spoonsRaw = Number(state.current_spoons);
    const maxRaw = Number(state.max_spoons);
    const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 12;
    const spoons = Number.isFinite(spoonsRaw) ? spoonsRaw : NaN;
    const qRaw = state.q_factor;
    let q = "—";
    if (typeof qRaw === "number" && Number.isFinite(qRaw)) q = qRaw.toFixed(2);
    else if (typeof qRaw === "string" && qRaw.trim()) q = qRaw.trim();

    const fers = fersDaysRemaining();
    const src = String(state.sentinel_context_source || "—");

    let agentsBit = "AGENTS: 11/11 ●";
    if (health) {
      const ah = Number(health.agents_healthy);
      const at = Number(health.agents_total);
      if (Number.isFinite(ah) && Number.isFinite(at) && at > 0) {
        agentsBit = "AGENTS: " + ah + "/" + at + " ●";
      }
    }

    if (text) {
      text.textContent =
        agentsBit +
        " | SPOONS: " +
        (Number.isFinite(spoons) ? String(spoons) : "—") +
        "/" +
        max +
        " | Q: " +
        q +
        " | FERS: " +
        fers +
        "d | SENTINEL: " +
        src;
    }

    wrap.setAttribute("data-cc-live", "1");
    let cronLabel = "";
    let workerTs = 0;
    if (workerHealth && typeof workerHealth === "object" && workerHealth.ok === true && workerHealth.health) {
      const wh = /** @type {Record<string, unknown>} */ (workerHealth.health);
      const rt = wh.runtime && typeof wh.runtime === "object" ? /** @type {Record<string, unknown>} */ (wh.runtime) : null;
      const crons = rt && rt.crons && typeof rt.crons === "object" ? /** @type {Record<string, unknown>} */ (rt.crons) : null;
      const mode = crons && typeof crons.mode === "string" ? crons.mode : "";
      const cnt = crons && typeof crons.count === "number" ? crons.count : NaN;
      if (mode === "manual" || cnt === 0) {
        cronLabel = "CRON: manual";
        wrap.setAttribute("data-cc-cron", "manual");
      } else if (mode === "scheduled") {
        cronLabel = "CRON: scheduled (" + (Number.isFinite(cnt) ? String(cnt) : "?") + ")";
        wrap.setAttribute("data-cc-cron", "scheduled");
      }
      const tsRaw = wh.ts;
      if (typeof tsRaw === "number" && Number.isFinite(tsRaw)) workerTs = tsRaw;
    }

    const bits = [];
    bits.push("synced " + formatAge(Date.now() - t0));
    if (workerTs > 0) bits.push("worker health " + formatAge(Date.now() - workerTs));
    if (cronLabel) bits.push(cronLabel);
    if (src === "static_operator") bits.push("spoons: static default (KV/D1 not authoritative yet)");
    if (sub) sub.textContent = bits.join(" · ");

    wrap.title =
      "SIMPLEX live · " +
      (cronLabel || "cron: unknown") +
      " · Polls /api/state every 30s via local proxy. Keys: ? · g s · g e · g l Layout.";

    updateSimplexMini(payload, workerHealth);
  }

  /**
   * @param {unknown} gbg
   */
  function summarizeGlassGroups(gbg) {
    if (!gbg || typeof gbg !== "object" || Array.isArray(gbg)) return "—";
    const o = /** @type {Record<string, number>} */ (gbg);
    const pairs = Object.keys(o).map((k) => [k, o[k]]);
    pairs.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const top = pairs.slice(0, 5).map(([k, v]) => k + ":" + v);
    return top.join(" · ") + (pairs.length > 5 ? " …" : "");
  }

  /**
   * @param {unknown} conn
   * @param {number} fetchStartedAt
   * @param {{ stale?: boolean, glassSnap?: unknown } | undefined} [opts]
   */
  function renderEcosystemStrip(conn, fetchStartedAt, opts) {
    const o = opts || {};
    const stale = !!o.stale;
    const glassSnap = o.glassSnap;
    const wrap = document.getElementById("cc-ecosystem-strip");
    if (!wrap) return;
    const text = wrap.querySelector(".cc-ecosystem-strip__text");
    const sub = document.getElementById("cc-ecosystem-sub");
    const spin = wrap.querySelector(".cc-ecosystem-strip__spin");
    const t0 = typeof fetchStartedAt === "number" && Number.isFinite(fetchStartedAt) ? fetchStartedAt : Date.now();
    wrap.removeAttribute("data-loading");
    if (spin) spin.hidden = true;
    wrap.removeAttribute("data-cc-synced");
    wrap.toggleAttribute("data-cc-stale", stale);

    if (!conn || typeof conn !== "object" || Array.isArray(conn)) {
      if (text) text.textContent = "CONNECTION: offline (no summary)";
      if (sub) sub.textContent = stale ? "stale · using page boot only" : "";
      wrap.title = "Missing p31-ecosystem.json or boot.CONNECTION.";
      return;
    }
    const c = /** @type {Record<string, unknown>} */ (conn);
    const dep = Number(c.deployablesCount);
    const glass = Number(c.glassProbesCount);
    const envRows = Number(c.p31EnvCatalogEntries);
    const depOk = Number.isFinite(dep);
    const glassOk = Number.isFinite(glass);
    const envOk = Number.isFinite(envRows);
    const gsum = summarizeGlassGroups(c.glassByGroup);
    if (text) {
      text.textContent =
        "DEPLOY spine: " +
        (depOk ? String(dep) : "—") +
        " · GLASS: " +
        (glassOk ? String(glass) : "—") +
        " (" +
        gsum +
        ") · P31_* catalog: " +
        (envOk ? String(envRows) : "—");
    }
    const prev = Array.isArray(c.deployablePreview) ? c.deployablePreview.map(String) : [];
    const head = prev.slice(0, 5).join(" · ");
    const upd = typeof c.ecosystemUpdated === "string" ? c.ecosystemUpdated : "—";
    if (sub) {
      const bits = [];
      if (stale) bits.push("stale · from page boot");
      bits.push("registry " + upd);
      if (head) bits.push("head " + head + (prev.length > 5 ? " …" : ""));
      bits.push("synced " + formatAge(Date.now() - t0));
      if (glassSnap && typeof glassSnap === "object" && !Array.isArray(glassSnap) && glassSnap.ok === true) {
        const sm = /** @type {Record<string, unknown>} */ (glassSnap.summary || {});
        const up = Number(sm.up);
        const down = Number(sm.down);
        const wn = Number(sm.warn);
        const au = Number(sm.auth);
        const sk = Number(sm.skipped);
        const ts = typeof glassSnap.timestamp === "string" ? glassSnap.timestamp.slice(0, 19) : "";
        const parts = [];
        if (Number.isFinite(up)) parts.push("↑" + up);
        if (Number.isFinite(down)) parts.push("↓" + down);
        if (Number.isFinite(wn) && wn > 0) parts.push("warn " + wn);
        if (Number.isFinite(au) && au > 0) parts.push("auth " + au);
        if (Number.isFinite(sk) && sk > 0) parts.push("skip " + sk);
        if (parts.length) bits.push("last glass " + parts.join(" ") + (ts ? " · " + ts : ""));
      }
      sub.textContent = bits.join(" · ");
    }
    if (!stale) wrap.setAttribute("data-cc-synced", "1");
    wrap.title =
      "p31-ecosystem.json + glass groups + env manifest — GET /api/connection-summary every 2m. Last glass row from GET /api/glass-snapshot. Keys: g e · g l Layout.";
  }

  async function loadEcosystemStrip() {
    const wrap = document.getElementById("cc-ecosystem-strip");
    const text = wrap && wrap.querySelector(".cc-ecosystem-strip__text");
    if (!wrap || !text) return;
    const t0 = Date.now();
    wrap.removeAttribute("data-cc-stale");
    wrap.setAttribute("data-loading", "1");
    const spin = wrap.querySelector(".cc-ecosystem-strip__spin");
    if (spin) spin.hidden = false;
    /** @type {unknown} */
    let conn = boot.CONNECTION || null;
    let stale = true;
    try {
      const res = await fetch("/api/connection-summary", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        conn = j;
        stale = false;
      }
    } catch {
      /* keep boot */
    }
    /** @type {unknown} */
    let glassSnap = null;
    try {
      const gr = await fetch("/api/glass-snapshot", { cache: "no-store" });
      if (gr.ok) {
        glassSnap = await gr.json();
      }
    } catch {
      glassSnap = null;
    }
    renderEcosystemStrip(conn, t0, { stale, glassSnap });
  }

  async function loadSimplexStrip() {
    const wrap = document.getElementById("cc-simplex-strip");
    const text = wrap && wrap.querySelector(".cc-simplex-strip__text");
    if (!wrap || !text) return;
    const t0 = Date.now();
    wrap.setAttribute("data-loading", "1");
    const spin = wrap.querySelector(".cc-simplex-strip__spin");
    if (spin) spin.hidden = false;
    try {
      const [stRes, whRes] = await Promise.all([
        fetch("/api/simplex-state", { cache: "no-store" }),
        fetch("/api/simplex-health", { cache: "no-store" }),
      ]);
      const j = await stRes.json();
      let wh = { ok: false };
      try {
        wh = await whRes.json();
      } catch {
        wh = { ok: false };
      }
      renderSimplexStrip(j, wh, t0);
    } catch {
      renderSimplexStrip({ ok: false }, { ok: false }, t0);
    }
  }

  function bindSimplexMiniTools() {
    document.getElementById("cc-simplex-refresh")?.addEventListener("click", () => {
      loadSimplexStrip();
    });
  }

  function applyLayoutProfile(profile) {
    const main = document.getElementById("cc-main");
    const primary = document.querySelector(".cc-layout__primary");
    const aside = document.querySelector(".cc-layout__aside");
    const mid = document.getElementById("cc-slot-primary-mid");
    if (!main || !primary || !aside || !mid) {
      updateLayoutDebug(profile, "missing expected layout nodes");
      return;
    }

    // Default desktop: keep aside as sibling of primary in the main grid.
    if (profile.device === "desktop" && profile.pointer === "fine") {
      if (aside.parentElement !== main) main.appendChild(aside);
      updateLayoutDebug(profile, "desktop: aside in grid");
      return;
    }

    // Phone/tablet: move aside into primary flow (below essentials/top, above filter/tools).
    if (aside.parentElement !== primary) {
      primary.insertBefore(aside, mid);
    } else if (aside.nextSibling !== mid) {
      primary.insertBefore(aside, mid);
    }
    updateLayoutDebug(profile, "mobile/tablet: aside moved into primary flow");
  }

  function throttle(fn, ms) {
    let t = 0;
    let pending = false;
    return function () {
      const now = Date.now();
      if (now - t >= ms) {
        t = now;
        fn();
        return;
      }
      if (pending) return;
      pending = true;
      window.setTimeout(() => {
        pending = false;
        t = Date.now();
        fn();
      }, ms);
    };
  }

  function bindJoyDraw() {
    var btn = document.getElementById("cc-joy-draw");
    var slot = document.getElementById("cc-joy-slot");
    var spin = Array.isArray(boot.JOY_SPIN) ? boot.JOY_SPIN : [];
    if (!btn || !slot || spin.length === 0) return;
    var i = 0;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      slot.hidden = false;
      slot.textContent = spin[i % spin.length];
      i += 1;
    });
  }

  mountEssentials();
  mountSections();
  rewriteLocalhostLinks();
  bindGate();
  bindOutputTools();
  bindFilter();
  bindSectionOpenTracking();
  applyGateToButtons();
  applyActionFilter();
  bindJoyDraw();
  bindAsideTabs();
  bindHistoryTools();
  bindSimplexMiniTools();
  loadSimplexStrip();
  setInterval(loadSimplexStrip, 30_000);
  loadEcosystemStrip();
  setInterval(loadEcosystemStrip, 120_000);

  // Initial layout profile + reactive updates.
  const applyAll = () => {
    const prof = detectDeviceProfile();
    applyProfileAttrs(prof);
    applyLayoutProfile(prof);
    countOpenSections();
  };
  const onResize = throttle(applyAll, 140);
  window.addEventListener("resize", onResize);
  try {
    window.visualViewport?.addEventListener("resize", onResize);
  } catch {
    /* ignore */
  }
  applyAll();

  console.info("P31 control plane loaded", boot.VERSION || "?");
})();
