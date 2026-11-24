# 3. Sessões de Teste Exploratório

> **Eixo 2 — parte 2 de 2.** Formato *Session-Based Test Management*: cada sessão tem **charter** (missão), tempo limitado, anotações e descobertas.
>
> **Como foram conduzidas:** as sessões SE-01 a SE-05 foram realizadas em 20/11/2026 com o apoio de scripts Playwright, que executavam as ações e registravam as respostas — os scripts estão em `scripts/` e os registros brutos em `evidencias/`. As hipóteses e observações abaixo são as anotações reais daquela exploração.

---

## SE-01 — Validação de entradas na API pública
- **Charter:** *Explorar* os endpoints públicos de catálogo, carrinho, cadastro e pagamento *com* valores inválidos, limites e tipos errados *para descobrir* onde a API confia demais no cliente.
- **Área:** API REST (`/products`, `/carts`, `/users`, `/payment/check`, `/messages`).
- **Duração:** ~25 min · **Ferramentas:** contrato OpenAPI, `scripts/probe-api.mjs` (45 requisições com registro de status e resposta).
- **Hipóteses iniciais:**
  1. Parâmetros de consulta (`page`, `sort`, `between`) podem não ser validados.
  2. A regra de quantidade do carrinho pode ter furos nas bordas.
  3. Validações vistas na UI podem não existir na API.
- **Observações (anotações da sessão):**
  - `page=0/-1/abc` → volta à página 1 sem erro (tolerante). `page=999` → lista vazia com metadados coerentes.
  - `sort=foo,bar` → **500** "Something went wrong". Válidos (`price,asc`) funcionam.
  - `between=price,20,10` (invertido) → vazio, sem aviso.
  - Busca com `' OR 1=1 --` → 0 resultados, sem erro (sem sinal de injeção).
  - Carrinho: 0, -1, 1000000, 1.5 → 422 com mensagens claras (mín. 1, máx. 99, inteiro). Bordas bem tratadas **por requisição**.
  - Produto sem estoque → **aceito** (200).
  - Cadastro: senha fraca → 422 com lista de regras; menor de idade → 422; e-mail `nao-e-email` → **201**.
  - Pagamento: `bitcoin` → **200 "Payment was successful"**.
  - Uma requisição falhou por timeout de conexão → o script ganhou novas tentativas (problema de ambiente, não do SUT).
- **Descobertas → defeitos:** BUG-001, BUG-003, BUG-004, BUG-005. **Observações:** OBS-01, OBS-02.
- **Nova hipótese gerada:** "se a validação é por requisição, somar duas adições burla o máximo?" → testado logo depois → **BUG-002** (`evidencias/fase1-api/limite-quantidade-acumulada.log`).
- **Evidências:** `evidencias/fase1-api/sondagem-api.log` e `.json`.
- **Conclusão:** a API valida bem o **formato** de cada campo isolado, mas falha em regras que envolvem **estado** (estoque, total acumulado) ou **listas fechadas** (método de pagamento, coluna de ordenação).

## SE-02 — Validações: front-end × API
- **Charter:** *Comparar* as validações do formulário de cadastro e da página de produto *com* as da API *para descobrir* regras que existem só em uma das camadas.
- **Área:** UI `/auth/register`, `/product/{id}`; API `/users/register`, `/carts`.
- **Duração:** ~15 min · **Ferramentas:** `scripts/explore-ui-checks.mjs`.
- **Hipótese:** o front-end protege mais do que o servidor.
- **Observações:**
  - Produto sem estoque: UI mostra "Out of stock" e **desabilita** *Add to cart* (`isDisabled = true`). A API aceita (SE-01).
  - Cadastro com `nao-e-email`: UI → "Email format is invalid". API → aceita.
  - Mensagens de senha na UI: "Password must be minimal 6 characters long." — a API exige ≥ 8 + maiúscula, minúscula, número e símbolo → **regras divergentes** (OBS-03).
  - Ordenação na UI oferece só 6 opções válidas — por isso o BUG-001 só aparece por chamada direta à API.
- **Descobertas:** confirma BUG-003 e BUG-004 como "validação só no cliente"; registra OBS-03.
- **Evidências:** `evidencias/fase1-exploracao/produto-sem-estoque.png`, `cadastro-email-invalido-ui.png`.
- **Conclusão:** testar só pela interface teria deixado esses defeitos invisíveis — motivo de a estratégia priorizar testes de API.

