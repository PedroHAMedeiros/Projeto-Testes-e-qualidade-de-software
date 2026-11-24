// Gera o PDF único da entrega a partir dos documentos Markdown (docs/00 … docs/10 + apêndice de prints).
// Uso: npm run pdf   → entrega/relatorio-final.pdf
// Rode de novo sempre que a equipe editar os documentos.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { chromium } from '@playwright/test';

const DOCS = [
  '00-capa.md', '01-plano-de-testes.md', '02-casos-de-teste-manuais.md', '03-sessoes-exploratorias.md',
  '04-automacao-e-cobertura.md', '05-qualidade-e-refatoracao.md', '06-gestao-de-defeitos.md', '07-ci-cd.md',
  '08-conclusoes-e-licoes.md', '10-rastreabilidade-e-auditoria.md',
];
// Apêndice: prints reais de evidência (somente PNG das pastas de evidências)
const APPENDIX_DIRS = ['evidencias/fase1-exploracao', 'evidencias/fase3-exploratorios', 'evidencias/manuais', 'evidencias/exploratorios-equipe'];

const root = process.cwd();
let body = DOCS.map((f) => `<section class="doc">${marked.parse(fs.readFileSync(path.join('docs', f), 'utf8'))}</section>`).join('\n');

const shots = APPENDIX_DIRS.filter((d) => fs.existsSync(d)).flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith('.png')).map((f) => path.join(d, f)));
body += `<section class="doc"><h1>Apêndice A — Prints de evidência</h1>${shots
  .map((s) => `<figure><img src="${pathToFileURL(path.join(root, s)).href}"><figcaption>${s.replace(/\\/g, '/')}</figcaption></figure>`)
  .join('\n')}</section>`;

// Links relativos para arquivos do repositório viram texto (o PDF não navega no repositório).
body = body.replace(/<a href="(?!https?:)([^"]+)">/g, '<a class="repo">');

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font: 10.5pt/1.45 "Segoe UI", Arial, sans-serif; color: #1d1d1f; }
  .doc { page-break-after: always; }
  h1 { font-size: 19pt; border-bottom: 2px solid #c58a2c; padding-bottom: 4px; }
  h2 { font-size: 14pt; margin-top: 18px; } h3 { font-size: 12pt; }
  table { border-collapse: collapse; width: 100%; font-size: 8.6pt; margin: 8px 0; page-break-inside: auto; }
  th, td { border: 1px solid #c9c9c9; padding: 3px 5px; vertical-align: top; text-align: left; }
  th { background: #f4ead8; } tr { page-break-inside: avoid; }
  code { font: 8.8pt Consolas, monospace; background: #f3f3f3; padding: 0 2px; }
  pre { background: #f6f6f6; padding: 8px; font-size: 8pt; white-space: pre-wrap; }
  blockquote { border-left: 4px solid #c58a2c; margin: 8px 0; padding: 4px 10px; background: #fbf6ec; }
  figure { page-break-inside: avoid; margin: 10px 0; } img { max-width: 100%; max-height: 210mm; border: 1px solid #ddd; }
  figcaption { font-size: 8pt; color: #555; } a.repo { color: inherit; text-decoration: none; }
</style></head><body>${body}</body></html>`;

fs.mkdirSync('entrega', { recursive: true });
const htmlPath = path.resolve('entrega/relatorio-final.html');
fs.writeFileSync(htmlPath, html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
await page.pdf({
  path: 'entrega/relatorio-final.pdf', format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="font-size:7pt;width:100%;text-align:center;color:#777">Testes e Qualidade de Software — Practice Software Testing — página <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
  margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
});
await browser.close();
console.log(`PDF gerado: entrega/relatorio-final.pdf (${DOCS.length} documentos, ${shots.length} prints no apêndice)`);
