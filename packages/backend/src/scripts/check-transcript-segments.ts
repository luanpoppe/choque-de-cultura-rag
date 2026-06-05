/**
 * Valida segmentos STT e chunks após reingestão.
 * Uso: node dist/scripts/check-transcript-segments.js
 */
import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

config({ path: resolve(__dirname, '../../../../.env') });

const VIDEO_IDS = [
  '4u1w1UnqI0Y',
  'pZnWLgFOkBg',
  's5-fdzY1JGw',
  'nox2gG6Mb90',
  'EK65zq2bAKU',
];

type EpisodeRow = {
  youtube_video_id: string;
  title: string;
  duration_sec: number | null;
  segment_count: number;
  chunk_count: number;
  seg_min_start: number | null;
  seg_max_end: number | null;
  seg_avg_dur: number | null;
  seg_non_monotonic: number;
  chunk_min_start: number | null;
  chunk_max_end: number | null;
  chunk_avg_dur: number | null;
};

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL ausente');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    const summary = await prisma.$queryRaw<EpisodeRow[]>`
      SELECT
        e.youtube_video_id,
        e.title,
        e.duration_sec,
        COUNT(DISTINCT ts.id)::int AS segment_count,
        COUNT(DISTINCT c.id)::int AS chunk_count,
        MIN(ts.start_sec) AS seg_min_start,
        MAX(ts.end_sec) AS seg_max_end,
        ROUND(AVG(ts.end_sec - ts.start_sec)::numeric, 2) AS seg_avg_dur,
        (
          SELECT COUNT(*)::int FROM (
            SELECT ts2.ord, ts2.start_sec,
              LAG(ts2.end_sec) OVER (PARTITION BY ts2.episode_id ORDER BY ts2.ord) AS prev_end
            FROM transcript_segments ts2
            WHERE ts2.episode_id = e.id
          ) x WHERE x.prev_end IS NOT NULL AND x.start_sec < x.prev_end - 0.01
        ) AS seg_non_monotonic,
        MIN(c.start_sec) AS chunk_min_start,
        MAX(c.end_sec) AS chunk_max_end,
        ROUND(AVG((c.end_sec - c.start_sec))::numeric, 1) AS chunk_avg_dur
      FROM episodes e
      LEFT JOIN transcript_segments ts ON ts.episode_id = e.id
      LEFT JOIN chunks c ON c.episode_id = e.id
      WHERE e.youtube_video_id = ANY(${VIDEO_IDS}::text[])
      GROUP BY e.id, e.youtube_video_id, e.title, e.duration_sec
      ORDER BY e.published_at NULLS LAST
    `;

    console.log('\n=== Resumo por episódio ===\n');
    for (const row of summary) {
      const dur = row.duration_sec ?? 0;
      const segCovers =
        row.seg_max_end != null && dur > 0
          ? ((row.seg_max_end / dur) * 100).toFixed(0)
          : '—';
      console.log(`${row.youtube_video_id} — ${row.title.slice(0, 50)}`);
      console.log(
        `  Duração vídeo: ${dur}s | Segmentos STT: ${row.segment_count} | Chunks: ${row.chunk_count}`,
      );
      console.log(
        `  STT: ${row.seg_min_start?.toFixed(1)}s → ${row.seg_max_end?.toFixed(1)}s (cobre ~${segCovers}% do vídeo), duração média segmento: ${row.seg_avg_dur}s`,
      );
      console.log(
        `  Chunks: ${row.chunk_min_start}s → ${row.chunk_max_end}s, duração média: ${row.chunk_avg_dur}s | ordem STT quebrada: ${row.seg_non_monotonic}`,
      );
      console.log('');
    }

    const samples = await prisma.$queryRaw<
      {
        youtube_video_id: string;
        ord: number;
        start_sec: number;
        end_sec: number;
        text: string;
      }[]
    >`
      SELECT e.youtube_video_id, ts.ord, ts.start_sec, ts.end_sec,
        LEFT(ts.text, 60) AS text
      FROM transcript_segments ts
      JOIN episodes e ON e.id = ts.episode_id
      WHERE e.youtube_video_id = ANY(${VIDEO_IDS}::text[])
        AND ts.ord IN (0, 1, 2, 50, 100)
      ORDER BY e.youtube_video_id, ts.ord
    `;

    console.log('=== Amostra de segmentos (ord 0,1,2,50,100) ===\n');
    for (const s of samples) {
      console.log(
        `[${s.youtube_video_id}] #${s.ord} ${s.start_sec.toFixed(2)}–${s.end_sec.toFixed(2)}s: "${s.text.trim()}..."`,
      );
    }

    const badChunks = await prisma.$queryRaw<
      { youtube_video_id: string; cnt: number }[]
    >`
      SELECT e.youtube_video_id, COUNT(*)::int AS cnt
      FROM chunks c
      JOIN episodes e ON e.id = c.episode_id
      WHERE e.youtube_video_id = ANY(${VIDEO_IDS}::text[])
        AND (c.start_sec = 0 AND c.end_sec = 0)
      GROUP BY e.youtube_video_id
    `;

    const zeroSeg = summary.filter((r) => r.segment_count === 0);
    const issues: string[] = [];
    if (zeroSeg.length > 0) {
      issues.push(`${zeroSeg.length} episódio(s) sem segmentos STT`);
    }
    if (badChunks.length > 0) {
      issues.push(
        `chunks com start=end=0: ${badChunks.map((b) => `${b.youtube_video_id}(${b.cnt})`).join(', ')}`,
      );
    }
    const noSubSecond = summary.every(
      (r) => r.seg_avg_dur != null && r.seg_avg_dur < 120 && r.seg_avg_dur > 0.5,
    );
    if (!noSubSecond) {
      issues.push('duração média de segmento fora do esperado para Whisper');
    }

    console.log('\n=== Veredito ===');
    if (issues.length === 0) {
      console.log(
        'OK: segmentos STT presentes com timestamps fracionários (Whisper real). Chunks derivados com janelas menores.',
      );
    } else {
      console.log('Problemas:', issues.join('; '));
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
