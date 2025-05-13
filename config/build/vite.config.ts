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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src')
    }
  },
  build: {
    outDir: 'public/assets',
    sourcemap: true,
    target: 'es2022',
    assetsDir: '',
    rollupOptions: {
      output: {
        assetFileNames: 'css/[name]-[hash][extname]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    }
  }
});
