---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - prds/prd-choque-de-cultura-rag-2026-06-03/prd.md
  - prds/prd-choque-de-cultura-rag-2026-06-03/addendum.md
  - briefs/brief-choque-de-cultura-rag-2026-06-03/brief.md
  - briefs/brief-choque-de-cultura-rag-2026-06-03/addendum.md
  - ux-designs/ux-choque-de-cultura-rag-2026-06-03/DESIGN.md
  - ux-designs/ux-choque-de-cultura-rag-2026-06-03/EXPERIENCE.md
  - ../project-context.md
workflowType: architecture
project_name: choque-de-cultura-rag
user_name: Luan
date: 2026-06-03
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

20 FRs em quatro domínios mapeiam para módulos NestJS + SPA Next.js:

- **Ingestão (FR-1–5):** `POST` protegido dispara job assíncrono; pipeline YouTube → áudio → Whisper (API) → chunks ~60s com overlap 10–15% → embeddings → Postgres/pgvector. Falhas isoladas por episódio; status e logs consultáveis (operador).
- **Chat RAG (FR-6–11):** API REST; agente via `@luanpoppe/ai` + OpenRouter; resposta com `citations[]` para Citation Cards; multi-turn com `history` enviado pelo client (`localStorage`).
- **Guardrails (FR-12):** domínio Choque de Cultura; off-topic sem citações fabricadas.
- **Onboarding (FR-13–16):** sugestões derivadas do vector store; chips clicáveis.
- **Interface (FR-17–20):** chat distintivo (DESIGN.md / EXPERIENCE.md), tema + sessão em `localStorage`, link GitHub.

**Non-Functional Requirements:**

- Demo **pública desde o início** — ingestão nunca aberta; rate limit no chat; secrets só server-side.
- Custo: modelos econômicos (embedding + LLM + Whisper API barata); evitar reprocessamento.
- Latência de chat ~15s p95 (assumido) — UI com loading tolerante.
- PT-BR; WCAG 2.2 AA alvo; posicionamento legal: demo educacional/pessoal documentada.

**Scale & Complexity:**

- Primary domain: full-stack web + pipeline RAG
- Complexity: **média**
- Componentes estimados: ~8–10 (ingestão, transcrição, vector store, agente, APIs chat/onboarding, frontend, config)
- Volume v1: ~5–10 episódios — correção do desenho importa mais que escala

### Technical Constraints & Dependencies

**Stack brownfield:** monorepo pnpm, NestJS 11, Next.js 15 App Router, Tailwind, Zod, `@luanpoppe/ai` (a instalar).

**Decisões de arquitetura confirmadas (2026-06-03 — Luan):**

| Área | Decisão |
|---|---|
| Deploy | URL pública desde o início |
| Vector store | **PostgreSQL + pgvector** (Docker local; gerenciado em prod) |
| Chunking | **~60 s** de fala, **overlap 10–15%**; `start_sec` / `end_sec` obrigatórios por chunk |
| Redis | **Não na v1** — jobs/status de ingestão no Postgres; worker in-process no Nest |
| Ingestão | Header **`X-Ingest-Secret`**; `202 Accepted` + `jobId`; status em endpoint interno |
| Whisper | **API paga de baixo custo** (ex. OpenAI `whisper-1`); áudio temporário; sem Whisper local na v1 |
| Histórico chat | Client envia `history`; persistência em `localStorage` |
| ORM | **Prisma** (versão mais recente estável — **7.8.0**) no backend |

**Ainda a detalhar na implementação:** modelos exatos OpenRouter (embedding + chat); valores numéricos finais de rate limit.

**Integrações:** YouTube (metadados + áudio), Whisper API, OpenRouter via `@luanpoppe/ai`, Postgres/pgvector.

### Cross-Cutting Concerns Identified

