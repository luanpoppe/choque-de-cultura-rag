---
name: Choque RAG
description: Identidade visual Modern Soft — chat RAG sobre Choque de Cultura com accent vermelho/rose em superfície clara, mobile-first.
status: final
project: choque-de-cultura-rag
created: 2026-06-03
updated: 2026-06-03
colors:
  accent: '#e11d48'
  accent-secondary: '#f43f5e'
  accent-muted: '#be123c'
  accent-surface: '#fff1f2'
  accent-surface-strong: '#ffe4e6'
  accent-border: '#fecdd3'
  accent-border-focus: '#fda4af'
  accent-ring: 'rgba(244,63,94,0.15)'
  accent-shadow: 'rgba(225,29,72,0.08)'
  accent-shadow-strong: 'rgba(225,29,72,0.25)'
  background-gradient-start: '#fff1f2'
  background-gradient-mid: '#fafafa'
  background-gradient-end: '#fff7ed'
  surface-base: 'rgba(255,255,255,0.88)'
  surface-elevated: '#ffffff'
  surface-subtle: '#fafafa'
  text-primary: '#0f172a'
  text-secondary: '#64748b'
  text-muted: '#94a3b8'
  text-on-accent: '#ffffff'
  user-bubble: '#1c1917'
  user-bubble-text: '#fafaf9'
  agent-bubble: '#fafafa'
  agent-bubble-text: '#44403c'
  agent-bubble-border: '#f5f5f4'
  thumb-gradient-start: '#ffe4e6'
  thumb-gradient-end: '#ffedd5'
  accent-dark: '#fb7185'
  accent-secondary-dark: '#f43f5e'
  accent-muted-dark: '#fda4af'
  accent-surface-dark: '#1f1416'
  accent-surface-strong-dark: '#2a1519'
  accent-border-dark: '#4c1d24'
  accent-border-focus-dark: '#881337'
  accent-ring-dark: 'rgba(244,63,94,0.25)'
  background-gradient-start-dark: '#0f0a0b'
  background-gradient-mid-dark: '#171717'
  background-gradient-end-dark: '#1a1210'
  surface-base-dark: 'rgba(23,23,23,0.92)'
  surface-elevated-dark: '#262626'
  surface-subtle-dark: '#1c1917'
  text-primary-dark: '#fafaf9'
  text-secondary-dark: '#a8a29e'
  text-muted-dark: '#78716c'
  user-bubble-dark: '#fafaf9'
  user-bubble-text-dark: '#1c1917'
  agent-bubble-dark: '#262626'
  agent-bubble-text-dark: '#e7e5e4'
  agent-bubble-border-dark: '#404040'
typography:
  brand:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 15px
    fontWeight: '600'
    letterSpacing: -0.02em
  display:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 26px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  body:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.55'
  body-sm:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  label:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 11px
    fontWeight: '600'
    letterSpacing: 0.06em
  caption:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 12px
    fontWeight: '600'
  meta:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 12px
    fontWeight: '600'
  footer:
    fontFamily: 'Geist Sans, ui-sans-serif, Segoe UI, system-ui, sans-serif'
    fontSize: 12px
    fontWeight: '400'
rounded:
  sm: 16px
  md: 20px
  lg: 28px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '7': 28px
  shell-max-width: 440px
  page-gutter: 24px
  header-padding-x: 24px
  hero-padding-x: 28px
