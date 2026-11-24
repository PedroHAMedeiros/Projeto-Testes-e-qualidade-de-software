// Script de reconhecimento (Fase 1): visita páginas públicas, salva prints e lista os atributos data-test.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const BASE = 'https://practicesoftwaretesting.com';
const OUT = 'evidencias/fase1-exploracao';
const pages = ['/', '/category/hand-tools', '/contact', '/auth/login', '/auth/register', '/checkout', '/auth/forgot-password'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const report = {};
for (const p of pages) {
  await page.goto(BASE + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const name = p === '/' ? 'home' : p.replace(/\//g, '_').slice(1);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  report[p] = { title: await page.title(), dataTest: await page.$$eval('[data-test]', els => [...new Set(els.map(e => e.getAttribute('data-test')))]) };
}
// Detalhe de produto: primeiro card da home
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.locator('[data-test^="product-"]').first().click();
await page.waitForLoadState('networkidle');
await page.screenshot({ path: `${OUT}/product-detail.png`, fullPage: true });
report['product-detail'] = { url: page.url(), dataTest: await page.$$eval('[data-test]', els => [...new Set(els.map(e => e.getAttribute('data-test')))]) };
fs.writeFileSync(`${OUT}/mapa-data-test.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report));
