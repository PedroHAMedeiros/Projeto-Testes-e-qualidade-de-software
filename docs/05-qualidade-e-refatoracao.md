# 5. Qualidade de Software, Métricas e Refatoração

> **Eixo 4 — Qualidade de Software e Refatoração (15%)**
> Duas análises **separadas**, como pede o plano:
> - **5.1 Código do SUT** — leitura do código-fonte público (Laravel/PHP), **somente** nos trechos ligados aos defeitos que encontramos por teste. Não alteramos nem executamos esse código; as refatorações são **propostas**.
> - **5.2 Código da nossa suíte** — análise com ferramentas, smells reais que **nós** introduzimos e refatorações **implementadas e validadas**.

## 5.1 Revisão do código do SUT (trechos ligados a defeitos)

Fonte: `github.com/testsmith-io/practice-software-testing`, commit `ae7caec` (11/10/2026), pasta `sprint5/API/app`. A data do commit coincide com a do build em produção ("Built 2026-10-11").

| # | Arquivo / trecho | Code smell | Defeito causado | Refatoração proposta |
|---|---|---|---|---|
| SUT-1 | `Http/Controllers/PaymentController.php`, `check()`, linhas 35–70 | **Cadeia de condicionais sobre um "tipo"** (*Switch Statements*, Fowler) **sem caso padrão** → comportamento *fail-open* | BUG-005 | (a) Validar `payment_method` com `Rule::in([...])` antes de tudo; (b) **Substituir condicional por polimorfismo/Strategy**: um validador por método num mapa; método desconhecido → 422. O projeto já tem uma pasta `Payments/` (`GiftCard.php`), o que indica o caminho natural. |
| SUT-2 | `Http/Requests/Customer/StoreCustomer.php`, linhas 44–46 | **Objeto mutável compartilhado** (efeito colateral escondido): `$dt->subYears(18)` altera `$dt` | BUG-006 | Usar `CarbonImmutable` (ou `now()->subYears(...)` separado para cada limite). Correção de 1 linha, mas exige teste de fronteira. |
| SUT-3 | `StoreCustomer.php`, linha 67 | **Validação incompleta / regra duplicada entre camadas** (a UI tem a regra, a API não) | BUG-004 | Acrescentar `'email:rfc'` à lista de regras; idealmente gerar as mensagens da UI a partir da mesma fonte. |
| SUT-4 | `Services/CartService.php` (`increment('quantity', $quantity)`) + `CartController.php` linha 111 (`max:99`) | **Regra de negócio espalhada** (*Shotgun Surgery*): o limite está no controller; a soma no serviço; o estoque em lugar nenhum | BUG-002, BUG-003 | Centralizar a regra num método de domínio (`Cart::addItem($product, $qty)`) que valide **quantidade resultante** e **estoque**; controllers só traduzem HTTP. |
| SUT-6 | `Services/FavoriteService.php`: `getFavoriteById()` × `getAllFavorites()`/`deleteFavorite()` | **Inconsistência dentro da mesma classe** (dois métodos filtram por `user_id`, um não) — falta de uma política de autorização central | BUG-008 | Usar uma *Policy* do Laravel (o projeto já tem a pasta `Policies/`) ou um *scope* `ownedBy(Auth::id())` aplicado em todas as consultas por ID. |
| SUT-5 | `Services/ProductService.php`, `getAllProducts()` (`$query->filter()`) | **Entrada do cliente repassada sem lista de permissão** (hipótese — não lemos o pacote de filtro) | BUG-001 | Validar `sort` contra a lista documentada (`name`, `price`, `co2_rating` × `asc/desc`) → 422. |

**Métrica de tamanho** (contagem de linhas com `wc -l`, só para contexto): os maiores arquivos da API são `UserController.php` (658 linhas), `InvoiceController.php` (490), `ReportController.php` (434) e `ProductController.php` (421). Arquivos de controller acima de ~400 linhas são candidatos a *God Class* — **não analisamos esses arquivos a fundo** e não afirmamos que tenham problemas.

## 5.2 Qualidade do código da suíte (nosso código)

### 5.2.1 Ferramentas e métricas

