# 4. Testes Automatizados e Cobertura

> **Eixo 3 — Testes Automatizados + Cobertura (25%)**
> Código: `src/` e `tests/`. Como executar: [README](../README.md#como-executar).

## 4.1 Arquitetura da suíte

```
tests/ (o QUÊ testar)                     src/ (o COMO — reutilizável)
├── api/  ──────── usa ──────────────►   api/api-client.ts      cliente único: URL, token, timeout, registro de cobertura
├── ui/   ──────── usa ──────────────►   pages/*.ts             Page Objects (seletores data-test num só lugar)
└── e2e/  ──────── usa ──────────────►   fixtures/test-fixtures.ts
                                            ├─ catalog        (worker)  IDs atuais por nome (resiste ao re-seed)
                                            ├─ registeredUser (teste)   usuário novo via API
                                            ├─ otherUser      (teste)   2º usuário (autorização)
                                            ├─ cartId         (teste)   carrinho novo; APAGADO no teardown
                                            └─ trackUiApiCalls (auto, UI) registra as chamadas da UI à API
                                          data/factories.ts      dados únicos por execução
```

**Projetos do Playwright** (`playwright.config.ts`): `api` (sem navegador), `ui` e `e2e` (Chromium). Cada teste tem tags para seleção: `@smoke` (caminho crítico), `@regression`, `@negative`, `@boundary`, `@e2e`, `@known-defect`.

## 4.2 Técnicas aplicadas (onde ver no código)

| Técnica | Exemplo | Arquivo |
|---|---|---|
| Análise de valor-limite | quantidade 0/1/99/100; idade 18 e 75 anos ± 1 dia | `cart.api.spec.ts`, `auth.api.spec.ts` |
| Particionamento de equivalência | 5 classes inválidas de senha (uma regra violada por vez) | `auth.api.spec.ts` |
| Tabela de decisão | cartão: um campo inválido por vez, demais válidos | `payment.api.spec.ts` |
| Testes negativos | IDs inexistentes, token malformado, entradas maliciosas na busca | vários |
| Teste de contrato | campos e tipos da listagem, códigos HTTP documentados (ex.: 409) | `products.api.spec.ts`, `auth.api.spec.ts` |
| Autorização (cliente A × cliente B) | favoritos e faturas | `authorization.api.spec.ts` |
| Integração UI ↔ API | filtro da UI = resultado da API; detalhe exibido = API | `catalog.ui.spec.ts` |
| E2E com verificação no back-end | compra pela UI → fatura conferida via API (total e cidade) | `checkout.e2e.spec.ts` |
| Mocks/stubs | catálogo vazio, API 500, preço extremo, latência de 3 s | `mocks.ui.spec.ts` |
| Teste de caracterização | fixa o limite real de 93 anos (BUG-006) para detectar mudança | `auth.api.spec.ts` (API-AUTH-05c) |
| Janela de estabilidade (defeito intermitente) | campo não pode mudar sozinho em 8 s | `checkout-address.ui.spec.ts` |
| Defeito conhecido como teste | `test.fail()` + anotação `defect` | todos os `@known-defect` |

## 4.3 Isolamento, dados, setup/teardown e sincronização
- **Independência:** nenhum teste depende de outro nem da ordem. Cada um cria os próprios dados (usuário, carrinho), e por isso os testes rodam em paralelo (`fullyParallel`).
- **Setup por API, verificação pela UI:** as pré-condições são criadas via API (rápido e confiável) e a UI só é usada no que está sendo testado. Exemplo: o E2E não testa o cadastro, que tem testes próprios.
- **Teardown:** os carrinhos são apagados. As contas não podem ser apagadas pelo cliente (limitação documentada no doc 01 §1.8).
- **Sincronização sem esperas fixas:** asserções com nova tentativa automática, `waitForResponse` para eventos de rede e `expect.poll` para estabilidade. A regra de lint `playwright/no-wait-for-timeout` **proíbe** `waitForTimeout` nos testes.
- **Tratamento de falhas:** trace, vídeo e print guardados em toda falha; 1 nova tentativa por teste, **contabilizada** como flaky.

## 4.4 Por que não há cobertura de código — e o que medimos no lugar
Cobertura de código (linhas e ramos executados) exige instrumentar o **servidor** do SUT, que não é nosso. Medi-la sobre o código **dos testes** não diz nada sobre a qualidade do sistema. Por isso usamos três medidas honestas:
1. **Cobertura da superfície da API**: operações do contrato OpenAPI exercitadas pela suíte (`scripts/endpoint-coverage.mjs`, que cruza as chamadas registradas durante os testes com o contrato baixado na hora).
2. **Cobertura de requisitos e riscos**: matriz do doc 10 §10.2.
3. **Cobertura de técnicas**: tabela 4.2.

> O caminho para ter cobertura de código real seria subir o SUT localmente com o `docker-compose.coverage.yml` do repositório oficial (trabalho futuro, doc 08).

## 4.5 Resultados de execução

**Execução oficial final:** 20/11/2026, início 23:08:40 UTC, Windows 11, Node 24.22, Playwright 1.65.1, 2 workers, 1 nova tentativa por teste.
Fonte: `evidencias/execucao-oficial-3/` (`results.json`, `junit.xml`, `summary.md`, `endpoint-coverage.md`, `console.log`, `relatorio-html/`). Código de saída do Playwright: **0**.

| Projeto | Testes | Passou | Falha inesperada | Flaky | Defeito conhecido (falha esperada) | Tempo somado (s) |
|---|---:|---:|---:|---:|---:|---:|
| api | 77 | 67 | 0 | 2 | 8 | 539,6 |
| ui | 25 | 24 | 0 | 0 | 1 | 203,0 |
| e2e | 2 | 2 | 0 | 0 | 0 | 51,8 |
| **Total** | **104** | **93** | **0** | **2** | **9** | 450,3 s de relógio (≈ 7,5 min) |

- **Resultado conforme o esperado: 100%** (passou + defeitos conhecidos confirmados + flaky que passou na nova tentativa).
- **Taxa de flaky: 1,9%** (2/104). As duas falhas da 1ª tentativa foram timeout de 45 s em requisição ao SUT (API-CART-01 e API-CAT-02), ou seja, ambiente. Meta do plano: ≤ 5% OK.
- **Os 9 testes `@known-defect` falharam como esperado**: os 9 defeitos (BUG-001..009) continuam presentes no SUT nesta data.

**Cobertura de operações da API (contrato OpenAPI × chamadas registradas):**

| Medida | Valor |
|---|---|
| Operações no contrato | 88 (48 em escopo, 40 fora de escopo: administração, relatórios, TOTP, imagens, stream) |
| Chamadas registradas na execução | 434, todas reconhecidas no contrato |
| **Operações em escopo cobertas** | **38/48 = 79,2%** (36 só pelos testes de API; o restante pela UI) · gate ≥ 60% OK |
| Contrato inteiro | 43,2% |

Operações em escopo **sem** teste, por decisão: variantes `QUERY` de busca (`/brands/search`, `/categories/tree`, `/categories/search`, `/invoices/search`), que fazem a mesma consulta já coberta pelas versões `GET` ou pela UI; `POST /messages/{id}/attach-file` (exigiria criar mensagens no ambiente compartilhado); `POST /invoices/guest` (compra como convidado, candidato a próximo teste); download/status de PDF de fatura; `GET /products/{id}/specs/{specId}`; `POST /users/forgot-password` (dispara e-mail).

**Evolução da cobertura (o que a métrica mudou no projeto):** na execução oficial 2 a cobertura em escopo era **47,9%**, abaixo da meta. Em vez de baixar a meta, usamos a lista de lacunas para orientar a sessão exploratória SE-05 e os novos testes de autorização, conta, catálogo auxiliar, contato e CEP. Assim a cobertura subiu para 79,2% e surgiram **BUG-008** e **BUG-009**.

**Histórico das execuções completas** (`evidencias/execucoes-anteriores/`):

| Execução | Testes | Falhas inesperadas | Flaky | Defeitos conhecidos | Principal aprendizado |
|---|---:|---:|---:|---:|---|
| 1ª completa (~22:22Z) | 85 | 2 | 1 | 6 | E2E-01 revelou o BUG-007; UI-AUTH-03 = ambiente |
| Oficial 1 (~22:40Z) | 87 | 1 | 3 | 7 | o endereço muda **depois** da leitura → espera de estabilidade |
| Oficial 2 (~22:52Z) | 87 | 0 | 1 | 7 | cobertura de 47,9% < meta → SE-05 |
| **Oficial 3 (~23:08Z)** | **104** | **0** | **2** | **9** | — |

## 4.6 Estabilidade: o que aprendemos com um ambiente público
- **Latência medida** (`npm run latency`, 10 amostras por endpoint): mediana ≈ 0,9 s, p90 de até ≈ 10 s, máximo ≈ 31 s, com erros ocasionais (`evidencias/metricas/`). Os timeouts foram calibrados a partir disso.
- **Re-seed:** os IDs mudam, por isso a fixture `catalog` (S-01).
- **Classificação de cada instabilidade observada:**

| Sintoma | Causa | Classificação | Ação |
|---|---|---|---|
| Timeout de 45 s em `POST /users/register` e `/users/login` | ambiente (lentidão do SUT) | problema de ambiente (OBS-11) | 1 nova tentativa contabilizada |
| Produto não renderiza em 20 s | pico de latência em `GET /products/{id}` | problema de ambiente | `goto()` espera a resposta da API por até 45 s (S-06) |
| UI-CHK-02 passou na 1ª tentativa | defeito intermitente + asserção ingênua | **erro do teste** | janela de estabilidade (S-04) |
| UI-CHK-01 "flaky" | pré-preenchimento assíncrono reescrevia os campos limpos | **erro do teste** (desenho) | espera de estabilidade antes de agir |
| E2E-01: fatura com cidade diferente da digitada | BUG-007 | **defeito do SUT** | teste confere o valor final; defeito com teste próprio |
| No GitHub Actions, produto, checkout e conta param em "Verify you are human" | desafio anti-robô do Cloudflare para IPs de datacenter (OBS-12) | problema de ambiente | observador de `cf-mitigated: challenge` + testes pulados com motivo (doc 07 §7.6) |
