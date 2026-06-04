import { Injectable, Logger } from '@nestjs/common';
import { AIMessages, type AIModelNames } from '@luanpoppe/ai';
import z from 'zod';
import { EnvService } from '@core/env.service';
import { AiService } from '@infrastructure/ai/ai.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { buildWatchUrl } from '@/shared/lib/youtube';
import { coerceChunkDistance } from './rag-distance';
import {
  NO_MATCH_REPLY,
  OFF_TOPIC_CLASSIFIER_SYSTEM,
  OFF_TOPIC_REPLY_SYSTEM,
  RAG_SYSTEM_PROMPT,
} from './rag-prompts';
import type {
  ChatHistoryMessage,
  RagAskResult,
  RagCitation,
} from './rag.types';

const offTopicSchema = z.object({
  offTopic: z.boolean(),
});

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly chunkRepository: ChunkRepository,
    private readonly envService: EnvService,
  ) {}

  async ask(
    message: string,
    history?: ChatHistoryMessage[],
  ): Promise<RagAskResult> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error('Mensagem vazia');
    }

    const envs = this.envService.getEnvs();
    const chatModel = envs.CHAT_MODEL as AIModelNames;
    const trimmedHistory = this.trimHistory(history, envs.RAG_MAX_HISTORY_MESSAGES);
    const historyMessages = this.toAiMessages(trimmedHistory);

    const { response: topicCheck } = await this.aiService.callStructuredOutput({
      aiModel: chatModel,
      systemPrompt: OFF_TOPIC_CLASSIFIER_SYSTEM,
      messages: [
        ...historyMessages,
        AIMessages.human(trimmed),
      ],
      outputSchema: offTopicSchema,
      modelConfig: { temperature: 0 },
    });

    if (topicCheck.offTopic) {
      const { text } = await this.aiService.call({
        aiModel: chatModel,
        systemPrompt: OFF_TOPIC_REPLY_SYSTEM,
        messages: [
          ...historyMessages,
          AIMessages.human(trimmed),
        ],
        modelConfig: { temperature: 0.4 },
      });
      return { reply: text, citations: [], offTopic: true };
    }

    const embedding = await this.aiService.embedQuery(trimmed);
    const candidates = await this.chunkRepository.searchSimilarWithEpisode(
      embedding,
      envs.RAG_TOP_K,
    );
    const relevant = candidates.filter(
      (c) => coerceChunkDistance(c.distance) <= envs.RAG_MAX_DISTANCE,
    );

    if (relevant.length === 0) {
      return {
        reply: NO_MATCH_REPLY,
        citations: [],
        noMatch: true,
      };
    }

    const citations = this.buildCitations(relevant, envs.RAG_MAX_QUOTE_CHARS);
    const contextBlock = this.formatContextBlock(relevant);

    const { text } = await this.aiService.call({
      aiModel: chatModel,
      systemPrompt: `${RAG_SYSTEM_PROMPT}\n\n--- Trechos do acervo ---\n${contextBlock}`,
      messages: [
        ...historyMessages,
        AIMessages.human(trimmed),
      ],
      modelConfig: { temperature: 0.5 },
    });

    this.logger.debug(
      `RAG answer: ${relevant.length} chunks, best distance ${relevant[0]?.distance.toFixed(4)}`,
    );

    return { reply: text, citations };
  }

  private trimHistory(
    history: ChatHistoryMessage[] | undefined,
    maxMessages: number,
  ): ChatHistoryMessage[] | undefined {
    if (!history?.length || maxMessages <= 0) return undefined;
    if (history.length <= maxMessages) return history;
    return history.slice(-maxMessages);
  }

  private buildCitations(
    chunks: SimilarChunkWithEpisode[],
    maxQuoteChars: number,
  ): RagCitation[] {
    const seen = new Set<string>();
    const citations: RagCitation[] = [];
    for (const chunk of chunks) {
      if (seen.has(chunk.id)) continue;
      seen.add(chunk.id);
      citations.push(this.chunkToCitation(chunk, maxQuoteChars));
    }
    return citations;
  }

  private chunkToCitation(
    chunk: SimilarChunkWithEpisode,
    maxQuoteChars: number,
  ): RagCitation {
    const quote =
      chunk.text.length <= maxQuoteChars
        ? chunk.text
        : `${chunk.text.slice(0, maxQuoteChars - 1).trimEnd()}…`;

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

  private formatContextBlock(chunks: SimilarChunkWithEpisode[]): string {
    return chunks
      .map(
        (c, i) =>
          `[${i + 1}] Episódio: ${c.episodeTitle} (vídeo ${c.youtubeVideoId}, ${c.startSec}s–${c.endSec}s)\n${c.text}`,
      )
      .join('\n\n');
  }

  private toAiMessages(history?: ChatHistoryMessage[]) {
    if (!history?.length) return [];
    return history.map((item) =>
      item.role === 'user'
        ? AIMessages.human(item.content)
        : AIMessages.ai(item.content),
    );
  }
}
