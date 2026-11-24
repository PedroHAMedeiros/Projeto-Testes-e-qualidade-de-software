# Testes e Qualidade de Software — Practice Software Testing

Projeto final da disciplina **Testes e Qualidade de Software** — Prof.ª **Monique Soares** — **Opção 1: Practice Software Testing**.
Entrega: 23/11/2026 · Apresentação: 26/11/2026.

Ciclo completo de qualidade sobre um sistema existente (SUT): planejamento baseado em risco, testes manuais e exploratórios, suíte automatizada de API, UI e E2E, gestão de defeitos, análise de qualidade e pipeline de CI.

## Sistema sob teste
| | |
|---|---|
| UI (Angular) | https://practicesoftwaretesting.com |
| API (REST) | Base: `https://api.practicesoftwaretesting.com` (sem página própria; a raiz responde 404) — documentação Swagger: https://api.practicesoftwaretesting.com/api/documentation |
| Código do SUT (só leitura) | https://github.com/testsmith-io/practice-software-testing |

## Resultados em uma tela
- **9 defeitos confirmados** (3 altos, 4 médios, 2 baixos), incluindo 1 falha de autorização entre clientes, cada um com evidência e teste automatizado → [docs/06](docs/06-gestao-de-defeitos.md)
- **Suíte automatizada** de API + UI + E2E com Playwright → números da última execução em [docs/04](docs/04-automacao-e-cobertura.md)
- **Pipeline de CI** em 4 estágios com quality gates → [docs/07](docs/07-ci-cd.md)

## Documentação (ordem do relatório)
| Doc | Conteúdo |
|---|---|
| [00 — Capa e identificação](docs/00-capa.md) | disciplina, integrantes, matrículas | 
| [01 — Plano de testes](docs/01-plano-de-testes.md) | objetivos, escopo, riscos, critérios, ambiente, dados | 02 |
| [02 — Casos manuais](docs/02-casos-de-teste-manuais.md) | 15 casos estruturados + status de execução | 
| [03 — Sessões exploratórias](docs/03-sessoes-exploratorias.md) | 6 sessões com charter + modelo de sessão | 
| [04 — Automação e cobertura](docs/04-automacao-e-cobertura.md) | arquitetura, técnicas, métricas, cobertura de endpoints | 
| [05 — Qualidade e refatoração](docs/05-qualidade-e-refatoracao.md) | revisão do SUT, smells da suíte, impacto de mudança, proposta de evolução | 
| [06 — Gestão de defeitos](docs/06-gestao-de-defeitos.md) | BUG-001..007, critérios de severidade/prioridade | 
| [07 — CI/CD](docs/07-ci-cd.md) | pipeline, quality gates, resultados | 
| [08 — Conclusões](docs/08-conclusoes-e-licoes.md) | **a escrever pela equipe** (roteiro de perguntas) | 
| [09 — Apresentação](docs/09-apresentacao.md) | roteiro, demonstração ao vivo, perguntas prováveis | 
| [10 — Rastreabilidade e auditoria](docs/10-rastreabilidade-e-auditoria.md) | requisito → atividade → artefato → evidência → resultado | 
| [PROGRESSO](docs/PROGRESSO.md) | registro das etapas, decisões e problemas | 

## Tecnologias
Node.js ≥ 20 · TypeScript 5.9 · Playwright 1.65 (API, UI e E2E num só framework) · ESLint 10 + typescript-eslint + eslint-plugin-playwright · jscpd (duplicação) · GitHub Actions. Tudo gratuito e de código aberto.

## Estrutura
```
.
├── .github/workflows/qa-pipeline.yml   # pipeline de CI
├── playwright.config.ts                # projetos api / ui / e2e, timeouts, relatórios
├── src/
│   ├── api/        api-client.ts (cliente da API) · endpoint-recorder.ts (métrica de cobertura)
│   ├── data/       test-data.ts (nomes estáveis) · catalog.ts (IDs em tempo de execução) · factories.ts
│   ├── fixtures/   test-fixtures.ts (setup/teardown: usuário, carrinho, catálogo, page objects)
│   └── pages/      page objects (home, produto, login/cadastro, checkout)
├── tests/
│   ├── api/        products · cart · auth · payment
│   ├── ui/         catalog · cart · auth · checkout-address · mocks
│   └── e2e/        checkout (compra completa + verificação da fatura na API)
├── scripts/        exploração, sondagem da API, latência, resumo de resultados, cobertura de endpoints
├── evidencias/     prints, logs e métricas reais, por fase
├── docs/           relatório (00 a 10)
└── reports/        (gerado) HTML, JUnit, JSON, resumos
```

## Como executar
Pré-requisitos: Node.js 20+ e Git.
```bash
npm ci
npx playwright install chromium        # no Linux/CI: --with-deps chromium

npm test                               # suíte completa (≈ 7–8 min; o SUT é público e lento em picos)
npm run test:api                       # só API (≈ 3 min)
npm run test:ui                        # só UI
npm run test:e2e                       # só E2E
npm run test:smoke                     # caminho crítico (@smoke)
npm run test:known-defects             # testes dos defeitos conhecidos (devem "falhar como esperado")

npm run metrics                        # gera reports/summary.md e reports/endpoint-coverage.md
npm run report                         # abre o relatório HTML do Playwright
npm run typecheck && npm run lint      # análise estática
npm run latency                        # mede a latência do SUT (10 amostras por endpoint)
npm run pdf                            # gera entrega/relatorio-final.pdf (docs 00–10 + prints) — rode após editar os docs
```
Antes de medir a cobertura de endpoints de uma execução nova, rode `npm run clean:coverage`.
Variáveis opcionais: `UI_URL` e `API_URL`, por exemplo para apontar para uma instância local do SUT via Docker.

### Como ler o resultado
- **passed:** comportamento conforme o esperado.
- **expected to fail** (tag `@known-defect`): o teste descreve o comportamento **correto** e o SUT ainda tem o defeito. Se um dia esse teste **passar**, o Playwright acusa erro, avisando que o defeito foi corrigido e que o `test.fail()` deve ser removido.
- **flaky:** falhou e passou na nova tentativa. É contado e reportado, nunca escondido.

## Limitações
- O SUT é um **ambiente público compartilhado**: latência variável (mediana ≈ 0,9 s, picos de até ≈ 31 s) e **re-seed periódico** (IDs mudam). Mitigações em [docs/04](docs/04-automacao-e-cobertura.md).
- **Sem cobertura de código do SUT** (não temos o servidor). Medimos cobertura da **superfície da API** e de requisitos/riscos.
- Área administrativa, carga e segurança invasiva estão **fora do escopo**, por ética com o ambiente compartilhado ([docs/01](docs/01-plano-de-testes.md)).
- Automação só no Chromium.

## Referências
- Practice Software Testing — documentação: https://testsmith-io.github.io/practice-software-testing/
- Playwright — https://playwright.dev/docs/intro
- ISTQB Foundation Level Syllabus v4.0 (técnicas de teste, gestão de defeitos)
- Bach, J. *Session-Based Test Management* (testes exploratórios com charter)
- Fowler, M. *Refactoring* (2ª ed.): catálogo de code smells
