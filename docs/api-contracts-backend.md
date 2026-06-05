# Contratos de API — backend

Base URL dev: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api` (rotas internas omitidas por default)

## Públicas

### `POST /chat`

Envia pergunta ao agente RAG.

**Body:** `{ message: string, history?: { role: 'user'|'assistant', content: string }[] }`

**Response 200:**
```json
{
  "reply": "string",
  "citations": [
    {
      "episodeTitle": "string",
      "youtubeVideoId": "string",
      "startSec": 0,
      "quote": "string",
      "watchUrl": "https://youtube.com/watch?v=...&t=...",
      "durationSec": 0
    }
  ],
  "noMatch": true,
  "offTopic": true
}
```

`citations` vazio quando `noMatch` ou `offTopic`. Rate limit por IP (`CHAT_RATE_LIMIT_*`).

### `POST /onboarding/suggestions`

Gera chips de onboarding a partir do acervo.

**Response 200:** `{ suggestions: string[] }` — pode ser lista vazia se acervo sem temas claros.

## Internas (protegidas)

Header obrigatório: `X-Ingest-Secret: <INGEST_SECRET>`

### `POST /internal/ingest`

Dispara job de ingestão assíncrono.

**Body (opcional):** `{ videoIds?: string[], limit?: number, force?: boolean }`

**Response 202:** `{ jobId: string }`

### `GET /internal/ingest/:jobId`

Status do job: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` + contagens.

## Health

### `GET /`

Health check simples.
