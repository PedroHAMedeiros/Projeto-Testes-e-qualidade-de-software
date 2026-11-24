import { protectedUiTest as test, expect } from '../../src/fixtures/test-fixtures';


/**
 * Fluxo ponta a ponta de compra (RF-06 → RF-08 → RF-09 → RF-10).
 * Pré-condição criada via API (usuário novo) para que o E2E foque no fluxo de negócio e não no cadastro.
 * Verificação final via API (o pedido existe nas faturas do usuário) = teste de integração UI → back-end.
 */
test.describe('E2E · Compra completa', () => {
  test('E2E-01 cliente autenticado compra 2 produtos com pagamento na entrega @smoke @regression @e2e', async ({ page, api, catalog, registeredUser, loginPage, productPage, checkoutPage }) => {
    await test.step('login', async () => {
      await loginPage.goto();
      await loginPage.login(registeredUser.email, registeredUser.password);
      await expect(page).toHaveURL(/\/account$/);
    });

    let expectedTotal = 0;

    await test.step('adiciona 2 produtos ao carrinho', async () => {
      for (const [key, qty] of [['combinationPliers', 2], ['boltCutters', 1]] as const) {
        await productPage.goto(catalog.product(key).id);
        expectedTotal += Number(await productPage.price.innerText()) * qty;
        await productPage.setQuantity(qty);
        await productPage.addToCart();
      }
      await expect(productPage.cartBadge).toHaveText('3');
    });

    await test.step('passo 1: confere carrinho e total', async () => {
      await checkoutPage.goto();
      await expect(checkoutPage.cartItems).toHaveCount(2);
      await expect(checkoutPage.cartTotal).toHaveText(`$${expectedTotal.toFixed(2)}`);
      await checkoutPage.proceedFromCart();
    });

    await test.step('passo 2: já autenticado', async () => {
      await expect(page.getByText(`Hello ${registeredUser.first_name} ${registeredUser.last_name}, you are already logged in`)).toBeVisible();
      await checkoutPage.proceedFromSignIn();
    });

    let billing = { street: '', city: '', state: '', postal_code: '' };

    await test.step('passo 3: endereço de cobrança', async () => {
      await checkoutPage.fillAddress({ country: 'BR', postal_code: '59000-000', house_number: '100', street: 'Rua das Flores', city: 'Natal', state: 'RN' });
      await checkoutPage.waitForStableAddress();
      billing = await checkoutPage.addressValues(); // valores efetivamente enviados (ver BUG-007)
      expect(billing.city, 'cidade não pode ir vazia para o pedido').not.toBe('');
      await checkoutPage.proceedFromAddress();
    });

    let invoiceNumber = '';

    await test.step('passo 4: pagamento e confirmação', async () => {
      await checkoutPage.pay('cash-on-delivery');
      await expect(checkoutPage.paymentSuccess()).toHaveText('Payment was successful');
      await checkoutPage.confirmOrder();
      const confirmation = page.getByText(/Thanks for your order! Your invoice number is INV-\d+/);
      await expect(confirmation).toBeVisible();
      invoiceNumber = (await confirmation.innerText()).match(/INV-\d+/)![0];
      await page.screenshot({ path: test.info().outputPath('confirmacao-pedido.png') });
    });

    await test.step('integração: a fatura existe na API com o total correto', async () => {
      const res = await api.withToken(registeredUser.token).send('GET', '/invoices');
      expect(res.status()).toBe(200);
      const invoices = (await res.json()).data as Array<{ invoice_number: string; total: number; billing_city: string }>;
      const invoice = invoices.find((i) => i.invoice_number === invoiceNumber);
      expect(invoice, `fatura ${invoiceNumber} deve existir`).toBeDefined();
      expect(invoice!.total).toBeCloseTo(expectedTotal, 2);
      expect(invoice!.billing_city).toBe(billing.city); // o pedido registra exatamente o endereço do formulário
    });
  });

  test('E2E-02 visitante não autenticado é solicitado a entrar no passo 2 @regression @e2e', async ({ page, productPage, checkoutPage, catalog }) => {
    await productPage.goto(catalog.product('pliers').id);
    await productPage.addToCart();
    await checkoutPage.goto();
    await checkoutPage.proceedFromCart();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByTestId('proceed-2')).toHaveCount(0);
  });
});
