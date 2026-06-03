---
name: Choque RAG
status: final
project: choque-de-cultura-rag
created: 2026-06-03
updated: 2026-06-03
form_factor: web
sources:
  - {planning_artifacts}/prds/prd-choque-de-cultura-rag-2026-06-03/prd.md
  - {planning_artifacts}/briefs/brief-choque-de-cultura-rag-2026-06-03/brief.md
  - {planning_artifacts}/project-context.md
---

# Choque RAG — Experience Spine

> Single-page web chat. Next.js 15 + Tailwind. `DESIGN.md` é a referência visual; este spine define comportamento, IA e fluxos. **Spine vence em conflito com mocks.**

## Foundation

**Form-factor:** web app responsivo, mobile-first. Superfície única de chat — sem navegação multi-página na v1 (páginas scaffold signup/profile ignoradas ou removidas).

**UI system:** Tailwind CSS; tokens visuais mapeados de `{DESIGN.md}` frontmatter. Sem shadcn obrigatório — componentes custom alinhados aos mockups aprovados.

**Persistência client-side:** preferência de tema e histórico de sessão em `localStorage` (FR-18, FR-19). Sem auth na v1.

**Idioma:** PT-BR em toda UI e respostas do agente.

→ Composição: `mockups/key-chat-empty.html`, `mockups/key-chat-response.html`

## Information Architecture

| Surface | Rota | Propósito |
|---|---|---|
| Chat | `/` (ou rota única equivalente) | Perguntar, receber respostas RAG, ver Citation Cards, onboarding |
| *(sem UI)* Ingestão | endpoint HTTP backend | Operador (Luan) indexa episódios — UJ-3, fora do frontend |

**Layout de resposta:** **Inline (A)** — Citation Cards empilhados diretamente abaixo da bubble do agente, no fluxo de scroll. Revisitar split panel apenas se demo desktop exigir destaque extra (decisão fechada: inline).

**Header persistente:** brand + toggle tema em todas as telas.

**Footer:** link repositório GitHub + "demo portfólio" (FR-20).

### Mock coverage

| Surface / estado | Referência visual | Notas |
|---|---|---|
| Chat vazio + onboarding | `mockups/key-chat-empty.html` | Mockado |
| Resposta + Citation Card rico | `mockups/key-chat-response.html` | Mockado |
| Loading (agente pensando) | spine-only | Ver State Patterns |
| Sugestões clicáveis pós-onboarding | spine-only | Chips no feed; padrão derivado de `{components.suggestion-chip}` |
| Off-topic / sem match | spine-only | Bubble agente, sem cards |
| Tema escuro | spine-only | Tokens `*-dark` em DESIGN.md |
| Erro de API | spine-only | Toast via react-hot-toast |

## Voice and Tone

Microcopy. Postura de marca em `DESIGN.md` Brand & Style.

| Contexto | Tom | Exemplo |
|---|---|---|
| Hero empty | Direto, convidativo | *"O que você quer encontrar no podcast?"* |
| Subtítulo | Explica valor em uma linha | *"Pergunte em português — a gente aponta o episódio e o minuto exato no YouTube."* |
| Onboarding CTA | Honesto, sem jargão | *"Nunca ouvi Choque de Cultura — ver exemplos"* |
| Agente (resposta) | Informal como o podcast, preciso nas citações | Tom conversacional; trechos ancorados |
| Off-topic | Recusa educada, redireciona | *"Só consigo ajudar com episódios do Choque de Cultura indexados. Tenta perguntar sobre um filme, debate ou episódio?"* |
| Sem match | Honesto, sem inventar | *"Não encontrei isso nos episódios indexados."* |
| Acervo vazio (onboarding) | Orienta operador implícito | *"O acervo ainda está sendo indexado. Volta em breve ou pergunta algo depois da ingestão."* |
| Loading | Neutro | Indicador visual; evitar "Pensando..." genérico longo — preferir skeleton ou dots discretos |
| Erro | Claro, retry | *"Não deu para responder agora. Tenta de novo."* + toast |

