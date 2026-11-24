# 2. Casos de Teste Manuais

> **Eixo 2 — Testes Manuais e Exploratórios (15%)** — parte 1 de 2 (sessões exploratórias no doc 03).

>

> **Status honesto da execução:**

> - **"Executado (exploração assistida)"** = os passos foram percorridos em 20/11/2026 por scripts de exploração (Playwright controlando o navegador), com prints reais salvos. Não foi uma pessoa clicando.

> - **"Não executado"** = caso especificado, aguardando execução manual.

> - **"Executado manualmente"** = integrante realizou os passos no navegador, registrou o resultado observado e registrou as evidências correspondentes.

>

> **Evidências da execução manual:** `evidencias/minha-execucao/manuais/MT-XX-<nome>.png`.

**Prioridade:** Alta = cobre risco ≥ 6 da matriz (doc 01, 1.5) · Média = risco 3–5 · Baixa = risco ≤ 2.

**Técnicas:** POS = cenário positivo · NEG = negativo · BVA = valor-limite · PE = particionamento de equivalência · ALT = fluxo alternativo · EXC = exceção.

## Resumo
| ID | Nome | Técnica | Prioridade | Status | Automação correspondente |
|---|---|---|---|---|---|
| MT-01 | Comprar como cliente autenticado (fluxo principal) | POS | Alta | Exploração assistida: passou; reexecução manual: passou (23/11/2026) | E2E-01 |
| MT-02 | Checkout como visitante não autenticado | ALT | Alta | Exploração assistida: passou; reexecução manual: passou (23/11/2026) | E2E-02 |
| MT-03 | Endereço digitado preservado após busca de CEP | EXC | Alta | Exploração assistida: falhou (BUG-007); verificação manual parcial: sem reprodução (23/11/2026) | UI-CHK-02 |
| MT-04 | Produto sem estoque não pode ir ao carrinho | NEG | Alta | Executado (exploração assistida) | UI-CAT-08 / API-CART-09 |
| MT-05 | Quantidade no carrinho: limites 0, 1, 99, 100 | BVA | Alta | Não executado (UI) | API-CART-02 |
| MT-06 | Login com credenciais válidas | POS | Alta | Executado (exploração assistida) | UI-AUTH-01 |
| MT-07 | Login com senha errada e com e-mail inexistente | NEG | Média | Executado (exploração assistida) | UI-AUTH-02/03 |
| MT-08 | Cadastro com campos obrigatórios vazios | NEG | Média | Executado (exploração assistida) | UI-AUTH-04 |
| MT-09 | Cadastro com e-mail em formato inválido | NEG/PE | Média | Executado (exploração assistida) | UI-AUTH-05 / API-AUTH-10 |
| MT-10 | Cadastro: idade nos limites (17a364d, 18a1d, 75a, 75a1d) | BVA | Média | Não executado (UI) | API-AUTH-05/05b |
| MT-11 | Cadastro: regras de senha (UI × API) | PE | Média | Não executado | API-AUTH-04 |
| MT-12 | Busca por termo existente e inexistente | POS/NEG | Baixa | Executado manualmente — Passou (23/11/2026) | UI-CAT-02/03 |
| MT-13 | Filtro por categoria + ordenação por preço | POS | Baixa | Executado manualmente — Passou (23/11/2026) | UI-CAT-04/05 |
| MT-14 | Formulário de contato: validações | NEG | Baixa | Não executado | — (só manual) |
| MT-15 | Carrinho persiste após recarregar a página | ALT | Baixa | Executado manualmente — Passou (23/11/2026) | UI-CART-05 |

---

### MT-01 — Comprar como cliente autenticado (fluxo principal)

- **Objetivo:** validar que um cliente consegue comprar e que o pedido é registrado com os dados informados.

- **Pré-condições:** conta de cliente criada (cadastro próprio, com e-mail `@example.com`); carrinho vazio.

- **Dados:** produto "Combination Pliers", quantidade 1; país Brasil, CEP 59000-000, nº 100; pagamento "Cash on Delivery".

- **Passos:** 1) Entrar em **Sign in** e autenticar. 2) Abrir o produto e clicar **Add to cart**. 3) Abrir o carrinho (ícone) → **Proceed to checkout**. 4) No passo 2, **Proceed to checkout**. 5) Preencher o endereço → **Proceed to checkout**. 6) Escolher "Cash on Delivery" → **Confirm**. 7) Clicar **Confirm** novamente.

- **Resultado esperado:** mensagem "Payment was successful"; depois "Thanks for your order! Your invoice number is INV-…"; a fatura aparece em **My invoices** com o endereço digitado.

