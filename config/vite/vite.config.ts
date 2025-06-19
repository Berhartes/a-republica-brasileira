import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
// Get absolute path to project root
const projectRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [
    react()
  ],
  css: {
    postcss: {
      plugins: [
        postcssImport,
        tailwindcss({
          config: path.resolve(projectRoot, 'config/tailwind.config.js')
        }),
        autoprefixer
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    }
  },
  server: {
    port: 5174,
    open: true,
    // hmr: true, // HMR é true por padrão, pode ser omitido
    // watch é habilitado por padrão, remover a linha 'watch: null'
    allowedHosts: ['adebc0bd-7930-4289-a352-0640fab1f28e-00-3j28n56fvzj05.worf.replit.dev'],
  },
  build: {
    outDir: path.resolve(projectRoot, 'dist'),
    sourcemap: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            return 'vendor'; // other dependencies
          }
        }
      }
    }
  }
});
