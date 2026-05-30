import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { fileURLToPath, URL } from 'node:url';

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
    plugins: [
        TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
        react(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    // Tauri expects a fixed port, fail if that port is not available
    clearScreen: false,
    server: {
        port: 3000,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                  protocol: 'ws',
                  host,
                  port: 3001,
              }
            : undefined,
        watch: {
            // Tell Vite to ignore watching `src-tauri`
            ignored: ['**/src-tauri/**'],
        },
    },
    publicDir: 'src/public',
    build: {
        outDir: 'dist',
        // Tauri uses Chromium on Windows and WebKit on macOS and Linux
        target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
        // don't minify for debug builds
        minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
}));
