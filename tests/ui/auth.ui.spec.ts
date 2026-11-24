import { uiTest as test, expect } from '../../src/fixtures/test-fixtures';

/** Login e cadastro pela interface. RF-07, RF-08. */
test.describe('UI · Autenticação', () => {
  test('UI-AUTH-01 login válido leva à área do cliente e mostra o nome @smoke @regression', async ({ page, loginPage, registeredUser }) => {
    await loginPage.goto();
    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
    await expect(page.getByTestId('nav-menu')).toContainText(`${registeredUser.first_name} ${registeredUser.last_name}`);
  });

  test('UI-AUTH-02 senha incorreta exibe mensagem genérica (não revela se o e-mail existe) @negative @regression', async ({ loginPage, registeredUser }) => {
    await loginPage.goto();
    await loginPage.login(registeredUser.email, 'Wrong#Pass123');
    await expect(loginPage.error).toHaveText('Invalid email or password');
  });

  test('UI-AUTH-03 e-mail inexistente exibe a MESMA mensagem (evita enumeração de usuários) @negative @regression', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(`nao.existe.${Date.now()}@example.com`, 'Wrong#Pass123');
    await expect(loginPage.error).toHaveText('Invalid email or password');
  });

  test('UI-AUTH-04 cadastro vazio exibe as mensagens de campo obrigatório @negative @regression', async ({ registerPage, page }) => {
    await registerPage.goto();
    await registerPage.submit.click();
    const form = page.getByTestId('register-form');
    for (const msg of ['First name is required', 'Last name is required', 'Email is required', 'Password is required']) {
      await expect(form).toContainText(msg);
    }
  });

  test('UI-AUTH-05 cadastro com e-mail inválido é bloqueado no front-end @negative @regression', async ({ registerPage, page }) => {
    await registerPage.goto();
    await registerPage.field('email').fill('nao-e-email');
    await registerPage.submit.click();
    await expect(page.getByTestId('register-form')).toContainText('Email format is invalid');
  });
});
