import { Inject, Injectable, Logger } from '@nestjs/common';
import { AIMessages, type AICallParams, type AIModelNames } from '@luanpoppe/ai';
import { EnvService } from '@core/env.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { buildWatchUrl } from '@/shared/lib/youtube';
import { buildChunkContextText } from './rag-chunk-neighbors';
import { RagAgentRunner } from './rag-agent.runner';
import type {
  ChatHistoryMessage,
  RagAskResult,
  RagCitation,
} from './rag.types';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly ragAgentRunner: RagAgentRunner,
    private readonly chunkRepository: ChunkRepository,
    @Inject(EnvService) private readonly envService: EnvService,
  ) {}

  async ask(
    message: string,
    history?: ChatHistoryMessage[],
  ): Promise<RagAskResult> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error('Mensagem vazia');
    }

    const preview =
      trimmed.length > 80 ? `${trimmed.slice(0, 79)}…` : trimmed;
    this.logger.log(`ask: "${preview}"`);

    const envs = this.envService.getEnvs();
    const chatModel = envs.CHAT_MODEL as AIModelNames;
    const trimmedHistory = this.trimHistory(history, envs.RAG_MAX_HISTORY_MESSAGES);
    const historyMessages = this.toAiMessages(trimmedHistory);

    const agentResult = await this.ragAgentRunner.run({
      chatModel,
      userMessage: trimmed,
      historyMessages,
      topK: envs.RAG_TOP_K,
      maxDistance: envs.RAG_MAX_DISTANCE,
      maxSearches: envs.RAG_AGENT_MAX_SEARCHES,
      neighborChunks: envs.RAG_NEIGHBOR_CHUNKS,
    });

    this.logger.log(
      `agent result: searches=${agentResult.searchCount} offTopic=${agentResult.offTopic ?? false} noMatch=${agentResult.noMatch ?? false} citations=${agentResult.citedChunks.length}`,
    );

    if (agentResult.noMatch) {
      return {
        reply: agentResult.reply,
        citations: [],
        noMatch: true,
      };
    }

    if (agentResult.offTopic) {
      return {
        reply: agentResult.reply,
        citations: [],
        offTopic: true,
      };
    }

    const citations = await this.buildCitations(
      agentResult.citedChunks,
      envs.RAG_NEIGHBOR_CHUNKS,
    );

    return { reply: agentResult.reply, citations };
  }

  private trimHistory(
    history: ChatHistoryMessage[] | undefined,
    maxMessages: number,
  ): ChatHistoryMessage[] | undefined {
    if (!history?.length || maxMessages <= 0) return undefined;
    if (history.length <= maxMessages) return history;
    return history.slice(-maxMessages);
  }

  private async buildCitations(
    chunks: SimilarChunkWithEpisode[],
    neighborChunks: number,
  ): Promise<RagCitation[]> {
    const seen = new Set<string>();
    const citations: RagCitation[] = [];
    for (const chunk of chunks) {
      if (seen.has(chunk.id)) continue;
      seen.add(chunk.id);
      citations.push(await this.chunkToCitation(chunk, neighborChunks));
    }
    return citations;
  }

  private async chunkToCitation(
    chunk: SimilarChunkWithEpisode,
    neighborChunks: number,
  ): Promise<RagCitation> {
    const quote = await buildChunkContextText(
      chunk,
      this.chunkRepository,
      neighborChunks,
    );

    const citation: RagCitation = {
      episodeTitle: chunk.episodeTitle,
      youtubeVideoId: chunk.youtubeVideoId,
      startSec: chunk.startSec,
      quote,
      watchUrl: buildWatchUrl(chunk.youtubeVideoId, chunk.startSec),
    };

    if (chunk.durationSec != null) {
      citation.durationSec = chunk.durationSec;
    }

    return citation;
  }

  private toAiMessages(
    history?: ChatHistoryMessage[],
  ): NonNullable<AICallParams['messages']> {
    if (!history?.length) return [];
    return history.map((item) =>
      item.role === 'user'
        ? AIMessages.human(item.content)
        : AIMessages.ai(item.content),
    );
  }
}
