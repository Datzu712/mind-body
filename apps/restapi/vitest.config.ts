import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.spec.ts', 'src/**/*.spec.ts'],
        // La suite de integración hace decenas de round trips por test; con los
        // 5 s por defecto solo pasa contra una BD local. Con una remota (la de
        // dev compartida) expiraban todos y parecía un fallo de lógica.
        testTimeout: 120_000,
        hookTimeout: 120_000,
    },
});
