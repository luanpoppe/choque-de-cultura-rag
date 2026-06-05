---
story_key: 1-6-timestamps-reais-ingestao
epic: 1
story_id: "1.6"
research_input: _bmad-output/planning-artifacts/research/technical-whisper-timestamps-ingestao-research-2026-06-03.md
deferred_from: 1-4-ingestion-pipeline-worker (Review — timestamps proporcionais)
baseline_commit: pending
---

# Story 1.6: Timestamps reais na ingestão (segmentos STT)

Status: done

## Story

Como **visitante do chat**,  
quero que o botão **"Abrir no YouTube"** nos Citation Cards leve perto do momento em que a fala realmente ocorre,  
para que **eu não precise caçar manualmente no episódio** quando a resposta já citou o trecho certo.

## Acceptance Criteria

1. **AC1** — Segmentos STT com timestamps reais via OpenAI `whisper-1` + `verbose_json` + `segment`; uma passagem por episódio.
2. **AC2** — `TranscriptSegment` persistido; `force` apaga segmentos + chunks antes de reinserir.
3. **AC3** — Chunks via `mergeTranscriptSegmentsIntoChunks` (zona fina `INGEST_FINE_GRAINED_HEAD_SEC` + contexto ±`INGEST_HEAD_CONTEXT_SEC` + janelas `INGEST_CHUNK_DURATION_SEC` default **30s**, overlap **`INGEST_OVERLAP_RATIO`** default **25%**).
4. **AC4** — Contrato `citations[]` inalterado.
5. **AC5** — `OPENAI_API_KEY` na ingestão; chat/embeddings OpenRouter; docs atualizados.
6. **AC6** — Áudio >24 MB fatiado com ffmpeg + offset de segmentos.
7. **AC7** — Spike legendas: `YtDlpService.listAutoSubtitleLangs` (diagnóstico).
8. **AC8** — Testes unitários (96 no backend).
9. **AC9** — Reingestão `force` documentada (custo ~US$ 0,006/min).

## Tasks / Subtasks

- [x] **Task 1 — Schema e migration** (AC: 2)
- [x] **Task 2 — Cliente OpenAI STT com segmentos** (AC: 1, 5, 6)
- [x] **Task 3 — Merge segmentos → chunks** (AC: 3)
- [x] **Task 4 — Repositório de segmentos** (AC: 2)
- [x] **Task 5 — Pipeline** (AC: 1–4, 6, 9)
- [x] **Task 6 — Spike legendas** (AC: 7)
- [x] **Task 7 — Docs e env** (AC: 5, 9)
- [x] **Task 8 — Testes** (AC: 8)

### Review Findings

- [x] [Review][Patch] `OPENAI_API_KEY` opcional no boot, obrigatória só em `transcribeAudioFileWithSegments` — melhor DX para dev sem ingestão
- [x] [Review][Defer] `ffmpeg` necessário apenas para episódios com áudio >24 MB — aceito; documentar no README operacional
- [x] [Review][Defer] Legendas YouTube como fonte primária v2 — spike via `listAutoSubtitleLangs`; v1 usa Whisper OpenAI

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve

| Área | Veredito |
|------|----------|
| AC1–AC3 | Pipeline persiste segmentos e deriva chunks com `startSec` real |
| AC4 | RAG/cards sem mudança de contrato |
| AC5 | `.env.example`, `project-context.md`, `architecture.md` atualizados |
| AC6 | `splitAudioFileIfNeeded` + `offsetSttSegments` testados |
| Testes | 96 passed (`pnpm test` backend) |

**Operação pós-merge:** ~~rodar migration~~ ✅ `20260604120000_transcript_segments`; ~~`OPENAI_API_KEY` no `.env`~~ ✅; ~~reingestão `force` dos 5 eps.~~ ✅ (2026-06-04 — 375 chunks, 822 segmentos STT; `pnpm reingest:force` via `nest build` + `node dist/...`).

## Dev Agent Record

### Agent Model Used

Composer

### Completion Notes List

- OpenRouter STT removido do pipeline de ingestão; OpenAI `verbose_json` via `AIAudio.transcribeDetailedOpenAI` (`@luanpoppe/ai` ^1.1.6).
- Tabela `transcript_segments` + merge em chunks (30s + zona fina 180s) preservando overlap FR-4.
- Reingestão operacional concluída nos 5 vídeos PoC.
- **Spike legendas (AC7):** método `YtDlpService.listAutoSubtitleLangs` adicionado; validar manualmente em vídeo do canal antes de v2 — não usado como fonte primária na v1.
- **Custo reingestão:** uma passagem Whisper/episódio ≈ minutos × US$ 0,006/min.

### File List

- packages/backend/prisma/schema.prisma
- packages/backend/prisma/migrations/20260604120000_transcript_segments/migration.sql
- packages/backend/src/shared/infrastructure/ai/openai-transcription.ts
- packages/backend/src/shared/infrastructure/ai/openai-transcription.spec.ts
- packages/backend/src/shared/infrastructure/ai/ai.service.ts
- packages/backend/src/shared/infrastructure/vector-store/transcript-segment.repository.ts
- packages/backend/src/shared/infrastructure/vector-store/vector-store.module.ts
- packages/backend/src/modules/ingestion/merge-transcript-segments.ts
- packages/backend/src/modules/ingestion/merge-transcript-segments.spec.ts
- packages/backend/src/modules/ingestion/ingestion-pipeline.service.ts
- packages/backend/src/modules/ingestion/ingestion-pipeline.service.spec.ts
- packages/backend/src/modules/ingestion/yt-dlp.service.ts
- packages/backend/src/core/env.service.ts
- .env.example
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/architecture.md

### Change Log

- 2026-06-03: Story 1.6 implementada — timestamps reais na ingestão.
- 2026-06-03: Code review Approve.
- 2026-06-04: Docs alinhados — chunk 30s, lib 1.1.6, reingest concluída; script `check-transcript-segments.ts`.
- 2026-06-05: Chunking — `INGEST_HEAD_CONTEXT_SEC` (±20s na zona fina) e `INGEST_OVERLAP_RATIO` (25%); reingest necessária após mudança.
