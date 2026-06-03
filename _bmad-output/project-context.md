---
project_name: 'choque-de-cultura-rag'
user_name: 'Luan'
date: '2026-06-03'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: complete
rule_count: 38
optimized_for_llm: true
---

# Project Context for AI Agents

_Regras críticas para implementação neste projeto. Foco em detalhes não óbvios — leia antes de escrever código._

---

## Technology Stack & Versions

| Camada | Stack | Versões |
|---|---|---|
| Monorepo | pnpm workspaces | `packages/backend`, `packages/frontend` |
| Backend | NestJS 11 + Express | `@nestjs/*` ^11.1.24, TypeScript ^5.7 |
| Validação | Zod + nestjs-zod | zod ^4.3, `ZodValidationPipe` global |
| API docs | Swagger | rota `/api`, `cleanupOpenApiDoc` |
| Frontend | Next.js App Router | next 15.5.19, React 19, Turbopack (`next dev --turbopack`) |
| Estilo | Tailwind CSS | ^3.4 |
| HTTP | axios | ^1.7.9 |
| Toasts | react-hot-toast | layout root |
| Testes | Jest + SWC | `@swc/jest`, `*.spec.ts` |
| **IA (obrigatório)** | `@luanpoppe/ai` | versão mais recente — **ainda não instalado** |

**Dev:** `pnpm dev` na raiz sobe backend + frontend em paralelo.

**Produto (brief aprovado):** RAG sobre episódios do Choque de Cultura (YouTube). PoC: ~5–10 episódios mais antigos. Referência: `_bmad-output/planning-artifacts/briefs/brief-choque-de-cultura-rag-2026-06-03/`.

---

## Critical Implementation Rules

### Language-Specific Rules

- **TypeScript strict** em ambos os pacotes; backend tem `noImplicitAny: false` — não introduzir `any` desnecessário.
- Backend: `module: commonjs`, decorators habilitados (`emitDecoratorMetadata`, `experimentalDecorators`).
- Frontend: `moduleResolution: bundler`, JSX preserve — App Router.
- Backend path aliases: `@/*` → `src/*`, `@core/*`, `@modules/*` — usar aliases, não caminhos relativos longos.
- Frontend path alias: `@/*` → `./src/*`.
- Mensagens de API e UI em **PT-BR** (brief); código/identificadores em inglês.
- `void bootstrap()` no `main.ts` — padrão existente para entrypoint async.

### Framework-Specific Rules

**NestJS (backend)**

- Novos domínios → módulos em `src/modules/` (alias `@modules/*`); registrar em `AppModule`.
- **DTOs:** schema Zod → `createZodDto()` — nunca `class-validator`.
- **Env vars:** validar via `EnvService.getEnvs()` (Zod) — não acessar `process.env` direto nos services.
- `ZodValidationPipe` já é global — DTOs Zod funcionam automaticamente.
- Swagger: documentar endpoints novos; manter rota `/api`.
- CORS já habilitado — configurar origins explicitamente se necessário em produção.
- Expandir `EnvService` ao adicionar vars (vector store, YouTube API, etc.).

**Next.js (frontend)**

- App Router (`src/app/`); páginas interativas → `"use client"`.
- Navegação: `next/navigation` (`useRouter`, `usePathname`) — **nunca** `next/router` (bug no scaffold `signup/page.tsx`).
- Requisições HTTP via **axios**; loading/erro via hook `useIsLoading` em `src/utils/custom-hooks/`.
- Toasts via `react-hot-toast` (já no layout).
- Tailwind para estilo — design **distintivo**, evitar aesthetic genérica de IA (brief).

**IA / RAG (a implementar)**

- **Toda** integração de IA via `@luanpoppe/ai` — não chamar OpenAI/Gemini direto.
- Env vars `GEMINI_API_KEY`/`OPENAI_API_KEY` no scaffold são legado — migrar para config da `@luanpoppe/ai`.
- Respostas RAG devem incluir **vídeo + timestamp** (título, URL, momento).
- Guardrails: agente responde **somente** sobre Choque de Cultura; off-topic → recusa educada.
- Ingestão v1: episódios **mais antigos** primeiro (~5–10).

### Testing Rules

- Backend unitários: `*.spec.ts` colocado junto ao código em `src/`.
- Runner: Jest + `@swc/jest`; respeitar `moduleNameMapper` (`@/`, `@core/`, `@modules/`).
- E2E: `test/*.e2e-spec.ts` com config separada (`jest-e2e.json`).
- Testar DTOs Zod com casos válidos/inválidos; mockar serviços externos (YouTube, vector store, LLM).
- Não exigir cobertura 100% na PoC — exigir testes nos fluxos críticos (ingestão, RAG, guardrails).

### Code Quality & Style Rules

- ESLint 9 flat config (backend: `eslint.config.mjs`); rodar `lint` antes de commitar.
- Prettier no backend (plugin eslint); `endOfLine: auto`.
- Arquivos backend: kebab-case (`create-user.dto.ts`, `env.service.ts`).
- Componentes React: PascalCase; hooks: camelCase com prefixo `use`.
- Organização frontend: páginas em `app/`, hooks em `utils/custom-hooks/`, enums em `utils/enums/`.
- Comentários só para lógica não óbvia — código autoexplicativo preferido.
- Swagger/OpenAPI mantido atualizado com endpoints novos.

### Development Workflow Rules

- Package manager: **pnpm** (não npm/yarn).
- Dev root: `pnpm dev` — backend e frontend em paralelo.
- **Conflito de portas:** backend default 3000, Next default 3000 — frontend deve usar porta diferente (ex.: 3001) ou backend em outra porta via `PORT`.
- Commits: Conventional Commits (recomendado pelo BMad/WDS).
- Não commitar `.env`, credenciais, tokens.
- Artefatos BMad em `_bmad-output/`; brief em `planning-artifacts/briefs/`.
- Preferir diffs mínimos — não refatorar código não relacionado à story.

### Critical Don't-Miss Rules

**Fora do escopo v1 (não implementar sem PRD explícito)**

- Autenticação / signup / login / profile — páginas existem no scaffold, **ignorar ou remover** na PoC.
- Indexação do canal inteiro; pipeline recorrente para episódios novos.
- Admin panel; monetização; mobile nativo.

**Anti-patterns**

- Chamar APIs de LLM direto ignorando `@luanpoppe/ai`.
- RAG que responde sem citar fonte (vídeo + timestamp).
- `process.env.FOO` solto no backend — usar `EnvService`.
- `class-validator` / `ValidationPipe` do Nest — projeto usa Zod.
- UI genérica (gradiente roxo, layout cookie-cutter de chat IA).
- Scrape YouTube sem considerar ToS — posicionar como demo educacional/pessoal.

**Segurança**

- Nunca commitar API keys; usar `.env` + `EnvService`.
- Validar input do chat no backend (Zod) antes de enviar ao agente.
- Rate limiting no endpoint de chat — considerar na implementação.

**Monorepo**

- Dependências de IA/RAG no **backend**; frontend só consome API REST.
- Não duplicar lógica de RAG no frontend.

---

## Usage Guidelines

**Para agentes de IA:**

- Leia este arquivo + brief aprovado antes de implementar.
- Em dúvida, prefira a opção mais restritiva.
- Atualize este arquivo se novos padrões surgirem (ex.: vector store escolhido, convenções de módulo).

**Para humanos:**

- Mantenha enxuto — só regras que agentes esqueceriam.
- Atualize quando a stack mudar (ex.: após decisão de arquitetura).
- Remova regras que ficarem óbvias com o tempo.

**Last Updated:** 2026-06-03
