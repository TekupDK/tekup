# Metrics (MVP)

This service currently exposes a minimal in‑memory Prometheus style endpoint at `/metrics`.
It will later be replaced (or backed) by `prom-client` once persistence + process metrics are required.

## Export Style
Plain text (Prometheus exposition format) including HELP/TYPE metadata lines.

## Counters
| Canonical Name | Labels | Purpose | Notes |
| -------------- | ------ | ------- | ----- |
| `lead_created_total` | `tenant` | Number of leads created (status NEW) | Primary canonical metric |
| `leads_new_total` | `tenant` | Backward compatibility alias for `lead_created_total` | Alias: same value exposed under both names (deprecated) |
| `lead_status_transition_total` | `tenant` | Count of NEW -> CONTACTED transitions | Only allowed transition in MVP |

## Histograms
| Name | Buckets (seconds) | Labels | Description |
| ---- | ----------------- | ------ | ----------- |
| `lead_ingest_duration_seconds` | 0.05, 0.1, 0.25, 0.5, 1, 2, 5 (+Inf) | (none) | Time from HTTP form ingestion receipt to DB persistence |

Implementation keeps cumulative `_bucket`, `_sum`, `_count` lines per Prometheus convention.

## Build Info
A lightweight build/runtime info gauge is emitted as `tekup_build_info` with static value `1` and labels for attributes such as version.

Example:
```
# HELP tekup_build_info Build and runtime information
# TYPE tekup_build_info gauge
tekup_build_info{version="0.1.1",node="20.11.1"} 1
```

## Aliases
`leads_new_total` -> `lead_created_total` (exposed simultaneously). Plan to remove after clients migrate.
Add deprecation notice once external dashboards confirm switch.

## Roadmap (Next)
- Add labels to `lead_ingest_duration_seconds`: `tenant`, `source`.
- Switch to `prom-client` and register default process metrics (cpu, memory, event loop lag) behind a feature flag.
- Add counter `lead_ingest_validation_failed_total{reason}`.
- Introduce gauge for `lead_inflight_processing` when async ingestion (email worker) arrives.

## Usage Examples
curl -H "x-tenant-key: <API_KEY>" http://localhost:4000/metrics

Sample snippet:
```
lead_created_total{tenant="11111111-1111-1111-1111-111111111111"} 42
leads_new_total{tenant="11111111-1111-1111-1111-111111111111"} 42
lead_ingest_duration_seconds_bucket{le="0.05"} 3
...
lead_ingest_duration_seconds_sum 1.234
lead_ingest_duration_seconds_count 10
```

## Testing
Metrics assertions live in `metrics.service.spec.ts` plus e2e coverage in `metrics.e2e-spec.ts` (ensuring counters surface after operations).

## Limitations
- In‑memory only (resets on restart).
- No concurrency protection (single process assumption for MVP).
- No dynamic bucket configuration.

// TODO(mvp+1): Evaluate multi-process aggregation strategy (Prometheus pushgateway, or per-pod scrape + sum).
