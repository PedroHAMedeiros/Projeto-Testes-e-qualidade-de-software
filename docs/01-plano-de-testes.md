# 1. Plano de Testes e Estratégia de V&V

> **Eixo 1 — Planejamento e Estratégia (10%)**
>
> Este plano foi construído **depois** da exploração real do sistema (Fase 1, 20/11/2026). Tudo que aparece como funcionalidade foi observado na aplicação ou no contrato OpenAPI — ver `evidencias/fase1-exploracao/` e `evidencias/fase1-api/`.
>

## 1.1 Objetivos

- **Verificação** (construímos certo?): o SUT cumpre o **contrato** declarado — OpenAPI "Toolshop API 5.0.0", regras de validação e códigos HTTP documentados.
- **Validação** (construímos a coisa certa?): um cliente consegue **encontrar, escolher e comprar** produtos com dados corretos, e recebe mensagens compreensíveis quando erra.
- Encontrar defeitos nas áreas de maior risco (dinheiro, dados do cliente, autenticação), documentá-los de forma reproduzível e deixar uma **suíte de regressão** executável em CI.

## 1.2 Sistema sob teste

| Item | Valor observado |
|---|---|
| Aplicação | Practice Software Testing — "Toolshop" (loja de ferramentas de demonstração) |
| Front-end | Angular 20.0.5 — [https://practicesoftwaretesting.com](https://practicesoftwaretesting.com) (rodapé: v2.5, build 2026-10-11) |
| API | REST (Laravel) — [https://api.practicesoftwaretesting.com](https://api.practicesoftwaretesting.com); Swagger em `/api/documentation`; contrato JSON em `/docs?api-docs.json` (OpenAPI 3.2, ~90 operações) |
| Dados | Seed público: 50 produtos, 9 por página, 3 categorias raiz e subcategorias, 2 marcas. **Re-semeado periodicamente** (IDs mudam — OBS-06) |
| Código-fonte | Público no GitHub (testsmith-io/practice-software-testing). Usado **somente para leitura** na análise de causa dos defeitos; não executamos nem alteramos o SUT |

## 1.3 Escopo

### 1.3.1 Funcionalidades incluídas (confirmadas na exploração)

| ID | Funcionalidade | Onde testamos | Por quê |
|---|---|---|---|
| RF-01 | Listagem e paginação do catálogo | API + UI | Porta de entrada do usuário |
| RF-02 | Busca por texto | API + UI | Alto uso; entrada livre (risco de injeção) |
| RF-03 | Filtros (categoria, faixa de preço) | API + UI | Lógica de consulta; consistência UI↔API |
| RF-04 | Ordenação | API + UI | Parâmetro controlado pelo cliente (gerou BUG-001) |
| RF-05 | Detalhe de produto / relacionados / estoque | API + UI | Dados exibidos devem bater com a fonte |
| RF-06 | Carrinho (adicionar, atualizar, remover, persistir) | API + UI | Regra de quantidade (RN-01); envolve dinheiro |
| RF-07 | Cadastro de cliente | API + UI | Dados pessoais; regras RN-02 (idade) e RN-03 (senha) |
| RF-08 | Login, sessão (JWT), logout | API + UI | Segurança |
| RF-09 | Verificação de pagamento | API | Controle mais sensível do fluxo |
| RF-10 | Checkout completo (4 passos) e fatura | E2E + API | Fluxo de negócio principal |
| RF-11 | Formulário de contato (validação) | Manual | Entrada livre de usuário |

Regras de negócio derivadas (observadas na API/contrato): **RN-01** quantidade inteira 1..99; **RN-02** idade entre 18 e 75 anos; **RN-03** senha ≥ 8 com maiúscula, minúscula, número e símbolo.

### 1.3.2 Funcionalidades excluídas (e por quê)

| Excluído | Justificativa |
|---|---|
| Área administrativa (CRUD de produtos/marcas/categorias, gestão de usuários, pedidos e mensagens, relatórios) | O ambiente é **público e compartilhado**: alterar o catálogo afeta outras pessoas. Exigiria usar a conta admin compartilhada. Ética de teste > cobertura. |
| Login social (Google), TOTP/2FA | Dependem de terceiros/dispositivo; fora do tempo do projeto. |
| Testes de carga/estresse | Proibido na prática: geraria carga em serviço que não é nosso. Fizemos apenas **medição leve de latência** (10 amostras sequenciais por endpoint). |
| Testes de segurança invasivos (força bruta, varredura) | Mesmo motivo. Fizemos apenas entradas maliciosas simples em campos (busca com `' OR 1=1 --` e `<script>`). |
| Versões alternativas do SUT (`with-bugs`, sprints anteriores) | O escopo da disciplina é o sistema escolhido (versão atual). |
| Multi-idioma, acessibilidade, compatibilidade entre navegadores | Prioridade baixa frente ao prazo. Automação usa só Chromium. **Limitação declarada.** |

## 1.4 Abordagem (estratégia)

- **Baseada em risco:** o esforço segue a matriz da seção 1.5.
- **Pirâmide de testes adaptada:** maioria na **API** (rápidos, estáveis, sem navegador), menos na **UI**, poucos **E2E** que cruzam o sistema inteiro. Testes de unidade **não se aplicam**: não temos o código do SUT em execução (ver seção 1.9).
- **Caixa-preta + leitura do código-fonte** só para explicar causa de defeito já encontrado (análise de causa raiz), nunca para "adivinhar" testes.
- **Técnicas:** particionamento de equivalência, análise de valor-limite, tabela de decisão (pagamento), testes negativos, testes exploratórios com charter, teste de contrato (status + formato), testes de caracterização (fixam o comportamento atual), mocks/stubs na UI, verificação cruzada UI ↔ API.
- **Defeitos conhecidos** viram testes que **esperam o comportamento correto** e são marcados com `test.fail()` — a suíte fica verde, mas avisa quando o defeito for corrigido.

## 1.5 Riscos e priorização

Probabilidade (P) e Impacto (I) de 1 a 3; **Risco = P × I**.

| ID | Risco | P | I | Risco | Prioridade | Mitigação (testes) |
|---|---|---:|---:|---:|---|---|
| R1 | Pagamento aprovado indevidamente | 2 | 3 | **6** | Alta | API-PAY-*, tabela de decisão → **encontrou BUG-005** |
| R2 | Pedido gravado com valores/endereço errados | 2 | 3 | **6** | Alta | E2E-01 com verificação da fatura via API → **encontrou BUG-007** |
| R3 | Regras do carrinho burladas (quantidade/estoque) | 2 | 3 | **6** | Alta | API-CART-* (BVA) → **BUG-002, BUG-003** |
| R4 | Validação só no front-end (API aceita dado inválido) | 3 | 2 | **6** | Alta | Mesmos dados inválidos na UI e na API → **BUG-003, BUG-004, OBS-03** |
| R5 | Acesso a dados de outro usuário / sessão inválida aceita | 1 | 3 | 3 | Média | API-AUTH-06..09 (token) e API-AUTHZ-* (cliente A × cliente B) → **encontrou BUG-008** |
| R6 | Cadastro aceita dados fora da regra (idade, senha) | 2 | 2 | 4 | Média | API-AUTH-04/05 (partições + limites) → **BUG-006** |
| R7 | Catálogo exibe dados divergentes da fonte | 1 | 2 | 2 | Baixa | UI-CAT-05/07 (UI × API) |
| R8 | Erros não tratados (500) | 2 | 1 | 2 | Baixa | Testes negativos → **BUG-001** |
| R9 | **Risco de projeto:** ambiente instável/lento ou re-semeado | 3 | 2 | 6 | Alta | Timeouts calibrados por medição; 1 retry contabilizado; IDs resolvidos em tempo de execução (doc 05, S-01) |

## 1.6 Critérios de entrada

1. SUT acessível (UI e API respondem 200 na home e em `/products`).
2. Contrato OpenAPI disponível para consulta.
3. Ambiente de automação instalado (`npm ci` + `npx playwright install chromium`) e `npm run typecheck` sem erros.
4. Dados de referência do seed presentes (a fixture `catalog` falha cedo e com mensagem clara se um produto de referência sumir).

## 1.7 Critérios de saída

| Critério | Meta | Como medir |
|---|---|---|
| Casos de teste de prioridade Alta executados | 100% | Docs 02 e 04 |
| Falhas **inesperadas** na regressão automatizada | 0 | `reports/summary.md` |
| Testes instáveis (flaky) | ≤ 5% das execuções | idem |
| Defeitos encontrados | 100% com relatório, evidência e teste associado | Doc 06 |
| Cobertura de operações da API em escopo | ≥ 60% | `reports/endpoint-coverage.md` (gate do CI) |
| Riscos com nota ≥ 6 | 100% com ao menos 1 teste | Seção 1.5 |
| Pipeline de CI | Executa sozinho e publica relatórios | Doc 07 |

## 1.8 Ambiente e dados de teste

**Ambiente:** produção pública do SUT (não há homologação disponível). Cliente: Windows 11 / Node 24 (local) e Ubuntu / Node 22 (CI); Playwright 1.65.1 com Chromium; TypeScript 5.9.

**Estratégia de dados:**

- **Usuários:** criados **na hora**, via API, por teste (fixture `registeredUser`), com e-mail único `qa.tqs.<id>@example.com` — o domínio `example.com` é reservado (RFC 2606), então nenhum e-mail real é atingido. Não usamos as contas de demonstração compartilhadas, para não depender do estado que outras pessoas deixam.
- **Senhas:** geradas por execução; nunca há credencial real no repositório.
- **Carrinhos:** um carrinho novo por teste, apagado no *teardown* (fixture `cartId`).
- **Catálogo:** referenciado por **nome** (estável); o ID atual é resolvido em tempo de execução (fixture `catalog`) — necessário porque o ambiente é re-semeado.
- **Dados extremos/impossíveis** (catálogo vazio, API fora do ar, preço 1234,50): produzidos com **stubs** (`page.route`) sem tocar no ambiente real.
- **Limitação:** contas criadas não podem ser apagadas pelo cliente (`DELETE /users/{id}` exige admin). O re-seed periódico do ambiente acaba limpando-as.

## 1.9 Tipos de teste e justificativa das escolhas técnicas

| Tipo | Aplicado? | Ferramenta | Justificativa |
|---|---|---|---|
| Unidade | **Não** | — | Não temos o SUT rodando localmente; testar unidades do código dele seria testar código que não executamos. Poderia ser feito subindo o SUT via Docker (o repositório oferece) — registrado como trabalho futuro. |
| API / contrato | Sim | Playwright `request` | Maior parte dos riscos está nas regras do servidor; testes rápidos e determinísticos. |
| UI / componente | Sim | Playwright + Chromium | Validação de front-end, renderização, consistência com a API. |
| Integração | Sim | Playwright | UI ↔ API (UI-CAT-05/07) e E2E com verificação da fatura no back-end. |
| E2E | Sim | Playwright | Fluxo de compra completo (RF-10). |
| Regressão | Sim | tag `@regression` + CI diário | SUT externo muda sem aviso. |
| Manual / exploratório | Sim | Navegador + scripts de apoio | Encontra o que não sabemos que procurar (BUG-007 surgiu assim). |
| Mocks/stubs | Sim | `page.route` | Cenários impossíveis de reproduzir com segurança no ambiente real. |
| Desempenho | Só medição leve | `scripts/measure-latency.mjs` | Calibrar timeouts; não é teste de carga. |

### 1.9.1 Justificativa das ferramentas e tecnologias

A escolha das ferramentas considerou os tipos de teste necessários, a facilidade de manutenção e a integração com o pipeline de CI.

**Playwright:** escolhido por permitir testes de API, interface e E2E utilizando a mesma ferramenta. Isso facilita o compartilhamento de recursos, reduz a necessidade de ferramentas adicionais e oferece mecanismos de espera automática, assertions com retentativas e captura de evidências. Selenium, Cypress e Postman também são alternativas válidas, mas o Playwright atende melhor à necessidade de centralizar os diferentes tipos de teste.

**TypeScript:** utilizado para estruturar a suíte e implementar recursos reutilizáveis. A tipagem ajuda a identificar inconsistências durante o desenvolvimento e facilita a manutenção de fixtures, clientes de API e Page Objects.

**Chromium:** definido como navegador de referência para padronizar a execução dos testes. Essa escolha, entretanto, limita a validação de compatibilidade a esse navegador.

**ESLint:** utilizado para identificar problemas de padronização e práticas inadequadas, mantendo a consistência do código.

**jscpd:** utilizado para identificar duplicações e reduzir redundâncias, facilitando futuras alterações.

**GitHub Actions:** responsável por automatizar a execução dos testes e da regressão, permitindo acompanhar resultados e gerar relatórios. Como o SUT é externo, as execuções também dependem da disponibilidade do serviço e de mecanismos de proteção, como o Cloudflare.

As ferramentas foram escolhidas de acordo com as necessidades do projeto. A solução busca integrar automação, análise de qualidade e execução contínua sem adicionar tecnologias desnecessárias.

### 1.9.2 Justificativa dos critérios de prioridade

A prioridade indica a urgência de correção do defeito, considerando o risco e o impacto no fluxo afetado.

- **P1 — Urgente:** exige correção imediata devido ao risco relevante.
- **P2 — Alta:** afeta regras de negócio, dados ou funcionalidades importantes.
- **P3 — Baixa:** possui impacto mais limitado e menor exposição.

| Defeito | Prioridade | Justificativa |
|---|---|---|
| BUG-001 | P3 | Parâmetro de ordenação inválido não compromete o fluxo principal. |
| BUG-002 | P2 | Permite ultrapassar o limite de quantidade no carrinho, violando uma regra comercial. |
| BUG-003 | P2 | Permite adicionar produtos sem estoque pela API. |
| BUG-004 | P2 | Permite persistir e-mail inválido no cadastro. |
| BUG-005 | P1 | Aprova método de pagamento desconhecido, exigindo correção urgente. |
| BUG-006 | P3 | Ultrapassa o limite de idade em um cenário específico de menor exposição. |
| BUG-007 | P2 | Pode persistir endereço incorreto na fatura. |
| BUG-008 | P2 | Permite acessar favoritos de outro usuário, violando a autorização. |
| BUG-009 | P3 | Retorna endereços inconsistentes para CEPs equivalentes, com impacto mais limitado. |

A prioridade considera a urgência e o risco de correção, não apenas a existência do defeito.