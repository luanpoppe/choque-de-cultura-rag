---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/architecture.md
  - packages/backend/src/shared/infrastructure/ai/openrouter-transcription.ts
  - packages/backend/src/modules/ingestion/segment-transcript.ts
workflowType: research
research_type: technical
research_topic: Timestamps reais na ingestão (STT) sem aumento absurdo de custo
research_goals: >
  Avaliar como persistir momentos em que cada frase/bloco é dito no Choque de Cultura RAG,
  melhorando links do YouTube nos Citation Cards, mantendo custo de transcrição previsível
  e alinhado à arquitetura atual (OpenRouter + yt-dlp + Postgres/pgvector).
user_name: Luan
date: 2026-06-03
web_research_enabled: true
source_verification: true
---

# Timestamps reais na ingestão: pesquisa técnica

**Data:** 2026-06-03  
**Autor:** Luan  
**Tipo:** Pesquisa técnica (BMad TR)  
**Projeto:** choque-de-cultura-rag

---

## Research Overview

Esta pesquisa responde se é possível salvar **quando cada frase ou bloco de fala ocorre** no pipeline de ingestão, sem multiplicar o custo de transcrição. O estado atual do código transcreve via **OpenRouter** (`/audio/transcriptions`), guarda apenas `text` e **estima** `start_sec`/`end_sec` repartindo palavras pela duração do vídeo — o que explica cards do YouTube imprecisos mesmo quando o RAG acerta o episódio.

**Conclusão executiva:** timestamps de segmento **não aumentam o preço por minuto** na API nativa da OpenAI (`whisper-1` + `verbose_json`), mas o **endpoint STT do OpenRouter hoje não devolve segmentos** — só `{ text, usage }`. Para timestamps reais sem pagar duas vezes, o projeto precisa de **uma das três rotas**: (A) STT nativo OpenAI só na ingestão, (B) legendas YouTube via `yt-dlp`, ou (C) Whisper local (faster-whisper). A opção **A + segmentos** é a melhor relação custo/precisão para a PoC se uma segunda chave for aceitável.

O detalhamento, comparativos e roadmap estão nas seções abaixo.

---

## Executive Summary

### Achados principais

