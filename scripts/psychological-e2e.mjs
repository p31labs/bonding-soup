#!/usr/bin/env node
/**
 * Psychological E2E User Testing
 * Simulates different personality types with random personalities,
 * runs navigation paths, grades them, and generates flow charts.
 */

import { execFileSync, spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { PERSONALITY_TYPES, getPersonalityTypes } from "./personality-types.mjs";
import { gradePath, generateRatingReport } from "./rating-guide.mjs";
import fs from "node:fs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const SITE_PAGES = [
  "/soup.html",
  "/docs/doc-library/index.html",
  "/docs/physics-learn/index.html",
  "/fleet-portal.html",
  "/cognitive-passport/index.html",
  "/p31-personal-howto.html",
  "/p31-device-setup.html",
  "/demos/index.html",
  "/glass-box.html",
  "/docs/doc-library/index.html?a=child",
  "/connect.html",
  "/delta.html",
  "/tomography.html",
  "/planetary-onboard.html",
];

let server;
let port;
let isRunning = true;
const testResults = [];
const flowCharts = new Map();

function resolvePython() {
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["-V"], { stdio: "ignore" });
      return c;
    } catch (e) {
      void e;
    }
  }
  throw new Error("Need python3 or python for http.server");
}

function getPort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const a = s.address();
      const p = typeof a === "object" && a ? a.port : 0;
      s.close((err) => (err ? reject(err) : resolve(p)));
    });
  });
}

async function waitForHttp(u, maxTries = 40) {
  for (let i = 0; i < maxTries; i++) {
    try {
      const r = await fetch(u, { method: "GET", signal: AbortSignal.timeout(2000) });
      if (r.ok) return;
    } catch (e) {
      void e;
    }
    await setTimeout(150);
  }
  throw new Error("http server not responding: " + u);
}

async function startServer() {
  const py = resolvePython();
  port = await getPort();
  const base = `http://127.0.0.1:${port}/`;

  server = spawn(py, ["-m", "http.server", String(port), "-b", "127.0.0.1"], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  await setTimeout(200);
  if (server.exitCode != null) {
    throw new Error("http.server exited");
  }
  await waitForHttp(base);
  return port;
}

function shutdown() {
  if (server && !server.killed) {
    try {
      server.kill("SIGTERM");
    } catch (e) {
      void e;
    }
  }
  isRunning = false;
}

process.on("exit", shutdown);
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    shutdown();
    process.exit(1);
  });
}

