'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatBrand } from '@/components/chat/ChatBrand';
import { ThemeToggle } from '@/components/chat/ThemeToggle';

const navItems = [
  { href: '/', label: 'Chat' },
  { href: '/sobre', label: 'Sobre' },
] as const;

function navLinkClass(active: boolean): string {
  const base =
    'choque-focus-ring rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors';
  return active
    ? `${base} bg-choque-accent-surface-strong text-choque-accent`
    : `${base} text-choque-secondary hover:bg-choque-accent-surface hover:text-choque-primary`;
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-choque-accent-border/60 px-6 py-4 sm:px-8">
      <Link href="/" className="choque-focus-ring rounded-lg">
        <ChatBrand />
      </Link>
      <nav
        className="flex items-center gap-1"
        aria-label="Navegação principal"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={navLinkClass(pathname === item.href)}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </header>
  );
}
