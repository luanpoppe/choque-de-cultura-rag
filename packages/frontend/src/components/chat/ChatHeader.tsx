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
      <ChatBrand />
      <div className="flex shrink-0 items-center gap-2">
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
