const STOPWORDS = new Set([
  'a',
  'ao',
  'as',
  'com',
  'da',
  'de',
  'do',
  'dos',
  'das',
  'e',
  'é',
  'em',
  'na',
  'no',
  'nos',
  'nas',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'pra',
  'que',
  'se',
  'um',
  'uma',
  'você',
  'voce',
]);

const KNOWN_TOPIC_PATTERNS: RegExp[] = [
  /\bHarry\s+Potter\b/i,
  /\bRambo\b/i,
  /\bSe\s+Eu\s+Fosse\s+Você\s*\d*/i,
  /\bBruno\s+de\s+Luca\b/i,
  /\bDune\b/i,
  /\bChoque\s+de\s+Cultura\b/i,
];

const MAX_SUGGESTION_CHARS = 68;
const MAX_TOPIC_CHARS = 36;

export function shortenEpisodeTitle(title: string): string {
  const withoutPrefix = title
    .replace(/^CHOQUE\s+DE\s+CULTURA\s*/i, '')
    .replace(/^#\d+\s*[:.\-]?\s*/i, '')
    .trim();
  if (withoutPrefix.length <= 42) return withoutPrefix;
  const cut = withoutPrefix.slice(0, 42);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 10 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function cleanTopicPhrase(raw: string): string {
  let phrase = raw
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\s+/g, ' ');
  if (phrase.length > MAX_TOPIC_CHARS) {
    const cut = phrase.slice(0, MAX_TOPIC_CHARS);
    const lastSpace = cut.lastIndexOf(' ');
    phrase = (lastSpace > 8 ? cut.slice(0, lastSpace) : cut).trimEnd();
  }
  return phrase;
}

export function extractTopicFromChunk(text: string, episodeTitle: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();

  for (const pattern of KNOWN_TOPIC_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) return cleanTopicPhrase(match[0]);
  }

  const episodeTheme = shortenEpisodeTitle(episodeTitle);
  if (episodeTheme.length > 0 && episodeTheme.length <= MAX_TOPIC_CHARS) {
    return episodeTheme;
  }

  const sobreMatch = normalized.match(
    /\b(?:sobre|falando\s+de|falaram\s+de)\s+([^,.!?\n]{4,40})/i,
  );
  if (sobreMatch) return cleanTopicPhrase(sobreMatch[1]);

  const filmeMatch = normalized.match(
    /\bfilme\s+(?:do|de|da)?\s*([^,.!?\n]{4,32})/i,
  );
  if (filmeMatch) return cleanTopicPhrase(filmeMatch[1]);

  const words = normalized
    .split(/\s+/)
    .filter((word) => !STOPWORDS.has(word.toLowerCase().replace(/[^\wáéíóúâêôãõ]/gi, '')));
  if (words.length >= 2) {
    return cleanTopicPhrase(words.slice(0, 4).join(' '));
  }

  return episodeTheme || 'esse episódio';
}

const TEMPLATES: Array<(topic: string, episodeShort: string) => string> = [
  (topic) => `O que falaram de ${topic}?`,
  (topic) => `Tem trecho sobre ${topic}?`,
  (topic) => `Quando comentaram ${topic}?`,
  (topic, episodeShort) => `Por onde começo em “${episodeShort}”?`,
  (topic) => `O que acharam de ${topic}?`,
  (topic) => `Rolou piada sobre ${topic}?`,
];

export function buildNaturalSuggestion(
  chunkText: string,
  episodeTitle: string,
  index: number,
): string {
  const episodeShort = shortenEpisodeTitle(episodeTitle);
  const topic = extractTopicFromChunk(chunkText, episodeTitle);
  const template = TEMPLATES[index % TEMPLATES.length];
  let suggestion = template(topic, episodeShort);

  if (suggestion.length > MAX_SUGGESTION_CHARS) {
    suggestion = `${suggestion.slice(0, MAX_SUGGESTION_CHARS - 1).trimEnd()}…`;
  }

  return suggestion;
}
