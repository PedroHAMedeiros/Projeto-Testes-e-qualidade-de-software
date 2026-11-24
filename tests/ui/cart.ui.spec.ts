import { protectedUiTest as test, expect } from '../../src/fixtures/test-fixtures';
import { PRODUCT_NAMES } from '../../src/data/test-data';
import { skipIfBotWall } from '../../src/pages/bot-wall';

/** Carrinho pela interface. RF-06 e RN-01. */
test.describe('UI · Carrinho', () => {
  test('UI-CART-01 adicionar produto atualiza o contador e aparece no carrinho @smoke @regression', async ({ productPage, checkoutPage, catalog }) => {
    await productPage.goto(catalog.product('combinationPliers').id);
    await productPage.addToCart();
    await expect(productPage.cartBadge).toHaveText('1');
    await checkoutPage.goto();
    await expect(checkoutPage.cartItems).toHaveCount(1);
    await expect(checkoutPage.cartItems.first()).toContainText(PRODUCT_NAMES.combinationPliers);
  });

  test('UI-CART-02 total da linha e do carrinho = preço unitário × quantidade @regression', async ({ productPage, checkoutPage, catalog }) => {
    await productPage.goto(catalog.product('combinationPliers').id);
    const unit = Number(await productPage.price.innerText());
    await productPage.setQuantity(3);
    await productPage.addToCart();
    await checkoutPage.goto();
    const expected = `$${(unit * 3).toFixed(2)}`;
    await expect(checkoutPage.linePrices().first()).toHaveText(expected);
    await expect(checkoutPage.cartTotal).toHaveText(expected);
  });

  test('UI-CART-03 alterar a quantidade no carrinho recalcula o total @regression', async ({ page, productPage, checkoutPage, catalog }) => {
    await productPage.goto(catalog.product('combinationPliers').id);
    const unit = Number(await productPage.price.innerText());
    await productPage.addToCart();
    await checkoutPage.goto();
    const updated = page.waitForResponse((r) => r.url().includes('/product/quantity') && r.request().method() === 'PUT');
    await checkoutPage.quantityInputs().first().fill('4');
    await checkoutPage.quantityInputs().first().press('Tab');
    await updated;
    await expect(checkoutPage.cartTotal).toHaveText(`$${(unit * 4).toFixed(2)}`);
  });

  test('UI-CART-04 remover o único item deixa o carrinho vazio @regression', async ({ page, productPage, checkoutPage, catalog }) => {
    await productPage.goto(catalog.product('pliers').id);
    await productPage.addToCart();
    await checkoutPage.goto();
    await expect(checkoutPage.cartItems).toHaveCount(1);
    await page.locator('a.btn-danger, [data-test="cart-remove"], .btn-danger').first().click();
    await expect(checkoutPage.cartItems).toHaveCount(0);
  });

  test('UI-CART-05 carrinho persiste após recarregar a página @regression', async ({ page, productPage, catalog }) => {
    await productPage.goto(catalog.product('pliers').id);
    await productPage.addToCart();
    await page.reload();
    await skipIfBotWall(page); // o reload é uma navegação completa: pode cair no desafio do Cloudflare no CI
    await expect(productPage.cartBadge).toHaveText('1');
  });
});
