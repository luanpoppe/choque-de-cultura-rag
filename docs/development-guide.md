# Guia de desenvolvimento

## Pré-requisitos

- Node.js 20+
- pnpm
- Docker (Postgres + pgvector)
- ffmpeg (ingestão de áudio longo)
- yt-dlp no PATH ou `YTDLP_BIN`

## Setup

```bash
pnpm install
docker compose up -d
cp .env.example .env
# Preencher: DATABASE_URL, OPENROUTER_API_KEY, OPENAI_API_KEY, INGEST_SECRET
pnpm dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- Swagger: http://localhost:3000/api

## Testes

```bash
# Raiz
pnpm test

# Só backend
cd packages/backend && pnpm test

# Arquivo específico
cd packages/backend && pnpm test rag-chunk-neighbors
```

## Ingestão

```bash
curl -X POST http://localhost:3000/api/internal/ingest \
  -H "X-Ingest-Secret: $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

Acompanhar: `GET /api/internal/ingest/:jobId`

## Reingest obrigatória quando

Alterar qualquer env de chunking:

- `INGEST_FINE_GRAINED_HEAD_SEC`
- `INGEST_HEAD_CONTEXT_SEC`
- `INGEST_CHUNK_DURATION_SEC`
- `INGEST_OVERLAP_RATIO`

Use `force: true` no body do ingest ou script `reingest:force` documentado no README.

`RAG_NEIGHBOR_CHUNKS` afeta apenas runtime (agente + cards) — **não** exige reingest.

## Env vars RAG relevantes

| Var | Default | Efeito |
|-----|---------|--------|
| RAG_TOP_K | 6 | Candidatos por busca |
| RAG_MAX_DISTANCE | 0.85 | Threshold de similaridade |
| RAG_AGENT_MAX_SEARCHES | 4 | Limite de tools por turno |
| RAG_NEIGHBOR_CHUNKS | 2 | Vizinhos antes/depois no episódio |
| LOG_LEVEL | log | `debug` para detalhe por chunk |

## Convenções

- DTOs: Zod + `createZodDto`
- Env: só via `EnvService`
- IA: só via `AiService` / `@luanpoppe/ai`
- Mensagens UI/API em PT-BR; código em inglês

Ver também `_bmad-output/project-context.md` para regras de agentes.
