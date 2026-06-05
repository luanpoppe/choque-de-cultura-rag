---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/planning-artifacts/research/technical-whisper-timestamps-ingestao-research-2026-06-03.md
  - packages/backend/src/shared/infrastructure/ai/openrouter-transcription.ts
workflowType: research
research_type: technical
research_topic: Modelos STT no OpenRouter com timestamps/segmentos na resposta
research_goals: >
  Verificar se algum modelo de speech-to-text disponível via OpenRouter permite obter
  separação por timestamps (segmentos ou palavras) sem OPENAI_API_KEY direta, para o
  pipeline de ingestão do choque-de-cultura-rag.
user_name: Luan
date: 2026-06-03
web_research_enabled: true
source_verification: true
---

# STT no OpenRouter com timestamps: pesquisa técnica

**Data:** 2026-06-03  
**Tipo:** Pesquisa técnica (BMad TR) — complemento à [TR timestamps ingestão](./technical-whisper-timestamps-ingestao-research-2026-06-03.md)

---

## Research Overview

Esta pesquisa responde se **algum modelo de transcrição no OpenRouter** devolve **segmentos com `start`/`end`** (timestamps reais) na API `/audio/transcriptions`, de forma que o projeto possa voltar a usar **só `OPENROUTER_API_KEY`**.

**Conclusão executiva:** O **contrato oficial** do endpoint STT do OpenRouter **normaliza a resposta para `{ text, usage }` apenas** — sem campo `segments`, `words` ou `verbose_json`. Várias páginas de **modelo** mencionam “segment timestamps” ou “timestamp granularities”, mas isso **não está no schema da API** nem no guia STT. **Não há evidência documentada** de que trocar o modelo (Whisper Large V3, Parakeet, GPT-4o Transcribe, Chirp 3, etc.) altere o JSON de resposta no OpenRouter hoje. **`gpt-4o-transcribe-diarize` (segmentos + speaker) não aparece** no catálogo STT do OpenRouter. Recomendação: **manter OpenAI direto na ingestão** ou fazer **spike empírico** com `provider.options` (baixa confiança); não planejar produção só com OpenRouter para timestamps até o spike provar o contrário.

---

## Executive Summary

| Pergunta | Resposta |
|----------|----------|
| Algum modelo STT no OpenRouter expõe timestamps na resposta? | **Não, no contrato público atual** |
| Marketing dos modelos contradiz? | **Sim** — Whisper Large V3 / Parakeet citam segmentos; a API documentada não |
| `response_format` no body STT? | **Não** no `STTRequest` OpenAPI — só `provider.options` passthrough |
| `gpt-4o-transcribe-diarize` no OpenRouter? | **Não listado** em `output_modalities=transcription` (jun/2026) |
| Caminho único OpenRouter viável hoje? | Texto + estimativa proporcional (como antes) ou legendas YouTube |

---

## 1. Contrato da API OpenRouter STT (fonte autoritativa)

### Request (`STTRequest`)

