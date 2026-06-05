/**
 * Valida episódios indexados e busca frases no acervo (chunks + segmentos STT).
 *
 * Uso (na raiz do monorepo, com .env e Postgres):
 *   pnpm --filter @choque-de-cultura-rag/backend archive:validate
 *   pnpm --filter @choque-de-cultura-rag/backend archive:validate -- --phrase "achou errado otário" --episode 3
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import {
  formatArchiveValidationReport,
  validateArchive,
} from '@modules/ingestion/archive-validation';

config({ path: resolve(__dirname, '../../../.env') });

function parseArgs(argv: string[]): { phrase?: string; episode?: number } {
  const out: { phrase?: string; episode?: number } = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--phrase' && argv[i + 1]) {
      out.phrase = argv[++i];
    } else if (arg === '--episode' && argv[i + 1]) {
      out.episode = Number.parseInt(argv[++i], 10);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL não definida. Configure .env na raiz do monorepo.');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const report = await validateArchive(prisma, {
      phrase: args.phrase,
      episodeNumber: args.episode,
    });
    console.log(formatArchiveValidationReport(report));
    const phraseOk = report.phraseMatches.length > 0;
    const targetOk =
      args.episode == null ||
      (report.targetEpisode != null && report.targetEpisode.chunkCount > 0);
    process.exit(targetOk && phraseOk ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
