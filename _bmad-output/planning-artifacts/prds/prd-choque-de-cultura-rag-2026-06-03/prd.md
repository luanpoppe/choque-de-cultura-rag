---
title: "PRD: Choque de Cultura RAG"
status: final
created: 2026-06-03
updated: 2026-06-03
approved_by: Luan
fr_count: 20
open_questions_deferred: 3
---

# PRD: Choque de Cultura RAG

## 0. Document Purpose

PRD para PoC v1 do Choque de Cultura RAG — audiência: criador, agentes BMad downstream (UX, arquitetura, epics). Estrutura: Glossary → Features com FRs numerados globalmente. Decisões técnicas (vector store, modelos OpenRouter, chunking) ficam em `addendum.md` e arquitetura. Inputs: Product Brief (final), Project Context (complete).

## 1. Vision

Choque de Cultura RAG é um web app que transforma centenas de horas de podcast em acervo conversacional: o usuário pergunta em linguagem natural e recebe respostas **fundamentadas em transcrições reais**, com indicação precisa de **em quais vídeos** e **em quais momentos** o conteúdo aparece.

O momento que define o produto é simples e verificável: alguém pergunta *"quando falaram de Dune?"* ou *"o que o Jovi achou daquele filme?"* e, em segundos, vê uma resposta que aponta para episódios concretos — não uma opinião genérica do modelo, mas trechos ancorados no acervo indexado. Quanto mais rico for o resultado (identificar **quem disse o quê**, como os outros reagiram e o **contexto** da fala dentro do episódio), mais o produto se distingue de um chat genérico.

Este projeto existe porque construir é parte do objetivo: dominar RAG na prática, usar BMad Method de ponta a ponta, ter uma aplicação própria e apresentar no portfólio um trabalho que comunique **nível pleno/sênior** — bem pensado em produto, bem documentado e bem executado em engenharia (pipeline de ingestão, vector store, agente com guardrails, UX intencional).

Para recrutadores, a demo deve comunicar em poucos segundos: *full-stack + IA aplicada com critério*, não um tutorial de chatbot. Para fãs, é atalho para achar citações. Para o criador, é laboratório de aprendizado com entrega real.

**Nota de escopo:** identificação de speaker, réplicas e contexto da fala é **stretch v1** — o MVP mínimo exige vídeo + timestamp com precisão; enriquecimento contextual é desejável se a PoC permitir.

## 2. Target User

### 2.1 Jobs To Be Done

- **Fã do podcast:** encontrar *onde* e *quando* algo foi dito sem reassistir episódios inteiros
- **Criador (Luan):** validar pipeline RAG end-to-end, aprender BMad/RAG, ter demo no portfólio
- **Recrutador / visitante sem contexto:** entender rapidamente o que foi construído, testar uma pergunta real — ou descobrir por onde começar se não conhece o podcast

### 2.2 Non-Users (v1)

- Usuários que esperam indexação do canal inteiro ou episódios novos automaticamente
- Quem busca chat genérico sem restrição ao domínio Choque de Cultura
- Operadores que precisam de painel admin ou autenticação multi-usuário

### 2.3 Key User Journeys

- **UJ-1. Rafael encontra a discussão sobre Nolan que ouviu no carro**
  - **Persona + contexto:** Rafael, 32, ouve Choque de Cultura no Spotify. Lembra que Jovi e Miguel debateram um filme do Nolan, mas não sabe qual episódio.
  - **Entry state:** Primeira visita via link compartilhado (Reddit, Twitter ou portfólio). Sem login. Tela de chat vazia; tema claro ou escuro conforme preferência salva ou padrão do sistema.
  - **Path:**
    1. Abre o app e lê uma linha de boas-vindas curta explicando o que pode perguntar
    2. Digita: *"Quando o Jovi e o Miguel discutiram um filme do Nolan?"*
    3. Aguarda indicador de loading enquanto o backend faz RAG
    4. Recebe resposta textual + um ou mais **Citation Cards** (título do vídeo, timestamp, trecho relevante, link para YouTube no momento exato)
    5. *(Stretch v1)* Cards mostram quem falou o quê e uma linha de contexto do debate
  - **Climax:** Clica no card e o YouTube abre no timestamp correto — confirma que era aquele episódio
  - **Resolution:** Continua na sessão com follow-up (*"O que o Miguel respondeu?"*) ou fecha; histórico fica salvo no `localStorage` para retomar depois
  - **Edge case (off-topic):** Pergunta *"Qual a previsão do tempo amanhã?"* → agente recusa educadamente e sugere perguntar sobre Choque de Cultura
  - **Edge case (sem match):** Acervo indexado não contém o tema → resposta honesta (*"Não encontrei nos episódios indexados"*) sem inventar fonte

