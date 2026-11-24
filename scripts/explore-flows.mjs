// Fase 1 (parte 4): levanta textos e seletores reais dos fluxos de busca, login e checkout completo.
// Cria um usuário de teste novo via API (dados gerados, domínio example.com).
import { chromium, selectors } from '@playwright/test';
selectors.setTestIdAttribute('data-test');
const BASE = 'https://practicesoftwaretesting.com', API = 'https://api.practicesoftwaretesting.com', OUT = 'evidencias/fase1-exploracao';
const id = Date.now().toString(36);
const user = { first_name: 'Qa', last_name: 'Explorer', email: `qa.explore.${id}@example.com`, password: `Tq#${id}Aa1!`, dob: '1995-05-20', phone: '84999990000',
  address: { street: 'Rua das Flores', house_number: '100', city: 'Natal', state: 'RN', country: 'BR', postal_code: '59000000' } };
const reg = await fetch(API + '/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
console.log('register', reg.status);
const dt = (page) => page.$$eval('[data-test]', els => [...new Set(els.filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-test')))].filter(x => !/^(nav-|lang|footer|category-|brand-|chat|live)/.test(x)));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(BASE + '/');
await page.getByTestId('search-query').fill('zzzzzz');
await page.getByTestId('search-submit').click();
await page.waitForTimeout(2500);
console.log('NO-RESULTS text:', JSON.stringify(await page.locator('[data-test="no-results"], .col-md-9').first().innerText()));
console.log('SEARCH dt:', await dt(page));

await page.goto(BASE + '/auth/login');
await page.getByTestId('email').fill(user.email);
await page.getByTestId('password').fill('Wrong#Pass123');
await page.getByTestId('login-submit').click();
await page.waitForTimeout(2500);
console.log('LOGIN-ERROR dt:', await dt(page), JSON.stringify(await page.locator('[data-test="login-error"]').allInnerTexts()));

await page.getByTestId('password').fill(user.password);
await page.getByTestId('login-submit').click();
await page.waitForURL(/account/, { timeout: 20000 });
console.log('AFTER LOGIN url', page.url(), 'title', await page.getByTestId('page-title').innerText().catch(() => '?'), 'nav-menu', await page.getByTestId('nav-menu').innerText().catch(() => '?'));
await page.screenshot({ path: `${OUT}/conta-apos-login.png` });

await page.goto(BASE + '/product/01M7XC56PE2A3HM6VQJDSCYSHQ');
await page.getByTestId('add-to-cart').waitFor();
await page.getByTestId('add-to-cart').click();
await page.getByRole('alert').first().waitFor();
await page.waitForTimeout(1500);
await page.goto(BASE + '/checkout');
await page.getByTestId('proceed-1').click();
await page.waitForTimeout(1500);
console.log('STEP2 dt:', await dt(page), await page.locator('app-login, .step-indicator, p').allInnerTexts().then(a => a.slice(0, 5)));
await page.getByTestId('proceed-2').click();
await page.waitForTimeout(2000);
const vals = {};
for (const f of ['country', 'postal_code', 'house_number', 'street', 'city', 'state']) vals[f] = await page.getByTestId(f).inputValue().catch(() => '?');
console.log('STEP3 dt:', await dt(page), 'prefilled', vals, 'country tag', await page.getByTestId('country').evaluate(e => e.tagName + ':' + [...(e.options || [])].slice(0, 5).map(o => o.value + '=' + o.text).join(';')));
await page.screenshot({ path: `${OUT}/checkout-step3-endereco.png`, fullPage: true });
const p3 = page.getByTestId('proceed-3');
console.log('proceed-3 enabled?', await p3.isEnabled());
await page.getByTestId('country').selectOption('BR');
await page.getByTestId('postal_code').fill('59000-000');
await page.getByTestId('house_number').fill('100');
await page.getByTestId('street').fill('Rua das Flores');
await page.getByTestId('city').fill('Natal');
await page.getByTestId('state').fill('RN');
await page.waitForTimeout(800);
console.log('proceed-3 enabled after fill?', await p3.isEnabled(), JSON.stringify(await page.locator('.invalid-feedback, [data-test$="-error"]').allInnerTexts()));
if (await p3.isEnabled()) {
  await p3.click();
  await page.waitForTimeout(1500);
  console.log('STEP4 dt:', await dt(page), 'payment options', await page.getByTestId('payment-method').evaluate(e => [...e.options].map(o => o.value)));
  await page.getByTestId('payment-method').selectOption('cash-on-delivery');
  await page.getByTestId('finish').click();
  await page.waitForTimeout(2500);
  console.log('AFTER FINISH dt:', await dt(page), JSON.stringify(await page.locator('[data-test="payment-success-message"], .alert').allInnerTexts()));
  await page.screenshot({ path: `${OUT}/checkout-step4-pagamento-ok.png`, fullPage: true });
  if (await page.getByTestId('finish').isVisible()) { await page.getByTestId('finish').click(); await page.waitForTimeout(3000); }
  console.log('CONFIRM url', page.url(), JSON.stringify((await page.locator('#order-confirmation, [data-test="order-confirmation"], .container').first().innerText()).slice(0, 300)));
  await page.screenshot({ path: `${OUT}/checkout-confirmacao.png`, fullPage: true });
}
await browser.close();
