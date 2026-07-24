import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Integration suites mutate a shared database; never run files in parallel.
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
