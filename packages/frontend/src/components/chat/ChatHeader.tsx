import { ChatBrand } from './ChatBrand';
import { ThemeTogglePlaceholder } from './ThemeTogglePlaceholder';

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-6 pb-3 pt-5">
      <ChatBrand />
      <ThemeTogglePlaceholder />
    </header>
  );
}
