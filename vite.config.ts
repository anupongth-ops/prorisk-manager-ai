import path from 'path';
import { createRequire } from 'module';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const exportApiPlugin = require('./vite-plugin-export-api.cjs');
const torAiPlugin = require('./vite-plugin-tor-ai.cjs');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3099',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '')
        }
      }
    },
    base: '/epopm/',
    plugins: [react(), exportApiPlugin(), torAiPlugin()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'lucide-react'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'vendor-utils': ['papaparse']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    define: {
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
