// Mede a latência (ms) de endpoints públicos do SUT em N amostras sequenciais (sem paralelismo, para não sobrecarregar o ambiente compartilhado).
// Uso: node scripts/measure-latency.mjs [N=10]   → imprime tabela e salva evidencias/metricas/latencia-<timestamp>.json
import fs from 'node:fs';
const API = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';
const N = Number(process.argv[2] ?? 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const first = await (await fetch(`${API}/products`)).json();
const ids = first.data.map((p) => p.id);
const endpoints = {
  'GET /products': () => `${API}/products`,
  'GET /products?page=2': () => `${API}/products?page=2`,
  'GET /products/{id}': (i) => `${API}/products/${ids[i % ids.length]}`,
  'GET /products/{id}/related': (i) => `${API}/products/${ids[i % ids.length]}/related`,
  'GET /products/search?q=…': (i) => `${API}/products/search?q=${['plier', 'hammer', 'saw', 'drill'][i % 4]}`,
  'GET /categories/tree': () => `${API}/categories/tree`,
};
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const out = { executado_em: new Date().toISOString(), amostras_por_endpoint: N, api: API, resultados: {} };
for (const [name, url] of Object.entries(endpoints)) {
  const times = []; let errors = 0;
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    try { const r = await fetch(url(i), { signal: AbortSignal.timeout(45000) }); await r.arrayBuffer(); if (!r.ok) errors++; } catch { errors++; }
    times.push(Math.round(performance.now() - t0));
    await sleep(300);
  }
  out.resultados[name] = { min: Math.min(...times), mediana: pct(times, 50), p90: pct(times, 90), max: Math.max(...times), erros: errors, amostras_ms: times };
}
console.table(Object.fromEntries(Object.entries(out.resultados).map(([k, v]) => [k, { min: v.min, mediana: v.mediana, p90: v.p90, max: v.max, erros: v.erros }])));
fs.mkdirSync('evidencias/metricas', { recursive: true });
const file = `evidencias/metricas/latencia-${out.executado_em.replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log('salvo em', file);
