import { defineConfig } from "vitest/config";

const ci = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  test: {
    include: [
      "tests/mvp/**/*.triper.test.mjs",
      "tests/combined/**/*.test.mjs",
      "tests/triper/**/*.test.mjs",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "andromeda/**", "phosphorus31.org/**"],
    environment: "node",
    passWithNoTests: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
    maxConcurrency: ci ? 2 : 4,
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    reporters: ci ? ["default", "github-actions"] : ["verbose"],
  },
});
