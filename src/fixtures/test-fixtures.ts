import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../api/api-client';
import { recordEndpoint } from '../api/endpoint-recorder';
import { buildUser, NewUser } from '../data/factories';
import { HomePage } from '../pages/home-page';
import { ProductPage } from '../pages/product-page';
import { LoginPage, RegisterPage } from '../pages/auth-pages';
import { CheckoutPage } from '../pages/checkout-page';
import { API_URL } from '../../playwright.config';
import { BOT_WALL_REASON, isBotWalled, watchBotWall } from '../pages/bot-wall';
import { Catalog, resolveCatalog } from '../data/catalog';

export type RegisteredUser = NewUser & { id: string; token: string };

/** Cadastra e autentica um usuário novo via API (pré-condição rápida e isolada). */
async function createUser(api: ApiClient): Promise<RegisteredUser> {
  const user = buildUser();
  const reg = await api.register(user);
  expect(reg.status(), `setup: cadastro via API (${await reg.text()})`).toBe(201);
  const { id } = await reg.json();
  const login = await api.login(user.email, user.password);
  expect(login.status(), 'setup: login via API').toBe(200);
  const { access_token } = await login.json();
  return { ...user, id, token: access_token };
}

type Fixtures = {
  api: ApiClient;
  /** Usuário novo, criado via API no setup (pré-condição rápida e isolada, sem depender da UI de cadastro). */
  registeredUser: RegisteredUser;
  /** Segundo usuário independente — usado nos testes de autorização (um cliente não pode acessar dados do outro). */
  otherUser: RegisteredUser;
  /** Carrinho novo criado via API; removido no teardown. */
  cartId: string;
  homePage: HomePage;
  productPage: ProductPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  checkoutPage: CheckoutPage;
};

type WorkerFixtures = {
  /** IDs atuais do catálogo, resolvidos por nome uma vez por worker (resiste ao re-seed do ambiente público). */
  catalog: Catalog;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  catalog: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext();
      await use(await resolveCatalog(ctx, API_URL));
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  api: async ({ request }, use) => {
    await use(new ApiClient(request, API_URL));
  },

  registeredUser: async ({ api }, use) => {
    await use(await createUser(api));
    // Teardown: a API pública não permite que o cliente exclua a própria conta (DELETE /users exige admin).
    // Mitigação: e-mails únicos e domínio example.com (reservado) — ver docs/01-plano-de-testes.md, seção Dados de Teste.
  },

  otherUser: async ({ api }, use) => {
    await use(await createUser(api));
  },

  cartId: async ({ api }, use) => {
    const id = await api.createCart();
    await use(id);
    await api.deleteCart(id); // teardown: não deixa carrinhos órfãos
  },

  homePage: async ({ page }, use) => use(new HomePage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

/**
 * Variante para testes de UI/E2E: adiciona a fixture automática de rastreamento de chamadas.
 * Fica separada para que os testes de API não abram navegador à toa.
 */
export const uiTest = test.extend<{ trackUiApiCalls: void }>({
  trackUiApiCalls: [
    async ({ page }, use, testInfo) => {
      const apiHost = new URL(API_URL).host;
      page.on('response', (r) => {
        if (new URL(r.url()).host === apiHost && r.request().method() !== 'OPTIONS') recordEndpoint(r.request().method(), r.url(), 'ui', r.status());
      });
      // Observa o desafio anti-robô do Cloudflare (src/pages/bot-wall.ts). Os page objects pulam o teste ao detectá-lo.
      watchBotWall(page);
      await use();
      // Se o teste falhou por um caminho não protegido e houve desafio, deixa isso registrado para o diagnóstico.
      if (testInfo.status !== testInfo.expectedStatus && isBotWalled(page)) {
        testInfo.annotations.push({ type: 'ambiente', description: 'Desafio do Cloudflare observado durante este teste (OBS-12).' });
      }
    },
    { auto: true },
  ],
});

/**
 * Nome usado pelos testes que passam por rotas sujeitas ao desafio anti-robô (produto, checkout, "minha conta").
 * O comportamento é o de uiTest: a verificação acontece a cada navegação, dentro dos page objects.
 */
export const protectedUiTest = uiTest;

export { expect, BOT_WALL_REASON };
