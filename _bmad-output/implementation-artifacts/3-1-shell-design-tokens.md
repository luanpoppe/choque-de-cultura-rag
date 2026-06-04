---
baseline_commit: 94a32d8ec4142c6ba4e576b96caca3d8b5f2b277
story_key: 3-1-shell-design-tokens
---

# Story 3.1: Shell do chat, tokens visuais e layout base

Status: done

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve (após patches)

| Severidade | Finding | Ação |
|---|---|---|
| Patch | Shell sem `max-h`/flex para feed rolável (mockup) | `max-h-[90vh]` + `main` flex |
| Patch | Tokens de bubble user/agent ausentes | CSS vars em `globals.css` |
| Patch | `.env` na raiz não chegava ao Next | `dotenv` em `next.config.ts` |
| Defer | Tema escuro real | story 3.5 |

## Change Log

- 2026-06-03: Story 3.1 implementada.
- 2026-06-03: Code review — Approve com patches de layout e env.
