import type { Metadata } from 'next';
import { AboutContent } from '@/components/site/AboutContent';
import { SiteShell } from '@/components/site/SiteShell';

export const metadata: Metadata = {
  title: 'Sobre · Choque RAG',
  description:
    'O que é o Choque de Cultura (TV Quase), como usar o chat RAG e por que as falas do programa podem parecer fora de contexto.',
};

export default function SobrePage() {
  return (
    <SiteShell ariaLabel="Sobre o Choque RAG">
      <AboutContent />
    </SiteShell>
  );
}