1. Metadados temporais end-to-end (chunk → retrieval → link YouTube `?t=`)
2. `@luanpoppe/ai` como única porta de IA (embeddings + geração)
3. Guardrails + flags `noMatch` / `offTopic` no contrato da API de chat
4. Segurança em demo pública (ingest secret, rate limit, CORS explícito)
5. Idempotência de ingestão por `youtube_video_id`
6. Observabilidade de jobs de ingestão no Postgres
7. Validação Zod em chat e ingestão
8. Mapeamento de tokens DESIGN.md → Tailwind no frontend

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web **brownfield**: API NestJS 11 + SPA Next.js 15 (App Router), monorepo pnpm. Pipeline RAG com Postgres/pgvector.

### Starter Options Considered

| Opção | Veredito |
|---|---|
| `nest new` + `create-next-app` | **Rejeitado** — repositório já scaffolded |
| Starters full-stack alternativos (T3, etc.) | **Rejeitado** — stack fixa Nest + Next no brief |
| **Monorepo existente** | **Selecionado** |

Versões em uso (2026-06-03): NestJS **^11.1.24**, Next.js **15.5.19** — alinhadas ao estável mais recente verificado.

### Selected Starter: Monorepo pnpm existente

**Rationale:** Brownfield alinhado ao PRD; Zod, `EnvService`, aliases `@modules/*` já estabelecidos.

**Primeira story de implementação (não recriar apps):**

```bash
docker compose up -d   # Postgres 16 + pgvector — pgvector/pgvector:pg16

pnpm add prisma @prisma/client --filter @choque-de-cultura-rag/backend -D prisma@7.8.0
pnpm add @prisma/client@7.8.0 --filter @choque-de-cultura-rag/backend
pnpm add @luanpoppe/ai --filter @choque-de-cultura-rag/backend

npx prisma init --schema packages/backend/prisma/schema.prisma
```

Após subir DB: `CREATE EXTENSION IF NOT EXISTS vector;` (migration Prisma).

**Decisões já fornecidas pelo starter:** TypeScript, Nest modular, Zod global, Next App Router, Tailwind 3, Jest backend, axios + react-hot-toast no front.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (bloqueiam implementação):**

- Postgres + pgvector + Prisma 7.8.0
- Módulos de domínio no Nest (`ingestion`, `chat`, `episodes`, `vector` / `rag`)
- Contrato API de chat com `citations[]`
- Proteção de ingestão (`X-Ingest-Secret`)
- `@luanpoppe/ai` para embeddings, geração e roteamento Whisper

**Important (formato da arquitetura):**

- TypedSQL / `$queryRaw` para busca por similaridade (pgvector sem tipo nativo Prisma ainda)
- Worker in-process para jobs de ingestão
- Rate limit no chat; CORS explícito
- Deploy: front Vercel + back container + Postgres gerenciado

**Deferred (pós-MVP):**

- Redis / fila externa
- Re-ranking de chunks
- Speaker diarization (FR-9 stretch)
- Histórico server-side; player embutido

### Data Architecture

| Decisão | Escolha | Rationale |
|---|---|---|
| Database | **PostgreSQL 16 + pgvector** | Decisão Luan; Docker local `pgvector/pgvector:pg16` |
| ORM | **Prisma 7.8.0** (`prisma` + `@prisma/client` alinhados) | Preferência explícita Luan; migrations e type-safety |
| Vector search | **Migration SQL** `CREATE EXTENSION vector` + coluna `embedding` como `Unsupported("vector")` ou tabela gerida via migration raw; queries via **TypedSQL** ou `$queryRaw` com operador `<=>` | Prisma ainda não mapeia `vector` em schema de primeira classe; padrão oficial documentado |
| Modelagem (conceitual) | `Episode`, `Chunk` (texto, `start_sec`, `end_sec`, embedding), `IngestionRun` / `IngestionJob` (status, erros) | Suporta FR-1–5, idempotência por `youtube_video_id` |
| Chunking | **~60 s**, overlap **10–15%** | Decisão Luan; metadados temporais obrigatórios |
| Validação API | **Zod DTOs** (`nestjs-zod`) na borda HTTP; Prisma no persistence layer | Convenção existente do repo |
| Cache | **Nenhum na v1** | Volume baixo; YAGNI |
| Migrations | **Prisma Migrate** | Versionamento de schema + SQL customizado para pgvector |

