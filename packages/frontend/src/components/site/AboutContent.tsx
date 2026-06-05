import Link from 'next/link';
import { CHOQUE_EPISODES_PLAYLIST_URL } from '@/lib/youtube';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold tracking-tight text-choque-primary">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-choque-secondary">
        {children}
      </div>
    </section>
  );
}

export function AboutContent() {
  return (
    <article className="mx-auto max-w-prose pb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-choque-accent-muted">
        Guia para visitantes
      </p>
      <h1 className="mb-4 text-[26px] font-bold leading-tight tracking-tight text-choque-primary">
        Sobre o Choque RAG
      </h1>
      <p className="mb-8 text-[15px] leading-relaxed text-choque-secondary">
        Este site é um experimento de busca conversacional sobre o{' '}
        <strong className="font-semibold text-choque-primary">
          Choque de Cultura
        </strong>
        . Você pergunta em português; o sistema responde com base em trechos
        reais das transcrições e aponta o vídeo no YouTube no minuto certo.
      </p>

      <Section title="O que é o Choque de Cultura?">
        <p>
          <strong className="font-semibold text-choque-primary">
            Choque de Cultura
          </strong>{' '}
          é um programa brasileiro de humor e crítica de cinema/cultura pop,
          produzido pela <strong className="font-semibold text-choque-primary">TV Quase</strong> e
          popularizado na internet. O formato simula uma mesa de comentaristas
          formada por motoristas de transporte alternativo — “pilotos” —
          discutindo filmes, séries e cultura pop com opiniões absurdas, bordões
          e muito improviso cômico.
        </p>
        <p>
          Os personagens mais conhecidos são{' '}
          <strong className="font-semibold text-choque-primary">
            Rogerinho do Ingá
          </strong>
          , <strong className="font-semibold text-choque-primary">Julinho da Van</strong>,{' '}
          <strong className="font-semibold text-choque-primary">Renan</strong> e{' '}
          <strong className="font-semibold text-choque-primary">Maurílio</strong>, interpretados
          por{' '}
          <strong className="font-semibold text-choque-primary">
            Caito Mainier
          </strong>
          , <strong className="font-semibold text-choque-primary">Leandro Ramos</strong>,{' '}
          <strong className="font-semibold text-choque-primary">Daniel Furlan</strong> e{' '}
          <strong className="font-semibold text-choque-primary">Raul Chequer</strong>.
        </p>
        <p>
          Não é um programa de crítica neutra nem um podcast tradicional de
          conversa casual. A graça está justamente no exagero: os personagens
          falam com convicção sobre cinema, cultura pop e “o mercado”, misturando
          análise torta, provocação, nonsense, bordões e piadas internas.
        </p>
        <p>
          Por isso, uma fala isolada pode parecer estranha, agressiva ou sem
          sentido — dentro do episódio, ela costuma fazer parte da persona dos
          personagens e do ritmo absurdo do programa. Os episódios estão na{' '}
          <a
            href={CHOQUE_EPISODES_PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-choque-accent hover:underline"
          >
            playlist oficial no YouTube
          </a>
          .
        </p>
      </Section>

      <Section title="Por que as frases podem parecer “sem sentido”?">
        <p>
          O Choque de Cultura usa muito humor interno: bordões, repetições,
          callbacks, exageros e opiniões deliberadamente absurdas. Exemplos do
          tipo de coisa que aparece nas transcrições:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Comentários secos ou exagerados sobre um filme, tirados de uma
            discussão maior.
          </li>
          <li>
            Frases repetidas com ênfase, como bordões dos personagens.
          </li>
          <li>
            Referências a episódios anteriores, personagens secundários ou piadas
            antigas.
          </li>
          <li>
            Discussões que parecem crítica de cinema, mas funcionam como esquete
            de humor.
          </li>
        </ul>
        <p>
          O Choque RAG mostra o trecho original transcrito nos cards de citação
          para você abrir o vídeo no YouTube e entender o tom, quem falou e o
          que vinha antes e depois.
        </p>
      </Section>

      <Section title="Como usar o chat">
        <p>
          Faça perguntas em português sobre temas debatidos nos episódios
          indexados — por exemplo: “Quando falaram de Duna?” ou “O que eles
          disseram sobre Velozes e Furiosos?”.
        </p>
        <p>
          Se não conhece o programa, use o botão{' '}
          <strong className="font-semibold text-choque-primary">
            “Nunca ouvi Choque de Cultura”
          </strong>{' '}
          na tela inicial: ele sugere perguntas baseadas no acervo real.
        </p>
        <p>
          Cada resposta pode trazer{' '}
          <strong className="font-semibold text-choque-primary">
            Citation Cards
          </strong>{' '}
          com título do episódio, horário e link{' '}
          <strong className="font-semibold text-choque-primary">
            “Abrir no YouTube”
          </strong>{' '}
          no momento da fala.
        </p>
      </Section>

      <Section title="O que o sistema faz — e o que não faz">
        <p>
          <strong className="font-semibold text-choque-primary">Faz:</strong>{' '}
          busca nos episódios já indexados, responde com base nesses trechos e
          aponta as fontes usadas.
        </p>
        <p>
          <strong className="font-semibold text-choque-primary">Não faz:</strong>{' '}
          substituir o programa, explicar perfeitamente todas as piadas fora de
          contexto nem cobrir todos os episódios já produzidos. A PoC indexa um
          lote inicial de episódios; pode haver falhas de relevância ou
          transcrição. Sempre confira o vídeo original quando quiser validar uma
          fala.
        </p>
      </Section>

      <Section title="Projeto e transparência">
        <p>
          Demo técnica e educacional, sem afiliação oficial com o Choque de
          Cultura, TV Quase, Omelete, Canal Brasil, Globoplay ou Porta dos
          Fundos. O código e a documentação de arquitetura estão no repositório
          público, disponível no rodapé do chat.
        </p>
        <p>
          O produto foi construído com fluxo spec-driven usando o{' '}
          <strong className="font-semibold text-choque-primary">
            BMad Method
          </strong>
          : requisitos, arquitetura e stories antes da implementação — útil para
          manter decisões rastreáveis em um sistema com ingestão, RAG e
          interface de chat.
        </p>
      </Section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="choque-focus-ring inline-flex items-center justify-center rounded-full bg-gradient-to-br from-choque-accent-secondary to-choque-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(225,29,72,0.25)]"
        >
          Ir para o chat
        </Link>
        <a
          href={CHOQUE_EPISODES_PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="choque-focus-ring inline-flex items-center justify-center rounded-full border border-choque-accent-border bg-choque-accent-surface px-5 py-3 text-sm font-semibold text-choque-accent hover:bg-choque-accent-surface-strong"
        >
          Playlist no YouTube
        </a>
      </div>
    </article>
  );
}
