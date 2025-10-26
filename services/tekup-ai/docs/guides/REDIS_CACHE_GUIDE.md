# Redis Cache Guide - RenOS

## 🎯 Oversigt

RenOS bruger Redis til performance-cache af Google Calendar og Gmail API kald. Redis er **valgfrit** - systemet falder automatisk tilbage til in-memory cache hvis Redis ikke er tilgængelig.

## 🚀 Quick Start

### Udvikling uden Redis (Anbefalet)

```bash
# .env
CACHE_PROVIDER=memory
REDIS_ENABLED=false
```

✅ **Fordele:**
- Ingen afhængigheder at installere
- Hurtigere opstart (ingen retry delays)
- Ingen støjende logs
- Perfekt til lokal udvikling

❌ **Ulemper:**
- Cache deles ikke mellem processer
- Cache tømmes ved restart

### Udvikling med Redis (Docker)

```bash
# Start Redis i Docker
docker run -d -p 6379:6379 --name renos-redis redis:7-alpine

# Eller brug docker-compose
docker compose up -d redis

# .env
CACHE_PROVIDER=redis
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

✅ **Fordele:**
- Cache persisterer mellem restarts
- Bedre for multi-process setups
- Tættere på production

### Production med Managed Redis

```bash
# .env (fx Upstash, Redis Cloud, AWS ElastiCache)
CACHE_PROVIDER=redis
REDIS_ENABLED=true
REDIS_URL=rediss://:password@your-redis.cloud:6380
```

## 🔧 Konfiguration

### Environment Variables

| Variable | Værdi | Beskrivelse |
|----------|-------|-------------|
| `CACHE_PROVIDER` | `memory` / `redis` | Cache backend (default: auto-detect) |
| `REDIS_ENABLED` | `true` / `false` | Explicit enable/disable Redis |
| `REDIS_URL` | URL | Redis connection string |

### Retry Strategi

**Default:** 3 retries med backoff (max 1 sekund)

Systemet logger kun **én** fejlbesked og falder stille tilbage til in-memory cache.

## 📊 Cache Keys & TTL

| Cache Type | Key Pattern | TTL | Beskrivelse |
|------------|-------------|-----|-------------|
| Calendar Availability | `calendar:availability:{id}:{start}:{end}` | 5 min | Busy slots |
| Calendar Events | `calendar:list:{id}:{start}:{end}` | 5 min | Event list |
| Next Available Slot | `calendar:nextslot:{id}:{duration}` | 10 min | Slot finder |

## 🛠️ CLI Commands

```powershell
# Test Redis connection
redis-cli -u "$env:REDIS_URL" PING

# Lokal Redis test
redis-cli -h 127.0.0.1 -p 6379 PING

# Se cache statistik (når Redis kører)
redis-cli INFO stats

# Clear all cache
redis-cli FLUSHDB
```

## 🐛 Troubleshooting

### Problem: `ECONNREFUSED` spam i logs

**Løsning:**
```bash
# .env
CACHE_PROVIDER=memory
REDIS_ENABLED=false
```

### Problem: Redis forbinder men auth fejler

**Tjek:**
```bash
# Test connection
redis-cli -u "redis://:password@host:port" PING

# Check AUTH
redis-cli -h host -p port -a password PING
```

### Problem: TLS/SSL fejl med managed Redis

**Fix:**
```bash
# Brug rediss:// (med dobbelt-s)
REDIS_URL=rediss://:password@host:6380
```

### Problem: Cache virker ikke på tværs af processer

**Løsning:** Sørg for at Redis er aktiveret og kører. In-memory cache er process-isoleret.

## 📈 Performance Impact

### Gmail/Calendar API Kald (uden cache)

- `listUpcomingEvents`: ~300-500ms
- `findAvailability`: ~200-400ms
- `findNextAvailableSlot`: ~500-1000ms (multiple API calls)

### Med Redis/Memory Cache (cache hit)

- Alle operationer: **<5ms** ✨

### Cache Hit Rate (forventet)

- Development: 40-60%
- Production: 70-85%

## 🔐 Security

### Development
- Ingen auth nødvendig (localhost)
- Bind kun til `127.0.0.1`

### Production
- **ALTID brug password:** `rediss://:strong_password@host:port`
- Brug TLS (`rediss://` med dobbelt-s)
- Whitelist IP addresses
- Rotate passwords regelmæssigt

## 📚 Relateret Dokumentation

- [Calendar Booking System](./CALENDAR_BOOKING.md)
- [Caching Strategy](./CACHING.md)
- [Deployment Guide](../DEPLOYMENT.md)

## 💡 Best Practices

1. **Lokal Udvikling:** Brug `CACHE_PROVIDER=memory` for minimal friction
2. **CI/CD:** Kør tests med in-memory cache (ingen dependencies)
3. **Staging:** Brug managed Redis for realistisk test
4. **Production:** Managed Redis med TLS + backups

## 🎓 Code Examples

### Manuel Cache Invalidation

```typescript
import { cache } from './services/cacheService';

// Invalidate specific key
cache.delete('calendar:list:primary:*');

// Invalidate pattern
cache.invalidatePattern('^calendar:availability:');
```

### Custom Cache Entry

```typescript
import { cache, CacheTTL } from './services/cacheService';

// Set custom cache
await cache.set('my-key', { data: 'value' }, CacheTTL.short);

// Get from cache
const result = await cache.get<MyType>('my-key');
```

---

**Hjælp:** Hvis du støder på problemer, åbn et issue på GitHub eller tjek [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
