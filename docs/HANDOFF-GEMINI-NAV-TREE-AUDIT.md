# Navigation tree audit and static crawler semantics

**Status:** ALIGNED (behavior matches this document as of last edit; verify against `scripts/build-nav-tree-report.mjs` if in doubt.)

**Target:** `scripts/build-nav-tree-report.mjs`

**Outputs:** `docs/P31-USER-NAV-TREE.md`, `docs/generated/nav-edges-bonding.tsv`, and `docs/generated/nav-edges-p31ca-public.tsv` when `andromeda/04_SOFTWARE/p31ca/public/` is present.

**Regenerate:** `npm run nav:report`

Do **not** paste a full copy of the script into this file; the script is the single source of truth. This handoff describes **behavioral contracts** only.

---

## Core model

The offline crawler treats static `.html` files as **vertices** and `<a href>` elements as **directed edges** after string extraction and resolution. It is not a headless browser.

---

## Extraction and sanitization

**Pre-strip:** Before regex evaluation, the crawler strips HTML comments, `<script>`, `<style>`, and `<template>`. That avoids phantom edges from inert template contents, comments, and embedded code.

**Anchor regex:** Hrefs are matched with a pattern that allows **quoted or unquoted** HTML5 attributes (see `HREF_RE` in the script). Unquoted paths like `<a href=connect.html>` are included.

**Ignored:** Interpolated template fragments (`${…}`, `{%…%}`), obvious build-time patterns containing `href.replace`, `javascript:` and `blob:` URLs.

---

## Graph adjacency and edge deduplication

**Shape:** `Map<string, Map<string, string>>` — `from_page → resolved_target → sample_raw_href`.

**Rule:** Edges are keyed by the **resolved POSIX path** of the target `.html` file, not by the raw `href` string. Equivalents such as `page.html` and `./page.html` merge into one edge; out-degree and TSV rows reflect distinct resolved targets.

---

## `suppressDescent` bookkeeping

When `suppressDescentRelPrefixes` is set (e.g. `andromeda/` for the Bonding crawl from repo root):

- Edges **into** a suppressed prefix are still **recorded** in the adjacency map.
- The target is **added to `reachable`** so it is not misclassified as an orphan.
- The target is **not enqueued** for BFS, so pages under that prefix are not opened from the “outside” crawl (avoids wrong-root resolution for hub-style `/` links).

**Copy in reports** that say suppressed targets remain “reachable” from outside is accurate: reachable means “known as a graph endpoint,” not “crawled.”

---

## Cloudflare `_redirects` resolution

- Source keys from `_redirects` are **normalized** for lookup: trailing slashes are stripped except for the root `/`.
- Absolute paths (`href` starting with `/`) use `resolveAbsPathAgainstRoot` with that map.
- **Relative** links that fail direct filesystem resolution are retried by mapping the path under `webRootAbs` to a root-relative form and consulting the same redirect logic before reporting **broken**.
- **Parsing:** Rows are parsed with a strict pattern first; human-entered lines with **unencoded spaces** in the source path may still mis-parse (use `%20` in `_redirects`).

---

## Intentional scope limits (known false negatives)

To keep the tool fast and limited to **static string analysis of user-facing anchor tags**, the following are **out of scope** unless the tool’s mandate changes:

- `<iframe src="…">`
- `<meta http-equiv="refresh" content="…; url=…">`
- `<area href="…">` image maps
- Client-side navigation (`window.location`, `onclick`, etc.)
- Astro or other frameworks’ **dynamic** routes that do not emit a static `.html` file on disk

Expanding into those areas implies **headless browsing** (e.g. Playwright/Puppeteer), which is a different product than this offline auditor.

---

## Optional review prompt (external models)

Use when asking another model to audit the **implementation** (not to restate this contract):

```text
You are reviewing scripts/build-nav-tree-report.mjs — an offline HTML link auditor for the P31 C.A.R.S. repo and optional p31ca public/ crawl.

Read the file on disk. Compare behavior to docs/HANDOFF-GEMINI-NAV-TREE-AUDIT.md (semantics contract). Report: bugs vs that contract, edge cases (redirects, relative paths, suppression), and whether scope limits are still appropriate. Do not propose headless crawling unless the operator asks.
```

---

## Regenerate artifacts (operator)

```bash
npm run nav:report
```

Writes `docs/P31-USER-NAV-TREE.md` and the generated TSV files under `docs/generated/`.
