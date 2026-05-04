#!/usr/bin/env node
/**
 * P31 Site Generator
 * Builds all 25 HTML files from p31-site.json source of truth
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_CONFIG = JSON.parse(await fs.readFile('./p31-site.json', 'utf8'));

const TEMPLATES = {
  base: (page, content) => `<!DOCTYPE html>
<html lang="en" data-p31-appearance="hub">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${page.title} · ${SITE_CONFIG.site.name}</title>
  <meta name="description" content="${SITE_CONFIG.site.description}">
  <meta name="theme-color" content="#0f1115">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${SITE_CONFIG.assets.fonts[0]}" rel="stylesheet">
  
  <link rel="stylesheet" href="/lib/p31-qmu-tokens.css">
  <link rel="stylesheet" href="/p31-style.css">
  
  <style>
    /* Starfield Canvas */
    #starfield-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
      opacity: ${page.starfield?.opacity || 0.5};
    }
    body.safe-mode #starfield-canvas { display: none !important; }
    
    /* Safe Mode Toggle */
    .safe-toggle {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10000;
      padding: 0.5rem 0.75rem;
      border: 1px solid rgba(204,98,71,0.3);
      border-radius: 6px;
      background: rgba(204,98,71,0.08);
      color: var(--p31-coral);
      font-family: var(--p31-font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 150ms;
    }
    .safe-toggle:hover { background: rgba(204,98,71,0.15); }
    
    /* PHOS Orb */
    .phos-orb {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 60px;
      height: 60px;
      z-index: 9999;
      cursor: pointer;
      filter: drop-shadow(0 0 10px rgba(77,184,168,0.4));
      transition: transform 0.3s ease;
    }
    .phos-orb:hover { transform: scale(1.1); }
    body.safe-mode .phos-orb { filter: grayscale(1); animation: none; }
    
    /* Power Level Indicator */
    .power-level {
      position: fixed;
      bottom: 2rem;
      right: 5rem;
      z-index: 9998;
      display: flex;
      gap: 0.25rem;
    }
    .power-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--p31-muted);
      transition: all 0.3s;
    }
    .power-dot.active { background: var(--p31-cyan); box-shadow: 0 0 8px var(--p31-cyan); }
    
    /* Main Content */
    main { position: relative; z-index: 1; }
  </style>
</head>
<body>
  ${page.starfield !== false ? '<canvas id="starfield-canvas"></canvas>' : ''}
  <button class="safe-toggle" onclick="document.body.classList.toggle('safe-mode')">Safe Mode</button>
  
  ${page.phos ? TEMPLATES.phosOrb() : ''}
  
  <main>
    ${content}
  </main>
  
  ${page.starfield !== false ? `
  <script type="module">
    import { Starfield } from '/lib/p31-starfield.mjs';
    const starfield = new Starfield('starfield-canvas', {
      surfaceId: '${page.id}',
      starCount: ${page.starfield?.starCount || SITE_CONFIG.starfield.defaultConfig.starCount},
      meshSync: true
    });
  </script>
  ` : ''}
  
  ${page.phos ? `
  <script type="module">
    import { PHOS } from '/lib/p31-phos-core.mjs';
    window.phos = new PHOS({
      mount: '#phos-orb',
      pageId: '${page.id}',
      powerLevels: ${JSON.stringify(SITE_CONFIG.phos.powerLevels)}
    });
  </script>
  ` : ''}
