import { ChunkRepository, EMBEDDING_DIMENSION } from './chunk.repository';
import { PrismaService } from '@infrastructure/prisma/prisma.service';

describe('ChunkRepository', () => {
  const embedding = Array.from({ length: EMBEDDING_DIMENSION }, () => 0.01);

  const prisma = {
    chunk: {
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };

  const repository = new ChunkRepository(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('insertMany validates embedding dimension', async () => {
    await expect(
      repository.insertMany([
        {
          episodeId: 'ep-1',
          text: 'hello',
          startSec: 0,
          endSec: 60,
          embedding: [0.1, 0.2],
        },
      ]),
    ).rejects.toThrow(/dimension must be 1536/i);
  });

  it('insertMany executes raw insert per chunk', async () => {
    await repository.insertMany([
      {
        episodeId: '550e8400-e29b-41d4-a716-446655440000',
        text: 'trecho',
        startSec: 0,
        endSec: 60,
        embedding,
      },
    ]);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('searchSimilar queries with pgvector operator', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    await repository.searchSimilar(embedding, 4);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