components:
  shell-card:
    maxWidth: '{spacing.shell-max-width}'
    radius: '{rounded.lg}'
    background: '{colors.surface-base}'
    border: '1px solid rgba(255,255,255,0.9)'
    shadow: '0 4px 6px rgba(15,23,42,0.04), 0 24px 48px {colors.accent-shadow}'
    backdropBlur: 20px
  brand-lockup:
    typography: '{typography.brand}'
    accentColor: '{colors.accent}'
  theme-toggle:
    size: 40px
    radius: '{rounded.full}'
    background: '{colors.accent-surface}'
    foreground: '{colors.accent-muted}'
  hero-pill:
    typography: '{typography.label}'
    background: '{colors.accent-surface-strong}'
    foreground: '{colors.accent-muted}'
    radius: '{rounded.full}'
    padding: '6px 12px'
  onboarding-cta:
    typography: '{typography.body-sm}'
    fontWeight: '600'
    background: 'linear-gradient(135deg, {colors.accent-secondary}, {colors.accent})'
    foreground: '{colors.text-on-accent}'
    radius: '{rounded.full}'
    shadow: '0 8px 24px {colors.accent-shadow-strong}'
    padding: '14px 20px'
  chat-composer:
    background: '{colors.surface-subtle}'
    border: '1px solid {colors.accent-border}'
    radius: '{rounded.full}'
    focusBorder: '{colors.accent-border-focus}'
    focusRing: '0 0 0 3px {colors.accent-ring}'
  send-button:
    size: 44px
    radius: '{rounded.full}'
    background: '{colors.accent}'
    foreground: '{colors.text-on-accent}'
  user-bubble:
    background: '{colors.user-bubble}'
    foreground: '{colors.user-bubble-text}'
    radius: '22px 22px 6px 22px'
  agent-bubble:
    background: '{colors.agent-bubble}'
    foreground: '{colors.agent-bubble-text}'
    border: '1px solid {colors.agent-bubble-border}'
    radius: '22px 22px 22px 6px'
  citation-card:
    background: '{colors.surface-elevated}'
    radius: '{rounded.md}'
    border: '1px solid {colors.accent-surface-strong}'
    shadow: '0 2px 8px {colors.accent-shadow}'
    padding: 14px
  citation-thumb:
    size: 72px
    radius: '{rounded.sm}'
    gradient: 'linear-gradient(135deg, {colors.thumb-gradient-start}, {colors.thumb-gradient-end})'
  youtube-link:
    typography: '{typography.caption}'
    background: '{colors.accent}'
    foreground: '{colors.text-on-accent}'
    radius: '{rounded.full}'
    padding: '8px 14px'
  suggestion-chip:
    typography: '{typography.body-sm}'
    background: '{colors.accent-surface}'
    foreground: '{colors.text-primary}'
    border: '1px solid {colors.accent-border}'
    radius: '{rounded.full}'
    padding: '10px 16px'
---

## Brand & Style

Choque RAG é um chat de acervo — não um assistente genérico. A identidade **Modern Soft** equilibra calor cultural (vermelho/rose, referência sutil ao universo Choque de Cultura) com clareza de produto técnico: fundo claro, cantos generosos, sombras suaves, sans moderna. O Citation Card é o elemento hero visual de cada resposta; o restante da interface recua para não competir.

Postura editorial: **preciso mas acolhedor** — como quem aponta o trecho certo do podcast, não como chatbot corporativo. Evitar aesthetic genérica de IA (gradientes roxos, layout cookie-cutter). **Rejeitado:** direção "Sala de cinema" (escuro pesado, bordas duras, vermelho cortina sobre `#0f0f12`).

→ Composição de referência: `mockups/key-chat-empty.html`, `mockups/key-chat-response.html`. **Este spine vence em conflito com qualquer mock.**

## Colors

Paleta centrada em **rose/vermelho quente** sobre neutros claros.

- **Accent (`{colors.accent}` / `{colors.accent-secondary}`)** — CTAs primários, botão enviar, link YouTube, timestamps, marca "RAG", links do footer. Gradiente onboarding usa secondary → accent. *Não* usar como fundo de página inteira.
- **Accent surfaces (`{colors.accent-surface}`, `{colors.accent-surface-strong}`)** — fundos de pill, toggle de tema, chips de sugestão, bordas suaves de cards. Calor sem saturar.
- **Background gradient (`{colors.background-gradient-start}` → mid → end)** — página externa ao shell; transição rosa quente → neutro → pêssego leve. Dá profundidade sem dark mode.
- **Neutros de texto** — `{colors.text-primary}` títulos e corpo principal; `{colors.text-secondary}` subtítulos; `{colors.text-muted}` placeholders e footer.
- **Bubbles** — usuário em `{colors.user-bubble}` (escuro quente); agente em `{colors.surface-subtle}` com borda leve. Contraste claro entre papéis.
- **Modo escuro** — tokens `*-dark` invertem superfícies para neutros quentes escuros; accent permanece rose legível (`{colors.accent-dark}`). Gradiente de página escurece sem retornar ao cinema preto absoluto.

## Typography

**Geist Sans** (ou Inter como fallback) em todo o produto — sem serif. Hierarquia:

- **Brand** — `{typography.brand}`; "RAG" recebe `{colors.accent}`.
- **Display** — `{typography.display}` na headline do chat vazio.
- **Body** — `{typography.body}` mensagens, subtítulo hero, trechos de citação.
- **Label** — `{typography.label}` uppercase na pill "Choque de Cultura".
- **Meta / caption** — timestamps, duração, CTA YouTube, footer.

Regra: uma única família sans; peso e tamanho carregam hierarquia, não famílias diferentes.

