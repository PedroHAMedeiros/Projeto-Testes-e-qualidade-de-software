# 9. Apresentação (26/11/2026) — roteiro e preparação

> O documento da professora **não informa o tempo** da apresentação. Confirmar com ela e ajustar os blocos pelas proporções indicadas abaixo.
> A apresentação vale 15% e "poderá ser solicitado demonstração ao vivo e questionamento sobre decisões técnicas". **Todos** precisam saber explicar **tudo**.

## 9.1 Roteiro (proporção do tempo total)

| # | Bloco | % | Quem | Conteúdo-chave | Material |
|---|---|---|---|---|---|
| 1 | Contexto e estratégia | 10% | — | SUT, escopo (incluído/excluído e o porquê), matriz de riscos | doc 01 (1.3, 1.5) |
| 2 | Testes manuais e exploratórios | 15% | — | 1 caso estruturado; a sessão SE-04 contada como uma história (falha estranha → exploração → defeito) | docs 02, 03 |
| 3 | Arquitetura da automação | 20% | — | pirâmide adaptada; Page Objects; fixtures com setup/teardown; `catalog`; mocks; `test.fail()` para defeitos conhecidos | doc 04, código |
| 4 | **Demo ao vivo** | 20% | — | ver 9.2 | terminal + navegador |
| 5 | Defeitos | 15% | — | BUG-005 (fail-open no pagamento) e BUG-007 (endereço errado na fatura): impacto, severidade, causa no código | doc 06 |
| 6 | Qualidade, refatoração e CI/CD | 10% | — | smells S-01/S-02 (os nossos!), métricas, pipeline e gates | docs 05, 07 |
| 7 | Conclusões e lições | 10% | — | conclusões, lições e limitações | doc 08 |

## 9.2 Demonstração ao vivo — passo a passo (ensaiem 2×)

**Plano A (≈ 4 min):**
1. `npm run test:known-defects` → mostrar 9 testes "expected to fail" e explicar o `test.fail()`.
2. Abrir o Swagger (`https://api.practicesoftwaretesting.com/api/documentation`) → `POST /payment/check` com `{"payment_method":"bitcoin","payment_details":{}}` → 200 "Payment was successful" (BUG-005 ao vivo).
3. No navegador: checkout até o passo 3, digitar CEP 59000-000 e logo depois a cidade "Natal" → ver a cidade mudar (BUG-007 ao vivo; por ser intermitente, pode precisar de 2 tentativas).
4. `npm run report` → abrir um teste com trace e mostrar passos, rede e prints.
5. Mostrar a última execução do pipeline no GitHub Actions (aba Actions) e o resumo com os gates.

**Plano B** (internet ruim ou SUT fora do ar — acontece, ele é público): usar o relatório HTML **já gerado** (`reports/html`), os prints de `evidencias/` e um vídeo de uma execução gravado antes. O vídeo deve ser gravado com antecedência.

## 9.3 Perguntas prováveis — respostas de estudo (baseadas no que foi feito)


**Estratégia e planejamento**
- *Por que não há testes de unidade?* — Não temos o SUT rodando sob nosso controle; testar unidades exige o código em execução. Seria possível subir o SUT via Docker (trabalho futuro). Compensamos com muitos testes de API, que são rápidos e próximos da lógica.
- *Por que a área admin ficou de fora?* — O ambiente é compartilhado: CRUD de catálogo afetaria outros usuários e exigiria a conta admin pública. É uma decisão ética documentada no doc 01 (1.3.2).
- *Como priorizaram?* — Matriz Probabilidade × Impacto; riscos com nota 6 (dinheiro, pedido, carrinho, validação só no cliente) receberam mais testes e encontraram 6 dos 7 defeitos.

**Automação**
- *Por que Playwright?* — ver doc 01, seção 1.9.1.
- *O que é uma fixture? Onde há setup/teardown?* — `src/fixtures/test-fixtures.ts`: `registeredUser` cria um usuário novo via API antes do teste; `cartId` cria um carrinho e o **apaga** depois; `catalog` roda 1× por worker.
- *Como garantem testes independentes?* — Dados novos por teste (usuário, carrinho, e-mail único); nenhum teste depende da ordem ou de outro teste; por isso rodam em paralelo.
- *Onde usaram mock/stub? Por quê?* — `tests/ui/mocks.ui.spec.ts`, com `page.route`: catálogo vazio, API com erro 500, preço extremo e latência alta. São cenários impossíveis ou antiéticos de criar no ambiente real. Cada teste prova que o stub foi usado (lição S-02).
- *O que significa `test.fail()`?* — O teste descreve o comportamento **correto**; enquanto o defeito existir, ele falha "como esperado" e a suíte fica verde. Quando corrigirem o SUT, o teste passa e o Playwright **acusa**, para tirarmos a marcação.
- *Como evitaram esperas fixas?* — Asserções com nova tentativa automática (`expect(...).toBeVisible()`), espera por **respostas de rede** (`waitForResponse`) e uma regra de lint que proíbe `waitForTimeout`.
- *Têm testes flaky?* — Medimos e reportamos (doc 04). O SUT tem picos de latência medidos; usamos 1 nova tentativa e **contamos** quem só passou nela.

**Cobertura e métricas**
- *Qual a cobertura de código?* — Não medimos cobertura de código **do SUT**, porque o servidor não é nosso. Medimos (1) cobertura de **operações da API** em escopo contra o contrato OpenAPI (`scripts/endpoint-coverage.mjs`), (2) cobertura de **requisitos e riscos** (rastreabilidade, doc 10). Explicar a diferença é importante.
- *Que métricas de qualidade usaram?* — Taxa de sucesso, taxa de flaky, duração, defeitos por severidade, cobertura de endpoints, lint, duplicação, latência p50/p90.

**Defeitos**
- *Diferença entre severidade e prioridade?* — Severidade = tamanho do estrago; prioridade = urgência de corrigir. Exemplo nosso: BUG-006 tem severidade baixa e P3; BUG-005 tem severidade alta e P1.
- *Como sabem que é defeito e não erro do teste?* — Reproduzido 2+ vezes, divergência de um requisito escrito (contrato OpenAPI, mensagem do próprio sistema ou regra da UI) e, quando possível, causa localizada no código. Já tivemos erro **nosso**: API-AUTH-02 esperava 422 e o contrato diz 409; corrigimos o teste, não o reportamos.
- *Qual o defeito mais grave?* — ver doc 01, seção 1.9.2 (BUG-005, P1).

**Qualidade e CI/CD**
- *Que code smells encontraram?* — No SUT: condicional sem caso padrão (pagamento), objeto mutável (idade), regra espalhada (carrinho). Na **nossa** suíte: IDs fixos, mock que não mockava, `if` dentro de teste, asserção sensível ao tempo, e as refatorações aplicadas.
- *O que é um quality gate? Quais vocês têm?* — Uma condição que bloqueia o pipeline: tipos sem erro, lint sem erro, duplicação ≤ 5%, nenhuma falha inesperada nos testes, cobertura de endpoints em escopo ≥ 60%.
- *Por que o pipeline roda todo dia?* — O SUT muda sem aviso (vimos o re-seed); a regressão diária detecta mudanças externas.

## 9.4 Checklist do dia
- [ ] Repositório público e link na capa
- [ ] PDF gerado e enviado no Teams até 23/11
- [ ] `npm ci` e `npx playwright install chromium` testados no notebook da apresentação
- [ ] Relatório HTML e vídeo (plano B) na máquina
- [ ] Cada integrante ensaiou o próprio bloco e respondeu 5 perguntas do 9.3 sem consultar
