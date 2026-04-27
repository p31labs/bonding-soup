/**
 * @file P31 local operator console — browser shell.
 * Boot: JSON in `#cc-boot` (server-injected). Whitelisted POST /api/run only.
 */
(function () {
  "use strict";

  const bootEl = document.getElementById("cc-boot");
  if (!bootEl) return;

  /** @typedef {{ title: string, slow?: boolean, network?: boolean, hitl?: boolean, confirm?: string | null }} ActionMeta */
  /** @typedef {{ id: string, title: string, ids: string[], links?: { href: string, label: string }[] }} SectionSpec */
  /** @type {{ ACTION_META: Record<string, ActionMeta>, SECTIONS: SectionSpec[] }} */
  const { ACTION_META, SECTIONS } = JSON.parse(bootEl.textContent);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @param {string} id */
  function tagsHtml(id) {
    const m = ACTION_META[id] || {};
    const bits = [];
    if (m.slow) bits.push('<span class="pill slow">slow</span>');
    if (m.network) bits.push('<span class="pill net">net</span>');
    if (m.hitl) bits.push('<span class="pill hitl">hitl</span>');
    return bits.length ? '<span class="btn-meta">' + bits.join("") + "</span>" : "";
  }

  /** @param {string} text @param {'idle'|'run'|'ok'|'bad'} variant */
  function setTermStatus(text, variant) {
    const st = document.getElementById("cc-term-status");
    if (!st) return;
    st.textContent = text;
    st.className = "p31-cc__term-status p31-cc__term-status--" + variant;
  }

  function applyActionFilter() {
    const raw = document.getElementById("cc-filter");
    const q = ((raw && raw.value) || "").trim().toLowerCase();
    document.querySelectorAll(".cc-section").forEach((sec) => {
      let any = false;
      sec.querySelectorAll("button.cc-action").forEach((btn) => {
        const show = !q || btn.textContent.toLowerCase().includes(q);
        btn.style.display = show ? "" : "none";
        if (show) any = true;
      });
      sec.querySelectorAll("a.cc-link").forEach((a) => {
        const show = !q || a.textContent.toLowerCase().includes(q);
        a.style.display = show ? "" : "none";
        if (show) any = true;
      });
      sec.style.display = any ? "" : "none";
    });
  }

  /** Rewrite 127.0.0.1 links so iPhone on LAN hits your dev machine, not the phone loopback. */
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
      } catch (e) {
        /* ignore */
      }
    });
  }

  /** iOS-friendly confirm (system dialog is clunky; falls back if modal missing). */
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
    const m = ACTION_META[id];
    if (m && m.confirm) {
      const ok = await confirmInPage(m.confirm);
      if (!ok) return;
    }

    const out = document.getElementById("out");
    if (!out) return;

    document.querySelectorAll("button.cc-action").forEach((b) => {
      b.disabled = true;
    });
    setTermStatus("running", "run");
    out.textContent = "Running " + id + "…";

    fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: id }),
    })
      .then((r) => r.json())
      .then((j) => {
        out.textContent =
          (j.stderr || "") + (j.stdout || "") + (j.code ? "\n[exit " + j.code + "]" : "");
        setTermStatus(j.code ? "exit " + j.code : "ok", j.code ? "bad" : "ok");
      })
      .catch((e) => {
        out.textContent = String(e);
        setTermStatus("error", "bad");
      })
      .finally(() => {
        document.querySelectorAll("button.cc-action").forEach((b) => {
          b.disabled = false;
        });
      });
  }

  function mountSections() {
    const hostEl = document.getElementById("sections");
    if (!hostEl) return;

    SECTIONS.forEach((sec, secIdx) => {
      const s = document.createElement("section");
      s.className = "cc-section";
      if (!prefersReducedMotion) {
        s.style.setProperty("--cc-stagger", String(secIdx * 55));
      }

      const h = document.createElement("h2");
      h.textContent = sec.title;
      s.appendChild(h);

      if (sec.ids.length) {
        const g = document.createElement("div");
        g.className = "cc-grid";
        for (const id of sec.ids) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "cc-action";
          b.dataset.actionId = id;
          const title = (ACTION_META[id] && ACTION_META[id].title) || id;
          b.innerHTML = '<span class="btn-title"></span>' + tagsHtml(id);
          const titleEl = b.querySelector(".btn-title");
          if (titleEl) titleEl.textContent = title;
          b.addEventListener("click", () => go(id));
          g.appendChild(b);
        }
        s.appendChild(g);
      }

      if (sec.links && sec.links.length) {
        const sub = document.createElement("h2");
        sub.className = "cc-subh2";
        sub.textContent = "Open in browser";
        s.appendChild(sub);
        const lg = document.createElement("div");
        lg.className = "cc-grid";
        for (const L of sec.links) {
          const a = document.createElement("a");
          a.className = "cc-link";
          a.href = L.href;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = "Open → " + L.label;
          lg.appendChild(a);
        }
        s.appendChild(lg);
      }

      hostEl.appendChild(s);
    });
  }

  function bindPointerAurora() {
    if (prefersReducedMotion) return;
    document.body.addEventListener(
      "pointermove",
      (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty("--cc-ptr-x", x + "%");
        document.documentElement.style.setProperty("--cc-ptr-y", y + "%");
      },
      { passive: true }
    );
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

  mountSections();
  rewriteLocalhostLinks();
  bindPointerAurora();
  bindFilter();
  applyActionFilter();
})();