**Evitar:** emojis em excesso, hype de IA ("Powered by magic"), tom corporativo frio.

## Component Patterns

Comportamento. Specs visuais em `DESIGN.md` Components.

| Componente | Onde | Regras comportamentais |
|---|---|---|
| **Chat composer** | Base do shell | Enter envia; Shift+Enter nova linha se multiline (v1 pode ser single-line). Pergunta vazia → feedback inline ou toast, não dispara API. Desabilita input durante loading. |
| **Send button** | Composer | Mesmo efeito que Enter. Ícone ↑; aria-label "Enviar pergunta". |
| **User bubble** | Feed | Cada pergunta do usuário; alinhada à direita; ordem cronológica. |
| **Agent bubble** | Feed | Texto da resposta RAG; precede Citation Cards da mesma turn. |
| **Citation Card** | Inline abaixo agent bubble | 0..N cards por resposta. Campos obrigatórios: título episódio, timestamp, trecho, link YouTube no offset. Stretch: speaker, contexto (FR-9). Link abre **nova aba** YouTube no timestamp. Thumbnail: imagem real do vídeo quando disponível; fallback gradiente. |
| **Onboarding CTA** | Hero empty only | Visível só sem mensagens na sessão. Clique → busca sugestões do acervo (FR-14) → exibe chips clicáveis no feed. Oculta hero após primeira mensagem. |
| **Suggestion chip** | Feed pós-onboarding | Clique = envia texto como mensagem usuário (FR-15). Hover/focus states acessíveis. |
| **Theme toggle** | Header | Alterna claro/escuro; persiste `localStorage`. Primeira visita: default `prefers-color-scheme` se sem preferência salva (FR-18). |
| **Footer link** | Rodapé | GitHub abre repo público em nova aba. |

**Ordem no feed (turn do agente):** `[agent bubble]` → `[citation card 1]` → `[citation card 2]` → …

## State Patterns

| Estado | Superfície | Tratamento |
|---|---|---|
| **Cold load, sessão vazia** | Chat | Hero completo (pill, headline, subtítulo, onboarding CTA, composer). Footer visível. |
| **Cold load, sessão restaurada** | Chat | Feed com histórico de `localStorage`; hero oculto; scroll ao fim ou última mensagem. |
| **Loading** | Chat | Após envio: composer desabilitado ou send loading; indicador abaixo da última user bubble (typing dots ou skeleton compacto). Sem Citation Cards parciais. |
| **Resposta com citações** | Chat | Agent bubble + N cards inline. Feed scrollável; composer reabilitado. |
| **Resposta sem match** | Chat | Agent bubble com copy honesta; **zero** Citation Cards fabricados (FR-7). |
| **Off-topic** | Chat | Agent bubble recusa; sem cards; sugere reformular (FR-12). |
| **Onboarding ativo** | Chat | CTA substituído ou complementado por lista de `{components.suggestion-chip}`; acervo vazio → mensagem orientativa. |
| **Erro de rede/API** | Chat | Toast (react-hot-toast); última user bubble permanece; usuário pode retry. |
| **Tema escuro** | Global | Tokens `*-dark`; toggle reflete estado (sol/lua). |
| **Input inválido** | Composer | Vazio → shake sutil ou toast *"Escreve uma pergunta primeiro"*; não chama backend. |

## Interaction Primitives

- **Mouse/touch:** tap em chip envia; tap em card link → YouTube; tap toggle → tema.
- **Teclado:** Tab order lógico (toggle → onboarding/feed → composer → send). Enter envia do composer. Escape não fecha nada crítico na v1 (sem modals).
- **Scroll:** feed interno scrolla; shell max-height ~90vh em viewports baixas.
- **Persistência:** cada turn append na sessão local; reload restaura (FR-19).
- **Banned v1:** player YouTube embutido; histórico server-side; drag-and-drop; modals de confirmação para ações triviais.

## Accessibility Floor

