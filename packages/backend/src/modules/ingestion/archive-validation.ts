import type { PrismaClient } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';
import {
  buildPhraseIlikePatterns,
  DEFAULT_VALIDATION_PHRASE,
  parseEpisodeNumberFromTitle,
  type PhraseArchiveMatch,
  type PhraseMatchSource,
} from './archive-phrase-search';

export type EpisodeArchiveSummary = {
  id: string;
  title: string;
  youtubeVideoId: string;
  episodeNumber: number | null;
  chunkCount: number;
  segmentCount: number;
  durationSec: number | null;
};

export type ArchiveValidationReport = {
  phrase: string;
  episodes: EpisodeArchiveSummary[];
  targetEpisode: EpisodeArchiveSummary | null;
  phraseMatches: PhraseArchiveMatch[];
};

export type ValidateArchiveOptions = {
  phrase?: string;
  /** Número do episódio no título (ex. 3 para "#3"). */
  episodeNumber?: number;
};

export async function loadEpisodeSummaries(
  prisma: PrismaClient,
): Promise<EpisodeArchiveSummary[]> {
  const rows = await prisma.episode.findMany({
    select: {
      id: true,
      title: true,
      youtubeVideoId: true,
      durationSec: true,
      _count: { select: { chunks: true, transcriptSegments: true } },
    },
    orderBy: [{ publishedAt: 'asc' }, { title: 'asc' }],
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    youtubeVideoId: row.youtubeVideoId,
    episodeNumber: parseEpisodeNumberFromTitle(row.title),
    chunkCount: row._count.chunks,
    segmentCount: row._count.transcriptSegments,
    durationSec: row.durationSec,
  }));
}

async function searchPhraseInSource(
  prisma: PrismaClient,
  source: PhraseMatchSource,
  patterns: string[],
): Promise<PhraseArchiveMatch[]> {
  const table =
    source === 'chunk'
      ? Prisma.sql`chunks c`
      : Prisma.sql`transcript_segments ts`;
  const startCol = source === 'chunk' ? Prisma.sql`c.start_sec` : Prisma.sql`ts.start_sec`;
  const endCol = source === 'chunk' ? Prisma.sql`c.end_sec` : Prisma.sql`ts.end_sec`;
  const textCol = source === 'chunk' ? Prisma.sql`c.text` : Prisma.sql`ts.text`;
  const episodeJoin =
    source === 'chunk'
      ? Prisma.sql`c.episode_id = e.id`
      : Prisma.sql`ts.episode_id = e.id`;

  const matches: PhraseArchiveMatch[] = [];

  for (const pattern of patterns) {
    const rows = await prisma.$queryRaw<
      Array<{
        episodeId: string;
        episodeTitle: string;
        youtubeVideoId: string;
        startSec: number;
        endSec: number;
        snippet: string;
      }>
    >(Prisma.sql`
      SELECT
        e.id AS "episodeId",
        e.title AS "episodeTitle",
        e.youtube_video_id AS "youtubeVideoId",
        ${startCol} AS "startSec",
        ${endCol} AS "endSec",
        left(${textCol}, 220) AS snippet
      FROM ${table}
      INNER JOIN episodes e ON ${episodeJoin}
      WHERE ${textCol} ILIKE ${pattern}
      ORDER BY e.title, ${startCol}
      LIMIT 30
    `);

    for (const row of rows) {
      matches.push({
        source,
        episodeId: row.episodeId,
        episodeTitle: row.episodeTitle,
        youtubeVideoId: row.youtubeVideoId,
        startSec: row.startSec,
        endSec: row.endSec,
        snippet: row.snippet,
        matchedPattern: pattern,
      });
    }
  }

  return dedupePhraseMatches(matches);
}

function dedupePhraseMatches(
  matches: PhraseArchiveMatch[],
): PhraseArchiveMatch[] {
  const seen = new Set<string>();
  const out: PhraseArchiveMatch[] = [];
  for (const m of matches) {
    const key = `${m.source}:${m.episodeId}:${m.startSec}:${m.snippet.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

export async function validateArchive(
  prisma: PrismaClient,
  options: ValidateArchiveOptions = {},
): Promise<ArchiveValidationReport> {
  const phrase = options.phrase?.trim() || DEFAULT_VALIDATION_PHRASE;
  const patterns = buildPhraseIlikePatterns(phrase);
  const episodes = await loadEpisodeSummaries(prisma);

  const targetEpisode =
    options.episodeNumber != null
      ? episodes.find((e) => e.episodeNumber === options.episodeNumber) ?? null
      : null;

  const chunkMatches = await searchPhraseInSource(prisma, 'chunk', patterns);
  const segmentMatches = await searchPhraseInSource(
    prisma,
    'transcript_segment',
    patterns,
  );

  return {
    phrase,
    episodes,
    targetEpisode,
    phraseMatches: dedupePhraseMatches([...chunkMatches, ...segmentMatches]),
  };
}

export function formatArchiveValidationReport(
  report: ArchiveValidationReport,
): string {
  const lines: string[] = [];
  lines.push(`=== Validação do acervo ===`);
  lines.push(`Frase: "${report.phrase}"`);
  lines.push(`Episódios indexados: ${report.episodes.length}`);
  lines.push('');

  if (report.episodes.length === 0) {
    lines.push('Nenhum episódio no banco. Rode a ingestão primeiro.');
    return lines.join('\n');
  }

  lines.push('--- Episódios ---');
  for (const ep of report.episodes) {
    const num =
      ep.episodeNumber != null ? `#${ep.episodeNumber}` : '(sem # no título)';
    lines.push(
      `${num} | ${ep.chunkCount} chunks, ${ep.segmentCount} segmentos STT | ${ep.title}`,
    );
  }
  lines.push('');

  if (report.targetEpisode) {
    const t = report.targetEpisode;
    lines.push(`--- Episódio alvo #${report.targetEpisode.episodeNumber} ---`);
    lines.push(`Título: ${t.title}`);
    lines.push(`YouTube: ${t.youtubeVideoId}`);
    lines.push(
      t.chunkCount > 0
        ? `Indexado: sim (${t.chunkCount} chunks)`
        : 'Indexado: NÃO (0 chunks — reingerir com force)',
    );
    lines.push('');
  } else if (report.episodes.some((e) => e.episodeNumber != null)) {
    lines.push(
      '--- Episódio alvo: não encontrado pelo número informado ---',
    );
    lines.push('');
  }

  const matches = report.phraseMatches;
  if (matches.length === 0) {
    lines.push('--- Frase no acervo: NÃO encontrada (chunks nem segmentos STT) ---');
    lines.push(
      'Possíveis causas: episódio não ingerido, Whisper transcreveu diferente, ou precisa reingerir com chunking fino no início.',
    );
  } else {
    lines.push(`--- Frase no acervo: ${matches.length} ocorrência(s) ---`);
    for (const m of matches) {
      lines.push(
        `[${m.source}] ${m.episodeTitle} @ ${m.startSec}s (padrão ${m.matchedPattern})`,
      );
      lines.push(`  ${m.snippet}`);
    }
  }

  return lines.join('\n');
}
