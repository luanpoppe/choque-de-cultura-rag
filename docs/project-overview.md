# Visão geral — choque-de-cultura-rag

## Propósito

Chat em português sobre o programa **Choque de Cultura** (TV Quase), com respostas ancoradas em transcrições reais de episódios no YouTube. Cada resposta relevante pode incluir **Citation Cards** (episódio, timestamp, trecho) com link `?t=` para o momento exato.

PoC de portfólio: ~5–10 episódios indexados, demo pública, desenvolvimento guiado por BMad Method (PRD → arquitetura → epics → stories).

## Estrutura do repositório

| Parte | Caminho | Papel |
|-------|---------|-------|
| Backend | `packages/backend` | API NestJS, ingestão, RAG, pgvector |
| Frontend | `packages/frontend` | SPA Next.js — chat, onboarding, /sobre |
| Artefatos BMad | `_bmad-output/` | PRD, UX, stories, sprint status |
| Docs IA | `docs/` | Este índice e referências brownfield |

## Fluxo principal

1. **Operador** dispara `POST /api/internal/ingest` → pipeline YouTube/yt-dlp → Whisper → chunks → embeddings.
2. **Visitante** envia pergunta em `POST /api/chat` → agente RAG com tools → resposta + citações.
3. **Onboarding** sugere perguntas via `POST /api/onboarding/suggestions` a partir de amostras do acervo.

## Decisões arquiteturais chave

- **Sem Redis v1** — jobs de ingestão no Postgres, worker in-process.
- **RAG agente** — `search_archive` + `submit_answer`, não retrieval fixo pré-LLM.
- **Chunking híbrido** — zona fina (1 segmento STT = 1 chunk ancorado + contexto vizinho) + janelas com overlap.
- **Contexto em duas camadas** — ingestão (`INGEST_HEAD_CONTEXT_SEC`) e runtime (`RAG_NEIGHBOR_CHUNKS`).
- **STT** — OpenAI `whisper-1` com segmentos; OpenRouter para chat/embeddings.

## Status do sprint (2026-06-05)

- 3 épicos `done`, retrospectivas registradas.
- Único backlog: stretch `2-4-speaker-attribution`.
- Polish recente: contexto de chunks vizinhos (commits `5c2ca64`, `d519ea3`, `78b13e8`).
