# Health Scan TCP Support (2025-09-19)

## Added

- Health scan script now supports TCP service checks via `--include-tcp` and `--tcp-only` flags (socket liveness for databases / caches)
- JSON summary exposes `skipped`, `tcpIncluded`, `tcpOnly` fields
- README updated with usage examples and flag table

Strict mode ignores skipped entries and still exits with code 2 when any non‑skipped service is unhealthy.
