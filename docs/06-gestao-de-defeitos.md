# 6. Gestão de Defeitos

> **Eixo 5 — Gestão de Defeitos (10%)**
> Todos os defeitos abaixo foram **reproduzidos** no ambiente público em 20/11/2026 e cada um tem **teste automatizado associado** (marcado com `@known-defect`) e evidência em `evidencias/`.

## 6.1 Classificação utilizada

**Severidade** (impacto técnico/negócio do defeito, independe de prazo):

| Nível | Critério |
|---|---|
| **Crítica** | Perda/corrupção de dados, falha de segurança explorável, ou fluxo principal (comprar) impossível sem contorno. |
| **Alta** | Regra de negócio violada com efeito em dados persistidos ou dinheiro (pedido, pagamento, cadastro), com contorno difícil. |
| **Média** | Regra violada sem efeito financeiro direto, ou erro tratado de forma inadequada (ex.: 500 em vez de 4xx). Existe contorno. |
| **Baixa** | Inconsistência de mensagem, cosmético, ou impacto apenas em cenários improváveis. |

**Prioridade** (urgência de correção, considerando exposição e custo):

| Nível | Critério |
|---|---|
| **P1** | Corrigir antes da próxima liberação. Afeta usuários reais no fluxo principal. |
| **P2** | Corrigir na próxima iteração. Afeta integridade de dados mas tem barreira (ex.: UI bloqueia). |
| **P3** | Backlog. Baixa exposição. |

**Status:** `Novo` → `Confirmado` (reproduzido 2+ vezes, com teste) → `Reportado` (enviado aos mantenedores) → `Corrigido` → `Verificado` (teste `@known-defect` passa a passar e o `test.fail()` é removido) → `Fechado`.
Como **não temos acesso para corrigir o SUT**, todos ficam em **Confirmado**. O status "Reportado" depende da equipe decidir abrir issue no repositório público do SUT (ação externa — **não executada**).

**Distinção usada neste projeto** (exigência do plano):

| Categoria | Definição | Exemplos neste projeto |
|---|---|---|
| **Defeito confirmado** | Comportamento do SUT diverge de requisito/contrato documentado, reproduzido 2+ vezes. | BUG-001 a BUG-009 |
| **Comportamento inesperado (não classificado como defeito)** | Diverge do que esperávamos, mas não há requisito que prove que é erro (ou não foi reproduzido). | OBS-01 a OBS-12 |
| **Falha de teste (erro nosso)** | O teste estava errado; o SUT estava certo. | API-AUTH-02 esperava 422, contrato diz 409; mocks com padrão de URL errado (ver doc 05, S-02) |
| **Problema de ambiente** | Falha causada por latência/instabilidade do ambiente público, não reproduzível isoladamente. | UI-AUTH-03 falhou numa execução e passou isolado; timeouts de rede (doc 04, seção 4.6) |

## 6.2 Painel de acompanhamento

| ID | Título | Severidade | Prioridade | Status | Teste associado | Camada |
|---|---|---|---|---|---|---|
| BUG-001 | `GET /products` com `sort` inválido retorna HTTP 500 | Média | P3 | Confirmado | API-PROD-13 | API |
| BUG-002 | Adições sucessivas ultrapassam o limite de 99 unidades por item | Média | P2 | Confirmado | API-CART-08 | API |
| BUG-003 | API aceita produto **sem estoque** no carrinho (UI bloqueia) | Alta | P2 | Confirmado | API-CART-09 | API |
| BUG-004 | Cadastro aceita e-mail sem formato válido (`nao-e-email`) | Média | P2 | Confirmado | API-AUTH-10 | API |
| BUG-005 | `/payment/check` aprova método de pagamento inexistente | Alta | P1 | Confirmado | API-PAY-04 | API |
| BUG-006 | Limite superior de idade efetivo é 93 anos (regra/mensagem diz 75) | Baixa | P3 | Confirmado | API-AUTH-05b / 05c | API |
| BUG-007 | Checkout: busca automática de CEP substitui, sem aviso, o endereço digitado ou salvo no perfil | Alta | P2 | Confirmado (intermitente) | UI-CHK-02 (+ efeito observado no E2E-01) | UI |
| BUG-008 | `GET /favorites/{id}` devolve o favorito de **outro** cliente (falha de autorização) | Média | P2 | Confirmado | API-AUTHZ-03 | API |
| BUG-009 | Serviço de CEP devolve endereços diferentes para o mesmo CEP com e sem hífen | Baixa | P3 | Confirmado | API-CEP-02 | API |

