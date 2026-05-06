#!/usr/bin/env node
/**
 * discover-current-api-routes.mjs
 *
 * Discovers current routes on api.phosphorus31.org for SIMPLEX merge planning.
 * WCD-FLEET-03: api.phosphorus31.org route discovery + merge plan
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const API_BASE = 'https://api.phosphorus31.org';

// Routes to test (common API patterns)
const ROUTES_TO_TEST = [
  '/',
  '/health',
  '/api/health',
  '/api/state',
  '/api/mesh',
  '/api/status',
  '/checkout',
  '/webhook',
  '/stripe',
  '/stripe/checkout',
  '/stripe/webhook',
  '/donate',
  '/donate/health',
  '/shift',
  '/shift/in',
  '/shift/out',
  '/operator',
  '/operator/status',
  '/command',
  '/command/health',
  '/telemetry',
  '/telemetry/health',
  '/passkey',
  '/passkey/health',
  '/k4',
  '/k4/health',
  '/social',
  '/social/health'
];

async function testRoute(route) {
  const url = `${API_BASE}${route}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'P31 Route Discovery Script'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    return {
      route,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    };
  } catch (error) {
    return {
      route,
      error: error.message,
      url
    };
  }
}

async function main() {
  console.log('🔍 P31 API Route Discovery');
  console.log('=' .repeat(50));
  console.log(`Base URL: ${API_BASE}`);
  console.log(`Testing ${ROUTES_TO_TEST.length} routes...\n`);

  const results = [];

  for (const route of ROUTES_TO_TEST) {
    console.log(`Testing ${route}...`);
    const result = await testRoute(route);
    results.push(result);

    if (result.status && result.status < 400) {
      console.log(`  ✅ ${result.status} ${result.statusText}`);
    } else if (result.status) {
      console.log(`  ⚠️  ${result.status} ${result.statusText}`);
    } else {
      console.log(`  ❌ ${result.error}`);
    }

    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📋 SUMMARY');
  console.log('=' .repeat(50));

  const liveRoutes = results.filter(r => r.status && r.status < 400);
  const errorRoutes = results.filter(r => r.error);
  const notFoundRoutes = results.filter(r => r.status && r.status >= 400);

  console.log(`Live routes (2xx/3xx): ${liveRoutes.length}`);
  console.log(`Error routes (4xx/5xx): ${notFoundRoutes.length}`);
  console.log(`Connection errors: ${errorRoutes.length}`);

  console.log('\n🟢 LIVE ROUTES:');
  liveRoutes.forEach(r => {
    console.log(`  ${r.route} → ${r.status} ${r.statusText}`);
  });

  console.log('\n📄 DETAILED RESULTS:');
  console.log(JSON.stringify(results, null, 2));

  // Generate merge plan
  console.log('\n📝 SIMPLEX MERGE PLAN');
  console.log('=' .repeat(50));

  if (liveRoutes.length === 0) {
    console.log('✅ No existing routes found. SIMPLEX can deploy directly to api.phosphorus31.org');
  } else {
    console.log('⚠️  Existing routes detected. Merge required:');
    console.log('');
    console.log('Current live routes to port into SIMPLEX:');
    liveRoutes.forEach(r => {
      console.log(`  - ${r.route} (${r.status})`);
    });
    console.log('');
    console.log('Action: Add these routes to simplex-v7/src/index.ts');
    console.log('Action: Test parity before DNS switch');
  }

  console.log('\n✅ Discovery complete. Update P31-WORKER-FLEET-ALIGNMENT.md with results.');
}

main().catch(console.error);