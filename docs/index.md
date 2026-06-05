# choque-de-cultura-rag — Índice de documentação

**Gerado:** 2026-06-05 · **Scan:** quick (pattern-based)  
**Tipo:** monorepo (backend NestJS + frontend Next.js)

## Referência rápida

| Camada | Stack |
|--------|-------|
| API | NestJS 11, Zod, Swagger `/api` |
| Frontend | Next.js 15 App Router, React 19, Tailwind 3 |
| Dados | PostgreSQL 16 + pgvector, Prisma 7 |
| IA | `@luanpoppe/ai` (OpenRouter + OpenAI Whisper na ingestão) |

## Documentação gerada

- [Visão geral do projeto](./project-overview.md)
- [Árvore de código anotada](./source-tree-analysis.md)
- [Guia de desenvolvimento](./development-guide.md)
- [Contratos de API — backend](./api-contracts-backend.md)
- [Modelos de dados — backend](./data-models-backend.md)
- [Arquitetura de integração](./integration-architecture.md)

## Documentação existente (repositório)

- [README raiz](../README.md) — setup, arquitetura, env vars
- [Arquitetura BMad](../_bmad-output/planning-artifacts/architecture.md)
- [Epics e stories](../_bmad-output/planning-artifacts/epics.md)
- [Project context (agentes)](../_bmad-output/project-context.md)
- [UX DESIGN](../_bmad-output/planning-artifacts/ux-designs/ux-choque-de-cultura-rag-2026-06-03/DESIGN.md)

## Começando

```bash
pnpm install
docker compose up -d
cp .env.example .env   # preencher chaves
pnpm dev               # backend :3000, frontend :3001
```

Ver [development-guide.md](./development-guide.md) para ingestão, testes e reingest.