| Métrica | Ferramenta | Antes | Depois | Gate no CI |
|---|---|---|---|---|
| Erros de tipo | `tsc --noEmit` (TypeScript 5.9, `strict`) | 0 | 0 | 0 erros |
| Problemas de lint | ESLint 10 + typescript-eslint + eslint-plugin-playwright | 10 avisos, 0 erros | **4 avisos, 0 erros** (5 após os testes novos de autorização) | 0 erros, ≤ 10 avisos |
| Duplicação | jscpd (blocos ≥ 40 tokens) | 0,00% | 0,00% | ≤ 5% |
| Esperas fixas (`waitForTimeout`) nos testes | regra `playwright/no-wait-for-timeout` | 0 | 0 | proibido (erro) |
| Complexidade ciclomática por função | regra ESLint `complexity` (máx. 8) | 0 violações | 0 violações | aviso |

Evidências: `evidencias/fase5-qualidade/eslint-antes.txt`, `eslint-depois.txt`, `jscpd-antes/jscpd-report.json`.

Os avisos restantes (4, depois 5) são todos `max-lines-per-function` nos blocos `test.describe` (callbacks que agrupam muitos testes). **Ponto em aberto:** aceitar (um describe é um agrupador, não lógica) ou dividir os arquivos de spec.

### 5.2.2 Code smells encontrados na NOSSA suíte (reais, durante o projeto)

| ID | Smell | Como apareceu | Refatoração aplicada | Validação |
|---|---|---|---|---|
| **S-01** | **Dados de teste fixos e frágeis** (*hard-coded test data*): IDs (ULID) dos produtos escritos no código | O ambiente foi re-semeado; os IDs mudaram e **10 testes quebraram de uma vez** (`evidencias/fase4-automacao/reseed-ids-mudaram.log`) | Os testes guardam só **nomes** estáveis (`src/data/test-data.ts`); a fixture `catalog` (escopo *worker*) resolve os IDs atuais 1× por processo (`src/data/catalog.ts`) | Execução completa posterior sem falhas por ID |
| **S-02** | **Suposição não verificada sobre o protocolo** + **teste falso-positivo** | Mocks e esperas usavam `/products?` + `GET`; a UI usa o método HTTP `QUERY` sem query string. O mock nunca era aplicado, e o UI-MOCK-01 **passava sem testar nada** (o `toHaveCount(0)` era verdadeiro antes da página carregar) | Casamento por **caminho** (`url.pathname === '/products'`); todo teste com mock agora **prova que o stub foi usado** (contador `served` + `expect.poll`) | UI-MOCK-01..04 passam e falhariam se o stub não fosse servido |
| **S-03** | **Lógica condicional dentro do teste** (`if (!ok) expect(...)`) — apontado pelo lint | Teste de valores-limite do carrinho decidia em tempo de execução quais asserções rodar | Separado em dois conjuntos (válidos / inválidos), cada teste com um único caminho e asserções sempre executadas (`tests/api/cart.api.spec.ts`) | Lint: aviso eliminado; mesmos 7 casos cobertos |
| **S-04** | **Asserção sensível ao tempo em defeito intermitente** | 1ª versão do UI-CHK-02 (BUG-007) usou `toHaveValue`, que lia o valor *antes* da sobrescrita → resultado "flaky" | **Janela de estabilidade**: `waitForFunction` espera até 8 s por qualquer alteração não solicitada | 2 repetições consecutivas: defeito detectado nas duas, sem flaky |
| **S-05** | **Timeouts arbitrários** | Valores padrão (10–15 s) geravam falhas de ambiente | Timeouts calibrados por **medição** (`scripts/measure-latency.mjs`: p90 ≈ 10 s, máx. ≈ 31 s) e documentados no `playwright.config.ts` | Taxa de flaky medida e reportada (doc 04) |
| **S-07** | **Estado mutável compartilhado** no cliente de API: `withToken()` alterava o próprio objeto | Percebido ao escrever testes com dois usuários (autorização): o token de A "vazaria" para as chamadas seguintes | `withToken()` devolve um **novo** cliente (`src/api/api-client.ts`); o original nunca muda. Mesmo tipo de smell do SUT-2 (Carbon mutável), só que no nosso código | API-AUTHZ-* usam A e B no mesmo teste e passam |
| **S-06** | **Diagnóstico pobre** em falhas de UI | UI-AUTH-03 falhou sem mensagem e passou isolado — não dava para saber se a API demorou ou se a UI falhou | `LoginPage.login()` e `CheckoutPage.confirmOrder()` agora esperam a **resposta da API** correspondente; uma falha diz qual camada travou | — |

