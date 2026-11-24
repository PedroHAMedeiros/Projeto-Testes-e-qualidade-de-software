// Investigação (Sessão exploratória SE-04): a busca automática de CEP sobrescreve campos já digitados pelo usuário?
// Passos: usuário novo (API) → login → carrinho → checkout passo 3 → digita CEP e, logo em seguida, cidade/estado/rua
// → aguarda 5 s → lê os valores dos campos. Repete 3 vezes. Registra as requisições /postcode-lookup.
import { chromium, selectors } from '@playwright/test';
import fs from 'node:fs';
selectors.setTestIdAttribute('data-test');
const BASE = 'https://practicesoftwaretesting.com', API = 'https://api.practicesoftwaretesting.com', OUT = 'evidencias/fase3-exploratorios';
fs.mkdirSync(OUT, { recursive: true });
const id = Date.now().toString(36);
const user = { first_name: 'Qa', last_name: 'Postcode', email: `qa.postcode.${id}@example.com`, password: `Tq#${id}Aa1!`, dob: '1995-05-20' };
console.log('register', (await fetch(API + '/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) })).status);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('response', async (r) => { if (r.url().includes('postcode-lookup')) console.log('  [rede]', r.status(), decodeURIComponent(r.url().split('?')[1] ?? ''), (await r.text()).slice(0, 160)); });
await page.goto(BASE + '/auth/login');
await page.getByTestId('email').fill(user.email);
await page.getByTestId('password').fill(user.password);
await page.getByTestId('login-submit').click();
await page.waitForURL(/account/, { timeout: 45000 });
const products = await (await fetch(API + '/products')).json();
await page.goto(BASE + '/product/' + products.data[0].id);
await page.getByTestId('add-to-cart').click({ timeout: 45000 });
await page.getByRole('alert').first().waitFor();
const results = [];
for (let run = 1; run <= 3; run++) {
  await page.goto(BASE + '/checkout');
  await page.getByTestId('proceed-1').click({ timeout: 45000 });
  await page.getByTestId('proceed-2').click({ timeout: 45000 });
  await page.getByTestId('country').selectOption('BR');
  await page.getByTestId('postal_code').fill('59000-000');
  await page.getByTestId('house_number').fill('100');
  await page.getByTestId('street').fill('Rua das Flores');
  await page.getByTestId('city').fill('Natal');
  await page.getByTestId('state').fill('RN');
  const typed = { street: await page.getByTestId('street').inputValue(), city: await page.getByTestId('city').inputValue(), state: await page.getByTestId('state').inputValue() };
  await page.waitForTimeout(5000); // espera proposital (script de investigação, não teste): dá tempo à resposta assíncrona
  const after = { street: await page.getByTestId('street').inputValue(), city: await page.getByTestId('city').inputValue(), state: await page.getByTestId('state').inputValue() };
  console.log(`execução ${run}: digitado=${JSON.stringify(typed)} → após 5 s=${JSON.stringify(after)}`);
  results.push({ run, typed, after, sobrescrito: JSON.stringify(typed) !== JSON.stringify(after) });
  await page.screenshot({ path: `${OUT}/SE-04-cep-execucao-${run}.png`, fullPage: true });
}
fs.writeFileSync(`${OUT}/SE-04-cep-sobrescreve-campos.json`, JSON.stringify({ executado_em: new Date().toISOString(), resultados: results }, null, 2));
await browser.close();