Comportamental. Contraste visual verificado contra tokens `DESIGN.md` (AA mínimo).

- WCAG 2.2 AA alvo em texto, links e focus rings (`{colors.accent-ring}`).
- Toggle tema: `aria-label` descritivo; estado anunciável.
- Citation Card links: texto discernível (*"Abrir no YouTube"*, não só ícone).
- Loading: `aria-live="polite"` na região de resposta pendente.
- Chips de sugestão: elementos `<button>` focáveis, não divs clicáveis.
- Respeitar `prefers-reduced-motion` para animações de loading (implementação).

## Responsive & Platform

| Viewport | Comportamento |
|---|---|
| 320–440px | Shell full-width menos gutter; layout como mockups. |
| 441px+ | Shell fixo `{spacing.shell-max-width}` centrado; gradiente preenche viewport. |
| Desktop | Mesmo shell narrow — produto é demo focada, não dashboard wide. |

Web only na v1; PWA/offline fora de escopo.

## Inspiration & Anti-patterns

**Aprovado (Modern Soft v2 + vermelho):** claro, pills, glass shell, accent rose, Citation Card como hero.

**Rejeitado:**
- V1 "Sala de cinema" — escuro, quadrado, pesado.
- Gradiente roxo / layout cookie-cutter ChatGPT clone (PRD §9, project-context anti-pattern).
- Split panel para citações (layout B).
- Onboarding enterrado em menu (FR-13 exige visibilidade no empty state).

## Key Flows

### Flow 1 — Rafael encontra o debate sobre Nolan (UJ-1)

1. Rafael abre link compartilhado; chat vazio ou sessão anterior restaurada.
2. Lê headline; digita: *"Quando o Jovi e o Miguel discutiram um filme do Nolan?"*
3. Loading breve no feed.
4. Recebe bubble do agente + Citation Card(s) com timestamp e trecho.
5. **Climax:** Clica *"Abrir no YouTube"* — vídeo abre no minuto exato; confirma o episódio.
6. Follow-up na mesma sessão: *"O que o Miguel respondeu?"* — contexto conversacional mantido (FR-10).

**Falha off-topic:** pergunta sobre clima → recusa educada, zero cards.

**Falha sem match:** tema ausente do acervo → mensagem honesta, zero cards.

### Flow 2 — Camila avalia o projeto em 2 minutos (UJ-2)

1. Camila abre demo do portfólio; nunca ouviu o podcast.
2. Vê hero + botão *"Nunca ouvi Choque de Cultura — ver exemplos"*.
3. Clica; sistema retorna sugestões **do vector store** (não hardcoded).
4. Toca num chip — pergunta enviada automaticamente.
5. Resposta com citações verificáveis em segundos.
6. **Climax:** Abre YouTube no timestamp; percebe que não é mock estático.
7. Opcionalmente clica GitHub no footer; fecha com impressão de produto + engenharia sólidos.

**Falha acervo vazio:** mensagem clara; chips não aparecem com dados falsos.

### Flow 3 — Luan valida antes do deploy (UJ-3)

*Superfície backend — sem UI dedicada na v1.*

1. Luan dispara ingestão HTTP; monitora logs.
2. Abre frontend; smoke test com pergunta conhecida.
3. Valida card + timestamp; testa off-topic.
4. **Climax:** Citation Card correto confirma pipeline end-to-end.
5. Deploy público; link no portfólio.

## Open Items (non-blocking)

| Item | Owner | Notas |
|---|---|---|
| Tokens dark mode — polish visual | Implementação | Definidos em DESIGN.md; mock light-only |
| Thumbnail real vs fallback emoji | Implementação | Preferir thumbnail YouTube API |
| FR-9 speaker/contexto | Stretch v1 | Card rico já prevê campos; omitir se pipeline não suportar |
| FR-16 panorama acervo no onboarding | Stretch v1 | Opcional além dos chips |
| Latência p95 ~15s | Arquitetura | Loading state deve tolerar sem parecer travado |
