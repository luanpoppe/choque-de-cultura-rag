---
story_key: 3-4-onboarding
---

# Story 3.4: Onboarding para quem não conhece o podcast

Status: done

## Senior Developer Review (AI)

**Outcome:** Approve

| Finding | Ação |
|---|---|
| OK | `POST /api/onboarding/suggestions` com trechos reais do DB | `OnboardingService` |
| OK | Acervo vazio → toast orientativo | `emptyCorpus` |
| OK | Chips clicáveis enviam pergunta | `SuggestionChips` |
| OK | Hero oculto após mensagens ou chips | `ChatPage` |
| OK | Sugestões naturais via LLM (`CHAT_MODEL`) + fallback heurístico | `onboarding-suggestion.ai.ts`, `onboarding-suggestion.builder.ts` |
| Defer | Rate limit no onboarding | não exigido na story |
| Defer | Loading “Gerando exemplos…” no frontend | UX polish pós-story |

## Implementação (atualizada)

1. Amostras aleatórias de chunks + títulos de episódio no Postgres.
2. **`generateOnboardingSuggestionsWithAi`** — `callJsonOutput` (`AiService.call` + parse JSON; evita `callStructuredOutput` com DeepSeek thinking); perguntas curtas (~68 chars) (FR-11, FR-14).
3. Se a IA falhar → **`buildFallbackSuggestions`** (heurísticas em `onboarding-suggestion.builder.ts`).
4. Panorama textual de episódios indexados (story 3.7).

## File List (backend)

- `modules/onboarding/onboarding.service.ts`
- `modules/onboarding/onboarding-suggestion.ai.ts`
- `modules/onboarding/onboarding-suggestion.prompts.ts`
- `modules/onboarding/onboarding-suggestion.fallback.ts`
- `modules/onboarding/onboarding-suggestion.builder.ts`

## Change Log

- 2026-06-03: Backend onboarding + UI chips + review Approve.
- 2026-06-03: Sugestões reformuladas por IA com fallback heurístico; chips com `line-clamp-2`.
- 2026-06-03: Fix DeepSeek V4 Flash — `callStructuredOutput` incompatível com thinking mode (`tool_choice`); uso de `ai-json-call.ts`.
