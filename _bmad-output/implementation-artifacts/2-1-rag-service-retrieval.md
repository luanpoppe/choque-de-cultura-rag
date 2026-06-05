---
baseline_commit: 94a32d8ec4142c6ba4e576b96caca3d8b5f2b277
story_key: 2-1-rag-service-retrieval
---

# Story 2.1: Motor RAG (retrieval + guardrails)

Status: done

## Story

Como visitante do chat,
quero respostas fundamentadas apenas no acervo indexado,
para confiar que as citações são reais.

## Acceptance Criteria

1. **AC1** — `RagService.ask(message, history?)` em `shared/infrastructure/rag`.
2. **AC2** — Embedding da pergunta via `AiService.embedQuery`.
3. **AC3** — Top-k=6 via `ChunkRepository.searchSimilarWithEpisode`.
4. **AC4** — Prompt de domínio Choque de Cultura + LLM via `AiService.call`.
5. **AC5** — Retorno `{ reply, citations[], noMatch?, offTopic? }` conforme arquitetura.
6. **AC6** — Sem chunks relevantes → `noMatch: true`, `citations: []`.
7. **AC7** — Off-topic → `offTopic: true`, `citations: []` (sem cards fabricados).
8. **AC8** — `history` considerado em classificação e geração (FR-10).
9. **AC9** — Citações derivadas dos chunks recuperados (não inventadas pelo LLM).
10. **AC10** — Testes unitários: guardrails, citações, happy path.
11. **AC11** — Filtro pós-resposta (`rag-citation-filter`): IA escolhe quais trechos `[N]` viram cards; exclui chunks recuperados mas irrelevantes à pergunta/resposta; fallback `[1]` se filtro falhar.

## Tasks / Subtasks

- [x] RagModule + RagService + tipos + buildWatchUrl
- [x] Env: CHAT_MODEL, RAG_MAX_DISTANCE, RAG_TOP_K
- [x] ChunkRepository join com Episode
- [x] AiService.callStructuredOutput
- [x] Testes + sprint status

## Dev Agent Record

### Completion Notes

- `RagService.ask`: classificação off-topic (`callJsonOutput`) → retrieval k=6 com threshold → resposta LLM → filtro de citações (`selectCitationIndexes`) → cards só dos trechos aprovados.
- Sem endpoint HTTP (story 2.2).

### File List

- packages/backend/src/shared/lib/youtube.ts
- packages/backend/src/shared/lib/youtube.spec.ts
- packages/backend/src/shared/infrastructure/rag/*
- packages/backend/src/shared/infrastructure/vector-store/chunk.repository.ts
- packages/backend/src/shared/infrastructure/ai/ai.service.ts
- packages/backend/src/shared/infrastructure/infrastructure.module.ts
- packages/backend/src/core/env.service.ts
- .env.example

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve (após patches)

### Findings

| Severidade | Finding | Ação |
|---|---|---|
| Patch | `$queryRaw` pode retornar `distance` como string → filtro quebrava | `coerceChunkDistance` em `rag-distance.ts` |
| Patch | History ilimitado → risco de estourar contexto | `RAG_MAX_HISTORY_MESSAGES` (default 20) |
| Patch | Citações duplicadas se mesmo chunk no top-k | dedupe por `chunk.id` |
| OK | Filtro de citações por relevância à resposta | `rag-citation-filter.ts` |
| Defer | 3+ chamadas LLM on-topic (classifier + answer + citation filter) | aceito na PoC |
| Defer | Classifier pode dar falso positivo/negativo | aceito; ajuste de prompt depois |

## Change Log

- 2026-06-03: Story 2.1 implementada (review).
- 2026-06-03: Code review — Approve com patches de distance, history cap e dedupe.
- 2026-06-03: Filtro IA de Citation Cards (pós-MVP polish da 2.1); `callJsonOutput` no classificador.
