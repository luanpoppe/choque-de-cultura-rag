/** pgvector via $queryRaw pode devolver distance como string. */
export function coerceChunkDistance(distance: number | string): number {
  const value = typeof distance === 'number' ? distance : Number(distance);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid chunk distance: ${String(distance)}`);
  }
  return value;
}
