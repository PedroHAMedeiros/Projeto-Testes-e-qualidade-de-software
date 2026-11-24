import { test, expect } from '../../src/fixtures/test-fixtures';
import { CART_QTY, NON_EXISTENT_ID } from '../../src/data/test-data';

/**
 * Carrinho via API. Requisito RF-06 (carrinho) e regra de negócio RN-01 (quantidade inteira 1..99).
 * Cada teste recebe um carrinho novo (fixture cartId) → testes independentes e paralelizáveis.
 */
test.describe('API · Carrinho', () => {
  let P: string; // ID atual do produto-base, resolvido pela fixture catalog

  test.beforeEach(({ catalog }) => {
    P = catalog.product('combinationPliers').id;
  });

  test('API-CART-01 cria carrinho e adiciona item @smoke @regression', async ({ api, cartId }) => {
    const add = await api.addToCart(cartId, P, 2);
    expect(add.status()).toBe(200);
    const cart = await (await api.getCart(cartId)).json();
    expect(cart.cart_items).toHaveLength(1);
    expect(cart.cart_items[0]).toMatchObject({ product_id: P, quantity: 2 });
  });

  // Análise de valor-limite (BVA) + partições de equivalência para RN-01.
  // Refatoração (smell S-03, lint "no-conditional-expect"): a 1ª versão tinha UM teste com `if` decidindo
  // quais asserções rodar. Separar casos válidos e inválidos deixa cada teste com um único caminho e
  // asserções sempre executadas.
  const validQty: Array<[number, string]> = [
    [CART_QTY.min, 'mínimo (1)'],
    [CART_QTY.max, 'máximo (99)'],
  ];
  const invalidQty: Array<[unknown, string]> = [
    [CART_QTY.min - 1, 'abaixo do mínimo (0)'],
    [CART_QTY.max + 1, 'acima do máximo (100)'],
    [-1, 'negativo'],
    [1.5, 'decimal'],
    ['abc', 'texto'],
  ];
  for (const [qty, why] of validQty) {
    test(`API-CART-02 quantidade válida ${qty} — ${why} @boundary @regression`, async ({ api, cartId }) => {
      expect((await api.addToCart(cartId, P, qty)).status()).toBe(200);
      expect((await (await api.getCart(cartId)).json()).cart_items[0].quantity).toBe(qty);
    });
  }
  for (const [qty, why] of invalidQty) {
    test(`API-CART-02 quantidade inválida ${JSON.stringify(qty)} — ${why} @boundary @negative @regression`, async ({ api, cartId }) => {
      const res = await api.addToCart(cartId, P, qty);
      expect(res.status()).toBe(422);
      expect((await res.json()).errors).toHaveProperty('quantity');
    });
  }

  test('API-CART-03 produto inexistente é rejeitado @negative @regression', async ({ api, cartId }) => {
    const res = await api.addToCart(cartId, NON_EXISTENT_ID, 1);
    expect(res.status()).toBe(422);
    expect((await res.json()).errors).toHaveProperty('product_id');
  });

  test('API-CART-04 atualiza quantidade e remove item @regression', async ({ api, cartId }) => {
    await api.addToCart(cartId, P, 1);
    expect((await api.updateQuantity(cartId, P, 3)).status()).toBe(200);
    expect((await (await api.getCart(cartId)).json()).cart_items[0].quantity).toBe(3);
    expect((await api.removeFromCart(cartId, P)).status()).toBe(204);
    expect((await (await api.getCart(cartId)).json()).cart_items).toHaveLength(0);
  });

  test('API-CART-05 atualizar quantidade para 0 é rejeitado e preserva o valor anterior @negative @regression', async ({ api, cartId }) => {
    await api.addToCart(cartId, P, 2);
    expect((await api.updateQuantity(cartId, P, 0)).status()).toBe(422);
    expect((await (await api.getCart(cartId)).json()).cart_items[0].quantity).toBe(2);
  });

  test('API-CART-06 adicionar o mesmo produto duas vezes soma as quantidades @regression', async ({ api, cartId }) => {
    await api.addToCart(cartId, P, 2);
    await api.addToCart(cartId, P, 3);
    const items = (await (await api.getCart(cartId)).json()).cart_items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  test('API-CART-07 carrinho inexistente retorna 404 @negative @regression', async ({ api }) => {
    expect((await api.getCart(NON_EXISTENT_ID)).status()).toBe(404);
  });

  test('API-CART-08 adições acumuladas não podem ultrapassar o máximo de 99 @boundary @known-defect', async ({ api, cartId }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-002 — soma de adições ultrapassa o limite de 99 unidades' });
    test.fail(true, 'BUG-002 aberto: 60 + 60 resulta em 120 no carrinho.');
    await api.addToCart(cartId, P, 60);
    const second = await api.addToCart(cartId, P, 60);
    const qty = (await (await api.getCart(cartId)).json()).cart_items[0].quantity;
    expect.soft(second.status(), 'a segunda adição deveria ser rejeitada').toBe(422);
    expect(qty).toBeLessThanOrEqual(CART_QTY.max);
  });

  test('API-CART-09 produto sem estoque não deve ser aceito no carrinho @negative @known-defect', async ({ api, cartId, catalog }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-003 — API aceita produto sem estoque (UI bloqueia)' });
    const product = await (await api.getProduct(catalog.product('longNosePliersOutOfStock').id)).json();
    // Pré-condição verificada ANTES do test.fail(): se o seed mudar, o teste é pulado em vez de "falhar como esperado" por motivo errado.
    test.skip(product.in_stock !== false, 'Pré-condição não atendida: o produto voltou a ter estoque no seed.');
    test.fail(true, 'BUG-003 aberto: a API retorna 200 para produto com in_stock=false.');
    const res = await api.addToCart(cartId, catalog.product('longNosePliersOutOfStock').id, 1);
    expect(res.status()).toBe(422);
  });
});
