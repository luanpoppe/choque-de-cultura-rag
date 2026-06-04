export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatCitation = {
  episodeTitle: string;
  youtubeVideoId: string;
  startSec: number;
  durationSec?: number;
  quote: string;
  watchUrl: string;
};

export type ChatApiResponse = {
  reply: string;
  citations: ChatCitation[];
  noMatch?: boolean;
  offTopic?: boolean;
};

export type ChatApiRequest = {
  message: string;
  history?: ChatHistoryItem[];
};

export type ChatMessage =
  | { id: string; role: 'user'; content: string }
  | {
      id: string;
      role: 'assistant';
      content: string;
      noMatch?: boolean;
      offTopic?: boolean;
      citations?: ChatCitation[];
    };
