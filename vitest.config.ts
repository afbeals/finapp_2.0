import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      // Component tests (files that import React components) run under jsdom
      ['tests/unit/components/**', 'jsdom'],
    ],
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    env: {
      DATABASE_URL: 'file:../data/test.db',
      SESSION_SECRET: 'test-secret-32-chars-minimum-here',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