### 5.2.3 Boas práticas presentes 
- **Page Object Model** (`src/pages/`): seletores num só lugar.
- **Fixtures com setup/teardown** (`src/fixtures/test-fixtures.ts`): usuário e carrinho novos por teste → testes **independentes** e **paralelizáveis**; carrinho apagado no fim.
- **Fábricas de dados** (`src/data/factories.ts`): dados únicos por execução.
- **Cliente de API único** (`src/api/api-client.ts`): cabeçalhos, token e timeout centralizados.
- **Seletores estáveis** `data-test` (configurados como `testIdAttribute`), sem CSS frágil — com uma exceção em UI-CART-04 (`.btn-danger`), registrada como dívida técnica.

## 5.3 Análise de impacto de mudança — correção do BUG-007 (busca de CEP)

**Mudança proposta, em duas partes:**
(a) **back-end:** normalizar o CEP antes da consulta (remover hífen/espaços), o que corrige o BUG-009;
(b) **front-end:** a busca de CEP só preenche campos **vazios**. Se o cliente já digitou ou se veio do perfil, mostra "Encontramos este endereço — usar?" em vez de sobrescrever. Além disso, uma busca nova **cancela** a anterior (só a resposta mais recente vale).

| Dimensão | Análise |
|---|---|
| **Componentes alterados** | (a) `PostcodeService` / `GET /postcode-lookup` (API); (b) componente Angular do passo 3 do checkout; possivelmente o mesmo componente/serviço no **cadastro** (`/auth/register` também tem `postcode-lookup-hint`) e no **perfil**. |
| **Áreas impactadas** | Checkout (passos 3 → 4), cadastro, edição de perfil, **criação da fatura**: a regra `AddressMatchesCountry` usa o mesmo `PostcodeService`, então mudar a normalização muda o que a API aceita. Faturas antigas não mudam. |
| **Riscos de regressão** | (1) Clientes com CEP salvo sem hífen passarem a receber outro endereço sugerido; (2) a fatura ser **rejeitada** (422) se o front-end mantiver o endereço digitado e ele não bater com a regra do back-end. Esse é o maior risco, porque as duas camadas precisam mudar juntas; (3) a busca deixar de preencher campos vazios; (4) o botão *Proceed* habilitar/desabilitar errado com a nova mensagem; (5) cadastro e perfil herdarem a mudança sem teste. |
| **Testes necessários** | API-CEP-02 e UI-CHK-02 devem **passar** (remover `test.fail()`); **novos:** "campos vazios → preenchidos", "aceitar sugestão", "manter digitado → fatura aceita ou erro claro"; E2E-01 volta a conferir a cidade **digitada** (hoje confere o valor final por causa do bug); repetir para cadastro e perfil; API-AUTHZ-05/07 (criação de fatura) e toda a regressão `@regression`. |
| **Critérios de qualidade (aceite)** | 0 sobrescritas em 20 repetições do UI-CHK-02 (`--repeat-each=20`); mesmo CEP em qualquer formato → mesmo endereço; nenhuma fatura rejeitada por divergência quando o cliente aceita a sugestão; nenhum teste `@regression` novo falhando; a fatura grava exatamente o endereço visível na tela no momento do *Confirm*. |

## 5.4 Proposta de evolução/correção — validação de pagamento por estratégia (corrige BUG-005)

**Problema:** `PaymentController::check` aprova qualquer método desconhecido (fail-open).

**Proposta técnica:**
1. Contrato: `payment_method` obrigatório e restrito ao enum já documentado no OpenAPI → `422` com `{"errors":{"payment_method":[...]}}` para valores fora da lista.
2. Implementação: um mapa `método → validador` (padrão Strategy). Cada validador declara suas regras (`BankTransferValidator`, `CreditCardValidator`, …). Método sem validador = erro, nunca sucesso (*fail-closed*).
3. O endpoint passa a responder com o mesmo formato de erro dos outros (422 + `errors`).

**Critérios de qualidade:**
| Critério | Meta |
|---|---|
| Métodos fora do enum (incl. ausente, vazio, maiúsculas `CREDIT-CARD`) | 100% rejeitados com 422 |
| Métodos válidos com dados válidos | 100% aprovados (sem regressão) |
| Cada regra de cada método | coberta por ≥ 1 caso de tabela de decisão |
| Contrato OpenAPI × implementação | 0 divergências no teste de contrato |

**Validação / estratégia de testes:**
- Os testes **já existem**: API-PAY-04 vira verde (remover `test.fail()`); API-PAY-01..03 garantem a não-regressão.
- Acrescentar casos para `payment_method` ausente, `""`, `null` e com caixa diferente (particionamento).
- Rodar E2E-01 com os 5 métodos pela UI (parametrizar o teste).
- Gate no CI: a correção só entra com o pipeline verde.

