# Arquitetura de integração (monorepo)

## Partes

| Parte | ID | Tipo |
|-------|-----|------|
| Backend API | `backend` | NestJS REST |
| Frontend SPA | `frontend` | Next.js client |

## Pontos de integração

### Frontend → Backend (REST)

| De | Para | Protocolo | Auth |
|----|------|-----------|------|
| `chat.api.ts` | `POST /api/chat` | JSON/HTTP | Nenhuma (rate limit IP) |
| `onboarding.api.ts` | `POST /api/onboarding/suggestions` | JSON/HTTP | Nenhuma |
| Browser | `POST /api/internal/ingest` | JSON/HTTP | `X-Ingest-Secret` (operador) |

CORS: `FRONTEND_URL` allowlist no backend.

### Backend → Postgres

Prisma + raw SQL para pgvector (`<=>`).

### Backend → Externos

| Serviço | Uso |
|---------|-----|
| OpenRouter | Chat LLM, embeddings |
| OpenAI | Whisper STT com segmentos |
| YouTube (yt-dlp) | Áudio e metadados |

## Fluxo de dados (chat)

```
User → Next.js → POST /chat → RagAgentRunner
  → search_archive (embed + pgvector + neighbors)
  → submit_answer
  → RagService.buildCitations → JSON → CitationCard
```

## Persistência client-side

- Histórico de chat: `localStorage`
- Tema claro/escuro: `localStorage`

Sem sessão server-side na v1.
