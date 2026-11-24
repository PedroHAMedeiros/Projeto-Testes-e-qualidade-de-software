import { APIRequestContext } from '@playwright/test';
import { CATEGORY_SLUGS, CategoryKey, PRODUCT_NAMES, ProductKey } from './test-data';

export interface CatalogProduct { id: string; name: string; price: number; in_stock: boolean }
export interface Catalog {
  product(key: ProductKey): CatalogProduct;
  category(key: CategoryKey): { id: string; slug: string };
}

interface CategoryNode { id: string; slug: string; sub_categories?: CategoryNode[] }

/**
 * Resolve, em tempo de execução, os IDs atuais dos produtos/categorias a partir dos nomes estáveis.
 * Executado uma vez por worker (fixture de escopo "worker") → custo baixo e resistente a re-seed do ambiente.
 */
export async function resolveCatalog(request: APIRequestContext, apiUrl: string): Promise<Catalog> {
  /** GET com até 3 tentativas: o setup não deve falhar por um pico isolado de latência do ambiente público. */
  const getJson = async (url: string) => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await request.get(url, { timeout: 45_000 });
        if (res.ok()) return res.json();
        lastError = new Error(`HTTP ${res.status()}`);
      } catch (e) {
        lastError = e;
      }
    }
    throw new Error(`catalog: falha ao consultar ${url} após 3 tentativas: ${String(lastError)}`);
  };

  const products = new Map<ProductKey, CatalogProduct>();
  for (const [key, name] of Object.entries(PRODUCT_NAMES) as Array<[ProductKey, string]>) {
    const body = await getJson(`${apiUrl}/products/search?q=${encodeURIComponent(name)}`);
    const match = (body.data as CatalogProduct[]).find((p) => p.name === name);
    if (!match) throw new Error(`catalog: produto "${name}" não existe mais no seed do SUT`);
    products.set(key, match);
  }

  const tree = (await getJson(`${apiUrl}/categories/tree`)) as CategoryNode[];
  const flat: CategoryNode[] = [];
  const walk = (nodes: CategoryNode[]) => nodes.forEach((n) => { flat.push(n); walk(n.sub_categories ?? []); });
  walk(tree);

  return {
    product: (key) => products.get(key)!,
    category: (key) => {
      const slug = CATEGORY_SLUGS[key];
      const node = flat.find((c) => c.slug === slug);
      if (!node) throw new Error(`catalog: categoria "${slug}" não encontrada`);
      return { id: node.id, slug };
    },
  };
}
