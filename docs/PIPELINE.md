# Lean Agentic Pipeline v3 — Documentação Completa

> Sistema autônomo de desenvolvimento com 7 agentes de IA que leem, implementam, revisam, testam e auditam código — tudo via GitHub Projects Kanban.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Pré-requisitos](#3-pré-requisitos)
4. [Setup Rápido (novo projeto)](#4-setup-rápido)
5. [Os 7 Agentes](#5-os-7-agentes)
6. [O Board (GitHub Projects)](#6-o-board)
7. [Fluxo Completo da Pipeline](#7-fluxo-completo)
8. [Comandos](#8-comandos)
9. [move-stage.sh — Sincronização do Board](#9-move-stagesh)
10. [Self-Review Loop](#10-self-review-loop)
11. [Regras Críticas](#11-regras-críticas)
12. [Troubleshooting](#12-troubleshooting)
13. [Como Usar em Outro Chat (Contexto Zero)](#13-como-usar-em-outro-chat)
14. [Referência Técnica Completa](#14-referência-técnica)

---

## 1. Visão Geral

A Lean Agentic Pipeline é um sistema de **Prompt Chaining** onde 7 agentes de IA autônomos processam features do backlog até a produção, com quality gates em cada etapa.

```
Ideia → Spec → Sprint → Dev → Review → QA → Security → DONE
         ↑                    ↓         ↓        ↓
         └────────────────────┴─────────┴────────┘
                        (rejeição volta para dev)
```

**O que resolve:**
- Humanos não precisam revisar código, testar ou auditar manualmente
- Cada feature passa por 5 validações antes de mergear
- Bugs são pegos ANTES de ir para produção
- O board reflete em tempo real o estado de cada issue

**Padrão de design:** Prompt Chaining (Sequential with Quality Gates)
- Cada agente roda até completar TODOS os itens do seu stage
- O próximo agente só começa quando o anterior termina
- Rejeições voltam para `stage:dev` com label específica
- O dev-agent prioriza itens rejeitados antes de novos

---

## 2. Arquitetura

### Estrutura de Arquivos

```
.claude/
├── agents/                     # 8 agentes autônomos
│   ├── mvp-auditor.md          # Agent 0: Auditoria MVP (823 linhas, opus)
│   ├── spec-agent.md           # Agent 1: Spec writer (442 linhas, sonnet)
│   ├── sprint-planner.md       # Agent 2: Task decomposition (496 linhas, sonnet)
│   ├── dev-agent.md            # Agent 3: Implementação (779 linhas, opus)
│   ├── code-reviewer.md        # Agent 4: Code review (626 linhas, sonnet)
│   ├── qa-tester.md            # Agent 5: QA testing (595 linhas, sonnet)
│   ├── security-auditor.md     # Agent 6: Security audit (611 linhas, sonnet)
│   └── e2e-runner.md           # Agent 7: Real-user E2E testing (opus)
│
├── commands/                   # Slash commands
│   ├── audit.md                # /project:audit — roda MVP auditor
│   ├── e2e.md                  # /project:e2e — roda E2E runner
│   └── run.md                  # /project:run — roda pipeline completa
│
├── pipeline-config.md          # IDs do GitHub Projects (stages, fields, options)
├── move-stage.sh               # Script de sincronização board/labels
└── settings.local.json         # Permissões para execução autônoma
```

### Artefatos Gerados

```
docs/
├── specs/          # Specs criadas pelo spec-agent (FEAT-NNN-name.md)
├── qa/             # Relatórios QA (FEAT-NNN-TN.md)
├── security/       # Relatórios de segurança (FEAT-NNN-TN.md)
└── audit/          # Relatório MVP readiness (MVP-READINESS-AUDIT.md)
```

---

## 3. Pré-requisitos

### Ferramentas

```bash
# GitHub CLI autenticado
gh auth status

# Claude Code instalado
claude --version

# Node.js (para build/lint/tests do frontend)
node --version

# Python 3 (usado pelo move-stage.sh para parsing JSON)
python3 --version
```

### GitHub Projects

1. Criar um GitHub Project (v2, Board view) na org/repo
2. Criar as 8 colunas no board: `BACKLOG`, `SPEC-DONE`, `SPRINT`, `DEV`, `REVIEW`, `QA`, `SECURITY`, `DONE`
3. Obter os IDs com:

```bash
# ID do projeto
gh project list --owner {ORG} --format json

# IDs dos campos e opções
gh project field-list {PROJECT_NUMBER} --owner {ORG} --format json
```

4. Atualizar `pipeline-config.md` com os IDs

### Labels no Repositório

Criar estas labels no GitHub:

```bash
# Stage labels (8)
gh label create "stage:backlog" --color "E4E669"
gh label create "stage:spec-done" --color "D4C5F9"
gh label create "stage:sprint" --color "C5DEF5"
gh label create "stage:dev" --color "BFD4F2"
gh label create "stage:review" --color "FBCA04"
gh label create "stage:qa" --color "F9D0C4"
gh label create "stage:security" --color "D93F0B"
gh label create "stage:done" --color "0E8A16"

# Rejection labels (3)
gh label create "rejected:review" --color "B60205"
gh label create "rejected:qa" --color "B60205"
gh label create "rejected:security" --color "B60205"

# Priority labels (4)
gh label create "P0-critical" --color "B60205"
gh label create "P1-high" --color "D93F0B"
gh label create "P2-medium" --color "FBCA04"
gh label create "P3-low" --color "0E8A16"

# Type labels (3)
gh label create "type:feature" --color "1D76DB"
gh label create "type:bugfix" --color "D93F0B"
gh label create "type:tech-debt" --color "5319E7"
```

---

## 4. Setup Rápido

Para usar a pipeline em um **novo projeto**:

### Passo 1: Copiar os arquivos

```bash
# Copiar toda a estrutura .claude/ para o novo projeto
cp -r /path/to/worki12/.claude /path/to/new-project/.claude
```

### Passo 2: Atualizar pipeline-config.md

Editar `.claude/pipeline-config.md` com:
- `GITHUB_OWNER` e `GITHUB_REPO` do novo projeto
- `GITHUB_PROJECT_ID` e `STATUS_FIELD_ID` do novo project board
- Status Option IDs de cada coluna (obtidos via `gh project field-list`)

### Passo 3: Atualizar move-stage.sh

Editar as variáveis no topo:
```bash
REPO="NewOrg/new-repo"
PROJECT_NUMBER=1
ORG="NewOrg"
PROJECT_ID="PVT_xxx"
STATUS_FIELD_ID="PVTSSF_xxx"
```

### Passo 4: Atualizar PROJECT KNOWLEDGE nos agentes

Cada agente tem uma seção `PROJECT KNOWLEDGE` com detalhes específicos do projeto (stack, padrões, regras de negócio). Atualize para refletir o novo projeto.

### Passo 5: Criar labels e board columns

Seguir a seção [Pré-requisitos](#3-pré-requisitos).

### Passo 6: Configurar permissões

```json
// .claude/settings.local.json
{
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Glob", "Grep", "Bash(*)", "WebFetch", "Agent"]
  }
}
```

---

## 5. Os 8 Agentes

### Agent 0: MVP Readiness Auditor

| | |
|---|---|
| **Arquivo** | `.claude/agents/mvp-auditor.md` |
| **Modelo** | opus |
| **Comando** | `/project:audit` |
| **Quando usar** | Uma vez, antes do lançamento |
| **Input** | Codebase inteiro |
| **Output** | `docs/audit/MVP-READINESS-AUDIT.md` + GitHub Issues para cada gap |

Escaneia o codebase em **8 dimensões**: Core Features, Auth, Data, Error Handling, Security, Infrastructure, UX, Testing. Cria issues P0-P3 no backlog com ACs e estimativas.

### Agent 1: Spec Agent

| | |
|---|---|
| **Arquivo** | `.claude/agents/spec-agent.md` |
| **Modelo** | sonnet |
| **Stage** | `backlog` → `spec-done` |
| **Input** | Issue com ideia de feature |
| **Output** | `docs/specs/FEAT-NNN-name.md` |

Transforma ideias brutas em specs de produção. Cada spec é um contrato entre os 5 agentes seguintes. Inclui: Problem Statement, User Stories, Acceptance Criteria, Technical Design, Task Breakdown.

### Agent 2: Sprint Planner

| | |
|---|---|
| **Arquivo** | `.claude/agents/sprint-planner.md` |
| **Modelo** | sonnet |
| **Stage** | `spec-done` → `sprint` |
| **Input** | Spec aprovada |
| **Output** | GitHub Issues (task issues T1, T2, T3...) |

Decompõe specs em tasks atômicas. Cada task issue contém TUDO que o dev-agent precisa: file paths, padrões, ACs, error scenarios, toast messages, Definition of Done.

### Agent 3: Dev Agent

| | |
|---|---|
| **Arquivo** | `.claude/agents/dev-agent.md` |
| **Modelo** | **opus** (máxima qualidade) |
| **Stage** | `sprint` → `dev` → `review` |
| **Input** | Task issue |
| **Output** | Branch + PR aberto |

O único agente com permissão de escrita. Implementa o código seguindo padrões existentes. Roda build/lint/tests antes de push. Cria PR com body estruturado.

**Prioridade:** Itens rejeitados (`rejected:*`) são processados ANTES de novos sprints.

### Agent 4: Code Reviewer

| | |
|---|---|
| **Arquivo** | `.claude/agents/code-reviewer.md` |
| **Modelo** | sonnet |
| **Stage** | `review` → `qa` (approve) ou `dev` (reject) |
| **Input** | PR aberto |
| **Output** | Review comment com APPROVE ou REQUEST CHANGES |

READ-ONLY. Aplica checklist de 9 pontos: Spec compliance, Logic, Edge cases, Error handling, Financial ops, Migrations, TypeScript, Naming/DRY/Perf, Tests. Cada finding tem `file:line`.

### Agent 5: QA Tester

| | |
|---|---|
| **Arquivo** | `.claude/agents/qa-tester.md` |
| **Modelo** | sonnet |
| **Stage** | `qa` → `security` (ship) ou `dev` (block) |
| **Input** | Issue aprovado pelo code-reviewer |
| **Output** | `docs/qa/FEAT-NNN-TN.md` |

Faz checkout do branch do PR e valida CADA acceptance criterion com evidência `file:line`. Testa fluxos financeiros, edge cases, empty states, auth. Roda build/lint/tests.

**REGRA CRÍTICA:** Deve fazer `git checkout {branch}` antes de testar. Testar no `main` gera falsos negativos.

### Agent 6: Security Auditor

| | |
|---|---|
| **Arquivo** | `.claude/agents/security-auditor.md` |
| **Modelo** | sonnet |
| **Stage** | `security` → `done` (ship) ou `dev` (block) |
| **Input** | Issue aprovado pelo QA |
| **Output** | `docs/security/FEAT-NNN-TN.md` + git tag |

READ-ONLY com mentalidade de atacante. OWASP Top 10, RLS, JWT, CORS, secrets, financial bypass. Cria git tag `release/FEAT-NNN-YYYYMMDD` ao aprovar.

### Agent 7: E2E Runner (Real-User Testing)

| | |
|---|---|
| **Arquivo** | `.claude/agents/e2e-runner.md` |
| **Modelo** | **opus** |
| **Comando** | `/project:e2e` |
| **Quando usar** | Após pipeline completa, antes de deploy |
| **Input** | App rodando (dev server + Supabase) |
| **Output** | `docs/e2e/E2E-RUN-REPORT.md` + GitHub Issues para cada bug |

O agente mais poderoso: abre um **browser real** via Playwright, loga como worker e company, navega CADA rota, clica CADA botão, preenche CADA form. Captura 3 camadas de diagnóstico:

1. **Frontend visual** — screenshots de cada página e cada erro
2. **Browser console** — `console.error`, `page.on('pageerror')`, network failures
3. **Edge function logs** — `supabase functions logs` com erros do servidor

Para cada falha, cria um GitHub Issue com **contexto completo**: rota, ação, esperado vs obtido, screenshot, console log, edge function log, e stack trace. Qualquer dev pode corrigir o bug em uma única passagem.

**O app só está pronto quando o E2E Runner completa o fluxo inteiro de worker E company com ZERO erros.**

---

## 6. O Board (GitHub Projects)

### 8 Colunas

```
BACKLOG → SPEC-DONE → SPRINT → DEV → REVIEW → QA → SECURITY → DONE
```

### Sincronização Board ↔ Labels

Cada issue tem **exatamente 1 label** `stage:*` que corresponde à coluna do board. O script `move-stage.sh` atualiza AMBOS atomicamente:

```bash
bash .claude/move-stage.sh 42 "stage:review" "stage:qa" "372b4402"
#                          ↑        ↑              ↑         ↑
#                     issue#   from_label     to_label   board_option_id
```

### O que move-stage.sh faz

1. Remove TODOS os labels `stage:*` antigos (previne duplicatas)
2. Adiciona o novo label `stage:{target}`
3. Reabre o issue se estiver fechado
4. Adiciona o issue ao project (se ainda não estiver)
5. Atualiza a coluna do board via Status field
6. Verifica que a atualização funcionou

### IDs das Colunas (específicos do projeto Worki)

```
BACKLOG:    f75ad846
SPEC-DONE:  47fc9ee4
SPRINT:     98236657
DEV:        da9741af
REVIEW:     44c85ef2
QA:         372b4402
SECURITY:   f7064b23
DONE:       e7d385f5
```

---

## 7. Fluxo Completo da Pipeline

### Fluxo Normal (feature aprovada em todas as etapas)

```
1. Issue criado no BACKLOG com label stage:backlog
2. spec-agent lê → cria spec → move para SPEC-DONE
3. sprint-planner lê spec → cria task issues T1,T2,T3 → move para SPRINT
4. dev-agent pega T1 → move para DEV → implementa → push → PR → move para REVIEW
5. code-reviewer lê PR → APPROVE → move para QA
6. qa-tester checkout branch → valida ACs → SHIP → move para SECURITY
7. security-auditor audita → SHIP → cria git tag → move para DONE
8. Merge PR na main
```

### Fluxo de Rejeição (quality gate falha)

```
code-reviewer: REQUEST CHANGES → move para DEV + label rejected:review
qa-tester:     BLOCK            → move para DEV + label rejected:qa
security:      BLOCK            → move para DEV + label rejected:security

dev-agent (próxima execução):
  1. Verifica itens rejeitados PRIMEIRO (antes de novos sprints)
  2. Lê comentários do issue para entender o que corrigir
  3. Checkout da branch existente (não cria nova)
  4. Corrige APENAS os itens críticos
  5. Push na mesma branch
  6. Remove label rejected:*
  7. Move de volta para REVIEW
```

### Pipeline Completa Automatizada

Para rodar toda a pipeline de uma vez:

```
/project:run
```

Isso executa em sequência:
1. spec-agent (backlog → spec-done)
2. sprint-planner (spec-done → sprint)
3. dev-agent (sprint → review)
4. code-reviewer (review → qa ou dev)
5. qa-tester (qa → security ou dev)
6. security-auditor (security → done ou dev)

---

## 8. Comandos

### /project:audit
Roda o MVP Readiness Auditor. Escaneia o codebase inteiro, produz relatório, cria issues.

### /project:run
Roda a pipeline completa do backlog ao done.

### Execução Manual de Agentes

```bash
# Rodar um agente específico
claude --agent spec-agent
claude --agent sprint-planner
claude --agent dev-agent
claude --agent code-reviewer
claude --agent qa-tester
claude --agent security-auditor
claude --agent mvp-auditor
```

### Execução em Paralelo (via subagents)

No Claude Code, use o Agent tool com o nome do agente:

```
Use the spec-agent subagent to process all backlog items.
```

Ou diretamente com general-purpose agent:

```
You are the code-reviewer. Read .claude/agents/code-reviewer.md for instructions.
Review all issues in stage:review in {Org}/{Repo}.
```

---

## 9. move-stage.sh

### Uso

```bash
bash .claude/move-stage.sh <issue_number> <from_label> <to_label> <status_option_id>
```

### Exemplos

```bash
# Backlog → Spec Done
bash .claude/move-stage.sh 42 "stage:backlog" "stage:spec-done" "47fc9ee4"

# Sprint → Dev (dev-agent inicia trabalho)
bash .claude/move-stage.sh 42 "stage:sprint" "stage:dev" "da9741af"

# Dev → Review (dev-agent finaliza)
bash .claude/move-stage.sh 42 "stage:dev" "stage:review" "44c85ef2"

# Review → QA (code-reviewer aprova)
bash .claude/move-stage.sh 42 "stage:review" "stage:qa" "372b4402"

# Rejeição: Review → Dev
bash .claude/move-stage.sh 42 "stage:review" "stage:dev" "da9741af"

# Sync board sem mudar label (from == to)
bash .claude/move-stage.sh 42 "stage:qa" "stage:qa" "372b4402"
```

### Variáveis a Configurar

```bash
REPO="Org/repo"
PROJECT_NUMBER=1
ORG="Org"
PROJECT_ID="PVT_xxx"
STATUS_FIELD_ID="PVTSSF_xxx"
```

---

## 10. Self-Review Loop

Todos os 7 agentes incluem um **Self-Review Loop** obrigatório — uma checklist que o agente executa DEPOIS de completar cada item, antes de finalizar.

### Por que existe

Uma única passada SEMPRE deixa passar coisas. O agente fica "cego" para os próprios erros dentro do mesmo contexto. O Self-Review Loop força um segundo olhar.

### Como funciona

**Per-item loop** (após cada issue/PR):
```
1. Eu realmente li cada arquivo em FULL?
2. Eu verifiquei CADA AC contra o código?
3. Eu chequei shared state bugs?
4. Eu verifiquei CADA async path tem error handling?
5. Eu verifiquei operações financeiras server-side?
6. Eu chequei migration DOWN scripts?
7. Eu confiaria meu dinheiro neste código?

Se QUALQUER resposta é NÃO → volta e re-verifica.
```

**Session Self-Review** (após processar TODOS os itens):
```
1. Fui consistente do primeiro ao último item?
2. Apliquei o mesmo rigor no último que no primeiro? (viés de fadiga)
3. Há algum APPROVE/SHIP que não tenho 100% de confiança?

Se QUALQUER resposta é NÃO → volta e re-processa o item específico.
```

---

## 11. Regras Críticas

### Regra 1: Board Sync é Obrigatório

SEMPRE use `move-stage.sh` para transições. Ele atualiza AMBOS: label E coluna do board. Nunca atualize labels manualmente sem atualizar o board.

### Regra 2: NUNCA Use `Closes #N` em PR Body

Use `Refs #N`. GitHub auto-fecha issues quando PRs com `Closes` são mergeados. Isso remove o issue da pipeline antes de QA e Security processarem.

### Regra 3: NUNCA Feche Issues Manualmente

`gh issue close` é **PROIBIDO** para todos os agentes. Issues progridem via labels e board. O pipeline controla o ciclo de vida.

### Regra 4: Commits em Português

Todos os commits devem ser em português (pt-BR). Sem `Co-Authored-By`.

### Regra 5: QA Deve Fazer Checkout do Branch

O qa-tester DEVE fazer `git checkout {branch}` antes de testar. Testar no `main` gera falsos negativos porque o código do PR ainda não foi mergeado.

### Regra 6: logError, Nunca console.error

Em produção, `console.error` é invisível. Use `logError(error, 'Context')` de `lib/logger` para capturar no Sentry.

### Regra 7: Migrations Precisam de DOWN Script

Toda migration MEDIUM+ deve incluir `-- DOWN (rollback):` com SQL exato para reverter. Sem DOWN script → security-auditor BLOQUEIA.

### Regra 8: Rejeitados Primeiro

O dev-agent sempre processa itens rejeitados (`rejected:*`) ANTES de pegar novos itens do sprint.

---

## 12. Troubleshooting

### Board desincronizado

```bash
# Auditoria completa: compara labels vs colunas do board
gh project item-list 1 --owner {ORG} --format json --limit 300 > board.json
gh issue list --repo {ORG}/{REPO} --state open --json number,labels --limit 200 > issues.json
# Comparar com script Python e corrigir mismatches
```

### move-stage.sh não encontrado

O OneDrive pode reverter arquivos. Solução:
```bash
# Extrair do git
git show main:.claude/move-stage.sh > ~/move-stage.sh
bash ~/move-stage.sh {args}
```

### Rate limit do GitHub

Os agentes fazem muitas chamadas API. Se atingir o limite:
```bash
gh api rate_limit --jq '.resources.graphql | "Remaining: \(.remaining)/\(.limit)"'
# Esperar reset (1h) ou reduzir paralelismo
```

### PRs com conflito de merge

Após mergear vários PRs, os próximos podem conflitar:
```bash
git checkout {branch}
git fetch origin && git rebase origin/main
# Resolver conflitos
git push origin {branch} --force-with-lease
gh pr merge {N} --squash --delete-branch
```

### Issues fechados automaticamente

Se um PR com `Closes #N` foi mergeado, o issue fecha. Solução:
```bash
gh issue reopen {N} --repo {ORG}/{REPO}
bash .claude/move-stage.sh {N} "stage:done" "stage:done" "e7d385f5"
```

---

## 13. Como Usar em Outro Chat (Contexto Zero)

Quando abrir um **novo chat do Claude Code** sem contexto prévio, cole este prompt:

```
Leia os seguintes arquivos para entender a pipeline de agentes do projeto:

1. CLAUDE.md (raiz do projeto) — contexto do projeto
2. docs/PIPELINE.md — documentação completa da pipeline
3. .claude/pipeline-config.md — IDs do GitHub Projects
4. .claude/move-stage.sh — script de sincronização

Depois leia o agente que preciso rodar:
- .claude/agents/{nome-do-agente}.md

Execute o agente seguindo as instruções do arquivo.
Use `bash .claude/move-stage.sh` para TODAS as transições de stage.
Use `Refs #N` (nunca Closes) em PR bodies.
O qa-tester deve fazer checkout do branch do PR antes de testar.
```

### Prompt para Rodar Pipeline Completa

```
Leia docs/PIPELINE.md e .claude/pipeline-config.md.

Rode a pipeline completa em sequência:
1. Rode spec-agent (leia .claude/agents/spec-agent.md) em todos os stage:backlog
2. Rode sprint-planner (leia .claude/agents/sprint-planner.md) em todos os stage:spec-done
3. Rode dev-agent (leia .claude/agents/dev-agent.md) em todos os stage:sprint
4. Rode code-reviewer (leia .claude/agents/code-reviewer.md) em todos os stage:review
5. Rode qa-tester (leia .claude/agents/qa-tester.md) em todos os stage:qa
6. Rode security-auditor (leia .claude/agents/security-auditor.md) em todos os stage:security

Após cada etapa, sincronize o board com move-stage.sh.
Se houver rejeições, rode dev-agent nos rejeitados e repita review→QA→security.
Continue em loop até que DEV, REVIEW, QA e SECURITY estejam todos vazios.
```

### Prompt para Rodar um Agente Específico

```
Leia .claude/agents/{agente}.md e .claude/pipeline-config.md.
Processe todos os issues em stage:{stage} no repo {Org}/{Repo}.
Use bash .claude/move-stage.sh para todas as transições.
```

---

## 14. Referência Técnica

### Tabela de Agentes

| # | Agente | Modelo | Stage In | Stage Out | Arquivo |
|---|--------|--------|----------|-----------|---------|
| 0 | mvp-auditor | opus | (codebase) | backlog | mvp-auditor.md (823 linhas) |
| 1 | spec-agent | sonnet | backlog | spec-done | spec-agent.md (442 linhas) |
| 2 | sprint-planner | sonnet | spec-done | sprint | sprint-planner.md (496 linhas) |
| 3 | dev-agent | opus | sprint/dev | review | dev-agent.md (779 linhas) |
| 4 | code-reviewer | sonnet | review | qa/dev | code-reviewer.md (626 linhas) |
| 5 | qa-tester | sonnet | qa | security/dev | qa-tester.md (595 linhas) |
| 6 | security-auditor | sonnet | security | done/dev | security-auditor.md (611 linhas) |
| 7 | e2e-runner | opus | (app rodando) | backlog (bugs) | e2e-runner.md |

### Status Option IDs (GitHub Projects)

```
BACKLOG:    f75ad846
SPEC-DONE:  47fc9ee4
SPRINT:     98236657
DEV:        da9741af
REVIEW:     44c85ef2
QA:         372b4402
SECURITY:   f7064b23
DONE:       e7d385f5
```

### Labels

```
# Stages (8)
stage:backlog, stage:spec-done, stage:sprint, stage:dev,
stage:review, stage:qa, stage:security, stage:done

# Rejections (3)
rejected:review, rejected:qa, rejected:security

# Priority (4)
P0-critical, P1-high, P2-medium, P3-low

# Type (3)
type:feature, type:bugfix, type:tech-debt
```

### Artefatos por Agente

| Agente | Lê | Escreve | Board Action |
|--------|-----|---------|-------------|
| spec-agent | Issue body | `docs/specs/FEAT-NNN-name.md` | backlog → spec-done |
| sprint-planner | Spec file | GitHub Task Issues | spec-done → sprint |
| dev-agent | Task issue | Code files + PR | sprint → dev → review |
| code-reviewer | PR diff + spec | PR review comment | review → qa ou dev |
| qa-tester | Spec + code (branch) | `docs/qa/FEAT-NNN-TN.md` | qa → security ou dev |
| security-auditor | PR diff + code | `docs/security/FEAT-NNN-TN.md` + git tag | security → done ou dev |
| e2e-runner | App rodando (browser) | `docs/e2e/E2E-RUN-REPORT.md` + issues | — (cria bugs no backlog) |

### Diagrama de Fluxo

```
                    ┌──────────────┐
                    │   BACKLOG    │ ← Issues criados (manual ou mvp-auditor)
                    └──────┬───────┘
                           │ spec-agent
                           v
                    ┌──────────────┐
                    │  SPEC-DONE   │ ← Spec escrita em docs/specs/
                    └──────┬───────┘
                           │ sprint-planner
                           v
                    ┌──────────────┐
                    │   SPRINT     │ ← Task issues T1, T2, T3 criados
                    └──────┬───────┘
                           │ dev-agent (claims → DEV)
                           v
                    ┌──────────────┐
                    │     DEV      │ ← Código sendo implementado
                    └──────┬───────┘
                           │ dev-agent (push PR → REVIEW)
                           v
                    ┌──────────────┐
              ┌────►│   REVIEW     │
              │     └──────┬───────┘
              │            │ code-reviewer
              │            ├──── APPROVE ────────────────┐
              │            │                             v
              │     rejected:review              ┌──────────────┐
              │            │               ┌────►│      QA      │
              │            v               │     └──────┬───────┘
              │     ┌──────────────┐       │            │ qa-tester
              └─────│     DEV      │       │            ├──── SHIP ──────────────┐
                    └──────────────┘       │            │                        v
                           ▲               │     rejected:qa             ┌──────────────┐
                           │               │            │          ┌────►│  SECURITY    │
                           │               │            v          │     └──────┬───────┘
                           │               │     ┌──────────────┐  │            │ security-auditor
                           │               └─────│     DEV      │  │            ├──── SHIP ──────┐
                           │                     └──────────────┘  │            │                v
                           │                            ▲          │     rejected:security ┌──────────┐
                           │                            │          │            │          │   DONE   │
                           │                            │          │            v          └──────────┘
                           │                            │          │     ┌──────────────┐
                           └────────────────────────────┘          └─────│     DEV      │
                                                                        └──────────────┘
```

---

## Changelog

- **v3.0** (2026-03-16): Pipeline completa com 7 agentes, Self-Review Loop, board sync robusto
- **v2.0** (2026-03-15): Adicionado DEV stage, move-stage.sh, Self-Review Loop
- **v1.0** (2026-03-14): Pipeline inicial com 5 agentes (sem dev-agent, sem mvp-auditor)