</body>
</html>`,

  phosOrb: () => `
  <div class="phos-orb" id="phos-orb" title="PHOS Navigation">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="orb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4db8a8;stop-opacity:0.9"/>
          <stop offset="100%" style="stop-color:#3ba372;stop-opacity:0.7"/>
        </linearGradient>
      </defs>
      <polygon points="50,10 10,90 90,90" fill="none" stroke="url(#orb-grad)" stroke-width="2"/>
      <polygon points="50,30 25,75 75,75" fill="url(#orb-grad)" opacity="0.5"/>
    </svg>
  </div>
  <div class="power-level" id="power-level">
    ${[0,1,2,3,4,5,6].map(i => `<div class="power-dot" data-level="${i}"></div>`).join('')}
  </div>
  `,

  phosPanel: () => `
  <div class="phos-panel" id="phos-panel">
    <div class="phos-greeting">
      <h1>Hello.</h1>
      <p>${SITE_CONFIG.phos.tagline}</p>
    </div>
    <div class="phos-question">
      <h2>${SITE_CONFIG.phos.question}</h2>
      <div class="phos-choices">
        ${SITE_CONFIG.phos.intents.map(intent => `
        <a href="${intent.path}" class="phos-choice" data-intent="${intent.id}">
          <span class="phos-icon">${intent.icon}</span>
          <span class="phos-text">
            <span class="phos-label">${intent.label}</span>
            <span class="phos-hint">${intent.hint}</span>
          </span>
          <span class="phos-arrow">→</span>
        </a>
        `).join('')}
      </div>
    </div>
  </div>
  `,

  indexContent: () => `
  <div class="hero">
    <div class="hero-logo">
      <svg viewBox="0 0 200 200" width="120" height="120">
        <defs>
          <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4db8a8"/>
            <stop offset="100%" style="stop-color:#3ba372"/>
          </linearGradient>
        </defs>
        <polygon points="100,20 20,160 100,120 180,160" fill="none" stroke="url(#hero-grad)" stroke-width="3"/>
        <polygon points="100,40 50,130 100,110 150,130" fill="url(#hero-grad)" opacity="0.5"/>
      </svg>
    </div>
    <h1>${SITE_CONFIG.site.name}</h1>
    <p class="tagline">${SITE_CONFIG.phos.tagline}</p>
    <p class="subtitle">${SITE_CONFIG.site.description}</p>
  </div>
  ${TEMPLATES.phosPanel()}
  <footer class="site-footer">
    <p>P31 Labs, Inc. · <a href="/welcome">Welcome</a> · <a href="/passport">Passport</a></p>
  </footer>
  `,

  geodesicContent: () => `
  <div class="app-container">
    <header class="app-header">
      <h1>🔺 Geodesic Builder</h1>
      <p>Build worlds with your kids · Block-based 3D construction</p>
    </header>
    <div class="builder-grid">
      <aside class="toolbar">
        <h3>Tools</h3>
        <div class="tool-grid">
          <button class="tool active" data-tool="place">🧱 Place</button>
          <button class="tool" data-tool="delete">🔨 Delete</button>
          <button class="tool" data-tool="paint">🎨 Paint</button>
          <button class="tool" data-tool="rotate">🔄 Rotate</button>
        </div>
        <h3>Shapes</h3>
        <div class="shape-list">
          <button class="shape active" data-shape="cube">🧱 Cube</button>
          <button class="shape" data-shape="sphere">🔵 Sphere</button>
          <button class="shape" data-shape="cylinder">🛢️ Cylinder</button>
          <button class="shape" data-shape="wedge">📐 Wedge</button>
        </div>
        <h3>Presets</h3>
        <button class="preset" onclick="builder.generate('dome')">🏠 Dome</button>
        <button class="preset" onclick="builder.generate('tower')">🗼 Tower</button>
        <button class="preset" onclick="builder.generate('bridge')">🌉 Bridge</button>
      </aside>
      <main class="canvas-container">
        <canvas id="builder-canvas"></canvas>
        <div class="canvas-overlay">
          <div class="coords">X: 0 Y: 0 Z: 0</div>
          <div class="mode">Place Mode</div>
        </div>
      </main>
      <aside class="properties">
        <h3>Colors</h3>
        <div class="color-grid">
          ${['#4db8a8', '#cc6247', '#cda852', '#8b7cc9', '#3ba372', '#e74c3c', '#3498db', '#9b59b6'].map(c => 
            `<button class="color-btn" style="background:${c}" data-color="${c}"></button>`
          ).join('')}
        </div>
        <h3>World</h3>
        <button class="action" onclick="builder.save()">💾 Save</button>
        <button class="action" onclick="builder.load()">📂 Load</button>
        <button class="action" onclick="builder.clear()">🗑️ Clear</button>
        <button class="action" onclick="builder.share()">🔗 Share</button>
      </aside>
    </div>
  </div>
  <script type="module">
    import { GeodesicBuilder } from '/lib/p31-geodesic-builder.mjs';
    window.builder = new GeodesicBuilder('builder-canvas');
  </script>
  `,

  soupContent: () => `
  <div class="cars-container">
    <header class="cars-header">
      <h1>C.A.R.S.</h1>
      <p>Cooperative Affective Realtime Sim · Social Molecules</p>
    </header>
    <div class="cars-stage">
      <canvas id="cars-canvas"></canvas>
      <div class="k4-overlay">
        <div class="vertex" data-vertex="will">Will</div>
        <div class="vertex" data-vertex="sj">S.J.</div>
        <div class="vertex" data-vertex="wj">W.J.</div>
        <div class="vertex" data-vertex="christyn">Christyn</div>
      </div>
    </div>
    <div class="cars-controls">
      <button onclick="cars.reset()">Reset</button>
      <button onclick="cars.togglePhysics()">Physics</button>
      <button onclick="cars.toggleMesh()">Mesh</button>
    </div>
  </div>
  <script type="module">
    import { CARSSim } from '/lib/p31-cars.mjs';
    window.cars = new CARSSim('cars-canvas');
  </script>
  `,

  genericContent: (page) => `
  <article class="page-content">
    <header class="page-header">
      <h1>${page.title}</h1>
    </header>
    <div class="page-body">
      <p>This is the ${page.title} page.</p>
      <p>Type: ${page.type}</p>
      <p>PHOS enabled: ${page.phos ? 'Yes' : 'No'}</p>
    </div>
  </article>
  `
};

async function generatePage(page) {
  let content;
  
  switch(page.id) {
    case 'index':
      content = TEMPLATES.indexContent();
      break;
    case 'geodesic-builder':
      content = TEMPLATES.geodesicContent();
      break;
    case 'soup':
      content = TEMPLATES.soupContent();
      break;
    default:
      content = TEMPLATES.genericContent(page);
  }
  
  const html = TEMPLATES.base(page, content);
  const filename = page.id === 'index' ? 'index.html' : `${page.id}.html`;
  
  await fs.writeFile(`./${filename}`, html);
  console.log(`✓ Generated ${filename}`);
}

async function build() {
  console.log('🏗️  P31 Site Generator v2.0');
  console.log(`📄 Building ${SITE_CONFIG.pages.length} pages...\n`);
  
  for (const page of SITE_CONFIG.pages) {
    await generatePage(page);
  }
  
  console.log('\n✅ Site generation complete');
  console.log('🚀 Run: npm run serve');
}

build().catch(console.error);
