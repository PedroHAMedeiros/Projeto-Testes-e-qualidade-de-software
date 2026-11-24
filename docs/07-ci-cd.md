# 7. CI/CD e DevOps

> **Eixo 6 — CI/CD e DevOps (10%)**
> Arquivo: [`.github/workflows/qa-pipeline.yml`](../.github/workflows/qa-pipeline.yml) (GitHub Actions — gratuito para repositórios públicos).

## 7.1 Situação

| Item | Situação |
|---|---|
| Repositório Git local, com histórico de commits | **Implementado** |
| Workflow do GitHub Actions | **Implementado** |
| Cada comando do pipeline executado com sucesso **localmente** (typecheck, lint com gate, jscpd com gate, testes por projeto, resumo, cobertura com gate) | **Executado** — ver 7.5 |
| Execução do workflow **no GitHub** | **Executado** em 22/11 (execução 45035611690): estágios 1 e 2 OK; estágios 3 e 4 FALHOU por bloqueio anti-robô do Cloudflare (ver 7.6). Correção feita; **nova execução no GitHub pendente** (após o próximo push). |

## 7.2 Gatilhos
| Evento | Por quê |
|---|---|
| `push` na `main` | Toda mudança na suíte é validada. |
| `pull_request` para a `main` | Revisão de código acompanhada do resultado dos testes, antes do merge. |
| `workflow_dispatch` | Execução manual (útil na apresentação). |
| `schedule` (dias úteis, 09:00 UTC) | O SUT é externo e muda sem aviso (vimos o re-seed). A regressão diária detecta mudanças **do sistema**, não só do nosso código. |

`concurrency` cancela execuções antigas do mesmo branch, para não gastar minutos com um commit já substituído.

## 7.3 Estágios

```
┌──────────────────────────────┐
│ 1 · Análise estática          │  npm ci → tsc → eslint (gate) → jscpd (gate)
└──────────────┬───────────────┘
               │ só segue se passar (fail fast)
       ┌───────┴────────┐
┌──────▼──────┐  ┌──────▼──────────────┐
│ 2 · API      │  │ 3 · UI + E2E         │   em paralelo
│ playwright   │  │ install chromium     │
│ --project=api│  │ --project=ui,e2e     │
└──────┬──────┘  └──────┬──────────────┘
       │ artefatos: relatório HTML, JUnit, JSON, traces, vídeos, coverage-data
       └───────┬────────┘
┌──────────────▼───────────────┐
│ 4 · Métricas e quality gates  │  resumo por estágio na página da execução
│                              │  cobertura de endpoints (gate ≥ 60%)
│                              │  gate: nenhum estágio de teste com falha
└──────────────────────────────┘
```

- **Instalação de dependências:** `npm ci` (versões exatas do `package-lock.json`, o que garante reprodutibilidade) com cache do npm.
- **Build:** não há build de aplicação (o SUT já está publicado); o equivalente é o **typecheck** da suíte.
- **Relatórios e artefatos:** HTML do Playwright, JUnit (lido por qualquer ferramenta de CI), JSON, traces, vídeos e prints de falha, guardados por 14 dias. Os artefatos são enviados **mesmo quando o estágio falha** (`if: always()`), porque o relatório é a evidência da falha.
- **Tratamento de falhas:** 1 nova tentativa por teste (contabilizada como flaky); `timeout-minutes` por job (para não ficar preso se o SUT travar); cancelamento por concorrência.

## 7.4 Quality gates

| Gate | Regra | Onde | Por quê |
|---|---|---|---|
| G1 Tipos | `tsc --noEmit` sem erros | estágio 1 | Código de teste quebrado não deve nem rodar. |
| G2 Lint | 0 erros e no máximo 10 avisos (`--max-warnings 10`) | estágio 1 | Barra anti-padrões (espera fixa, `test.only` esquecido, asserção ausente). |
| G3 Duplicação | ≤ 5% (`jscpd --threshold 5`) | estágio 1 | Duplicação na suíte multiplica o custo de manutenção. |
| G4 Testes | 0 falhas **inesperadas** (defeitos conhecidos com `test.fail()` não bloqueiam) | estágios 2–4 | Regressão verde = nada novo quebrou. |
| G5 Cobertura | Operações da API em escopo cobertas ≥ 60% | estágio 4 | Impede que a suíte "encolha" sem ninguém perceber. |

