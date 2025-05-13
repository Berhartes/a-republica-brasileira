import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import compression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    compression({
      algorithm: 'brotliCompress',
      threshold: 10240 // 10kb
    })
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
      '@tanstack/react-query',
      '@tanstack/query-core'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'firebase': path.resolve(__dirname, './node_modules/firebase'),
      '@tanstack/query-core': path.resolve(__dirname, './node_modules/@tanstack/query-core'),
      '@tanstack/react-query': path.resolve(__dirname, './node_modules/@tanstack/react-query')
    },
    // Ajudar o Vite a resolver módulos CommonJS
    preserveSymlinks: true,
    mainFields: ['browser', 'module', 'main']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020', // Melhor compatibilidade
    // Lidar com dependências externas
    rollupOptions: {
      external: [
        'scheduler',
        '@noble/hashes/sha3',
        'quick-format-unescaped',
        'tiny-invariant', // Adicionado tiny-invariant como dependência externa
        'tiny-warning'    // Adicionado tiny-warning como dependência externa
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
  },
  // Desativar advertências específicas para melhorar a experiência de build
  warn: {
    unresolved: false // Para os imports não resolvidos que estão sendo tratados como externos
  }
});