- **UJ-2. Camila, recrutadora, avalia o projeto em 2 minutos**
  - **Persona + contexto:** Camila, tech recruiter, abriu o link do portfólio entre duas entrevistas. **Nunca ouviu Choque de Cultura** e não sabe o que perguntar.
  - **Entry state:** Landing/chat único, sem cadastro. Interface limpa que não parece template genérico de IA. Botão visível: **"Não conheço Choque de Cultura — me dê exemplos"** (ou copy equivalente).
  - **Path:**
    1. Lê headline curta; hesita porque não conhece o podcast
    2. Clica no botão de onboarding — o chat responde com **perguntas de exemplo ancoradas no acervo indexado** (temas, episódios, debates reais do vector store, não lista genérica hardcoded)
    3. Escolhe uma sugestão clicável ou digita adaptando
    4. Vê resposta estruturada com citações verificáveis em segundos
    5. Clica em um Citation Card e valida que o link leva ao trecho real
  - **Climax:** Percebe que não é mock — exemplos e respostas vêm do acervo real
  - **Resolution:** Fecha com impressão de *produto pensado + engenharia sólida*; opcionalmente explora README/repo linkado no footer `[ASSUMPTION: link repo no footer]`

- **UJ-3. Luan dispara ingestão e valida a PoC antes de publicar**
  - **Persona + contexto:** Luan, criador, precisa indexar os ~5–10 episódios mais antigos antes da demo ir ao ar.
  - **Entry state:** Backend local ou deploy de staging; acervo ainda vazio ou parcial.
  - **Path:**
    1. Dispara **Ingestão via endpoint HTTP** para o lote de episódios antigos
    2. Pipeline: scrape → transcrição → chunking → embedding → vector store
    3. Consulta status/logs para confirmar quantos episódios foram indexados
    4. Abre o frontend e faz pergunta de smoke test (*"Quando falaram de X?"* sobre conteúdo conhecido)
    5. Valida citação + timestamp; repete com pergunta off-topic para testar guardrails
  - **Climax:** Pergunta de teste retorna citação correta de episódio que ele sabe que foi indexado
  - **Resolution:** Faz deploy público da demo; atualiza portfólio com link
  - **Edge case:** Ingestão falha em um vídeo → log claro; demais episódios do lote continuam indexáveis

  - **Edge case:** Ingestão falha em um vídeo → log claro; demais episódios do lote continuam indexáveis

## 3. Glossary

- **Acervo Indexado** — Conjunto de episódios cujas transcrições foram ingeridas, chunked, embedadas e persistidas no Vector Store. Subconjunto do canal YouTube do Choque de Cultura na v1 (~5–10 episódios mais antigos).
- **Episódio** — Um vídeo do canal Choque de Cultura no YouTube, identificado por URL, título, data de publicação e duração.
- **Chunk** — Segmento de Transcrição com embedding e metadados (episódio, offset temporal) usado na busca semântica.
- **Transcrição** — Texto falado do Episódio, obtido na Ingestão, fonte de verdade para respostas RAG.
- **Vector Store** — Repositório de embeddings e metadados dos Chunks; consultado pelo Agente na resposta.
- **Ingestão** — Pipeline disparado manualmente: descoberta de Episódios → Transcrição → chunking → embedding → persistência no Vector Store.
- **Agente** — Componente de IA (via `@luanpoppe/ai`) que recebe perguntas, consulta o Vector Store via RAG e produz respostas com Citation Cards. Sujeito a Guardrails.
- **Citation Card** — Elemento de UI com título do Episódio, timestamp, trecho relevante e link para YouTube no momento exato. *(Stretch v1)* pode incluir speaker e contexto da fala.
- **Sessão de Chat** — Conversa contínua (perguntas + respostas) persistida no `localStorage` do navegador.
- **Guardrails** — Restrições de prompt/comportamento: Agente responde somente sobre conteúdo do Choque de Cultura presente no Acervo Indexado.
- **Sugestão de Pergunta** — Pergunta de exemplo gerada a partir do Acervo Indexado, exibida no onboarding para novatos.

