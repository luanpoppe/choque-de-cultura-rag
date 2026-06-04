import { chatRequestSchema } from './chat-request.dto';

describe('chatRequestSchema', () => {
  it('rejeita mensagem vazia', () => {
    const result = chatRequestSchema.safeParse({ message: '   ' });
    expect(result.success).toBe(false);
  });

  it('aceita message e history opcional', () => {
    const result = chatRequestSchema.safeParse({
      message: 'O que falaram de Star Wars?',
      history: [{ role: 'user', content: 'Olá' }],
    });
    expect(result.success).toBe(true);
  });
});
