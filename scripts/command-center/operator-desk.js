/**
 * Operator desk — read-only polling of the same JSON the control plane uses.
 * Hardening: request timeout, fetch error handling, no innerHTML, capped list length.
 * No POST /api/run; use / for whitelisted actions + gate.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const FETCH_BUDGET_MS = 12000;
  const MAX_DEPLOY_PREVIEW = 32;
  const POLL_MS = 30000;

  function pill(text, kind) {
    const span = document.createElement("span");
    span.className = "od-pill" + (kind === "warn" ? " od-pill--warn" : kind === "bad" ? " od-pill--bad" : "");
    span.textContent = text;
    return span;
  }

  function setRow(dl, label, valueNode) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    if (typeof valueNode === "string") dd.textContent = valueNode;
    else dd.appendChild(valueNode);
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function clearDl(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  /**
   * @param {string} path
   * @param {AbortSignal} signal
   */
  function fetchJson(path, signal) {
    return fetch(path, { cache: "no-store", signal })
      .then((r) =>
        r.text().then((text) => {
          try {
            return { ok: r.ok, status: r.status, json: JSON.parse(text), path };
          } catch {
            return { ok: false, status: r.status, json: null, raw: text, path, parseError: true };
          }
        })
      )
      .catch((e) => {
        const name = e && e.name;
        return {
          ok: false,
          status: 0,
          json: null,
          path,
          error: name === "AbortError" ? "timeout" : String(e && e.message ? e.message : e),
        };
      });
  }

  let refreshSeq = 0;

  function setStale(isStale) {
    const root = document.documentElement;
    if (isStale) root.setAttribute("data-od-stale", "1");
    else root.removeAttribute("data-od-stale");
  }

  async function refresh() {
    const mySeq = ++refreshSeq;
    const stamp = $("od-stamp");
    const errEl = $("od-error");
    const hintEl = $("od-refresh-hint");
    const dlHealth = $("od-dl-health");
    const dlConn = $("od-dl-connection");
    const dlGlass = $("od-dl-glass");
    const dlSx = $("od-dl-simplex");
    const dlGo = $("od-dl-github-org");
    const ulDeploy = $("od-deploy-list");
    const main = $("od-main");
    if (!main || !stamp || !errEl || !dlHealth || !dlConn || !dlGlass || !dlSx || !dlGo || !ulDeploy) return;

    const ac = new AbortController();
    const timer = setTimeout(function () {
      ac.abort();
    }, FETCH_BUDGET_MS);
    const signal = ac.signal;

    main.setAttribute("aria-busy", "true");
    errEl.hidden = true;
    errEl.textContent = "";
    if (hintEl) {
      hintEl.classList.add("is-loading");
    }

    try {
      setStale(false);
      const [h, cs, gs, sh, ss, go] = await Promise.all([
        fetchJson("/api/health", signal),
        fetchJson("/api/connection-summary", signal),
        fetchJson("/api/glass-snapshot", signal),
        fetchJson("/api/simplex-health", signal),
        fetchJson("/api/simplex-state", signal),
        fetchJson("/api/github-org-status", signal),
      ]);

      if (mySeq !== refreshSeq) return;

      const healthDown =
        h.error != null || !h.json || h.json.ok !== true || h.parseError === true;

      const anyFetchHardFail = [cs, gs, sh, ss].some(function (x) {
        if (x.parseError) return true;
        if (x.error != null && x.error !== "timeout") return true;
        return false;
      });
      const anyJsonSoft = [cs, gs, sh, ss].some(function (x) {
        return x.json && x.json.ok === false;
      });
      const anyTimeout = [cs, gs, sh, ss].some(function (x) {
        return x.error === "timeout";
      });
      setStale(!healthDown && (anyFetchHardFail || anyJsonSoft || anyTimeout));

      if (healthDown) {
        setStale(false);
        errEl.hidden = false;
        errEl.textContent =
          h.error === "timeout"
            ? "Request timed out — is the command center process healthy?"
            : h.error
              ? "Control plane request failed: " + h.error
              : "Control plane health unavailable or not JSON.";
        stamp.textContent = "—";
        clearDl(dlHealth);
        clearDl(dlConn);
        clearDl(dlGlass);
        clearDl(dlSx);
        clearDl(dlGo);
        if (ulDeploy) {
          while (ulDeploy.firstChild) ulDeploy.removeChild(ulDeploy.firstChild);
          const li = document.createElement("li");
          li.textContent = "—";
          ulDeploy.appendChild(li);
        }
        return;
      }

      const now = new Date();
      stamp.textContent = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      clearDl(dlHealth);
      setRow(dlHealth, "Surface", pill("Operator desk", ""));
      setRow(dlHealth, "Server", String(h.json.name || "—"));
      setRow(dlHealth, "Version", String(h.json.version || "—"));
      setRow(dlHealth, "Whitelisted actions", String(h.json.actions != null ? h.json.actions : "—"));

      clearDl(dlConn);
      if (cs.json && cs.json.schema === "p31.connectionSummary/1.0.1") {
        if (cs.error) {
          setRow(dlConn, "CONNECTION", "request failed" + (cs.error === "timeout" ? " (timeout)" : ""));
        } else {
          setRow(dlConn, "Deployables", String(cs.json.deployablesCount ?? "—"));
          setRow(dlConn, "Glass probes", String(cs.json.glassProbesCount ?? "—"));
          setRow(dlConn, "P31_* catalog", String(cs.json.p31EnvCatalogEntries ?? "—"));
          setRow(dlConn, "Registry updated", String(cs.json.ecosystemUpdated || "—"));
          const gbg = cs.json.glassByGroup && typeof cs.json.glassByGroup === "object" ? cs.json.glassByGroup : {};
          const parts = Object.keys(gbg)
            .sort(function (a, b) {
              return (Number(gbg[b]) || 0) - (Number(gbg[a]) || 0) || a.localeCompare(b);
            })
            .map(function (k) {
              return k + ":" + gbg[k];
            });
          setRow(dlConn, "Glass by group", parts.length ? parts.join(" · ") : "—");
        }
      } else {
        setRow(dlConn, "CONNECTION", "unavailable or stale JSON" + (cs.error ? " (" + cs.error + ")" : ""));
      }

      clearDl(dlGlass);
      if (gs.error) {
        setRow(dlGlass, "Snapshot", gs.error === "timeout" ? "timeout" : "request failed");
      } else if (gs.json && gs.json.ok && gs.json.summary) {
        const s = gs.json.summary;
        setRow(dlGlass, "Up", String(s.up ?? 0));
        setRow(dlGlass, "Auth", String(s.auth ?? 0));
        setRow(dlGlass, "Warn", String(s.warn ?? 0));
        setRow(dlGlass, "Down", String(s.down ?? 0));
        setRow(dlGlass, "Skipped", String(s.skipped ?? 0));
        if (gs.json.timestamp) setRow(dlGlass, "Report time", String(gs.json.timestamp));
      } else {
        const reason =
          gs.json && gs.json.reason ? String(gs.json.reason) : gs.ok ? "empty" : "http " + gs.status;
        setRow(dlGlass, "Snapshot", reason);
      }

      clearDl(dlSx);
      if (sh.error) {
        setRow(dlSx, "Worker", sh.error === "timeout" ? "timeout" : "request failed");
      } else if (sh.json && sh.json.ok && sh.json.health && typeof sh.json.health === "object") {
        const wh = sh.json.health;
        const ah = Number(wh.agents_healthy);
        const at = Number(wh.agents_total);
        const agents =
          Number.isFinite(ah) && Number.isFinite(at) && at > 0 ? "agents " + ah + "/" + at : "agents —";
        let cronLine = "—";
        if (wh.cron != null) {
          const sj = JSON.stringify(wh.cron);
          cronLine = sj.length > 96 ? sj.slice(0, 96) + "…" : sj;
        }
        setRow(dlSx, "Worker", agents + " · cron " + cronLine);
      } else {
        const r2 = sh.json && sh.json.reason ? String(sh.json.reason) : sh.ok ? "no data" : "http " + sh.status;
        setRow(dlSx, "Worker", r2);
      }
      if (ss.error) {
        setRow(dlSx, "Runtime", ss.error === "timeout" ? "timeout" : "request failed");
      } else if (ss.json && ss.json.ok && ss.json.state && typeof ss.json.state === "object") {
        const st = ss.json.state;
        const maxRaw = Number(st.max_spoons);
        const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 12;
        const spoonsRaw = Number(st.current_spoons);
        const spoons = Number.isFinite(spoonsRaw) ? String(spoonsRaw) : "—";
        const qRaw = st.q_factor;
        const q =
          typeof qRaw === "number" && Number.isFinite(qRaw)
            ? qRaw.toFixed(2)
            : typeof qRaw === "string" && qRaw.trim()
              ? qRaw.trim()
              : "—";
        setRow(dlSx, "Runtime", spoons + "/" + max + " spoons · Q " + q);
      } else {
        setRow(dlSx, "Runtime", ss.json && ss.json.reason ? String(ss.json.reason) : "offline");
      }

      clearDl(dlGo);
      if (go.error) {
        setRow(dlGo, "Readout", go.error === "timeout" ? "timeout" : "request failed");
      } else if (go.json && go.json.ok === true && go.json.valve && typeof go.json.valve === "object") {
        const v = go.json.valve;
        const mode = String(v.mode || "—");
        const modeEl =
          mode === "apply"
            ? pill(mode, "warn")
            : mode === "dry-run"
              ? pill(mode, "warn")
              : mode === "closed"
                ? pill(mode, "")
                : pill(mode, "bad");
        setRow(dlGo, "Valve", modeEl);
        if (v.updatedAt) setRow(dlGo, "Updated", String(v.updatedAt));
        const le = go.json.lastEvent;
        if (le && typeof le.kind === "string") {
          const line =
            (typeof le.ts === "string" ? le.ts.slice(11, 19) + " " : "") + String(le.kind);
          setRow(dlGo, "Last event", line);
        } else {
          setRow(dlGo, "Last event", "—");
        }
        const rt = go.json.recentTail;
        if (Array.isArray(rt) && rt.length) {
          const parts = rt.slice(-5).map(function (ev) {
            const k = ev && typeof ev.kind === "string" ? ev.kind : "?";
            const t = ev && typeof ev.ts === "string" ? ev.ts.slice(11, 19) : "";
            return (t ? t + " " : "") + k.replace(/^github-org\./, "");
          });
          setRow(dlGo, "Event tail", parts.join(" · "));
        }
      } else {
        setRow(dlGo, "Readout", "unavailable");
      }

      while (ulDeploy.firstChild) ulDeploy.removeChild(ulDeploy.firstChild);
      const prev = cs.json && Array.isArray(cs.json.deployablePreview) ? cs.json.deployablePreview : [];
      if (!prev.length) {
        const li = document.createElement("li");
        li.textContent = "No preview (empty ecosystem list or unreachable).";
        ulDeploy.appendChild(li);
      } else {
        const cap = Math.min(prev.length, MAX_DEPLOY_PREVIEW);
        for (let i = 0; i < cap; i++) {
          const li = document.createElement("li");
          li.dataset.status = "unknown";
          li.title = "Deploy status not probed locally — needs `wrangler` to read live worker state.";
          li.textContent = String(prev[i]);
          ulDeploy.appendChild(li);
        }
        if (prev.length > MAX_DEPLOY_PREVIEW) {
          const li2 = document.createElement("li");
          li2.className = "od-list__more";
          li2.textContent = "… and " + (prev.length - MAX_DEPLOY_PREVIEW) + " more";
          ulDeploy.appendChild(li2);
        }
      }
    } finally {
      clearTimeout(timer);
      main.setAttribute("aria-busy", "false");
      if (hintEl) {
        hintEl.classList.remove("is-loading");
      }
    }
  }

  const pol = $("od-poll-interval");
  if (pol) {
    pol.textContent = String(Math.round(POLL_MS / 1000));
  }

  function runRefresh() {
    return refresh().catch(function (err) {
      const errEl = $("od-error");
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = "Refresh error: " + (err && err.message ? err.message : String(err));
      }
      const m = $("od-main");
      if (m) m.setAttribute("aria-busy", "false");
    });
  }

  const btn = $("od-refresh");
  if (btn) {
    btn.addEventListener("click", function () {
      void runRefresh();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.defaultPrevented) return;
    const tag = (e.target && e.target.nodeName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable)) {
      return;
    }
    if (e.key && e.key.length === 1 && e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      void runRefresh();
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") void runRefresh();
  });

  void runRefresh();
  setInterval(function () {
    if (document.visibilityState === "visible") void runRefresh();
  }, POLL_MS);
})();
