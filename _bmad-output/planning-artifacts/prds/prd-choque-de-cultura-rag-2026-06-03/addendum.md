# Addendum — PRD Choque de Cultura RAG

Detalhes técnicos e decisões de mecanismo que não pertencem ao corpo principal do PRD.

## UX — preferências do Luan (brain dump 2026-06-03)

- **Modo escuro:** toggle manual claro/escuro na UI; preferência em `localStorage` (default: `prefers-color-scheme` se unset)
- **Sessões de chat:** histórico por sessão; persistência em `localStorage` (sem backend de auth)
- **Layout de resposta (a explorar no UX):**
  - Cards com citações embutidos no fluxo do chat
  - Mensagens "interativas" no meio da conversa
  - Split: resposta textual de um lado + painel/card com metadados dos vídeos citados do outro
- **Onboarding novatos (2026-06-03):** botão para quem não conhece Choque de Cultura → chat sugere perguntas de exemplo **ancoradas no vector store** (não hardcoded)
- **Onboarding stretch B:** mini-resumo/panorama dos temas indexados além das sugestões clicáveis

## IA — custo e providers

- Prioridade: modelos **baratos** (embedding + geração) para PoC/portfólio
- **OpenRouter** via `@luanpoppe/ai` — permite trocar modelos sem refactor grande
- Modelos específicos: TBD na arquitetura (decisão de engenharia)

## Ingestão v1

- Trigger **manual** via **endpoint HTTP** — não pipeline agendado na PoC
- Transcrições via **Whisper** a partir do áudio do vídeo (decisão 2026-06-03)

## Stretch / desejável (Vision — Luan)

- Respostas que identifiquem **quem falou** (Jovi, Miguel, etc.), respostas dos outros participantes e **contexto** da fala no episódio — além de vídeo + timestamp
- **Escopo:** Stretch v1 — MVP aceita vídeo + timestamp; enriquecimento speaker/contexto se couber na PoC, senão v2

## Referências upstream

- Brief: `_bmad-output/planning-artifacts/briefs/brief-choque-de-cultura-rag-2026-06-03/`
- Project context: `_bmad-output/project-context.md`
