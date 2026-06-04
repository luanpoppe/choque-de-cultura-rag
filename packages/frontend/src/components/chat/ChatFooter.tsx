/** Defina NEXT_PUBLIC_GITHUB_URL no .env da raiz do monorepo. */
const githubUrl =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com';

export function ChatFooter() {
  return (
    <footer className="pb-4 text-center text-xs text-choque-muted">
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-choque-accent hover:underline"
      >
        GitHub
      </a>
      <span> · demo portfólio</span>
    </footer>
  );
}
