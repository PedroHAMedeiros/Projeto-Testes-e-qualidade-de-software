import { test, expect } from '../../src/fixtures/test-fixtures';
import { CATEGORY_SLUGS, NON_EXISTENT_ID, PAGE_SIZE, PRODUCT_NAMES } from '../../src/data/test-data';

/**
 * Catálogo de produtos via API.
 * Requisitos cobertos: RF-01 (listagem/paginação), RF-02 (busca), RF-03 (filtros), RF-04 (ordenação), RF-05 (detalhe).
 */
test.describe('API · Produtos', () => {
  test('API-PROD-01 lista produtos paginada com contrato esperado @smoke @regression', async ({ api }) => {
    const res = await api.listProducts();
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ current_page: 1, per_page: PAGE_SIZE });
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(PAGE_SIZE);
    expect(body.last_page).toBe(Math.ceil(body.total / body.per_page));
    // Contrato mínimo de cada item (campos usados pela UI)
    for (const p of body.data) {
      expect(p).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), price: expect.any(Number), in_stock: expect.any(Boolean) }));
      expect(p.price).toBeGreaterThan(0);
    }
  });

  test('API-PROD-02 última página contém o restante dos itens (fronteira de paginação) @regression @boundary', async ({ api }) => {
    const first = await (await api.listProducts()).json();
    const last = await (await api.listProducts(`?page=${first.last_page}`)).json();
    const expectedOnLast = first.total - PAGE_SIZE * (first.last_page - 1);
    expect(last.data).toHaveLength(expectedOnLast);
    const beyond = await (await api.listProducts(`?page=${first.last_page + 1}`)).json();
    expect(beyond.data).toEqual([]);
  });

  test('API-PROD-03 páginas consecutivas não repetem produtos @regression', async ({ api }) => {
    const p1 = (await (await api.listProducts('?page=1')).json()).data.map((p: { id: string }) => p.id);
    const p2 = (await (await api.listProducts('?page=2')).json()).data.map((p: { id: string }) => p.id);
    expect(p1.filter((id: string) => p2.includes(id))).toEqual([]);
  });

  for (const [sort, field, dir] of [
    ['price,asc', 'price', 1],
    ['price,desc', 'price', -1],
    ['name,asc', 'name', 1],
    ['name,desc', 'name', -1],
  ] as const) {
    test(`API-PROD-04 ordena por ${sort} @regression`, async ({ api }) => {
      const res = await api.listProducts(`?sort=${sort}`);
      expect(res.status()).toBe(200);
      const values = (await res.json()).data.map((p: Record<string, string | number>) => p[field]);
      const sorted = [...values].sort((a, b) => (typeof a === 'number' ? (a as number) - (b as number) : String(a).localeCompare(String(b))) * dir);
      expect(values).toEqual(sorted);
    });
  }

  test('API-PROD-05 filtro por faixa de preço retorna apenas itens dentro da faixa @regression @boundary', async ({ api }) => {
    const res = await api.listProducts('?between=price,10,20');
    expect(res.status()).toBe(200);
    const prices: number[] = (await res.json()).data.map((p: { price: number }) => p.price);
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(10);
      expect(price).toBeLessThanOrEqual(20);
    }
  });

  test('API-PROD-06 filtro por categoria retorna somente a categoria pedida @regression', async ({ api, catalog }) => {
    const res = await api.listProducts(`?by_category=${catalog.category('pliers').id}`);
    const data = (await res.json()).data;
    expect(data.length).toBeGreaterThan(0);
    for (const p of data) expect(p.category.slug).toBe(CATEGORY_SLUGS.pliers);
  });

  test('API-PROD-07 busca por termo existente encontra o produto @smoke @regression', async ({ api }) => {
    const res = await api.searchProducts('thor');
    expect(res.status()).toBe(200);
    const names = (await res.json()).data.map((p: { name: string }) => p.name);
    expect(names).toContain(PRODUCT_NAMES.thorHammer);
  });

  for (const term of ['zzzzzzzz', "' OR 1=1 --", '<script>alert(1)</script>']) {
    test(`API-PROD-08 busca sem correspondência/maliciosa retorna lista vazia: ${term} @negative @regression`, async ({ api }) => {
      const res = await api.searchProducts(term);
      expect(res.status()).toBe(200);
      expect((await res.json()).total).toBe(0);
    });
  }

  test('API-PROD-09 detalhe de produto existente @smoke @regression', async ({ api, catalog }) => {
    const res = await api.getProduct(catalog.product('combinationPliers').id);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: catalog.product('combinationPliers').id, name: PRODUCT_NAMES.combinationPliers });
  });

  for (const id of [NON_EXISTENT_ID, 'abc']) {
    test(`API-PROD-10 produto inexistente/ID inválido retorna 404: ${id} @negative @regression`, async ({ api }) => {
      const res = await api.getProduct(id);
      expect(res.status()).toBe(404);
      expect((await res.json()).message).toBe('Requested item not found');
    });
  }

  test('API-PROD-11 produtos relacionados não incluem o próprio produto @regression', async ({ api, catalog }) => {
    const res = await api.relatedProducts(catalog.product('combinationPliers').id);
    expect(res.status()).toBe(200);
    const ids = (await res.json()).map((p: { id: string }) => p.id);
    expect(ids).not.toContain(catalog.product('combinationPliers').id);
  });

  test('API-PROD-12 árvore de categorias e marcas disponíveis @regression', async ({ api }) => {
    const tree = await (await api.categoriesTree()).json();
    expect(tree.map((c: { slug: string }) => c.slug)).toEqual(expect.arrayContaining(['hand-tools', 'power-tools']));
    const brands = await (await api.brands()).json();
    expect(brands.length).toBeGreaterThan(0);
  });

  test('API-PROD-13 ordenação com parâmetro inválido deve ser rejeitada com 4xx, não 500 @negative @known-defect', async ({ api }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-001 — GET /products?sort=<inválido> retorna HTTP 500' });
    test.fail(true, 'BUG-001 aberto: o SUT responde 500. Quando corrigido, este teste passará e o Playwright avisará para remover o test.fail().');
    const res = await api.listProducts('?sort=foo,bar');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
