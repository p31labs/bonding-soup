import { defineConfig } from 'vitest/config';

const ci = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: false,
    testTimeout: 60_000,
    hookTimeout: 30_000,
    pool: 'forks',
    maxConcurrency: ci ? 2 : 4,
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    reporters: ci ? ['default', 'github-actions'] : ['default'],
  },
});
