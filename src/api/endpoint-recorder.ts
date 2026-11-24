import fs from 'node:fs';
import path from 'node:path';

/**
 * Registra cada chamada (método + caminho) feita à API durante os testes.
 * Depois, scripts/endpoint-coverage.mjs cruza esses registros com o contrato OpenAPI
 * para calcular a cobertura de endpoints — métrica adequada quando não há acesso à cobertura de código do SUT.
 */
const DIR = path.resolve(__dirname, '../../coverage-data');

export function recordEndpoint(method: string, url: string, source: 'api' | 'ui', status?: number): void {
  try {
    const u = new URL(url);
    fs.mkdirSync(DIR, { recursive: true });
    const line = JSON.stringify({ method: method.toUpperCase(), path: u.pathname, source, status }) + '\n';
    fs.appendFileSync(path.join(DIR, `hits-${process.pid}.jsonl`), line);
  } catch {
    /* o registro de métrica nunca deve quebrar um teste */
  }
}