Campos documentados em [Create transcription](https://openrouter.ai/docs/api/api-reference/transcriptions/create-audio-transcriptions):

| Campo | Suportado |
|-------|-----------|
| `model` | Sim |
| `input_audio` (base64 + format) | Sim |
| `language` | Sim |
| `temperature` | Sim |
| `provider` (passthrough por slug) | Sim |
| `response_format` | **Não** (não está no schema) |
| `timestamp_granularities` | **Não** |
| `verbose_json` | **Não** |

Exemplo oficial de passthrough — apenas `prompt` no Groq:

```json
{
  "provider": {
    "options": {
      "groq": {
        "prompt": "Expected vocabulary: OpenRouter, API, transcription"
      }
    }
  }
}
```

Fonte: [Speech-to-Text guide](https://openrouter.ai/docs/guides/overview/multimodal/stt)

### Response (`STTResponse`)

```json
{
  "text": "...",
  "usage": {
    "seconds": 9.2,
    "total_tokens": 113,
    "input_tokens": 83,
    "output_tokens": 30,
    "cost": 0.000508
  }
}
```

**Não há** `segments`, `words`, `duration`, nem eco do `verbose_json` upstream.

Isso alinha com o código do projeto (`openrouter-transcription.ts` → só `data.text`) e com implementações de referência (ex.: Laravel OpenRouter STT: resposta apenas `{text, usage}`).

---

## 2. Catálogo de modelos STT no OpenRouter (API, jun/2026)

Consulta: `GET https://openrouter.ai/api/v1/models?output_modalities=transcription`

| Modelo (slug) | Preço (indicativo) | Notas de marketing / parâmetros |
|---------------|-------------------|----------------------------------|
| `microsoft/mai-transcribe-1.5` | ~$0,36/M tokens | Azure Speech; 100+ locales |
| `nvidia/parakeet-tdt-0.6b-v3` | ~$0,0015/M | Página diz **“segment timestamps”**; quickstart só imprime `result["text"]` |
| `mistralai/voxtral-mini-transcribe` | ~$0,003/M | `response_format` em *supported_parameters* (herança chat?) |
| `qwen/qwen3-asr-flash-2026-02-10` | muito baixo | 11 idiomas; `response_format` listado |
| `google/chirp-3` | ~$0,016/M | Multilíngue; `response_format` listado |
| `openai/gpt-4o-mini-transcribe` | token in/out | Sem timestamps na doc OpenAI para este modelo |
| `openai/gpt-4o-transcribe` | token in/out | Idem — só `json` ou `text` na API OpenAI nativa |
| `openai/whisper-large-v3` | ~$0,0015/M | Página diz **timestamp granularities**; STT guide não |
| `openai/whisper-large-v3-turbo` | ~$0,04/M | Rápido; `response_format` listado |
| `openai/whisper-1` | ~$0,006/min (via pricing) | Na OpenAI: `verbose_json` + segmentos — **não exposto no OR** |

### Modelos **ausentes** no catálogo STT OpenRouter

- **`openai/gpt-4o-transcribe-diarize`** — na OpenAI nativa retorna `diarized_json` com `speaker`, `start`, `end`; **não disponível** no endpoint STT do OpenRouter listado em jun/2026.

---

## 3. Análise por família de modelo

### 3.1 Whisper (openai/whisper-1, whisper-large-v3, turbo)

| Camada | Timestamps? |
|--------|-------------|
| OpenAI API direta | Sim — `verbose_json` + `timestamp_granularities: ["segment"]` |
| Página do modelo no OpenRouter | Texto marketing: suporte a granularities |
| API OpenRouter STT | **Só `text`** |

**Veredito:** O upstream (Groq/OpenAI/etc. por trás do slug) pode gerar segmentos internamente, mas o **OpenRouter descarta/normaliza** na resposta documentada.

### 3.2 NVIDIA Parakeet TDT 0.6B v3

Marketing: *“Returns transcribed text with punctuation and **segment timestamps**.”*

Quickstart OpenRouter: mesmo padrão — `print(result["text"])`.

**Veredito:** Timestamps podem existir no provedor NVIDIA; **não documentados** na resposta OpenRouter. Confiança **baixa** sem teste real logando `response.json()` completo.

### 3.3 GPT-4o Transcribe / Mini

OpenAI nativo: cobrança por token; **sem** `timestamp_granularities` (só json/text).

**Veredito:** Mesmo via OpenRouter, **não resolve** timestamps para citation cards.

### 3.4 Google Chirp 3, Mistral Voxtral, Qwen ASR, MAI-Transcribe

Focados em texto + detecção de idioma / pontuação.

`response_format` aparece em *supported_parameters* do Models API — isso reflete capacidades do **chat** ou parâmetros genéricos, **não** um segundo contrato STT documentado.

**Veredito:** **Não há** documentação de segmentos na resposta STT.

### 3.5 Chat Completions com `input_audio`

OpenRouter oferece áudio em `/chat/completions` para **análise conversacional**, não para pipeline de transcrição estruturada com array de segmentos.

**Veredito:** **Inadequado** para ingestão RAG com `start_sec`/`end_sec` por chunk.

---

## 4. Passthrough `provider.options` — vale um spike?

**Hipótese:** Enviar via OpenRouter algo como:

```json
{
  "model": "openai/whisper-large-v3",
  "input_audio": { "data": "...", "format": "mp3" },
  "language": "pt",
  "provider": {
    "options": {
      "openai": {
        "response_format": "verbose_json",
        "timestamp_granularities": ["segment"]
      }
    }
  }
}
```

| Aspecto | Avaliação |
|---------|-----------|
| Documentado? | **Não** — exemplo oficial só mostra `prompt` (Groq) |
| Plausível? | Parcial — passthrough “só o que o provedor suporta” |
| Resposta incluiria `segments`? | **Incerto** — gateway pode repassar upstream mas **strip** na normalização `STTResponse` |
| Confiança | **Baixa** até teste com áudio curto + log do JSON bruto |

**Spike sugerido (30 min):** 1 clip MP3 ~30s, 3 modelos (`whisper-1`, `whisper-large-v3`, `parakeet-tdt-0.6b-v3`), inspecionar **todo** o body da resposta (não só `text`).

---

## 5. BYOK (Bring Your Own Key) no OpenRouter STT

O guia STT menciona **BYOK**: roteamento com chave do provedor; OpenRouter cobra taxa de plataforma.

| Cenário | Timestamps? |
|---------|-------------|
| BYOK OpenAI + whisper via OpenRouter | **Improvável** se a normalização STT continuar igual |
| BYOK + API OpenAI direta | Igual story 1.6 atual — **sim**, com `verbose_json` |

BYOK **não substitui** chave OpenAI se o problema for o **formato da resposta**, não o billing.

---

## 6. Comparativo: OpenRouter vs OpenAI direto (ingestão)

| Critério | OpenRouter STT (qualquer modelo listado) | OpenAI `whisper-1` direto |
|----------|------------------------------------------|---------------------------|
| Uma API key no projeto | Só `OPENROUTER_API_KEY` | + `OPENAI_API_KEY` na ingestão |
| Segmentos `start`/`end` | **Não documentado** | **Sim** (`verbose_json`) |
| Custo STT | Por modelo (min ou token) | ~$0,006/min |
| Alinhamento com chat/embeddings | Total | Híbrido (aceito na story 1.6) |

---

## 7. Recomendações para o choque-de-cultura-rag

### Produção (agora)

1. **Manter** ingestão com **OpenAI direto** + segmentos (story 1.6) para links YouTube precisos.
2. **Não migrar** para OpenRouter STT esperando timestamps sem spike positivo.

### Se a meta é “só OpenRouter”

| Opção | Timestamps reais? | Nota |
|-------|-------------------|------|
| OpenRouter STT + modelo X | **Não** (contrato) | Volta à estimativa proporcional |
| Legendas YouTube (`yt-dlp`) | Sim (cue VTT/SRT) | US$ 0; qualidade PT a validar |
| Spike `provider.options` | Talvez | Só após teste empírico |
| Abrir issue/feature no OpenRouter | Futuro | Pedir `STTResponse.segments` ou `verbose_json` |

### Monitorar

- Changelog OpenRouter / [Announcing Audio APIs](https://openrouter.ai/announcements/announcing-audio-apis)
- Inclusão de `gpt-4o-transcribe-diarize` no catálogo STT
- Expansão do schema `STTResponse`

---

## 8. Resposta direta à pergunta

> **Algum outro modelo de speech-to-text permite separação em timestamps via OpenRouter?**

**Pela documentação oficial e o schema OpenAPI: não.** Todos os modelos STT listados no OpenRouter em jun/2026 usam o **mesmo endpoint** que devolve **apenas texto** (+ usage). Várias fichas de modelo **afirmam** suporte a timestamps no **motor** subjacente, mas o **proxy OpenRouter não expõe** isso ao cliente.

A única ressalva é um **teste empírico** de passthrough — **não documentado** — que pode descobrir campos extras não listados no schema (ou confirmar que são descartados).

---

## 9. Fontes

| # | Fonte | Uso |
|---|-------|-----|
| 1 | [OpenRouter STT Guide](https://openrouter.ai/docs/guides/overview/multimodal/stt) | Request/response, BYOK, passthrough |
| 2 | [Create transcription API](https://openrouter.ai/docs/api/api-reference/transcriptions/create-audio-transcriptions) | Schema `STTRequest` / `STTResponse` |
| 3 | [Models API `output_modalities=transcription`](https://openrouter.ai/api/v1/models?output_modalities=transcription) | Catálogo jun/2026 |
| 4 | [Whisper Large V3 no OpenRouter](https://openrouter.ai/openai/whisper-large-v3) | Marketing vs quickstart |
| 5 | [Parakeet no OpenRouter](https://openrouter.ai/nvidia/parakeet-tdt-0.6b-v3) | “segment timestamps” vs API |
| 6 | [OpenAI Speech-to-text](https://developers.openai.com/api/docs/guides/speech-to-text) | `verbose_json`, diarize (nativo) |
| 7 | [Collection STT OpenRouter](https://openrouter.ai/collections/speech-to-text-models) | Visão geral modelos |
| 8 | TR anterior interna | Contexto story 1.6 |

### Queries de pesquisa

- OpenRouter speech to text segments timestamps  
- OpenRouter parakeet segment timestamps API  
- OpenRouter gpt-4o-transcribe-diarize  
- OpenRouter STT response_format verbose_json passthrough  

### Níveis de confiança

| Afirmação | Confiança |
|-----------|-----------|
| `STTResponse` só tem `text` + `usage` | **Alta** |
| Catálogo STT sem `gpt-4o-transcribe-diarize` | **Alta** (snapshot API jun/2026) |
| Marketing Whisper/Parakeet menciona timestamps | **Alta** |
| Passthrough devolve `segments` na prática | **Baixa** — requer spike |
| Nenhum modelo OR substitui OpenAI direto para ingestão | **Alta** (documentação) |

---

## 10. Spike empírico (executado 2026-06-04)

**Script:** `pnpm --filter @choque-de-cultura-rag/backend spike:openrouter-stt`  
**Áudio:** ~30s do vídeo `4u1w1UnqI0Y` (Choque de Cultura), PT  
**Saída:** `_bmad-output/spikes/openrouter-stt-segments/2026-06-04T19-28-16-400Z/`

| Caso | HTTP | Keys na resposta | `segments`? |
|------|------|-----------------|-------------|
| `openai/whisper-1` (baseline) | 200 | `text`, `usage` | **Não** |
| `openai/whisper-1` + `provider.options.openai` verbose_json | 200 | `text`, `usage` | **Não** |
| `openai/whisper-1` + `provider.options.groq` verbose_json | 200 | `text`, `usage` | **Não** |
| `openai/whisper-1` + `response_format` no root (não documentado) | 200 | `text`, `usage` | **Não** |
| `openai/whisper-large-v3` | 404 | — | Conta sem provedor (Groq/Together não habilitados) |
| `nvidia/parakeet-tdt-0.6b-v3` | 404 | — | Conta sem provedor Together |

**Confirmação (run 19:28):** mesmo com passthrough `verbose_json` + `timestamp_granularities: segment`, a resposta permaneceu `{"text":"...","usage":{...}}` — sem array `segments` ou `words`.

### Spike com todos os providers liberados (2026-06-04T22:38)

**Saída:** `_bmad-output/spikes/openrouter-stt-segments/2026-06-04T22-38-32-300Z/` e `latest.json`

| Caso | HTTP | `segments`? |
|------|------|-------------|
| `openai/whisper-1` (baseline + passthrough verbose) | 200 | **Não** |
| `nvidia/parakeet-tdt-0.6b-v3` | 200 | **Não** (só `text` + `usage`) |
| `openai/whisper-large-v3` | **400** | — (provider Groq/Together rejeita; antes era 404 sem rota) |

**Confiança da hipótese TR:** **Alta** — liberar providers não expõe `segments`; ingestão permanece OpenAI direta (story 1.6).

---

**Pesquisa concluída:** 2026-06-03 (spikes: 2026-06-04)
