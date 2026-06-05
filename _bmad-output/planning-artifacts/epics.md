---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: 2026-06-03
inputDocuments:
  - prds/prd-choque-de-cultura-rag-2026-06-03/prd.md
  - prds/prd-choque-de-cultura-rag-2026-06-03/addendum.md
  - planning-artifacts/architecture.md
  - ux-designs/ux-choque-de-cultura-rag-2026-06-03/DESIGN.md
  - ux-designs/ux-choque-de-cultura-rag-2026-06-03/EXPERIENCE.md
  - ux-designs/ux-choque-de-cultura-rag-2026-06-03/mockups/key-chat-empty.html
  - ux-designs/ux-choque-de-cultura-rag-2026-06-03/mockups/key-chat-response.html
  - ../project-context.md
---

# choque-de-cultura-rag - Epic Breakdown

## Overview

Este documento decompõe o PRD, a arquitetura e o UX em epics e stories implementáveis para o Choque de Cultura RAG.

## Requirements Inventory

### Functional Requirements

FR-1: O operador pode iniciar ingestão manual via endpoint HTTP dedicado; lote ~5–10 episódios mais antigos; registra início, fim e contagem sucesso/falha.

FR-2: O sistema obtém metadados dos episódios alvo do canal Choque de Cultura no YouTube (título, URL, data, duração) e persiste antes da indexação.

FR-3: O sistema obtém transcrição de cada episódio via Whisper a partir do áudio; falha isolada por episódio com motivo registrado.

FR-4: O sistema divide transcrições em chunks (zona fina no início do vídeo: 1 segmento STT = 1 chunk; depois janelas configuráveis, default **30s**, overlap 10–15%), gera embeddings e persiste chunks + metadados temporais no vector store; acervo consultável pelo agente.

FR-5: O operador pode consultar status/logs da execução de ingestão (episódio, etapa, erro).

FR-6: O usuário pode enviar pergunta em português via chat; pergunta vazia rejeitada; loading durante processamento.

FR-7: O agente responde com base no acervo indexado sem inventar episódios/trechos; sem match → declaração explícita sem cards fabricados.

FR-8: A resposta exibe um ou mais Citation Cards com título, timestamp, trecho e link YouTube no momento exato (nova aba).

FR-9: *(Stretch v1)* Citation Cards ou texto podem identificar speaker, réplicas e contexto breve quando viável.

FR-10: O usuário pode fazer follow-up na mesma sessão; agente mantém contexto conversacional.

FR-11: Toda embedding e geração usa `@luanpoppe/ai` (OpenRouter); sem bypass direto a providers.

FR-12: Perguntas off-topic são recusadas educadamente sem Citation Cards nem fatos inventados sobre o podcast.

FR-13: Chat vazio exibe botão visível de onboarding (ex.: "Nunca ouvi Choque de Cultura — ver exemplos").

FR-14: Ao acionar onboarding, sugestões derivadas do acervo indexado (não hardcoded); acervo vazio → mensagem orientativa.

FR-15: Sugestões são clicáveis e disparam envio equivalente a FR-6.

FR-16: *(Stretch v1)* Onboarding pode exibir panorama breve do acervo indexado.

FR-17: UI de chat web responsiva, design distintivo (não template genérico IA); suporta mensagens, respostas e Citation Cards inline.

FR-18: Toggle claro/escuro visível; preferência em localStorage; default `prefers-color-scheme` se unset.

FR-19: Sessões de chat persistidas em localStorage; restauradas no mesmo browser.

FR-20: Footer (ou equivalente) com link para repositório público do projeto.

### NonFunctional Requirements

NFR-1: Custo — modelos econômicos via OpenRouter; evitar reprocessamento desnecessário na ingestão.

NFR-2: Latência — resposta de chat aceitável para demo (~15s p95 assumido).

NFR-3: Idioma — UI e respostas do agente em PT-BR.

NFR-4: Legal/ToS — posicionamento demo educacional/pessoal; README documenta limitações YouTube.

NFR-5: Segurança — API keys apenas server-side (`EnvService`); endpoint de ingestão protegido em URL pública.

NFR-6: Rate limiting no chat em demo pública (~15–30 req/min/IP alvo).

NFR-7: CORS com allowlist explícita (`FRONTEND_URL`).

