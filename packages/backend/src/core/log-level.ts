import type { LogLevel } from '@nestjs/common';

export const LOG_LEVELS = [
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
] as const satisfies readonly LogLevel[];

export type AppLogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_ORDER: AppLogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

/** Níveis Nest exibidos até o máximo configurado (inclusive). */
export function resolveNestLogLevels(
  level: AppLogLevel | string | undefined,
): LogLevel[] {
  const normalized = (level ?? 'log').toLowerCase() as AppLogLevel;
  const maxIndex = LEVEL_ORDER.indexOf(normalized);
  const index = maxIndex >= 0 ? maxIndex : LEVEL_ORDER.indexOf('log');
  return LEVEL_ORDER.slice(0, index + 1);
}
