# Spike OpenRouter STT — timestamps

**Data:** 2026-06-04T22-38-32-300Z
**Áudio:** `C:\_pastas-disco-c\repositorios-c\projetos\choque-de-cultura-rag\_bmad-output\spikes\openrouter-stt-segments\fixtures\spike-sample.mp3` (496725 bytes)

## Conclusão

**Nenhum caso** retornou `segments` ou `words` no JSON. OpenRouter STT normaliza para `text` + `usage`.

## Resultados

| Caso | Modelo | HTTP | Keys | segments | words |
|------|--------|------|------|----------|-------|
| whisper-1-baseline | openai/whisper-1 | 200 | text, usage | — | — |
| whisper-large-v3-baseline | openai/whisper-large-v3 | 400 | error | — | — |
| parakeet-baseline | nvidia/parakeet-tdt-0.6b-v3 | 200 | text, usage | — | — |
| whisper-1-provider-openai-verbose | openai/whisper-1 | 200 | text, usage | — | — |
| whisper-1-provider-groq-verbose | openai/whisper-1 | 200 | text, usage | — | — |
| whisper-large-v3-provider-openai-verbose | openai/whisper-large-v3 | 400 | error | — | — |
| whisper-1-root-verbose-undocumented | openai/whisper-1 | 200 | text, usage | — | — |

## Detalhes

### whisper-1-baseline

### whisper-large-v3-baseline
- Erro: {"error":{"message":"Provider returned 400","code":400}}

### parakeet-baseline

### whisper-1-provider-openai-verbose

### whisper-1-provider-groq-verbose
- Texto: "Transcrição e Legendas ETC FILMES..."

### whisper-large-v3-provider-openai-verbose
- Erro: {"error":{"message":"Provider returned 400","code":400}}

### whisper-1-root-verbose-undocumented
