// Evidência para OBS-05 (401 no console do visitante) e OBS-07 (pré-preenchimento do endereço do perfil no checkout).
import { chromium, selectors } from '@playwright/test';
selectors.setTestIdAttribute('data-test');
const BASE = 'https://practicesoftwaretesting.com', API = 'https://api.practicesoftwaretesting.com';
const browser = await chromium.launch();
const page = await browser.newPage();

console.log('## OBS-05 — visitante anônimo na home');
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 120)); });
page.on('response', (r) => { if (r.url().endsWith('/users/me')) console.log('  [rede]', r.request().method(), r.status(), r.url()); });
await page.goto(BASE + '/');
await page.locator('a[data-test^="product-01"]').first().waitFor({ timeout: 45000 });
page.removeAllListeners('console'); page.removeAllListeners('response');

console.log('## OBS-07 — usuário COM endereço no perfil (CEP 59000000), passo 3 do checkout');
const id = Date.now().toString(36);
const user = { first_name: 'Qa', last_name: 'Obs', email: `qa.obs.${id}@example.com`, password: `Tq#${id}Aa1!`, dob: '1995-05-20',
  address: { street: 'Rua das Flores', house_number: '100', city: 'Natal', state: 'RN', country: 'BR', postal_code: '59000000' } };
console.log('  register', (await fetch(API + '/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) })).status);
page.on('response', async (r) => { if (r.url().includes('postcode-lookup')) console.log('  [rede]', r.status(), decodeURIComponent(r.url().split('?')[1]), (await r.text()).slice(0, 110)); });
await page.goto(BASE + '/auth/login');
await page.getByTestId('email').fill(user.email);
await page.getByTestId('password').fill(user.password);
await page.getByTestId('login-submit').click();
await page.waitForURL(/account/, { timeout: 45000 });
const pid = (await (await fetch(API + '/products')).json()).data[0].id;
await page.goto(BASE + '/product/' + pid);
await page.getByTestId('add-to-cart').click({ timeout: 45000 });
await page.getByRole('alert').first().waitFor();
await page.goto(BASE + '/checkout');
await page.getByTestId('proceed-1').click({ timeout: 45000 });
await page.getByTestId('proceed-2').click({ timeout: 45000 });
const read = async () => Object.fromEntries(await Promise.all(['postal_code', 'street', 'city', 'state'].map(async (f) => [f, await page.getByTestId(f).inputValue()])));
for (const t of [0, 1000, 3000, 6000]) {
  if (t) await page.waitForTimeout(t === 1000 ? 1000 : t === 3000 ? 2000 : 3000); // script de investigação: amostragem no tempo
  console.log(`  t=${t} ms`, JSON.stringify(await read()));
}
await page.screenshot({ path: 'evidencias/fase3-exploratorios/OBS-07-prefill-perfil.png', fullPage: true });
await browser.close();
