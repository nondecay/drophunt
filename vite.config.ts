import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
  plugins: [react()],
  define: {
    'global': 'globalThis',
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    },
    'process.browser': true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'buffer': 'buffer',
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: ['react', 'react-dom', 'react-router-dom', 'buffer']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
});