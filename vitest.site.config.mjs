import { defineConfig } from "vitest/config";

/**
 * Site-specific test config for phosphorus31.org
 * Tests HTML structure, design system, content alignment
 */
export default defineConfig({
  test: {
    include: ["tests/site/**/*.test.mjs"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
    passWithNoTests: false,
    testTimeout: 30_000,
    reporters: ["default"],
  },
});
