import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { MAX_CITATION_CARDS } from './rag-unified-response';

export type RagAgentSubmission = {
  offTopic: boolean;
  reply: string;
  citationChunkIds: string[];
};

export class RagSearchSession {
  readonly chunksById = new Map<string, SimilarChunkWithEpisode>();
  searchCount = 0;
  submission: RagAgentSubmission | null = null;

  registerChunks(chunks: SimilarChunkWithEpisode[]): void {
    for (const chunk of chunks) {
      if (!this.chunksById.has(chunk.id)) {
        this.chunksById.set(chunk.id, chunk);
      }
    }
  }

  setSubmission(submission: RagAgentSubmission): void {
    const uniqueIds = [...new Set(submission.citationChunkIds)]
      .filter((id) => this.chunksById.has(id))
      .slice(0, MAX_CITATION_CARDS);

    this.submission = {
      offTopic: submission.offTopic,
      reply: submission.reply.trim(),
      citationChunkIds: submission.offTopic ? [] : uniqueIds,
    };
  }
}