- **Resultado obtido:** pedido concluído, fatura `INV-2026000005` exibida. (O endereço da fatura não foi conferido nesta execução — ver MT-03.)

- **Status:** Executado (exploração assistida) — **Passou**.

- **Evidências:** `evidencias/fase1-exploracao/checkout-step3-endereco.png`, `checkout-step4-pagamento-ok.png`, `checkout-confirmacao.png`.

- **Prioridade:** Alta · **Executado por/em:** script `scripts/explore-flows.mjs`, 20/11/2026 · Reexecução manual: Artur Lima Pinto Bacalhau, 23/11/2026.

**Reexecução manual — 23/11/2026**

- **Executado por:** Artur Lima Pinto Bacalhau.
- **Resultado obtido:** Foi realizado o login com uma conta de teste, adicionada uma unidade de Combination Pliers ao carrinho e concluído o checkout com Cash on Delivery. O pedido foi confirmado e a fatura apareceu em My invoices com os dados corretos.
- **Status da reexecução manual:** **Passou**.
- **Observações:** Nenhuma.
- **Evidências:**
  - `evidencias/minha-execucao/manuais/MT-01-carrinho.png`
  - `evidencias/minha-execucao/manuais/MT-01-checkout-endereco.png`
  - `evidencias/minha-execucao/manuais/MT-01-pagamento.png`
  - `evidencias/minha-execucao/manuais/MT-01-pedido-confirmado.png`
  - `evidencias/minha-execucao/manuais/MT-01-fatura.png`

### MT-02 — Checkout como visitante não autenticado

- **Objetivo:** fluxo alternativo — visitante deve ser levado a se identificar no passo 2.

- **Pré-condições:** sessão sem login.

- **Passos:** 1) Adicionar um produto ao carrinho. 2) Abrir o carrinho → **Proceed to checkout**.

- **Esperado:** passo 2 mostra formulário de login (e opção de compra como convidado, se existir).

- **Obtido:** passo 2 exibiu os campos de login (`email`, `password`, `login-submit`) e campos de convidado (`guest-email`, `guest-first-name`, `guest-last-name`).

- **Status:** Executado (exploração assistida) — **Passou**.

- **Evidências:** `evidencias/fase1-exploracao/checkout-step2-signin.png`, `checkout-step2-guest.png`.

- **Prioridade:** Alta · Reexecução manual: Artur Lima Pinto Bacalhau, 23/11/2026.

**Reexecução manual — 23/11/2026**

- **Executado por:** Artur Lima Pinto Bacalhau.
- **Resultado obtido:** Sem autenticação, após adicionar um produto e avançar no checkout, o sistema exibiu a etapa 2 (Sign In), com as opções Sign in e Continue as Guest. O formulário de convidado apresentava campos de e-mail, nome e sobrenome.
- **Status da reexecução manual:** **Passou**.
- **Observações:** Não foi necessário concluir o pedido.
- **Evidências:**
  - `evidencias/minha-execucao/manuais/MT-02-checkout-convidado.png`
  - `evidencias/minha-execucao/manuais/MT-02-checkout-login.png`

### MT-03 — Endereço digitado preservado após a busca automática de CEP

- **Objetivo:** caso de exceção — dados digitados pelo usuário não podem ser alterados sem ação dele.

- **Pré-condições:** logado, 1 item no carrinho, no passo 3 (**Billing Address**).

- **Dados:** país Brasil; CEP 59000-000; nº 100; rua "Rua das Flores"; cidade "Natal"; estado "RN".

- **Passos:** 1) Selecionar o país. 2) Digitar CEP e número. 3) **Logo em seguida** digitar rua, cidade e estado. 4) Aguardar ~5 s sem tocar no formulário. 5) Observar os campos.

- **Esperado:** rua/cidade/estado continuam como digitados.

- **Obtido:** em 3 de 3 execuções os campos mudaram sozinhos — 2× substituídos por "R. Horácio / Carmona d'Oeste / Santa Catarina", 1× apagados.

- **Status:** **Falhou** → **BUG-007**.

- **Evidências:** `evidencias/fase3-exploratorios/SE-04-cep-console.log`, `SE-04-cep-execucao-1.png` … `-3.png`.

- **Prioridade:** Alta · Verificação manual: Artur Lima Pinto Bacalhau, 23/11/2026.

**Verificação manual — 23/11/2026**

