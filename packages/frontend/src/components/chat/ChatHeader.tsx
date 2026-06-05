import Link from 'next/link';
import { ChatBrand } from './ChatBrand';
import { NewConversationButton } from './NewConversationButton';
import { ThemeToggle } from './ThemeToggle';

type ChatHeaderProps = {
  showNewConversation?: boolean;
  onNewConversation?: () => void;
  newConversationDisabled?: boolean;
};

export function ChatHeader({
  showNewConversation = false,
  onNewConversation,
  newConversationDisabled = false,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
      <Link href="/" className="choque-focus-ring rounded-lg">
        <ChatBrand />
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/sobre"
          className="choque-focus-ring hidden rounded-full px-3 py-1.5 text-[13px] font-semibold text-choque-secondary hover:bg-choque-accent-surface hover:text-choque-primary sm:inline-flex"
        >
          Sobre
        </Link>
        {showNewConversation && onNewConversation ? (
          <NewConversationButton
            onClick={onNewConversation}
            disabled={newConversationDisabled}
          />
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
