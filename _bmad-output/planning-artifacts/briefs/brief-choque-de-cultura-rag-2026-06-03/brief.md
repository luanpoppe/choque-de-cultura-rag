---
title: "Product Brief: Choque de Cultura RAG"
status: final
created: 2026-06-03
updated: 2026-06-03
approved_by: Luan
---

# Product Brief: Choque de Cultura RAG

## Executive Summary

Choque de Cultura RAG é um web app full-stack que permite conversar com um agente de IA sobre o conteúdo do podcast **Choque de Cultura**, com respostas fundamentadas em transcrições reais dos episódios no YouTube — incluindo **em qual vídeo** e **em qual momento** algo foi dito.

O produto nasce de três motivações: curiosidade pessoal do criador, utilidade para fãs que buscam citações e debates específicos, e **peça de portfólio** que demonstra engenharia de ponta a ponta (ingestão, vector store, RAG e UX de chat).

A v1 é uma **prova de conceito enxuta**: indexar os episódios mais antigos do canal, validar o pipeline scrape → transcrição → vector store → RAG, e entregar um chat funcional com design moderno e distintivo. Toda a camada de IA utiliza `@luanpoppe/ai`, biblioteca própria do autor.

## The Problem

O Choque de Cultura acumula centenas de horas de conversas sobre cinema, cultura pop e debates. Quando alguém lembra vagamente de uma opinião ou trecho — *"em qual episódio falaram de Dune?"*, *"quando o Jovi discordou do Miguel?"* — a alternativa hoje é **assistir ou vasculhar manualmente** episódios inteiros no YouTube.

Isso afeta três perfis:

- **Fãs** que querem reviver momentos específicos sem perder horas
- **O criador** validando uma ideia e aprendendo BMad Method
- **Recrutadores** que precisam entender e testar o projeto no portfólio em menos de 2 minutos

O custo do status quo é tempo, fricção e um acervo rico permanecendo inacessível de forma conversacional.

## The Solution

Um web app com duas camadas:

**Backend (NestJS):** pipeline de ingestão que descobre vídeos do canal no YouTube, obtém transcrições, organiza metadados (título, data, URL, duração, timestamps) e persiste tudo em um vector store. Um agente de IA, exposto via API, consulta esse store via RAG e responde citando fontes concretas — vídeo e momento exato.

**Frontend (Next.js):** interface de chat simples, moderna e reativa. Perguntas em linguagem natural; respostas com referências clicáveis aos trechos. Design bonito e memorável — requisito explícito para o portfólio.

O agente opera com **guardrails**: responde apenas sobre Choque de Cultura. Perguntas off-topic recebem recusa educada e redirecionamento.

## What Makes This Different

| Diferencial | Por que importa |
|---|---|
| **Citações com timestamp** | Aponta *onde* no acervo a resposta veio |
| **Pipeline real, não mock** | PoC com scrape e RAG de fato |
| **`@luanpoppe/ai`** | Demonstra biblioteca própria de IA |
| **Design intencional** | UX distintiva, não estética genérica de IA |
| **Escopo honesto** | Começa pelos episódios mais antigos |

**O que não é moat:** RAG sobre YouTube não é único. O diferencial é a **execução integrada** (pipeline + agente + UX) como showcase técnico pessoal.

## Who This Serves

**Primário — Luan:** validar a ideia, aprender BMad Method, ter peça sólida no portfólio.

**Secundário — Fãs:** encontrar momentos específicos sem maratonar episódios.

**Terciário — Recrutadores:** demo clara com evidência de engenharia full-stack + IA.

**Sucesso por perfil:**
- Luan: pipeline funcionando + chat com fontes reais + projeto documentado
- Fãs: pergunta → resposta útil com link para o trecho
- Recrutadores: demo clara, código organizado, stack moderna visível

## Success Criteria

A v1 é bem-sucedida quando:

1. **Ingestão comprovada** — episódios mais antigos scrapeados, transcritos e indexados (~5–10 para PoC)
2. **RAG real** — agente consulta transcrições indexadas, sem inventar respostas
3. **Citações verificáveis** — respostas com vídeo e timestamp
4. **Chat end-to-end** — frontend e backend operacionais
5. **Guardrails ativos** — off-topic bloqueado ou redirecionado
6. **Demo apresentável** — deploy público acessível para link no currículo

**Fora do critério da v1:** canal inteiro indexado, pipeline para episódios novos, autenticação, analytics.

## Scope

### In (v1 — PoC)

- Scrape dos episódios **mais antigos** do canal (~5–10 episódios)
- Transcrições + vector store com metadados (título, URL, data, timestamps)
- API de chat com agente RAG via `@luanpoppe/ai` (versão mais recente)
- Guardrails restritos ao domínio Choque de Cultura
- Frontend de chat moderno, interativo, design distintivo
- Respostas em português
- Referências clicáveis para vídeo + timestamp

### Out (v1)

- Acervo completo do canal
- Pipeline recorrente para episódios novos
- Autenticação / contas de usuário
- Admin panel de ingestão
- Mobile app nativo
- Monetização

### Decidir no PRD ou arquitetura

- Vector store, chunking e embedding
- Método de obtenção de transcrições
- Posicionamento legal (ToS YouTube, direitos autorais)

## Vision

Se a PoC validar o pipeline:

1. **Expandir cobertura** — mais episódios, do mais antigo ao mais recente
2. **Manter acervo atualizado** — pipeline para novos uploads
3. **Enriquecer UX** — player no timestamp, highlights, busca por convidado/tema
4. **Showcase ampliado** — case study no portfólio (BMad Method, arquitetura RAG, `@luanpoppe/ai`)

A v1 não precisa ser a referência definitiva para fãs — precisa **provar que funciona**.