NFR-8: Acessibilidade — WCAG 2.2 AA alvo (contraste, focus, aria-live, labels).

NFR-9: Deploy — demo acessível via URL pública estável (portfólio).

NFR-10: Smoke metrics — SM-1 citação verificável; SM-2 ≥5 episódios indexados; SM-3 off-topic recusado; SM-4 onboarding <60s para novato.

### Additional Requirements

- **Brownfield:** estender monorepo existente (NestJS 11.1.24, Next 15.5.19); não recriar apps.
- **Epic 1 Story 1 (arquitetura):** `docker-compose.yml` com `pgvector/pgvector:pg16`; Prisma 7.8.0; migration `CREATE EXTENSION vector`; dimensão `vector(n)` conforme modelo de embedding.
- **Camadas backend:** `core/` · `shared/infrastructure/` (prisma, vector-store, ai, rag) · `modules/` (ingestion, chat, onboarding, episodes); alias `@infrastructure/*`.
- **Ingestão:** `POST /api/internal/ingest` com `X-Ingest-Secret`; `202` + `jobId`; worker in-process; status `GET /api/internal/ingest/:jobId`.
- **Sem Redis v1** — jobs/status no Postgres.
- **Vector search:** TypedSQL ou `$queryRaw` com operador `<=>`; não Prisma ORM puro para similarity.
- **Contrato API chat:** `POST /api/chat` → `{ reply, citations[], noMatch?, offTopic? }`; `history` do client.
- **Onboarding API:** `POST /api/onboarding/suggestions` → `{ suggestions: string[] }`.
- **Retrieval:** top-k default 6; sem re-rank de embedding v1; filtro LLM de citações pós-resposta (só cards relevantes à pergunta).
- **Whisper:** API paga barata (ex. OpenAI whisper-1) via `@luanpoppe/ai` quando suportado.
- **YouTube:** yt-dlp para áudio/metadados; link `?t=startSec`.
- **Deploy:** Vercel (front) + container Nest + Postgres gerenciado com pgvector.
- **Portas dev:** backend 3000, frontend 3001.
- **Remover/ignorar** páginas scaffold signup/profile.
- **Swagger:** rotas públicas documentadas; `/internal/*` omitidas ou protegidas em produção.

### UX Design Requirements

UX-DR1: Mapear tokens `DESIGN.md` (accent rose `#e11d48`, superfícies, gradiente de página) para Tailwind / CSS variables.

UX-DR2: Implementar shell card flutuante (max-width ~440px, border-radius 28px, glass/blur, sombra rose).

UX-DR3: Hero do chat vazio — pill "Choque de Cultura", headline, subtítulo, CTA onboarding, "ou escreva abaixo" (ref. `mockups/key-chat-empty.html`).

UX-DR4: Composer pill com borda rose, focus ring, botão enviar circular (↑), placeholder PT-BR.

UX-DR5: Bubbles assimétricas — usuário escuro à direita; agente claro à esquerda.

UX-DR6: Citation Card rico inline abaixo da bubble do agente — thumbnail (ou fallback gradiente), título, timestamp·duração, trecho, link "Abrir no YouTube" (ref. `mockups/key-chat-response.html`).

UX-DR7: Suggestion chips clicáveis no feed pós-onboarding (`<button>` focáveis).

UX-DR8: Theme toggle no header; persistência `localStorage`; tokens `*-dark` do DESIGN.md.

UX-DR9: Estados loading — composer desabilitado, indicador abaixo da última user bubble, `aria-live="polite"`; sem cards parciais.

UX-DR10: Estados sem match e off-topic — só bubble do agente, zero cards (EXPERIENCE.md).

UX-DR11: Erro de API — toast react-hot-toast + mensagem PT-BR; retry possível.

UX-DR12: Footer com link GitHub + "demo portfólio".

UX-DR13: Acessibilidade — `aria-label` em enviar/tema; contraste AA; `prefers-reduced-motion` no loading.

UX-DR14: Layout resposta **inline (A)** — cards empilhados abaixo do agente, nunca split panel.

UX-DR15: Ocultar hero após primeira mensagem; restaurar feed de `localStorage` em reload (FR-19).

### FR Coverage Map

