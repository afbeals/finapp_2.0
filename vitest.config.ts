import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const alias = { '@': path.resolve(__dirname, './src') };
const env = {
  DATABASE_URL: 'file:../data/test.db',
  SESSION_SECRET: 'test-secret-32-chars-minimum-here',
};

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    projects: [
      // Node environment: API tests, lib unit tests, config helpers
      {
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          setupFiles: ['./tests/setup.ts'],
          include: [
            'tests/integration/**/*.test.{ts,tsx}',
            'src/lib/**/__tests__/**/*.test.{ts,tsx}',
            'src/app/(app)/config/__tests__/configHelpers.test.ts',
          ],
          env,
        },
        resolve: { alias },
      },
      // happy-dom environment: component smoke tests
      {
        plugins: [react()],
        test: {
          name: 'happy-dom',
          globals: true,
          environment: 'happy-dom',
          setupFiles: ['./tests/setup.ts'],
          include: [
            'src/app/**/__tests__/**/*.test.{ts,tsx}',
            'src/components/**/__tests__/**/*.test.{ts,tsx}',
          ],
          env,
        },
        resolve: { alias },
      },
    ],
  },
});
