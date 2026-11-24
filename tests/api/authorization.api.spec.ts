import { test, expect } from '../../src/fixtures/test-fixtures';
import { ApiClient } from '../../src/api/api-client';

/**
 * Autorização entre clientes (risco R5 — doc 01) e funcionalidades da conta: favoritos e faturas.
 * Padrão: o usuário A cria o recurso; o usuário B (fixture otherUser) tenta acessá-lo.
 * Referência: OWASP API Security Top 10 — API1 "Broken Object Level Authorization".
 */
test.describe('API · Autorização e conta do cliente', () => {
  test('API-AUTHZ-01 cliente cria, lista, consulta e remove o próprio favorito @smoke @regression', async ({ api, catalog, registeredUser }) => {
    const me = api.withToken(registeredUser.token);
    const productId = catalog.product('combinationPliers').id;
    const created = await me.addFavorite(productId);
    expect(created.status()).toBe(201);
    const { id } = await created.json();
    expect((await (await me.favorites()).json()).map((f: { id: string }) => f.id)).toContain(id);
    expect((await me.favorite(id)).status()).toBe(200);
    expect((await me.deleteFavorite(id)).status()).toBe(204);
    expect((await (await me.favorites()).json()).map((f: { id: string }) => f.id)).not.toContain(id);
  });

  test('API-AUTHZ-02 favoritos exigem autenticação @negative @regression', async ({ api }) => {
    expect((await api.favorites()).status()).toBe(401);
  });

  test('API-AUTHZ-03 cliente B NÃO pode ler o favorito do cliente A @negative @known-defect', async ({ api, catalog, registeredUser, otherUser }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-008 — GET /favorites/{id} não verifica o dono (BOLA/IDOR)' });
    const { id } = await (await api.withToken(registeredUser.token).addFavorite(catalog.product('pliers').id)).json();
    test.fail(true, 'BUG-008 aberto: B recebe 200 com o favorito de A.');
    const res = await api.withToken(otherUser.token).favorite(id);
    expect([403, 404]).toContain(res.status());
  });

  test('API-AUTHZ-04 cliente B não consegue apagar o favorito do cliente A @negative @regression', async ({ api, catalog, registeredUser, otherUser }) => {
    const a = api.withToken(registeredUser.token);
    const { id } = await (await a.addFavorite(catalog.product('boltCutters').id)).json();
    await api.withToken(otherUser.token).deleteFavorite(id); // resposta observada: 204 (OBS-09), mas nada é apagado
    expect((await a.favorite(id)).status(), 'o favorito de A continua existindo').toBe(200);
  });

  test.describe('faturas', () => {
    /** Cria uma fatura do usuário via API, com endereço coerente com o serviço de CEP do SUT (regra AddressMatchesCountry). */
    async function createInvoiceFor(api: ApiClient, token: string, productId: string) {
      const cartId = await api.createCart();
      await api.addToCart(cartId, productId, 1);
      const addr = await (await api.postcodeLookup('BR', '59000-000')).json();
      const res = await api.withToken(token).createInvoice({
        billing_street: addr.street, billing_city: addr.city, billing_state: addr.state, billing_country: 'BR', billing_postal_code: '59000-000',
        payment_method: 'cash-on-delivery', payment_details: {}, cart_id: cartId,
      });
      expect(res.status(), `setup: criação da fatura (${await res.text()})`).toBe(201);
      return res.json() as Promise<{ id: string; invoice_number: string; total: number }>;
    }

    test('API-AUTHZ-05 cliente consulta a própria fatura com total coerente @regression', async ({ api, catalog, registeredUser }) => {
      const product = catalog.product('combinationPliers');
      const inv = await createInvoiceFor(api, registeredUser.token, product.id);
      const res = await api.withToken(registeredUser.token).invoice(inv.id);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.invoice_number).toBe(inv.invoice_number);
      expect(body.total).toBeCloseTo(product.price, 2);
    });

    test('API-AUTHZ-06 cliente B NÃO pode ler nem encontrar a fatura do cliente A @negative @regression', async ({ api, catalog, registeredUser, otherUser }) => {
      const inv = await createInvoiceFor(api, registeredUser.token, catalog.product('pliers').id);
      const b = api.withToken(otherUser.token);
      expect((await b.invoice(inv.id)).status()).toBe(404);
      const search = await b.searchInvoices(inv.invoice_number);
      expect(search.status()).toBe(200);
      expect((await search.json()).data).toEqual([]);
    });

    test('API-AUTHZ-07 fatura com cidade incompatível com o CEP é rejeitada @negative @regression', async ({ api, catalog, registeredUser }) => {
      const cartId = await api.createCart();
      await api.addToCart(cartId, catalog.product('pliers').id, 1);
      const res = await api.withToken(registeredUser.token).createInvoice({
        billing_street: 'Rua das Flores', billing_city: 'Cidade Inexistente', billing_state: 'Estado Inexistente', billing_country: 'BR', billing_postal_code: '59000-000',
        payment_method: 'cash-on-delivery', payment_details: {}, cart_id: cartId,
      });
      expect(res.status()).toBe(422);
      expect(await res.json()).toHaveProperty('billing_country');
    });
  });

  test('API-ACC-01 refresh de token gera um novo token válido @regression', async ({ api, registeredUser }) => {
    const res = await api.withToken(registeredUser.token).refresh();
    expect(res.status()).toBe(200);
    const { access_token } = await res.json();
    expect(access_token).not.toBe(registeredUser.token);
    expect((await api.withToken(access_token).me()).status()).toBe(200);
  });

  test('API-ACC-02 troca de senha: nova senha entra, antiga não @regression', async ({ api, registeredUser }) => {
    const newPassword = `${registeredUser.password}Nv9#`;
    const res = await api.withToken(registeredUser.token).changePassword(registeredUser.password, newPassword);
    expect(res.status(), await res.text()).toBe(200);
    expect((await api.login(registeredUser.email, newPassword)).status()).toBe(200);
    expect((await api.login(registeredUser.email, registeredUser.password)).status()).toBe(401);
  });
});
