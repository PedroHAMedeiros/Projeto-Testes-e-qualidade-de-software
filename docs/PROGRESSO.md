# Registro de Progresso

Horários em UTC, todos em 20/11/2026. Cada etapa traz: atividades, arquivos, ferramentas, testes, resultados, evidências, problemas, decisões, pendências e próximos passos.

---

## Etapa 1 — Leitura das instruções e verificação do ambiente (~21:30)
- **Atividades:** leitura integral do PDF da professora (10 páginas); verificação das ferramentas locais e do acesso ao SUT.
- **Ferramentas:** Node 24.22.0, npm 12.0.2, Git 2.45, GitHub CLI 2.102 (autenticado), Python 3.15.
- **Resultados:** UI e API do SUT responderam HTTP 200.
- **Decisões:** trabalhar com o SUT público (não há homologação); usar Playwright para API e UI.

## Etapa 2 — Fase 1: reconhecimento (~21:33–22:00)
- **Atividades:** download do contrato OpenAPI (3.2, "Toolshop API 5.0.0", ~90 operações); mapeamento de seletores `data-test` de 8 páginas; prints; sondagem da API com 45 requisições; exploração de carrinho, checkout, login e busca; leitura do código-fonte público (somente leitura) para causa raiz.
- **Arquivos:** `scripts/explore.mjs`, `explore-cart.mjs`, `explore-ui-checks.mjs`, `explore-flows.mjs`, `probe-api.mjs`.
- **Resultados:** candidatos a defeito BUG-001, 002, 003, 004, 005; observações OBS-01..03.
- **Evidências:** `evidencias/fase1-exploracao/`, `evidencias/fase1-api/`.
- **Problemas:** timeout de rede numa requisição (ambiente), resolvido com novas tentativas no script; o script de exploração falhou uma vez por clicar antes de a página carregar.

## Etapa 3 — Estrutura do projeto e testes de API (~21:45–21:55)
- **Arquivos:** `playwright.config.ts`, `tsconfig.json`, `src/**`, `tests/api/*.spec.ts`.
- **Testes:** 1ª execução de API: 53 passaram, 6 falharam.
- **Análise das 6 falhas:** 1 **erro nosso** (API-AUTH-02 esperava 422; contrato diz 409 → teste corrigido); 1 **defeito novo** (idade 75 anos e 1 dia aceita → BUG-006, causa localizada: Carbon mutável); 4 não se repetiram ao reexecutar (instabilidade de ambiente).
- **Decisão:** defeitos conhecidos viram testes com `test.fail()` + anotação `defect`.

## Etapa 4 — Testes de UI, E2E e mocks (~21:59–22:15)
- **Problemas e causas (em ordem):**
  1. Quase todos os testes de UI falharam: (a) a UI usa o método HTTP **QUERY**, e nossas esperas de rede e mocks procuravam `GET /products?` → corrigido; (b) o UI-MOCK-01 passava como **falso positivo** → corrigido, e agora o teste prova que o mock foi usado.
  2. Após as correções, 10 falhas: o ambiente foi **re-semeado** e os IDs mudaram → refatoração S-01 (fixture `catalog`).
  3. Timeouts → medição de latência (`scripts/measure-latency.mjs`): mediana ≈ 0,9 s, p90 ≈ 10 s, máximo ≈ 31 s → timeouts calibrados, 2 workers, 1 nova tentativa contabilizada.
- **Evidências:** `evidencias/fase4-automacao/reseed-ids-mudaram.log`, `evidencias/metricas/latencia-*.json`.

## Etapa 5 — Ferramentas de qualidade (~22:18–22:21)
- **Decisão:** fixar TypeScript **5.9** (o TypeScript 7 instalado por padrão não é suportado pelo typescript-eslint).
- **Resultados:** tsc 0 erros; ESLint 0 erros e 10 avisos (linha de base); jscpd 0% de duplicação.
- **Evidências:** `evidencias/fase5-qualidade/eslint-antes.txt`, `jscpd-antes/`.

## Etapa 6 — 1ª execução completa e investigação (~22:22–22:37)
- **Resultado:** 85 testes: 76 passaram, 6 falhas esperadas (defeitos conhecidos), 1 flaky, 2 falhas.
- **Falha 1 — E2E-01:** a fatura saiu com cidade "Carmona d'Oeste" em vez de "Natal" → sessão exploratória SE-04 → **BUG-007** (busca de CEP sobrescreve ou apaga o endereço; 3/3 reproduções).
- **Falha 2 — UI-AUTH-03:** sem mensagem de erro; isolado, funcionou 2/2 → classificada como **problema de ambiente**; `login()` passou a esperar a resposta da API para diagnosticar melhor.
- **Refatorações:** E2E confere a fatura contra o endereço **final** do formulário; `confirmOrder()` espera o `POST /invoices`; UI-CHK-02 com janela de estabilidade (a 1ª versão deu flaky).
- **Validação:** checkout e E2E com `--repeat-each=2`: 8/8 conforme o esperado, 0 flaky.
- **Lint depois das refatorações:** 4 avisos (antes 10). Evidência: `eslint-depois.txt`.

## Etapa 7 — Execução oficial de regressão, métricas, CI e documentação (~22:38–)
- Execução oficial 2: 87 testes, 0 falhas inesperadas, mas cobertura de endpoints em escopo de 47,9% (meta: 60%).
- Sessão SE-05 (autorização) → BUG-008 (favoritos sem verificação de dono), BUG-009 (CEP com/sem hífen), OBS-09..11; BUG-007 reescrito com a causa (pré-preenchimento do perfil + validação AddressMatchesCountry).
- Refatoração S-07 (`withToken` imutável); 17 testes novos (autorização, conta, catálogo auxiliar, contato, CEP).
- Execução oficial 3 (final): 104 testes, 0 falhas inesperadas, 9 defeitos conhecidos, 2 flaky (1,9%), cobertura em escopo de 79,2% (gate OK). Evidências: `evidencias/execucao-oficial-3/`.
- Reprodutibilidade: clone limpo + `npm ci` + typecheck + lint OK (`evidencias/cicd/reprodutibilidade-clone-limpo.md`).
- Gerador do PDF (`npm run pdf`) e rascunho em `entrega/relatorio-final.pdf`.

## Etapa 8 — 1ª execução no GitHub Actions (22–23/11)
- **Resultado:** estágios 1 (análise estática) e 2 (API) OK; estágios 3 (UI/E2E) e 4 (gates) FALHOU.
- **Causa:** desafio anti-robô do Cloudflare nas rotas de produto, checkout e conta para os servidores do GitHub (prints no artefato da execução). Localmente não ocorre.
- **Decisão:** não contornar o desafio; detectar e pular os testes afetados com o motivo explícito. A 1ª versão (sonda única por worker) deu falso negativo no CI em 23/11; substituída por um observador de respostas `cf-mitigated: challenge` verificado a cada navegação (doc 07 §7.6). Validado localmente nos dois caminhos (normal e `FORCE_BOT_WALL=1`).
- **Outros:** o projeto estava na subpasta `pst-qa/` (links 404 e workflow fora da raiz); movido para a raiz.


