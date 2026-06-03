# Addendum — Choque de Cultura RAG

Detalhes técnicos e contexto para downstream (PRD, arquitetura).

## Stack confirmada

| Camada | Tecnologia |
|---|---|
| Backend | NestJS (já scaffolded) |
| Frontend | Next.js (já scaffolded) |
| IA | `@luanpoppe/ai` — versão mais recente |
| Ingestão | Scrape YouTube → transcrições → vector store |

## Requisitos técnicos explícitos

- Guardrails: agente responde **somente** sobre Choque de Cultura
- RAG retorna **vídeo + timestamp**, não texto genérico
- Frontend moderno e distintivo — evitar estética genérica de IA
- UI e respostas em PT-BR

## Ordem de ingestão v1

Episódios **mais antigos** primeiro (~5–10 para PoC).

## Decisões confirmadas (2026-06-03)

| Decisão | Valor |
|---|---|
| Público | Criador + fãs + recrutadores |
| PoC | ~5–10 episódios mais antigos |
| Deploy | Público no portfólio |
| Off-topic | Recusa educada + redirecionamento |
| Episódios novos | Backlog pós-v1 |

## Considerações legais (PRD / arquitetura)

- YouTube ToS para scrape e transcrições
- Direitos autorais do conteúdo (Porta dos Fundos / criadores)
- Posicionamento: demo educacional/pessoal, sem monetização

## BMad Method

Primeiro projeto do Luan com BMad Method. Brief aprovado → próximo passo: PRD.
