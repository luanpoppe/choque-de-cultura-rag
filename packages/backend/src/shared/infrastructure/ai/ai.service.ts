import { Injectable } from '@nestjs/common';
import {
  AI,
  type AICallParams,
  type AICallReturn,
  type AICallStructuredOutputParams,
  type AICallStructuredOutputReturn,
} from '@luanpoppe/ai';
import type z from 'zod';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EnvService } from '@core/env.service';
import {
  type OpenRouterTranscriptionOptions,
  resolveAudioFormat,
  resolveWhisperModel,
  transcribeViaOpenRouter,
} from './openrouter-transcription';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Único ponto de integração com provedores de IA no backend (OpenRouter).
 */
@Injectable()
export class AiService {
  private readonly ai: AI;
  private readonly embeddings: OpenAIEmbeddings;

  constructor(private readonly envService: EnvService) {
    const envs = envService.getEnvs();
    this.ai = new AI({
      openRouterApiKey: envs.OPENROUTER_API_KEY,
      googleGeminiToken: envs.GEMINI_API_KEY,
    });
    this.embeddings = new OpenAIEmbeddings({
      apiKey: envs.OPENROUTER_API_KEY,
      model: envs.EMBEDDING_MODEL,
      configuration: {
        baseURL: OPENROUTER_BASE_URL,
      },
    });
  }

  call(params: AICallParams): AICallReturn {
    return this.ai.call(params);
  }

  callStructuredOutput<T extends z.ZodSchema>(
    params: AICallStructuredOutputParams<T>,
  ): AICallStructuredOutputReturn<T> {
    return this.ai.callStructuredOutput(params);
  }

  embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }

  embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async transcribeWithWhisper(
    audioBuffer: Buffer,
    options?: OpenRouterTranscriptionOptions,
  ): Promise<string> {
    const envs = this.envService.getEnvs();
    return transcribeViaOpenRouter({
      apiKey: envs.OPENROUTER_API_KEY,
      model: resolveWhisperModel(options?.model, envs.WHISPER_MODEL),
      audioBase64: audioBuffer.toString('base64'),
      format: resolveAudioFormat(options?.format),
      language: options?.languageIn2Digits,
      temperature: options?.temperature,
    });
  }
}
