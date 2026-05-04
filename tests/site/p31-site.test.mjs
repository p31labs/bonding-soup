/**
 * P31 Site Comprehensive Test Suite
 * Tests: phosphorus31.org website, donation pipeline, glass box, grant pipeline
 * 
 * Run: npm test tests/site/p31-site.test.mjs
 * Or: node tests/site/p31-site.test.mjs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SITE_ROOT = path.join(ROOT, 'phosphorus31.org/website');

// ───────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ───────────────────────────────────────────────────────────────────────────────

function loadHtml(filePath) {
  const fullPath = path.join(SITE_ROOT, filePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractMeta(html, name) {
  const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function hasStylesheetLink(html, href) {
  return html.includes(`href="${href}"`) || html.includes(`href='${href}'`);
}

function hasElement(html, selector) {
  // Simple checks for common patterns
  if (selector.startsWith('.')) {
    const className = selector.slice(1);
    // Handle both single-class and multi-class attributes
    const doubleQuotePattern = new RegExp(`class="[^"]*\\b${className}\\b[^"]*"`);
    const singleQuotePattern = new RegExp(`class='[^']*\\b${className}\\b[^']*'`);
    return doubleQuotePattern.test(html) || singleQuotePattern.test(html);
  }
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    return html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  }
  return html.includes(`<${selector}`);
}

// ───────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Website Structure & SEO
// ───────────────────────────────────────────────────────────────────────────────

describe('P31 Website: Structure & SEO', () => {
  const pages = [
    { path: 'index.html', name: 'Homepage', required: ['.hero', '.site-header', '.footer-legal', '.btn-primary'] },
    { path: 'about/index.html', name: 'About', required: ['.container', '.footer-legal'] },
    { path: 'donate/index.html', name: 'Donate', required: ['.tier-grid', '.tier-card'] },
    { path: 'legal/index.html', name: 'Legal', required: ['.legal-section', '.footer-legal'] },
    { path: 'press/index.html', name: 'Press', required: ['.container', '.footer-legal'] },
    { path: 'roadmap/index.html', name: 'Roadmap', required: ['.container', '.footer-legal'] },
    { path: 'docs/index.html', name: 'Docs', required: ['.container', '.footer-legal'] },
    { path: 'blog/index.html', name: 'Blog', required: ['.container', '.footer-legal'] },
    { path: 'node-one/index.html', name: 'Node One', required: ['.container', '.footer-legal'] },
    { path: 'wallet/index.html', name: 'Wallet', required: ['.container', '.footer-legal'] },
    { path: 'games/index.html', name: 'Games', required: ['.container', '.footer-legal'] },
    { path: 'education/index.html', name: 'Education', required: ['.container', '.footer-legal'] },
    { path: 'accessibility/index.html', name: 'Accessibility', required: ['.container', '.footer-legal'] },
    { path: 'manifesto/index.html', name: 'Manifesto', required: ['.container', '.footer-legal'] },
  ];

  pages.forEach(page => {
    describe(`${page.name} (${page.path})`, () => {
      let html;
      
      beforeAll(() => {
        html = loadHtml(page.path);
      });

      it('should exist and be readable', () => {
        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(500);
      });

      it('should have a valid HTML5 doctype', () => {
        expect(html).toMatch(/^<!DOCTYPE html>/i);
      });

      it('should have a title', () => {
        const title = extractTitle(html);
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(3);
        expect(title.length).toBeLessThan(100);
      });

      it('should have viewport meta tag', () => {
        expect(html).toMatch(/<meta[^>]*viewport/i);
      });

      it('should have charset meta tag', () => {
        expect(html).toMatch(/<meta[^>]*charset="UTF-8"/i);
      });

      it('should link to unified styles.css', () => {
        const isSubpage = page.path.includes('/');
        const expectedHref = isSubpage ? '../styles.css' : 'styles.css';
        expect(hasStylesheetLink(html, expectedHref)).toBe(true);
      });

      it('should load a web font or system font stack', () => {
        // Canonical: Atkinson Hyperlegible (p31-universal-canon.json + styles.css)
        expect(html).toMatch(/Atkinson|Inter|system-ui|sans-serif/i);
      });

      it('should have correct 501(c)(3) status', () => {
        expect(html).toMatch(/501\(c\)\(3\)/i);
        expect(html).not.toMatch(/501\(c\)\(3\)\s+(pending|forming)/i);
        expect(html).toMatch(/determined\s+may\s+2026|ein\s+42-1888158/i);
      });

      it('should NOT claim fiscal sponsorship by Hack Foundation', () => {
        // Check that it's marked as historical or not present
        const hasActiveSponsorship = /fiscally\s+sponsored\s+by.*hack\s+foundation/i.test(html) && 
                                     !/(historical|previous)/i.test(html);
        expect(hasActiveSponsorship).toBe(false);
      });

      it('should have required structural elements', () => {
        page.required.forEach(selector => {
          expect(hasElement(html, selector)).toBe(true);
        });
      });

      it('should have a footer with EIN', () => {
        expect(html).toMatch(/42-1888158/);
        expect(html).toMatch(/footer/i);
      });

      it('should have semantic HTML structure', () => {
        // Flexibility: pages should have body content and appropriate landmarks
        expect(html).toMatch(/<body/i);
        expect(html).toMatch(/<nav|<header|<main|<section|<footer/i);
      });
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Design System Consistency
// ───────────────────────────────────────────────────────────────────────────────

describe('P31 Website: Design System', () => {
  it('should have a valid styles.css', () => {
    const cssPath = path.join(SITE_ROOT, 'styles.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css.length).toBeGreaterThan(1000);
    
    // Check for design tokens
    expect(css).toMatch(/--void:/);
    expect(css).toMatch(/--surface:/);
    expect(css).toMatch(/--p31-teal:/);
    expect(css).toMatch(/--ink:/);
    expect(css).toMatch(/--font-body:/);
  });

  it('should use canonical brand colors', () => {
    const cssPath = path.join(SITE_ROOT, 'styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // From p31-universal-canon.json
    expect(css).toMatch(/#25897d/); // teal
    expect(css).toMatch(/#cc6247/); // coral
    expect(css).toMatch(/#4db8a8/); // cyan
    expect(css).toMatch(/#3ba372/); // phosphorus
  });

  it('should use light mode for org appearance', () => {
    const cssPath = path.join(SITE_ROOT, 'styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // Light background
    expect(css).toMatch(/#f5f4f0/);
    // Dark text
    expect(css).toMatch(/#0f172a/);
  });

  it('should have responsive breakpoints', () => {
    const cssPath = path.join(SITE_ROOT, 'styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    
    expect(css).toMatch(/@media.*max-width/);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Donation Pipeline
// ───────────────────────────────────────────────────────────────────────────────

describe('P31 Website: Donation Pipeline', () => {
  let donateHtml;
  
  beforeAll(() => {
    donateHtml = loadHtml('donate/index.html');
  });

  it('should have the donation page', () => {
    expect(donateHtml).toBeTruthy();
  });

  it('should reference the Stripe worker endpoint', () => {
    expect(donateHtml).toMatch(/stripe-donate\.trimtab-signal\.workers\.dev/);
  });

  it('should have donation tier buttons', () => {
    expect(donateHtml).toMatch(/onclick="donate\(/);
    expect(donateHtml).toMatch(/dollar.*\$.*10|donate\(10/i);  // tier amounts
  });

  it('should have custom amount input', () => {
    expect(donateHtml).toMatch(/custom-amount/);
    expect(donateHtml).toMatch(/donateCustom/);
  });

  it('should handle donation errors gracefully', () => {
    expect(donateHtml).toMatch(/try\s*\{/);  // try block
    expect(donateHtml).toMatch(/catch.*\{/);  // catch block
    expect(donateHtml).toMatch(/alert.*try again|Could not process/i);
  });

  it('should show loading state', () => {
    expect(donateHtml).toMatch(/loading/);
    expect(donateHtml).toMatch(/classList\.add\(['"]loading['"]\)/);
  });

  it('should redirect to Stripe checkout on success', () => {
    expect(donateHtml).toMatch(/window\.location\.href/);
    expect(donateHtml).toMatch(/data\.url/);
  });

  it('should handle thanks parameter', () => {
    expect(donateHtml).toMatch(/thanks/);
    expect(donateHtml).toMatch(/URLSearchParams/);
  });

  it('should validate minimum donation amount', () => {
    expect(donateHtml).toMatch(/amount\s*<\s*1/);
    expect(donateHtml).toMatch(/parseFloat/);
  });

  it('should have proper EIN in footer', () => {
    expect(donateHtml).toMatch(/42-1888158/);
    expect(donateHtml).toMatch(/501\(c\)\(3\)/i);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Glass Box Integration
// ───────────────────────────────────────────────────────────────────────────────

describe('P31: Glass Box System', () => {
  it('should have glass-box.html', () => {
    const glassBoxPath = path.join(ROOT, 'glass-box.html');
    expect(fs.existsSync(glassBoxPath)).toBe(true);
  });

  it('should have glass-box emitter script', () => {
    const emitterPath = path.join(ROOT, 'scripts/psych/glass-box-emitter.mjs');
    expect(fs.existsSync(emitterPath)).toBe(true);
  });

  it('should have verify-glass-box script', () => {
    const verifyPath = path.join(ROOT, 'scripts/verify-glass-box.mjs');
    expect(fs.existsSync(verifyPath)).toBe(true);
  });

  it('should have build-glass-box script', () => {
    const buildPath = path.join(ROOT, 'scripts/build-glass-box.mjs');
    expect(fs.existsSync(buildPath)).toBe(true);
  });

  it('glass-box.html should use hub appearance (dark)', () => {
    const glassBoxPath = path.join(ROOT, 'glass-box.html');
    const html = fs.readFileSync(glassBoxPath, 'utf8');
    
    expect(html).toMatch(/data-p31-appearance=["']hub["']/);
    expect(html).toMatch(/color-scheme:\s*dark/);
  });

  it('should have proper terminal styling', () => {
    const glassBoxPath = path.join(ROOT, 'glass-box.html');
    const html = fs.readFileSync(glassBoxPath, 'utf8');
    
    expect(html).toMatch(/#term/);
    expect(html).toMatch(/\.l\.ok/);
    expect(html).toMatch(/\.l\.err/);
    expect(html).toMatch(/\.l\.warn/);
  });

  it('emitter should write to correct paths', () => {
    const emitterPath = path.join(ROOT, 'scripts/psych/glass-box-emitter.mjs');
    const code = fs.readFileSync(emitterPath, 'utf8');
    
    expect(code).toMatch(/psych-e2e-live\.json/);
    expect(code).toMatch(/saveReport/);
    expect(code).toMatch(/writeIndex/);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Grant Pipeline
// ───────────────────────────────────────────────────────────────────────────────

describe('P31: Grant Pipeline', () => {
  const grantFiles = [
    'docs/grants/grant-pipeline-v2.json',
    'docs/grants/GRANT-CALENDAR-2026-v2.md',
    'docs/grants/payloads/asan-narrative.md',
    'docs/grants/payloads/nlnet-submission-checklist.md',
    'docs/grants/payloads/stimpunks-application.md',
  ];

  grantFiles.forEach(file => {
    it(`should have ${file}`, () => {
      const fullPath = path.join(ROOT, file);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  it('grant pipeline should have valid JSON schema', () => {
    const pipelinePath = path.join(ROOT, 'docs/grants/grant-pipeline-v2.json');
    const content = fs.readFileSync(pipelinePath, 'utf8');
    
    let data;
    expect(() => {
      data = JSON.parse(content);
    }).not.toThrow();
    
    expect(data.schema).toMatch(/p31\.grantPipeline/);
    expect(data.grants).toBeInstanceOf(Array);
    expect(data.grants.length).toBeGreaterThan(5);
  });

  it('should have ASAN payload with 500-word narrative', () => {
    const asanPath = path.join(ROOT, 'docs/grants/payloads/asan-narrative.md');
    const content = fs.readFileSync(asanPath, 'utf8');
    
    expect(content).toMatch(/William R\. Johnson/);
    expect(content).toMatch(/AuDHD/);
    expect(content).toMatch(/\$6,250/);
    expect(content.length).toBeGreaterThan(1500); // ~400+ words
  });

  it('should have NLnet checklist with verification URLs', () => {
    const nlnetPath = path.join(ROOT, 'docs/grants/payloads/nlnet-submission-checklist.md');
    const content = fs.readFileSync(nlnetPath, 'utf8');
    
    expect(content).toMatch(/k4-agent-hub/);
    expect(content).toMatch(/trimtab-signal\.workers\.dev/);
    expect(content).toMatch(/June 1/);
  });

  it('should reflect 501(c)(3) determination status', () => {
    const pipelinePath = path.join(ROOT, 'docs/grants/grant-pipeline-v2.json');
    const data = JSON.parse(fs.readFileSync(pipelinePath, 'utf8'));

    expect(data.entity.status).toMatch(/501\(c\)\(3\) determined/);
    expect(data.entity.determinationDate).toBe('2026-05-04');
    expect(data.entity.status).not.toMatch(/pending/i);
  });

  it('should have immediate action items', () => {
    const pipelinePath = path.join(ROOT, 'docs/grants/grant-pipeline-v2.json');
    const content = fs.readFileSync(pipelinePath, 'utf8');
    const data = JSON.parse(content);
    
    expect(data.immediateActions).toBeInstanceOf(Array);
    expect(data.immediateActions.length).toBeGreaterThan(3);
  });

  it('should have document package manifest', () => {
    const pipelinePath = path.join(ROOT, 'docs/grants/grant-pipeline-v2.json');
    const content = fs.readFileSync(pipelinePath, 'utf8');
    const data = JSON.parse(content);
    
    expect(data.documentPackage).toBeTruthy();
    expect(data.documentPackage.documents).toBeInstanceOf(Array);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Canonical Alignment
// ───────────────────────────────────────────────────────────────────────────────

describe('P31: Canonical Alignment', () => {
  it('should align with p31-constants.json', () => {
    const constantsPath = path.join(ROOT, 'p31-constants.json');
    const constants = JSON.parse(fs.readFileSync(constantsPath, 'utf8'));
    
    expect(constants.organization.status501c3).toBe('determined_active');
    expect(constants.organization.determinationDate).toBe('2026-05-04');
    expect(constants.organization.ein).toBe('42-1888158');
  });

  it('should align with p31-universal-canon.json', () => {
    const canonPath = path.join(ROOT, 'andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json');
    if (!fs.existsSync(canonPath)) {
      console.log('Skipping - canon file in andromeda/ not present');
      return;
    }
    
    const canon = JSON.parse(fs.readFileSync(canonPath, 'utf8'));
    
    // Verify org appearance is light
    expect(canon.appearances.org.colorScheme).toBe('light');
    
    // Verify brand colors are consistent
    const cssPath = path.join(SITE_ROOT, 'styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // Check that CSS uses canon colors
    expect(css).toMatch(canon.appearances.org.colors.void);
    expect(css).toMatch(canon.appearances.org.colors.ink);
  });

  it('should have consistent EIN across all files', () => {
    const filesToCheck = [
      'phosphorus31.org/website/index.html',
      'phosphorus31.org/website/about/index.html',
      'phosphorus31.org/website/donate/index.html',
      'phosphorus31.org/website/legal/index.html',
      'docs/grants/grant-pipeline-v2.json',
    ];

    filesToCheck.forEach(file => {
      const fullPath = path.join(ROOT, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).toMatch(/42-1888158/);
      }
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Security & Privacy
// ───────────────────────────────────────────────────────────────────────────────

describe('P31 Website: Security & Privacy', () => {
  it('should not expose secrets in HTML', () => {
    const html = loadHtml('index.html');
    
    // Should not contain API keys, tokens, etc.
    expect(html).not.toMatch(/api[_-]?key.*[a-zA-Z0-9]{20,}/i);
    expect(html).not.toMatch(/secret.*[a-zA-Z0-9]{20,}/i);
    expect(html).not.toMatch(/password/i);
  });

  it('should use HTTPS for external resources', () => {
    const html = loadHtml('index.html');
    
    // Check that all external links use HTTPS
    const httpLinks = html.match(/http:\/\/[^\s"'<>]+/g) || [];
    const nonLocalHttp = httpLinks.filter(link => !link.includes('localhost'));
    expect(nonLocalHttp).toHaveLength(0);
  });

  it('should have security headers reference', () => {
    const headersPath = path.join(SITE_ROOT, '_headers');
    if (fs.existsSync(headersPath)) {
      const headers = fs.readFileSync(headersPath, 'utf8');
      expect(headers).toMatch(/X-Frame-Options|Content-Security-Policy|X-Content-Type-Options/i);
    }
  });

  it('donation form should validate input', () => {
    const donateHtml = loadHtml('donate/index.html');
    
    // Should validate amount is number
    expect(donateHtml).toMatch(/parseFloat/);
    // Should check minimum
    expect(donateHtml).toMatch(/amount.*<.*1/);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// EXPORT TESTS FOR RUNNER
// ───────────────────────────────────────────────────────────────────────────────

export { describe, it, expect };
