type SuggestionChipsProps = {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
};

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div
      className="flex flex-col gap-2 px-5 pb-2"
      role="group"
      aria-label="Sugestões de perguntas"
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="choque-focus-ring line-clamp-2 rounded-full border border-choque-accent-border bg-choque-accent-surface px-4 py-2.5 text-left text-[13px] leading-snug text-choque-primary hover:border-choque-accent-border-focus"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