## SE-03 — Fluxos principais e comportamento do ambiente
- **Charter:** *Percorrer* busca, login e checkout completo *com* um cliente novo *para mapear* seletores, mensagens reais e pontos de sincronização para a automação.
- **Área:** UI completa; rede do navegador.
- **Duração:** ~40 min (com depuração) · **Ferramentas:** `scripts/explore.mjs`, `explore-cart.mjs`, `explore-flows.mjs`, inspeção de rede via Playwright.
- **Observações:**
  - Busca sem resultado: "0 products found for 'zzzzzz'" + "There are no products found.".
  - Login errado: "Invalid email or password". Login certo → `/account`, nome no menu.
  - Checkout: 4 passos (Cart → Sign in → Billing Address → Payment). Anotamos que o endereço do cadastro "não é pré-preenchido" no passo 3 — **anotação errada**, corrigida depois: o pré-preenchimento é assíncrono e lemos os campos cedo demais (OBS-07). Métodos de pagamento: bank-transfer, cash-on-delivery, credit-card, buy-now-pay-later, gift-card.
  - Pedido concluído: "Thanks for your order! Your invoice number is INV-2026000005".
  - **Descoberta técnica importante:** a UI consulta produtos com o **método HTTP `QUERY`** (com corpo), não `GET` com *query string*. Nossos primeiros mocks e esperas de rede não funcionavam por isso (doc 05, S-02).
  - Visitante anônimo: a home chama `GET /users/me` e recebe 401, gerando erro no console (OBS-05).
  - Meu próprio script de exploração falhou uma vez por clicar antes de a página carregar — lembrete de por que a suíte proíbe esperas fixas.
  - **Re-seed:** ~30 min após a exploração, os IDs dos produtos mudaram e 10 testes quebraram de uma vez (OBS-06, `evidencias/fase4-automacao/reseed-ids-mudaram.log`).
- **Evidências:** prints em `evidencias/fase1-exploracao/` (home, login, register, checkout passos 1–4, confirmação), `mapa-data-test.json` (seletores por página).
- **Conclusão:** o ambiente é mutável e lento em picos → testes precisam resolver dados em tempo de execução e sincronizar por eventos, não por tempo.

## SE-04 — Busca automática de CEP no checkout
- **Charter:** *Investigar* o passo 3 do checkout *com* digitação rápida após o CEP *para descobrir* se a busca automática interfere nos dados do usuário.
- **Gatilho:** a fatura do E2E-01 saiu com a cidade "Carmona d'Oeste", não "Natal" (a que o teste digitou).
- **Duração:** ~20 min · **Ferramentas:** `scripts/investigate-postcode.mjs` (3 repetições, registro das respostas de `/postcode-lookup`).
- **Hipótese:** a resposta assíncrona da busca de CEP sobrescreve campos já preenchidos (condição de corrida).
- **Observações:**
  - Execução 1: digitado "Rua das Flores / Natal / RN" → após 5 s "R. Horácio / Carmona d'Oeste / Santa Catarina".
  - Execução 2: idem (sobrescrito).
  - Execução 3: campos **apagados**.
  - A resposta da busca para o CEP de Natal é um endereço de outro estado (dados simulados — OBS-04).
- **Descoberta:** **BUG-007** (Alta). Também explicou a falha intermitente do E2E-01.
- **Evidências:** `evidencias/fase3-exploratorios/SE-04-cep-console.log`, `SE-04-cep-sobrescreve-campos.json`, `SE-04-cep-execucao-{1,2,3}.png`.
- **Conclusão:** um teste automatizado falhando "estranho" virou sessão exploratória, que virou defeito confirmado — as duas abordagens se complementam.

