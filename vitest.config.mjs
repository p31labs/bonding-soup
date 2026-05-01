import { defineConfig } from "vitest/config";

const ci = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

/**
 * Home workspace unit tests (Node). E2E: npm run test:*:e2e, p31ca Playwright.
 * Packages: npm run test:packages, simplex-v7: npm run test --prefix simplex-v7
 * MVP TRIPER suites: npm run test:triper (see vitest.triper.config.mjs)
 */
export default defineConfig({
  test: {
    include: ["scripts/**/*.test.mjs"],
    exclude: ["**/node_modules/**", "**/dist/**", "andromeda/**", "phosphorus31.org/**"],
    environment: "node",
    passWithNoTests: false,
    // CLI tests spawn `node` subprocesses; cold starts on CI can exceed 30s.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: "forks",
    maxConcurrency: ci ? 2 : 4,
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    reporters: ci ? ["default", "github-actions"] : ["default"],
  },
});
