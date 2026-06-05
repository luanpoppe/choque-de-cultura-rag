# Árvore de código anotada

```
choque-de-cultura-rag/
├── packages/
│   ├── backend/                 # API NestJS
│   │   ├── src/
│   │   │   ├── main.ts          # Bootstrap
│   │   │   ├── app.module.ts
│   │   │   ├── core/            # EnvService, log-level
│   │   │   ├── modules/
│   │   │   │   ├── chat/        # POST /api/chat, rate limit
│   │   │   │   ├── ingestion/   # Pipeline, merge segments, worker
│   │   │   │   ├── onboarding/  # Sugestões LLM + fallback
│   │   │   │   └── episodes/    # Metadados (se aplicável)
│   │   │   └── shared/infrastructure/
│   │   │       ├── prisma/
│   │   │       ├── ai/          # AiService, OpenRouter, Whisper
│   │   │       ├── vector-store/# ChunkRepository, pgvector
│   │   │       └── rag/         # RagService, agent tools, neighbors
│   │   └── prisma/schema.prisma
│   └── frontend/                # Next.js App Router
│       └── src/
│           ├── app/             # /, /sobre, layout
│           ├── components/chat/ # Shell, cards, composer, onboarding
│           └── lib/api/         # Clientes axios
├── _bmad-output/                # PRD, epics, stories, sprint-status
├── docs/                        # Documentação brownfield (este folder)
├── docker-compose.yml           # Postgres pgvector
└── README.md                    # Doc principal humano
```

## Pontos de entrada

| Entrada | Arquivo |
|---------|---------|
| HTTP API | `packages/backend/src/main.ts` |
| Chat UI | `packages/frontend/src/app/page.tsx` |
| Ingestão | `packages/backend/src/modules/ingestion/ingestion-pipeline.service.ts` |
| RAG | `packages/backend/src/shared/infrastructure/rag/rag.service.ts` |

## Integração front ↔ back

`packages/frontend/src/lib/api/*.ts` → axios → `localhost:3000/api`
