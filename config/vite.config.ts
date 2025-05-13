import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import compression from 'vite-plugin-compression';
import path from 'path';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    compression({
      algorithm: 'brotliCompress',
      threshold: 10240 // 10kb
    }),
    externalizeDeps()
  ],
  // Configuração otimizada para resolver dependências
  optimizeDeps: {
    esbuildOptions: {
      mainFields: ['module', 'main'],
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/functions',
      'firebase/storage',
      'firebase/database',
      'firebase/analytics',
      'lodash',
      'lodash/isFunction',
      '@tanstack/react-query',
      '@tanstack/query-core',
      '@tanstack/query-devtools',
      '@tanstack/router-core',
      '@tanstack/react-router',
      '@tanstack/history',
      '@tanstack/react-store',
      '@tanstack/store',
      '@tanstack/loaders',
      '@datadog/browser-rum',
      '@datadog/browser-core',
      '@tanstack/router-devtools',
      '@tanstack/react-router-devtools',
      'jsesc',
      'recharts',
      'recharts-scale',
      'd3-shape',
      'd3-scale',
      'react-smooth',
      '@sentry-internal/replay',
      '@sentry-internal/replay-canvas',
      '@sentry-internal/feedback',
      '@amplitude/analytics-core',
      'react-is'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@app': path.resolve(__dirname, '../src/app'),
      '@core': path.resolve(__dirname, '../src/core'),
      '@shared': path.resolve(__dirname, '../src/shared'),
      '@domains': path.resolve(__dirname, '../src/domains'),
      '@services': path.resolve(__dirname, '../src/services'),
      '@config': path.resolve(__dirname, '../src/config'),
      'firebase': path.resolve(__dirname, '../node_modules/firebase'),
      'lodash': path.resolve(__dirname, '../node_modules/lodash'),
      '@tanstack/query-core': path.resolve(__dirname, '../node_modules/@tanstack/query-core'),
      '@tanstack/react-query': path.resolve(__dirname, '../node_modules/@tanstack/react-query'),
      '@tanstack/react-query-devtools': path.resolve(__dirname, '../node_modules/@tanstack/react-query-devtools'),
      '@tanstack/query-devtools': path.resolve(__dirname, '../node_modules/@tanstack/query-devtools'),
      '@tanstack/router-core': path.resolve(__dirname, '../node_modules/@tanstack/router-core'),
      '@tanstack/react-router': path.resolve(__dirname, '../node_modules/@tanstack/react-router'),
      '@tanstack/history': path.resolve(__dirname, '../node_modules/@tanstack/history'),
      '@tanstack/react-store': path.resolve(__dirname, '../node_modules/@tanstack/react-store'),
      '@tanstack/store': path.resolve(__dirname, '../node_modules/@tanstack/store'),
      '@tanstack/loaders': path.resolve(__dirname, '../node_modules/@tanstack/loaders'),
      '@datadog/browser-rum': path.resolve(__dirname, '../node_modules/@datadog/browser-rum'),
      '@datadog/browser-core': path.resolve(__dirname, '../node_modules/@datadog/browser-core'),
      'jsesc': path.resolve(__dirname, '../node_modules/jsesc'),
      'victory-vendor/d3-shape': path.resolve(__dirname, '../node_modules/d3-shape'),
      'victory-vendor/d3-scale': path.resolve(__dirname, '../node_modules/d3-scale'),
      'react-smooth': path.resolve(__dirname, '../node_modules/react-smooth'),
      '@sentry-internal/replay': path.resolve(__dirname, '../node_modules/@sentry-internal/replay'),
      '@sentry-internal/replay-canvas': path.resolve(__dirname, '../node_modules/@sentry-internal/replay-canvas'),
      '@sentry-internal/feedback': path.resolve(__dirname, '../node_modules/@sentry-internal/feedback'),
      '@amplitude/analytics-core': path.resolve(__dirname, '../node_modules/@amplitude/analytics-core'),
      'react-is': path.resolve(__dirname, '../node_modules/react-is')
    },
    // Ajudar o Vite a resolver módulos CommonJS
    preserveSymlinks: true,
    mainFields: ['browser', 'module', 'main']
  },
  build: {
    outDir: '../dist',
    sourcemap: true,
    target: 'es2020', // Melhor compatibilidade
    // Lidar com dependências externas
    rollupOptions: {
      external: [
        'scheduler',
        '@noble/hashes/sha3',
        'quick-format-unescaped',
        '@tanstack/query-devtools',
        'eventemitter3',
        'tslib',
        ...Object.keys(require('../package.json').dependencies)
          .filter(dep => dep.startsWith('@radix-ui/') || 
                        dep.startsWith('@sentry/') || 
                        dep.startsWith('@sentry-internal/') ||
                        dep.startsWith('recharts') ||
                        dep.startsWith('@amplitude/')),
        'recharts-scale',
        '@tanstack/router-core',
        '@tanstack/history',
        '@tanstack/react-store',
        '@tanstack/store',
        '@tanstack/loaders',
        '@datadog/browser-core',
        '@tanstack/react-query',
        '@tanstack/query-core',
        '@tanstack/react-router',
        '@tanstack/router-devtools',
        '@tanstack/react-router-devtools',
        '@datadog/browser-rum',
        'jsesc',
        'victory-vendor/d3-shape',
        'victory-vendor/d3-scale',
        'react-smooth',
        '@sentry-internal/replay',
        '@sentry-internal/replay-canvas',
        '@sentry-internal/feedback',
        '@amplitude/analytics-core',
        'react-is',
        'react-hook-form'
      ],
      output: {
        assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        manualChunks: (id) => {
          // Abordagem mais flexível para chunking
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@firebase') || id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('@sentry')) return 'vendor-sentry';
            if (id.includes('recharts') || id.includes('d3-shape') || id.includes('d3-scale') || id.includes('react-smooth')) return 'vendor-charts';
            return 'vendor'; // other dependencies
          }
        }
      }
    },
    // Melhorar a compatibilidade com CommonJS
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    chunkSizeWarningLimit: 1000
  }
});
