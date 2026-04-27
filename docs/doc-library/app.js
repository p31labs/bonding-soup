/**
 * P31 document library: Minisearch in a Web Worker, snippets, URL sync, Enter to snapshot history.
 * Index: p31.docLibrary/1.0.0 (docs/doc-library/index.json).
 */
(function () {
  "use strict";

  const input = document.getElementById("q");
  const resultsEl = document.getElementById("results");
  const meta = document.getElementById("meta");
  const metaHint = document.getElementById("meta-hint");
  const clearBtn = document.getElementById("clear-q");
  const mainEl = document.getElementById("main");
  const searchBlock = document.getElementById("search-block");
  const footHint = document.getElementById("foot-hint");
  const tryChips = document.getElementById("try-chips");
  const comfortLine = document.getElementById("comfort-line");

  const baseTitle = document.title;

  /** One line per “session day” (UTC) so it feels personal but not noisy. */
  const COMFORT_PHRASES = [
    "No rush. One word, one chip, or plain browsing — all valid.",
    "The chips are a soft on-ramp if picking a search word feels like work.",
    "All of this is for you. Search is a shortcut; scrolling is not failure.",
    "Tired? Tap one chip. That still counts as progress.",
    "Nothing here is timed or graded. Find one link that helps, that is enough.",
  ];
  let worker = null;
  let workerReady = false;
  let searchSeq = 0;
  let activeSearchId = 0;
  let docs = [];
  let byId = new Map();
  let total = 0;
  let indexWhen = "";
  let debounceT;
  let skipUrl = false;

  function esc(s) {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function safeQuery(q) {
    return String(q).replace(/[\n\r\u2028\u2029]+/g, " ").slice(0, 200);
  }

  /** Word-like runs (Unicode) with ASCII fallback for engines without \\p. */
  let reUnicodeWord = null;
  try {
    reUnicodeWord = new RegExp("[\\p{L}\\p{N}]+", "gu");
  } catch (e) {
    reUnicodeWord = null;
  }
  function simpleTokens(q) {
    const s = String(q).toLowerCase();
    if (reUnicodeWord) {
      return s.match(reUnicodeWord) || [];
    }
    return s.match(/[a-z0-9_]+/g) || [];
  }

  function fileHref(relPath) {
    const segs = relPath.split("/").map(encodeURIComponent);
    return "../../" + segs.join("/");
  }

  function makeUrlWithQ(qS) {
    const u = new URL(window.location.href);
    if (qS) u.searchParams.set("q", qS);
    else u.searchParams.delete("q");
    return u.pathname + u.search + u.hash;
  }

  function urlReplaceForQuery(qS) {
    if (typeof history === "undefined" || !history.replaceState) return;
    const next = makeUrlWithQ(qS);
    const cur = window.location.pathname + window.location.search + window.location.hash;
    if (next === cur) return;
    const st = history.state && typeof history.state === "object" ? history.state : {};
    history.replaceState(Object.assign({ p31q: qS || "" }, st), "", next);
  }

  function historyPushOnEnter() {
    if (typeof history === "undefined" || !history.pushState) return;
    const qS = input ? safeQuery(String(input.value).trim()) : "";
    if (!qS) return;
    const next = makeUrlWithQ(qS);
    history.pushState({ p31q: qS, p31lib: 1 }, "", next);
  }

  function updateMeta(visible, q) {
    const qSafe = q ? safeQuery(q) : "";
    const indexBit = "Index " + indexWhen;
    if (metaHint) metaHint.hidden = !qSafe;
    if (!qSafe) {
      meta.textContent =
        "All " +
        total +
        " document" +
        (total === 1 ? "" : "s") +
        " — " +
        indexBit +
        ". Type a word, or try a chip — flow your own way.";
      document.title = baseTitle;
      setFootHint(total > 3);
      return;
    }
    setFootHint(false);
    if (visible === 0) {
      meta.textContent =
        "No match for \u201c" +
        qSafe +
        "\u201d · " +
        indexBit +
        " — try a chip or a shorter word.";
    } else {
      meta.innerHTML =
        "Found <strong>" +
        visible +
        "</strong> of " +
        total +
        " · " +
        indexBit;
    }
    const short = qSafe.length > 48 ? qSafe.slice(0, 45) + "…" : qSafe;
    document.title = short + " · " + baseTitle;
  }

  function setClearVisible(on) {
    if (clearBtn) clearBtn.hidden = !on;
  }

  function setSearchBusy(on) {
    if (searchBlock) {
      if (on) searchBlock.classList.add("is-searching");
      else searchBlock.classList.remove("is-searching");
    }
  }

  function setFootHint(visible) {
    if (footHint) footHint.hidden = !visible;
  }

  function showComfort() {
    if (!comfortLine || !COMFORT_PHRASES.length) return;
    const day = Math.floor(Date.now() / 86400000);
    const idx = (day + (total | 0)) % COMFORT_PHRASES.length;
    comfortLine.textContent = COMFORT_PHRASES[idx];
    comfortLine.hidden = false;
  }

  function showResultSkeleton() {
    const bones = '<div class="skel-bone" aria-hidden="true"></div>'.repeat(4);
    resultsEl.innerHTML =
      '<div class="skel" role="status" aria-label="Preparing the index">' + bones + "</div>";
  }

  function highlightPlain(raw, terms, q) {
    if (!raw) return "";
    const tset = new Set(terms.map((t) => String(t).toLowerCase()).filter(Boolean));
    for (const t of simpleTokens(q)) tset.add(t);
    const uniq = [...tset].filter((t) => t.length).slice(0, 32);
    if (!uniq.length) return esc(raw);
    const re = new RegExp(uniq.map(escapeRe).join("|"), "gi");
    const s = String(raw);
    const parts = [];
    let last = 0;
    if (s.matchAll) {
      for (const m of s.matchAll(re)) {
        if (m.index == null) break;
        parts.push(esc(s.slice(last, m.index)));
        parts.push('<mark class="hi">' + esc(m[0]) + "</mark>");
        last = m.index + m[0].length;
      }
    } else {
      let m;
      re.lastIndex = 0;
      const max = 400;
      let g = 0;
      while (g++ < max && (m = re.exec(s)) !== null) {
        if (m.index == null) break;
        parts.push(esc(s.slice(last, m.index)));
        parts.push('<mark class="hi">' + esc(m[0]) + "</mark>");
        last = m.index + m[0].length;
        if (m[0] === "") re.lastIndex += 1;
      }
    }
    parts.push(esc(s.slice(last)));
    return parts.join("");
  }

  function makeSnippetBody(text, terms, q) {
    if (!text) return { html: esc(""), plain: 1 };
    const low = text.toLowerCase();
    const tset = new Set(terms.map((t) => String(t).toLowerCase()).filter((x) => x.length > 0));
    for (const t of simpleTokens(q)) tset.add(t);
    const uniq = [...tset].filter((t) => t.length);
    let start = 0;
    for (const t of uniq) {
      const i = low.indexOf(t);
      if (i !== -1) {
        start = Math.max(0, i - 80);
        break;
      }
    }
    if (!uniq.length) {
      const head = text.length > 220 ? text.slice(0, 220) + "…" : text;
      return { html: esc(head), plain: 1 };
    }
    const a = start;
    const b = Math.min(text.length, start + 220);
    const slice = text.slice(a, b);
    const prefix = a > 0 ? "…" : "";
    const suffix = b < text.length ? "…" : "";
    return { html: prefix + highlightPlain(slice, terms, q) + suffix, plain: 1 };
  }

  function renderList(items, query, hitMetas) {
    const q = query ? safeQuery(query) : "";
    const hmap = hitMetas ? new Map(hitMetas.map((h) => [h.id, h])) : new Map();
    if (!items.length) {
      if (q) {
        resultsEl.innerHTML =
          '<div class="empty-state" role="status">' +
          '<h2 class="empty-lead">Nothing with that exact shape</h2>' +
          "<p class=\"empty-sub\">No direct hits for <strong>" +
          esc(q) +
          "</strong> — a shorter word, a chip above, or " +
          '<button type="button" class="btn-inline-clear" data-empty-clear>clear the box</button> to see everything.</p></div>';
        const clearEmpty = resultsEl.querySelector("[data-empty-clear]");
        if (clearEmpty) clearEmpty.addEventListener("click", clearSearch, { once: true });
        return;
      }
      resultsEl.innerHTML = '<p class="empty" role="status">No documents in index.</p>';
      return;
    }
    const rows = items.map((d, i) => {
      const href = fileHref(d.path);
      const hm = hmap.get(d.id);
      const tlist = (hm && hm.terms) || [];
      const h2s =
        Array.isArray(d.h2) && d.h2.length
          ? d.h2.slice(0, 6).join(" · ") + (d.h2.length > 6 ? "…" : "")
          : "";
      const h2 = h2s
        ? "<p class=\"h2\">" + (q ? highlightPlain(h2s, tlist, q) : esc(h2s)) + "</p>"
        : "";
      const titleHtml = q ? highlightPlain(d.title, tlist, q) : esc(d.title);
      const body = q
        ? makeSnippetBody(d.text || "", tlist, q)
        : { html: esc(d.preview || ""), plain: 1 };
      const rank = i + 1;
      return (
        "<li class=\"hit\" style=\"--stagger: " +
        i +
        "\" role=\"listitem\" aria-label=\"Result " +
        rank +
        " of " +
        items.length +
        '">' +
        '<span class="hit-badge" aria-hidden="true">' +
        rank +
        "</span>" +
        "<article class=\"hit-inner\">" +
        "<a class=\"title\" href=\"" +
        esc(href) +
        '" title="Open: ' +
        esc(d.title).replace(/"/g, "&quot;") +
        '">' +
        titleHtml +
        "</a>" +
        '<div class="path">' +
        esc(d.path) +
        "</div>" +
        h2 +
        '<p class="preview">' +
        body.html +
        "</p>" +
        "</article></li>"
      );
    });
    resultsEl.innerHTML = '<ol class="hits" role="list" aria-label="Documents">' + rows.join("") + "</ol>";
  }

  function runQuery() {
    if (!workerReady || !worker) {
      setSearchBusy(false);
      return;
    }
    const q = input && input.value != null ? String(input.value).trim() : "";
    const qS = q ? safeQuery(q) : "";
    if (q && !qS && input) input.value = qS;
    if (!qS) {
      if (skipUrl) {
        skipUrl = false;
      } else {
        urlReplaceForQuery("");
      }
      setClearVisible(false);
      renderList(docs, "", null);
      updateMeta(docs.length, "");
      setSearchBusy(false);
      return;
    }
    if (skipUrl) {
      skipUrl = false;
    } else {
      urlReplaceForQuery(qS);
    }
    setClearVisible(true);
    setSearchBusy(true);
    const myId = ++searchSeq;
    activeSearchId = myId;
    worker.postMessage({ type: "search", q: qS, reqId: myId });
  }

  function onSearchResults(m) {
    if (m.reqId != null && m.reqId !== activeSearchId) return;
    if (m.type === "searchError") {
      meta.textContent = "Search error: " + (m.message || "unknown");
      setSearchBusy(false);
      return;
    }
    if (m.type !== "results" || m.q == null) return;
    const out = [];
    const metas = [];
    const list = m.hits || [];
    for (let i = 0; i < list.length; i++) {
      const h = list[i];
      const d = byId.get(h.id);
      if (d) {
        out.push(d);
        metas.push(h);
      }
    }
    renderList(out, m.q, metas);
    updateMeta(out.length, m.q);
    setSearchBusy(false);
  }

  function clearSearch() {
    if (input) input.value = "";
    if (input) input.focus();
    runQuery();
  }

  function scheduleQuery() {
    setSearchBusy(true);
    clearTimeout(debounceT);
    debounceT = setTimeout(runQuery, 120);
  }

  function focusFirstHitLink() {
    const a = document.querySelector("#results ol.hits a.title");
    if (a) a.focus();
  }

  if (input) {
    input.addEventListener("input", scheduleQuery);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        focusFirstHitLink();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        historyPushOnEnter();
        clearTimeout(debounceT);
        setSearchBusy(true);
        runQuery();
      }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", clearSearch);
  }

  if (resultsEl) {
    resultsEl.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const t = e.target;
      if (!t || t.tagName !== "A" || !t.classList.contains("title")) return;
      const li = t.closest("li.hit");
      if (!li) return;
      const list = li.parentElement;
      if (!list || list.tagName !== "OL") return;
      const items = list.querySelectorAll("li.hit a.title");
      const i = Array.prototype.indexOf.call(items, t);
      if (i === -1) return;
      if (e.key === "ArrowUp" && i === 0) {
        e.preventDefault();
        if (input) input.focus();
        return;
      }
      const next = e.key === "ArrowDown" ? items[i + 1] : items[i - 1];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = e.target;
      const tag = t && t.tagName;
      const editable =
        t &&
        (tag === "INPUT" ||
          tag === "TEXTAREA" ||
          t.isContentEditable === true);
      if (editable) return;
      e.preventDefault();
      if (input) input.focus();
    }
    if (e.key === "Escape" && input && String(input.value).trim()) {
      const t = e.target;
      const tag = t && t.tagName;
      const inEditable =
        t &&
        (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable === true);
      if (inEditable && t !== input) return;
      if (document.activeElement === input) {
        if (input.value) {
          e.preventDefault();
          clearSearch();
        }
        return;
      }
      e.preventDefault();
      clearSearch();
    }
  });

  window.addEventListener("popstate", function () {
    if (!input || !workerReady) return;
    const p = new URLSearchParams(window.location.search).get("q");
    const fromUrl = p != null ? String(p) : "";
    const h = history.state;
    const fromState = h && h.p31q != null ? String(h.p31q) : null;
    const next = fromState != null ? fromState : fromUrl;
    skipUrl = true;
    input.value = next;
    clearTimeout(debounceT);
    runQuery();
  });

  function onLoadFailure(text) {
    if (mainEl) mainEl.setAttribute("aria-busy", "false");
    setSearchBusy(false);
    setFootHint(false);
    document.body.classList.add("lib-ready");
    meta.innerHTML =
      '<span class="err">Search index could not be built. ' + esc(text) + "</span>";
  }

  function wireWorker() {
    if (typeof Worker === "undefined") {
      onLoadFailure("Web Worker not available in this context.");
      return;
    }
    try {
      worker = new Worker("doc-search-worker.js");
    } catch (e) {
      onLoadFailure((e && e.message) || String(e));
      return;
    }
    worker.addEventListener("message", function (e) {
      const m = e.data;
      if (!m) return;
      if (m.type === "ready") {
        workerReady = true;
        if (mainEl) mainEl.setAttribute("aria-busy", "false");
        document.body.classList.add("lib-ready");
        showComfort();
        const params = new URLSearchParams(window.location.search);
        const q0 = params.get("q");
        if (q0 != null && String(q0) !== "" && input) {
          input.value = String(q0);
        }
        runQuery();
        return;
      }
      if (m.type === "loadError") {
        onLoadFailure(m.message || "load error");
        return;
      }
      if (m.type === "results" || m.type === "searchError") {
        onSearchResults(m);
      }
    });
    worker.addEventListener("error", function (e) {
      onLoadFailure((e && e.message) || "Worker script error");
    });
  }

  if (tryChips) {
    tryChips.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest && e.target.closest("button.chip");
      if (!btn || !input) return;
      const t = btn.getAttribute("data-try");
      if (t == null) return;
      e.preventDefault();
      input.value = t;
      input.focus();
      clearTimeout(debounceT);
      setSearchBusy(true);
      if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
        btn.classList.add("chip-joy");
        const onEnd = function () {
          btn.classList.remove("chip-joy");
          btn.removeEventListener("animationend", onEnd);
        };
        btn.addEventListener("animationend", onEnd);
        setTimeout(function () {
          btn.removeEventListener("animationend", onEnd);
          btn.classList.remove("chip-joy");
        }, 600);
      }
      runQuery();
    });
  }

  function onIndexPathFailure() {
    if (mainEl) mainEl.setAttribute("aria-busy", "false");
    setSearchBusy(false);
    setFootHint(false);
    document.body.classList.add("lib-ready");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    wireWorker();
    if (!worker) return;
    showResultSkeleton();

    let res;
    try {
      res = await fetch("index.json", { cache: "no-store" });
    } catch (e) {
      onIndexPathFailure();
      if (resultsEl) {
        resultsEl.innerHTML =
          '<p class="empty" role="status">Could not load <code>index.json</code>. Use <code>npm run demo</code> from the repo root (not <code>file://</code>).</p>';
      }
      meta.innerHTML =
        '<span class="err">Could not fetch index.json.</span> Use <code>npm run demo</code> from the repo root, not file://. Run <code>npm run build:doc-index</code> if the file is missing.';
      return;
    }
    if (!res.ok) {
      onIndexPathFailure();
      if (resultsEl) {
        resultsEl.innerHTML =
          '<p class="empty" role="status">Missing <code>index.json</code> — run <code>npm run build:doc-index</code> from the repo root.</p>';
      }
      meta.innerHTML =
        'Missing <code>index.json</code> — run <code>npm run build:doc-index</code> from the repo root.';
      return;
    }
    const data = await res.json();
    if (data.schema !== "p31.docLibrary/1.0.0") {
      onIndexPathFailure();
      if (resultsEl) {
        resultsEl.innerHTML =
          '<p class="empty" role="status">This page needs a current document index. Run <code>npm run build:doc-index</code>.</p>';
      }
      meta.textContent = "Invalid index.json schema.";
      return;
    }
    docs = data.documents || [];
    byId = new Map(docs.map((d) => [d.id, d]));
    total = data.count || 0;
    const when = (data.generatedAt || "").replace("T", " ");
    indexWhen = when.length >= 19 ? when.slice(0, 19) : when || "—";
    meta.textContent =
      "Preparing " +
      total +
      " document" +
      (total === 1 ? "" : "s") +
      " for search — " +
      indexWhen;

    showResultSkeleton();
    worker.postMessage({ type: "load", documents: docs });
  });
})();
