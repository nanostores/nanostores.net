import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['src/snippets/**/*.test.{ts,tsx}'] },
})
