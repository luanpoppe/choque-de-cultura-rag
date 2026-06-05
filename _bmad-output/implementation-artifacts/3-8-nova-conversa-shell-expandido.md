---
story_key: 3-8-nova-conversa-shell-expandido
epic: 3
type: post-mvp-enhancement
related_fr:
  - FR-19
design_note: >-
  Shell central ampliado em relação ao DESIGN.md original (440px).
  Decisão de produto pós-MVP para melhor uso de viewport em desktop.
---

# Story 3.8: Nova conversa e shell expandido

Status: done

## Story

Como **visitante do chat**,  
I want **reiniciar a conversa com um botão e ver o chat em um painel maior**,  
So that **eu possa começar outro tópico sem limpar o browser manualmente e aproveitar melhor a tela**.

## Contexto

- Entrega **pós-épico 3** (polish de UX), implementada via quick-dev antes da formalização desta story.
- **FR-19** cobre persistência de sessão; esta story adiciona controle explícito de “nova conversa” (não estava no PRD original).
- **Story 3.1 / DESIGN.md** definiam `shell-max-width: 440px`; esta story **registra desvio intencional** para layout mais largo.

## Acceptance Criteria

1. **AC1 — Botão Nova conversa**
   - **Given** o usuário tem mensagens na sessão, sugestões de onboarding visíveis ou panorama exibido  
   - **When** clica em **Nova conversa** no header  
   - **Then** mensagens são removidas do estado e do `localStorage` (`clearSessionMessages`)  
   - **And** input, sugestões e panorama são limpos  
   - **And** o hero vazio volta a ser exibido  
   - **And** a preferência de tema (`choque-rag-theme-v1`) **não** é alterada  

2. **AC2 — Visibilidade e estados do botão**
   - **Given** chat sem mensagens e sem painel de onboarding ativo  
   - **Then** o botão **não** aparece (evita ação vazia)  
   - **Given** requisição de chat ou onboarding em andamento  
   - **Then** o botão fica desabilitado  

3. **AC3 — Acessibilidade**
   - **Given** o botão visível  
   - **Then** possui `aria-label` descritivo e usa `choque-focus-ring`  
   - **And** texto visível **Nova conversa** (não só ícone)  

4. **AC4 — Shell central ampliado**
   - **Given** viewport desktop ou tablet larga  
   - **When** o usuário abre o chat  
   - **Then** o card glass (`choque-shell-glass`) usa largura máxima **`min(960px, 92vw)`** (antes **440px**)  
   - **And** altura mínima do shell **`min(80vh, 900px)`** e máxima **92vh**  
   - **And** padding externo responsivo (`p-4` mobile, `p-6` sm+)  

5. **AC5 — Sem regressão de API**
   - **Given** reset ou novo layout  
   - **Then** nenhuma mudança em `POST /api/chat` ou contratos backend  

## Tasks / Subtasks

- [x] AC1–AC3: `NewConversationButton`, props em `ChatHeader` / `ChatShell`, handler em `ChatPage`
- [x] AC4: `tailwind.config.ts` (`maxWidth.shell`, `minHeight.shell`), classes em `ChatShell`
- [x] AC5: escopo apenas frontend

## Dev Notes

### Arquivos principais

| Arquivo | Papel |
|---------|--------|
| `packages/frontend/src/components/chat/NewConversationButton.tsx` | CTA Nova conversa |
| `packages/frontend/src/components/chat/ChatHeader.tsx` | Botão + theme toggle |
| `packages/frontend/src/components/chat/ChatShell.tsx` | Props do header + dimensões do shell |
| `packages/frontend/src/components/chat/ChatPage.tsx` | `handleNewConversation`, `canResetSession` |
| `packages/frontend/src/lib/storage/session-storage.ts` | `clearSessionMessages()` (já existia) |
| `packages/frontend/tailwind.config.ts` | Tokens `maxWidth.shell`, `minHeight.shell` |

### Tokens de layout (registro canônico)

| Token | Valor anterior (3.1 / DESIGN.md) | Valor atual (3.8) |
|-------|----------------------------------|-------------------|
| `maxWidth.shell` | `440px` | `min(960px, 92vw)` |
| Altura shell | `max-h-[90vh]` | `min-h-shell` + `max-h-[92vh]` |

### Referências

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.1, 3.5, FR-19]
- [Source: `_bmad-output/planning-artifacts/ux-designs/.../DESIGN.md` — `shell-max-width: 440px` (supersedido para largura por esta story)]
- [Source: `packages/frontend/src/lib/storage/session-storage.ts`]

## Dev Agent Record

### Agent Model Used

Composer (quick-dev) + story formalizada em sessão posterior

### Completion Notes List

- Reset de sessão reutiliza `clearSessionMessages`; persistência continua via `saveSessionMessages` após estado vazio.
- Shell ampliado melhora leitura em desktop; mobile mantém margens via `92vw`.

### File List

- `packages/frontend/src/components/chat/NewConversationButton.tsx` (novo)
- `packages/frontend/src/components/chat/ChatHeader.tsx`
- `packages/frontend/src/components/chat/ChatShell.tsx`
- `packages/frontend/src/components/chat/ChatPage.tsx`
- `packages/frontend/tailwind.config.ts`

## Senior Developer Review (AI)

**Outcome:** Approve (implementação prévia validada contra AC)

| Finding | Ação |
|---------|------|
| OK | Reset limpa storage + UI + onboarding | `ChatPage.handleNewConversation` |
| OK | Botão oculto no hero puro | `canResetSession` |
| OK | Shell `min(960px, 92vw)` documentado | `tailwind.config.ts` |
| OK | Sem mudança de API | escopo frontend only |

## Change Log

- 2026-06-03: Story 3.8 criada retroativamente; implementação já entregue (nova conversa + shell expandido).