Os limites (10 avisos, 5%, 60%) foram escolhidos a partir dos valores atuais, com margem.

## 7.5 Validação local dos comandos do pipeline
Execução em Windows 11 / Node 24, em 20/11/2026 (`evidencias/cicd/`):
- Estágio 1: G1 typecheck OK; G2 lint 0 erros/4 avisos (exit 0); G3 duplicação 0,00% (exit 0). Arquivo: `validacao-local-estagio1.log`.
- Estágios 2–3: execução oficial 3, código de saída 0 (doc 04 §4.5).
- Estágio 4: `endpoint-coverage.mjs --min 60` → 79,2%, exit 0; `summarize-results.mjs` gerou o resumo.
- Clone limpo: `npm ci` + typecheck + lint OK; 104 testes listados (`reprodutibilidade-clone-limpo.md`).

## 7.6 Execução no GitHub Actions
**1ª execução — 22/11/2026, push na `main`** ([execução 45035611690](https://github.com/PedroHAMedeiros/Projeto-Testes-e-qualidade/actions/runs/45035611690)):

| Estágio | Resultado | Observação |
|---|---|---|
| 1 · Análise estática | OK 19 s | 0 erros; avisos de `max-lines-per-function` |
| 2 · Testes de API | OK 1 min | todos os testes de API conforme o esperado |
| 3 · UI e E2E | FALHOU 8 min 35 s | falharam **todos** os testes que abrem produto, checkout ou "minha conta"; listagem, busca e mocks passaram |
| 4 · Quality gates | FALHOU 10 s | gate de cobertura OK; gate "sem falhas inesperadas" FALHOU por causa do estágio 3 |

**Diagnóstico** (prints e traces do artefato `ui-e2e-results`): nessas rotas o navegador do runner recebeu a página do **Cloudflare "Performing security verification / Verify you are human"** em vez do site. O SUT protege essas rotas contra tráfego de datacenter, e os servidores do GitHub são datacenter. Da rede local, as mesmas rotas respondem 200 sem desafio (verificado em 23/11). **Classificação:** problema de ambiente (OBS-12), não defeito do SUT nem erro dos testes.

**Correção** (sem contornar o desafio, que é um controle de segurança de terceiros):
- **1ª tentativa (não funcionou):** uma sonda que abria `/checkout` uma vez no início de cada worker. Na 2ª execução no GitHub (23/11, [execução 45195958429](https://github.com/PedroHAMedeiros/Projeto-Testes-e-qualidade/actions/runs/45195958429)) ela deu **falso negativo**. O trace mostrou que o desafio depende do comportamento da sessão: `/checkout` 200 → produto 200 → `/checkout` **403 `cf-mitigated: challenge`**. Uma verificação única no início não consegue prever isso.
- **Solução atual:** um observador (`src/pages/bot-wall.ts`) marca a página assim que chega uma resposta de documento com `cf-mitigated: challenge`. Cada navegação dos page objects (home, produto, checkout, login → conta, cadastro) e o `reload` do UI-CART-05 verificam a marca e **pulam o teste com o motivo escrito**. Não viram falha nem somem: aparecem como "pulados" no relatório e no resumo da execução. Se um teste falhar por outro caminho com desafio observado, ele recebe a anotação `ambiente`.
- **Validação local (23/11):** (1) caminho normal: UI + E2E completos, 0 falhas inesperadas; (2) `FORCE_BOT_WALL=1`: testes pulados com o motivo; (3) reprodução realista com `page.route`: produto 200 e depois `/checkout` 403 com `cf-mitigated: challenge` → teste pulado, como esperado.

**Consequência e limitação:** no CI ficam cobertos a análise estática, toda a API e a parte da UI sem desafio (catálogo, busca, cadastro, login com erro, mocks). Os fluxos de carrinho, checkout e E2E têm evidência das **execuções locais** (doc 04 §4.5). Para rodá-los também no CI, as alternativas seriam um runner self-hosted numa rede não bloqueada ou subir o SUT em Docker dentro do pipeline (trabalho futuro, doc 08).

