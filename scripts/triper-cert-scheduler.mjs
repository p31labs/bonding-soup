#!/usr/bin/env node
/**
 * TRIPER Cert Freshness Scheduler
 * Daily automatic TRIPER certification generation.
 * Runs in CI (daily) and stores cert log for release gates.
 * 
 * Usage: node triper-cert-scheduler.mjs [--force]
 * 
 * Exit codes:
 *   0 - Success (cert generated and valid, or cert is fresh)
 *   1 - Error (execution failure, file system error, etc.)
 *   2 - Cert generation failed or suites did not pass
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const CERT_LOG_DIR = path.join(ROOT, "tests", "triper", "logs");
const CERT_LOG_FILE = path.join(CERT_LOG_DIR, `cert-${new Date().toISOString().split("T")[0]}.json`);
const CERT_LOG_CURRENT = path.join(CERT_LOG_DIR, "cert-latest.json");
const STAMP_FILE = path.join(CERT_LOG_DIR, ".last-cert-stamp");

function runTriperCert(extraArgs = []) {
  console.log("Running TRIPER cert...");
  try {
    const cmd = `npx vitest run --config vitest.triper.config.mjs tests/triper/triper-runner.mjs ${extraArgs.join(" ")}`;
    console.log(`  $ ${cmd}`);
    const output = execSync(cmd, { 
      stdio: "pipe", 
      encoding: "utf8",
      timeout: 30 * 60 * 1000 // 30 min
    });
    return { success: true, output };
  } catch (e) {
    return { success: false, output: e.stdout || "", error: e.stderr || e.message };
  }
}

function readCertLog(dateStr) {
  const file = path.join(CERT_LOG_DIR, `cert-${dateStr}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return null;
}

function writeCertLog(log) {
  if (!fs.existsSync(CERT_LOG_DIR)) {
    fs.mkdirSync(CERT_LOG_DIR, { recursive: true });
  }
  fs.writeFileSync(CERT_LOG_FILE, JSON.stringify(log, null, 2));
  fs.writeFileSync(CERT_LOG_CURRENT, JSON.stringify(log, null, 2));
  fs.writeFileSync(STAMP_FILE, log.timestamp);
  console.log(`✓ Cert log written: ${CERT_LOG_FILE}`);
}

function shouldRunCert() {
  if (!fs.existsSync(STAMP_FILE)) {
    return { run: true, reason: "No stamp file found" };
  }
  const stamp = fs.readFileSync(STAMP_FILE, "utf8").trim();
  const stampDate = new Date(stamp).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];
  
  if (stampDate === today) {
    return { run: false, reason: `Cert already generated today (${today})`, stampDate };
  }
  
  // Also check if cert log exists for today
  const todayLog = readCertLog(today);
  if (todayLog) {
    return { run: false, reason: `Cert log for today already exists`, stampDate: today };
  }
  
  return { run: true, reason: `Last cert: ${stampDate}, today: ${today}`, stampDate };
}

function collectSuiteResults(output) {
  const lines = output.split("\n");
  const suites = [];
  let currentSuite = null;
  
  for (const line of lines) {
    const suiteMatch = line.match(/tests\/(triper|mvp)\/([^\s]+?)\.triper\.test\.mjs/);
    if (suiteMatch) {
      if (currentSuite) suites.push(currentSuite);
      currentSuite = {
        file: suiteMatch[0],
        name: suiteMatch[2],
        status: "unknown",
        tests: 0,
        passed: 0,
        failed: 0
      };
    }
    
    const testMatch = line.match(/Tests\s+(\d+)\s+passed/);
    if (testMatch && currentSuite) {
      currentSuite.tests = parseInt(testMatch[1]);
      currentSuite.passed = parseInt(testMatch[1]);
      currentSuite.status = "passed";
    }
    
    const failMatch = line.match(/(\d+\s+)?(FAIL|✗|×)/);
    if (failMatch && currentSuite) {
      currentSuite.status = "failed";
    }
  }
  
  if (currentSuite) suites.push(currentSuite);
  return suites;
}

function main() {
  let exitCode = 0;
  
  try {
    const force = process.argv.includes("--force");
    const ci = process.argv.includes("--ci");
    
    console.log("TRIPER Cert Freshness Scheduler");
    console.log(`Date: ${new Date().toISOString().split("T")[0]}`);
    console.log(`Force: ${force}, CI: ${ci}`);
    
    const decision = shouldRunCert();
    console.log(`Decision: ${decision.run ? "RUN" : "SKIP"} — ${decision.reason}`);
    
    if (!decision.run && !force) {
      console.log("\n✓ Cert is fresh. Use --force to regenerate.");
      process.exit(0);
    }
    
    console.log("\n" + "=".repeat(60));
    const result = runTriperCert();
    console.log("=".repeat(60) + "\n");
    
    const suites = collectSuiteResults(result.output + (result.error || ""));
    const allPassed = suites.length > 0 && suites.every(s => s.status === "passed");
    
    const log = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      success: result.success && allPassed,
      gateStatus: result.success && allPassed ? "AUTHORIZED" : "BLOCKED",
      suites,
      totalSuites: suites.length,
      passedSuites: suites.filter(s => s.status === "passed").length,
      totalTests: suites.reduce((s, x) => s + x.tests, 0),
      output: result.output,
      error: result.error,
      generatedForCI: ci || false
    };
    
    writeCertLog(log);
    
    console.log("\nSuites:");
    for (const s of suites) {
      console.log(`  ${s.status === "passed" ? "✓" : "✗"} ${s.name} — ${s.tests} tests`);
    }
    
    console.log(`\nGate Status: ${log.gateStatus}`);
    console.log(`Total: ${log.totalTests} tests across ${log.totalSuites} suites`);
    
    if (!log.success) {
      console.error("\n❌ Cert generation failed or suites did not pass");
      exitCode = 2;
    } else {
      console.log("\n✓ Cert fresh and valid");
      exitCode = 0;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

main();
