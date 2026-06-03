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

export type OpenRouterTranscriptionOptions = {
  model?: string;
  format?: string;
  languageIn2Digits?: string;
  temperature?: number;
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

type TranscriptionRequest = {
  apiKey: string;
  model: string;
  audioBase64: string;
  format: string;
  language?: string;
  temperature?: number;
};

type TranscriptionResponse = {
  text?: string;
};

/** 5 min — episódios longos; evita worker preso em rede lenta. */
export const TRANSCRIPTION_FETCH_TIMEOUT_MS = 300_000;

export async function transcribeViaOpenRouter(
  params: TranscriptionRequest,
  baseUrl = 'https://openrouter.ai/api/v1',
  timeoutMs = TRANSCRIPTION_FETCH_TIMEOUT_MS,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: params.model,
    input_audio: {
      data: params.audioBase64,
      format: params.format,
    },
  };
  if (params.language) body.language = params.language;
  if (params.temperature !== undefined) body.temperature = params.temperature;

  const response = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `OpenRouter transcription failed (${response.status}): ${errText}`,
    );
  }

  const data = (await response.json()) as TranscriptionResponse;
  if (typeof data.text !== 'string' || data.text.length === 0) {
    throw new Error(
      'OpenRouter transcription returned no text in response body',
    );
  }
  return data.text;
}
