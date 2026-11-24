import { test, expect } from '../../src/fixtures/test-fixtures';
import { NON_EXISTENT_ID } from '../../src/data/test-data';

/**
 * Catálogo auxiliar (categorias, marcas, especificações — usados pelos filtros da UI, RF-03),
 * formulário de contato (RF-11, só validações: não enviamos mensagens válidas no ambiente compartilhado)
 * e serviço de CEP (RF-10).
 */
test.describe('API · Catálogo auxiliar', () => {
  test('API-CAT-01 lista e busca de categorias são consistentes com a árvore @regression', async ({ api, catalog }) => {
    const all = await (await api.categories()).json();
    expect(all.map((c: { slug: string }) => c.slug)).toEqual(expect.arrayContaining(['hand-tools', 'power-tools', 'other']));
    const found = await (await api.searchCategories('pliers')).json();
    expect(found.map((c: { id: string }) => c.id)).toContain(catalog.category('pliers').id);
    const handTools = await (await api.categoryTree(catalog.category('handTools').id)).json();
    expect(handTools.sub_categories.map((c: { slug: string }) => c.slug)).toContain('pliers');
  });

  test('API-CAT-02 subárvore de categoria inexistente retorna 404 @negative @regression', async ({ api }) => {
    expect((await api.categoryTree(NON_EXISTENT_ID)).status()).toBe(404);
  });

  test('API-CAT-03 marca por ID e por busca retornam o mesmo registro @regression', async ({ api }) => {
    const [first] = await (await api.brands()).json();
    expect(await (await api.brand(first.id)).json()).toMatchObject({ id: first.id, name: first.name });
    const found = await (await api.searchBrands(first.name.split(' ')[0])).json();
    expect(found.map((b: { id: string }) => b.id)).toContain(first.id);
  });

  test('API-CAT-04 especificações do produto usam nomes do dicionário de especificações @regression', async ({ api, catalog }) => {
    const specs = await (await api.productSpecs(catalog.product('combinationPliers').id)).json();
    expect(specs.length).toBeGreaterThan(0);
    const dictionary = new Set((await (await api.specNames()).json()).map((s: { name: string }) => s.name));
    for (const s of specs) expect(dictionary.has(s.spec_name), `"${s.spec_name}" deveria existir no dicionário`).toBe(true);
  });
});

test.describe('API · Formulário de contato (somente validação)', () => {
  test('API-MSG-01 mensagem sem assunto e sem texto é rejeitada @negative @regression', async ({ api }) => {
    const res = await api.sendMessage({});
    expect(res.status()).toBe(422);
    expect(Object.keys(await res.json())).toEqual(expect.arrayContaining(['subject', 'message']));
  });

  test('API-MSG-02 texto acima de 250 caracteres e e-mail inválido são rejeitados @negative @boundary @regression', async ({ api }) => {
    const res = await api.sendMessage({ name: 'Qa', email: 'nao-e-email', subject: 'website', message: 'x'.repeat(251) });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('message');
  });
});

test.describe('API · Serviço de CEP', () => {
  test('API-CEP-01 busca de CEP devolve endereço completo @regression', async ({ api }) => {
    const res = await api.postcodeLookup('BR', '59000-000', '100');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual(expect.objectContaining({ city: expect.any(String), state: expect.any(String), street: expect.any(String), country: 'BR' }));
  });

  test('API-CEP-02 o mesmo CEP com e sem hífen deve devolver a mesma cidade @known-defect', async ({ api }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-009 — 59000000 e 59000-000 (mesmo CEP) retornam endereços diferentes' });
    // Contribui para o BUG-007: o checkout pré-carrega o CEP do perfil (sem hífen) e o usuário digita com hífen.
    test.fail(true, 'BUG-009 aberto: o serviço não normaliza o CEP antes da consulta.');
    const withDash = await (await api.postcodeLookup('BR', '59000-000', '100')).json();
    const digitsOnly = await (await api.postcodeLookup('BR', '59000000', '100')).json();
    expect(digitsOnly.city).toBe(withDash.city);
  });
});
