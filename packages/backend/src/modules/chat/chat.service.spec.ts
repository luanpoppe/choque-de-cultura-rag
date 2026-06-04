jest.mock('@infrastructure/rag/rag.service', () => ({
  RagService: class RagService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from '@infrastructure/rag/rag.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  const ragService = { ask: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: RagService, useValue: ragService },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  it('delega para RagService com message e history', async () => {
    ragService.ask.mockResolvedValue({
      reply: 'ok',
      citations: [],
    });

    const result = await service.ask({
      message: 'Harry Potter?',
      history: [{ role: 'user', content: 'oi' }],
    });

    expect(ragService.ask).toHaveBeenCalledWith('Harry Potter?', [
      { role: 'user', content: 'oi' },
    ]);
    expect(result.reply).toBe('ok');
  });
});
