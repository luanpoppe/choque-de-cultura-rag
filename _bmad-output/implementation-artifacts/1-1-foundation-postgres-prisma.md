---
baseline_commit: db5ecce436060dc1f21100a55a76974d2ccdb4ef
story_key: 1-1-foundation-postgres-prisma
---

# Story 1.1: Fundação Postgres, pgvector e infra Prisma

Status: review

## Story

Como operador do PoC,
quero Postgres com pgvector e Prisma configurados no backend,
para que episódios e embeddings possam ser persistidos nas stories seguintes.

## Acceptance Criteria

1. **AC1** — `docker compose up -d` sobe PostgreSQL 16 com extensão `vector` (imagem `pgvector/pgvector:pg16`).
2. **AC2** — Prisma **7.8.x** em `packages/backend/prisma/` com migration inicial que executa `CREATE EXTENSION IF NOT EXISTS vector`.
3. **AC3** — `PrismaService` e `PrismaModule` em `packages/backend/src/shared/infrastructure/prisma/`.
4. **AC4** — `InfrastructureModule` exporta `PrismaService` para módulos de feature.
5. **AC5** — Alias TypeScript `@infrastructure/*` → `src/shared/infrastructure/*` (tsconfig + Jest).
6. **AC6** — `EnvService` valida `DATABASE_URL` (obrigatória em runtime de app; testes podem mockar).
7. **AC7** — Testes unitários cobrem validação de env e lifecycle básico do `PrismaService` (mock de `$connect`/`$disconnect`).

## Tasks / Subtasks

- [x] Task 1: Docker e variáveis de ambiente (AC: 1, 6)
  - [x] Subtask 1.1: `docker-compose.yml` na raiz com Postgres pgvector (porta host **6017**)
  - [x] Subtask 1.2: `.env.example` com `DATABASE_URL` documentada
  - [x] Subtask 1.3: `EnvService` exige `DATABASE_URL`
- [x] Task 2: Prisma schema e migration pgvector (AC: 2)
  - [x] Subtask 2.1: Dependências `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg` 7.8.x
  - [x] Subtask 2.2: `schema.prisma` + `prisma.config.ts` + migration SQL com extensão vector
  - [x] Subtask 2.3: Scripts `prisma:generate` / `prisma:migrate` no package.json
- [x] Task 3: Camada infrastructure Nest (AC: 3, 4, 5)
  - [x] Subtask 3.1: `PrismaService` com adapter `PrismaPg` e lifecycle
  - [x] Subtask 3.2: `PrismaModule` + `InfrastructureModule`
  - [x] Subtask 3.3: `AppModule` importa `InfrastructureModule`
  - [x] Subtask 3.4: Paths `@infrastructure/*` em tsconfig e jest
- [x] Task 4: Testes e validação (AC: 7)
  - [x] Subtask 4.1: `env.service.spec.ts` para `DATABASE_URL`
  - [x] Subtask 4.2: `prisma.service.spec.ts` com mocks
  - [x] Subtask 4.3: `pnpm --filter backend test` e type-check passando

## Dev Notes

### Arquitetura

- Postgres 16 + pgvector via Docker; sem Redis na v1.
- Prisma 7.8.x: URL em `prisma.config.ts`; client gerado em `src/generated/prisma` com `@prisma/adapter-pg`.
- Estrutura: `core/` (Env), `shared/infrastructure/` (prisma, futuro vector-store, ai, rag), `modules/` só features HTTP.

### Estrutura de arquivos

```
docker-compose.yml
.env.example
packages/backend/prisma.config.ts
packages/backend/prisma/schema.prisma
packages/backend/prisma/migrations/*/migration.sql
packages/backend/src/shared/infrastructure/prisma/prisma.service.ts
packages/backend/src/shared/infrastructure/prisma/prisma.module.ts
packages/backend/src/shared/infrastructure/infrastructure.module.ts
```

### Referências

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/project-context.md]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

- Prisma 7 exige `prisma.config.ts` (sem `url` no schema) e `PrismaPg` adapter no `PrismaService`.
- `ConfigModule` carrega `.env` da raiz do monorepo (`../../.env`).
- Porta Postgres no host: **6017** (mapeamento `6017:5432`).

### Debug Log References

- `prisma migrate deploy` falhou localmente quando outro serviço ocupa a 6017 com credenciais diferentes do `docker-compose` — usar container `choque-rag-postgres` ou alinhar `DATABASE_URL`.

### Completion Notes List

- Fundação Docker + Prisma 7.8 + infra Nest implementada; 6 testes unitários passando.
- Após `docker compose up -d`, rodar `pnpm --filter @choque-de-cultura-rag/backend prisma:migrate` com `DATABASE_URL` apontando para `localhost:6017`.

### File List

- docker-compose.yml
- .env.example
- .gitignore
- packages/backend/package.json
- packages/backend/prisma.config.ts
- packages/backend/prisma/schema.prisma
- packages/backend/prisma/migrations/20260603120000_init_pgvector/migration.sql
- packages/backend/prisma/migrations/migration_lock.toml
- packages/backend/src/app.module.ts
- packages/backend/src/core/env.service.ts
- packages/backend/src/core/env.service.spec.ts
- packages/backend/src/shared/infrastructure/infrastructure.module.ts
- packages/backend/src/shared/infrastructure/prisma/prisma.module.ts
- packages/backend/src/shared/infrastructure/prisma/prisma.service.ts
- packages/backend/src/shared/infrastructure/prisma/prisma.service.spec.ts
- packages/backend/tsconfig.json
- packages/backend/jest.config.js
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-06-03: Story criada a partir de epics.md para desbloquear dev-story.
- 2026-06-03: Implementação concluída — Prisma 7 config, adapter pg, infra module, testes.
