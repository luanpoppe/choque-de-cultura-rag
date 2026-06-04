---
baseline_commit: 94a32d8ec4142c6ba4e576b96caca3d8b5f2b277
story_key: 2-3-rate-limit-chat
---

# Story 2.3: Rate limiting do chat

Status: done

## Story

Como operador do deploy,
quero limite de requisições no chat,
para que a demo pública não estoure custo de API.

## Acceptance Criteria

1. **AC1** — `POST /api/chat` limitado por IP (~20 req/min default).
2. **AC2** — Excesso retorna **429** com mensagem clara.
3. **AC3** — `CHAT_RATE_LIMIT_MAX` e `CHAT_RATE_LIMIT_WINDOW_MS` via env (NFR-6).
4. **AC4** — `CHAT_RATE_LIMIT_MAX=0` desabilita o limite (dev local).
5. **AC5** — Testes unitários do serviço, guard e extração de IP.

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve (após patches)

| Severidade | Finding | Ação |
|---|---|---|
| Patch | `HttpException` com objeto `{ status }` quebrava status 429 no Nest 11 | Segundo arg = `HttpStatus.TOO_MANY_REQUESTS`; `retryAfterSec` no body |
| Patch | Map de IPs sem limpar entradas expiradas | `delete` quando janela fica vazia |
| Defer | Limite in-memory não compartilha entre réplicas | aceito PoC (sem Redis v1) |
| Defer | Header `Retry-After` HTTP | `retryAfterSec` no JSON por ora |

## File List

- packages/backend/src/modules/chat/chat-rate-limit.*
- packages/backend/src/modules/chat/request-client-ip.*
- packages/backend/src/modules/chat/chat.controller.ts
- packages/backend/src/modules/chat/chat.module.ts
- packages/backend/src/core/env.service.ts
- packages/backend/src/main.ts
- .env.example

## Change Log

- 2026-06-03: Story 2.3 implementada + code review Approve.