## SE-05 — Autorização entre clientes e recursos da conta
- **Charter:** *Explorar* favoritos, faturas e sessão *com* dois clientes diferentes (A e B) *para descobrir* se um consegue ler ou alterar dados do outro (risco R5).
- **Gatilho:** a métrica de cobertura de endpoints (47,9% das operações em escopo) mostrou que favoritos, faturas e troca/renovação de token não tinham nenhum teste.
- **Duração:** ~25 min · **Ferramentas:** `scripts/probe-api-2.mjs`, `scripts/probe-invoice-authz.mjs`, leitura de `FavoriteService.php`.
- **Hipótese:** endpoints de leitura por ID podem não verificar o dono do recurso (padrão BOLA/IDOR).
- **Observações:**
  - B lê o favorito de A: **200** com o `user_id` de A → **BUG-008**. No código, `getFavoriteById` não filtra pelo dono; `getAllFavorites` e `deleteFavorite` filtram.
  - B tenta apagar o favorito de A: **204**, mas o favorito continua lá (OBS-09).
  - Faturas: B lendo a fatura de A → **404** (correto); B buscando o número da fatura de A → lista vazia (correto). Uma vez a busca deu 500 e não se repetiu (OBS-10).
  - Criar fatura com "Natal/RN" para o CEP 59000-000 foi **rejeitado**: a API valida cidade e estado contra o próprio serviço de CEP (`AddressMatchesCountry`). Isso explicou o "porquê" do BUG-007.
  - O mesmo CEP com e sem hífen gera endereços diferentes → **BUG-009**.
- **Evidências:** `evidencias/fase1-api/sondagem-api-2.log`, `sondagem-autorizacao-faturas.log`, `evidencias/fase3-exploratorios/SE-04-postcode-formatos.log`.
- **Conclusão:** a métrica de cobertura apontou a lacuna, a exploração achou o defeito e os testes API-AUTHZ-* passaram a vigiar o risco. Também é importante registrar o resultado **positivo**: as faturas estão bem protegidas.

---

## 3.6 Charters sugeridos para as sessões da equipe
- **Charter:** *Explorar* o formulário de contato *com* campos vazios, mensagens nos limites, caracteres especiais, e-mails inválidos e anexos *para descobrir* possíveis falhas de validação.
- **Área:** UI — página Contact.
- **Ferramentas:** navegador Google Chrome, capturas de tela e gravações.
- **Hipóteses:**
  1. Campos obrigatórios devem apresentar mensagens de erro quando vazios.
  2. O campo Message deve validar corretamente os limites de caracteres.
  3. Os campos de nome podem aceitar entradas compostas apenas por símbolos.
  4. O sistema deve restringir o formato e tamanho dos anexos.
- **Observações (anotações da sessão):**
  Formulário com campos vazios: mensagens de obrigatoriedade exibidas corretamente.
  Message com "oi": erro indicando mínimo de 50 caracteres.
  Message com aproximadamente 1.000 caracteres: erro indicando máximo de 250 caracteres.
  First name com "@@@@@" e Last name com "!!!!!": nenhuma mensagem de validação de nome foi exibida.
  Last name com texto em formato de e-mail: campo aceitou a entrada durante a exploração.
  Seletor de anexos: filtro para arquivos TXT; imagens PNG/JPG não apareceram na listagem filtrada.
  Arquivo TXT com conteúdo: sistema exibiu "File should be empty.".
  Arquivo TXT vazio: formulário aceitou o anexo; foi observada confirmação de envio em um dos testes.
  E-mail incompleto "teste@": exibiu "Email format is invalid".
- **Descobertas:**
  - Validações de obrigatoriedade, comprimento da mensagem, formato de e-mail e arquivo TXT não vazio funcionaram nos cenários observados.
  - Os campos First name e Last name não apresentaram erro para entradas compostas exclusivamente por símbolos.
  - A seleção de arquivos aplica filtro TXT, mas isso isoladamente não comprova validação do formato no servidor.
- **Problemas encontrados → observação a investigar:**
  - Possível validação insuficiente nos campos First name e Last name, pendente de confirmação das regras de negócio. Não classificado como BUG confirmado.
- **Evidências:** `evidencias/exploratorios-equipe/SE-06-contato/`.
- **Conclusão:** o formulário apresentou validações adequadas nos principais limites testados. A aceitação visual de nomes compostos exclusivamente por símbolos merece investigação adicional e comparação com os requisitos. Recomenda-se verificar também as validações no servidor.

## 3.7 Modelo de sessão

```
## SE-XX — <título curto>
- Testador(a): ____    Data: __/__/2026    Duração: __ min
- Charter: Explorar <área> com <recursos/dados> para descobrir <informação/risco>.
- Hipóteses iniciais:
  1.
- Anotações (com horário):
  - hh:mm —
- Descobertas (defeito? observação? dúvida?):
- Problemas encontrados → BUG-XX / OBS-XX:
- Evidências (prints em evidencias/exploratorios-equipe/):
- Conclusão (o que aprendemos sobre o sistema? o que testar a seguir?):
```
