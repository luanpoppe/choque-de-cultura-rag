/** Defina NEXT_PUBLIC_GITHUB_URL no .env da raiz do monorepo. */
const githubUrl =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com';

import Link from 'next/link';

export function ChatFooter() {
  return (
    <footer className="pb-4 text-center text-xs text-choque-muted">
      <Link
        href="/sobre"
        className="font-medium text-choque-accent hover:underline"
      >
        Sobre
      </Link>
      <span> · </span>
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
