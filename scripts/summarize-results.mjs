// Resume reports/results.json (reporter JSON do Playwright) em métricas da execução.
// Uso: node scripts/summarize-results.mjs [caminho/results.json] [--md saida.md]
// Saída: totais por projeto, passou / falhou / flaky / falha esperada (defeito conhecido) / pulado, duração,
// e a lista de falhas inesperadas com a primeira linha do erro.
import fs from 'node:fs';

const args = process.argv.slice(2);
const file = args.find((a) => a.endsWith('.json')) ?? 'reports/results.json';
const mdOut = args.includes('--md') ? args[args.indexOf('--md') + 1] : null;
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const clean = (s = '') => s.replace(/\x1b\[[0-9;]*m/g, '');

const rows = [];
(function walk(suite, filePath) {
  for (const s of suite.suites ?? []) walk(s, s.file ?? filePath);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const results = t.results ?? [];
      const final = results.at(-1);
      // Classificação usando o próprio veredito do Playwright (t.status): expected | unexpected | flaky | skipped
      let outcome = t.status;
      if (outcome === 'expected' && t.expectedStatus === 'failed') outcome = 'known-defect';
      rows.push({
        project: t.projectName,
        title: spec.title,
        file: spec.file ?? filePath,
        outcome,
        attempts: results.length,
        duration: results.reduce((a, r) => a + (r.duration ?? 0), 0),
        error: clean(final?.error?.message ?? '').split('\n').find((l) => l.trim()) ?? '',
        tags: (spec.title.match(/@[\w-]+/g) ?? []),
        skipReason: [...(t.annotations ?? []), ...(final?.annotations ?? [])].find((a) => a.type === 'skip')?.description ?? '',
      });
    }
  }
})(report);

const count = (list, o) => list.filter((r) => r.outcome === o).length;
const projects = [...new Set(rows.map((r) => r.project))];
const table = projects.map((p) => {
  const list = rows.filter((r) => r.project === p);
  return { projeto: p, total: list.length, passou: count(list, 'expected'), falhou: count(list, 'unexpected'), flaky: count(list, 'flaky'), 'defeito conhecido (falha esperada)': count(list, 'known-defect'), pulado: count(list, 'skipped'), 'duração (s)': (list.reduce((a, r) => a + r.duration, 0) / 1000).toFixed(1) };
});
const total = { projeto: 'TOTAL', total: rows.length, passou: count(rows, 'expected'), falhou: count(rows, 'unexpected'), flaky: count(rows, 'flaky'), 'defeito conhecido (falha esperada)': count(rows, 'known-defect'), pulado: count(rows, 'skipped'), 'duração (s)': ((report.stats?.duration ?? 0) / 1000).toFixed(1) + ' (wall)' };
table.push(total);

const executed = rows.length - total.pulado;
const passRate = executed ? (((total.passou + total['defeito conhecido (falha esperada)'] + total.flaky) / executed) * 100).toFixed(1) : '0';
const flakyRate = executed ? ((total.flaky / executed) * 100).toFixed(1) : '0';

console.table(table);
console.log(`Início: ${report.stats?.startTime} | Taxa de sucesso (resultado conforme esperado): ${passRate}% | Taxa de flaky: ${flakyRate}%`);
const unexpected = rows.filter((r) => r.outcome === 'unexpected');
for (const r of unexpected) console.log(`FALHOU [${r.project}] ${r.title}\n    ${r.error.slice(0, 300)}`);
const flaky = rows.filter((r) => r.outcome === 'flaky');
for (const r of flaky) console.log(`~ FLAKY [${r.project}] ${r.title} (tentativas: ${r.attempts})`);

if (mdOut) {
  const keys = Object.keys(table[0]);
  const md = [
    `# Resumo da execução`,
    ``,
    `- Arquivo de origem: \`${file}\``,
    `- Início: ${report.stats?.startTime}`,
    `- Taxa de sucesso (resultado conforme esperado, incluindo falhas esperadas de defeitos conhecidos): **${passRate}%**`,
    `- Taxa de testes instáveis (flaky): **${flakyRate}%**`,
    ``,
    `| ${keys.join(' | ')} |`,
    `| ${keys.map(() => '---').join(' | ')} |`,
    ...table.map((r) => `| ${keys.map((k) => r[k]).join(' | ')} |`),
    ``,
    `## Falhas inesperadas (${unexpected.length})`,
    ...(unexpected.length ? unexpected.map((r) => `- [${r.project}] ${r.title} — \`${r.error.slice(0, 200).replace(/\|/g, '/')}\``) : ['- nenhuma']),
    ``,
    `## Testes instáveis — passaram só na nova tentativa (${flaky.length})`,
    ...(flaky.length ? flaky.map((r) => `- [${r.project}] ${r.title}`) : ['- nenhum']),
    ``,
    `## Testes pulados — não executados (${count(rows, 'skipped')})`,
    ...(count(rows, 'skipped') ? rows.filter((r) => r.outcome === 'skipped').map((r) => `- [${r.project}] ${r.title} — motivo: ${r.skipReason || 'não informado'}`) : ['- nenhum']),
    ``,
    `## Defeitos conhecidos confirmados nesta execução (${count(rows, 'known-defect')})`,
    ...rows.filter((r) => r.outcome === 'known-defect').map((r) => `- [${r.project}] ${r.title}`),
    ``,
  ].join('\n');
  fs.writeFileSync(mdOut, md);
  console.log(`Resumo Markdown salvo em ${mdOut}`);
}
process.exitCode = 0;