**Nota implementação:** dimensão do `vector(n)` fixada na primeira migration conforme modelo de embedding escolhido (ex. 1536); trocar modelo = nova migration + reindex.

### Authentication & Security

| Decisão | Escolha | Rationale |
|---|---|---|
| Auth usuário | **Nenhuma na v1** | PRD; scaffold signup/profile ignorado/removido |
| Ingestão | **Guard `IngestSecretGuard`** — header `X-Ingest-Secret` vs `INGEST_SECRET` em `EnvService` | URL pública; endpoint caro |
| Chat | **Rate limiting** — `@nestjs/throttler` ou middleware; alvo ~15–30 req/min/IP (ajustar na implementação) | Abuso de OpenRouter |
| Secrets | **`EnvService` + Zod** — nunca `process.env` solto | project-context |
| CORS | Origens allowlist (`FRONTEND_URL`) | Deploy split front/back |
| Swagger | Documentar rotas públicas; rotas `/internal/*` omitidas ou protegidas em produção | Reduz superfície |

### API & Communication Patterns

| Decisão | Escolha | Rationale |
|---|---|---|
| Estilo | **REST JSON** | Simplicidade PoC; axios no front |
| Documentação | **Swagger** em `/api` | Convenção backend existente |
| Prefixo | `/api` global (existente) | Consistência scaffold |
| Erros | HTTP status semântico + body `{ message, code? }`; toasts no front | EXPERIENCE.md |
| Chat `POST /api/chat` | Ver contrato abaixo | Citation Cards inline |
| Onboarding `POST /api/onboarding/suggestions` | Retorna `{ suggestions: string[] }` do acervo | FR-14–15 |
| Ingestão `POST /api/internal/ingest` | `202` + `{ jobId }`; `GET /api/internal/ingest/:jobId` | Assíncrono + status |
| Ingest status/logs | `GET /api/internal/ingest/:jobId` (mesmo secret) | FR-5 |
| IA | **`@luanpoppe/ai` apenas** | project-context |

**Contrato `POST /api/chat` (v1):**

```typescript
// Request
{ message: string; history?: { role: 'user' | 'assistant'; content: string }[] }

// Response
{
  reply: string;
  citations: {
    episodeTitle: string;
    youtubeVideoId: string;
    startSec: number;
    durationSec?: number;
    quote: string;
    thumbnailUrl?: string;
    speaker?: string;
    context?: string;
  }[];
  noMatch?: boolean;
  offTopic?: boolean;
}
```

**Retrieval:** top-k **6** chunks (default); sem re-rank na v1.

### Frontend Architecture

| Decisão | Escolha | Rationale |
|---|---|---|
| Rota principal | **`/`** — chat único | EXPERIENCE.md |
| Estado servidor | **Nenhum** (sem React Query obrigatório na v1) | PoC simples |
| Sessão / tema | **`localStorage`** | FR-18, FR-19 |
| HTTP | **axios** + `useIsLoading` | project-context |
| UI | Componentes custom + **tokens Tailwind** derivados de DESIGN.md | UX aprovado Modern Soft |
| Páginas legadas | **Remover ou não linkar** `signup`, `profile` | Fora do escopo |

### Infrastructure & Deployment

| Decisão | Escolha | Rationale |
|---|---|---|
| Ambiente | **URL pública desde o início** | Decisão Luan |
| Frontend | **Vercel** (Next.js) | Padrão ecossistema |
| Backend | **Railway / Render / Fly** — container Nest | WebSocket não necessário v1 |
| Database prod | **Postgres gerenciado com pgvector** (Neon, Supabase, Railway) | Mesmo schema Prisma |
| Local dev | **docker-compose.yml** na raiz — Postgres apenas | Sem Redis v1 |
| Portas dev | Backend **3000**, frontend **3001** | Evitar conflito project-context |
| CI | Lint + test + build (definir em story); deploy manual aceitável na PoC | YAGNI |

### Decision Impact Analysis

**Sequência sugerida de implementação:**

