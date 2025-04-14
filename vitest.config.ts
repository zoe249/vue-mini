import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['packages/**/src/test/**.spec.ts'],
    environment: 'jsdom',
    alias: [
      {
        find: /^@vue\/(.*)$/,
        replacement: path.resolve(__dirname, 'packages/$1/src'),
      }
    ],
  }
})