Severidade: 0 críticas · 3 altas · 4 médias · 2 baixas.

---

## 6.3 Relatórios de defeito

Ambiente comum a todos: Practice Software Testing **v5.0** (rodapé: "v2.5 | Built 2026-10-11 | Angular 20.0.5"), UI `https://practicesoftwaretesting.com`, API `https://api.practicesoftwaretesting.com` (OpenAPI "Toolshop API 5.0.0"). Cliente: Windows 11, Node 24.22, Playwright 1.65.1 (Chromium). Data: 20/11/2026.
Código-fonte do SUT consultado (somente leitura) para análise de causa: `github.com/testsmith-io/practice-software-testing`, commit `ae7caec` (11/10/2026 — mesma data do build em produção), pasta `sprint5/API`.

### BUG-001 — `sort` inválido em `GET /products` retorna HTTP 500
- **Descrição:** valores de ordenação fora da lista suportada derrubam a requisição com erro interno em vez de serem rejeitados como entrada inválida.
- **Pré-condições:** nenhuma (endpoint público).
- **Passos:** `GET /products?sort=foo,bar`
- **Esperado:** HTTP 400/422 com mensagem de validação (ou ordenação ignorada). Valores válidos documentados no contrato: `name,asc|desc`, `price,asc|desc`.
- **Atual:** `HTTP 500 {"message":"Something went wrong"}`.
- **Evidências:** `evidencias/fase1-api/sondagem-api.log` (linha "sort invalido"); teste API-PROD-13 (falha esperada) no relatório HTML.
- **Impacto:** erro 500 polui monitoramento/alertas e indica que o valor chega à consulta SQL sem lista de permissão; facilita varredura automatizada por erros.
- **Causa provável (hipótese, não confirmada):** o parâmetro é repassado a um filtro genérico (`$query->filter()` em `ProductService::getAllProducts`) sem validação de coluna.

### BUG-002 — Limite de 99 unidades é burlado por adições sucessivas
- **Pré-condições:** carrinho criado (`POST /carts`).
- **Passos:** `POST /carts/{id}` com `{product_id, quantity: 60}` duas vezes; `GET /carts/{id}`.
- **Esperado:** a regra `quantity` 1..99 (validada pelo próprio SUT em cada requisição — ver API-CART-02) deveria valer para a quantidade **resultante**; a 2ª adição deveria ser rejeitada (422) ou limitada a 99.
- **Atual:** as duas retornam 200 e o item fica com `quantity = 120`.
- **Evidências:** `evidencias/fase1-api/limite-quantidade-acumulada.log`; teste API-CART-08.
- **Causa (código):** `CartService.php` faz `$existingItem->increment('quantity', $quantity)` sem verificar o total; a validação `max:99` (CartController, linha 111) só olha o valor da requisição.
- **Impacto:** pedidos com quantidades acima do permitido; regra de negócio inconsistente entre "adicionar" e "atualizar".

### BUG-003 — API aceita produto sem estoque no carrinho
- **Pré-condições:** produto com `in_stock=false` (no seed: "Long Nose Pliers").
- **Passos:** `POST /carts/{id}` com o ID desse produto e `quantity: 1`.
- **Esperado:** rejeição (422), coerente com a UI, que **desabilita** o botão "Add to cart" para esse produto (teste UI-CAT-08, print `evidencias/fase1-exploracao/produto-sem-estoque.png`).
- **Atual:** `200 {"result":"item added or updated"}`.
- **Evidências:** `evidencias/fase1-api/sondagem-api.log` (linha "add out-of-stock"); teste API-CART-09.
- **Impacto:** a regra existe apenas no front-end. Qualquer cliente da API (app móvel, integração, usuário com DevTools) compra item indisponível. Exemplo clássico de **validação só no cliente**.

