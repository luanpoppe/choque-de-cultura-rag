import { AIAudio, type TranscriptionSegment } from '@luanpoppe/ai';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

export type SttSegment = {
  startSec: number;
  endSec: number;
  text: string;
};

export function offsetSttSegments(
  segments: SttSegment[],
  offsetSec: number,
): SttSegment[] {
  return segments.map((s) => ({
    startSec: s.startSec + offsetSec,
    endSec: s.endSec + offsetSec,
    text: s.text,
  }));
}

const execFileAsync = promisify(execFile);

/** Margem abaixo do limite de 25 MB da API OpenAI. */
export const OPENAI_WHISPER_MAX_FILE_BYTES = 24 * 1024 * 1024;

export type OpenAiTranscriptionOptions = {
  apiKey: string;
  model?: string;
  languageIn2Digits?: string;
  format?: string;
};

export type TranscriptionWithSegments = {
  text: string;
  segments: SttSegment[];
};

export function mapTranscriptionSegments(
  segments: TranscriptionSegment[] | undefined,
): SttSegment[] {
  return (segments ?? [])
    .map((seg) => ({
      startSec: seg.start,
      endSec: seg.end,
      text: (seg.text ?? '').trim(),
    }))
    .filter((s) => s.text.length > 0);
}

type WhisperVerboseJson = {
  text?: string;
  segments?: Array<{ start?: number; end?: number; text?: string }>;
};

/** Mantido para testes unitários — espelha o mapeamento da lib. */
export function parseWhisperVerboseJson(body: WhisperVerboseJson): TranscriptionWithSegments {
  const segments = mapTranscriptionSegments(
    (body.segments ?? []).map((seg, id) => ({
      id,
      start: seg.start ?? 0,
      end: seg.end ?? 0,
      text: seg.text ?? '',
    })),
  );

  const text =
    (body.text ?? '').trim() ||
    segments.map((s) => s.text).join(' ').trim();

  return { text, segments };
}

export async function transcribeFileWithOpenAiSegments(
  audioPath: string,
  durationSec: number,
  params: OpenAiTranscriptionOptions,
): Promise<TranscriptionWithSegments> {
  const fileStat = await stat(audioPath);
  const parts = await splitAudioFileIfNeeded(
    audioPath,
    durationSec,
    fileStat.size,
  );

  const allSegments: SttSegment[] = [];
  const textParts: string[] = [];

  try {
    const format = params.format ?? 'mp3';
    for (const part of parts) {
      const result = await transcribeSingleFilePart(part.path, {
        ...params,
        format,
      });
      textParts.push(result.text);
      allSegments.push(...offsetSttSegments(result.segments, part.offsetSec));
    }
  } finally {
    if (parts.length > 0) {
      await parts[0].cleanup();
    }
  }

  return {
    text: textParts.join(' ').trim(),
    segments: allSegments.sort((a, b) => a.startSec - b.startSec),
  };
}

type AudioPart = {
  path: string;
  offsetSec: number;
  cleanup: () => Promise<void>;
};

export async function splitAudioFileIfNeeded(
  audioPath: string,
  durationSec: number,
  fileSizeBytes: number,
): Promise<AudioPart[]> {
  if (fileSizeBytes <= OPENAI_WHISPER_MAX_FILE_BYTES) {
    return [{ path: audioPath, offsetSec: 0, cleanup: async () => {} }];
  }

  if (durationSec <= 0) {
    throw new Error('durationSec required to split large audio for Whisper API');
  }

  const numParts = Math.ceil(fileSizeBytes / OPENAI_WHISPER_MAX_FILE_BYTES);
  const partDurationSec = durationSec / numParts;
  const workDir = await mkdtemp(join(tmpdir(), 'choque-whisper-split-'));
  const parts: AudioPart[] = [];

  for (let i = 0; i < numParts; i += 1) {
    const startSec = i * partDurationSec;
    const partPath = join(workDir, `part-${i}.mp3`);
    await execFileAsync(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-ss',
        String(startSec),
        '-t',
        String(partDurationSec),
        '-i',
        audioPath,
        '-acodec',
        'copy',
        '-y',
        partPath,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    parts.push({
      path: partPath,
      offsetSec: startSec,
      cleanup: async () => {},
    });
  }

  const cleanupDir = async (): Promise<void> => {
    await rm(workDir, { recursive: true, force: true });
  };
  return parts.map((p) => ({ ...p, cleanup: cleanupDir }));
}

async function transcribeSingleFilePart(
  filePath: string,
  params: OpenAiTranscriptionOptions & { format: string },
): Promise<TranscriptionWithSegments> {
  const buffer = await readFile(filePath);
  const detailed = await AIAudio.transcribeDetailedOpenAI(
    buffer,
    {
      model: (params.model ?? 'whisper-1') as 'whisper-1',
      format: params.format,
      languageIn2Digits: params.languageIn2Digits,
      responseFormat: 'verbose_json',
      timestampGranularities: ['segment'],
    },
    params.apiKey,
  );

  const segments = mapTranscriptionSegments(detailed.segments);
  const text =
    detailed.text.trim() || segments.map((s) => s.text).join(' ').trim();

  return { text, segments };
}
