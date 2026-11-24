import { uiTest as test, expect } from '../../src/fixtures/test-fixtures';
import { PAGE_SIZE, PRODUCT_NAMES } from '../../src/data/test-data';

/** Catálogo pela interface. RF-01..RF-05. */
test.describe('UI · Catálogo', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('UI-CAT-01 home exibe a primeira página de produtos com nome e preço @smoke @regression', async ({ homePage }) => {
    await expect(homePage.productCards).toHaveCount(PAGE_SIZE);
    for (const price of await homePage.prices()) expect(price).toBeGreaterThan(0);
  });

  test('UI-CAT-02 busca por termo existente mostra o produto e a contagem @smoke @regression', async ({ page, homePage }) => {
    await homePage.search('thor');
    await expect(page.getByTestId('search-term')).toHaveText('thor');
    expect(await homePage.names()).toContain(PRODUCT_NAMES.thorHammer);
  });

  test('UI-CAT-03 busca sem resultado informa que nada foi encontrado @negative @regression', async ({ page, homePage }) => {
    await homePage.search('zzzzzz');
    await expect(page.getByTestId('no-results')).toHaveText('There are no products found.');
    await expect(homePage.productCards).toHaveCount(0);
  });

  for (const [value, dir] of [['price,asc', 1], ['price,desc', -1]] as const) {
    test(`UI-CAT-04 ordenação ${value} exibe preços em ordem @regression`, async ({ homePage }) => {
      await homePage.sortBy(value);
      const prices = await homePage.prices();
      expect(prices).toEqual([...prices].sort((a, b) => (a - b) * dir));
    });
  }

  test('UI-CAT-05 filtro de categoria na UI é consistente com a API (integração UI↔API) @regression', async ({ api, homePage, catalog }) => {
    await homePage.filterByCategory('Pliers');
    const uiNames = await homePage.names();
    // Lista COMPLETA da categoria pela API (todas as páginas). O ambiente é compartilhado: outras pessoas criam
    // produtos nesta categoria, e com mais de uma página a ordem da 1ª página não é garantida (falha no CI em 24/11,
    // execução 45299470791). Por isso a comparação não depende da ordem nem de qual item cai na 1ª página.
    const query = `?by_category=${catalog.category('pliers').id}`;
    const first = await (await api.listProducts(query)).json();
    const apiNames: string[] = first.data.map((p: { name: string }) => p.name);
    for (let page = 2; page <= first.last_page; page++) {
      const next = await (await api.listProducts(`${query}&page=${page}`)).json();
      apiNames.push(...next.data.map((p: { name: string }) => p.name));
    }
    expect(apiNames).toHaveLength(first.total);
    expect(uiNames).toHaveLength(Math.min(PAGE_SIZE, first.total));
    for (const name of uiNames) expect(apiNames, `"${name}" aparece na UI mas não na categoria pela API`).toContain(name);
  });

  test('UI-CAT-06 segunda página exibe produtos diferentes da primeira @regression', async ({ homePage }) => {
    const first = await homePage.names();
    await homePage.goToPage(2);
    await expect.poll(async () => (await homePage.names())[0]).not.toBe(first[0]);
    const second = await homePage.names();
    expect(second.filter((n) => first.includes(n))).toEqual([]);
  });

  test('UI-CAT-07 detalhe do produto exibe os mesmos dados da API @regression', async ({ api, page, productPage, catalog }) => {
    const product = await (await api.getProduct(catalog.product('combinationPliers').id)).json();
    await productPage.goto(product.id);
    await expect(productPage.name).toHaveText(product.name);
    await expect(productPage.price).toHaveText(product.price.toFixed(2));
    await expect(page.getByTestId('product-description')).toContainText(product.description.slice(0, 40));
  });

  test('UI-CAT-08 produto sem estoque não pode ser adicionado ao carrinho @negative @regression', async ({ page, productPage, catalog }) => {
    await productPage.goto(catalog.product('longNosePliersOutOfStock').id);
    await expect(page.getByTestId('out-of-stock')).toBeVisible();
    await expect(productPage.addToCartButton).toBeDisabled();
  });
});
