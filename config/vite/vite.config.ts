import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Get absolute path to project root
const projectRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
      '@app': path.resolve(projectRoot, 'src/app'),
      '@core': path.resolve(projectRoot, 'src/core'),
      '@shared': path.resolve(projectRoot, 'src/shared'),
      '@domains': path.resolve(projectRoot, 'src/domains'),
      '@services': path.resolve(projectRoot, 'src/services'),
      '@config': path.resolve(projectRoot, 'src/config'),
      '@utils': path.resolve(projectRoot, 'src/shared/utils')
    }
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
