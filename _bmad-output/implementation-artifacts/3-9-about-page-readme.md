---
story_key: 3-9-about-page-readme
---

# Story 3.9: Página Sobre + README do repositório

Status: done

## Story

Como visitante que não conhece o podcast,
quero uma página explicando o Choque de Cultura e como interpretar o humor das transcrições,
para usar o chat com mais contexto.

Como engenheiro avaliando o repositório,
quero um README que documente arquitetura, decisões técnicas e o fluxo BMad spec-driven,
para entender o projeto rapidamente.

## Acceptance Criteria

1. **AC1** — Rota `GET /sobre` (Next.js) com conteúdo em PT-BR: o app, o podcast, humor/frases, como usar, limitações, transparência.
2. **AC2** — Navegação Chat ↔ Sobre no header (chat) e footer; `SiteHeader` na página Sobre com tema.
3. **AC3** — `README.md` na raiz: stack, diagrama, decisões, como rodar, testes, ponteiros `_bmad-output/`.
4. **AC4** — Artefatos BMad atualizados (epics, architecture, project-context, sprint-status).

## File List

- packages/frontend/src/app/sobre/page.tsx
- packages/frontend/src/components/site/*
- packages/frontend/src/components/chat/ChatHeader.tsx
- packages/frontend/src/components/chat/ChatFooter.tsx
- README.md
- _bmad-output/planning-artifacts/epics.md
- _bmad-output/planning-artifacts/architecture.md
- _bmad-output/project-context.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-06-05: Página Sobre + README + sync docs BMad.
- 2026-06-05: Texto Sobre corrigido (TV Quase, pilotos/personagens; não podcast Jovi/Miguel).
