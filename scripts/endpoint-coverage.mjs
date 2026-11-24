// Cobertura de endpoints da API: cruza as chamadas registradas durante os testes (coverage-data/*.jsonl)
// com as operações declaradas no contrato OpenAPI do SUT (baixado em tempo de execução).
//
// Por que esta métrica? Não temos acesso ao servidor do SUT para medir cobertura de CÓDIGO (linhas/ramos).
// O que dá para medir de forma honesta é a cobertura da SUPERFÍCIE da API exercitada pela suíte.
// Também separamos as operações "em escopo" (cliente final) das "fora de escopo" (administração), conforme o plano de testes.
//
// Uso: node scripts/endpoint-coverage.mjs [--md reports/endpoint-coverage.md] [--min 60]
//      --min N → sai com código 1 se a cobertura do escopo ficar abaixo de N% (quality gate do CI)
import fs from 'node:fs';
import path from 'node:path';

const API = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';
const args = process.argv.slice(2);
const mdOut = args.includes('--md') ? args[args.indexOf('--md') + 1] : null;
const min = args.includes('--min') ? Number(args[args.indexOf('--min') + 1]) : null;

// Operações fora de escopo (justificativa em docs/01-plano-de-testes.md, seção 3.2):
// exigem perfil admin ou alteram dados globais do ambiente público compartilhado.
const OUT_OF_SCOPE_TAGS = new Set(['Report', 'TOTP', 'Image', 'Stream']);
const OUT_OF_SCOPE_OPS = [
  /^(POST|PUT|PATCH|DELETE) \/(brands|categories|products)/, // CRUD de catálogo (admin) — altera dados de todos os usuários
  /^(GET|PUT|PATCH|DELETE) \/users\/\{userId\}$/, /^(GET|QUERY) \/users(\/search)?$/, // gestão de usuários (admin)
  /^(PUT|PATCH) \/invoices/, /^PUT \/invoices\/\{invoiceId\}\/status$/, // gestão de pedidos (admin)
  /^(GET|POST|PUT) \/messages\/\{messageId\}(\/reply|\/status)?$/, /^GET \/messages$/, // atendimento (admin)
  /^(POST|PUT|DELETE) \/products\/\{productId\}\/specs/,
];

const spec = await (await fetch(`${API}/docs?api-docs.json`)).json();
const ops = [];
for (const [p, methods] of Object.entries(spec.paths)) {
  for (const [m, op] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'patch', 'delete', 'query'].includes(m)) continue;
    const key = `${m.toUpperCase()} ${p}`;
    const tag = (op.tags ?? [])[0] ?? '-';
    const outOfScope = OUT_OF_SCOPE_TAGS.has(tag) || OUT_OF_SCOPE_OPS.some((r) => r.test(key));
    // Converte o template /products/{productId} em regex; rotas estáticas (ex. /products/search) têm prioridade.
    const re = new RegExp('^' + p.replace(/\{[^}]+\}/g, '[^/]+') + '$');
    ops.push({ key, method: m.toUpperCase(), path: p, tag, re, isTemplate: p.includes('{'), outOfScope, hits: { api: 0, ui: 0 }, statuses: new Set() });
  }
}

const dir = 'coverage-data';
const hits = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).flatMap((f) => fs.readFileSync(path.join(dir, f), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)))
  : [];
let unmatched = 0;
for (const h of hits) {
  const candidates = ops.filter((o) => o.method === h.method && o.re.test(h.path));
  const op = candidates.find((o) => !o.isTemplate) ?? candidates[0];
  if (!op) { unmatched++; continue; }
  op.hits[h.source]++;
  if (h.status) op.statuses.add(h.status);
}

const inScope = ops.filter((o) => !o.outOfScope);
const covered = inScope.filter((o) => o.hits.api + o.hits.ui > 0);
const coveredApi = inScope.filter((o) => o.hits.api > 0);
const pctScope = ((covered.length / inScope.length) * 100).toFixed(1);
const pctAll = ((ops.filter((o) => o.hits.api + o.hits.ui > 0).length / ops.length) * 100).toFixed(1);

console.log(`Operações no contrato: ${ops.length} | em escopo: ${inScope.length} | fora de escopo: ${ops.length - inScope.length}`);
console.log(`Chamadas registradas: ${hits.length} (sem correspondência no contrato: ${unmatched})`);
console.log(`Cobertura do escopo: ${covered.length}/${inScope.length} = ${pctScope}% (somente testes de API: ${coveredApi.length}/${inScope.length})`);
console.log(`Cobertura do contrato inteiro: ${pctAll}%`);
const rows = ops.map((o) => ({ op: o.key, escopo: o.outOfScope ? 'fora' : 'sim', api: o.hits.api, ui: o.hits.ui, status: [...o.statuses].sort().join(',') }));
console.table(rows.filter((r) => r.escopo === 'sim'));

if (mdOut) {
  const md = [
    '# Cobertura de endpoints da API (contrato OpenAPI × chamadas dos testes)',
    '',
    `- Gerado em: ${new Date().toISOString()}`,
    `- Operações no contrato: **${ops.length}** (em escopo: **${inScope.length}**, fora de escopo: ${ops.length - inScope.length})`,
    `- Chamadas registradas durante a execução: ${hits.length}`,
    `- **Cobertura das operações em escopo: ${covered.length}/${inScope.length} = ${pctScope}%** (só pelos testes de API: ${coveredApi.length})`,
    `- Cobertura do contrato inteiro (inclui admin): ${pctAll}%`,
    '',
    '> Métrica de superfície de API, NÃO de cobertura de código do servidor (indisponível no ambiente público).',
    '',
    '| Operação | Escopo | Chamadas (testes API) | Chamadas (via UI) | Status HTTP observados |',
    '| --- | --- | ---: | ---: | --- |',
    ...rows.map((r) => `| \`${r.op}\` | ${r.escopo} | ${r.api} | ${r.ui} | ${r.status} |`),
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(mdOut), { recursive: true });
  fs.writeFileSync(mdOut, md);
  console.log('Relatório salvo em', mdOut);
}
if (min !== null && Number(pctScope) < min) {
  console.error(`QUALITY GATE: cobertura de endpoints em escopo ${pctScope}% < mínimo ${min}%`);
  process.exitCode = 1;
}
