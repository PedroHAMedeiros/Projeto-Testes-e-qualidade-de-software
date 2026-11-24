// Análise estática do código da suíte (quality gate do CI).
// - typescript-eslint: boas práticas de TypeScript
// - eslint-plugin-playwright: anti-padrões de automação (esperas fixas, asserções ausentes, test.only esquecido…)
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'reports/', 'test-results/', 'coverage-data/', 'scripts/**', 'evidencias/'] },
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error', // proíbe esperas fixas (causa nº 1 de testes instáveis)
      'playwright/no-focused-test': 'error', // impede test.only esquecido no repositório
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'playwright/no-conditional-in-test': 'warn',
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expect'] }],
      'playwright/no-conditional-expect': 'warn',
    },
    settings: { playwright: { globalAliases: { test: ['uiTest'] } } },
  },
  {
    rules: {
      complexity: ['warn', 8], // complexidade ciclomática por função
      'max-lines-per-function': ['warn', { max: 60, skipComments: true, skipBlankLines: true }],
      'max-depth': ['warn', 3],
    },
  },
);
