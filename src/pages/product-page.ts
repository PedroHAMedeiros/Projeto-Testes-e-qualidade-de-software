import { Locator, Page, expect } from '@playwright/test';
import { skipIfBotWall } from './bot-wall';

/** Page Object do detalhe de produto. */
export class ProductPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('product-name');
    this.price = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.cartBadge = page.getByTestId('cart-quantity');
  }

  /** Abre o produto e espera a resposta de GET /products/{id} (até 45 s — picos de latência medidos no SUT). */
  async goto(productId: string) {
    const data = this.page.waitForResponse((r) => new URL(r.url()).pathname === `/products/${productId}` && r.request().method() === 'GET', { timeout: 45_000 });
    data.catch(() => undefined); // evita rejeição não tratada se o teste for pulado antes do await
    await this.page.goto(`/product/${productId}`);
    await skipIfBotWall(this.page);
    expect((await data).status(), `GET /products/${productId}`).toBe(200);
    await expect(this.name).toBeVisible();
  }

  async setQuantity(qty: number) {
    await this.quantity.fill(String(qty));
  }

  async addToCart() {
    await this.addToCartButton.click();
    await expect(this.page.getByRole('alert').filter({ hasText: 'Product added to shopping cart' }).first()).toBeVisible();
  }
}