FR-1: Epic 1 — Endpoint HTTP protegido dispara ingestão assíncrona  
FR-2: Epic 1 — Metadados YouTube persistidos  
FR-3: Epic 1 — Transcrição Whisper por episódio  
FR-4: Epic 1 — Chunks, embeddings e vector store  
FR-5: Epic 1 — Status/logs de ingestão  
FR-6: Epic 2 + 3 — Envio de pergunta via API e UI  
FR-7: Epic 2 + 3 — Resposta RAG ancorada / sem match  
FR-8: Epic 2 + 3 — Citation Cards com link YouTube  
FR-9: Epic 2 — *(Stretch)* Speaker/contexto no card  
FR-10: Epic 2 + 3 — Multi-turn com history  
FR-11: Epic 2 — `@luanpoppe/ai` exclusivo  
FR-12: Epic 2 + 3 — Recusa off-topic  
FR-13: Epic 3 — Botão onboarding no empty state  
FR-14: Epic 3 — Sugestões do acervo  
FR-15: Epic 3 — Chips clicáveis  
FR-16: Epic 3 — *(Stretch)* Panorama do acervo  
FR-17: Epic 3 — UI de chat distintiva  
FR-18: Epic 3 — Toggle tema + persistência  
FR-19: Epic 3 — Sessão em localStorage  
FR-20: Epic 3 — Link GitHub no footer  

## Epic List

### Epic 1: Operador indexa o acervo do podcast
Luan dispara ingestão protegida, acompanha status e deixa ~5–10 episódios antigos indexados e buscáveis no vector store.  
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5

### Epic 2: Fã pergunta e recebe citações verificáveis
Visitante faz perguntas em PT-BR e recebe respostas com Citation Cards (ou recusa honesta / off-topic) ancoradas no acervo.  
**FRs covered:** FR-6, FR-7, FR-8, FR-10, FR-11, FR-12 (+ FR-9 stretch)

### Epic 3: Experiência de chat Modern Soft completa
Interface distintiva alinhada aos mockups: onboarding, tema, sessão persistida e footer — experiência de portfólio para fãs e recrutadores.  
**FRs covered:** FR-13, FR-14, FR-15, FR-17, FR-18, FR-19, FR-20 (+ FR-16 stretch) · **UX-DRs:** UX-DR1–UX-DR15

---

## Epic 1: Operador indexa o acervo do podcast

Luan popula o acervo indexado a partir dos episódios mais antigos do canal, com pipeline resiliente e observável.

### Story 1.1: Fundação Postgres, Prisma e módulo de infraestrutura

As a **operador (Luan)**,  
I want **Postgres com pgvector e Prisma configurados no backend**,  
So that **episódios e chunks possam ser persistidos com type-safety**.

**Acceptance Criteria:**

**Given** o monorepo brownfield existente  
**When** executo `docker compose up` e aplico migrations iniciais  
**Then** Postgres 16 com extensão `vector` está disponível na porta configurada  
**And** Prisma 7.8.0 está em `packages/backend/prisma/` com `PrismaService` em `shared/infrastructure/prisma`  
**And** `InfrastructureModule` exporta `PrismaService`  
**And** alias `@infrastructure/*` está no `tsconfig` do backend  
**And** variáveis `DATABASE_URL` validadas em `EnvService`

### Story 1.2: Cliente de IA (`@luanpoppe/ai`)

As a **desenvolvedor**,  
I want **um `AiService` centralizado via `@luanpoppe/ai`**,  
So that **embeddings, Whisper e geração usem um único ponto configurável (OpenRouter)**.

**Acceptance Criteria:**

**Given** `@luanpoppe/ai` instalado no backend  
**When** `AiService` é registrado em `shared/infrastructure/ai`  
**Then** nenhum service de produção chama providers de LLM diretamente (FR-11)  
**And** env vars de API keys passam por `EnvService`  
**And** existe teste unitário com mocks para embed (smoke)

### Story 1.3: Schema de episódios e jobs de ingestão

As a **operador**,  
I want **episódios e execuções de ingestão modelados no banco**,  
So that **cada vídeo e cada run tenham status rastreável**.

**Acceptance Criteria:**

