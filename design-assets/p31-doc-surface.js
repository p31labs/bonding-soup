/**
 * P31 doc surface — motion + scroll-spy wiring.
 *
 * One module that any `<body class="p31-doc">` page can load. It:
 *   1. Adds `.is-in` to every `.p31-doc-section` as it enters the viewport
 *      (stagger fade-in driven by intersection ratio).
 *   2. Drives TOC scroll-spy: the `.p31-doc-toc a` whose `href="#id"`
 *      points at the most-visible section gets `aria-current="location"`
 *      and `.is-active`.
 *   3. Fails quiet on reduced-motion or partial DOM (no `.p31-doc-toc`).
 *
 * No dependencies. ES module. Safe to include via `<script type="module" defer>`.
 *
 * Mount: this script self-mounts on DOMContentLoaded.
 */

(function () {
  "use strict";

  const root = document.body;
  if (!root || !root.classList || !root.classList.contains("p31-doc")) return;

  const reduced = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function paintAllVisibleNow() {
    document.querySelectorAll(".p31-doc-section").forEach(function (s) {
      s.classList.add("is-in");
    });
  }

  function wireSectionFadeIn(sections) {
    if (reduced || typeof IntersectionObserver !== "function") {
      sections.forEach(function (s) { s.classList.add("is-in"); });
      return;
    }
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.06) {
          e.target.classList.add("is-in");
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: [0, 0.06, 0.18] });
    sections.forEach(function (s) { obs.observe(s); });
  }

  function buildTocMap(toc) {
    /** @type {Array<{ link: HTMLAnchorElement, target: HTMLElement }>} */
    const pairs = [];
    toc.querySelectorAll('a[href^="#"]').forEach(function (link) {
      const id = (link.getAttribute("href") || "").slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) pairs.push({ link, target });
    });
    return pairs;
  }

  function wireScrollSpy(pairs) {
    if (!pairs.length || typeof IntersectionObserver !== "function") return;

    /** @type {Map<HTMLElement, number>} */
    const ratios = new Map();
    pairs.forEach(function (p) { ratios.set(p.target, 0); });

    function applyActive() {
      let bestEl = null;
      let bestRatio = 0;
      ratios.forEach(function (r, el) {
        if (r > bestRatio) { bestRatio = r; bestEl = el; }
      });
      pairs.forEach(function (p) {
        const isActive = p.target === bestEl;
        if (isActive) {
          p.link.setAttribute("aria-current", "location");
          p.link.classList.add("is-active");
        } else {
          if (p.link.getAttribute("aria-current") === "location") {
            p.link.removeAttribute("aria-current");
          }
          p.link.classList.remove("is-active");
        }
      });
    }

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
      });
      applyActive();
    }, {
      rootMargin: "-25% 0px -55% 0px",
      threshold: [0, 0.08, 0.22, 0.5, 0.85, 1]
    });
    pairs.forEach(function (p) { obs.observe(p.target); });
    applyActive();
  }

  /* Cosmetic command-line tokenizer.
   * Wraps recognized fragments in <b class="p31-tok-*"> so the shared CSS
   * can color them. Idempotent (skips elements that already have a child
   * with the marker class). Only operates on the leading text node so
   * inline <button class="p31-doc-copy"> stays untouched. */
  const CMD_KEYWORDS = new Set([
    "npm", "pnpm", "node", "git", "wrangler", "cd", "ls", "curl", "echo",
    "cat", "rm", "mv", "cp", "mkdir", "ssh", "scp", "head", "tail", "awk",
    "grep", "rg", "bash", "sh"
  ]);
  const FLAG_KEYWORDS = new Set([
    "run", "install", "test", "build", "deploy", "verify", "release",
    "start", "publish", "ci", "audit", "check"
  ]);

  function tokenizeCmdLine(text) {
    const out = [];
    const re = /(\s+|"[^"]*"|'[^']*'|--?[A-Za-z][\w-]*=?[^\s]*|[A-Za-z_][\w-]*=[^\s]*|\S+)/g;
    let m;
    let firstWord = true;
    while ((m = re.exec(text)) !== null) {
      const tok = m[0];
      if (/^\s+$/.test(tok)) {
        out.push({ kind: "ws", text: tok });
        continue;
      }
      if (/^[A-Z][A-Z0-9_]*=/.test(tok)) {
        out.push({ kind: "env", text: tok });
        continue;
      }
      if (firstWord && CMD_KEYWORDS.has(tok)) {
        out.push({ kind: "cmd", text: tok });
        firstWord = false;
        continue;
      }
      if (firstWord && /^[a-z][\w-]*$/.test(tok)) {
        out.push({ kind: "cmd", text: tok });
        firstWord = false;
        continue;
      }
      if (FLAG_KEYWORDS.has(tok) || /^--?[A-Za-z]/.test(tok)) {
        out.push({ kind: "flag", text: tok });
        continue;
      }
      if (/^\.{1,2}\//.test(tok) || /^\//.test(tok) || /\.[a-z]{1,5}$/i.test(tok)) {
        out.push({ kind: "path", text: tok });
        continue;
      }
      out.push({ kind: "text", text: tok });
    }
    return out;
  }

  function tokenizeCmdElement(el) {
    if (el.dataset && el.dataset.p31Tokenized === "1") return;
    let textNode = null;
    for (const node of Array.prototype.slice.call(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
        textNode = node;
        break;
      }
    }
    if (!textNode) return;
    const raw = textNode.textContent;
    const parts = tokenizeCmdLine(raw);
    if (!parts.length) return;
    const frag = document.createDocumentFragment();
    parts.forEach(function (p) {
      if (p.kind === "ws" || p.kind === "text") {
        frag.appendChild(document.createTextNode(p.text));
      } else {
        const b = document.createElement("b");
        b.className = "p31-tok-" + p.kind;
        b.textContent = p.text;
        frag.appendChild(b);
      }
    });
    el.replaceChild(frag, textNode);
    if (el.dataset) el.dataset.p31Tokenized = "1";
  }

  function wireCmdTokenizer() {
    document.querySelectorAll(".p31-doc-cmd").forEach(tokenizeCmdElement);
  }

  ready(function () {
    const sections = Array.prototype.slice.call(
      document.querySelectorAll(".p31-doc-section")
    );
    if (sections.length) {
      wireSectionFadeIn(sections);
    } else {
      paintAllVisibleNow();
    }

    const toc = document.querySelector(".p31-doc-toc");
    if (toc) {
      const pairs = buildTocMap(toc);
      if (pairs.length) wireScrollSpy(pairs);
    }

    wireCmdTokenizer();
  });
})();
