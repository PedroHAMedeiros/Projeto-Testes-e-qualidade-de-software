// Fase 1 (parte 2): detalhe de produto -> carrinho -> checkout (sem finalizar compra).
import { chromium } from '@playwright/test';
const BASE = 'https://practicesoftwaretesting.com', OUT = 'evidencias/fase1-exploracao';
const dt = (page) => page.$$eval('[data-test]', els => [...new Set(els.map(e => e.getAttribute('data-test')))].filter(x => !/^(nav|lang|footer|category-|brand-)/.test(x)));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(BASE + '/product/01M7XC56PE2A3HM6VQJDSCYSHQ');
await page.getByTestId?.('add-to-cart');
await page.locator('[data-test="add-to-cart"]').waitFor({ timeout: 20000 });
console.log('PRODUCT', await dt(page));
await page.screenshot({ path: `${OUT}/product-detail.png`, fullPage: true });
await page.locator('[data-test="add-to-cart"]').click();
await page.waitForTimeout(2000);
console.log('TOAST', await page.locator('[role="alert"], .toast, #toast-container').allInnerTexts());
console.log('CART-QTY', await page.locator('[data-test="cart-quantity"]').innerText().catch(e => 'n/a'));
await page.goto(BASE + '/checkout');
await page.waitForTimeout(3000);
console.log('CHECKOUT1', await dt(page));
await page.screenshot({ path: `${OUT}/checkout-step1-cart.png`, fullPage: true });
await page.locator('[data-test="proceed-1"]').click();
await page.waitForTimeout(2000);
console.log('CHECKOUT2', await dt(page));
await page.screenshot({ path: `${OUT}/checkout-step2-signin.png`, fullPage: true });
const guest = page.getByRole('tab', { name: /guest/i });
if (await guest.count()) { await guest.click(); await page.waitForTimeout(800); console.log('GUEST', await dt(page)); await page.screenshot({ path: `${OUT}/checkout-step2-guest.png`, fullPage: true }); }
await browser.close();
