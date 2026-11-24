import { Locator, Page, expect } from '@playwright/test';
import { skipIfBotWall } from './bot-wall';

/** Page Object do checkout (wizard de 4 passos: carrinho → login → endereço → pagamento). */
export class CheckoutPage {
  readonly cartItems: Locator;
  readonly cartTotal: Locator;

  constructor(private readonly page: Page) {
    this.cartItems = page.getByTestId('product-title');
    this.cartTotal = page.getByTestId('cart-total');
  }

  async goto() {
    await this.page.goto('/checkout');
    await skipIfBotWall(this.page);
  }

  quantityInputs(): Locator {
    return this.page.getByTestId('product-quantity');
  }

  linePrices(): Locator {
    return this.page.getByTestId('line-price');
  }

  async proceedFromCart() {
    await this.page.getByTestId('proceed-1').click();
  }

  async proceedFromSignIn() {
    await this.page.getByTestId('proceed-2').click();
  }

  /**
   * Preenche o endereço de cobrança.
   * ATENÇÃO — BUG-007: ao informar o CEP, a busca automática (GET /postcode-lookup) é assíncrona e pode
   * SOBRESCREVER ou APAGAR rua/cidade/estado já digitados (evidencias/fase3-exploratorios/SE-04-*).
   * Por isso o fluxo E2E não depende dos valores digitados: ele lê os valores FINAIS do formulário (addressValues)
   * e confere a fatura contra eles. O defeito em si é verificado em tests/ui/checkout-address.ui.spec.ts.
   */
  async fillAddress(addr: { country: string; postal_code: string; house_number: string; street: string; city: string; state: string }) {
    const lookup = this.page
      .waitForResponse((r) => r.url().includes('/postcode-lookup'), { timeout: 15_000 })
      .catch(() => null); // a busca pode não disparar (ex.: resposta em cache) — não é erro do fluxo
    await this.page.getByTestId('country').selectOption(addr.country);
    await this.page.getByTestId('postal_code').fill(addr.postal_code);
    await this.page.getByTestId('house_number').fill(addr.house_number);
    await lookup;
    for (const field of ['street', 'city', 'state'] as const) {
      const input = this.page.getByTestId(field);
      if (!(await input.inputValue())) await input.fill(addr[field]); // completa apenas o que ficou vazio
    }
  }

  /**
   * Espera o formulário de endereço ficar ESTÁVEL (sem mudar sozinho) por `quietMs`.
   * Necessário pelo BUG-007: a busca de CEP pode responder mais de uma vez e trocar o endereço depois da leitura
   * (execução oficial de 20/11: lido "Júlio d'Oeste", gravado na fatura "Carmona d'Oeste").
   * Implementado com expect.poll (sem espera fixa): a cada 500 ms compara com a leitura anterior.
   */
  async waitForStableAddress(quietMs = 3_000) {
    let last = '';
    let stableSince = Date.now();
    await expect
      .poll(
        async () => {
          const now = JSON.stringify(await this.addressValues());
          if (now !== last) {
            last = now;
            stableSince = Date.now();
          }
          return Date.now() - stableSince;
        },
        { message: 'endereço não estabilizou (busca de CEP continua alterando os campos)', timeout: 30_000, intervals: [500] },
      )
      .toBeGreaterThanOrEqual(quietMs);
  }

  /** Valores atuais do formulário de endereço (o que de fato será enviado no pedido). */
  async addressValues() {
    const read = (f: string) => this.page.getByTestId(f).inputValue();
    return { street: await read('street'), city: await read('city'), state: await read('state'), postal_code: await read('postal_code') };
  }

  /** Confirma o pedido e espera a criação da fatura (POST /invoices) antes de verificar a tela de confirmação. */
  async confirmOrder() {
    const invoice = this.page.waitForResponse((r) => /\/invoices$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST', { timeout: 45_000 });
    await this.page.getByTestId('finish').click();
    const res = await invoice;
    expect(res.status(), 'POST /invoices deve criar a fatura').toBeLessThan(300);
    return res;
  }

  async proceedFromAddress() {
    const btn = this.page.getByTestId('proceed-3');
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  async pay(method: string) {
    await this.page.getByTestId('payment-method').selectOption(method);
    await this.page.getByTestId('finish').click();
  }

  paymentSuccess(): Locator {
    return this.page.getByTestId('payment-success-message');
  }
}
