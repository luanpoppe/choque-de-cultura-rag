import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Inject, Injectable } from '@nestjs/common';
import { EnvService } from '@core/env.service';

const execFileAsync = promisify(execFile);

export type YoutubeEpisodeMetadata = {
  youtubeVideoId: string;
  title: string;
  watchUrl: string;
  durationSec: number;
  publishedAt: Date | null;
};

type YtDlpJson = {
  id?: string;
  title?: string;
  webpage_url?: string;
  duration?: number;
  upload_date?: string;
};

@Injectable()
export class YtDlpService {
  constructor(@Inject(EnvService) private readonly envService: EnvService) {}

  async fetchMetadata(videoId: string): Promise<YoutubeEpisodeMetadata> {
    const url = this.watchUrl(videoId);
    const { stdout } = await execFileAsync(
      this.bin(),
      ['--dump-single-json', '--no-playlist', url],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    const data = JSON.parse(stdout) as YtDlpJson;
    if (!data.id || !data.title) {
      throw new Error(`yt-dlp metadata incomplete for ${videoId}`);
    }
    return {
      youtubeVideoId: data.id,
      title: data.title,
      watchUrl: data.webpage_url ?? url,
      durationSec: Math.max(1, Math.floor(data.duration ?? 1)),
      publishedAt: parseUploadDate(data.upload_date),
    };
  }

  /**
   * Baixa áudio e retorna caminho do arquivo + função de cleanup.
   */
  /**
   * Lista os N vídeos mais antigos de um canal (`/videos`) ou de uma playlist.
   * Usa --playlist-reverse: ordem do YouTube é do mais novo ao mais antigo; reverse → mais antigos primeiro.
   */
  async listOldestVideoIds(channelOrPlaylistUrl: string, limit: number): Promise<string[]> {
    const url = normalizeChannelVideosUrl(channelOrPlaylistUrl);
    const { stdout } = await execFileAsync(
      this.bin(),
      [
        '--flat-playlist',
        '--playlist-reverse',
        '--playlist-end',
        String(limit),
        '--print',
        'id',
        url,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((id) => id.length > 0);
  }

  /**
   * Lista idiomas de legenda automática disponíveis (spike / diagnóstico).
   */
  async listAutoSubtitleLangs(videoId: string): Promise<string[]> {
    const url = this.watchUrl(videoId);
    try {
      const { stdout } = await execFileAsync(
        this.bin(),
        ['--list-subs', '--no-playlist', url],
        { maxBuffer: 10 * 1024 * 1024 },
      );
      const langs: string[] = [];
      let inAuto = false;
      for (const line of stdout.split(/\r?\n/)) {
        if (line.includes('auto-generated')) {
          inAuto = true;
          continue;
        }
        if (inAuto && line.trim() === '') break;
        if (inAuto) {
          const match = line.trim().match(/^([a-z]{2}(?:-[A-Za-z]+)?)\s/);
          if (match?.[1]) langs.push(match[1]);
        }
      }
      return langs;
    } catch {
      return [];
    }
  }

  async downloadAudio(
    videoId: string,
  ): Promise<{ audioPath: string; cleanup: () => Promise<void> }> {
    const parentDir =
      this.envService.getEnvs().INGEST_TEMP_DIR ?? tmpdir();
    const workDir = await mkdtemp(join(parentDir, 'choque-ingest-'));
    const outputTemplate = join(workDir, '%(id)s.%(ext)s');
    const url = this.watchUrl(videoId);

    await execFileAsync(
      this.bin(),
      [
        '-f',
        'bestaudio/best',
        '-x',
        '--audio-format',
        'mp3',
        '-o',
        outputTemplate,
        '--no-playlist',
        url,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const audioPath = join(workDir, `${videoId}.mp3`);
    const cleanup = async () => {
      await rm(workDir, { recursive: true, force: true });
    };

    try {
      await readFile(audioPath);
    } catch {
      await cleanup();
      throw new Error(`yt-dlp did not produce audio file for ${videoId}`);
    }

    return { audioPath, cleanup };
  }

  private bin(): string {
    return this.envService.getEnvs().YTDLP_BIN ?? 'yt-dlp';
  }

  private watchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
}

export function normalizeChannelVideosUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (trimmed.endsWith('/videos') || trimmed.includes('playlist?')) {
    return trimmed;
  }
  return `${trimmed}/videos`;
}

function parseUploadDate(uploadDate?: string): Date | null {
  if (!uploadDate || uploadDate.length !== 8) return null;
  const year = Number(uploadDate.slice(0, 4));
  const month = Number(uploadDate.slice(4, 6)) - 1;
  const day = Number(uploadDate.slice(6, 8));
  const date = new Date(Date.UTC(year, month, day));
  return Number.isNaN(date.getTime()) ? null : date;
}
