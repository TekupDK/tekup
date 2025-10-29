# Troubleshooting Guide

Common issues and solutions for Tekup Database.

---

## 🔍 Table of Contents

1. [Connection Issues](#connection-issues)
2. [Docker Problems](#docker-problems)
3. [Migration Errors](#migration-errors)
4. [Performance Issues](#performance-issues)
5. [Prisma Errors](#prisma-errors)
6. [Testing Failures](#testing-failures)

---

## Connection Issues

### Error: "Can't reach database server"

**Symptoms:**
```
Error: Can't reach database server at `localhost:5432`
```

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   ```

2. **Restart containers:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Check connection string:**
   ```bash
   # Verify .env file
   cat .env
   # Should be: DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db
   ```

4. **Test connection manually:**
   ```bash
   psql "postgresql://tekup:tekup123@localhost:5432/tekup_db"
   ```

### Error: "Connection timed out"

**Cause:** Network or firewall issues

**Solutions:**

1. **Check firewall:**
   ```powershell
   # Windows
   netsh advfirewall firewall show rule name=all | findstr 5432
   ```

2. **Try 127.0.0.1 instead of localhost:**
   ```
   DATABASE_URL=postgresql://tekup:tekup123@127.0.0.1:5432/tekup_db
   ```

3. **Check if port is in use:**
   ```powershell
   netstat -ano | findstr :5432
   ```

---

## Docker Problems

### Error: "Docker daemon is not running"

**Solutions:**

1. **Start Docker Desktop:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File start-docker.ps1
   ```

2. **Wait for Docker to be ready:**
   - Usually takes 30-60 seconds
   - Check Docker Desktop system tray icon

3. **Verify Docker is running:**
   ```bash
   docker info
   ```

### Error: "Port 5432 is already allocated"

**Cause:** Another PostgreSQL instance is using port 5432

**Solutions:**

1. **Find process using port:**
   ```powershell
   netstat -ano | findstr :5432
   # Note the PID (last column)
   ```

2. **Stop conflicting service:**
   ```powershell
   # Stop Windows PostgreSQL service if installed
   net stop postgresql-x64-16
   ```

3. **Or change Docker port:**
   ```yaml
   # docker-compose.yml
   ports:
     - '5433:5432'  # Use different host port
   
   # Update .env
   DATABASE_URL=postgresql://tekup:tekup123@localhost:5433/tekup_db
   ```

### Error: "No space left on device"

**Solutions:**

1. **Clean Docker:**
   ```bash
   docker system prune -a --volumes
   ```

2. **Check disk space:**
   ```powershell
   Get-PSDrive C
   ```

---

## Migration Errors

### Error: "Drift detected"

**Message:**
```
Drift detected: Your database schema is not in sync with your migration history
```

**Solutions:**

1. **Reset development database:**
   ```bash
   pnpm prisma migrate reset
   ```

2. **Push schema directly (development only):**
   ```bash
   pnpm db:push
   ```

3. **Create new migration:**
   ```bash
   pnpm prisma migrate dev --name fix_drift
   ```

### Error: "Foreign key constraint violation"

**Cause:** Data exists that violates new constraints

**Solutions:**

1. **Check existing data:**
   ```sql
   SELECT * FROM schema.table WHERE foreign_key IS NULL;
   ```

2. **Clean invalid data:**
   ```sql
   DELETE FROM schema.table WHERE foreign_key NOT IN (
     SELECT id FROM schema.reference_table
   );
   ```

3. **Disable constraints temporarily (careful!):**
   ```sql
   ALTER TABLE schema.table DISABLE TRIGGER ALL;
   -- Make changes
   ALTER TABLE schema.table ENABLE TRIGGER ALL;
   ```

### Error: "Migration failed to apply"

**Solutions:**

1. **Check migration SQL:**
   ```bash
   cat prisma/migrations/*/migration.sql
   ```

2. **Apply manually:**
   ```bash
   psql "$DATABASE_URL" < prisma/migrations/*/migration.sql
   ```

3. **Mark as applied:**
   ```bash
   pnpm prisma migrate resolve --applied <migration_name>
   ```

---

## Performance Issues

### Slow Queries

**Symptoms:** Queries taking >1 second

**Solutions:**

1. **Check missing indexes:**
   ```sql
   -- Find slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Add indexes:**
   ```prisma
   model Example {
     // ...
     @@index([frequently_queried_field])
   }
   ```

3. **Analyze query plan:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM schema.table WHERE ...;
   ```

### Connection Pool Exhausted

**Error:** "Too many clients already"

**Solutions:**

1. **Increase pool size:**
   ```typescript
   // src/client/index.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL + '?connection_limit=20',
       },
     },
   });
   ```

2. **Check for connection leaks:**
   ```typescript
   // Always disconnect when done
   await prisma.$disconnect();
   ```

3. **Use transaction instead of multiple queries:**
   ```typescript
   await prisma.$transaction([
     prisma.model1.create(...),
     prisma.model2.update(...),
   ]);
   ```

---

## Prisma Errors

### Error: "Unknown arg `schema`"

**Cause:** Preview feature not enabled

**Solution:**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}
```

### Error: "Type 'vector' does not exist"

**Cause:** pgvector extension not installed

**Solutions:**

1. **Check extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

2. **Install extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Restart containers:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Error: "Client generation failed"

**Solutions:**

1. **Clear Prisma cache:**
   ```bash
   rm -rf node_modules/.prisma
   rm -rf node_modules/@prisma
   ```

2. **Reinstall:**
   ```bash
   pnpm install
   pnpm db:generate
   ```

3. **Check schema syntax:**
   ```bash
   pnpm prisma validate
   ```

---

## Testing Failures

### Tests timeout

**Solutions:**

1. **Increase timeout:**
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       timeout: 30000, // 30 seconds
     },
   });
   ```

2. **Check database connection in tests:**
   ```typescript
   beforeAll(async () => {
     await prisma.$connect();
   });
   ```

### Database not cleaned between tests

**Solutions:**

1. **Use transactions:**
   ```typescript
   beforeEach(async () => {
     await prisma.$executeRaw`BEGIN`;
   });

   afterEach(async () => {
     await prisma.$executeRaw`ROLLBACK`;
   });
   ```

2. **Manual cleanup:**
   ```typescript
   afterEach(async () => {
     await prisma.model.deleteMany();
   });
   ```

---

## Health Check Failures

### Health check returns unhealthy

**Check:**

1. **Run health check:**
   ```bash
   pnpm db:health
   ```

2. **Check specific issues:**
   ```bash
   # Connection
   psql "$DATABASE_URL" -c "SELECT 1"
   
   # Schemas
   psql "$DATABASE_URL" -c "SELECT schema_name FROM information_schema.schemata"
   
   # Tables
   psql "$DATABASE_URL" -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('vault', 'billy', 'renos', 'crm', 'flow', 'shared')"
   ```

---

## Common Error Messages

### "role 'tekup' does not exist"

**Solution:**
```sql
CREATE USER tekup WITH PASSWORD 'tekup123';
GRANT ALL PRIVILEGES ON DATABASE tekup_db TO tekup;
```

### "database 'tekup_db' does not exist"

**Solution:**
```bash
docker-compose down -v
docker-compose up -d
# Database will be created automatically
```

### "permission denied for schema"

**Solution:**
```sql
GRANT USAGE ON SCHEMA vault TO tekup;
GRANT ALL ON ALL TABLES IN SCHEMA vault TO tekup;
GRANT ALL ON ALL SEQUENCES IN SCHEMA vault TO tekup;
-- Repeat for all schemas
```

---

## Getting Help

### Before asking for help

1. ✅ Run health check: `pnpm db:health`
2. ✅ Check Docker: `docker ps`
3. ✅ Review logs: `docker logs tekup-database-postgres`
4. ✅ Verify environment: `cat .env`
5. ✅ Try clean restart:
   ```bash
   docker-compose down -v
   docker-compose up -d
   pnpm db:push
   ```

### Collect debug information

```bash
# System info
docker --version
node --version
pnpm --version

# Container status
docker ps -a

# Database logs
docker logs tekup-database-postgres --tail 100

# Connection test
pnpm db:health
```

### Contact

- Check GitHub Issues: <https://github.com/TekupDK/tekup/issues>
- Review documentation: README.md, MIGRATION_GUIDE.md
- Create new issue with debug info above

---

## Prevention Tips

### Best Practices

1. **Always use transactions for multiple operations**
2. **Close connections properly**
3. **Use connection pooling**
4. **Monitor performance metrics**
5. **Keep backups**
6. **Test migrations in staging first**
7. **Use health checks in production**

### Regular Maintenance

```bash
# Weekly
pnpm db:health
docker system prune

# Before major changes
pnpm db:backup

# After migrations
pnpm test
```

---

**Last Updated:** 2025-10-20  
**Version:** 1.0.0
