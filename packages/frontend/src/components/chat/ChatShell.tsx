import type { ReactNode } from 'react';
import { ChatFooter } from './ChatFooter';
import { ChatHeader } from './ChatHeader';

type ChatShellProps = {
  children: ReactNode;
};

export function ChatShell({ children }: ChatShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div
        className="choque-shell-glass flex max-h-[90vh] w-full max-w-shell flex-col overflow-hidden rounded-shell"
        role="application"
        aria-label="Chat Choque de Cultura RAG"
      >
        <ChatHeader />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <ChatFooter />
      </div>
    </div>
  );
}
