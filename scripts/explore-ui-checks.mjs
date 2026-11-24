// Fase 1 (parte 3): verificações de UI para os achados da API (produto sem estoque; e-mail no cadastro; sort).
import { chromium } from '@playwright/test';
const BASE = 'https://practicesoftwaretesting.com', OUT = 'evidencias/fase1-exploracao';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(BASE + '/product/01M7XC56PMV40G7HKEPVECHFZ4');
await page.locator('[data-test="product-name"]').waitFor();
console.log('OOS add-to-cart disabled?', await page.locator('[data-test="add-to-cart"]').isDisabled(), '| out-of-stock label:', await page.locator('[data-test="out-of-stock"]').count());
await page.screenshot({ path: `${OUT}/produto-sem-estoque.png`, fullPage: true });
await page.goto(BASE + '/auth/register');
await page.locator('[data-test="email"]').fill('nao-e-email');
await page.locator('[data-test="register-submit"]').click();
await page.waitForTimeout(1000);
console.log('REGISTER email errors:', await page.locator('[data-test$="-error"], .invalid-feedback, .alert').allInnerTexts());
await page.screenshot({ path: `${OUT}/cadastro-email-invalido-ui.png`, fullPage: true });
await page.goto(BASE + '/');
console.log('SORT options:', await page.locator('[data-test="sort"] option').evaluateAll(o => o.map(x => x.value + '=' + x.textContent.trim())));
await browser.close();
