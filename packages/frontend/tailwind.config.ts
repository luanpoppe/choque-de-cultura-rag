import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        choque: {
          accent: 'var(--choque-accent)',
          'accent-secondary': 'var(--choque-accent-secondary)',
          'accent-muted': 'var(--choque-accent-muted)',
          'accent-surface': 'var(--choque-accent-surface)',
          'accent-surface-strong': 'var(--choque-accent-surface-strong)',
          'accent-border': 'var(--choque-accent-border)',
          'accent-border-focus': 'var(--choque-accent-border-focus)',
          primary: 'var(--choque-text-primary)',
          secondary: 'var(--choque-text-secondary)',
          muted: 'var(--choque-text-muted)',
        },
      },
      maxWidth: {
        shell: 'min(960px, 92vw)',
      },
      minHeight: {
        shell: 'min(80vh, 900px)',
      },
      borderRadius: {
        shell: '28px',
      },
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          'ui-sans-serif',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
