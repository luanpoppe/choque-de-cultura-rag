---
baseline_commit: 94a32d8ec4142c6ba4e576b96caca3d8b5f2b277
story_key: 2-2-chat-api
---

# Story 2.2: API pública de chat

Status: done

## Story

Como visitante,
quero enviar perguntas via POST /api/chat,
para interagir com o agente pela interface web.

## Acceptance Criteria

1. **AC1** — ChatModule em modules/chat.
2. **AC2** — POST /api/chat com { message, history? } válido.
3. **AC3** — Resposta no contrato { reply, citations[], noMatch?, offTopic? }.
4. **AC4** — Mensagem vazia → 400 (Zod).
5. **AC5** — Swagger documentado (tag chat).

## Tasks

- [x] ChatModule, ChatService, ChatController, DTO Zod
- [x] Testes unitários DTO + ChatService

## File List

- packages/backend/src/modules/chat/*
- packages/backend/src/app.module.ts
- packages/backend/src/core/swagger.config.ts

## Change Log

- 2026-06-03: Story 2.2 implementada.
- 2026-06-03: Smoke test manual POST /api/chat OK; fix RagModule imports (VectorStoreModule).
