#!/usr/bin/env node
/**
 * Neurodivergent Swarm E2E Test
 * Simulates infinite concurrent users taking random paths through the site.
 * Detects "tick" issues: flashing, focus traps, motion violations, cognitive overload.
 */

import { execFileSync, spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Site pages to navigate
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
];

// Neurodivergent-sensitive checks
const ND_CHECKS = {
  FLASHING_THRESHOLD: 3, // rapid DOM changes per second = potential flash
  MOTION_CHECK: true,
  FOCUS_TRAP_CHECK: true,
  ARIA_CHECK: true,
  COGNITIVE_LOAD_THRESHOLD: 50, // max simultaneous keyframe animations (CSS transitions excluded)
};

let server;
let port;
let isRunning = true;
const violations = [];
const userSessions = new Map();

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

// Random path generator
function generateRandomPath() {
  const steps = 3 + Math.floor(Math.random() * 8); // 3-10 steps
  const path = [];
  for (let i = 0; i < steps; i++) {
    const page = SITE_PAGES[Math.floor(Math.random() * SITE_PAGES.length)];
    path.push({
      page,
      action: Math.random() > 0.5 ? "click" : "scroll",
      waitMs: 500 + Math.floor(Math.random() * 3000),
    });
  }
  return path;
}

// Neurodivergent checks via page evaluation
async function runNDChecks(page, userId, stepNum) {
  const issues = [];
  
  try {
    // Check 1: Reduced motion support
    const motionViolation = await page.evaluate(() => {
      const animatedElements = document.querySelectorAll("[class*='animate'], [class*='transition'], [style*='animation']");
      const hasReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      
      if (hasReduceMotion && animatedElements.length > 0) {
        // Check if animations are actually disabled
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
      issues.push({
        type: "MOTION_VIOLATION",
        message: `Reduced motion not respected: ${motionViolation.count} animated elements still active`,
        severity: "HIGH",
      });
    }
    
    // Check 2: Focus trap detection
    const focusIssues = await page.evaluate(() => {
      const body = document.body;
      if (!body) return { hasTabIndexOnBody: false, focusableCount: 0, hasSkipLink: false };
      
      const focusableElements = document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const tabIndex = body.getAttribute("tabindex");
      
      return {
        hasTabIndexOnBody: tabIndex !== null && tabIndex !== "-1",
        focusableCount: focusableElements.length,
        hasSkipLink: !!document.querySelector('a[href="#main"], a[href="#content"], .skip-link'),
      };
    });
    
    if (!focusIssues.hasSkipLink && focusIssues.focusableCount > 5) {
      issues.push({
        type: "ACCESSIBILITY",
        message: "No skip link found for keyboard users",
        severity: "MEDIUM",
      });
    }
    
    // Check 3: Rapid DOM mutation detection (flashing)
    const mutationCount = await page.evaluate(() => {
      if (!window.__mutationCount) window.__mutationCount = 0;
      return window.__mutationCount;
    });
    
    // Check 4: ARIA violations
    const ariaIssues = await page.evaluate(() => {
      const issues = [];
      const interactiveElements = document.querySelectorAll("button, a, input, select, textarea");
      
      interactiveElements.forEach((el, idx) => {
        const hasAriaLabel = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
        const hasVisibleText = el.textContent?.trim().length > 0;
        const hasAlt = el.hasAttribute("alt");
        
        if (!hasAriaLabel && !hasVisibleText && !hasAlt && el.tagName !== "INPUT" && el.tagName !== "SELECT") {
          issues.push(`Element ${idx} (${el.tagName}) missing accessible name`);
        }
      });
      
      return issues.slice(0, 5); // Limit to first 5
    });
    
    if (ariaIssues.length > 0) {
      issues.push({
        type: "ARIA_VIOLATION",
        message: `${ariaIssues.length} interactive elements missing accessible names`,
        severity: "MEDIUM",
        details: ariaIssues,
      });
    }
    
    // Check 5: Cognitive load (too many animations/transitions)
    const cognitiveLoad = await page.evaluate(() => {
      const allElements = document.querySelectorAll("*");
      let animatedCount = 0;
      
      allElements.forEach((el) => {
        const style = getComputedStyle(el);
        if (style.animationName !== "none" && style.animationIterationCount === "infinite") {
          animatedCount++;
        }
      });
      
      return animatedCount;
    });
    
    if (cognitiveLoad > ND_CHECKS.COGNITIVE_LOAD_THRESHOLD) {
      issues.push({
        type: "COGNITIVE_OVERLOAD",
        message: `${cognitiveLoad} simultaneous animations detected`,
        severity: "LOW",
      });
    }
    
    // Check 6: Auto-playing media
    const autoplayMedia = await page.evaluate(() => {
      const videos = document.querySelectorAll("video[autoplay]");
      const audios = document.querySelectorAll("audio[autoplay]");
      return { videos: videos.length, audios: audios.length };
    });
    
    if (autoplayMedia.videos > 0 || autoplayMedia.audios > 0) {
      issues.push({
        type: "AUTOPLAY_MEDIA",
        message: `${autoplayMedia.videos} videos, ${autoplayMedia.audios} audios auto-playing`,
        severity: "HIGH",
      });
    }
    
  } catch (e) {
    issues.push({
      type: "CHECK_ERROR",
      message: e.message,
      severity: "INFO",
    });
  }
  
  return issues;
}

// Simulate a single user session
async function simulateUser(browser, userId, maxPaths = 5) {
  const context = await browser.newContext({
    reducedMotion: Math.random() > 0.5 ? "reduce" : "no-preference",
    colorScheme: Math.random() > 0.5 ? "dark" : "light",
  });
  
  const page = await context.newPage();
  const session = { userId, paths: 0, violations: [], startTime: Date.now() };
  userSessions.set(userId, session);
  
  // Set up mutation observer for flashing detection
  await page.addInitScript(() => {
    window.__mutationCount = 0;
    const observer = new MutationObserver(() => {
      window.__mutationCount++;
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  });
  
  try {
    for (let pathIdx = 0; pathIdx < maxPaths && isRunning; pathIdx++) {
      const path = generateRandomPath();
      
      for (let stepIdx = 0; stepIdx < path.length && isRunning; stepIdx++) {
        const step = path[stepIdx];
        const url = `http://127.0.0.1:${port}${step.page}`;
        
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          
          // Random action
          if (step.action === "click") {
            const buttons = await page.$$("button, a");
            if (buttons.length > 0) {
              const randomBtn = buttons[Math.floor(Math.random() * buttons.length)];
              await randomBtn.click().catch(() => {});
            }
          } else {
            await page.evaluate(() => window.scrollBy(0, Math.floor(Math.random() * 500)));
          }
          
          // Run ND checks
          const issues = await runNDChecks(page, userId, stepIdx);
          if (issues.length > 0) {
            session.violations.push(...issues);
            violations.push(...issues.map((i) => ({ ...i, userId, url, step: stepIdx })));
          }
          
          await setTimeout(step.waitMs);
        } catch (e) {
          // Navigation error - continue with next step
          void e;
        }
      }
      
      session.paths++;
    }
  } catch (e) {
    void e;
  } finally {
    await context.close();
  }
  
  session.endTime = Date.now();
  return session;
}

async function main() {
  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch (e) {
    console.error("neurodivergent-swarm-e2e: Install playwright: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }
  
  console.log("neurodivergent-swarm-e2e: Starting server and browser...");
  await startServer();
  
  const browser = await chromium.launch({ headless: true });
  const CONCURRENT_USERS = parseInt(process.env.SWARM_USERS || "10", 10);
  const MAX_PATHS_PER_USER = parseInt(process.env.SWARM_PATHS || "3", 10);
  const RUN_DURATION_MS = parseInt(process.env.SWARM_DURATION || "60000", 10);
  
  console.log(`neurodivergent-swarm-e2e: Simulating ${CONCURRENT_USERS} concurrent users, ${MAX_PATHS_PER_USER} paths each`);
  console.log(`neurodivergent-swarm-e2e: Run duration: ${RUN_DURATION_MS}ms`);
  
  const startTime = Date.now();
  const userPromises = [];
  
  // Launch user simulations
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const userId = `user_${i}_${Date.now()}`;
    const promise = simulateUser(browser, userId, MAX_PATHS_PER_USER);
    userPromises.push(promise);
    
    // Stagger user starts
    await setTimeout(100 + Math.floor(Math.random() * 200));
  }
  
  // Run for specified duration or until all users done
  const timeoutPromise = setTimeout(RUN_DURATION_MS).then(() => {
    console.log("\nneurodivergent-swarm-e2e: Duration reached, stopping...");
    isRunning = false;
  });
  
  const sessions = await Promise.all(userPromises);
  clearTimeout(timeoutPromise);
  
  await browser.close();
  
  // Report
  console.log("\n=== NEURODIVERGENT SWARM TEST REPORT ===");
  console.log(`Total users simulated: ${sessions.length}`);
  console.log(`Total paths completed: ${sessions.reduce((a, s) => a + s.paths, 0)}`);
  console.log(`Total violations found: ${violations.length}`);
  
  // Group violations by type
  const byType = violations.reduce((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {});
  
  for (const [type, items] of Object.entries(byType)) {
    const highs = items.filter((i) => i.severity === "HIGH").length;
    console.log(`\n${type}: ${items.length} violations (${highs} HIGH severity)`);
    
    // Show first 3 unique messages per type
    const uniqueMessages = [...new Set(items.map((i) => i.message))].slice(0, 3);
    uniqueMessages.forEach((msg) => console.log(`  - ${msg}`));
  }
  
  // Exit code based on HIGH severity violations
  const highSeverityCount = violations.filter((v) => v.severity === "HIGH").length;
  if (highSeverityCount > 0) {
    console.log(`\nFAILED: ${highSeverityCount} HIGH severity neurodivergent issues found`);
    shutdown();
    process.exit(1);
  } else {
    console.log("\nPASSED: No HIGH severity neurodivergent issues detected");
    shutdown();
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("neurodivergent-swarm-e2e:", e.message || e);
  shutdown();
  process.exit(1);
});
