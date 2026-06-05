# Modelos de dados — backend

ORM: Prisma 7 · Postgres 16 + extensão `vector`

## Entidades principais

### `IngestionJob`

Lote de ingestão disparado pelo operador.

| Campo | Tipo | Notas |
|-------|------|-------|
| status | enum | PENDING → RUNNING → COMPLETED/FAILED |
| successCount / failureCount | int | Agregados por job |

### `Episode`

Episódio YouTube indexado. Idempotência por `youtubeVideoId` (unique).

### `TranscriptSegment`

Segmentos STT com timestamps reais (`start_sec`, `end_sec` float). Fonte: Whisper `verbose_json`.

### `Chunk`

Trecho para busca semântica.

| Campo | Tipo | Notas |
|-------|------|-------|
| text | string | Pode incluir contexto vizinho (zona fina na ingestão) |
| startSec / endSec | int | Âncora temporal para link YouTube |
| embedding | vector(1536) | `text-embedding-3-small` |

## Busca vetorial

- Operador SQL: `<=>` (cosine distance)
- `ChunkRepository.searchSimilarWithEpisode` — join com `episodes` para metadados
- `ChunkRepository.findTemporalNeighbors` — vizinhos por `start_sec` no mesmo episódio

## Relacionamentos

```
IngestionJob 1—* Episode 1—* Chunk
                      1—* TranscriptSegment
```

Cascade delete em segmentos/chunks ao remover episódio.
