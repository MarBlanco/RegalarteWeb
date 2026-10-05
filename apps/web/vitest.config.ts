import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.tsx'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Capa de lógica: incluye archivos aún sin tests (cuentan como 0 %).
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/app/**',
        'src/components/**',
        'src/migrations/**',
        // Configuración declarativa de Payload y tipos autogenerados.
        'src/collections/**',
        'src/globals/**',
        'src/payload.config.ts',
        'src/payload-types.ts',
        'src/**/*.test.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@payload-config': path.resolve(__dirname, './src/payload.config.ts'),
    },
  },
})