---
baseline_commit: pending
story_key: 2-5-rag-agent-tools
---

# Story 2.5: RAG agente com tool de busca no vector store

Status: done

## Story

Como visitante do chat,
quero que o agente busque no acervo de forma inteligente (inclusive com várias tentativas),
para encontrar trechos mesmo quando a primeira busca semântica não basta.

## Acceptance Criteria

1. **AC1** — Busca no pgvector exposta como tool `search_archive` (não retrieval fixo pré-LLM).
2. **AC2** — Agente pode chamar `search_archive` múltiplas vezes com queries diferentes (limite `RAG_AGENT_MAX_SEARCHES`, default 4).
3. **AC3** — Resposta final via tool `submit_answer` (`offTopic`, `reply`, `citationChunkIds`).
4. **AC4** — `RagService.ask` mantém contrato `{ reply, citations[], noMatch?, offTopic? }`.
5. **AC5** — Citation Cards derivados só de `chunkId` retornados nas buscas (máx. 3).
6. **AC6** — Testes unitários das tools e integração via mock do `RagAgentRunner`.
7. **AC7** — `search_archive` retorna `contextText` com ±`RAG_NEIGHBOR_CHUNKS` chunks vizinhos (runtime); cards usam o mesmo contexto no `quote`.

## Dev Agent Record

### Completion Notes

- `RagAgentRunner` orquestra `AiService.call` com `agent.tools` (`@luanpoppe/ai` + LangChain).
- `search_archive`: `embedQuery` + `ChunkRepository.searchSimilarWithEpisode` + threshold; acumula chunks na `RagSearchSession`; enriquece resultados com `contextText` via `buildChunkContextText` + `findTemporalNeighbors`.
- `submit_answer`: valida chunkIds contra a sessão; encerra o turno.
- Env: `RAG_AGENT_MAX_SEARCHES` (default 4), `RAG_NEIGHBOR_CHUNKS` (default 2 antes + 2 depois).
- Substitui fluxo unificado (`callJsonOutput` pré-retrieval) da story 2.1 — arquivos legados mantidos para testes.

### File List

- packages/backend/src/shared/infrastructure/rag/rag-agent.runner.ts
- packages/backend/src/shared/infrastructure/rag/rag-agent-tools.ts
- packages/backend/src/shared/infrastructure/rag/rag-agent.prompts.ts
- packages/backend/src/shared/infrastructure/rag/rag-search-session.ts
- packages/backend/src/shared/infrastructure/rag/rag-chunk-neighbors.ts
- packages/backend/src/shared/infrastructure/rag/rag.service.ts
- packages/backend/src/shared/infrastructure/rag/rag.module.ts
- packages/backend/src/shared/infrastructure/vector-store/chunk.repository.ts
- packages/backend/src/core/env.service.ts
- .env.example

## Change Log

- 2026-06-05: RAG agente com tools `search_archive` + `submit_answer`; multi-busca configurável.
- 2026-06-05: Contexto de vizinhos (`contextText`, `RAG_NEIGHBOR_CHUNKS`) para agente e Citation Cards.
