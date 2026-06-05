const MIME_TO_EXTENSION: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
};

export function resolveAudioFormat(format?: string): string {
  if (!format) return 'mp3';
  if (format.startsWith('audio/')) {
    return MIME_TO_EXTENSION[format] ?? 'mp3';
  }
  return format.replace(/^\./, '');
}

export function resolveWhisperModel(
  optionsModel: string | undefined,
  defaultModel: string,
): string {
  if (!optionsModel) return defaultModel;
  if (optionsModel.includes('/')) return optionsModel;
  if (optionsModel === 'whisper-1') return 'openai/whisper-1';
  return `openai/${optionsModel}`;
}
