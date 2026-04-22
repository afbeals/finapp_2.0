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
            'tests/api/**/*.test.{ts,tsx}',
            'tests/unit/lib/**/*.test.{ts,tsx}',
            'tests/unit/config/configHelpers.test.ts',
          ],
          env,
        },
        resolve: { alias },
      },
      // jsdom environment: component smoke tests
      {
        plugins: [react()],
        test: {
          name: 'jsdom',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./tests/setup.ts'],
          include: [
            'tests/unit/config/MembersSection.test.tsx',
            'tests/unit/config/ExpenseCategoriesSection.test.tsx',
            'tests/unit/config/InvestmentsConfigSection.test.tsx',
            'tests/unit/review/**/*.test.{ts,tsx}',
          ],
          env,
        },
        resolve: { alias },
      },
    ],
  },
});