### BUG-004 — Cadastro aceita e-mail inválido
- **Passos:** `POST /users/register` com dados válidos e `email: "nao-e-email"`.
- **Esperado:** 422 (a UI rejeita com "Email format is invalid" — teste UI-AUTH-05).
- **Atual:** `201 Created` com o usuário persistido.
- **Evidências:** `evidencias/fase1-api/sondagem-api.log` (linha "register email invalido"); print da UI `evidencias/fase1-exploracao/cadastro-email-invalido-ui.png`; teste API-AUTH-10.
- **Causa (código):** `StoreCustomer.php`, linha 67: regras `['required','unique:users,email','string','max:256', ...]` — **falta a regra `email`**.
- **Impacto:** contas que não recebem e-mail (recuperação de senha impossível), dados sujos.

### BUG-005 — `/payment/check` aprova método inexistente
- **Passos:** `POST /payment/check` com `{"payment_method":"bitcoin","payment_details":{}}`.
- **Esperado:** 422 — o contrato OpenAPI declara `payment_method` como enum (`bank-transfer, cash-on-delivery, credit-card, buy-now-pay-later, gift-card`).
- **Atual:** `200 {"message":"Payment was successful"}`.
- **Evidências:** `evidencias/fase1-api/sondagem-api.log` (linha "payment check metodo invalido"); teste API-PAY-04.
- **Causa (código):** `PaymentController::check` (linhas 35–70) é uma sequência de `if` independentes, um por método, **sem `else`/caso padrão**; um método desconhecido não entra em nenhum ramo e cai direto no `return ... 'Payment was successful'` (linha 70). Também vale para `payment_method` ausente.
- **Impacto:** a verificação de pagamento — o controle mais sensível do fluxo — falha "aberta" (*fail-open*). Por isso severidade Alta e P1.

### BUG-006 — Idade máxima efetiva é 93 anos, não 75
- **Passos:** `POST /users/register` com `dob` = hoje − 75 anos − 1 dia (ex.: `1951-11-19`).
- **Esperado:** 422 com "Customer must be younger than 75 years old." (contrato: "between 18 and 75 years ago").
- **Atual:** 201. O limite real é 93 anos: `1933-11-21` → 201, `1933-11-20` → 422.
- **Evidências:** `evidencias/fase1-api/fronteira-idade-93-anos.log`; testes API-AUTH-05b (falha esperada) e API-AUTH-05c (caracterização do limite real).
- **Causa (código):** `StoreCustomer.php`, linhas 44–46: `$dt = new Carbon(); $before = $dt->subYears(18)...; $after = $dt->subYears(75)...`. `Carbon` é **mutável**: `subYears(18)` altera `$dt`, e o `subYears(75)` é aplicado sobre a data já deslocada (18 + 75 = 93).
- **Impacto:** baixo (público acima de 75 anos), mas é um ótimo exemplo de defeito que **só a análise de valor-limite encontra** — o caso típico (35 anos) nunca falharia.

