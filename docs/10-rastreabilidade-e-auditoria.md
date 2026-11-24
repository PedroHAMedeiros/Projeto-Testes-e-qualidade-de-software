# 10. Rastreabilidade e Auditoria de Completude

## 10.1 Requisitos da professora → atividade → artefato → evidência → situação

Legenda da coluna "Situação": CONCLUÍDO = concluído e validado · PARCIAL = concluído parcialmente · IMPLEMENTADO = implementado, não validado · NÃO IMPLEMENTADO

| # | Requisito (PDF da professora) | Atividade realizada | Artefato | Evidência | Situação |
|---|---|---|---|---|---|
| E1 | Capa: disciplina, professora, nomes, matrículas, opção | Capa com os 6 integrantes e matrículas | `docs/00-capa.md` | — | PARCIAL: link do repositório pendente na capa |
| P1 | Estratégia de V&V com escopo, riscos, critérios de entrada/saída e priorização | Plano baseado na exploração real | `docs/01-plano-de-testes.md` | `evidencias/fase1-*` | CONCLUÍDO (justificativas em 1.9.1 e 1.9.2) |
| M1 | Casos de teste manuais estruturados | 15 casos com todos os campos | `docs/02-casos-de-teste-manuais.md` | `evidencias/fase1-exploracao/`, `evidencias/minha-execucao/manuais/` | PARCIAL: 11 executados (8 por exploração assistida; 6 manualmente, 3 deles reexecuções); 4 não executados (MT-05, MT-10, MT-11, MT-14) |
| M2 | Sessões exploratórias com charter, objetivos e anotações | 6 sessões (SE-01..06) + modelo | `docs/03-sessoes-exploratorias.md` | `evidencias/fase1-api/`, `fase3-exploratorios/`, `exploratorios-equipe/` | CONCLUÍDO |
| A1 | Testes de unidade, integração, E2E e/ou API | 104 testes: API (6 arquivos, 77 testes), UI (5 arquivos, 25), E2E (1 arquivo, 2); integração UI↔API | `tests/` | `evidencias/execucao-oficial-*/` | CONCLUÍDO (unidade: não aplicável, justificado no doc 01 §1.9) |
| A2 | Análise de cobertura | Cobertura de operações da API × contrato OpenAPI (79,2% em escopo); cobertura de riscos e requisitos | `scripts/endpoint-coverage.mjs`, este doc | `reports/endpoint-coverage.md` | CONCLUÍDO (cobertura de código do SUT: indisponível, limitação declarada) |
| A3 | Uso de mocks/stubs | 4 testes com `page.route` | `tests/ui/mocks.ui.spec.ts` | relatório HTML | CONCLUÍDO |
| A4 | Suíte de regressão completa | Tag `@regression` + CI diário | `package.json` (`test:regression`), workflow | `evidencias/execucao-oficial-*` | CONCLUÍDO local · IMPLEMENTADO: no GitHub |
| A5 | Métricas de qualidade | Taxa de sucesso, flaky, duração, defeitos, lint, duplicação, latência | `scripts/summarize-results.mjs`, `measure-latency.mjs` | `reports/summary.md`, `evidencias/metricas/`, `fase5-qualidade/` | CONCLUÍDO |
| Q1 | Análise de métricas e code smells | SUT (6 smells ligados a defeitos) + suíte (7 smells reais) | `docs/05` | `eslint-antes/depois`, `jscpd-antes` | CONCLUÍDO |
| Q2 | Revisão de código e propostas de refatoração com justificativa | Refatorações aplicadas na suíte; propostas para o SUT | `docs/05` | diffs no histórico do Git | CONCLUÍDO |
| Q3 | Análise de impacto de mudanças | Impacto da correção BUG-007/009 | `docs/05` §5.3 | — | CONCLUÍDO |
| Q4 | Proposta de evolução/correção com critérios de qualidade | Validação de pagamento por Strategy (BUG-005) | `docs/05` §5.4 | testes API-PAY-* já existentes | CONCLUÍDO |
| D1 | Reportes de bugs estruturados, com acompanhamento | 9 defeitos + 11 observações | `docs/06` | por defeito, no doc 06 | CONCLUÍDO |
| D2 | Classificação por severidade e prioridade | Critérios definidos e aplicados | `docs/06` §6.1 | — | CONCLUÍDO (prioridades justificadas no doc 01, 1.9.2) |
| C1 | Pipeline de CI: build + testes automatizados | Workflow em 4 estágios | `.github/workflows/qa-pipeline.yml` | `evidencias/cicd/` | CONCLUÍDO: 1ª execução no GitHub (22/11): estágios 1–2 aprovados, 3–4 bloqueados por Cloudflare (OBS-12) · IMPLEMENTADO: correção feita, reexecução pendente |
| C2 | Quality gates básicos | 5 gates (tipos, lint, duplicação, testes, cobertura) | workflow + `docs/07` | `evidencias/cicd/` | IMPLEMENTADO: idem |
| F1 | Conclusões e lições aprendidas | Conclusões, lições e limitações | `docs/08` | — | CONCLUÍDO |
| F2 | Apêndices com evidências (prints, logs, relatórios) | Pasta organizada por fase | `evidencias/` | — | CONCLUÍDO |
| F3 | Entrega: um PDF (ou link do repositório + PDF); repositório público | — | — | — | PARCIAL: repositório publicado e PDF gerado; link do repositório pendente na capa |
| R1 | Evidências de execução real, justificativas próprias e análise crítica | Evidências reais em todo o projeto | `docs/` | `evidencias/` | CONCLUÍDO |
| R2 | Demonstração ao vivo e respostas na apresentação | Roteiro, plano B, perguntas de estudo | `docs/09` | — | PARCIAL: roteiro pronto; ensaio pendente |

