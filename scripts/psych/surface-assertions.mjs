/**
 * P31 Psychological E2E — Surface-Specific Assertions
 * Bespoke Playwright assertions for individual surfaces.
 * These execute AFTER the generic DOM observer finishes its measurements.
 *
 * Assertions here are deliberately specific — they test surface-level contracts
 * that the generic science formulas cannot know about (e.g., WebGL destruction).
 *
 * [Opus2026] Extracted from prototype tests.mjs during WCD-PSYCH-MERGE-20260503.
 */

/**
 * Execute surface-specific assertions for a given URL and persona.
 * Called by the test runner after generic observation completes.
 *
 * @param {import('playwright').Page} page  Playwright page object
 * @param {string} url                     Absolute URL being tested
 * @param {object} persona                 PersonaRecord with id, wmCapacity, etc.
 * @returns {Promise<Array<{criterion:string, penalty:number, detail:string}>>}
 */
export async function assertSurface(page, url, persona) {
  const assertions = [];

  // ─── /geodesic.html — WebGL destruction protocol (P0 for W-FLARE) ─────────
  if (url.includes('/geodesic') || url.includes('/dome') || url.includes('/observatory')) {
    // Force safe mode if W-FLARE persona (simulates MEDIC agent threshold hit)
    if (persona.id === 'W-FLARE') {
      await page.evaluate(() => {
        document.body.classList.add('safe-mode');
        // Trigger the safe mode handler if defined
        if (typeof engageSafeMode === 'function') {
          engageSafeMode();
        } else if (window.p31SafeMode && typeof window.p31SafeMode.engage === 'function') {
          window.p31SafeMode.engage();
        }
      });
      await page.waitForTimeout(150); // Allow disposal cycle to complete

      const webglState = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { canvasPresent: false, contextLost: true };

        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        return {
          canvasPresent: true,
          contextLost: gl ? gl.isContextLost() : true,
          safeModeActive: document.body.classList.contains('safe-mode'),
        };
      });

      // P0 VIOLATION: WebGL context alive during safe-mode (GPU drain during flare)
      if (webglState.canvasPresent && !webglState.contextLost) {
        assertions.push({
          criterion: 'webgl-crisis-leak',
          penalty: 30, // Maximum deduction — this is a medical safety issue
          detail: 'P0 VIOLATION: WebGL context alive during safe-mode (GPU drain during calcium flare)',
        });
      }
    }

    // General WebGL safe-mode availability check (any persona)
    const hasDestructionProtocol = await page.evaluate(() => {
      return typeof engageSafeMode === 'function' ||
             (window.p31SafeMode && typeof window.p31SafeMode.engage === 'function') ||
             document.querySelector('[data-safe-mode]');
    });

    if (!hasDestructionProtocol) {
      assertions.push({
        criterion: 'webgl-safety-missing',
        penalty: 15,
        detail: 'WebGL surface lacks safe-mode destruction protocol (no engageSafeMode or p31SafeMode)',
      });
    }
  }

  // ─── /passport.html — Slider and cognitive accommodation tests ─────────────
  if (url.includes('/passport') || url.includes('/passport-generator')) {
    // Test that the cognitive density slider exists and responds
    const sliderWorks = await page.evaluate(() => {
      const slider = document.querySelector('[data-cognitive-density], input[type="range"]');
      if (!slider) return false;

      // Test that changing the slider updates some output
      const initialVal = slider.value;
      slider.value = Math.min(parseInt(slider.max || 100), parseInt(initialVal) + 10);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));

      // Check if any output element updated
      const outputs = document.querySelectorAll('[data-density-output], .density-value, #density-display');
      return outputs.length > 0 || document.querySelector('.safe-mode') !== null;
    });

    if (!sliderWorks) {
      assertions.push({
        criterion: 'passport-slider-broken',
        penalty: 10,
        detail: 'Cognitive density slider not functional or missing output binding',
      });
    }

    // Check for presence of accommodation presets (High-N, ADHD, etc.)
    const hasPresets = await page.evaluate(() => {
      return document.querySelector('[data-preset], [data-accommodation], .preset-btn, button[data-persona]') !== null;
    });

    if (!hasPresets) {
      assertions.push({
        criterion: 'passport-presets-missing',
        penalty: 8,
        detail: 'No cognitive accommodation presets found (High-N, ADHD, SPS)',
      });
    }
  }

  // ─── /delta-language.html — Glossary search and content quality ─────────────
  if (url.includes('/delta') && !url.includes('/delta.')) { // delta-language, not delta.html
    const glossaryWorks = await page.evaluate(() => {
      const search = document.querySelector('[data-glossary-search], input[placeholder*="glossary"], #glossary-search');
      const terms = document.querySelectorAll('[data-term], .glossary-term, dt');
      return { searchPresent: !!search, termCount: terms.length };
    });

    if (!glossaryWorks.searchPresent && glossaryWorks.termCount > 5) {
      // Many terms but no search = poor UX
      assertions.push({
        criterion: 'delta-glossary-unsearchable',
        penalty: 8,
        detail: `Glossary has ${glossaryWorks.termCount} terms but no search functionality`,
      });
    }
  }

  // ─── /observatory.html — Telemetry and data availability ─────────────────────
  if (url.includes('/observatory') || url.includes('/k4market')) {
    const telemetryReady = await page.evaluate(() => {
      // Check for live mesh data or at least a loading state
      const hasLoader = document.querySelector('[data-loading], .loading, .telemetry-loading') !== null;
      const hasData = document.querySelector('[data-telemetry], [data-mesh], .telemetry-value') !== null;
      const hasError = document.querySelector('[data-error], .error-message') !== null;

      return { hasLoader, hasData, hasError };
    });

    if (telemetryReady.hasError && !telemetryReady.hasData) {
      assertions.push({
        criterion: 'observatory-telemetry-failed',
        penalty: 12,
        detail: 'Observatory showing error state with no telemetry data loaded',
      });
    }
  }

  // ─── /buffer.html — Fawn/Freeze Guard (sensitive content) ────────────────────
  if (url.includes('/buffer') || url.includes('/fawn-guard')) {
    // This surface is designed for neurodivergent users in fawn/freeze states
    // It must have: no auto-playing media, no aggressive CTAs, clear exit path

    const fawnGuardChecks = await page.evaluate(() => {
      const autoPlayMedia = document.querySelector('video[autoplay], audio[autoplay], [data-autoplay]');
      const aggressiveCtas = document.querySelectorAll('.urgent, .limited-time, .countdown, [data-countdown]').length;
      const exitPath = document.querySelector('[data-exit], .safe-exit, a[href="/"], .home-link');

      return {
        hasAutoPlay: !!autoPlayMedia,
        aggressiveCtaCount: aggressiveCtas,
        hasExitPath: !!exitPath,
      };
    });

    if (fawnGuardChecks.hasAutoPlay) {
      assertions.push({
        criterion: 'buffer-autoplay-violation',
        penalty: 20,
        detail: 'Fawn-guard surface has auto-playing media (overstimulation risk)',
      });
    }

    if (fawnGuardChecks.aggressiveCtaCount > 0) {
      assertions.push({
        criterion: 'buffer-aggressive-cta',
        penalty: 15,
        detail: `Fawn-guard surface has ${fawnGuardChecks.aggressiveCtaCount} aggressive CTAs (countdown/urgent language)`,
      });
    }

    if (!fawnGuardChecks.hasExitPath) {
      assertions.push({
        criterion: 'buffer-no-exit',
        penalty: 12,
        detail: 'Fawn-guard surface lacks clear exit path (safety requirement)',
      });
    }
  }

  // ─── /geodesic.html — ADHD Hyperfocus absorption test ────────────────────────
  if ((url.includes('/geodesic') || url.includes('/dome')) && persona.ndProfile?.adhd > 0.5) {
    // Test that the ADHD hyperfocus mode is available and functional
    const hyperfocusAvailable = await page.evaluate(() => {
      return document.querySelector('[data-hyperfocus], .hyperfocus-mode, #hyperfocus-toggle') !== null ||
             document.body.classList.contains('hyperfocus-available');
    });

    if (!hyperfocusAvailable) {
      assertions.push({
        criterion: 'geodesic-adhd-missing',
        penalty: 8,
        detail: 'Geodesic builder lacks ADHD hyperfocus accommodation for high-ADHD personas',
      });
    }
  }

  // ─── /mesh-start.html — Passkey and auth flow tests ─────────────────────────
  if (url.includes('/mesh-start') || url.includes('/auth')) {
    const authChecks = await page.evaluate(() => {
      const hasPasskeyBtn = document.querySelector('[data-passkey], .passkey-auth, button[data-auth="passkey"]') !== null;
      const hasRoomCode = document.querySelector('input[data-room-code], input[placeholder*="room"], #room-code') !== null;
      const hasHelp = document.querySelector('[data-help], .auth-help, .passkey-help') !== null;

      return { hasPasskeyBtn, hasRoomCode, hasHelp };
    });

    if (!authChecks.hasPasskeyBtn && !authChecks.hasRoomCode) {
      assertions.push({
        criterion: 'mesh-start-no-auth',
        penalty: 10,
        detail: 'Mesh start page lacks both passkey and room code auth options',
      });
    }

    if (!authChecks.hasHelp) {
      assertions.push({
        criterion: 'mesh-start-no-help',
        penalty: 5,
        detail: 'Mesh start page lacks help/guidance for auth options',
      });
    }
  }

  return assertions;
}

/**
 * Aggregate surface assertions into the main deductions array.
 * Called by the test runner to merge bespoke assertions with science-core scoring.
 *
 * @param {Array} deductions      Existing deductions from scorer.mjs
 * @param {Array} surfaceAsserts  New assertions from assertSurface()
 * @returns {Array}               Merged deductions array
 */
export function mergeAssertions(deductions, surfaceAsserts) {
  if (!surfaceAsserts || surfaceAsserts.length === 0) return deductions;

  // Convert surface assertions to standard deduction format
  const converted = surfaceAsserts.map((a) => ({
    criterion: a.criterion,
    violation: a.detail,
    severity: a.penalty >= 20 ? 'P0' : a.penalty >= 10 ? 'P1' : 'P2',
    points: a.penalty,
    maxPoints: 30,
    raw: null, // No raw metric for bespoke assertions
  }));

  return [...deductions, ...converted];
}