## 4. Features

### 4.1 Ingestão de Episódios

**Description:** Pipeline backend para popular o Acervo Indexado a partir dos episódios mais antigos do canal. Disparo manual pelo criador (UJ-3). Falhas isoladas não impedem o restante do lote.

**Functional Requirements:**

#### FR-1: Trigger manual de ingestão

O operador (criador) pode iniciar uma execução de Ingestão via **endpoint HTTP dedicado** (proteção a definir na arquitetura — ver Open Questions). Realiza UJ-3.

**Consequences (testable):**
- Uma execução iniciada processa um lote configurável de Episódios (default: ~5–10 mais antigos).
- Execução registra início, fim e contagem de Episódios processados com sucesso vs. falha.

#### FR-2: Descoberta e scrape de Episódios

O sistema pode obter metadados dos Episódios alvo do canal Choque de Cultura no YouTube (título, URL, data, duração).

**Consequences (testable):**
- Cada Episódio processado possui metadados mínimos persistidos antes da indexação semântica.
- Episódios fora do lote configurado não são ingeridos nesta execução.

#### FR-3: Obtenção de Transcrições

O sistema obtém a Transcrição de cada Episódio do lote via **Whisper** a partir do áudio do vídeo.

**Consequences (testable):**
- Pipeline baixa/extrai áudio do Episódio e gera Transcrição via Whisper.
- Episódio cujo áudio/transcrição falha é registrado como falha com motivo; não bloqueia os demais do lote.

#### FR-4: Indexação no Vector Store

O sistema pode dividir Transcrições em Chunks, gerar embeddings e persistir Chunks + metadados temporais no Vector Store.

**Consequences (testable):**
- Cada Chunk referencia Episódio de origem e posição temporal utilizável para timestamp em Citation Cards.
- Acervo Indexado consultável pelo Agente após conclusão bem-sucedida.

#### FR-5: Observabilidade da Ingestão

O operador pode consultar status/logs da execução de Ingestão.

**Consequences (testable):**
- Logs identificam Episódio, etapa e erro em caso de falha.

---

### 4.2 Chat RAG com Citações

**Description:** Usuário faz perguntas em linguagem natural; Agente responde com base no Acervo Indexado, anexando Citation Cards verificáveis. Realiza UJ-1.

**Functional Requirements:**

#### FR-6: Envio de pergunta

O usuário pode enviar uma pergunta em português via interface de chat.

**Consequences (testable):**
- Pergunta vazia ou inválida é rejeitada com feedback claro.
- UI exibe indicador de loading durante processamento.

#### FR-7: Resposta ancorada em RAG

O Agente consulta o Vector Store e produz resposta fundamentada no Acervo Indexado, sem inventar Episódios ou trechos inexistentes.

**Consequences (testable):**
- Resposta referencia apenas Episódios presentes no Acervo Indexado.
- Quando não há match relevante, resposta declara explicitamente que não encontrou nos episódios indexados (sem Citation Card fabricado).

#### FR-8: Citation Cards na resposta

O sistema exibe um ou mais Citation Cards por resposta relevante, cada um com título do Episódio, timestamp e link YouTube no momento exato.

**Consequences (testable):**
- Link abre YouTube no offset temporal correspondente ao trecho citado.
- Card exibe trecho textual relevante da Transcrição.

#### FR-9: Enriquecimento contextual *(Stretch v1)*

Quando tecnicamente viável, Citation Cards ou texto adjacente identificam speaker (ex.: Jovi, Miguel), réplicas relacionadas e contexto breve da fala no Episódio.

**Consequences (testable):**
- Ausência de identificação de speaker não impede entrega de FR-8 (MVP mínimo).

#### FR-10: Conversa multi-turn na Sessão

