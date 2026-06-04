---
baseline_commit: 94a32d8ec4142c6ba4e576b96caca3d8b5f2b277
story_key: 3-2-composer-chat-api
---

# Story 3.2: Chat vazio, composer e envio de mensagens

Status: done

## Story

Como visitante,
quero perguntar em português com feedback claro,
para encontrar trechos do podcast facilmente.

## Acceptance Criteria

1. **AC1** — Hero + composer pill no estado vazio.
2. **AC2** — Enter / botão ↑ envia pergunta.
3. **AC3** — Pergunta vazia → toast, sem API.
4. **AC4** — Loading desabilita composer + `aria-live` com "Pensando…".
5. **AC5** — Bubbles user (direita) e agent (esquerda).
6. **AC6** — `POST /api/chat` com `history` da sessão.

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve (após patches)

| Severidade | Finding | Ação |
|---|---|---|
| Patch | Erro de API genérico | `resolveChatError` com 400/429 |
| Patch | Falha remove user bubble e restaura input | rollback em `ChatPage` |
| Patch | Feed sem auto-scroll | `scrollTop` no `ChatFeed` |
| Defer | Citation cards | story 3.3 (`citations` já armazenadas) |
| Defer | `useIsLoading` legado não usado | hook dedicado em `ChatPage` |

## File List

- packages/frontend/src/components/chat/ChatPage.tsx
- packages/frontend/src/components/chat/ChatComposer.tsx
- packages/frontend/src/components/chat/ChatFeed.tsx
- packages/frontend/src/components/chat/MessageBubble.tsx
- packages/frontend/src/lib/api/*
- packages/frontend/next.config.ts
- packages/frontend/package.json

## Change Log

- 2026-06-03: Story 3.2 implementada + review Approve.