**Given** Prisma configurado  
**When** aplico migration com models `Episode` e `IngestionJob` (nomes via `@@map`)  
**Then** `Episode` inclui `youtubeVideoId` único, título, URL, duração, `publishedAt`  
**And** `IngestionJob` registra status, contadores sucesso/falha, timestamps  
**And** relação Episode ↔ Job documentada no schema

### Story 1.4: Pipeline de ingestão (metadados, áudio, Whisper, chunks)

As a **operador**,  
I want **o pipeline que processa um lote de episódios de ponta a ponta**,  
So that **transcrições viram chunks embedados no vector store**.

**Acceptance Criteria:**

**Given** um `IngestionJob` em estado `running`  
**When** o worker processa o lote (~5–10 episódios mais antigos)  
**Then** metadados YouTube são obtidos e persistidos (FR-2)  
**And** áudio é extraído (yt-dlp), transcrito via Whisper API barata (FR-3)  
**And** falha em um episódio registra motivo e não bloqueia os demais (FR-3)  
**And** transcrição vira chunks via merge de segmentos STT (zona fina + janelas ~30s, overlap 10–15%) (FR-4)  
**And** embeddings são gerados via `AiService` e persistidos com `startSec`/`endSec` (FR-4)  
**And** busca por similaridade funciona via TypedSQL/`$queryRaw` em `vector-store`  
**And** áudio temporário é removido após transcrição

### Story 1.5: API de ingestão protegida e observabilidade

As a **operador**,  
I want **disparar e consultar ingestão via HTTP com segurança**,  
So that **possa indexar o acervo em deploy público sem abuso**.

**Acceptance Criteria:**

**Given** `INGEST_SECRET` configurado  
**When** envio `POST /api/internal/ingest` com header `X-Ingest-Secret` válido  
**Then** recebo `202` com `{ jobId }` e job processa em background (FR-1)  
**And** requisição sem secret retorna `401` ou `403` (NFR-5)  
**And** `GET /api/internal/ingest/:jobId` com mesmo secret retorna status, contagem e erros por episódio (FR-5)  
**And** re-ingestão do mesmo `youtubeVideoId` é idempotente (skip ou `force` documentado)  
**And** endpoint não aparece no Swagger público em produção (configurável)

### Story 1.6: Timestamps reais na ingestão *(pós-TR 2026-06-03)*

As a **visitante do chat**,  
I want **links do YouTube nos cards que apontem para o momento real da fala**,  
So that **eu não precise procurar manualmente no episódio**.

**Acceptance Criteria:**

**Given** episódio em ingestão  
**When** o pipeline transcreve o áudio  
**Then** segmentos STT com `start`/`end` reais são persistidos (`TranscriptSegment`) — fonte primária OpenAI `whisper-1` + `verbose_json` + granularidade `segment` (TR: OpenRouter STT não expõe segmentos)  
**And** chunks são derivados por merge de segmentos (`INGEST_FINE_GRAINED_HEAD_SEC` + `INGEST_CHUNK_DURATION_SEC` default 30s, overlap 10–15%), não por repartição proporcional de palavras  
**And** uma única passagem de STT por episódio (sem custo duplicado)  
**And** `OPENAI_API_KEY` só na ingestão; chat/embeddings permanecem no OpenRouter  
**And** re-ingestão com `force` atualiza segmentos + chunks  
**And** áudio >25 MB é fatiado antes do STT com offset de timestamps  
**And** contrato `POST /api/chat` / `citations[]` inalterado (melhora automática de `startSec`)

**Research:** `_bmad-output/planning-artifacts/research/technical-whisper-timestamps-ingestao-research-2026-06-03.md`

---

## Epic 2: Fã pergunta e recebe citações verificáveis

Visitantes conversam com o acervo e recebem respostas verificáveis com link para o YouTube.

### Story 2.1: Motor RAG (retrieval + guardrails)

As a **visitante do chat**,  
I want **respostas fundamentadas apenas no acervo indexado**,  
So that **eu confie que as citações são reais**.

**Acceptance Criteria:**

