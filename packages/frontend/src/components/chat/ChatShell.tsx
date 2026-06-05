import type { ReactNode } from 'react';
import { ChatFooter } from './ChatFooter';
import { ChatHeader } from './ChatHeader';

type ChatShellProps = {
  children: ReactNode;
  showNewConversation?: boolean;
  onNewConversation?: () => void;
  newConversationDisabled?: boolean;
};

export function ChatShell({
  children,
  showNewConversation,
  onNewConversation,
  newConversationDisabled,
}: ChatShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div
        className="choque-shell-glass flex min-h-shell max-h-[92vh] w-full max-w-shell flex-col overflow-hidden rounded-shell"
        role="application"
        aria-label="Chat Choque de Cultura RAG"
      >
        <ChatHeader
          showNewConversation={showNewConversation}
          onNewConversation={onNewConversation}
          newConversationDisabled={newConversationDisabled}
        />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <ChatFooter />
      </div>
    </div>
  );
}