### BUG-007 — Checkout: a busca automática de CEP substitui, sem aviso, o endereço digitado ou salvo
- **Pré-condições:** usuário autenticado, 1 item no carrinho, passo 3 do checkout ("Billing Address").
- **Cenário A (endereço digitado):** país = Brasil; CEP `59000-000`; número `100`; logo em seguida digitar rua "Rua das Flores", cidade "Natal", estado "RN"; aguardar alguns segundos.
- **Cenário B (endereço salvo no perfil):** cliente cadastrado com endereço "Rua das Flores, Natal, RN, CEP 59000000"; abrir o passo 3 e **não tocar** no formulário.
- **Esperado:** o que o cliente digitou ou salvou é preservado. Uma sugestão da busca de CEP deveria preencher só campos vazios ou pedir confirmação.
- **Atual:**
  - Cenário A: após a resposta assíncrona de `GET /postcode-lookup`, os campos são **substituídos** ("R. Horácio / Carmona d'Oeste / Santa Catarina") ou **apagados**. Em 3 execuções: 2 sobrescritas e 1 apagamento.
  - Cenário B: o formulário carrega o endereço do perfil (t ≈ 1 s: "Natal / RN"), a busca de CEP dispara sozinha e o substitui (t ≈ 3 s: "Júlio d'Oeste / Piauí").
  - Comportamento **intermitente** (depende da ordem das respostas assíncronas): a 1ª versão do teste chegou a passar na 1ª tentativa.
- **Efeito em dado persistido:** na 1ª execução completa (20/11, ~22:22Z) a fatura do E2E-01 foi gravada com `billing_city = "Carmona d'Oeste"`, embora o teste tenha digitado "Natal". Na execução oficial 1 (~22:45Z), o teste leu "Júlio d'Oeste" no formulário e a fatura saiu com "Carmona d'Oeste": o endereço mudou de novo entre a leitura e a confirmação.
- **Contexto técnico (código do SUT):** ao criar a fatura, a API valida a cidade e o estado **contra o próprio serviço de CEP** (`Rules/AddressMatchesCountry.php`). A sobrescrita no front-end parece ser uma tentativa de "alinhar" o formulário a essa regra. Como o serviço de CEP é simulado (OBS-04) e inconsistente entre formatos (BUG-009), o cliente não tem como saber qual endereço vai valer.
- **Evidências:** `evidencias/fase3-exploratorios/SE-04-cep-console.log`, `SE-04-cep-sobrescreve-campos.json`, `SE-04-cep-execucao-{1,2,3}.png`, `observacoes-OBS-05-OBS-07.log`, `OBS-07-prefill-perfil.png`, `SE-04-postcode-formatos.log`; teste UI-CHK-02.
- **Impacto:** o pedido pode ser gravado com um endereço de cobrança diferente do que o cliente informou, sem que ele perceba, o que afeta um dado fiscal (fatura). **Severidade Alta**. **Prioridade P2**, e não P1, porque no ambiente de demonstração o serviço de CEP é simulado.

### BUG-008 — `GET /favorites/{id}` devolve favorito de outro cliente
- **Pré-condições:** dois clientes, A e B, autenticados; A tem um favorito.
- **Passos:** B chama `GET /favorites/{id-do-favorito-de-A}` com o próprio token.
- **Esperado:** 404 (ou 403). A listagem `GET /favorites` já filtra pelo dono, e o `DELETE` também.
- **Atual:** `200` com `{"id":…, "user_id": "<id de A>", "product_id": …}`.
- **Causa (código):** `Services/FavoriteService.php::getFavoriteById()` usa `Favorite::findOrFail($id)` **sem** `where('user_id', Auth::id())`, ao contrário de `getAllFavorites()` e `deleteFavorite()` no mesmo arquivo. É uma inconsistência dentro da mesma classe.
- **Evidências:** `evidencias/fase1-api/sondagem-api-2.log`; teste API-AUTHZ-03.
- **Impacto:** categoria **API1 do OWASP API Security Top 10** (*Broken Object Level Authorization*). O dado exposto aqui é pouco sensível (ID do cliente e do produto), por isso **Média**, mas o mesmo padrão em outro recurso seria grave. Para comparação: as **faturas** estão corretamente protegidas (API-AUTHZ-06).

