# Deferred work

## Deferred from: code review of story 2-5 (2026-06-05)

- N+1 queries de vizinhos por resultado em `search_archive` — aceitável para demo; otimizar se p95 > 15s
- `findTemporalNeighbors` com `start_sec` estrito — chunks com mesmo `startSec` na zona fina podem não ser vizinhos entre si
