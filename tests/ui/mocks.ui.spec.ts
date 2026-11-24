import { uiTest as test, expect } from '../../src/fixtures/test-fixtures';

/**
 * Testes de UI com a API substituída por mocks/stubs (page.route).
 * Por quê: alguns cenários são impossíveis ou arriscados de produzir no ambiente público compartilhado
 * (catálogo vazio, API fora do ar, latência alta, dados extremos). O mock isola o front-end e torna o teste determinístico.
 */
// O front-end consulta a listagem com o método HTTP QUERY em /products (sem query string) — ver docs/03.
// A 1ª versão usava /\/products\?/ e o mock nunca era aplicado; o UI-MOCK-01 passava por falso positivo.
// Lição registrada: todo teste com mock deve provar que o mock foi usado (contador `served` abaixo).
const PRODUCTS_LIST = (url: URL) => url.pathname === '/products';

const stubProduct = (overrides: Record<string, unknown> = {}) => ({
  id: '01STUBSTUBSTUBSTUBSTUBSTUB',
  name: 'Produto Stub',
  description: 'Gerado pelo teste',
  price: 10,
  is_location_offer: false,
  is_rental: false,
  co2_rating: 'A',
  in_stock: true,
  is_eco_friendly: false,
  product_image: { id: 'img', file_name: 'pliers01.avif', title: 'stub', by_name: '', by_url: '', source_name: '', source_url: '' },
  category: { id: 'c', name: 'Pliers', slug: 'pliers' },
  brand: { id: 'b', name: 'Stub' },
  ...overrides,
});

const page1 = (data: unknown[]) => ({ current_page: 1, data, from: data.length ? 1 : null, last_page: 1, per_page: 9, to: data.length || null, total: data.length });

test.describe('UI · Mocks e stubs da API', () => {
  test('UI-MOCK-01 catálogo vazio (stub) não quebra a home @regression', async ({ page }) => {
    let served = 0;
    await page.route(PRODUCTS_LIST, (route) => {
      served++;
      return route.fulfill({ json: page1([]) });
    });
    await page.goto('/');
    await expect.poll(() => served, { message: 'o stub precisa ter sido usado' }).toBeGreaterThan(0);
    await expect(page.getByTestId('nav-home')).toBeVisible();
    await expect(page.getByTestId('pagination-next')).toHaveCount(0);
    await expect(page.locator('a[data-test^="product-01"]')).toHaveCount(0);
  });

  test('UI-MOCK-02 dados controlados (stub) são renderizados fielmente, incluindo preço com centavos @regression', async ({ page }) => {
    await page.route(PRODUCTS_LIST, (route) =>
      route.fulfill({ json: page1([stubProduct({ name: 'Martelo Stub Ç', price: 1234.5 }), stubProduct({ id: '01STUB2', name: 'Esgotado Stub', in_stock: false })]) }),
    );
    await page.goto('/');
    await expect(page.getByTestId('product-name').first()).toHaveText('Martelo Stub Ç');
    await expect(page.getByTestId('product-price').first()).toContainText('1234.50');
    await expect(page.getByTestId('out-of-stock')).toHaveCount(1);
  });

  test('UI-MOCK-03 falha 500 da API não derruba a aplicação (resiliência) @negative @regression', async ({ page }) => {
    let served = 0;
    await page.route(PRODUCTS_LIST, (route) => {
      served++;
      return route.fulfill({ status: 500, json: { message: 'Something went wrong' } });
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect.poll(() => served, { message: 'o stub de erro precisa ter sido usado' }).toBeGreaterThan(0);
    // A navegação continua utilizável mesmo sem a lista de produtos.
    await expect(page.getByTestId('nav-contact')).toBeVisible();
    await page.getByTestId('nav-contact').click();
    await expect(page).toHaveURL(/\/contact$/);
    expect(errors, 'erros JavaScript não tratados na página').toEqual([]);
  });

  test('UI-MOCK-04 latência alta: a UI espera a resposta sem esperas fixas no teste (sincronização) @regression', async ({ page }) => {
    await page.route(PRODUCTS_LIST, async (route) => {
      const response = await route.fetch(); // repassa para a API real…
      await new Promise((r) => setTimeout(r, 3000)); // …mas atrasa 3 s
      await route.fulfill({ response });
    });
    await page.goto('/');
    // O expect com auto-retry aguarda até o timeout (10 s) — sem page.waitForTimeout.
    await expect(page.locator('a[data-test^="product-01"]').first()).toBeVisible();
  });
});
