import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/browser/**/*.spec.ts'],
    testTimeout: 10000,
    setupFiles: [resolve(__dirname, 'test/browser/setup.ts')]
  }
});