**Given** chunks indexados no vector store  
**When** `RagService` em `shared/infrastructure/rag` recebe pergunta + history opcional  
**Then** gera embedding da pergunta via `AiService`  
**And** recupera top-k=6 chunks via `ChunkRepository.searchSimilar`  
**And** monta prompt com contexto e instruções de domínio Choque de Cultura  
**And** retorna estrutura `{ reply, citations[], noMatch?, offTopic? }` conforme contrato da arquitetura  
**And** `citations[]` inclui apenas trechos que sustentam a resposta (filtro LLM após geração; não todos os chunks do top-k)  
**And** sem chunks relevantes → `noMatch: true`, `citations: []` (FR-7)  
**And** pergunta off-topic → `offTopic: true`, sem cards fabricados (FR-12)  
**And** history do client é considerada para follow-up (FR-10)

### Story 2.2: API pública de chat

As a **visitante**,  
I want **enviar perguntas via `POST /api/chat`**,  
So that **eu interaja com o agente pela interface web**.

**Acceptance Criteria:**

**Given** `ChatModule` em `modules/chat`  
**When** envio `{ message, history? }` válido em PT-BR  
**Then** recebo resposta no contrato documentado (FR-6, FR-8)  
**And** cada citation inclui `episodeTitle`, `youtubeVideoId`, `startSec`, `quote`  
**And** mensagem vazia retorna `400` com feedback claro (FR-6)  
**And** endpoint documentado no Swagger  
**And** latência aceitável para demo (NFR-2 — sem timeout prematuro no client)

### Story 2.3: Rate limiting do chat

As a **operador do deploy**,  
I want **limite de requisições no chat**,  
So that **a demo pública não estoure custo de API**.

**Acceptance Criteria:**

**Given** chat em produção  
**When** um IP excede ~20 req/min no `POST /api/chat`  
**Then** recebe `429` com mensagem clara  
**And** limite configurável via env (NFR-6)

### Story 2.4: Enriquecimento speaker/contexto *(Stretch v1)*

As a **fã**,  
I want **ver quem falou e contexto no card quando disponível**,  
So that **eu entenda o debate sem reassistir**.

**Acceptance Criteria:**

**Given** metadados de speaker disponíveis no chunk ou pós-processamento  
**When** a resposta inclui citation  
**Then** card pode exibir `speaker` e `context` opcionais (FR-9)  
**And** ausência desses campos não impede FR-8 (card mínimo funciona)

---

## Epic 3: Experiência de chat Modern Soft completa

Interface única de chat, memorável e alinhada a DESIGN.md / EXPERIENCE.md / mockups.

### Story 3.1: Shell do chat, tokens visuais e layout base

As a **visitante**,  
I want **uma interface Modern Soft distintiva**,  
So that **a demo comunique qualidade de produto e portfólio (FR-17)**.

**Acceptance Criteria:**

**Given** mockups `key-chat-empty.html` e `key-chat-response.html`  
**When** abro `/` no frontend  
**Then** vejo shell centralizado ~440px, glass, accent rose, tipografia sans (UX-DR1, UX-DR2)  
**And** header com brand "Choque RAG" + lugar para theme toggle (UX-DR8 parcial)  
**And** footer com link GitHub placeholder (FR-20, UX-DR12)  
**And** páginas signup/profile não são linkadas (fora de escopo)  
**And** não uso aesthetic genérica roxa/cookie-cutter (NFR / PRD §9)

### Story 3.2: Chat vazio, composer e envio de mensagens

As a **visitante**,  
I want **perguntar em português com feedback claro**,  
So that **eu encontre trechos do podcast facilmente**.

**Acceptance Criteria:**

**Given** chat sem mensagens na sessão  
**When** vejo hero com pill, headline, subtítulo e composer pill (UX-DR3, UX-DR4)  
**Then** placeholder convida pergunta em PT-BR  
**And** Enter ou botão ↑ envia pergunta (FR-6)  
**And** pergunta vazia mostra toast ou feedback sem chamar API (UX-DR4)  
**And** durante loading composer desabilita e indicador aparece com `aria-live="polite"` (UX-DR9)  
**And** user bubble à direita e agent bubble à esquerda após resposta (UX-DR5)  
**And** integração com `POST /api/chat` inclui `history` da sessão (FR-10)

### Story 3.3: Citation Cards inline

As a **visitante**,  
I want **cards de citação abaixo da resposta do agente**,  
So that **eu abra o YouTube no minuto exato (FR-8)**.

**Acceptance Criteria:**

