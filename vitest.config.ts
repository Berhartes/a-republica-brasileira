import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // JSDOM é geralmente mais compatível com aplicações React complexas,
    // mas Happy-DOM pode ser mais rápido. Podemos alternar conforme necessário.
    environment: 'jsdom', // Alternativa: 'happy-dom'
    setupFiles: './src/setupTests.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    },
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'build'
    ],
    alias: {
      '@': resolve(__dirname, './src')
    },
    deps: {
      optimizer: {
        web: {
          include: [
            'node_modules/lodash-es'
          ]
        }
      }
    },
    mockReset: true,
    testTimeout: 10000,
    environmentOptions: {
      jsdom: {
        url: 'http://localhost'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