1. `docker-compose` + Prisma schema/migrations (pgvector)
2. `PrismaModule` + repositórios no Nest
3. `@luanpoppe/ai` + `EnvService` vars
4. Pipeline ingestão (job + worker in-process)
5. Vector search (TypedSQL) + agente RAG
6. APIs chat + onboarding + guards
7. Frontend chat (substituir `page.tsx` scaffold)
8. Deploy + ingestão dos 5–10 episódios + smoke tests (SM-1–3)

**Dependências cruzadas:**

- Dimensão embedding → migration `vector(n)` → serviço de embed
- `youtube_video_id` único → idempotência ingestão
- Contrato `citations[]` → formato URL YouTube (`?t=startSec`) no front

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

12 áreas onde agentes poderiam divergir: naming DB/API/código, localização de módulos, formato JSON, erros HTTP, Prisma vs raw SQL, guards, env vars, testes, imports com aliases, URLs YouTube, loading UI, logs de ingestão.

### Naming Patterns

**Database (Prisma):**

- Tabelas: **PascalCase** no schema Prisma → mapeadas para **snake_case** no Postgres via `@@map("episodes")`
- Colunas: **camelCase** no Prisma → **snake_case** no DB via `@map("youtube_video_id")`
- Exemplo: `model Episode { youtubeVideoId String @unique @map("youtube_video_id") ... @@map("episodes") }`

**API:**

- Rotas: **kebab-case**, plural onde coleção — `POST /api/chat`, `POST /api/internal/ingest`, `GET /api/internal/ingest/:jobId`, `POST /api/onboarding/suggestions`
- JSON: **camelCase** (alinhado ao TypeScript front/back)
- Headers custom: **Pascal-Case HTTP** — `X-Ingest-Secret`

**Code:**

- Arquivos backend: **kebab-case** — `ingest-secret.guard.ts`, `chat.service.ts`
- Classes Nest: **PascalCase** — `ChatService`, `IngestionModule`
- Componentes React: **PascalCase** — `CitationCard.tsx`
- Hooks: **camelCase** com `use` — `useChatSession.ts`
- Constantes env: **SCREAMING_SNAKE** no schema Zod do `EnvService`

### Structure Patterns

**Backend (`packages/backend/src/`):**

```
modules/
  prisma/           # PrismaService global
  ingestion/        # pipeline, job worker, controllers internal
  episodes/         # metadados YouTube
  chunks/           # persistência + vector search (TypedSQL)
  rag/              # agente, retrieval, guardrails
  chat/             # ChatController, DTOs Zod
  onboarding/       # sugestões do acervo
core/               # EnvService, guards compartilhados (existente)
```

- DTOs Zod: `modules/<feature>/dto/*.dto.ts` com `createZodDto`
- TypedSQL: `prisma/sql/*.sql` + `prisma generate --sql`
- Testes: `*.spec.ts` **co-localizados** com o arquivo testado (padrão atual)
- **Proibido:** `class-validator`, `process.env` direto em services

**Frontend (`packages/frontend/src/`):**

```
app/
  page.tsx              # chat único
  layout.tsx
components/
  chat/                 # ChatShell, MessageBubble, Composer
  citation/             # CitationCard
  onboarding/           # OnboardingCta, SuggestionChips
lib/
  api/                  # axios client, chatApi.ts
  storage/              # localStorage session + theme
  youtube.ts            # buildWatchUrl(videoId, startSec)
utils/custom-hooks/     # useIsLoading (existente)
```

- Remover ou não referenciar `app/signup`, `app/profile`

### Format Patterns

**API responses:**

- Sucesso: corpo direto (sem wrapper `{ data }`) — ex. `{ reply, citations }`
- Erro: `{ message: string; code?: string }` + HTTP status adequado
- Datas: **ISO 8601** strings em JSON

**Chat flags:** `noMatch` e `offTopic` **mutuamente exclusivos** com `citations: []`

**YouTube URL:** `https://www.youtube.com/watch?v={youtubeVideoId}&t={startSec}s`

### Communication Patterns

- Front → Back: **apenas REST** via `lib/api`; base URL de `NEXT_PUBLIC_API_URL`
- Back → IA: **somente** `@luanpoppe/ai`
- Back → DB: **Prisma** para CRUD; **TypedSQL / `$queryRaw`** apenas para similarity search pgvector
- Sem event bus / WebSockets na v1

