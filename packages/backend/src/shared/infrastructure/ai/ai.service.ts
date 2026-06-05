import { Inject, Injectable } from '@nestjs/common';
import {
  AI,
  AIAudio,
  AIEmbeddings,
  type AICallParams,
  type AICallReturn,
  type AICallStructuredOutputParams,
  type AICallStructuredOutputReturn,
  type AIEmbeddingModelNames,
  type OpenRouterTranscriptionOptions,
} from '@luanpoppe/ai';
import type z from 'zod';
import { EnvService } from '@core/env.service';
import {
  transcribeFileWithOpenAiSegments,
  type TranscriptionWithSegments,
} from './openai-transcription';
import {
  resolveAudioFormat,
  resolveWhisperModel,
} from './openrouter-transcription';

/** Normaliza `EMBEDDING_MODEL` do .env para o roteador da lib (`openrouter/...`). */
export function toAIEmbeddingModelName(model: string): AIEmbeddingModelNames {
  if (
    model.startsWith('openrouter/') ||
    model.startsWith('text-embedding-') ||
    model.startsWith('gemini-embedding-')
  ) {
    return model as AIEmbeddingModelNames;
  }
  return `openrouter/${model}` as AIEmbeddingModelNames;
}

/**
 * Único ponto de integração com provedores de IA no backend (OpenRouter + OpenAI STT).
 */
@Injectable()
export class AiService {
  private readonly ai: AI;
  private readonly embeddingModel: AIEmbeddingModelNames;
  private readonly embedKeys: {
    openRouterApiKey: string;
    openAIApiKey?: string;
    googleGeminiToken?: string;
  };

  constructor(@Inject(EnvService) private readonly envService: EnvService) {
    const envs = envService.getEnvs();
    this.ai = new AI({
      openRouterApiKey: envs.OPENROUTER_API_KEY,
      openAIApiKey: envs.OPENAI_API_KEY,
      googleGeminiToken: envs.GEMINI_API_KEY,
    });
    this.embeddingModel = toAIEmbeddingModelName(envs.EMBEDDING_MODEL);
    this.embedKeys = {
      openRouterApiKey: envs.OPENROUTER_API_KEY,
      openAIApiKey: envs.OPENAI_API_KEY,
      googleGeminiToken: envs.GEMINI_API_KEY,
    };
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
    return AIEmbeddings.embedDocuments(
      texts,
      { model: this.embeddingModel, openRouterAllowAllProviders: true },
      this.embedKeys,
    );
  }

  embedQuery(text: string): Promise<number[]> {
    return AIEmbeddings.embedQuery(
      text,
      { model: this.embeddingModel, openRouterAllowAllProviders: true },
      this.embedKeys,
    );
  }

  async transcribeWithWhisper(
    audioBuffer: Buffer,
    options?: {
      model?: string;
      format?: string;
      languageIn2Digits?: string;
      temperature?: number;
    },
  ): Promise<string> {
    const envs = this.envService.getEnvs();
    const orOptions: OpenRouterTranscriptionOptions = {
      model: resolveWhisperModel(options?.model, envs.WHISPER_MODEL),
      format: resolveAudioFormat(options?.format),
      openRouterAllowAllProviders: true,
    };
    if (options?.languageIn2Digits) {
      orOptions.language = options.languageIn2Digits;
    }
    if (options?.temperature !== undefined) {
      orOptions.temperature = options.temperature;
    }
    const result = await AIAudio.transcribeOpenRouter(
      audioBuffer,
      orOptions,
      envs.OPENROUTER_API_KEY,
    );
    if (!result.text?.length) {
      throw new Error(
        'OpenRouter transcription returned no text in response body',
      );
    }
    return result.text;
  }

  /**
   * Transcrição com segmentos e timestamps reais (ingestão).
   * Usa API OpenAI direta — OpenRouter STT não expõe segmentos.
   */
  async transcribeAudioFileWithSegments(
    audioPath: string,
    durationSec: number,
    options?: { format?: string; languageIn2Digits?: string },
  ): Promise<TranscriptionWithSegments> {
    const envs = this.envService.getEnvs();
    if (!envs.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY is required for ingestion with real timestamps (Whisper verbose_json)',
      );
    }
    return transcribeFileWithOpenAiSegments(audioPath, durationSec, {
      apiKey: envs.OPENAI_API_KEY,
      model: envs.OPENAI_WHISPER_MODEL,
      format: resolveAudioFormat(options?.format),
      languageIn2Digits: options?.languageIn2Digits,
    });
  }
}
