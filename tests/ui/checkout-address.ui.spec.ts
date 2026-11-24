import { protectedUiTest as test, expect } from '../../src/fixtures/test-fixtures';

/**
 * Passo 3 do checkout (endereço de cobrança). RF-10.
 * Pré-condição montada por API + UI: usuário novo, login, 1 item no carrinho, avança até o passo 3.
 */
test.describe('UI · Checkout — endereço de cobrança', () => {
  test.beforeEach(async ({ page, catalog, registeredUser, loginPage, productPage, checkoutPage }) => {
    await loginPage.goto();
    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(page).toHaveURL(/\/account$/);
    await productPage.goto(catalog.product('pliers').id);
    await productPage.addToCart();
    await checkoutPage.goto();
    await checkoutPage.proceedFromCart();
    await checkoutPage.proceedFromSignIn();
    await expect(page.getByTestId('postal_code')).toBeVisible();
  });

  test('UI-CHK-01 endereço incompleto não permite avançar para o pagamento @negative @regression', async ({ page, checkoutPage }) => {
    // 1ª versão: limpava rua/cidade e verificava o botão logo em seguida → "flaky", porque o pré-carregamento
    // assíncrono do endereço/busca de CEP (BUG-007) às vezes preenchia os campos DEPOIS da limpeza.
    // Agora: espera o formulário estabilizar, limpa CEP + rua + cidade (sem CEP não há busca) e confere os campos vazios.
    await checkoutPage.waitForStableAddress();
    for (const field of ['postal_code', 'street', 'city']) await page.getByTestId(field).fill('');
    await checkoutPage.waitForStableAddress();
    await expect(page.getByTestId('city')).toHaveValue('');
    await expect(page.getByTestId('proceed-3')).toBeDisabled();
  });

  test('UI-CHK-02 endereço digitado pelo usuário não pode ser sobrescrito pela busca de CEP @known-defect', async ({ page }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-007 — busca automática de CEP sobrescreve/apaga endereço já digitado' });
    test.fail(true, 'BUG-007 aberto: após a resposta de /postcode-lookup, rua/cidade/estado digitados são substituídos ou apagados.');
    const lookup = page.waitForResponse((r) => r.url().includes('/postcode-lookup'), { timeout: 20_000 });
    await page.getByTestId('country').selectOption('BR');
    await page.getByTestId('postal_code').fill('59000-000');
    await page.getByTestId('house_number').fill('100');
    // usuário digita o restante imediatamente, antes de a busca responder
    await page.getByTestId('street').fill('Rua das Flores');
    await page.getByTestId('city').fill('Natal');
    await page.getByTestId('state').fill('RN');
    await lookup;
    // Janela de estabilidade: o defeito é uma condição de corrida (intermitente). Um toHaveValue simples passaria
    // se lesse o valor ANTES da sobrescrita (aconteceu na 1ª versão deste teste → resultado "flaky").
    // Aqui esperamos até 8 s por QUALQUER alteração não solicitada da cidade; o requisito é que ela não ocorra.
    const changedWithoutUserAction = await page
      .waitForFunction(() => (document.querySelector('[data-test="city"]') as HTMLInputElement | null)?.value !== 'Natal', undefined, { timeout: 8_000 })
      .then(() => true, () => false);
    expect(changedWithoutUserAction, `cidade digitada foi alterada para "${await page.getByTestId('city').inputValue()}" sem ação do usuário`).toBe(false);
  });
});