**Given** resposta com `citations[]`  
**When** renderizo o turn do agente  
**Then** cards aparecem empilhados abaixo da bubble (UX-DR14, layout A)  
**And** cada card mostra título, timestamp, trecho e botão "Abrir no YouTube" (UX-DR6)  
**And** link usa `https://www.youtube.com/watch?v={id}&t={startSec}s` em nova aba  
**And** `noMatch` ou `offTopic` não renderizam cards (UX-DR10, FR-7, FR-12)

### Story 3.4: Onboarding para quem não conhece o podcast

As a **recrutador ou visitante novo**,  
I want **exemplos de perguntas reais do acervo**,  
So that **eu teste o produto em menos de 60s (SM-4)**.

**Acceptance Criteria:**

**Given** chat vazio  
**When** clico "Nunca ouvi Choque de Cultura — ver exemplos" (FR-13, UX-DR3)  
**Then** frontend chama API de sugestões derivadas do acervo indexado (FR-14)  
**And** backend amostra trechos reais do vector store e gera perguntas curtas em PT-BR via `AiService` (`CHAT_MODEL`), sem copiar transcrição literal; fallback heurístico se a IA falhar (FR-11)  
**And** chips clicáveis enviam pergunta ao chat (FR-15, UX-DR7)  
**And** acervo vazio mostra mensagem orientativa (FR-14)  
**And** hero oculta após primeira mensagem (UX-DR15)

### Story 3.5: Tema claro/escuro e persistência de sessão

As a **visitante recorrente**,  
I want **tema e histórico salvos no browser**,  
So that **eu retome de onde parei (FR-18, FR-19)**.

**Acceptance Criteria:**

**Given** toggle no header  
**When** alterno tema  
**Then** UI aplica tokens `*-dark` do DESIGN.md (UX-DR8)  
**And** preferência persiste em `localStorage` e sobrevive reload (FR-18)  
**And** sem preferência salva, default segue `prefers-color-scheme` (FR-18)  
**And** mensagens da sessão persistem em `localStorage` e restauram ao reabrir (FR-19)  
**And** limpar dados do browser remove histórico (comportamento esperado)

### Story 3.6: Estados de erro, acessibilidade e polish final

As a **visitante**,  
I want **erros claros e UI acessível**,  
So that **a experiência seja profissional em demo pública**.

**Acceptance Criteria:**

**Given** falha de rede ou 5xx na API  
**When** envio pergunta  
**Then** toast react-hot-toast com mensagem PT-BR e possibilidade de retry (UX-DR11)  
**And** botões críticos têm `aria-label` (enviar, tema) (UX-DR13)  
**And** focus rings visíveis (contraste AA) (UX-DR13, NFR-8)  
**And** `prefers-reduced-motion` reduz animação de loading (UX-DR13)  
**And** link GitHub no footer aponta para repo público configurável (FR-20)

### Story 3.7: Panorama do acervo no onboarding *(Stretch v1)*

As a **visitante novo**,  
I want **um resumo breve do que está indexado**,  
So that **eu entenda o escopo antes de perguntar (FR-16)**.

**Acceptance Criteria:**

**Given** acervo com episódios indexados  
**When** aciono onboarding  
**Then** além dos chips, posso ver panorama textual de temas/episódios reais (FR-16)  
**And** texto menciona apenas conteúdo indexado

### Story 3.8: Nova conversa e shell expandido *(Pós-MVP / polish)*

As a **visitante do chat**,  
I want **reiniciar a conversa com um botão e um painel de chat maior**,  
So that **eu comece outro tópico sem apagar dados do browser e use melhor a tela em desktop**.

**Acceptance Criteria:**

**Given** mensagens, sugestões de onboarding ou panorama visível  
**When** clico em **Nova conversa** no header  
**Then** sessão é limpa no `localStorage` e na UI; hero vazio retorna; tema permanece (extensão FR-19)  
**And** botão oculto quando não há nada a resetar; desabilitado durante loading  

**Given** layout do chat  
**Then** shell central usa **`min(960px, 92vw)`** de largura máxima e altura mínima **`min(80vh, 900px)`** — desvio documentado em relação ao **440px** da story 3.1 / DESIGN.md  

**Implementação:** `_bmad-output/implementation-artifacts/3-8-nova-conversa-shell-expandido.md` — **done** (2026-06-03).