- **Executado por:** Artur Lima Pinto Bacalhau.
- **Procedimento efetivamente realizado:** Após o CEP `59000-000` e o número `100` acionarem o preenchimento automático (R. Horácio / Carmona d'Oeste / Santa Catarina), os campos foram alterados para Rua das Flores, Natal e RN. Após aguardar, os valores informados manualmente foram preservados.
- **Resultado observado:** Os campos permaneceram com os valores digitados após a edição manual.
- **Status da verificação:** **Passou no cenário observado; execução parcial do MT-03 original**.
- **Limitação:** O documento original exige digitar rua, cidade e estado *logo em seguida* ao CEP, antes de a consulta possivelmente terminar. Essa condição de concorrência não foi comprovadamente exercitada; portanto, a tentativa não invalida o BUG-007 observado na exploração assistida.
- **Evidências:**
  - `evidencias/minha-execucao/manuais/MT-03-endereco-antes.png`
  - `evidencias/minha-execucao/manuais/MT-03-endereco-depois.png`
  - `evidencias/minha-execucao/manuais/MT-03-preenchimento-automatico.png`

### MT-04 — Produto sem estoque não pode ser adicionado ao carrinho

- **Pré-condições:** produto marcado "Out of stock" (no seed: "Long Nose Pliers").

- **Passos:** abrir a página do produto.

- **Esperado:** aviso "Out of stock" e botão **Add to cart** desabilitado.

- **Obtido:** aviso exibido e botão desabilitado. Atenção: pela **API** o mesmo produto é aceito (BUG-003) — a regra existe só no front-end.

- **Status:** Executado (exploração assistida) — **Passou** (UI).

- **Evidências:** `evidencias/fase1-exploracao/produto-sem-estoque.png`; `evidencias/fase1-api/sondagem-api.log`.

- **Prioridade:** Alta

### MT-05 — Quantidade no carrinho: valores-limite

- **Objetivo:** RN-01 (1..99) pela interface.

- **Dados (BVA):** 0, 1, 99, 100; e também: digitar "abc" e "-1".

- **Passos:** na página do produto, digitar a quantidade e clicar **Add to cart**; repetir no carrinho alterando a quantidade.

- **Esperado:** 1 e 99 aceitos; 0, 100, -1 e texto rejeitados com mensagem clara.

- **Obtido:** — · **Status:** Não executado · **Prioridade:** Alta

- **Dica:** pela API os limites estão corretos (API-CART-02 passa). Descubram se a **UI** se comporta igual — e tentem também adicionar 60 + 60 (BUG-002).

### MT-06 — Login com credenciais válidas

- **Pré-condições:** conta criada.

- **Passos:** **Sign in** → e-mail e senha → **Login**.

- **Esperado:** redireciona para **My account** e mostra o nome do cliente no menu.

- **Obtido:** URL `/account`, título "My account", menu com o nome do cliente.

- **Status:** Executado (exploração assistida) — **Passou** · **Evidência:** `evidencias/fase1-exploracao/conta-apos-login.png` · **Prioridade:** Alta

### MT-07 — Login com senha errada e com e-mail inexistente

- **Objetivo:** a mensagem não pode revelar se o e-mail existe (evita enumeração de usuários).

- **Passos:** (a) e-mail existente + senha errada; (b) e-mail inexistente + qualquer senha.

- **Esperado:** a **mesma** mensagem genérica nos dois casos.

- **Obtido:** "Invalid email or password" nos dois casos (API retorna 401 `{"error":"Unauthorized"}` nos dois).

- **Status:** Executado (exploração assistida) — **Passou** · **Evidência:** `evidencias/fase3-exploratorios/login-email-inexistente.log` · **Prioridade:** Média

### MT-08 — Cadastro com campos obrigatórios vazios

- **Passos:** **Register your account** → informar só o e-mail → **Register**.

- **Esperado:** uma mensagem por campo obrigatório, sem enviar o formulário.

- **Obtido:** mensagens para nome, sobrenome, data de nascimento, país, CEP, número, rua, cidade, estado, telefone e senha.

- **Status:** Executado (exploração assistida) — **Passou** · **Evidência:** `evidencias/fase1-exploracao/cadastro-email-invalido-ui.png` · **Prioridade:** Média

### MT-09 — Cadastro com e-mail em formato inválido

- **Dados (PE — classe inválida):** `nao-e-email`.

- **Esperado:** rejeição com mensagem de formato.

- **Obtido (UI):** "Email format is invalid". **Obtido (API, mesmo dado):** 201 Created → BUG-004.

- **Status:** Executado (exploração assistida) — **Passou na UI / Falhou na API** · **Evidência:** print acima + `evidencias/fase1-api/sondagem-api.log` · **Prioridade:** Média

### MT-10 — Cadastro: idade nos limites

- **Dados (BVA, calcular a partir da data de hoje):** 17 anos e 364 dias; 18 anos e 1 dia; 75 anos menos 1 dia; 75 anos e 1 dia.

- **Esperado:** só os dois do meio aceitos.

- **Obtido:** — · **Status:** Não executado (UI). Pela API, "75 anos e 1 dia" foi aceito → BUG-006; falta verificar se a UI tem a mesma falha. · **Prioridade:** Média

### MT-11 — Cadastro: regras de senha, UI × API

- **Dados (PE — uma regra violada por vez):** `Ab1!xyz` (7 caracteres), `abcdefg1!` (sem maiúscula), `ABCDEFG1!` (sem minúscula), `Abcdefgh!` (sem número), `Abcdefgh1` (sem símbolo).

- **Esperado:** a UI deve aplicar a **mesma** regra da API (≥ 8, maiúscula, minúscula, número, símbolo).

- **Obtido:** — · **Status:** Não executado. Na exploração a UI mostrou "Password must be minimal 6 characters long." enquanto a API exige 8 (OBS-03); falta confirmar o que acontece com `Ab1!xyz`. · **Prioridade:** Média

### MT-12 — Busca por termo existente e inexistente

- **Dados:** `thor hammer` (busca existente efetivamente utilizada), `zzzzzz` (sem correspondência) e `<script>alert(1)</script>` (entrada especial).

- **Esperado:** exibir o produto Thor Hammer; informar ausência de resultados para `zzzzzz`; tratar a entrada especial como texto, sem executar JavaScript.

- **Obtido:** a pesquisa por `thor hammer` retornou o produto Thor Hammer. A busca por `zzzzzz` não encontrou produtos. No terceiro cenário, não foi observada execução de JavaScript. Os três cenários passaram na execução manual.

- **Status:** Executado manualmente — **Passou (3/3 cenários)**.

- **Executado por/em:** Artur Lima Pinto Bacalhau — 23/11/2026.

- **Evidências:**

  - `evidencias/minha-execucao/manuais/MT-12-busca-existente.png`

  - `evidencias/minha-execucao/manuais/MT-12-busca-inexistente.png`

  - `evidencias/minha-execucao/manuais/MT-12-entrada-especial.png`

- **Prioridade:** Baixa.

- **Observação:** A entrada especial não executou JavaScript durante a pesquisa.

### MT-13 — Filtro por categoria + ordenação por preço

- **Passos:** marcar a categoria "Pliers" e ordenar por "Price (Low - High)".

- **Esperado:** somente alicates, em ordem crescente de preço.

- **Obtido:** com o filtro "Pliers" ativo, a listagem exibiu apenas alicates. Ao selecionar "Price (Low - High)", os preços apareceram do menor para o maior, conforme a verificação manual.

- **Status:** Executado manualmente — **Passou (2/2 verificações)**.

- **Executado por/em:** Artur Lima Pinto Bacalhau — 23/11/2026.

- **Evidências:**

  - `evidencias/minha-execucao/manuais/MT-13-filtro-pliers.png`

  - `evidencias/minha-execucao/manuais/MT-13-ordenacao-crescente.png`

- **Prioridade:** Baixa.

- **Observações:** Nenhuma.

### MT-14 — Formulário de contato: validações

- **Passos:** **Contact** → enviar vazio; depois mensagem muito curta; depois e-mail inválido. **Não enviar mensagem válida** (o ambiente é compartilhado).

- **Esperado:** mensagens de validação por campo; contrato da API: `subject` e `message` obrigatórios, `message` até 250 caracteres.

- **Obtido:** — · **Status:** Não executado · **Prioridade:** Baixa

### MT-15 — Carrinho persiste após recarregar a página

- **Passos:** adicionar 1 item ao carrinho; apertar F5.

- **Esperado:** contador do carrinho continua em 1.

- **Obtido:** após adicionar uma unidade ao carrinho e recarregar a página com F5, o contador permaneceu indicando 1 item, após a atualização da página.

- **Status:** Executado manualmente — **Passou**.

- **Executado por/em:** Artur Lima Pinto Bacalhau — 23/11/2026.

- **Evidências:**

  - `evidencias/minha-execucao/manuais/MT-15-carrinho-antes-f5.png`

  - `evidencias/minha-execucao/manuais/MT-15-carrinho-depois-f5.png`

- **Prioridade:** Baixa.