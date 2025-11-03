# Docker Container - Test Setup Overvejelse

## Nuværende Situation

**Dockerfile:**

- Bygger applikationen (`pnpm build`)
- Starter applikationen (`pnpm start`)
- **Ingen test execution** i produktion containeren

**Tests:**

- Kører lokalt med `pnpm test`
- Integration tests der kræver rigtig backend og database
- **Ingen mocks** - kun rigtige data

---

## 🤔 Skal Containeren Opdateres?

### Muligheder:

#### 1. **NEJ - Tests Køres Lokalt/CI** (Anbefalet)

- Tests køres **før** Docker build
- Tests køres i **CI/CD pipeline** (GitHub Actions, etc.)
- Produktion container kun til at køre appen
- **Fordel:** Hurtigere builds, renere separation

#### 2. **JA - Test Script i Container** (Development)

- Tilføj `test` script til Dockerfile (development stage)
- Mulighed for at køre tests i container under development
- **Brug:** `docker exec` eller separate test container

#### 3. **JA - Tests i Build Process** (Strict)

- Kør tests som del af Docker build
- Build fejler hvis tests fejler
- **Bemærk:** Kræver backend og database tilgængelig under build

---

## ✅ Anbefaling

### Produktion Container (Dockerfile)

**NEJ - Lad som det er:**

- Container skal kun køre applikationen
- Tests køres i CI/CD før deployment
- Hurtigere builds

### Development/Test Container (docker-compose.test.yml)

**JA - Opret separat test container:**

- Kør tests mod running backend
- Test container med test dependencies
- Kan køre i CI/CD eller lokalt

---

## 📝 Forslag: Test Container Setup

### Option A: Test Script i Development

Tilføj test script til container (kun development):

```dockerfile
# Development stage
FROM node:22-alpine AS development
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10.20.0 && pnpm install
COPY . .
# Test script available, but not run by default
CMD ["pnpm", "dev"]
```

### Option B: Separate Test Container

Opret `docker-compose.test.yml`:

```yaml
services:
  friday-ai-tests:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - VITE_API_URL=http://friday-ai:3000
    depends_on:
      - friday-ai
    command: pnpm test
```

---

## 🎯 Konklusion

**For Nu:**

- ✅ **Lad produktion container være som den er**
- ✅ **Kør tests lokalt eller i CI/CD**
- ⏳ **Overvej test container hvis tests skal køre i Docker**

**Hvad vil du?**

1. Lad containeren være uændret (tests køres lokalt)
2. Tilføj test script til container (development)
3. Opret separat test container
