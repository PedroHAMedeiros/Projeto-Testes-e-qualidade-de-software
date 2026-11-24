import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração central da suíte.
 * - Projeto "api": testes de contrato/regra de negócio direto na API REST (sem navegador).
 * - Projeto "ui": testes de interface (Angular) no Chromium.
 * - Projeto "e2e": fluxo ponta a ponta de compra.
 * URLs podem ser sobrescritas por variáveis de ambiente (ex.: apontar para uma instância local via Docker).
 */
export const UI_URL = process.env.UI_URL ?? 'https://practicesoftwaretesting.com';
export const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';

export default defineConfig({
  testDir: './tests',
  // Timeouts calibrados pela latência MEDIDA do SUT (scripts/measure-latency.mjs, evidencias/metricas/):
  // mediana ≈ 0,9 s, mas p90 de até ~10 s e máximo de ~31 s no ambiente público compartilhado.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 nova tentativa absorve oscilações do ambiente público. Testes que só passam na 2ª tentativa
  // aparecem como "flaky" no relatório e são contabilizados (não escondidos) — ver scripts/summarize-results.mjs.
  retries: 1,
  // Paralelismo baixo de propósito: o SUT é compartilhado e mais carga aumentou a latência nas medições.
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: UI_URL,
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: 'api', testDir: './tests/api', use: { baseURL: API_URL } },
    { name: 'ui', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'e2e', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'] } },
  ],
});
