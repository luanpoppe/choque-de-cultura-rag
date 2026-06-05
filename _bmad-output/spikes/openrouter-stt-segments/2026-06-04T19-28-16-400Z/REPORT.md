# Spike OpenRouter STT — timestamps

**Data:** 2026-06-04T19-28-16-400Z
**Áudio:** `C:\_pastas-disco-c\repositorios-c\projetos\choque-de-cultura-rag\_bmad-output\spikes\openrouter-stt-segments\fixtures\spike-sample.mp3` (496725 bytes)

## Conclusão

**Nenhum caso** retornou `segments` ou `words` no JSON. OpenRouter STT normaliza para `text` + `usage`.

## Resultados

| Caso | Modelo | HTTP | Keys | segments | words |
|------|--------|------|------|----------|-------|
| whisper-1-baseline | openai/whisper-1 | 200 | text, usage | — | — |
| whisper-large-v3-baseline | openai/whisper-large-v3 | 404 | error | — | — |
| parakeet-baseline | nvidia/parakeet-tdt-0.6b-v3 | 404 | error | — | — |
| whisper-1-provider-openai-verbose | openai/whisper-1 | 200 | text, usage | — | — |
| whisper-1-provider-groq-verbose | openai/whisper-1 | 200 | text, usage | — | — |
| whisper-large-v3-provider-openai-verbose | openai/whisper-large-v3 | 404 | error | — | — |
| whisper-1-root-verbose-undocumented | openai/whisper-1 | 200 | text, usage | — | — |

## Detalhes

### whisper-1-baseline

### whisper-large-v3-baseline
- Erro: {"error":{"message":"No allowed providers are available for the selected model.","code":404,"metadata":{"available_providers":["groq","together"],"requested_providers":["google-vertex","openai","deepseek","anthropic","google-ai-studio"]}}}

### parakeet-baseline
- Erro: {"error":{"message":"No allowed providers are available for the selected model.","code":404,"metadata":{"available_providers":["together"],"requested_providers":["google-vertex","openai","deepseek","anthropic","google-ai-studio"]}}}

### whisper-1-provider-openai-verbose
- Texto: "Se inscreva no canal e ative o sininho para receber notificações de novos vídeos. Até a próxima!..."

### whisper-1-provider-groq-verbose

### whisper-large-v3-provider-openai-verbose
- Erro: {"error":{"message":"No allowed providers are available for the selected model.","code":404,"metadata":{"available_providers":["groq","together"],"requested_providers":["google-vertex","openai","deepseek","anthropic","google-ai-studio"]}}}

### whisper-1-root-verbose-undocumented
