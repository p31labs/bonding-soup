/**
 * P31 Physics Learn — eight-room interactives (no framework).
 * Honors prefers-reduced-motion via html.pl-reduced-motion (set on load + change).
 */
(function () {
  "use strict";

  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  function syncMotion() {
    root.classList.toggle("pl-reduced-motion", mq.matches);
  }
  syncMotion();
  mq.addEventListener("change", syncMotion);

  /* ----- Room 1: square vs rigid triangle ----- */
  (function rigidity() {
    const host = document.getElementById("codec-rigidity");
    if (!host) return;
    const svg = host.querySelector("svg");
    if (!svg) return;
    const sqPoly = host.querySelector("[data-role='sq-poly']");
    const triG = host.querySelector("[data-role='tri-group']");
    const triPoly = host.querySelector("[data-role='tri-poly']");
    const sqPts = [
      { x: 40, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 40 },
      { x: 40, y: 40 },
    ];
    const triBase = [
      { x: 200, y: 100 },
      { x: 260, y: 100 },
      { x: 230, y: 48 },
    ];
    let dragSq = -1;
    let dragTri = false;
    let triOx = 0,
      triOy = 0,
      triAng = 0,
      startAng = 0;
    const cx = (triBase[0].x + triBase[1].x + triBase[2].x) / 3;
    const cy = (triBase[0].y + triBase[1].y + triBase[2].y) / 3;

    function setSq() {
      const s = sqPts.map((p) => p.x + "," + p.y).join(" ");
      sqPoly.setAttribute("points", s);
      for (let i = 0; i < 4; i++) {
        const h = host.querySelector("[data-sq='" + i + "']");
        if (h) {
          h.setAttribute("cx", sqPts[i].x);
          h.setAttribute("cy", sqPts[i].y);
        }
      }
    }
    function rot(p, ang, ox, oy) {
      const c = Math.cos(ang),
        s = Math.sin(ang);
      const x = p.x - ox,
        y = p.y - oy;
      return { x: ox + x * c - y * s, y: oy + x * s + y * c };
    }
    function setTri() {
      const t = triBase.map((p) => rot(p, triAng, cx, cy));
      triPoly.setAttribute("points", t.map((p) => p.x + "," + p.y).join(" "));
      for (let i = 0; i < 3; i++) {
        const h = host.querySelector("[data-tri='" + i + "']");
        if (h) {
          h.setAttribute("cx", t[i].x);
          h.setAttribute("cy", t[i].y);
        }
      }
    }
    setSq();
    setTri();

    function hitSq(ev) {
      const r = svg.getBoundingClientRect();
      const sx = ((ev.clientX - r.left) / r.width) * 320;
      const sy = ((ev.clientY - r.top) / r.height) * 160;
      let best = -1,
        bd = 1e9;
      for (let i = 0; i < 4; i++) {
        const d = Math.hypot(sx - sqPts[i].x, sy - sqPts[i].y);
        if (d < bd && d < 14) {
          bd = d;
          best = i;
        }
      }
      return best;
    }
    function hitTri(ev) {
      const r = svg.getBoundingClientRect();
      const sx = ((ev.clientX - r.left) / r.width) * 320;
      const sy = ((ev.clientY - r.top) / r.height) * 160;
      const t = tri.map((p) => rot(p, triAng, cx, cy));
      for (let i = 0; i < 3; i++) {
        if (Math.hypot(sx - t[i].x, sy - t[i].y) < 14) return true;
      }
      return false;
    }

    svg.addEventListener("pointerdown", (ev) => {
      dragSq = hitSq(ev);
      if (dragSq >= 0) {
        svg.setPointerCapture(ev.pointerId);
        return;
      }
      if (hitTri(ev)) {
        dragTri = true;
        const r = svg.getBoundingClientRect();
        const sx = ((ev.clientX - r.left) / r.width) * 320;
        const sy = ((ev.clientY - r.top) / r.height) * 160;
        triOx = sx;
        triOy = sy;
        startAng = triAng;
        svg.setPointerCapture(ev.pointerId);
      }
    });
    svg.addEventListener("pointermove", (ev) => {
      if (dragSq >= 0) {
        const r = svg.getBoundingClientRect();
        const sx = ((ev.clientX - r.left) / r.width) * 320;
        const sy = ((ev.clientY - r.top) / r.height) * 160;
        sqPts[dragSq].x = Math.max(10, Math.min(150, sx));
        sqPts[dragSq].y = Math.max(10, Math.min(150, sy));
        setSq();
      } else if (dragTri) {
        const r = svg.getBoundingClientRect();
        const sx = ((ev.clientX - r.left) / r.width) * 320;
        const sy = ((ev.clientY - r.top) / r.height) * 160;
        triAng = startAng + Math.atan2(sy - cy, sx - cx) - Math.atan2(triOy - cy, triOx - cx);
        setTri();
      }
    });
    function end(ev) {
      dragSq = -1;
      dragTri = false;
      try {
        svg.releasePointerCapture(ev.pointerId);
      } catch (e) {
        void e;
      }
    }
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  })();

  /* ----- Room 2: tetrahedron drag + K4 pulse ----- */
  (function tetra() {
    const stage = document.getElementById("codec-tetra-stage");
    if (!stage) return;
    let rx = 0.35,
      ry = -0.4,
      dragging = false,
      lx = 0,
      ly = 0,
      lrx = 0,
      lry = 0;
    const verts = [
      [0, 1, 0],
      [-0.94, -0.33, 0],
      [0.47, -0.33, -0.82],
      [0.47, -0.33, 0.82],
    ];
    const edges = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const proj = (v, a, b) => {
      const x = v[0],
        y = v[1],
        z = v[2];
      const xa = x * Math.cos(a) - z * Math.sin(a);
      const za = x * Math.sin(a) + z * Math.cos(a);
      const ya = y * Math.cos(b) - za * Math.sin(b);
      const za2 = y * Math.sin(b) + za * Math.cos(b);
      return { x: 100 + xa * 68, y: 88 + ya * 68 };
    };
    function draw() {
      const lines = stage.querySelectorAll("[data-edge]");
      const pts = verts.map((v) => proj(v, rx, ry));
      edges.forEach((e, i) => {
        const el = lines[i];
        if (!el) return;
        const a = pts[e[0]],
          b = pts[e[1]];
        el.setAttribute("x1", a.x);
        el.setAttribute("y1", a.y);
        el.setAttribute("x2", b.x);
        el.setAttribute("y2", b.y);
      });
      pts.forEach((p, i) => {
        const c = stage.querySelector("[data-vert='" + i + "']");
        if (c) {
          c.setAttribute("cx", p.x);
          c.setAttribute("cy", p.y);
        }
      });
    }
    function tick() {
      if (!dragging && !root.classList.contains("pl-reduced-motion")) {
        rx += 0.004;
        ry += 0.0025;
      }
      draw();
      requestAnimationFrame(tick);
    }
    stage.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("[data-role='tetra-rot']") || ev.target === stage) {
        dragging = true;
        lx = lrx = ev.clientX;
        ly = lry = ev.clientY;
        stage.setPointerCapture(ev.pointerId);
      }
    });
    stage.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      rx += (ev.clientX - lrx) * 0.012;
      ry += (ev.clientY - lry) * 0.012;
      lrx = ev.clientX;
      lry = ev.clientY;
      lx = ev.clientX;
      ly = ev.clientY;
      draw();
    });
    function endT(ev) {
      dragging = false;
      try {
        stage.releasePointerCapture(ev.pointerId);
      } catch (e) {
        void e;
      }
    }
    stage.addEventListener("pointerup", endT);
    stage.addEventListener("pointercancel", endT);
    tick();
  })();

  /* ----- Room 3: frequency slider + optional tone ----- */
  (function freq() {
    const slider = document.getElementById("codec-freq-slider");
    const wave = document.getElementById("codec-wave-path");
    const hit = document.getElementById("codec-larmor-hit");
    const label = document.getElementById("codec-freq-readout");
    const playBtn = document.getElementById("codec-larmor-play");
    if (!slider || !wave) return;

    let audioCtx = null;
    function updateWave() {
      const hz = Number(slider.value);
      if (label) label.textContent = Math.round(hz) + " Hz";
      const w = 280;
      const mid = 40;
      const amp = 22;
      const cycles = (hz / 863) * 2.2;
      let d = "M 0 " + mid;
      for (let x = 0; x <= w; x += 4) {
        const t = (x / w) * cycles * Math.PI * 2;
        d += " L " + x + " " + (mid + Math.sin(t) * amp);
      }
      wave.setAttribute("d", d);
      const near = Math.abs(hz - 863) <= 12;
      if (hit) hit.hidden = !near;
      slider.dataset.larmorNear = near ? "1" : "0";
    }
    slider.addEventListener("input", updateWave);
    updateWave();

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          if (!audioCtx) audioCtx = new AC();
          if (audioCtx.state === "suspended") audioCtx.resume();
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.type = "sine";
          o.frequency.value = 863;
          g.gain.value = 0.0001;
          o.connect(g);
          g.connect(audioCtx.destination);
          const t0 = audioCtx.currentTime;
          g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0);
          o.start(t0);
          o.stop(t0 + 1.02);
          playBtn.dataset.played = "1";
        } catch (e) {
          void e;
        }
      });
    }
  })();

  /* ----- Room 4: molecule drag (2D fake) ----- */
  (function mol() {
    const stage = document.getElementById("codec-mol-stage");
    if (!stage) return;
    const g = stage.querySelector("[data-role='mol-spin']");
    let ang = 0,
      drag = false,
      lx = 0;
    function apply() {
      if (g) g.setAttribute("transform", "rotate(" + (ang * 180) / Math.PI + " 100 70)");
    }
    apply();
    stage.addEventListener("pointerdown", (ev) => {
      drag = true;
      lx = ev.clientX;
      stage.setPointerCapture(ev.pointerId);
    });
    stage.addEventListener("pointermove", (ev) => {
      if (!drag) return;
      ang += (ev.clientX - lx) * 0.01;
      lx = ev.clientX;
      apply();
    });
    function end(ev) {
      drag = false;
      try {
        stage.releasePointerCapture(ev.pointerId);
      } catch (e) {
        void e;
      }
    }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  })();

  /* ----- Room 5: spoons ----- */
  (function spoons() {
    const row = document.getElementById("codec-spoons-row");
    const acts = document.getElementById("codec-spoon-acts");
    const refill = document.getElementById("codec-spoon-refill");
    const setDay = document.getElementById("codec-spoon-day");
    if (!row || !acts) return;
    const max = 12;
    let n = max;
    function paint() {
      row.innerHTML = "";
      for (let i = 0; i < max; i++) {
        const c = document.createElement("span");
        c.className = "codec-spoon" + (i < n ? " is-full" : "");
        c.setAttribute("role", "img");
        c.setAttribute("aria-label", i < n ? "spoon available" : "empty");
        row.appendChild(c);
      }
      row.dataset.remaining = String(n);
    }
    paint();
    acts.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-cost]");
      if (!b) return;
      const cost = Number(b.getAttribute("data-cost"));
      if (cost > 0 && n >= cost) {
        n -= cost;
        paint();
      }
    });
    if (refill)
      refill.addEventListener("click", () => {
        n = max;
        paint();
      });
    if (setDay)
      setDay.addEventListener("click", () => {
        n = 5;
        paint();
      });
  })();

  /* ----- Room 6: serialization toggle ----- */
  (function serial() {
    const btn = document.getElementById("codec-serial-run");
    const mesh = document.getElementById("codec-serial-mesh");
    const pipe = document.getElementById("codec-serial-pipe");
    if (!btn || !mesh || !pipe) return;
    let on = false;
    btn.addEventListener("click", () => {
      on = !on;
      mesh.classList.toggle("is-active", on);
      pipe.classList.toggle("is-wide", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  })();

  /* ----- Room 7: gray rock hover ----- */
  (function gray() {
    const quiet = document.getElementById("codec-gray-quiet");
    if (!quiet) return;
    quiet.querySelectorAll("[data-expand]").forEach((el) => {
      el.addEventListener("pointerenter", () => el.classList.add("is-open"));
      el.addEventListener("pointerleave", () => el.classList.remove("is-open"));
    });
  })();

  /* ----- Optional: Larmor Hz from p31-constants.json ----- */
  (function constantsHz() {
    const el = document.getElementById("codec-constants-hz");
    if (!el) return;
    fetch("../../p31-constants.json", { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const hz =
          j && j.mesh && typeof j.mesh.larmorHz === "number" && !Number.isNaN(j.mesh.larmorHz) ? j.mesh.larmorHz : null;
        if (hz != null)
          el.textContent =
            "Canon value in p31-constants.json: " + hz + " Hz (Earth-field 31P order of magnitude; this page uses 863 Hz as the teaching anchor).";
      })
      .catch(() => {
        el.textContent = "";
      });
  })();
})();
