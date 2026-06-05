import { Injectable, Logger } from '@nestjs/common';
import { AIMessages, type AICallParams, type AIModelNames } from '@luanpoppe/ai';
import { AiService } from '@infrastructure/ai/ai.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { createRagAgentTools } from './rag-agent-tools';
import { RAG_AGENT_SYSTEM } from './rag-agent.prompts';
import { NO_MATCH_REPLY } from './rag-prompts';
import { RagSearchSession } from './rag-search-session';

export type RagAgentRunParams = {
  chatModel: AIModelNames;
  userMessage: string;
  historyMessages: NonNullable<AICallParams['messages']>;
  topK: number;
  maxDistance: number;
  maxSearches: number;
  neighborChunks: number;
};

export type RagAgentRunResult = {
  reply: string;
  citedChunks: SimilarChunkWithEpisode[];
  offTopic?: boolean;
  noMatch?: boolean;
  searchCount: number;
};

@Injectable()
export class RagAgentRunner {
  private readonly logger = new Logger(RagAgentRunner.name);

  constructor(
    private readonly aiService: AiService,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async run(params: RagAgentRunParams): Promise<RagAgentRunResult> {
    const session = new RagSearchSession();
    const tools = createRagAgentTools({
      session,
      aiService: this.aiService,
      chunkRepository: this.chunkRepository,
      topK: params.topK,
      maxDistance: params.maxDistance,
      maxSearches: params.maxSearches,
      neighborChunks: params.neighborChunks,
    });

    this.logger.log(
      `agent start maxSearches=${params.maxSearches} topK=${params.topK}`,
    );

    try {
      await this.aiService.call({
        aiModel: params.chatModel,
        systemPrompt: RAG_AGENT_SYSTEM,
        messages: [
          ...params.historyMessages,
          AIMessages.human(params.userMessage),
        ],
        agent: { tools },
        modelConfig: { temperature: 0.4 },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`agent call failed: ${message}`);
      return {
        reply: NO_MATCH_REPLY,
        citedChunks: [],
        noMatch: true,
        searchCount: session.searchCount,
      };
    }

    this.logger.log(
      `agent done searches=${session.searchCount} submitted=${session.submission != null}`,
    );

    if (!session.submission?.reply) {
      return {
        reply: NO_MATCH_REPLY,
        citedChunks: [],
        noMatch: true,
        searchCount: session.searchCount,
      };
    }

    const { offTopic, reply, citationChunkIds } = session.submission;

    if (offTopic) {
      return {
        reply,
        citedChunks: [],
        offTopic: true,
        searchCount: session.searchCount,
      };
    }

    const citedChunks = citationChunkIds
      .map((id) => session.chunksById.get(id))
      .filter((c): c is SimilarChunkWithEpisode => c != null);

    return {
      reply,
      citedChunks,
      searchCount: session.searchCount,
    };
  }
}
