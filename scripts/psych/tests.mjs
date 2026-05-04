/**
 * P31 Psychological E2E Test Cases
 * 
 * Test scenarios for Bin A survivors and critical surfaces.
 * Each test validates both functionality AND cognitive accessibility.
 * 
 * Schema: p31.psychTestCase/2.0.0
 */

export const TestCases = {
  /**
   * Test 1: Geodesic Safe Mode Destruction
   * Persona: W-CRISIS (calcium 6.8, neurological symptoms)
   * Critical: WebGL must destroy, not just hide
   */
  geodesicSafeMode: {
    name: 'Geodesic Safe Mode WebGL Destruction',
    id: 'geodesic-w-crisis-safe-mode',
    personas: ['W-CRISIS'],
    surface: '/geodesic.html',
    priority: 'P0',
    
    async execute(page, persona, metrics) {
      // Step 1: Verify PHOS suggests safe mode (or auto-triggers for crisis)
      const phosOrb = await page.locator('.phos-orb, #phos-jarvis').first();
      if (await phosOrb.isVisible()) {
        await phosOrb.click();
        metrics.phosQuestions = 1;
      }
      
      // Step 2: Engage safe mode
      const safeBtn = await page.locator('#safeModeBtn').first();
      if (await safeBtn.isVisible()) {
        await safeBtn.click();
      }
      
      // Step 3: Verify WebGL destruction (CRITICAL)
      const webglState = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const gl = canvas?.getContext('webgl') || canvas?.getContext('webgl2');
        return {
          canvasExists: !!canvas,
          canvasInDOM: canvas?.parentElement !== null,
          contextLost: gl ? gl.isContextLost() : true,
          rendererDisposed: window.__rendererDisposed || false
        };
      });
      
      metrics.webglContextDestroyed = webglState.contextLost && !webglState.canvasInDOM;
      metrics.webglState = webglState;
      
      // Step 4: Verify CPU idle (no RAF loops)
      const rafState = await page.evaluate(() => {
        return {
          activeRAF: window.__activeRAF || 0,
          loopsRunning: window.__animationLoops || []
        };
      });
      
      metrics.cpuIdle = rafState.activeRAF === 0;
      
      // Assertions that must pass for P0
      if (!metrics.webglContextDestroyed) {
        throw new Error('P0 VIOLATION: WebGL context not destroyed in safe mode');
      }
      
      // Step 5: Verify Maxwell rigidity still readable (static HTML fallback)
      const maxwellBadge = await page.locator('.rigidity-badge').first();
      if (await maxwellBadge.isVisible()) {
        const text = await maxwellBadge.textContent();
        metrics.maxwellReadable = text.includes('RIGID') || text.includes('WARNING');
      }
      
      return metrics;
    },
    
    assertions: {
      'webgl-destroyed': (m) => m.webglContextDestroyed === true,
      'cpu-idle': (m) => m.cpuIdle === true,
      'maxwell-readable': (m) => m.maxwellReadable === true
    }
  },

  /**
   * Test 2: Passport Slider (Child ADHD)
   * Persona: S.J. (8yo, 90s attention, needs 60px targets)
   */
  passportSlider: {
    name: 'Passport Slider Child Accessible',
    id: 'passport-sj-slider',
    personas: ['S.J.'],
    surface: '/passport.html',
    priority: 'P2',
    
    async execute(page, persona, metrics) {
      // Step 1: Check target sizes (child motor control)
      const slider = await page.locator('input[type="range"]').first();
      const box = await slider.boundingBox();
      metrics.minTargetSize = Math.min(box?.width || 0, box?.height || 0);
      
      // Step 2: Move slider (must complete in <60s for ADHD profile)
      const start = Date.now();
      await slider.fill('50');
      await page.locator('#densityVal').waitFor({ state: 'visible' });
      
      // Step 3: Save (single action, no text input)
      const saveBtn = await page.locator('#saveBtn, .btn-primary').first();
      await saveBtn.click();
      
      // Step 4: Verify success without reading complex text
      const successIndicator = await page.locator('text="Saved", text="✓", .success').first();
      metrics.saveSuccess = await successIndicator.isVisible().catch(() => false);
      
      metrics.timeToCompletion = (Date.now() - start) / 1000;
      
      // Assertions
      if (metrics.minTargetSize < 44) {
        throw new Error('P2 VIOLATION: Touch target too small for child');
      }
      
      return metrics;
    },
    
    assertions: {
      'target-size': (m) => m.minTargetSize >= 44,
      'quick-completion': (m) => m.timeToCompletion < 60,
      'no-text-input': (m) => m.saveSuccess === true
    }
  },

  /**
   * Test 3: Delta Language Glossary (Autistic Literal)
   * Persona: W.J. (10yo, literal interpreter, no metaphors)
   */
  glossarySearch: {
    name: 'Glossary Literal Language',
    id: 'delta-language-wj-literal',
    personas: ['W.J.'],
    surface: '/delta-language.html',
    priority: 'P1',
    
    async execute(page, persona, metrics) {
      // Step 1: Search for "decoherence"
      const searchInput = await page.locator('#termSearch').first();
      await searchInput.fill('decoherence');
      
      // Step 2: Read definition
      const termCard = await page.locator('.term-card').first();
      const definition = await termCard.locator('.term-def').textContent();
      
      // Step 3: Analyze for literal clarity
      const analysis = this.analyzeLiteralClarity(definition);
      metrics.literacyScore = analysis.fleschKincaid;
      metrics.metaphorCount = analysis.metaphors;
      metrics.idiomCount = analysis.idioms;
      metrics.navalReferences = analysis.navalRefs;
      
      // Step 4: Verify no naval references (submarine metaphor ban)
      if (analysis.navalRefs > 0) {
        metrics.operatorNote = 'Operator trigger: submarine/naval metaphor detected';
      }
      
      // Assertions
      if (analysis.fleschKincaid > 12) {
        throw new Error('P2 VIOLATION: Reading level too high');
      }
      
      if (analysis.navalRefs > 0) {
        throw new Error('P1 VIOLATION: Naval metaphor triggers operator trauma response');
      }
      
      return metrics;
    },
    
    analyzeLiteralClarity(text) {
      // Simplified analysis - real implementation would use NLP
      const navalTerms = ['submarine', 'naval', 'floating neutral', 'anchor', 'ship', 'vessel'];
      const idioms = ['just', 'simply', 'obviously', 'of course'];
      
      return {
        fleschKincaid: 8.5, // Placeholder - real calc needed
        metaphors: 0,
        idioms: idioms.filter(i => text.toLowerCase().includes(i)).length,
        navalRefs: navalTerms.filter(n => text.toLowerCase().includes(n)).length
      };
    },
    
    assertions: {
      'reading-level': (m) => m.literacyScore <= 8,
      'no-naval': (m) => m.navalReferences === 0
    }
  },

  /**
   * Test 4: Observatory Telemetry (Shutdown State)
   * Persona: W-SHUTDOWN (single action capacity)
   */
  telemetryRead: {
    name: 'Observatory Single-Action Accessible',
    id: 'observatory-shutdown-single',
    personas: ['W-SHUTDOWN'],
    surface: '/observatory.html',
    priority: 'P1',
    
    async execute(page, persona, metrics) {
      // Step 1: Verify PHOS reduces to single chip
      const phosChips = await page.locator('.phos-btn, .phos-chip').count();
      metrics.phosChipCount = phosChips;
      
      // Step 2: Verify all telemetry visible without scroll
      const panels = await page.locator('.data-panel, .icosa-grid > div').all();
      metrics.visiblePanels = panels.length;
      
      // Check if primary telemetry (top 4 faces) are above fold
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      let aboveFold = 0;
      for (const panel of panels.slice(0, 4)) {
        const box = await panel.boundingBox();
        if (box && box.y < viewportHeight) aboveFold++;
      }
      metrics.primaryTelemetryAboveFold = aboveFold >= 4;
      
      // Step 3: Verify no rotating/animating numbers
      const animatedElements = await page.locator('[class*="animate"], [class*="rotate"]').count();
      metrics.animatedElements = animatedElements;
      
      // Step 4: Verify safe mode auto-triggered
      const safeMode = await page.evaluate(() => 
        document.body.classList.contains('safe-mode')
      );
      metrics.safeModeAuto = safeMode;
      
      // Assertions
      if (!metrics.safeModeAuto && !metrics.phosChipCount === 1) {
        throw new Error('P1 VIOLATION: Shutdown state not accommodated');
      }
      
      if (animatedElements > 0) {
        throw new Error('P1 VIOLATION: Animation present in safe mode');
      }
      
      return metrics;
    },
    
    assertions: {
      'safe-mode-auto': (m) => m.safeModeAuto === true || m.phosChipCount === 1,
      'no-animation': (m) => m.animatedElements === 0,
      'telemetry-visible': (m) => m.primaryTelemetryAboveFold === true
    }
  },

  /**
   * Test 5: All Surfaces + W-HYPERFOCUS (Break Enforcement)
   * Persona: W-HYPERFOCUS (6hr lock risk)
   */
  hyperfocusBreaks: {
    name: 'Hyperfocus Break Prompt',
    id: 'all-hyperfocus-breaks',
    personas: ['W-HYPERFOCUS'],
    surface: '/passport.html', // Test on any engaging surface
    priority: 'P2',
    duration: 3000, // Simulated 50min via time compression
    
    async execute(page, persona, metrics) {
      // Step 1: Engage deeply with surface
      await page.locator('input[type="range"]').first().fill('80');
      
      // Step 2: Simulate 45 minutes (compressed for testing)
      // In real test, this would wait 45min or use time mocking
      await page.waitForTimeout(2000); // Compressed to 2s for CI
      
      // Step 3: Check for break prompt
      const breakPrompt = await page.locator(
        'text="take a break", text="break", .phos-bubble, [data-break-prompt]'
      ).first();
      metrics.breakPromptVisible = await breakPrompt.isVisible().catch(() => false);
      
      // Step 4: Verify gentle interruption (not modal)
      if (metrics.breakPromptVisible) {
        const isModal = await breakPrompt.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.position === 'fixed' && style.zIndex > 100;
        });
        metrics.breakIsModal = isModal; // Should be false
      }
      
      // Step 5: Verify session restore available
      const sessionRestore = await page.locator(
        'text="restore", text="continue where you left"'
      ).first();
      metrics.sessionRestoreAvailable = await sessionRestore.isVisible().catch(() => false);
      
      // Assertions
      if (!metrics.breakPromptVisible) {
        throw new Error('P2 VIOLATION: No break prompt after extended use');
      }
      
      if (metrics.breakIsModal) {
        throw new Error('P2 VIOLATION: Break prompt is modal (too forceful)');
      }
      
      return metrics;
    },
    
    assertions: {
      'break-prompt': (m) => m.breakPromptVisible === true,
      'gentle-interrupt': (m) => m.breakIsModal === false,
      'session-restore': (m) => m.sessionRestoreAvailable === true
    }
  },

  /**
   * Test 6: Fawn Guard Detection (Buffer)
   * Tests passive language detection that Kimi prototyped
   */
  fawnDetection: {
    name: 'Fawn Guard Passive Language',
    id: 'buffer-fawn-detection',
    personas: ['W.J.', 'W-CRISIS'], // Both literal and crisis-vulnerable
    surface: '/buffer.html',
    priority: 'P3',
    
    async execute(page, persona, metrics) {
      // Step 1: Type passive language
      const draftInput = await page.locator('#draftInput').first();
      await draftInput.fill('I am just wondering if maybe we could sorry to bother');
      
      // Step 2: Wait for Fawn Guard
      await page.waitForTimeout(500);
      
      // Step 3: Verify detection
      const fawnAlert = await page.locator('#fawnAlert').first();
      metrics.fawnAlertVisible = await fawnAlert.isVisible().catch(() => false);
      
      const alertText = await fawnAlert.textContent().catch(() => '');
      metrics.detectedWords = ['just', 'maybe', 'sorry'].filter(w => 
        alertText.toLowerCase().includes(w)
      );
      
      // Step 4: Verify non-intrusive (border color, not popup)
      const alertStyle = await fawnAlert.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          borderColor: style.borderColor,
          backgroundColor: style.backgroundColor
        };
      });
      metrics.alertIsSubtle = alertStyle.borderColor.includes('204, 98, 71'); // coral
      
      return metrics;
    },
    
    assertions: {
      'fawn-detected': (m) => m.fawnAlertVisible === true,
      'keywords-found': (m) => m.detectedWords.length >= 2,
      'subtle-alert': (m) => m.alertIsSubtle === true
    }
  }
};

/**
 * Get test case by surface path
 */
export function getTestForSurface(surfacePath) {
  const mapping = {
    '/geodesic.html': TestCases.geodesicSafeMode,
    '/passport.html': TestCases.passportSlider,
    '/delta-language.html': TestCases.glossarySearch,
    '/observatory.html': TestCases.telemetryRead,
    '/buffer.html': TestCases.fawnDetection
  };
  return mapping[surfacePath] || null;
}

/**
 * Run all test cases for a persona
 */
export async function runTestsForPersona(personaId, page, metrics) {
  const results = {};
  const persona = TestCases[Object.keys(TestCases)[0]].personas.includes(personaId);
  
  for (const [name, testCase] of Object.entries(TestCases)) {
    if (testCase.personas.includes(personaId)) {
      try {
        const testMetrics = await testCase.execute(page, { id: personaId }, {});
        results[name] = {
          pass: Object.entries(testCase.assertions).every(([key, fn]) => fn(testMetrics)),
          metrics: testMetrics
        };
      } catch (error) {
        results[name] = { pass: false, error: error.message };
      }
    }
  }
  
  return results;
}
