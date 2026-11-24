import { Page, test } from '@playwright/test';

export const BOT_WALL_REASON =
  'AMBIENTE: o Cloudflare do SUT exibiu verificação anti-robô ("Verify you are human") para esta máquina — ' +
  'acontece nos servidores do GitHub Actions (IP de datacenter), não na rede local. Teste não executado até o fim; ' +
  'evidência local em docs/04 e docs/07.';

const challenged = new WeakSet<Page>();

/**
 * Observa as respostas da página e marca quando o Cloudflare responde com desafio (cabeçalho `cf-mitigated: challenge`).
 *
 * Histórico (doc 07 §7.6): a 1ª versão sondava /checkout uma única vez no início do worker. No CI isso deu falso negativo:
 * o trace mostrou /checkout 200 → produto 200 → /checkout 403 `cf-mitigated: challenge`. O desafio depende do
 * comportamento da sessão, então a detecção precisa acontecer no momento em que ele aparece.
 */
export function watchBotWall(page: Page): void {
  page.on('response', (r) => {
    if (r.request().resourceType() === 'document' && r.headers()['cf-mitigated'] === 'challenge') challenged.add(page);
  });
}

export function isBotWalled(page: Page): boolean {
  return challenged.has(page) || process.env.FORCE_BOT_WALL === '1'; // FORCE_BOT_WALL=1 simula o bloqueio (validação local)
}

/**
 * Chamado logo após cada navegação nos page objects. Se a página caiu no desafio, o teste é PULADO com o motivo.
 * Não tentamos contornar o desafio: é um controle de segurança de terceiros.
 */
export async function skipIfBotWall(page: Page): Promise<void> {
  if (!isBotWalled(page)) {
    const challengeOnScreen = await page.getByText('Performing security verification').count().catch(() => 0);
    if (challengeOnScreen > 0) challenged.add(page);
  }
  test.skip(isBotWalled(page), BOT_WALL_REASON);
}
