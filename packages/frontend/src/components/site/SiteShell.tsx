import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';

type SiteShellProps = {
  children: ReactNode;
  /** Título da página para leitores de tela (o H1 fica no conteúdo). */
  ariaLabel: string;
};

export function SiteShell({ children, ariaLabel }: SiteShellProps) {
  return (
    <div className="flex min-h-screen justify-center p-4 sm:p-6">
      <div
        className="choque-shell-glass flex w-full max-w-shell flex-col overflow-hidden rounded-shell"
        role="document"
        aria-label={ariaLabel}
      >
        <SiteHeader />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-2 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
