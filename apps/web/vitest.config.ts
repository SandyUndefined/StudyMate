import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    alias: {
      '@studymate/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@': path.resolve(__dirname),
    },
  },
  resolve: {
    alias: {
      '@studymate/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@': path.resolve(__dirname),
    },
  },
})
