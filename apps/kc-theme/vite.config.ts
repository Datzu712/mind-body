import path from 'node:path';
import { keycloakify } from 'keycloakify/vite-plugin';
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        dedupe: ['react', 'react-dom'],
    },
    plugins: [
        tailwindcss(),
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        keycloakify({
            accountThemeImplementation: 'none',
            themeName: 'Mind-and-Body',
        }),
    ],
});
