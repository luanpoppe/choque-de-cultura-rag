---
baseline_commit: 1b1abca3a642b7e255719ee1a08c43689b2ac3d9
story_key: 1-3-schema-episode-ingestion-job
---

# Story 1.3: Schema de episódios e jobs de ingestão

Status: done

## Story

Como operador,
quero episódios e execuções de ingestão modelados no banco,
para que cada vídeo e cada run tenham status rastreável.

## Acceptance Criteria

1. **AC1** — Models `Episode` e `IngestionJob` no Prisma com `@@map` (tabelas `episodes`, `ingestion_jobs`).
2. **AC2** — `Episode`: `youtubeVideoId` único, `title`, `watchUrl`, `durationSec`, `publishedAt`.
3. **AC3** — `IngestionJob`: `status`, `successCount`, `failureCount`, `createdAt`, `startedAt`, `completedAt`.
4. **AC4** — Relação `IngestionJob` 1:N `Episode` (`Episode.ingestionJobId` opcional).
5. **AC5** — Migration aplicável via `prisma migrate deploy`; `prisma generate` ok.
6. **AC6** — Testes de contrato do schema (campos e relação documentados).

## Tasks / Subtasks

- [x] Task 1: Models Prisma (AC: 1–4)
  - [x] Subtask 1.1: Enums `IngestionJobStatus`
  - [x] Subtask 1.2: `IngestionJob` + `Episode` com `@map` snake_case
- [x] Task 2: Migration (AC: 5)
  - [x] Subtask 2.1: `prisma/migrations/20260603180000_episode_ingestion_job/migration.sql`
  - [x] Subtask 2.2: `pnpm prisma:generate` e `prisma:migrate`
- [x] Task 3: Testes (AC: 6)
  - [x] Subtask 3.1: `schema-models.spec.ts`
  - [x] Subtask 3.2: `pnpm test` e lint

### Review Findings

- [x] [Review][Defer] `updated_at` sem DEFAULT no SQL — Prisma preenche via `@updatedAt`; raw SQL na 1.4 deve usar client
- [x] [Review][Defer] Erros por episódio (FR-5 / story 1.5) — sem `lastError` ainda; planejar em 1.4 ou 1.5

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve

### Action Items

- [x] **[Info]** FR-5 (erros por episódio na API) exigirá campos extras na 1.4/1.5 — fora do escopo desta story.
- [x] **[Info]** `Episode.ingestionJobId` guarda apenas o último job — adequado para PoC com idempotência por `youtubeVideoId`.

### AC Coverage

| AC | Status | Evidência |
|----|--------|-----------|
| AC1 | OK | `@@map("episodes")`, `@@map("ingestion_jobs")` |
| AC2 | OK | `youtubeVideoId` @unique, title, watchUrl, durationSec, publishedAt |
| AC3 | OK | status enum + contadores + timestamps |
| AC4 | OK | `episodes Episode[]` + FK opcional `onDelete: SetNull` |
| AC5 | OK | Migration aplicada; client gerado |
| AC6 | OK | `schema-models.spec.ts` (3 testes) |

### Pontos fortes

- Naming alinhado à arquitetura (camelCase Prisma → snake_case DB).
- Enum `IngestionJobStatus` cobre ciclo de vida do worker.
- Índice em `ingestion_job_id` para consultas por job.
- `onDelete: SetNull` evita perder episódios ao remover job.

## Dev Notes

- `Chunk` e coluna `vector` entram na story **1.4**, não nesta.
- Naming: camelCase no Prisma, snake_case no Postgres ([architecture.md#Naming Patterns]).
- `watchUrl` = URL `https://www.youtube.com/watch?v={id}`.

## Dev Agent Record

### Completion Notes List

- Models `Episode` e `IngestionJob` com enum `IngestionJobStatus` e relação 1:N.
- Migration aplicada no Postgres local (6017).
- Code review: Approve — sem patches obrigatórios.

### File List

- packages/backend/prisma/schema.prisma
- packages/backend/prisma/migrations/20260603180000_episode_ingestion_job/migration.sql
- packages/backend/src/shared/infrastructure/prisma/schema-models.spec.ts
- packages/backend/src/generated/prisma/ (gerado)
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-06-03: Story 1.3 implementada.
- 2026-06-03: Code review — Approve.
