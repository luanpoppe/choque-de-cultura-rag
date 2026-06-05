import type {
  ChunkNeighbor,
  ChunkRepository,
} from '@infrastructure/vector-store/chunk.repository';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';

export function mergeNeighborTexts(
  before: Pick<ChunkNeighbor, 'text'>[],
  anchor: Pick<ChunkNeighbor, 'text'>,
  after: Pick<ChunkNeighbor, 'text'>[],
): string {
  return [...before, anchor, ...after]
    .map((c) => c.text.trim())
    .filter(Boolean)
    .join(' ');
}

export async function buildChunkContextText(
  chunk: Pick<SimilarChunkWithEpisode, 'episodeId' | 'startSec' | 'text'>,
  chunkRepository: ChunkRepository,
  neighborCount: number,
): Promise<string> {
  if (neighborCount <= 0) return chunk.text.trim();

  const { before, after } = await chunkRepository.findTemporalNeighbors(
    chunk.episodeId,
    chunk.startSec,
    { before: neighborCount, after: neighborCount },
  );

  return mergeNeighborTexts(before, chunk, after);
}
