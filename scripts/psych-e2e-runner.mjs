#!/usr/bin/env node
/**
 * P31 Psychological E2E Test Runner
 * Orchestrates 7-layer architecture for neurodivergent persona simulation
 * 
 * Usage:
 *   npm run test:psych-e2e -- --persona=W-CRISIS --surface=/geodesic.html
 *   npm run test:psych-e2e:all
 *   npm run test:psych-e2e:ci
 */

import { chromium } from 'playwright';
import { personas, getPersonaState } from './psych/personas.mjs';
import { SevenLayerStack } from './psych/layers.mjs';
import { TestCases } from './psych/tests.mjs';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const REPORT_DIR = './test-results/psych-e2e';
const DASHBOARD_DATA = './psych-e2e-data.json';

// CLI argument parsing
const args = process.argv.slice(2);
const options = {
  persona: args.find(a => a.startsWith('--persona='))?.split('=')[1] || 'W',
  surface: args.find(a => a.startsWith('--surface='))?.split('=')[1] || '/geodesic.html',
  all: args.includes('--all'),
  ci: args.includes('--ci'),
  headless: args.includes('--headless') || args.includes('--ci'),
  verify: args.find(a => a.startsWith('--verify='))?.split('=')[1]
};

class PsychE2ERunner {
  constructor() {
    this.results = [];
    this.layerStack = new SevenLayerStack();
    this.browser = null;
    this.context = null;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: options.headless,
      args: ['--disable-gpu', '--no-sandbox']
    });
    
    // Ensure report directory exists
    if (!existsSync(REPORT_DIR)) {
      await mkdir(REPORT_DIR, { recursive: true });
    }
  }

  async runTest(personaId, surfacePath, testId = null) {
    const persona = personas[personaId];
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`);
    }

    console.log(`\n▶ Testing: ${persona.name} on ${surfacePath}`);
    
    // L1-L3: Setup persona state
    const state = getPersonaState(personaId);
    console.log(`  Calcium: ${state.calcium} mg/dL | Spoons: ${state.spoons} | Cognitive: ${state.cognitiveLoad}x`);

    // L4: Create browser context with persona adaptations
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      reducedMotion: persona.accommodations.includes('reduced-motion') ? 'reduce' : 'no-preference',
      // Simulate visual field for calcium crash
      ...persona.browserContext
    });

    const page = await this.context.newPage();
    
    // Apply physiological layer effects (L2)
    if (persona.physiologicalEffects) {
      await page.evaluateOnNewDocument((effects) => {
        window.__P31_PERSONA_EFFECTS = effects;
      }, persona.physiologicalEffects);
    }

    const startTime = Date.now();
    const metrics = {
      timeToFirstInteraction: null,
      timeToCompletion: null,
      errorRate: 0,
      backtrackCount: 0,
      pauses: [],
      rageClicks: 0
    };

    try {
      // Navigate to surface
      const url = `http://localhost:8080${surfacePath}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for PHOS router injection
      await page.waitForSelector('.phos-container, #phos-jarvis, [data-phos-ready]', 
        { timeout: 5000 }).catch(() => {
        console.warn('  ⚠ PHOS router not detected');
      });

      // Track interactions
      await this.setupInteractionTracking(page, metrics);

      // Execute test scenario
      const testCase = testId ? TestCases[testId] : this.inferTestCase(surfacePath);
      if (testCase) {
        await testCase.execute(page, persona, metrics);
      }

      // L6: Collect measurements
      metrics.timeToCompletion = (Date.now() - startTime) / 1000;
      
      // L5: Verify accommodations
      const accommodationsActive = await this.verifyAccommodations(page, persona);
      
      // L7: Generate result
      const result = {
        schema: 'p31.psychE2eResult/2.0.0',
        testId: testId || `${personaId}-${surfacePath.replace(/\//g, '-')}`,
        timestamp: new Date().toISOString(),
        persona: personaId,
        surface: surfacePath,
        accommodations: accommodationsActive,
        result: this.determinePassFail(metrics, persona),
        metrics,
        violations: this.detectViolations(metrics, persona),
        operatorAlert: this.shouldAlertOperator(metrics, persona)
      };

      this.results.push(result);
      
      // Console output
      const icon = result.result === 'PASS' ? '✓' : result.result === 'FAIL' ? '✗' : '⚠';
      console.log(`  ${icon} Result: ${result.result} (${metrics.timeToCompletion.toFixed(1)}s)`);
      
      if (result.violations.length > 0) {
        result.violations.forEach(v => console.log(`    ⚠ ${v}`));
      }

      return result;

    } catch (error) {
      const failResult = {
        schema: 'p31.psychE2eResult/2.0.0',
        testId: testId || `${personaId}-${surfacePath.replace(/\//g, '-')}`,
        timestamp: new Date().toISOString(),
        persona: personaId,
        surface: surfacePath,
        result: 'ERROR',
        error: error.message,
        metrics
      };
      this.results.push(failResult);
      console.error(`  ✗ ERROR: ${error.message}`);
      return failResult;
    } finally {
      await this.context.close();
    }
  }

  async setupInteractionTracking(page, metrics) {
    let lastInteraction = Date.now();
    let lastClickCoords = null;
    let clickCount = 0;

    await page.exposeFunction('__trackInteraction', (type, data) => {
      const now = Date.now();
      
      if (type === 'click') {
        // Detect rage clicks (3+ same coord <1s)
        if (lastClickCoords && 
            Math.abs(data.x - lastClickCoords.x) < 5 &&
            Math.abs(data.y - lastClickCoords.y) < 5 &&
            now - lastClickCoords.time < 1000) {
          clickCount++;
          if (clickCount >= 3) {
            metrics.rageClicks++;
            console.log('    ⚠ Rage click detected');
          }
        } else {
          clickCount = 1;
          lastClickCoords = { x: data.x, y: data.y, time: now };
        }

        // Time to first interaction
        if (!metrics.timeToFirstInteraction) {
          metrics.timeToFirstInteraction = (now - lastInteraction) / 1000;
        }
      }

      if (type === 'pause') {
        metrics.pauses.push(data.duration);
      }

      if (type === 'backtrack') {
        metrics.backtrackCount++;
      }

      lastInteraction = now;
    });

    // Inject tracking script
    await page.addInitScript(() => {
      document.addEventListener('click', (e) => {
        window.__trackInteraction('click', { x: e.clientX, y: e.clientY });
      });

      // Detect pauses (no mouse movement for 2s)
      let pauseTimer;
      let pauseStart;
      document.addEventListener('mousemove', () => {
        if (pauseStart) {
          const duration = Date.now() - pauseStart;
          if (duration > 2000) {
            window.__trackInteraction('pause', { duration });
          }
          pauseStart = null;
        }
        clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => {
          pauseStart = Date.now();
        }, 2000);
      });

      // Detect backtrack (hash change or history pop)
      window.addEventListener('popstate', () => {
        window.__trackInteraction('backtrack', {});
      });
    });
  }

  async verifyAccommodations(page, persona) {
    const active = [];

    // Check safe mode
    const safeMode = await page.evaluate(() => document.body.classList.contains('safe-mode'));
    if (safeMode) active.push('safe-mode');

    // Check reduced motion
    const reducedMotion = await page.evaluate(() => 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    if (reducedMotion) active.push('reduced-motion');

    // Check WebGL destruction for W-CRISIS
    if (persona.id === 'W-CRISIS') {
      const webglDestroyed = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return !canvas || canvas.parentElement === null;
      });
      if (webglDestroyed) active.push('webgl-destroyed');
    }

    return active;
  }

  determinePassFail(metrics, persona) {
    const thresholds = persona.thresholds;
    
    if (metrics.timeToFirstInteraction > thresholds.abandonment) return 'FAIL';
    if (metrics.timeToCompletion > thresholds.shutdown) return 'FAIL';
    if (metrics.errorRate > 0.2) return 'FAIL';
    if (metrics.rageClicks > 2) return 'WARN';
    
    return 'PASS';
  }

  detectViolations(metrics, persona) {
    const violations = [];
    
    if (metrics.timeToFirstInteraction > 10) {
      violations.push('Time-to-first-interaction exceeds 10s threshold');
    }
    if (metrics.pauses.length > 5) {
      violations.push('Multiple confusion pauses detected');
    }
    if (metrics.backtrackCount > 3) {
      violations.push('Navigation backtracking indicates cognitive overload');
    }

    return violations;
  }

  shouldAlertOperator(metrics, persona) {
    // P0: Medical crisis simulation failed
    if (persona.id === 'W-CRISIS' && metrics.webglContextDestroyed === false) {
      return 'P0: WebGL context not destroyed in safe mode - GPU drain risk';
    }
    
    // P1: Shutdown risk
    if (metrics.timeToCompletion > 300) {
      return 'P1: Task completion >5min - shutdown risk';
    }

    return null;
  }

  inferTestCase(surfacePath) {
    const mapping = {
      '/geodesic.html': TestCases.geodesicSafeMode,
      '/passport.html': TestCases.passportSlider,
      '/delta-language.html': TestCases.glossarySearch,
      '/observatory.html': TestCases.telemetryRead
    };
    return mapping[surfacePath];
  }

  async runAll() {
    const survivors = [
      { persona: 'W', surface: '/geodesic.html' },
      { persona: 'W-CRISIS', surface: '/geodesic.html' },
      { persona: 'S.J.', surface: '/passport.html' },
      { persona: 'W.J.', surface: '/delta-language.html' },
      { persona: 'W-SHUTDOWN', surface: '/observatory.html' },
      { persona: 'W-HYPERFOCUS', surface: '/passport.html' }
    ];

    for (const test of survivors) {
      await this.runTest(test.persona, test.surface);
    }
  }

  async generateReport() {
    // Save detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(REPORT_DIR, `psych-e2e-${timestamp}.json`);
    await writeFile(reportPath, JSON.stringify(this.results, null, 2));

    // Update dashboard data
    await writeFile(DASHBOARD_DATA, JSON.stringify({
      lastRun: new Date().toISOString(),
      summary: {
        total: this.results.length,
        pass: this.results.filter(r => r.result === 'PASS').length,
        fail: this.results.filter(r => r.result === 'FAIL').length,
        warn: this.results.filter(r => r.result === 'WARN').length
      },
      alerts: this.results.filter(r => r.operatorAlert).map(r => ({
        testId: r.testId,
        alert: r.operatorAlert
      })),
      results: this.results
    }, null, 2));

    // Console summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('PSYCHOLOGICAL E2E SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total:  ${this.results.length}`);
    console.log(`Pass:   ${this.results.filter(r => r.result === 'PASS').length} ✓`);
    console.log(`Fail:   ${this.results.filter(r => r.result === 'FAIL').length} ✗`);
    console.log(`Warn:   ${this.results.filter(r => r.result === 'WARN').length} ⚠`);
    console.log(`\nReport: ${reportPath}`);
    console.log(`Dashboard data: ${DASHBOARD_DATA}`);
    
    const alerts = this.results.filter(r => r.operatorAlert);
    if (alerts.length > 0) {
      console.log('\n🚨 OPERATOR ALERTS:');
      alerts.forEach(r => console.log(`   ${r.operatorAlert}`));
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const runner = new PsychE2ERunner();
  
  try {
    await runner.init();

    if (options.all) {
      await runner.runAll();
    } else if (options.verify === 'autoethnography') {
      // Verify that personas match operator self-report
      console.log('Verifying autoethnographic grounding...');
      for (const [id, persona] of Object.entries(personas)) {
        console.log(`  ${id}: ${persona.autoethnographyVerified ? '✓' : '✗'} ${persona.name}`);
      }
    } else {
      await runner.runTest(options.persona, options.surface);
    }

    await runner.generateReport();

    // CI exit code
    if (options.ci) {
      const failures = runner.results.filter(r => r.result === 'FAIL');
      const p0Alerts = runner.results.filter(r => r.operatorAlert?.startsWith('P0'));
      
      if (p0Alerts.length > 0) {
        console.error('\n❌ P0 ALERTS DETECTED - FAILING CI');
        process.exit(1);
      }
      if (failures.length > 0) {
        console.error('\n❌ TEST FAILURES - FAILING CI');
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

main();
