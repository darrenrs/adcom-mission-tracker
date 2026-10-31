import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'client/src') }
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}', 'client/src/**/*.test.{ts,tsx}'],
    environment: 'node',
    testTimeout: 60_000
  }
});
