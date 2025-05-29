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
    {
      name: 'disable-hmr',
      // Desativar completamente o HMR
      handleHotUpdate() {
        return [];
      }
    },
    react({
      // Desativar Fast Refresh para evitar recargas desnecessárias
      fastRefresh: false
    })
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
      '@app': path.resolve(projectRoot, 'src/app'),
      '@core': path.resolve(projectRoot, 'src/core'),
      '@shared': path.resolve(projectRoot, 'src/shared'),
      '@domains': path.resolve(projectRoot, 'src/domains'),
      '@services': path.resolve(projectRoot, 'src/services'),
      '@config': path.resolve(projectRoot, 'src/config'),
      '@constants': path.resolve(projectRoot, 'src/constants'),
      '@utils': path.resolve(projectRoot, 'src/shared/utils')
    }
  },
  server: {
    port: 5174,
    open: true,
    hmr: false, // Desativar Hot Module Replacement para evitar recargas desnecessárias
    watch: false, // Desativar completamente o sistema de watch
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
