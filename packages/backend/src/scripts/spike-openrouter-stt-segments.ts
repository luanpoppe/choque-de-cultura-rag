/**
 * Spike: OpenRouter STT devolve segmentos/timestamps além de `text`?
 *
 * Uso:
 *   pnpm --filter @choque-de-cultura-rag/backend spike:openrouter-stt
 *   pnpm --filter @choque-de-cultura-rag/backend spike:openrouter-stt -- --audio path/to/file.mp3
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../../');
const SPIKES_DIR = join(REPO_ROOT, '_bmad-output', 'spikes', 'openrouter-stt-segments');
const FIXTURES_DIR = join(SPIKES_DIR, 'fixtures');

config({ path: join(REPO_ROOT, '.env') });

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/audio/transcriptions';
const DEFAULT_VIDEO_ID = '4u1w1UnqI0Y';
const TIMEOUT_MS = 120_000;

type SpikeCase = {
  id: string;
  model: string;
  bodyExtras?: Record<string, unknown>;
};

const CASES: SpikeCase[] = [
  { id: 'whisper-1-baseline', model: 'openai/whisper-1' },
  { id: 'whisper-large-v3-baseline', model: 'openai/whisper-large-v3' },
  { id: 'parakeet-baseline', model: 'nvidia/parakeet-tdt-0.6b-v3' },
  {
    id: 'whisper-1-provider-openai-verbose',
    model: 'openai/whisper-1',
    bodyExtras: {
      provider: {
        options: {
          openai: {
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
          },
        },
      },
    },
  },
  {
    id: 'whisper-1-provider-groq-verbose',
    model: 'openai/whisper-1',
    bodyExtras: {
      provider: {
        options: {
          groq: {
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
          },
        },
      },
    },
  },
  {
    id: 'whisper-large-v3-provider-openai-verbose',
    model: 'openai/whisper-large-v3',
    bodyExtras: {
      provider: {
        options: {
          openai: {
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
          },
        },
      },
    },
  },
  {
    id: 'whisper-1-root-verbose-undocumented',
    model: 'openai/whisper-1',
    bodyExtras: {
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    },
  },
];

type Analysis = {
  ok: boolean;
  httpStatus: number;
  topLevelKeys: string[];
  hasSegmentsArray: boolean;
  segmentCount: number;
  hasWordsArray: boolean;
  wordCount: number;
  textPreview: string;
  error?: string;
  generationId?: string;
};

async function ensureAudioSample(cliAudio?: string): Promise<{
  path: string;
  format: string;
}> {
  if (cliAudio) {
    const path = resolve(cliAudio);
    const format = path.endsWith('.wav') ? 'wav' : 'mp3';
    return { path, format };
  }

  await mkdir(FIXTURES_DIR, { recursive: true });
  const outPath = join(FIXTURES_DIR, 'spike-sample.mp3');
  try {
    await readFile(outPath);
    return { path: outPath, format: 'mp3' };
  } catch {
    // continue to download
  }

  const ytdlp = process.env.YTDLP_BIN ?? 'yt-dlp';
  const url = `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  console.log(`Baixando ~30s de áudio (${DEFAULT_VIDEO_ID}) com ${ytdlp}...`);

  await execFileAsync(
    ytdlp,
    [
      '-f',
      'bestaudio/best',
      '-x',
      '--audio-format',
      'mp3',
      '--download-sections',
      '*0:00-0:30',
      '--force-keyframes-at-cuts',
      '-o',
      join(FIXTURES_DIR, 'spike-sample.%(ext)s'),
      '--no-playlist',
      url,
    ],
    { maxBuffer: 20 * 1024 * 1024 },
  );

  return { path: outPath, format: 'mp3' };
}

async function runCase(
  apiKey: string,
  audioBase64: string,
  format: string,
  testCase: SpikeCase,
): Promise<{ analysis: Analysis; raw: unknown }> {
  const body: Record<string, unknown> = {
    model: testCase.model,
    input_audio: { data: audioBase64, format },
    language: 'pt',
    ...testCase.bodyExtras,
  };

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const generationId = response.headers.get('X-Generation-Id') ?? undefined;
    const rawText = await response.text();
    let raw: unknown;
    try {
      raw = JSON.parse(rawText) as unknown;
    } catch {
      raw = { _parseError: true, _rawText: rawText.slice(0, 2000) };
    }

    if (!response.ok) {
      return {
        raw,
        analysis: {
          ok: false,
          httpStatus: response.status,
          topLevelKeys:
            typeof raw === 'object' && raw !== null
              ? Object.keys(raw as object)
              : [],
          hasSegmentsArray: false,
          segmentCount: 0,
          hasWordsArray: false,
          wordCount: 0,
          textPreview: '',
          error: rawText.slice(0, 500),
          generationId,
        },
      };
    }

    const obj = raw as Record<string, unknown>;
    const segments = obj.segments;
    const words = obj.words;
    const text = typeof obj.text === 'string' ? obj.text : '';

    return {
      raw,
      analysis: {
        ok: true,
        httpStatus: response.status,
        topLevelKeys: Object.keys(obj),
        hasSegmentsArray: Array.isArray(segments),
        segmentCount: Array.isArray(segments) ? segments.length : 0,
        hasWordsArray: Array.isArray(words),
        wordCount: Array.isArray(words) ? words.length : 0,
        textPreview: text.slice(0, 120),
        generationId,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      raw: { error: message },
      analysis: {
        ok: false,
        httpStatus: 0,
        topLevelKeys: [],
        hasSegmentsArray: false,
        segmentCount: 0,
        hasWordsArray: false,
        wordCount: 0,
        textPreview: '',
        error: message,
      },
    };
  }
}

function buildMarkdownReport(
  timestamp: string,
  audioInfo: { path: string; bytes: number },
  results: Array<{ case: SpikeCase; analysis: Analysis }>,
): string {
  const anySegments = results.some((r) => r.analysis.hasSegmentsArray);
  const lines = [
    `# Spike OpenRouter STT — timestamps`,
    ``,
    `**Data:** ${timestamp}`,
    `**Áudio:** \`${audioInfo.path}\` (${audioInfo.bytes} bytes)`,
    ``,
    `## Conclusão`,
    ``,
    anySegments
      ? `**Encontrado:** pelo menos um caso retornou array \`segments\` — ver JSON bruto.`
      : `**Nenhum caso** retornou \`segments\` ou \`words\` no JSON. OpenRouter STT normaliza para \`text\` + \`usage\`.`,
    ``,
    `## Resultados`,
    ``,
    `| Caso | Modelo | HTTP | Keys | segments | words |`,
    `|------|--------|------|------|----------|-------|`,
  ];

  for (const { case: c, analysis: a } of results) {
    lines.push(
      `| ${c.id} | ${c.model} | ${a.httpStatus} | ${a.topLevelKeys.join(', ')} | ${a.hasSegmentsArray ? a.segmentCount : '—'} | ${a.hasWordsArray ? a.wordCount : '—'} |`,
    );
  }

  lines.push(``, `## Detalhes`, ``);
  for (const { case: c, analysis: a } of results) {
    lines.push(`### ${c.id}`);
    if (a.error) lines.push(`- Erro: ${a.error.slice(0, 300)}`);
    if (a.textPreview) lines.push(`- Texto: "${a.textPreview}..."`);
    lines.push(``);
  }

  return lines.join('\n');
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY ausente no .env da raiz do monorepo.');
    process.exit(1);
  }

  const audioArg = process.argv.find((a, i) => process.argv[i - 1] === '--audio');
  const { path: audioPath, format } = await ensureAudioSample(audioArg);
  const audioBuffer = await readFile(audioPath);
  const audioBase64 = audioBuffer.toString('base64');

  await mkdir(SPIKES_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = join(SPIKES_DIR, stamp);
  await mkdir(resultsDir, { recursive: true });

  console.log(`Áudio: ${audioPath} (${audioBuffer.length} bytes)`);
  console.log(`Saída: ${resultsDir}\n`);

  const summaries: Array<{ case: SpikeCase; analysis: Analysis }> = [];

  for (const testCase of CASES) {
    console.log(`→ ${testCase.id}...`);
    const { analysis, raw } = await runCase(
      apiKey,
      audioBase64,
      format,
      testCase,
    );
    summaries.push({ case: testCase, analysis });
    await writeFile(
      join(resultsDir, `${testCase.id}.json`),
      JSON.stringify({ requestCase: testCase, analysis, response: raw }, null, 2),
      'utf8',
    );
    console.log(
      `   ${analysis.ok ? 'OK' : 'FAIL'} keys=[${analysis.topLevelKeys.join(', ')}] segments=${analysis.segmentCount}`,
    );
  }

  const reportMd = buildMarkdownReport(stamp, {
    path: audioPath,
    bytes: audioBuffer.length,
  }, summaries);
  await writeFile(join(resultsDir, 'REPORT.md'), reportMd, 'utf8');
  await writeFile(
    join(SPIKES_DIR, 'latest.json'),
    JSON.stringify({ runAt: stamp, dir: resultsDir, summaries }, null, 2),
    'utf8',
  );

  console.log(`\nRelatório: ${join(resultsDir, 'REPORT.md')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