### Process Patterns

**Loading:** `useIsLoading` + composer desabilitado durante `POST /api/chat`; toast em erro via `react-hot-toast`

**Ingestão:** fire-and-forget após `202`; operador consulta `GET /api/internal/ingest/:jobId`

**Validação:** Zod na borda HTTP; regras de negócio (ex. acervo vazio) no service com mensagens PT-BR

**Logs:** Nest `Logger` com contexto `[IngestionJob:{id}]`, `[Episode:{youtubeVideoId}]`

### Enforcement Guidelines

**All AI Agents MUST:**

- Registrar novos domínios em `AppModule` e `EnvService` quando adicionar env vars
- Manter contrato `citations[]` estável com o front
- Não chamar OpenAI/OpenRouter diretamente — usar `@luanpoppe/ai`
- Documentar endpoints novos no Swagger (exceto internal em prod se omitido)
- Seguir `project-context.md` e este `architecture.md` em conflito com improviso

**Anti-patterns:**

- Inventar Citation Card sem chunk no vector store
- Expor `INGEST_SECRET` no frontend
- Lógica RAG no Next.js server actions (tudo no Nest)

### Pattern Examples

**Good:** `ChunkRepository.searchSimilar(embedding, k=6)` encapsula TypedSQL.

**Bad:** SQL de vector espalhado em `ChatService` e `OnboardingService` duplicado.

## Project Structure & Boundaries

### Complete Project Directory Structure

```
choque-de-cultura-rag/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── sql/                    # TypedSQL (semanticSearch.sql)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── core/
│   │   │   │   ├── core.module.ts
│   │   │   │   ├── env.service.ts
│   │   │   │   ├── swagger.config.ts
│   │   │   │   └── guards/
│   │   │   │       └── ingest-secret.guard.ts
│   │   │   └── modules/
│   │   │       ├── prisma/
│   │   │       ├── ingestion/
│   │   │       ├── episodes/
│   │   │       ├── chunks/
│   │   │       ├── rag/
│   │   │       ├── chat/
│   │   │       └── onboarding/
│   │   └── test/
│   │       └── *.e2e-spec.ts
│   └── frontend/
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   └── globals.css
│           ├── components/
│           │   ├── chat/
│           │   ├── citation/
│           │   └── onboarding/
│           └── lib/
│               ├── api/
│               └── storage/
└── _bmad-output/
    └── planning-artifacts/
        └── architecture.md
```

### Architectural Boundaries

**API (público):** `POST /api/chat`, `POST /api/onboarding/suggestions` — sem auth; throttled.

**API (interno):** `/api/internal/ingest*` — `IngestSecretGuard` only.

**Frontend:** sem acesso a DB/IA; só HTTP + `localStorage`.

**Data:** Postgres exclusivo do backend; Prisma Client singleton no `PrismaModule`.

### Requirements to Structure Mapping

| FR / área | Localização |
|---|---|
| FR-1–5 Ingestão | `modules/ingestion`, `modules/episodes`, `prisma` |
| FR-6–11 Chat RAG | `modules/chat`, `modules/rag`, `modules/chunks` |
| FR-12 Guardrails | `modules/rag` (prompt + pós-validação) |
| FR-13–16 Onboarding | `modules/onboarding`, `components/onboarding` |
| FR-17–20 UI | `app/page.tsx`, `components/chat`, `lib/storage` |

### Integration Points

| De | Para | Protocolo |
|---|---|---|
| Browser | Nest | HTTPS REST JSON |
| Nest | Postgres | Prisma + TypedSQL |
| Nest | OpenRouter/Whisper | `@luanpoppe/ai` |
| Nest | YouTube | yt-dlp / API (ingestion service) |

### Data Flow (pergunta no chat)

1. Front `POST /api/chat` com `message` + `history`
2. `ChatService` → embed query → `ChunkRepository.searchSimilar`
3. `RagService` → LLM com contexto + guardrails
4. Response `{ reply, citations }` → Front renderiza bubbles + CitationCards
