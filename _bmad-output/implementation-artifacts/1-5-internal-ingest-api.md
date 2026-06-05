---
baseline_commit: d3d71159f62ba0fab764cf960000a25c79540ff2
story_key: 1-5-internal-ingest-api
---

# Story 1.5: API de ingestão protegida e observabilidade

Status: done

## Story

Como operador,
quero disparar e consultar ingestão via HTTP com segurança,
para que possa indexar o acervo em deploy público sem abuso.

## Acceptance Criteria

1. **AC1** — `POST /api/internal/ingest` + `X-Ingest-Secret` válido → `202` + `{ jobId }`; job em background (FR-1).
2. **AC2** — Sem secret ou secret inválido → `401` (NFR-5).
3. **AC3** — `GET /api/internal/ingest/:jobId` retorna status, contadores e erros por episódio (FR-5).
4. **AC4** — Body opcional `youtubeVideoIds`; senão usa `CHOQUE_YOUTUBE_CHANNEL_URL` + `listOldestVideoIds` (default limit 10).
5. **AC5** — `force: true` repassa ao pipeline; idempotência documentada (skip sem force).
6. **AC6** — Rotas internas omitidas do Swagger quando `SWAGGER_EXPOSE_INTERNAL=false` (default).
7. **AC7** — `INGEST_SECRET` obrigatório em `EnvService`; testes do guard e service.

## Tasks / Subtasks

- [x] Task 1–5 (implementação)

### Review Findings

- [x] [Review][Patch] Deduplicar `youtubeVideoIds` antes do pipeline
- [x] [Review][Patch] Body vazio aceito (`startIngestSchema.default({})`)
- [x] [Review][Defer] Teste HTTP do controller — guard + service cobrem; e2e ingest opcional depois

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve (após patches)

### Action Items

- [x] **[Patch]** `Set` para IDs duplicados em `resolveVideoIds`.
- [x] **[Info]** `GET` lista episódios com `ingestionJobId` = job consultado (último job de cada vídeo pode “migrar” o vínculo).
- [x] **[Info]** Erro de secret → `401` (épico aceita 401 ou 403).

### AC Coverage

| AC | Status | Evidência |
|----|--------|-----------|
| AC1 | OK | `IngestionController` POST 202; `void pipeline.runJob` |
| AC2 | OK | `IngestSecretGuard` + testes |
| AC3 | OK | `getJobStatus` + `episodes.lastIngestError` |
| AC4 | OK | DTO + `listOldestVideoIds` + env channel URL |
| AC5 | OK | `force` no DTO → pipeline |
| AC6 | OK | `main.ts` remove paths `/api/internal` |
| AC7 | OK | `INGEST_SECRET` + specs |

## Dev Notes

- Disparo com IDs: `POST /api/internal/ingest` + header `X-Ingest-Secret`.
- Canal automático: `CHOQUE_YOUTUBE_CHANNEL_URL` + body `{}` ou `{"limit":5}`.

## Dev Agent Record

### Completion Notes List

- API interna protegida; worker fire-and-forget com fallback `FAILED`.
- Review: dedupe de IDs + body vazio.
- **2026-06-05:** Logs de etapa no pipeline (`jobLog`) complementam FR-5 (GET status); ver também `LOG_LEVEL` + `LoggingInterceptor` em `architecture.md`.
- 43 testes no backend.

### File List

- packages/backend/src/core/env.service.ts
- packages/backend/src/main.ts
- packages/backend/src/shared/infrastructure/guards/ingest-secret.guard.ts
- packages/backend/src/shared/infrastructure/guards/ingest-secret.guard.spec.ts
- packages/backend/src/modules/ingestion/ingestion.controller.ts
- packages/backend/src/modules/ingestion/ingestion.service.ts
- packages/backend/src/modules/ingestion/ingestion.service.spec.ts
- packages/backend/src/modules/ingestion/dto/start-ingest.dto.ts
- packages/backend/src/modules/ingestion/dto/ingest-job-id.dto.ts
- packages/backend/src/modules/ingestion/youtube-video-id.ts
- packages/backend/src/modules/ingestion/ingestion.module.ts
- packages/backend/src/modules/ingestion/yt-dlp.service.ts
- packages/backend/jest.config.js
- packages/backend/test/jest.env-setup.ts
- .env.example

## Change Log

- 2026-06-03: Story 1.5 implementada.
- 2026-06-03: Code review — Approve com patches.
