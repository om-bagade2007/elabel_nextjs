import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [await import('@replit/vite-plugin-cartographer').then((m) => m.cartographer())]
      : []),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: 'canspirit-ai',
            project: 'elabel',
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