## Layout & Spacing

**Mobile-first, single-column.** Shell centralizado com `{spacing.shell-max-width}` (440px), `{spacing.page-gutter}` nas laterais da viewport.

- **Header** — brand à esquerda, toggle tema à direita; padding horizontal `{spacing.header-padding-x}`.
- **Hero (chat vazio)** — centralizado; pill → headline → subtítulo → CTA onboarding → "ou escreva abaixo" → composer.
- **Feed (conversa)** — scroll vertical; mensagens empilhadas; Citation Cards **inline** abaixo da bubble do agente (layout A).
- **Composer** — fixo na base do shell; input pill + botão enviar circular.
- **Footer** — link GitHub + "demo portfólio"; visível no estado vazio; pode permanecer ou compactar em conversa ativa (implementação decide; preferir manter acessível).

Breakpoints: layout funciona de 320px até desktop; shell não expande além de 440px — leitura focada estilo app mobile centrado.

## Elevation & Depth

Profundidade via **glass + sombra rose**, não bordas duras.

- **Shell** — `{components.shell-card.shadow}` + `backdrop-filter: blur(20px)`; flutua sobre gradiente de página.
- **Citation Card** — elevação leve (`0 2px 8px {colors.accent-shadow}`); borda `{colors.accent-surface-strong}`.
- **Onboarding CTA** — sombra mais pronunciada (`{colors.accent-shadow-strong}`) para hierarquia primária no empty state.
- **Focus rings** — `0 0 0 3px {colors.accent-ring}` no composer; sem outline default do browser.

Evitar sombras pretas pesadas ou múltiplas camadas de elevation.

## Shapes

Cantos **generosamente arredondados** — identidade Modern Soft.

- Shell: `{rounded.lg}` (28px).
- Cards de citação: `{rounded.md}` (20px).
- Thumbnail: `{rounded.sm}` (16px).
- Inputs, CTAs, chips, botões icon: `{rounded.full}` (pill).
- Bubbles de chat: assimétricos (22px com canto "cauda" 6px) — leveza conversacional.

Proibido: cantos retos (< 8px) em componentes principais; estética "quadradão" da V1 rejeitada.

## Components

### Shell card

Container único da aplicação. Ver `{components.shell-card}`. Em desktop, centrado vertical e horizontalmente na viewport.

### Brand lockup

Texto "Choque **RAG**" — "RAG" em `{colors.accent}`. Sem logotipo gráfico na v1.

### Theme toggle

Botão circular `{components.theme-toggle}` no header; ícone sol/lua. Visível em todos os estados (FR-18).

### Hero pill + headline (empty state)

Pill `{components.hero-pill}` + `{typography.display}` + body secundário. Apenas quando não há mensagens na sessão.

### Onboarding CTA

Botão full-width `{components.onboarding-cta}`. Copy aprovada: *"Nunca ouvi Choque de Cultura — ver exemplos"*. Placement: abaixo da headline, acima do composer.

### Chat composer + send

Row pill `{components.chat-composer}`; botão `{components.send-button}` com ícone ↑. Placeholder exemplo: *"Quando falaram de Dune?"*

### User / agent bubbles

Specs em `{components.user-bubble}` e `{components.agent-bubble}`. Usuário alinhado à direita (~88% max-width); agente à esquerda.

### Citation Card (rico)

Anatomia: thumbnail `{components.citation-thumb}` | coluna de conteúdo com título episódio, meta (timestamp · duração), trecho entre aspas, speaker/contexto *(stretch v1)*, link `{components.youtube-link}`.

Múltiplos cards empilhados verticalmente com `{spacing.3}` entre eles quando a resposta cita vários trechos.

### Suggestion chips (onboarding)

Após acionar onboarding, sugestões clicáveis como `{components.suggestion-chip}` empilhadas ou em wrap no feed — substituem/ocultam hero empty parcialmente.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Fundo claro com accent rose/vermelho | Gradiente roxo ou template genérico de chat IA |
| Cantos pill e arredondados generosos | Bordas retas, visual "cinema escuro" pesado |
| Citation Cards inline abaixo da resposta | Split panel lateral (decisão: layout A) |
| Sans moderna (Geist/Inter) em todo o UI | Serif decorativa ou mix de muitas famílias |
| Toggle claro/escuro sempre acessível | Tema escuro como única opção ou escondido em menu |
| Vermelho como accent e CTA | Vermelho cortina + fundo preto (#0f0f12) |
| Mobile-first ~440px shell | Layout desktop-wide que dilui foco do chat |