1. **Custo de STT é por minuto de áudio**, não por riqueza do JSON ([OpenAI Speech-to-text](https://developers.openai.com/api/docs/guides/speech-to-text)). `response_format: verbose_json` com `timestamp_granularities: ["segment"]` usa o mesmo modelo `whisper-1` ao mesmo preço (~**US$ 0,006/min** em 2026, conforme documentação e agregadores de preço).
2. **OpenRouter STT** documenta resposta fixa `STTResponse { text, usage? }` — **sem** `segments`, `words` ou `verbose_json` ([OpenRouter STT](https://openrouter.ai/docs/guides/overview/multimodal/stt), [API Reference](https://openrouter.ai/docs/api/api-reference/transcriptions/create-audio-transcriptions)). O código do projeto (`openrouter-transcription.ts`) já reflete isso.
3. **Legendas YouTube** (`yt-dlp --write-auto-subs`) trazem timestamps **sem custo de API**, com qualidade variável em PT-BR e formato VTT às vezes sujo ([yt-dlp post-processing](https://yt-dlp-yt-dlp.mintlify.app/guides/post-processing)).
4. **Word-level** no Whisper pode acrescentar **latência** (documentação OpenAI); para Citation Cards, **segment-level** costuma ser suficiente.
5. **Reingerir** episódios já indexados é o maior custo evitável — não é o formato JSON.

### Recomendações (prioridade)

| # | Recomendação | Confiança |
|---|--------------|-----------|
| 1 | Spike: legendas `pt`/`pt-BR` em 2 episódios do canal; se WER aceitável, usar VTT para timestamps e Whisper só se texto for fraco | Alta |
| 2 | Se legendas forem fracas: **ingestão via API OpenAI direta** (`multipart` + `verbose_json` + `timestamp_granularities: ["segment"]`), mantendo OpenRouter para chat/embeddings | Alta |
| 3 | Persistir `transcript_segments` e derivar `chunks` agrupando segmentos (janelas configuráveis, default 30s) | Alta — **implementado** |
| 4 | Evitar segunda transcrição só para timestamps; evitar word-level na v1 | Alta |
| 5 | Documentar exceção em `project-context.md` / arquitetura (`OPENAI_API_KEY` só ingestão) | Média |

---

## 1. Contexto do projeto (brownfield)

### Pipeline atual

```
yt-dlp (áudio temp) → OpenRouter /audio/transcriptions → text
  → segmentTranscriptIntoChunks(text, durationSec)  // proporcional
  → embeddings → tabela chunks (text, start_sec, end_sec, embedding)
```

- **Schema:** `Episode` (metadados) + `Chunk` (trecho + embedding). Não há transcrição integral nem segmentos STT.
- **Decisão documentada:** `project-context.md` — IA só via `OPENROUTER_API_KEY`; `OPENAI_API_KEY` não usada.
- **FR-8 / UX-DR6:** Citation Cards devem abrir YouTube no momento exato — hoje limitado pela estimativa proporcional.

### Objetivo da pesquisa

Persistir **momentos reais de fala** (idealmente por segmento/frase) com:

- Custo marginal baixo vs. transcrever hoje
- Mudança mínima no contrato do chat (`citations[]` já carrega `startSec`)
- Compatibilidade com reingestão idempotente (`force` por episódio)

---

## 2. Panorama de tecnologias

### 2.1 OpenAI Whisper API (referência de mercado)

| Aspecto | Detalhe |
|---------|---------|
| Modelo com timestamps | **`whisper-1`** apenas |
| Formato | `response_format: verbose_json` |
| Granularidade | `timestamp_granularities: ["segment"]` e/ou `["word"]` |
| Preço | Cobrança por **minuto de áudio** (~US$ 0,006/min em 2026) |
| Custo extra por timestamps | **Não** (mesma tarifa por minuto) |
| Latência extra | **Segment:** sem latência adicional documentada; **word:** latência adicional possível |
| Limite | Arquivo até **25 MB** — episódios longos exigem chunking de áudio na API |
| Formatos de saída úteis | `srt`, `vtt` também disponíveis direto da API |

**Fonte:** [OpenAI — Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text)

Exemplo de payload de segmento (formato típico `verbose_json`):

```json
{
  "text": "...",
  "segments": [
    { "id": 0, "start": 12.4, "end": 18.1, "text": "Ele tem talento pra isso!" }
  ]
}
```

### 2.2 OpenRouter STT (integração atual do projeto)

| Aspecto | Detalhe |
|---------|---------|
| Endpoint | `POST https://openrouter.ai/api/v1/audio/transcriptions` |
| Body | JSON + `input_audio.data` (base64), **não** multipart |
| Resposta documentada | `{ "text": "...", "usage": { "seconds", "cost", ... } }` |
| Segmentos / timestamps | **Não expostos** no contrato público |
| Provider passthrough | Opções por provedor (ex.: `prompt` no Groq) — **não** documenta `response_format` |

**Implicação:** pedir `verbose_json` no código atual **não funciona** sem mudar de integração ou adicionar caminho paralelo.

**Fontes:** [OpenRouter STT guide](https://openrouter.ai/docs/guides/overview/multimodal/stt), [Create transcription API](https://openrouter.ai/docs/api/api-reference/transcriptions/create-audio-transcriptions), implementação em `packages/backend/src/shared/infrastructure/ai/openrouter-transcription.ts`.

> **Nota:** páginas de modelo no OpenRouter (ex. whisper-large-v3) mencionam “timestamp granularities” no texto marketing; o **schema da API STT** permanece só com `text`. Tratar marketing como não vinculante até validação empírica.

### 2.3 Legendas YouTube (yt-dlp)

| Aspecto | Detalhe |
|---------|---------|
| Custo API | **US$ 0** |
| Comando típico | `yt-dlp --write-auto-subs --sub-langs pt,pt-BR --convert-subs srt --skip-download URL` |
| Timestamps | Por cue SRT/VTT (`start` → `end` + texto) |
| Riscos | Auto-caption ruim em humor/áudio sobreposto; VTT com tags inline; duplicação de linhas |
| Fit | Bom para **timestamps**; texto pode ser inferior ao Whisper |

**Fontes:** [yt-dlp post-processing](https://yt-dlp-yt-dlp.mintlify.app/guides/post-processing), [guia de legendas](https://tubepull.com/blog/how-to-download-youtube-subtitles)

### 2.4 Whisper local (faster-whisper / whisper.cpp)

| Aspecto | Detalhe |
|---------|---------|
| Custo variável | GPU/CPU + tempo de máquina; **sem** US$/min na API |
| Timestamps | Segmentos nativos no decode |
| Trade-off | Contrário à decisão v1 “sem Whisper local”; mais DevOps |
| Break-even | Volume alto de horas (ordem de centenas de horas/mês dependendo do hardware) |

**Fonte:** comparativos [BrassTranscripts / self-host vs API](https://brasstranscripts.com/blog/openai-whisper-api-pricing-2025-self-hosted-vs-managed) (ordem de grandeza; validar para seu hardware).

---

## 3. Análise de custo

### O que **não** aumenta custo

- Incluir `verbose_json` + `segment` na **mesma** chamada Whisper (API OpenAI direta)
- Guardar segmentos no Postgres (storage marginal)
- Agrupar segmentos em chunks ~60s para embeddings (mesmo número de embeddings se mesma política de janelas)

### O que **aumenta** custo

| Fator | Impacto |
|-------|---------|
| Segunda transcrição do mesmo episódio | **2×** minutos faturados |
| Reingestão em massa com `force` | N × minutos × US$ 0,006 |
| Trocar para modelo mais caro sem ganho | Ex.: large-v3 em provedor premium sem necessidade |
| Word-level só por precisão marginal | Mesmo US$/min, mas **mais lento** (custo operacional) |

### Estimativa PoC (ilustrativa)

| Cenário | Minutos | Custo STT (~US$ 0,006/min) |
|---------|---------|----------------------------|
| 5 episódios × 60 min (reingestão única) | 300 | ~US$ 1,80 |
| 10 episódios × 90 min | 900 | ~US$ 5,40 |
| Legendas YouTube apenas | 0 API | US$ 0 |

*Valores indicativos; conferir billing OpenAI/OpenRouter no momento da ingestão.*

---

## 4. Padrões de arquitetura e implementação

### 4.1 Opção A — Híbrido: OpenAI STT só na ingestão (recomendada se legendas falharem)

```
yt-dlp → áudio temp
  → OpenAI audio.transcriptions (whisper-1, verbose_json, segment)
  → transcript_segments[] persistidos
  → mergeSegmentsIntoChunks(~60s, overlap)
  → embeddings (OpenRouter, como hoje)
  → chunks
```

**Prós:** timestamps reais; mesmo custo/min que hoje; mínima mudança no RAG.  
**Contras:** segunda credencial (`OPENAI_API_KEY`); exceção à regra “só OpenRouter”; áudio >25 MB precisa split.

**Mudanças sugeridas:**

- `TranscriptionResult { text, segments: { start, end, text }[] }`
- Prisma: `TranscriptSegment` ou `Episode.transcriptSegments Json`
- `segment-transcript.ts` → `mergeWhisperSegmentsIntoChunks(segments, targetDurationSec, overlapRatio)`
- `start_sec` do chunk = `segments[0].start`, não índice proporcional

### 4.2 Opção B — Legendas YouTube primárias (menor custo)

```
yt-dlp --write-auto-subs → parse SRT/VTT → segments
  → (opcional) Whisper via OpenRouter só para normalizar texto se diff > limiar
  → chunks
```

**Prós:** US$ 0 de STT se legendas forem boas.  
**Contras:** qualidade incerta no Choque de Cultura; manutenção do parser VTT; desalinhamento legenda vs. áudio baixado.

**Spike obrigatório:** 2 episódios, comparar trecho conhecido (“ele tem talento pra isso”) — timestamp da legenda vs. audição manual.

### 4.3 Opção C — faster-whisper local (batch)

Adequado se o acervo crescer (SM-2: ≥5 episódios → dezenas de horas) e API ficar cara. Adia para pós-PoC salvo preferência por zero API.

### 4.4 Anti-padrões

- **Não** rodar Whisper OpenRouter + OpenAI no mesmo episódio.
- **Não** usar LLM para inferir timestamps a partir do texto (custo + imprecisão).
- **Não** manter proporcional por palavras se segmentos existirem.

---

## 5. Modelo de dados proposto

### Mínimo viável

```prisma
model TranscriptSegment {
  id         String   @id @default(uuid())
  episodeId  String
  episode    Episode  @relation(...)
  startSec   Float    // segundos com decimal do STT
  endSec     Float
  text       String
  source     String   // "whisper" | "youtube_auto" | "youtube_manual"
  ord        Int      // ordem no episódio
}
```

`Chunk` permanece para RAG; `startSec`/`endSec` passam a ser derivados dos segmentos agrupados.

### Citation Card

Sem mudança de API: `buildYoutubeUrl(videoId, Math.floor(chunk.startSec))` — ganha precisão automática.

---

## 6. Riscos e mitigação

| Risco | Prob. | Mitigação |
|-------|-------|-----------|
| OpenRouter nunca expor segmentos | Alta | Caminho OpenAI direto na ingestão |
| Legendas PT imprecisas | Média | Spike; fallback Whisper |
| Episódio >25 MB | Média | Split áudio (ffmpeg) antes do STT |
| Reingestão cara | Média | `transcriptHash`; só re-transcrever se áudio/modelo mudou |
| Word-level desnecessário | Baixa | Usar só `segment` na v1 |

---

## 7. Roadmap de implementação sugerido

| Fase | Entrega | Esforço |
|------|---------|---------|
| **0 — Spike (1–2 h)** | Baixar legendas pt + testar OpenAI `verbose_json` em 1 MP3 curto | Baixo |
| **1 — Dados** | Migration `transcript_segments` + parser SRT OU client OpenAI | Médio |
| **2 — Pipeline** | Substituir `segmentTranscriptIntoChunks` proporcional por merge de segmentos | Médio |
| **3 — Reingest** | Script/documentar re-ingest dos episódios já no DB | Baixo |
| **4 — Docs** | Atualizar `architecture.md`, `project-context.md`, story em `epics.md` | Baixo |

**Story BMad sugerida:** `1.6-timestamps-reais-transcricao` ou item no épico 1 como melhoria pós-1.4.

---

## 8. Integração com workflow BMad

| Você está em | Fase 4 — implementação (épicos 1–3 **done**) |
| Próximo passo lógico | **[CS] Create Story** → `bmad-create-story` para timestamps na ingestão |
| Alternativa rápida | **[QQ] Quick Dev** → `bmad-quick-dev` após spike da fase 0 |
| Atualizar escopo formal | **[CC] Correct Course** se “timestamp exato” virar requisito não-negociável no PRD |

---

## 9. Fontes consultadas

| # | Fonte | Uso |
|---|-------|-----|
| 1 | [OpenAI Speech-to-text](https://developers.openai.com/api/docs/guides/speech-to-text) | `verbose_json`, `timestamp_granularities`, modelos |
| 2 | [OpenRouter STT](https://openrouter.ai/docs/guides/overview/multimodal/stt) | Contrato `{ text, usage }` |
| 3 | [OpenRouter Transcriptions API](https://openrouter.ai/docs/api/api-reference/transcriptions/create-audio-transcriptions) | Schema `STTResponse` |
| 4 | [OpenRouter Audio announcement](https://openrouter.ai/announcements/announcing-audio-apis) | Modelos STT disponíveis |
| 5 | [yt-dlp post-processing](https://yt-dlp-yt-dlp.mintlify.app/guides/post-processing) | `--write-auto-subs`, `--convert-subs` |
| 6 | Código: `openrouter-transcription.ts`, `segment-transcript.ts` | Estado atual |
| 7 | `_bmad-output/project-context.md` | Restrição OpenRouter-only |

### Queries de pesquisa web

- OpenAI Whisper API verbose_json segments pricing  
- OpenRouter audio transcriptions API response format segments  
- yt-dlp write-auto-sub vtt timestamps Portuguese  

### Níveis de confiança

| Afirmação | Confiança |
|-----------|-----------|
| OpenRouter STT não retorna segmentos no schema oficial | **Alta** |
| OpenAI cobra por minuto, não por campo JSON | **Alta** |
| Legendas YouTube são gratuitas com timestamps | **Alta** |
| Provider passthrough habilita verbose_json no OpenRouter | **Baixa** (não documentado) |
| Qualidade legendas Choque de Cultura PT | **Desconhecida** — requer spike |

---

## 10. Conclusão

Salvar **quando cada frase/bloco é dito** é tecnicamente direto e **não precisa** dobrar o custo de transcrição, desde que se use **uma única passagem** de STT com saída segmentada ou legendas YouTube. O bloqueio atual do projeto é **integração**, não preço: o OpenRouter entrega só texto, e o código estima tempo.

**Caminho recomendado para a PoC:**

1. Spike de legendas (custo zero).  
2. Se insuficiente: **OpenAI `whisper-1` + `verbose_json` + segment** apenas no worker de ingestão, mantendo OpenRouter para o resto.  
3. Persistir segmentos e regerar chunks com merge ~60s.

---

**Pesquisa concluída:** 2026-06-03  
**Próximo passo sugerido:** `[CS]` criar story *Timestamps reais na ingestão* ou rodar spike da fase 0 manualmente em um episódio.
