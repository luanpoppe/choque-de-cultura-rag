export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type RagCitation = {
  episodeTitle: string;
  youtubeVideoId: string;
  startSec: number;
  durationSec?: number;
  quote: string;
  watchUrl: string;
};

export type RagAskResult = {
  reply: string;
  citations: RagCitation[];
  noMatch?: boolean;
  offTopic?: boolean;
};
