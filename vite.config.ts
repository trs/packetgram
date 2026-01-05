import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/packet.ts'),
      name: 'Packet',
      formats: ['es', 'umd'],
      fileName: 'packet'
    },
    sourcemap: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/node/**/*.spec.ts'],
    testTimeout: 10000
  }
});