## 10.2 Requisitos do SUT → riscos → testes → defeitos

| Requisito | Risco | Testes automatizados | Casos manuais | Defeitos/observações |
|---|---|---|---|---|
| RF-01 Listagem/paginação | R7 | API-PROD-01..03, UI-CAT-01, UI-CAT-06, UI-MOCK-01 | — | OBS-01 |
| RF-02 Busca | R7, R8 | API-PROD-07/08, UI-CAT-02/03 | MT-12 | — |
| RF-03 Filtros | R7 | API-PROD-05/06, API-CAT-01..04, UI-CAT-05 | MT-13 | OBS-02 |
| RF-04 Ordenação | R8 | API-PROD-04, API-PROD-13, UI-CAT-04 | MT-13 | **BUG-001** |
| RF-05 Detalhe/estoque | R7, R4 | API-PROD-09..12, UI-CAT-07/08, UI-MOCK-02 | MT-04 | — |
| RF-06 Carrinho | R3, R4 | API-CART-01..09, UI-CART-01..05 | MT-05, MT-15 | **BUG-002, BUG-003** |
| RF-07 Cadastro | R4, R6 | API-AUTH-01..05c, API-AUTH-10, UI-AUTH-04/05 | MT-08..11 | **BUG-004, BUG-006**, OBS-03 |
| RF-08 Login/sessão/conta | R5 | API-AUTH-06..09, API-ACC-01/02, UI-AUTH-01..03 | MT-06, MT-07 | OBS-11 |
| RF-09 Pagamento | R1 | API-PAY-01..04 | MT-01 | **BUG-005** |
| RF-10 Checkout/fatura | R2, R5 | E2E-01/02, UI-CHK-01/02, API-AUTHZ-05..07, API-CEP-01/02 | MT-01..03 | **BUG-007, BUG-009**, OBS-04, OBS-07 |
| RF-11 Contato | R4 | API-MSG-01/02 | MT-14 | — |
| Favoritos (conta) | R5 | API-AUTHZ-01..04 | — | **BUG-008**, OBS-09 |
| (resiliência da UI) | R8 | UI-MOCK-03/04 | — | OBS-05 |

**Cobertura de riscos:** todos os riscos com nota ≥ 6 (R1, R2, R3, R4, R9) têm testes automatizados; R9 (ambiente) é mitigado no desenho da suíte (doc 04 §4.6).

## 10.3 Auditoria de completude — o que foi verificado
- [x] Os testes foram realmente executados: 4 execuções completas registradas (`evidencias/execucao-*`), mais execuções parciais citadas no PROGRESSO.
- [x] Os resultados do doc 04 vêm do `results.json` da execução final, copiado para `evidencias/`.
- [x] Cada defeito tem evidência e teste associado (doc 06).
- [x] Os scripts funcionam: `typecheck`, `lint`, `jscpd`, `metrics` foram executados (`evidencias/cicd/`).
- [x] O README descreve instalação e execução, e a suíte foi reproduzida em outra máquina em 23/11/2026: 104 testes, 0 falhas inesperadas (`evidencias/minha-execucao/summary.md`).
- [~] O pipeline rodou no GitHub (22/11): API e análise estática OK; UI/E2E bloqueados pelo Cloudflare → testes afetados agora são pulados com motivo; nova execução pendente.
- [x] Erros nossos foram separados de defeitos do SUT (doc 06 §6.1).