### BUG-009 — Mesmo CEP, endereços diferentes conforme o formato
- **Passos:** `GET /postcode-lookup?country=BR&postcode=59000000&house_number=100` e o mesmo com `59000-000`.
- **Esperado:** mesmo endereço; o CEP é o mesmo e só muda a formatação.
- **Atual:** `59000000` → "Júlio d'Oeste / Piauí"; `59000-000` → "Carmona d'Oeste / Santa Catarina". O resultado é estável para cada formato.
- **Evidências:** `evidencias/fase3-exploratorios/SE-04-postcode-formatos.log`; teste API-CEP-02.
- **Impacto:** baixo isoladamente, mas **contribui para o BUG-007**: o perfil guarda o CEP sem hífen e o cliente digita com hífen, e cada formato produz um endereço diferente.

---

## 6.4 Comportamentos inesperados — registrados, **não** classificados como defeito

| ID | Observação | Por que não é defeito (por ora) | Evidência |
|---|---|---|---|
| OBS-01 | `page=0`, `page=-1`, `page=abc` retornam silenciosamente a página 1 | Tolerância é uma escolha de design aceitável; não há requisito contrário. | `sondagem-api.log` |
| OBS-02 | `between=price,20,10` (faixa invertida) retorna lista vazia sem aviso | Idem; poderia ser 422. Sugestão de melhoria. | `sondagem-api.log` |
| OBS-03 | A UI valida senha com "mínimo 6 caracteres", a API exige 8 (+ maiúscula, número, símbolo) | Inconsistência de regra entre camadas: o usuário só descobre a regra real após enviar. **Candidato a defeito — equipe decide.** | print `cadastro-email-invalido-ui.png`; testes API-AUTH-04 |
| OBS-04 | Busca de CEP devolve endereço incompatível com o CEP (59000-000 → Santa Catarina) | Serviço de CEP simulado na demo. | `SE-04-cep-console.log` |
| OBS-05 | Visitante anônimo: a home chama `GET /users/me` (2×) e gera erro 401 no console do navegador | Sem impacto funcional; ruído de console e requisições desnecessárias. | `evidencias/fase3-exploratorios/observacoes-OBS-05-OBS-07.log` |
| OBS-06 | Ambiente é re-semeado periodicamente: IDs dos produtos mudam | Característica do ambiente de demonstração, mas quebra testes que fixam IDs. | `evidencias/fase4-automacao/reseed-ids-mudaram.log` |
| OBS-07 | O endereço do perfil é pré-preenchido no passo 3 de forma **assíncrona** (vazio em t=0, preenchido em t≈1 s). *Correção:* na SE-03 tínhamos anotado "não é pré-preenchido" porque lemos os campos cedo demais | Intencional. Mas é uma das fontes da condição de corrida do BUG-007. | `observacoes-OBS-05-OBS-07.log`, `OBS-07-prefill-perfil.png` |
| OBS-08 | Latência com cauda longa (mediana ~0,9 s; p90 até ~10 s; máximo ~31 s) | Ambiente público compartilhado; sem SLA documentado. | `evidencias/metricas/latencia-*.json` |
| OBS-09 | `DELETE /favorites/{id}` de outro cliente responde **204**, mas não apaga nada | A autorização funciona (nada é apagado); só o código de resposta engana (o esperado seria 404). | `sondagem-api-2.log`; teste API-AUTHZ-04 |
| OBS-10 | `GET /invoices/search` retornou **500** uma vez (cliente B buscando a fatura de A) | **Não reproduzido** em nova tentativa (200 com lista vazia). O log da 1ª tentativa foi sobrescrito por engano, então **não há evidência salva**. Fica registrado só para transparência. | — |
| OBS-11 | `POST /users/register` e `POST /users/login` estouraram 45 s algumas vezes durante as execuções completas | Ambiente. Hipótese **não verificada**: o cadastro chama um serviço externo de senhas vazadas (`Password::uncompromised()` no código). | relatórios das execuções (testes flaky) |
| OBS-12 | No GitHub Actions, as rotas de produto, checkout e "minha conta" exibem o desafio anti-robô do Cloudflare; da rede local, não | Proteção do ambiente contra IPs de datacenter, não é defeito funcional. Testes afetados são pulados com motivo no CI (doc 07 §7.6). | artefato `ui-e2e-results` da execução 45035611690 (prints com "Verify you are human") |
