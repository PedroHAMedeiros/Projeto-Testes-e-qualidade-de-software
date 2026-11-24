/**
 * Dados de referência do catálogo (seed público do SUT, v5.0).
 *
 * REFATORAÇÃO (ver docs/05-qualidade-e-refatoracao.md, smell S-01):
 * a 1ª versão guardava os IDs (ULID) dos produtos aqui. Durante a execução descobrimos que o ambiente público
 * é re-semeado periodicamente e os IDs mudam (evidencias/fase4-automacao/reseed-ids-mudaram.log),
 * o que quebrou 10 testes de uma vez. Agora guardamos só NOMES/SLUGS (estáveis) e os IDs são resolvidos
 * em tempo de execução pela fixture `catalog` (src/data/catalog.ts).
 */
export const PRODUCT_NAMES = {
  combinationPliers: 'Combination Pliers',
  pliers: 'Pliers',
  boltCutters: 'Bolt Cutters',
  longNosePliersOutOfStock: 'Long Nose Pliers',
  thorHammer: 'Thor Hammer',
} as const;

export type ProductKey = keyof typeof PRODUCT_NAMES;

export const CATEGORY_SLUGS = { handTools: 'hand-tools', pliers: 'pliers' } as const;

export type CategoryKey = keyof typeof CATEGORY_SLUGS;

/** ULID sintaticamente válido, mas inexistente. */
export const NON_EXISTENT_ID = '01AAAAAAAAAAAAAAAAAAAAAAAA';

/** Regra de negócio observada no carrinho (API): quantidade inteira entre 1 e 99. */
export const CART_QTY = { min: 1, max: 99 } as const;

/** Tamanho de página da listagem de produtos (observado: per_page = 9). */
export const PAGE_SIZE = 9;