O usuário pode fazer perguntas de follow-up na mesma Sessão de Chat; Agente mantém contexto conversacional dentro da sessão.

**Consequences (testable):**
- Follow-up sobre Episódio já citado usa contexto da Sessão sem exigir repetição completa.

#### FR-11: Integração de IA via `@luanpoppe/ai`

Toda chamada de embedding e geração do Agente utiliza `@luanpoppe/ai` (versão mais recente), com provider configurável (OpenRouter para modelos econômicos).

**Consequences (testable):**
- Nenhum módulo de produção chama APIs de LLM diretamente bypassando a biblioteca.

**Notes:** Modelos específicos → `addendum.md` / arquitetura.

---

### 4.3 Guardrails de Domínio

**Description:** Agente restringe escopo ao Choque de Cultura. Realiza edge cases de UJ-1 e UJ-3.

**Functional Requirements:**

#### FR-12: Recusa off-topic

O Agente recusa educadamente perguntas fora do domínio Choque de Cultura e orienta o usuário a reformular.

**Consequences (testable):**
- Pergunta claramente off-topic (ex.: previsão do tempo) não produz Citation Cards nem resposta factual inventada sobre o podcast.

---

### 4.4 Onboarding para Novatos

**Description:** Visitantes sem contexto do podcast (ex.: recrutadores) descobrem por onde começar. Realiza UJ-2.

**Functional Requirements:**

#### FR-13: Botão de onboarding

A interface de chat exibe controle visível (ex.: *"Não conheço Choque de Cultura — me dê exemplos"*) acessível sem login.

**Consequences (testable):**
- Controle visível na tela inicial de chat, não enterrado em menu.

#### FR-14: Sugestões de perguntas do acervo

Ao acionar o onboarding, o sistema gera Sugestões de Pergunta derivadas do Acervo Indexado (não lista estática hardcoded).

**Consequences (testable):**
- Sugestões refletem temas/debates presentes nos Episódios indexados.
- Acervo vazio → mensagem orientando que ingestão ainda não foi realizada.

#### FR-15: Sugestões clicáveis

O usuário pode selecionar uma Sugestão de Pergunta para enviá-la ao chat como mensagem.

**Consequences (testable):**
- Clique dispara fluxo equivalente a FR-6 com texto da sugestão.

#### FR-16: Resumo do acervo *(Stretch v1 — opção B)*

Além das sugestões, o onboarding pode exibir breve panorama dos temas/episódios disponíveis no Acervo Indexado.

**Consequences (testable):**
- Panorama menciona apenas conteúdo realmente indexado.

---

### 4.5 Interface de Chat e Sessões

**Description:** Frontend de chat moderno, distintivo, com persistência local e suporte a tema escuro. Realiza UJ-1, UJ-2.

**Functional Requirements:**

#### FR-17: Interface de chat

O usuário interage via UI de chat web responsiva com design distintivo (não aesthetic genérica de template IA).

**Consequences (testable):**
- Layout suporta mensagens do usuário, respostas do Agente e Citation Cards no fluxo conversacional.

#### FR-18: Tema claro e escuro

A interface oferece **botão de toggle** para alternar entre tema claro e escuro; preferência persistida no `localStorage`.

**Consequences (testable):**
- Toggle visível e acessível em todas as telas de chat.
- Preferência sobrevive a reload da página no mesmo browser.
- Na primeira visita (sem preferência salva), UI pode defaultar para `prefers-color-scheme` do sistema.

#### FR-19: Persistência de Sessão

O sistema persiste Sessões de Chat no `localStorage` do navegador.

**Consequences (testable):**
- Ao retornar no mesmo browser, histórico da sessão anterior é restaurado.
- Limpar dados do browser remove histórico (comportamento esperado, sem backend de auth).

#### FR-20: Link para repositório

A interface expõe link para o repositório/código-fonte do projeto (footer ou equivalente). `[ASSUMPTION]`

**Consequences (testable):**
- Link abre repositório público do projeto.

---

## 5. Non-Goals (Explicit)

- Indexar canal YouTube inteiro na v1
- Pipeline automático/recorrente para episódios novos
- Autenticação, contas de usuário ou sync cross-device
- Admin panel gráfico de ingestão
- Mobile app nativo
- Monetização ou paywall
- Chat sem restrição de domínio (assistente genérico)
- Player de vídeo embutido na v1 (link externo YouTube basta)

