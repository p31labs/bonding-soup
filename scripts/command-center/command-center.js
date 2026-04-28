/**
 * @file P31 operator control plane — browser shell V2 (gate · essentials · sections).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "p31_cc_gate_v2";

  const bootEl = document.getElementById("cc-boot");
  if (!bootEl) return;

  /** @typedef {{ title: string, slow?: boolean, network?: boolean, hitl?: boolean, confirm?: string | null, protocol?: string }} ActionMeta */
  /** @typedef {{ id?: string, title: string, ids: string[], links?: { href: string, label: string }[] }} SectionSpec */

  /** @type {{ VERSION?: string, ESSENTIAL_IDS: string[], ACTION_META: Record<string, ActionMeta>, SECTIONS: SectionSpec[] }} */
  const boot = JSON.parse(bootEl.textContent);

  const { ACTION_META, SECTIONS } = boot;
  const ESSENTIAL_IDS = Array.isArray(boot.ESSENTIAL_IDS) ? boot.ESSENTIAL_IDS : [];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: id }),
    })
      .then((r) => r.json())
      .then((j) => {
        out.textContent = (j.stderr || "") + (j.stdout || "") + (j.code ? "\n[exit " + j.code + "]" : "");
        setTermStatus(j.code ? "exit " + j.code : "ok", j.code ? "bad" : "ok");
      })
      .catch((e) => {
        out.textContent = String(e);
        setTermStatus("error", "bad");
      })
      .finally(() => {
        applyGateToButtons();
      });
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
      sum.textContent = sec.title;
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
        setTermStatus("copy failed", "bad");
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
    document.addEventListener("keydown", (e) => {
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

  mountEssentials();
  mountSections();
  rewriteLocalhostLinks();
  bindGate();
  bindOutputTools();
  bindFilter();
  applyGateToButtons();
  applyActionFilter();

  console.info("P31 control plane loaded", boot.VERSION || "?");
})();
