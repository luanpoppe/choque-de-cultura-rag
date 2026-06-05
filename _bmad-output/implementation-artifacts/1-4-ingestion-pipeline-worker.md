---
baseline_commit: d3d71159f62ba0fab764cf960000a25c79540ff2
story_key: 1-4-ingestion-pipeline-worker
---

# Story 1.4: Pipeline de ingestão (metadados, áudio, Whisper, chunks)

Status: done

## Story

Como operador,
quero o pipeline que processa um lote de episódios de ponta a ponta,
para que transcrições viram chunks embedados no vector store.

## Acceptance Criteria

1. **AC1** — Dado job `RUNNING`, worker processa lote de `youtubeVideoIds` e persiste metadados YouTube (FR-2).
2. **AC2** — Áudio extraído via yt-dlp; transcrito via `AiService.transcribeWithWhisper` (FR-3).
3. **AC3** — Falha em um episódio registra motivo em `Episode.lastIngestError` e não bloqueia os demais (FR-3).
4. **AC4** — Transcrição segmentada em chunks (política atual: zona fina + janelas 30s — ver story 1.6); `startSec`/`endSec` persistidos (FR-4).
5. **AC5** — Embeddings via `AiService.embedDocuments` persistidos em `Chunk` com coluna `vector(1536)` (FR-4).
6. **AC6** — `ChunkRepository.searchSimilar` usa `$queryRaw` com operador pgvector `<=>` (FR-4).
7. **AC7** — Arquivo de áudio temporário removido após transcrição (sucesso ou falha).
8. **AC8** — Testes unitários: chunking, pipeline (mocks), repositório vector (mock).

## Tasks / Subtasks

- [x] Task 1–5 (implementação original)
- [x] Review fixes: lote vazio, validação de embeddings, `listOldestVideoIds` (base 1.5)

### Review Findings

- [x] [Review][Patch] Validar contagem de embeddings antes de persistir chunks
- [x] [Review][Patch] Completar job quando `youtubeVideoIds` está vazio
- [x] [Review][Defer] Timestamps proporcionais (sem segmentos Whisper) — documentado
- [x] [Review][Defer] Insert de chunks não transacional — aceito na PoC

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve (após patches)

## Dev Agent Record

### Completion Notes List

- Pipeline worker + vector store + yt-dlp por vídeo.
- Review: patches de validação e job vazio aplicados.
- 42 testes no backend (inclui 1.5).

### File List

- packages/backend/prisma/schema.prisma
- packages/backend/prisma/migrations/20260603200000_chunks_vector/migration.sql
- packages/backend/src/modules/ingestion/* (pipeline, segment, yt-dlp)
- packages/backend/src/shared/infrastructure/vector-store/*
- (demais arquivos da implementação original)

## Change Log

- 2026-06-03: Story 1.4 implementada.
- 2026-06-03: Code review — Approve com patches.
