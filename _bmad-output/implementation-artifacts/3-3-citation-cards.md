---
story_key: 3-3-citation-cards
---

# Story 3.3: Citation Cards inline

Status: done

## Senior Developer Review (AI)

**Outcome:** Approve

| Finding | Ação |
|---|---|
| Patch | Cards com `bg-white` quebravam no dark | `var(--choque-card-bg)` |
| OK | `noMatch`/`offTopic` não renderizam cards | em `MessageBubble` |
| OK | Link YouTube nova aba + `buildWatchUrl` fallback | `CitationCard` |
| OK | Trecho exibe `quote` integral (sem `line-clamp`; backend expande com chunks vizinhos via `RAG_NEIGHBOR_CHUNKS`) | `CitationCard`, `rag.service`, `rag-chunk-neighbors` |

## Change Log

- 2026-06-03: Implementada + review Approve.
- 2026-06-05: Card mostra trecho completo do chunk (removido `line-clamp-3`; API envia `chunk.text` integral; removido `RAG_MAX_QUOTE_CHARS`).
- 2026-06-05: `quote` expandido com ±`RAG_NEIGHBOR_CHUNKS` vizinhos no mesmo episódio; `startSec`/`watchUrl` permanecem no chunk citado.
