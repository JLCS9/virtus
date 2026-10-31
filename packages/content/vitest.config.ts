import { defineConfig } from 'vitest/config';

// vendor/ guarda las pruebas originales de virtuousleadership.com solo como referencia.
export default defineConfig({ test: { include: ['test/**/*.test.ts'] } });
