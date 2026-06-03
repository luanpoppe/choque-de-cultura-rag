---
baseline_commit: 1b1abca3a642b7e255719ee1a08c43689b2ac3d9
story_key: 1-2-ai-service-openrouter
---

# Story 1.2: Cliente de IA (`@luanpoppe/ai`)

Status: done

## Story

Como desenvolvedor,
quero um `AiService` centralizado via `@luanpoppe/ai`,
para que embeddings, Whisper e geração usem um único ponto configurável (OpenRouter).

## Acceptance Criteria

1. **AC1** — `@luanpoppe/ai` instalado no backend.
2. **AC2** — `AiService` em `shared/infrastructure/ai/` registrado no `InfrastructureModule`.
3. **AC3** — Nenhum outro service de produção instancia `AI` ou chama providers diretamente (só `AiService`).
4. **AC4** — `OPENROUTER_API_KEY`, `EMBEDDING_MODEL` e `WHISPER_MODEL` validados em `EnvService` (somente OpenRouter; sem `OPENAI_API_KEY`).
5. **AC5** — Métodos: `call`, `embedDocuments`, `embedQuery`, `transcribeWithWhisper`.
6. **AC6** — Testes unitários com mocks (embed smoke + whisper delegate).

## Tasks / Subtasks

- [x] Task 1: Dependência e env (AC: 1, 4)
  - [x] Subtask 1.1: `pnpm add @luanpoppe/ai` + `@langchain/openai`
  - [x] Subtask 1.2: Vars em `EnvService` e `.env.example`
- [x] Task 2: AiService + módulo (AC: 2, 3, 5)
  - [x] Subtask 2.1: `AiService` com `AI`, embeddings OpenRouter, `AIAudioTranscription`
  - [x] Subtask 2.2: `AiModule` global + export em `InfrastructureModule`
- [x] Task 3: Testes (AC: 6)
  - [x] Subtask 3.1: `ai.service.spec.ts`
  - [x] Subtask 3.2: `pnpm --filter backend test` e lint

### Review Findings

- [x] [Review][Patch] Validar resposta STT quando `text` ausente — `openrouter-transcription.ts`
- [x] [Review][Patch] Timeout no `fetch` de transcrição (episódios longos) — `openrouter-transcription.ts`
- [x] [Review][Defer] Base64 de áudio inteiro na RAM — endereçar na story 1.4 (chunk/stream)
- [x] [Review][Defer] Embeddings via `@langchain/openai` dentro do `AiService` — aceito como gateway único até `@luanpoppe/ai` expor embed

## Senior Developer Review (AI)

**Review date:** 2026-06-03  
**Outcome:** Approve

### Action Items

- [x] **[Med]** `transcribeViaOpenRouter` assume `data.text` sempre presente; resposta vazia/erro silencioso.
- [x] **[Low]** `fetch` sem timeout pode travar worker de ingestão em rede lenta.
- [x] **[Low]** Story file: `baseline_commit` ainda `pending`; File List sem `openrouter-transcription*.ts`.

### AC Coverage

| AC | Status | Notas |
|----|--------|-------|
| AC1 | OK | `@luanpoppe/ai` ^1.1.5 |
| AC2 | OK | `AiModule` global + `InfrastructureModule` |
| AC3 | OK | Nenhum outro `new AI()` no `src/` |
| AC4 | OK* | Vars corretas no código; texto da story estava desatualizado (corrigido) |
| AC5 | OK | `call`, `embedDocuments`, `embedQuery`, `transcribeWithWhisper` |
| AC6 | OK | 17 testes; falta teste de `call()` (opcional) |

## Dev Notes

- `@luanpoppe/ai` 1.1.5 não expõe `embed` ainda — embeddings via `OpenAIEmbeddings` + base URL OpenRouter, encapsulados só em `AiService`.
- Whisper/STT via OpenRouter (`/audio/transcriptions`); só `OPENROUTER_API_KEY` obrigatória.
- Dimensão do vector (1536) será fixada na story 1.3 com `text-embedding-3-small`.

## Dev Agent Record

### Completion Notes List

- `AiService` centraliza `call`, embed e whisper; keys só via `EnvService`.
- Code review: validação de `text` na resposta STT + `AbortSignal.timeout(300s)` no fetch.

### File List

- packages/backend/package.json
- packages/backend/src/core/env.service.ts
- packages/backend/src/core/env.service.spec.ts
- packages/backend/src/shared/infrastructure/ai/ai.service.ts
- packages/backend/src/shared/infrastructure/ai/ai.module.ts
- packages/backend/src/shared/infrastructure/ai/ai.service.spec.ts
- packages/backend/src/shared/infrastructure/ai/openrouter-transcription.ts
- packages/backend/src/shared/infrastructure/ai/openrouter-transcription.spec.ts
- packages/backend/src/shared/infrastructure/infrastructure.module.ts
- .env.example
- _bmad-output/project-context.md

## Change Log

- 2026-06-03: Implementação story 1.2.
- 2026-06-03: Code review — Approve com ressalvas (2 patches STT).
- 2026-06-03: Patches de review aplicados; story concluída.