## 6. MVP Scope

### 6.1 In Scope

- Ingestão manual de ~5–10 episódios mais antigos (FR-1–FR-5)
- Chat RAG com Citation Cards — vídeo + timestamp (FR-6–FR-8, FR-10–FR-12)
- Guardrails off-topic (FR-12)
- Onboarding com sugestões clicáveis do acervo (FR-13–FR-15)
- UI distintiva, toggle claro/escuro + sessões em localStorage (FR-17–FR-19)
- `@luanpoppe/ai` + OpenRouter/modelos econômicos (FR-11)
- Deploy público demo portfólio

### 6.2 Out of Scope for MVP

- Speaker/contexto enriquecido (FR-9) — stretch, entrega se couber
- Resumo do acervo no onboarding (FR-16) — stretch
- Histórico server-side — v2
- Páginas scaffold legadas (signup/profile) — remover ou ignorar

## 7. Success Metrics

**Primary**

- **SM-1:** ≥1 pergunta de smoke test retorna Citation Card correto (vídeo + timestamp verificável manualmente). Valida FR-7, FR-8.
- **SM-2:** ≥5 episódios indexados com sucesso via Ingestão. Valida FR-1–FR-4.
- **SM-3:** Pergunta off-topic recusada em teste manual. Valida FR-12.

**Secondary**

- **SM-4:** Visitante novato consegue enviar primeira pergunta via onboarding em < 60s sem documentação externa. Valida FR-13–FR-15, UJ-2.
- **SM-5:** Demo acessível via URL pública estável linkável no portfólio.

**Counter-metrics (do not optimize)**

- **SM-C1:** Volume de perguntas/dia — PoC pessoal, não buscar escala na v1.
- **SM-C2:** Cobertura do canal inteiro — explicitamente fora do MVP.

## 8. Cross-Cutting NFRs

- **Custo:** embeddings e geração via modelos econômicos (OpenRouter); evitar reprocessamento desnecessário na Ingestão.
- **Latência:** resposta de chat aceitável para demo (< ~15s p95 em PoC) `[ASSUMPTION]` — refinar na arquitetura.
- **Idioma:** UI e respostas do Agente em PT-BR.
- **Legal/ToS:** posicionamento demo educacional/pessoal; detalhes em arquitetura/addendum.
- **Segurança:** API keys apenas em env server-side; endpoint de ingestão não exposto publicamente sem proteção.

## 9. Aesthetic and Tone

- Visual distintivo, moderno, interativo — evitar gradientes roxos/cookie-cutter de chat IA.
- Tom do Agente: informal como o podcast, mas preciso nas citações; recusa off-topic educada, não seca.
- Citation Cards como elemento hero da resposta — layout exato → workflow `bmad-ux`.

## 10. Open Questions

**Resolvidas (2026-06-03 — Luan):**

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Transcrições | **Whisper** a partir do áudio do Episódio → FR-3 |
| 3 | Trigger de Ingestão | **Endpoint HTTP** → FR-1 |

**Abertas (decidir na arquitetura ou UX):**

| # | Pergunta | Owner sugerido |
|---|---|---|
| 2 | Vector store e estratégia de chunking | Arquitetura |
| 4 | Proteção do endpoint de Ingestão em deploy público | Arquitetura |
| 5 | Layout chat: cards inline vs. split panel | `bmad-ux` |

## 11. Assumptions Index

- §2.3 UJ-2 — link repositório no footer. `[ASSUMPTION]`
- §7 / NFRs — latência p95 ~15s aceitável para PoC. `[ASSUMPTION]`
- FR-9, FR-16 — stretch v1; MVP mínimo não depende deles.
- Episódios alvo: ~5–10 mais antigos do canal (confirmado no brief).
- FR-18 — toggle manual claro/escuro confirmado; default inicial pode seguir `prefers-color-scheme` se não houver preferência salva.

---

*PRD finalizado em 2026-06-03. Downstream: `bmad-ux` → `bmad-create-architecture` → `bmad-create-epics-and-stories`.*


