import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "scripts/command-center/**/*.test.mjs",
      "scripts/cli/**/*.test.mjs",
      "scripts/lib/**/*.test.mjs",
      "scripts/p31-tooling-integration.test.mjs",
    ],
    environment: "node",
    passWithNoTests: false,
    // CLI tests spawn a fresh `node` per case; on slow / busy disks cold start can exceed 30s.
    testTimeout: 120000,
  },
});
