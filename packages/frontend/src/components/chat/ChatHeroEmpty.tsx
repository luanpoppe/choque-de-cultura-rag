type ChatHeroEmptyProps = {
  onStartOnboarding: () => void;
  onboardingLoading?: boolean;
};

export function ChatHeroEmpty({
  onStartOnboarding,
  onboardingLoading = false,
}: ChatHeroEmptyProps) {
  return (
    <section className="px-7 pb-7 pt-2 text-center">
      <span className="mb-4 inline-block rounded-full bg-choque-accent-surface-strong px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-choque-accent-muted">
        Choque de Cultura
      </span>
      <h1 className="mb-2.5 text-[26px] font-bold leading-tight tracking-tight text-choque-primary">
        O que você quer encontrar no podcast?
      </h1>
      <p className="mb-6 text-[15px] leading-relaxed text-choque-secondary">
        Pergunte em português — a gente aponta o episódio e o minuto exato no
        YouTube.
      </p>
      <button
        type="button"
        onClick={onStartOnboarding}
        disabled={onboardingLoading}
        className="choque-focus-ring mb-3 flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-br from-choque-accent-secondary to-choque-accent px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(225,29,72,0.25)] disabled:cursor-wait disabled:opacity-70"
      >
        {onboardingLoading
          ? 'Buscando exemplos…'
          : 'Nunca ouvi Choque de Cultura — ver exemplos'}
      </button>
      <p className="text-[13px] text-choque-muted">ou escreva abaixo</p>
    </section>
  );
}
