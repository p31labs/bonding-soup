/**
 * P31 physics learning engine — progressive units, local progress, small canvas labs.
 * Schema: p31.physicsLearn/1.0.0 (progress JSON in localStorage).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "p31.physicsLearn.v1";
  const CONSTANTS_URL = "../../p31-constants.json";

  /** @type {{ version: string, completed: Record<string, true>, lastUnit: string | null, xp: number }} */
  let state = loadState();

  /** @typedef {{ id: string, title: string, stage: string, blurb: string, theory: string, lab: string, check: { kind: "numeric"; question: string; answer: number; tol?: number } | { kind: "mc"; question: string; options: string[]; correct: number } }} Unit */

  /** @type {{ version: "1.0.0", units: Unit[] }} */
  const CURRICULUM = {
    version: "1.0.0",
    units: [
      {
        id: "u1-vectors",
        title: "Vectors & resultants",
        stage: "Kinematics",
        blurb: "Displacement adds like arrows. Same language for forces later.",
        theory:
          "<p><strong>Vector</strong> quantities have magnitude <em>and</em> direction. To add two vectors in 2D, add components: <code>R<sub>x</sub> = A<sub>x</sub> + B<sub>x</sub></code>, <code>R<sub>y</sub> = A<sub>y</sub> + B<sub>y</sub></code>. The length (magnitude) is <code>|R| = √(R<sub>x</sub>² + R<sub>y</sub>²)</code>.</p>",
        lab: "vector2d",
        check: {
          kind: "numeric",
          question:
            "Vector A = (3, 4) m and B = (0, 0) m. What is the magnitude of A, in m? (one decimal is fine; we accept ±0.05)",
          answer: 5,
          tol: 0.05,
        },
      },
      {
        id: "u2-velocity",
        title: "Velocity & average rate",
        stage: "Kinematics",
        blurb: "Velocity is the slope of position vs. time (when the graph is smooth, it’s the derivative).",
        theory:
          "<p><strong>Average velocity</strong> in one dimension: <code>v̄ = Δx / Δt</code>. If position changes linearly, instantaneous velocity matches that slope. The graph in the lab uses constant velocity — try different slopes and read Δx/Δt.</p>",
        lab: "linegraph",
        check: {
          kind: "numeric",
          question:
            "An object moves from x = 10 m to x = 40 m in 5.0 s. What is the average velocity in m/s?",
          answer: 6,
          tol: 0.05,
        },
      },
      {
        id: "u3-accel",
        title: "Acceleration & SUVAT (constant a)",
        stage: "Kinematics",
        blurb: "When acceleration is constant, v changes linearly with t.",
        theory:
          "<p><strong>Average acceleration</strong> <code>ā = Δv / Δt</code>. A classic identity: <code>v = u + a t</code> when a is constant and motion is 1D. Check signs: pick a positive direction and stay consistent.</p>",
        lab: "accel1d",
        check: {
          kind: "numeric",
          question:
            "A cart goes from rest to 12 m/s in 3.0 s with constant acceleration. What is a in m/s²?",
          answer: 4,
          tol: 0.05,
        },
      },
      {
        id: "u4-newton",
        title: "Newton’s 2nd law (particle model)",
        stage: "Dynamics",
        blurb: "Net force causes acceleration along the net force direction: F_net = m a (SI).",
        theory:
          "<p>Draw a <strong>free-body diagram</strong> first. Sum forces along each axis. In 1D: <code>F_net = m a</code>. Mass resists change in motion (inertia).</p>",
        lab: "fma",
        check: {
          kind: "numeric",
          question: "A 5.0 kg block feels a net force of 20 N. What is the magnitude of acceleration in m/s²?",
          answer: 4,
          tol: 0.05,
        },
      },
      {
        id: "u5-work",
        title: "Work by a constant force (1D)",
        stage: "Energy",
        blurb: "Work transfers energy; for a constant force in the direction of motion, W = F Δx.",
        theory:
          "<p>In one dimension, if force and displacement point the same way: <code>W = F Δx</code> (joules if F is newtons, x meters). If they oppose, work is negative.</p>",
        lab: "work1d",
        check: {
          kind: "numeric",
          question: "A 12 N push acts through 2.5 m in the same direction. How many joules of work are done?",
          answer: 30,
          tol: 0.05,
        },
      },
      {
        id: "u6-energy",
        title: "Kinetic energy",
        stage: "Energy",
        blurb: "E_k = ½ m v². Same mass, double speed → four times the kinetic energy.",
        theory:
          "<p><code>E<sub>k</sub> = ½ m v²</code>. It’s a scalar — no direction. Units: kg·(m/s)² = joules.</p>",
        lab: "ke",
        check: {
          kind: "numeric",
          question: "A 2.0 kg object moves at 3.0 m/s. What is its kinetic energy in J?",
          answer: 9,
          tol: 0.05,
        },
      },
      {
        id: "u7-osc",
        title: "Period, frequency, angular frequency",
        stage: "Oscillations",
        blurb: "T is seconds per cycle; f is cycles per second; ω = 2πf rad/s.",
        theory:
          "<p><code>f = 1 / T</code> and <code>ω = 2πf = 2π / T</code>. These describe rotation and harmonic motion, not a diagnosis — just consistent bookkeeping.</p>",
        lab: "osc",
        check: {
          kind: "mc",
          question: "If T = 0.5 s, what is f?",
          options: ["0.5 Hz", "1 Hz", "2 Hz", "4 Hz"],
          correct: 2,
        },
      },
      {
        id: "u8-larmor",
        title: "NMR: one canonical P31 number",
        stage: "Resonance (context)",
        blurb: "P31’s docs pin a ³¹P Larmor reference in Earth’s field — useful as a worked frequency.",
        theory:
          "<p>Spin precession in a magnetic field is a standard NMR/physics context. In this repository, a <strong>display-only</strong> Larmor reference is kept in <code>p31-constants.json</code> (not medical advice). It ties together <code>f</code> and <code>ω = 2πf</code> for pedagogy. If the live constant loads, the lab uses it.</p><p class=\"p31-muted\" id=\"larmor-ctx\"></p>",
        lab: "larmor",
        check: {
          kind: "numeric",
          question:
            "Using ω = 2πf, if f = 1 Hz, what is ω in rad/s? (Use π ≈ 3.14159; answer to 2 decimals)",
          answer: 6.28,
          tol: 0.15,
        },
      },
    ],
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === "object" && p.version === "1.0.0" && p.completed) {
          return {
            version: "1.0.0",
            completed: p.completed || {},
            lastUnit: p.lastUnit || null,
            xp: typeof p.xp === "number" ? p.xp : 0,
          };
        }
      }
    } catch (e) {
      void e;
    }
    return { version: "1.0.0", completed: Object.create(null), lastUnit: null, xp: 0 };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      void e;
    }
  }

  function isUnlocked(index) {
    if (index === 0) return true;
    const prev = CURRICULUM.units[index - 1];
    return Boolean(state.completed[prev.id]);
  }

  function isDone(id) {
    return Boolean(state.completed[id]);
  }

  function markDone(id) {
    state.completed[id] = true;
    state.xp += 25;
    state.lastUnit = id;
    saveState();
  }

  // ---- DOM
  const el = {
    track: document.getElementById("pl-track"),
    main: document.getElementById("pl-main"),
    title: document.getElementById("pl-title"),
    stage: document.getElementById("pl-stage"),
    theory: document.getElementById("pl-theory"),
    labHost: document.getElementById("pl-lab"),
    check: document.getElementById("pl-check"),
    progress: document.getElementById("pl-progress"),
    progressFill: document.getElementById("pl-progress-fill"),
    xp: document.getElementById("pl-xp"),
    toast: document.getElementById("pl-toast"),
  };

  let larmorHz = 863;
  let activeIndex = 0;
  let checkAnswerEl = null;

  function setToast(msg) {
    if (el.toast) {
      el.toast.textContent = msg;
      el.toast.hidden = false;
      clearTimeout(setToast.t);
      setToast.t = setTimeout(function () {
        if (el.toast) el.toast.hidden = true;
      }, 3600);
    }
  }

  function renderTrack() {
    if (!el.track) return;
    const n = CURRICULUM.units.length;
    const doneC = Object.keys(state.completed).length;
    if (el.progressFill) {
      const pct = n ? (100 * doneC) / n : 0;
      el.progressFill.style.width = pct + "%";
    }
    if (el.progress) {
      el.progress.setAttribute("aria-valuenow", String(n ? Math.round((100 * doneC) / n) : 0));
    }
    if (el.xp) el.xp.textContent = String(state.xp);

    const frag = document.createDocumentFragment();
    let lastStage = "";
    CURRICULUM.units.forEach((u, i) => {
      if (u.stage !== lastStage) {
        lastStage = u.stage;
        const h = document.createElement("div");
        h.className = "pl-stage-lbl";
        h.textContent = u.stage;
        frag.appendChild(h);
      }
      const row = document.createElement("button");
      row.type = "button";
      row.className = "pl-unit" + (i === activeIndex ? " is-active" : "");
      if (!isUnlocked(i)) row.className += " is-locked";
      if (isDone(u.id)) row.className += " is-done";
      row.disabled = !isUnlocked(i);
      row.setAttribute("aria-current", i === activeIndex ? "true" : "false");
      row.innerHTML =
        "<span class=\"pl-unit__icon\">" +
        (isDone(u.id) ? "✓" : isUnlocked(i) ? "○" : "⏴") +
        "</span><span class=\"pl-unit__txt\"><span class=\"pl-unit__t\">" +
        esc(u.title) +
        "</span><span class=\"pl-unit__b\">" +
        esc(u.blurb) +
        "</span></span>";
      row.addEventListener("click", function () {
        if (!isUnlocked(i)) return;
        activeIndex = i;
        renderTrack();
        renderUnit();
      });
      frag.appendChild(row);
    });
    el.track.textContent = "";
    el.track.appendChild(frag);
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function clearLab() {
    if (el.labHost) el.labHost.innerHTML = "";
  }

  function renderVectorLab() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab pl-lab--vec";
    w.innerHTML =
      "<p class=\"pl-lab__hint\">Drag sliders — watch the resultant.</p>" +
      "<canvas id=\"pl-cv-vec\" width=\"320\" height=\"220\" class=\"pl-cv\"></canvas>" +
      "<div class=\"pl-sliders\">" +
      "<label>A<sub>x</sub> <input type=\"range\" id=\"pl-ax\" min=\"-6\" max=\"6\" step=\"0.1\" value=\"3\" /></label>" +
      "<label>A<sub>y</sub> <input type=\"range\" id=\"pl-ay\" min=\"-6\" max=\"6\" step=\"0.1\" value=\"4\" /></label>" +
      "<label>B<sub>x</sub> <input type=\"range\" id=\"pl-bx\" min=\"-6\" max=\"6\" step=\"0.1\" value=\"1\" /></label>" +
      "<label>B<sub>y</sub> <input type=\"range\" id=\"pl-by\" min=\"-6\" max=\"6\" step=\"0.1\" value=\"-1\" /></label>" +
      "</div>" +
      "<p class=\"pl-metric\" id=\"pl-vec-mag\">|R| = —</p>";
    el.labHost.appendChild(w);
    const cv = document.getElementById("pl-cv-vec");
    const magEl = document.getElementById("pl-vec-mag");
    const inputs = ["pl-ax", "pl-ay", "pl-bx", "pl-by"].map(function (id) {
      return document.getElementById(id);
    });
    function draw() {
      if (!cv.getContext) return;
      const ctx = cv.getContext("2d");
      const ax = +inputs[0].value;
      const ay = +inputs[1].value;
      const bx = +inputs[2].value;
      const by = +inputs[3].value;
      const rx = ax + bx;
      const ry = ay + by;
      const m = Math.sqrt(rx * rx + ry * ry);
      magEl.textContent = "|R| = " + m.toFixed(2) + " m (component model)";
      const cx = 160;
      const cy = 110;
      const s = 18;
      ctx.clearRect(0, 0, 320, 220);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      for (let g = -6; g <= 6; g++) {
        ctx.beginPath();
        ctx.moveTo(cx + g * s, 0);
        ctx.lineTo(cx + g * s, 220);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, cy - g * s);
        ctx.lineTo(320, cy - g * s);
        ctx.stroke();
      }
      function arr(fx, fy, col) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + fx * s, cy - fy * s);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        const tx = cx + fx * s;
        const ty = cy - fy * s;
        ctx.arc(tx, ty, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      arr(ax, ay, "#4db8a8");
      arr(bx, by, "#8b7cc9");
      arr(rx, ry, "#cda852");
    }
    inputs.forEach(function (inp) {
      inp.addEventListener("input", draw);
    });
    draw();
  }

  function renderLineGraph() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab";
    w.innerHTML =
      "<p class=\"pl-lab__hint\">x(t) = x₀ + v t. Adjust v (m/s) and time window.</p>" +
      "<label class=\"pl-inline\">v = <input type=\"range\" id=\"pl-lin-v\" min=\"-8\" max=\"8\" step=\"0.1\" value=\"3\" /> <span id=\"pl-lin-vl\">3</span> m/s</label>" +
      "<canvas id=\"pl-cv-line\" width=\"320\" height=\"200\" class=\"pl-cv\"></canvas>";
    el.labHost.appendChild(w);
    const cv = document.getElementById("pl-cv-line");
    const vr = document.getElementById("pl-lin-v");
    const vl = document.getElementById("pl-lin-vl");
    function go() {
      const v = +vr.value;
      vl.textContent = v.toFixed(1);
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, 320, 200);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.lineTo(320, 20);
      ctx.stroke();
      const x0 = 20;
      const tmax = 5;
      ctx.strokeStyle = "#4db8a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = (tmax * i) / 100;
        const x = x0 + v * t;
        const px = 20 + (t / tmax) * 280;
        const py = 180 - (x / 60) * 160;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = "var(--p31-muted, #6b7280)";
      ctx.font = "10px var(--p31-font-mono,monospace)";
      ctx.fillText("t →", 280, 195);
    }
    vr.addEventListener("input", go);
    go();
  }

  function renderAccel1D() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab";
    w.innerHTML =
      "<p class=\"pl-lab__hint\">v(t) = a t (from u = 0). Slide <code>a</code>.</p>" +
      "<label class=\"pl-inline\">a = <input type=\"range\" id=\"pl-a\" min=\"-4\" max=\"8\" step=\"0.1\" value=\"2\" /> <span id=\"pl-al\">2</span> m/s²</label>" +
      "<canvas id=\"pl-cv-a\" width=\"320\" height=\"200\" class=\"pl-cv\"></canvas>";
    el.labHost.appendChild(w);
    const cv = document.getElementById("pl-cv-a");
    const ar = document.getElementById("pl-a");
    const al = document.getElementById("pl-al");
    function go() {
      const a = +ar.value;
      al.textContent = a.toFixed(1);
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, 320, 200);
      ctx.strokeStyle = "#cda852";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const tmax = 5;
      for (let i = 0; i <= 100; i++) {
        const t = (tmax * i) / 100;
        const v = a * t;
        const px = 20 + (t / tmax) * 280;
        const py = 180 - (v / 25) * 160;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ar.addEventListener("input", go);
    go();
  }

  function renderFma() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab";
    w.innerHTML =
      "<p class=\"pl-lab__hint\">F_net = m a → a = F/m. Watch the bar scale.</p>" +
      "<div class=\"pl-inline\"><label>m <input type=\"range\" id=\"pl-m\" min=\"0.5\" max=\"20\" step=\"0.1\" value=\"5\" /> <span id=\"pl-ml\">5</span> kg</label></div>" +
      "<div class=\"pl-inline\"><label>F <input type=\"range\" id=\"pl-f\" min=\"-40\" max=\"40\" step=\"0.1\" value=\"20\" /> <span id=\"pl-fl\">20</span> N</label></div>" +
      "<p class=\"pl-metric\" id=\"pl-ac\">a = — m/s²</p>" +
      "<div class=\"pl-barwrap\"><div class=\"pl-bar\" id=\"pl-bar\"></div></div>";
    el.labHost.appendChild(w);
    const mr = document.getElementById("pl-m");
    const fr = document.getElementById("pl-f");
    const ac = document.getElementById("pl-ac");
    const bar = document.getElementById("pl-bar");
    function go() {
      const m = +mr.value;
      const F = +fr.value;
      document.getElementById("pl-ml").textContent = m.toFixed(1);
      document.getElementById("pl-fl").textContent = F.toFixed(1);
      const a = F / m;
      ac.textContent = "a = " + a.toFixed(2) + " m/s²";
      const wPct = Math.min(100, (Math.abs(a) / 8) * 100);
      bar.style.width = wPct + "%";
      bar.style.transform = a < 0 ? "scaleX(-1)" : "none";
    }
    mr.addEventListener("input", go);
    fr.addEventListener("input", go);
    go();
  }

  function renderWork1D() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab";
    w.innerHTML =
      "<p class=\"pl-lab__hint\">W = F Δx (aligned 1D).</p>" +
      "<label class=\"pl-inline\">F = <input type=\"range\" id=\"pl-wf\" min=\"0\" max=\"30\" value=\"12\" /> <span id=\"pl-wfl\">12</span> N</label>" +
      "<label class=\"pl-inline\">Δx = <input type=\"range\" id=\"pl-wx\" min=\"0\" max=\"6\" step=\"0.1\" value=\"2.5\" /> <span id=\"pl-wxl\">2.5</span> m</label>" +
      "<p class=\"pl-metric\" id=\"pl-wt\">W = — J</p>";
    el.labHost.appendChild(w);
    function go() {
      const F = +document.getElementById("pl-wf").value;
      const x = +document.getElementById("pl-wx").value;
      document.getElementById("pl-wfl").textContent = String(F);
      document.getElementById("pl-wxl").textContent = x.toFixed(1);
      document.getElementById("pl-wt").textContent = "W = " + (F * x).toFixed(1) + " J";
    }
    document.getElementById("pl-wf").addEventListener("input", go);
    document.getElementById("pl-wx").addEventListener("input", go);
    go();
  }

  function renderKe() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab";
    w.innerHTML =
      "<p class=\"pl-lab__hint\">E<sub>k</sub> = ½ m v²</p>" +
      "<label class=\"pl-inline\">m = <input type=\"range\" id=\"pl-km\" min=\"0.2\" max=\"8\" step=\"0.1\" value=\"2\" /> <span id=\"pl-kml\">2</span> kg</label>" +
      "<label class=\"pl-inline\">v = <input type=\"range\" id=\"pl-kv\" min=\"0\" max=\"12\" step=\"0.1\" value=\"3\" /> <span id=\"pl-kvl\">3</span> m/s</label>" +
      "<p class=\"pl-metric\" id=\"pl-kek\">E<sub>k</sub> = — J</p>";
    el.labHost.appendChild(w);
    function go() {
      const m = +document.getElementById("pl-km").value;
      const v = +document.getElementById("pl-kv").value;
      document.getElementById("pl-kml").textContent = m.toFixed(1);
      document.getElementById("pl-kvl").textContent = v.toFixed(1);
      document.getElementById("pl-kek").innerHTML = "E<sub>k</sub> = " + (0.5 * m * v * v).toFixed(2) + " J";
    }
    document.getElementById("pl-km").addEventListener("input", go);
    document.getElementById("pl-kv").addEventListener("input", go);
    go();
  }

  function renderOsc() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab";
    w.innerHTML =
      "<p class=\"pl-lab__hint\">T = 1/f, ω = 2πf. Drag T.</p>" +
      "<label class=\"pl-inline\">T = <input type=\"range\" id=\"pl-t\" min=\"0.1\" max=\"3\" step=\"0.01\" value=\"0.5\" /> <span id=\"pl-tl\">0.5</span> s</label>" +
      "<p class=\"pl-metric\" id=\"pl-fl\">f = — Hz, ω = — rad/s</p>";
    el.labHost.appendChild(w);
    function go() {
      const T = +document.getElementById("pl-t").value;
      document.getElementById("pl-tl").textContent = T.toFixed(2);
      const f = 1 / T;
      const om = 2 * Math.PI * f;
      document.getElementById("pl-fl").textContent = "f = " + f.toFixed(2) + " Hz, ω = " + om.toFixed(2) + " rad/s";
    }
    document.getElementById("pl-t").addEventListener("input", go);
    go();
  }

  function renderLarmor() {
    clearLab();
    const w = document.createElement("div");
    w.className = "pl-lab";
    const f = larmorHz;
    const om = 2 * Math.PI * f;
    w.innerHTML =
      "<p class=\"pl-lab__hint\">Repository constant f ≈ " +
      f +
      " Hz → ω = 2πf (rad/s) for that reference.</p>" +
      "<p class=\"pl-metric\">ω ≈ " +
      om.toFixed(0) +
      " rad/s</p><p class=\"p31-muted pl-small\">Loaded from p31-constants when available; else default 863 Hz label.</p>";
    el.labHost.appendChild(w);
  }

  function runLab(name) {
    const map = {
      vector2d: renderVectorLab,
      linegraph: renderLineGraph,
      accel1d: renderAccel1D,
      fma: renderFma,
      work1d: renderWork1D,
      ke: renderKe,
      osc: renderOsc,
      larmor: renderLarmor,
    };
    (map[name] || clearLab)();
  }

  function renderCheck(unit) {
    if (!el.check) return;
    if (isDone(unit.id)) {
      el.check.innerHTML =
        "<h3 class=\"pl-h3\">Check</h3><p class=\"p31-muted\">Passed — read or replay the lab anytime.</p>";
      return;
    }
    const c = unit.check;
    el.check.innerHTML = "<h3 class=\"pl-h3\">Check</h3>";
    const p = document.createElement("p");
    p.className = "pl-q";
    p.textContent = c.question;
    el.check.appendChild(p);
    if (c.kind === "numeric") {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "pl-inp";
      inp.setAttribute("inputmode", "decimal");
      inp.setAttribute("aria-label", "Your answer");
      el.check.appendChild(inp);
      checkAnswerEl = inp;
    } else {
      c.options.forEach(function (opt, i) {
        const lab = document.createElement("label");
        lab.className = "pl-mc";
        const r = document.createElement("input");
        r.type = "radio";
        r.name = "pl-mc";
        r.value = String(i);
        lab.appendChild(r);
        lab.appendChild(document.createTextNode(" " + opt));
        el.check.appendChild(lab);
      });
    }
    const row = document.createElement("div");
    row.className = "pl-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pl-btn pl-btn--primary";
    btn.textContent = "Submit";
    btn.addEventListener("click", function () {
      submitCheck(unit, c);
    });
    row.appendChild(btn);
    el.check.appendChild(row);
  }

  function submitCheck(unit, c) {
    let ok = false;
    if (c.kind === "numeric" && checkAnswerEl) {
      const v = parseFloat(String(checkAnswerEl.value).replace(",", "."), 10);
      if (Number.isFinite(v)) {
        const tol = c.tol != null ? c.tol : 0.01;
        ok = Math.abs(v - c.answer) <= tol;
      }
    } else if (c.kind === "mc") {
      const r = el.check.querySelector("input[name=\"pl-mc\"]:checked");
      if (r) ok = +r.value === c.correct;
    }
    if (ok) {
      if (!isDone(unit.id)) markDone(unit.id);
      setToast("Yes — unit logged. +25 XP");
      renderTrack();
      renderUnit();
    } else {
      setToast("Not quite — use the lab + theory, then try again.");
    }
  }

  function renderUnit() {
    const u = CURRICULUM.units[activeIndex];
    if (!u) return;
    if (el.title) {
      el.title.textContent = u.title;
    }
    if (el.stage) el.stage.textContent = u.stage;
    if (el.theory) {
      el.theory.innerHTML = u.theory;
    }
    if (u.id === "u8-larmor") {
      const lctx = document.getElementById("larmor-ctx");
      if (lctx)
        lctx.textContent = "f_ref ≈ " + larmorHz + " Hz (from physics.larmorHz in p31-constants.json when loaded).";
    }
    runLab(u.lab);
    renderCheck(u);
  }

  async function boot() {
    try {
      const r = await fetch(CONSTANTS_URL, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j.physics && typeof j.physics.larmorHz === "number") larmorHz = j.physics.larmorHz;
      }
    } catch (e) {
      void e;
    }
    let firstOpen = -1;
    for (let i = 0; i < CURRICULUM.units.length; i++) {
      if (isUnlocked(i) && !isDone(CURRICULUM.units[i].id)) {
        firstOpen = i;
        break;
      }
    }
    if (firstOpen >= 0) activeIndex = firstOpen;
    else activeIndex = Math.max(0, CURRICULUM.units.length - 1);
    if (state.lastUnit) {
      const j = CURRICULUM.units.findIndex(function (u) {
        return u.id === state.lastUnit;
      });
      if (j >= 0 && isUnlocked(j) && !isDone(CURRICULUM.units[j].id)) activeIndex = j;
    }
    renderTrack();
    renderUnit();
  }

  const resetBtn = document.getElementById("pl-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (window.confirm("Clear all progress and XP on this device?")) {
        state = { version: "1.0.0", completed: Object.create(null), lastUnit: null, xp: 0 };
        saveState();
        activeIndex = 0;
        setToast("Progress reset.");
        renderTrack();
        renderUnit();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
