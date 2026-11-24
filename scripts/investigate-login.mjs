// Investigação: mensagem de erro do login com e-mail inexistente × e-mail existente com senha errada.
import { chromium, selectors } from '@playwright/test';
selectors.setTestIdAttribute('data-test');
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('response', async (r) => { if (r.url().endsWith('/users/login')) console.log('  [rede]', r.request().method(), r.status(), (await r.text().catch(() => '')).slice(0, 120)); });
for (const [label, email] of [['inexistente', `nao.existe.${Date.now()}@example.com`], ['inexistente-2', `nao.existe.${Date.now() + 1}@example.com`]]) {
  await page.goto('https://practicesoftwaretesting.com/auth/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill('Wrong#Pass123');
  const t0 = Date.now();
  await page.getByTestId('login-submit').click();
  const shown = await page.getByTestId('login-error').waitFor({ timeout: 45000 }).then(() => true, () => false);
  console.log(label, '→ erro exibido?', shown, shown ? JSON.stringify(await page.getByTestId('login-error').innerText()) : '', `(${Date.now() - t0} ms)`);
}
await browser.close();
