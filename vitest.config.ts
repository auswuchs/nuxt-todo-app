import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const appDir = fileURLToPath(new URL('./app', import.meta.url))
const testsDir = fileURLToPath(new URL('./tests', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': appDir,
      '@': appDir,
      '@tests': testsDir,
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    restoreMocks: true,
  },
})
