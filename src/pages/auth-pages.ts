import { Locator, Page } from '@playwright/test';
import { skipIfBotWall } from './bot-wall';

/** Page Object do login (também reutilizado no passo 2 do checkout, que tem os mesmos campos). */
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/auth/login');
    await skipIfBotWall(this.page);
  }

  /**
   * Preenche e envia o login e ESPERA a resposta de POST /users/login.
   * Motivo: numa execução, UI-AUTH-03 falhou sem mensagem na tela; isolado, passou (evidencias/fase3-exploratorios/login-email-inexistente.log).
   * Esperando a resposta, uma lentidão do ambiente aparece como "a API não respondeu" e não como "a UI não mostrou o erro".
   */
  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    const response = this.page.waitForResponse((r) => r.url().endsWith('/users/login') && r.request().method() === 'POST', { timeout: 45_000 });
    await this.submit.click();
    const res = await response;
    // Login bem-sucedido redireciona para /account — rota em que o CI pode receber o desafio do Cloudflare.
    if (res.ok()) {
      await this.page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 20_000 }).catch(() => undefined);
      await this.page.waitForLoadState('domcontentloaded');
      await skipIfBotWall(this.page);
    }
    return res;
  }
}

/** Page Object do cadastro de cliente. */
export class RegisterPage {
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.submit = page.getByTestId('register-submit');
  }

  async goto() {
    await this.page.goto('/auth/register');
    await skipIfBotWall(this.page);
  }

  field(name: string): Locator {
    return this.page.getByTestId(name);
  }

  /** Mensagens de validação exibidas (texto de todos os elementos de erro do formulário). */
  errors(): Locator {
    return this.page.locator('[data-test="register-form"] [data-test$="-error"], [data-test="register-form"] .invalid-feedback, [data-test="register-error"]');
  }
}
