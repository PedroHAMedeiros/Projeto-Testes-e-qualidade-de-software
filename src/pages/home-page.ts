import { Locator, Page, expect } from '@playwright/test';
import { skipIfBotWall } from './bot-wall';

/** Page Object da listagem de produtos (home e páginas de categoria). */
export class HomePage {
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly searchInput: Locator;
  readonly sortSelect: Locator;

  constructor(private readonly page: Page) {
    // Cartões de produto têm data-test="product-<ULID>"; o ULID começa com "01".
    this.productCards = page.locator('a[data-test^="product-01"]');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
    this.searchInput = page.getByTestId('search-query');
    this.sortSelect = page.getByTestId('sort');
  }

  /** Abre a listagem e espera a consulta de produtos responder (até 45 s — picos de latência medidos no SUT). */
  async goto(path = '/') {
    const list = this.page.waitForResponse((r) => new URL(r.url()).pathname === '/products' && r.request().method() !== 'OPTIONS', { timeout: 45_000 });
    list.catch(() => undefined); // evita rejeição não tratada se o teste for pulado antes do await
    await this.page.goto(path);
    await skipIfBotWall(this.page);
    await list;
    await expect(this.productCards.first()).toBeVisible();
  }

  /**
   * Executa uma ação que dispara nova consulta de produtos e espera a resposta da API
   * (sincronização baseada em evento de rede, sem waitForTimeout fixo).
   * Observação da exploração: o front-end usa o método HTTP QUERY (com corpo) em /products e /products/search,
   * e não GET com query string — por isso o filtro é pelo caminho, sem depender do método.
   */
  private async waitForProducts(action: () => Promise<void>) {
    const response = this.page.waitForResponse((r) => /\/products(\/search)?$/.test(new URL(r.url()).pathname) && r.request().method() !== 'OPTIONS');
    await action();
    await response;
  }

  async search(term: string) {
    await this.waitForProducts(async () => {
      await this.searchInput.fill(term);
      await this.page.getByTestId('search-submit').click();
    });
  }

  async sortBy(value: string) {
    await this.waitForProducts(() => this.sortSelect.selectOption(value).then(() => undefined));
  }

  async filterByCategory(name: string) {
    await this.waitForProducts(() => this.page.getByRole('checkbox', { name, exact: true }).check());
  }

  async goToPage(n: number) {
    await this.waitForProducts(() => this.page.getByRole('button', { name: `Page-${n}`, exact: true }).click());
  }

  async names(): Promise<string[]> {
    return (await this.productNames.allInnerTexts()).map((s) => s.trim());
  }

  async prices(): Promise<number[]> {
    return (await this.productPrices.allInnerTexts()).map((s) => Number(s.replace(/[^0-9.]/g, '')));
  }

  async openProduct(name: string) {
    await this.productNames.filter({ hasText: name }).first().click();
  }
}
