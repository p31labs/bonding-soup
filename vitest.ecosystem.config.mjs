import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/ecosystem/**/*.test.mjs"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
    passWithNoTests: false,
    testTimeout: 30_000,
    reporters: ["verbose"],
  },
});
