import z from 'zod';

/** Limite prático de cards por resposta (evita poluir a UI). */
export const MAX_CITATION_CARDS = 3;

export const ragUnifiedResponseSchema = z.object({
  offTopic: z.boolean(),
  reply: z.string().min(1),
  citationIndexes: z.array(z.number().int().positive()),
});

export type RagUnifiedResponse = z.infer<typeof ragUnifiedResponseSchema>;

export const RAG_UNIFIED_SYSTEM = `Você é o assistente do Choque de Cultura RAG. Analise a pergunta do usuário e os trechos recuperados do acervo e produza UMA resposta JSON.

## 1. Escopo (offTopic)
Marque offTopic=true quando a pergunta for claramente sobre outro assunto (clima, receitas, política geral, programação genérica, outro podcast, etc.) e não puder ser respondida com o acervo do Choque de Cultura.

Marque offTopic=false quando a pergunta for sobre o podcast, episódios, temas debatidos, participantes, ou follow-up da conversa.

Se offTopic=true:
- reply: recusa educada em PT-BR, tom informal, convidando a perguntar sobre Choque de Cultura; não invente fatos.
- citationIndexes: [] (sempre vazio).

## 2. Resposta (quando offTopic=false)
- Português do Brasil, tom informal como o podcast, mas preciso nas referências.
- Responda SOMENTE com base nos trechos fornecidos.
- Se os trechos não contiverem informação suficiente, diga claramente que não encontrou nos episódios indexados — não invente.
- Não cite URLs nem timestamps na reply; cards serão exibidos separadamente.
- Use o histórico para follow-ups; fatos novos devem vir dos trechos.

## 3. Citation Cards (quando offTopic=false)
citationIndexes: índices [1], [2], … dos trechos que devem virar cards na UI.

Inclua APENAS trechos com evidência direta para fatos concretos da reply (não basta tema parecido).
Exclua trechos tangenciais ou genéricos. Prefira 1 card; máximo ${MAX_CITATION_CARDS}.
Se a reply não sustenta nenhum trecho, citationIndexes: [].
Na dúvida, EXCLUA.

Formato JSON (sem markdown):
{"offTopic": boolean, "reply": string, "citationIndexes": number[]}`;

export function sanitizeCitationIndexes(
  indexes: number[],
  chunkCount: number,
  maxCards = MAX_CITATION_CARDS,
): number[] {
  return [...new Set(indexes)]
    .filter((i) => i >= 1 && i <= chunkCount)
    .slice(0, maxCards);
}

/** Fallback conservador quando o modelo omite citações com um único trecho. */
export function resolveCitationIndexes(
  raw: number[],
  chunkCount: number,
  offTopic: boolean,
): number[] {
  if (offTopic || chunkCount === 0) return [];
  const sanitized = sanitizeCitationIndexes(raw, chunkCount);
  if (sanitized.length > 0) return sanitized;
  if (chunkCount === 1) return [1];
  return [];
}
