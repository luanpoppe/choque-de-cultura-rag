import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AIModelNames } from '@luanpoppe/ai';
import { EnvService } from '@core/env.service';
import { AiService } from '@infrastructure/ai/ai.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { generateOnboardingSuggestionsWithAi } from './onboarding-suggestion.ai';
import { buildFallbackSuggestions } from './onboarding-suggestion.fallback';

export type OnboardingSuggestionsResult = {
  suggestions: string[];
  emptyCorpus: boolean;
  panorama?: string;
};

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    @Inject(EnvService) private readonly envService: EnvService,
  ) {}

  async getSuggestions(limit = 5): Promise<OnboardingSuggestionsResult> {
    const chunkCount = await this.prisma.chunk.count();
    if (chunkCount === 0) {
      return {
        suggestions: [],
        emptyCorpus: true,
      };
    }

    const poolSize = Math.max(limit * 3, limit);
    const rows = await this.prisma.$queryRaw<
      { text: string; title: string }[]
    >`
      SELECT c.text, e.title
      FROM chunks c
      INNER JOIN episodes e ON e.id = c.episode_id
      ORDER BY RANDOM()
      LIMIT ${poolSize}
    `;

    const chatModel = this.envService.getEnvs().CHAT_MODEL as AIModelNames;
    const aiSuggestions = await generateOnboardingSuggestionsWithAi(
      this.aiService,
      chatModel,
      rows,
      limit,
    );

    let suggestions = aiSuggestions ?? [];
    if (suggestions.length < limit) {
      if (aiSuggestions === null) {
        this.logger.warn(
          'Onboarding: IA indisponível; usando sugestões heurísticas.',
        );
      }
      const fallback = buildFallbackSuggestions(rows, limit);
      const seen = new Set(suggestions.map((s) => s.toLowerCase()));
      for (const item of fallback) {
        if (suggestions.length >= limit) break;
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        suggestions.push(item);
      }
    }

    const episodes = await this.prisma.episode.findMany({
      where: { chunks: { some: {} } },
      select: { title: true },
      orderBy: { publishedAt: 'asc' },
      take: 10,
    });

    const panorama =
      episodes.length > 0
        ? `No acervo indexado há ${episodes.length} episódio(s), incluindo: ${episodes.map((e) => e.title).join('; ')}.`
        : undefined;

    return {
      suggestions,
      emptyCorpus: false,
      panorama,
    };
  }
}