function generateRandomPersonality() {
  const personalities = getPersonalityTypes();
  const base = personalities[Math.floor(Math.random() * personalities.length)];
  const variations = ["impatient", "cautious", "exploratory", "methodical"];
  const randomVariation = variations[Math.floor(Math.random() * variations.length)];

  return {
    ...base,
    name: `${base.name} (${randomVariation})`,
    traits: [...base.traits, randomVariation],
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

function generatePersonalityPath(personality, pathLength = 5) {
  const pattern = personality.navigationPattern;
  const path = [];

  for (let i = 0; i < pathLength; i++) {
    const page = SITE_PAGES[Math.floor(Math.random() * SITE_PAGES.length)];
    let action, waitMs;

    switch (pattern) {
      case "linear-fast":
        action = "click"; waitMs = 500 + Math.floor(Math.random() * 1000); break;
      case "scattered-jumps":
        action = Math.random() > 0.5 ? "click" : "scroll";
        waitMs = 200 + Math.floor(Math.random() * 800); break;
      case "systematic-explore":
        action = "click"; waitMs = 1000 + Math.floor(Math.random() * 2000); break;
      case "slow-methodical":
        action = "read"; waitMs = 2000 + Math.floor(Math.random() * 3000); break;
      case "playful-explore":
        action = Math.random() > 0.3 ? "click" : "scroll";
        waitMs = 800 + Math.floor(Math.random() * 1500); break;
      case "linear-tab":
        action = "tab-nav"; waitMs = 1000 + Math.floor(Math.random() * 1500); break;
      case "quick-scan":
        action = "scan"; waitMs = 300 + Math.floor(Math.random() * 700); break;
      case "read-all":
        action = "read"; waitMs = 3000 + Math.floor(Math.random() * 4000); break;
      case "panic-click":
        action = "click"; waitMs = 100 + Math.floor(Math.random() * 500); break;
      case "random-wander":
        action = ["click", "scroll", "back", "forward"][Math.floor(Math.random() * 4)];
        waitMs = 500 + Math.floor(Math.random() * 2000); break;
      default:
        action = "click"; waitMs = 1000 + Math.floor(Math.random() * 2000);
    }

    path.push({ page, action, waitMs, step: i + 1 });
  }

  return path;
}

async function collectObservations(page) {
  return await page.evaluate(() => {
    const observations = {
      animationCount: 0,
      smallestFontSize: 999,
      headingCount: 0,
      ariaLabelCount: 0,
      loadTime: performance.now(),
    };

    const allElements = document.querySelectorAll("*");
    allElements.forEach((el) => {
      const style = getComputedStyle(el);
      if (style.animationName !== "none" || style.transitionDuration !== "0s") {
        observations.animationCount++;
      }
      const fontSize = parseFloat(style.fontSize);
      if (fontSize > 0 && fontSize < observations.smallestFontSize) {
        observations.smallestFontSize = fontSize;
      }
    });

    observations.headingCount = document.querySelectorAll("h1, h2, h3, h4, h5, h6").length;
    observations.ariaLabelCount = document.querySelectorAll("[aria-label], [aria-labelledby]").length;

    return observations;
  });
}

async function runNDChecks(page) {
  const violations = [];

  try {
    const motionViolation = await page.evaluate(() => {
      const animatedElements = document.querySelectorAll(
        "[class*='animate'], [class*='transition'], [style*='animation']"
      );
      const hasReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (hasReduceMotion && animatedElements.length > 0) {
        for (const el of animatedElements) {
          const style = getComputedStyle(el);
          if (style.animationName !== "none" && style.animationDuration !== "0s") {
            return { found: true, count: animatedElements.length };
          }
        }
      }
      return { found: false, count: 0 };
    });

    if (motionViolation.found) {
      violations.push({
        type: "MOTION_VIOLATION",
        message: `Reduced motion not respected: ${motionViolation.count} animated elements`,
        severity: "HIGH",
      });
    }

    const ariaIssues = await page.evaluate(() => {
      const issues = [];
      const interactiveElements = document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      interactiveElements.forEach((el, idx) => {
        const hasAriaLabel = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
        const hasVisibleText = el.textContent?.trim().length > 0;
        const hasAlt = el.hasAttribute("alt");

        if (!hasAriaLabel && !hasVisibleText && !hasAlt && el.tagName !== "INPUT" && el.tagName !== "SELECT") {
          issues.push(`Element ${idx} (${el.tagName}) missing accessible name`);
        }
      });

      return issues.slice(0, 5);
    });

    if (ariaIssues.length > 0) {
      violations.push({
        type: "ARIA_VIOLATION",
        message: `${ariaIssues.length} interactive elements missing accessible names`,
        severity: "MEDIUM",
        details: ariaIssues,
      });
    }
  } catch (e) {
    violations.push({
      type: "CHECK_ERROR",
      message: e.message,
      severity: "INFO",
    });
  }

  return violations;
}

function generateFlowChart(personality, paths, results) {
  const nodes = [];
  const edges = [];

  paths.forEach((step, idx) => {
    const nodeId = `step_${idx}`;
    const grade = results[idx]?.grade?.label || "Unknown";

    nodes.push({
      id: nodeId,
      label: `Step ${idx + 1}: ${step.action}`,
      page: step.page,
      grade,
      action: step.action,
    });

    if (idx > 0) {
      edges.push({
        from: `step_${idx - 1}`,
        to: nodeId,
        label: `→ ${step.waitMs}ms`,
      });
    }
  });

  return {
    personality: personality.name,
    sessionId: personality.sessionId,
    nodes,
    edges,
    summary: {
      totalSteps: paths.length,
      averageScore: results.reduce((a, r) => a + (r?.score || 0), 0) / results.length,
    },
  };
}

function saveFlowChart(flowChart) {
  const chartsDir = path.join(root, "test-results", "flow-charts");

  if (!fs.existsSync(chartsDir)) {
    fs.mkdirSync(chartsDir, { recursive: true });
  }

  const filename = `flowchart-${flowChart.sessionId}.json`;
  const filepath = path.join(chartsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(flowChart, null, 2));
  console.log(`Flow chart saved: ${filepath}`);
}

function generateHTMLFlowChart(flowChart) {
  const nodes = flowChart.nodes;
  const edges = flowChart.edges;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Flow Chart: ${flowChart.personality}</title>
  <style>
    body { font-family: monospace; background: #0f1115; color: #e0e0e0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .node { background: #2a2a2a; border: 1px solid #444; padding: 10px; margin: 10px 0; border-radius: 5px; }
    .node.EXCELLENT { border-color: #4caf50; }
    .node.GOOD { border-color: #8bc34a; }
    .node.FAIR { border-color: #ffc107; }
    .node.POOR { border-color: #ff5722; }
    .node.FAILED { border-color: #f44336; }
    .edge { color: #666; font-size: 12px; margin-left: 20px; }
    .summary { background: #2a2a2a; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Flow Chart: ${flowChart.personality}</h1>
      <p>Session: ${flowChart.sessionId}</p>
    </div>
    ${nodes
      .map(
        (node) => `
      <div class="node ${node.grade}">
        <strong>${node.label}</strong><br>
        Page: ${node.page}<br>
        Action: ${node.action}<br>
        Grade: ${node.grade}
      </div>
      ${edges.filter((e) => e.from === node.id).map((e) => `<div class="edge">${e.label}</div>`).join("")}
    `
      )
      .join("")}
    <div class="summary">
      <h3>Summary</h3>
      <p>Total Steps: ${flowChart.summary.totalSteps}</p>
      <p>Average Score: ${flowChart.summary.averageScore.toFixed(1)}</p>
    </div>
  </div>
</body>
</html>`;
}

async function simulatePersonalitySession(browser, personality, sessionNum) {
  console.log(`\n[Session ${sessionNum}] Starting: ${personality.name}`);

  const context = await browser.newContext({
    reducedMotion: personality.criteria.reducedMotionRequired ? "reduce" : "no-preference",
    colorScheme: Math.random() > 0.5 ? "dark" : "light",
  });

  const page = await context.newPage();
  const sessionResults = {
    personality,
    paths: [],
    observations: [],
    violations: [],
    grades: [],
  };

  const pathLength = 3 + Math.floor(Math.random() * 5);
  const paths = generatePersonalityPath(personality, pathLength);

  await page.addInitScript(() => {
    window.__mutationCount = 0;
    const observer = new MutationObserver(() => {
      window.__mutationCount++;
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  });

  try {
    for (let stepIdx = 0; stepIdx < paths.length && isRunning; stepIdx++) {
      const step = paths[stepIdx];
      const url = `http://127.0.0.1:${port}${step.page}`;

      try {
        const startTime = Date.now();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        const loadTime = Date.now() - startTime;

        switch (step.action) {
          case "click":
            const buttons = await page.$$("button, a");
            if (buttons.length > 0) {
              const randomBtn = buttons[Math.floor(Math.random() * buttons.length)];
              await randomBtn.click().catch(() => {});
            }
            break;
          case "scroll":
            await page.evaluate(() => window.scrollBy(0, Math.floor(Math.random() * 500)));
            break;
          case "read":
            await setTimeout(1000);
            break;
          case "tab-nav":
            await page.keyboard.press("Tab");
            break;
          case "scan":
            await setTimeout(500);
            break;
          case "back":
            await page.goBack().catch(() => {});
            break;
          case "forward":
            await page.goForward().catch(() => {});
            break;
        }

        const observations = await collectObservations(page);
        observations.loadTime = loadTime;
        sessionResults.observations.push(observations);

        const violations = await runNDChecks(page);
        sessionResults.violations.push(...violations);

        const grade = gradePath(personality, [observations], violations);
        sessionResults.grades.push(grade);
        sessionResults.paths.push(step);

        console.log(`  Step ${stepIdx + 1}: ${step.page} - ${grade.grade.label} (${grade.score})`);

        await setTimeout(step.waitMs);
      } catch (e) {
        console.log(`  Step ${stepIdx + 1}: ERROR - ${e.message}`);
      }
    }

    const flowChart = generateFlowChart(personality, sessionResults.paths, sessionResults.grades);
    flowCharts.set(personality.sessionId, flowChart);
  } catch (e) {
    console.log(`  Session error: ${e.message}`);
  } finally {
    await context.close();
  }

  return sessionResults;
}

async function main() {
  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch (e) {
    console.error("psychological-e2e: Install playwright: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }

  console.log("=== PSYCHOLOGICAL E2E USER TESTING ===");
  console.log("Starting server and browser...");

  await startServer();

  const browser = await chromium.launch({ headless: true });
  const NUM_SESSIONS = parseInt(process.env.PSYCH_SESSIONS || "3", 10);

  console.log(`\nRunning ${NUM_SESSIONS} personality sessions...\n`);

  for (let i = 0; i < NUM_SESSIONS && isRunning; i++) {
    try {
      const personality = generateRandomPersonality();
      const sessionResults = await simulatePersonalitySession(browser, personality, i + 1);
      if (sessionResults) {
        testResults.push(sessionResults);
      }

      const flowChart = flowCharts.get(personality.sessionId);
      if (flowChart) {
        saveFlowChart(flowChart);
        const htmlContent = generateHTMLFlowChart(flowChart);
        const htmlPath = path.join(root, "test-results", "flow-charts", `flowchart-${flowChart.sessionId}.html`);
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`HTML flow chart saved: ${htmlPath}`);
      }
    } catch (sessionError) {
      console.error(`Error in session ${i + 1}:`, sessionError.message);
    }
  }

  await browser.close();

  console.log("\n\n=== FINAL REPORT ===");
  const allGrades = testResults.flatMap((r) => r?.grades || []);
  const report = generateRatingReport(allGrades);

  console.log(`\nTotal Sessions: ${testResults.filter((r) => r).length}`);
  console.log(`Total Steps: ${allGrades.length}`);
  console.log(`Average Score: ${report.summary.averageScore.toFixed(1)}/100`);

  console.log("\nBy Grade:");
  Object.entries(report.summary.byGrade).forEach(([grade, count]) => {
    console.log(`  ${grade}: ${count} steps`);
  });

  console.log("\nBy Personality:");
  testResults.filter((r) => r && r.personality).forEach((r) => {
    const avgScore = r.grades.reduce((a, g) => a + (g?.score || 0), 0) / r.grades.length || 0;
    console.log(`  ${r.personality.name}: ${avgScore.toFixed(1)}/100`);
  });

  console.log("\nFlow charts saved to: test-results/flow-charts/");

  const highSeverityCount = allGrades.filter((g) => g && g.score < 50).length;
  if (highSeverityCount > 0) {
    console.log(`\nFAILED: ${highSeverityCount} steps scored below 50`);
  } else {
    console.log("\nPASSED: All steps scored 50 or above");
  }

  shutdown();
}

main().catch((e) => {
  console.error("psychological-e2e:", e.message || e, e.stack || "");
  shutdown();
  process.exit(1);
});
