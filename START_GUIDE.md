# 🚀 Friday AI - Start Guide

**Status:** Klar til at køre (som i Manus)

---

## ✅ **Prerequisites Check**

### 1. **Dependencies Installeret?**

```bash
cd C:\Users\empir\Tekup\services\tekup-ai-v2
pnpm install
```

### 2. **Environment Variables Konfigureret?**

```bash
# .env fil er oprettet fra template
# Men skal have korrekte værdier:

# MINDSTE krav for at starte:
DATABASE_URL=mysql://friday_user:friday_password@localhost:3306/friday_ai
JWT_SECRET=din-secret-key-her (minimum 32 karakterer)
NODE_ENV=development
PORT=3000

# Optional (men anbefalet):
GEMINI_API_KEY=din-gemini-key
OPENAI_API_KEY=din-openai-key
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
BILLY_API_KEY=din-billy-key
```

### 3. **Database Kører?**

To muligheder:

**Option A: Docker (Anbefalet)**

```bash
# Start MySQL med Docker Compose
docker-compose up -d db

# Vent 10 sekunder til MySQL starter
# Tjek at databasen kører:
docker-compose ps
```

**Option B: Local MySQL**

- Installer MySQL lokalt
- Opret database: `CREATE DATABASE friday_ai;`
- Opret user: `CREATE USER 'friday_user'@'localhost' IDENTIFIED BY 'friday_password';`
- Grant permissions: `GRANT ALL ON friday_ai.* TO 'friday_user'@'localhost';`

### 4. **Push Database Schema**

```bash
pnpm db:push
```

---

## 🎯 **Start Development Server**

### **Metode 1: Standard Development (Anbefalet)**

```bash
pnpm dev
```

Dette starter:

- **Backend**: Express server på port 3000
- **Frontend**: Vite dev server (integrated i samme server)
- **Hot Reload**: Automatisk restart ved ændringer

**Åbn browser:** http://localhost:3000

### **Metode 2: Docker Compose (Production-like)**

```bash
docker-compose up -d
```

Dette starter:

- **Friday AI**: Port 3000
- **MySQL**: Port 3306
- **Redis**: Port 6379 (optional)
- **Adminer**: Port 8080 (database admin UI)

**Åbn browser:**

- http://localhost:3000 - Friday AI
- http://localhost:8080 - Database Admin (login med MySQL credentials)

---

## 🔍 **Troubleshooting**

### Server starter ikke?

1. **Tjek port 3000 er ledig:**

   ```powershell
   Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
   ```

2. **Tjek .env fil:**

   ```bash
   cat .env
   ```

3. **Tjek database connection:**

   ```bash
   # Test MySQL connection
   mysql -h localhost -u friday_user -p friday_ai
   ```

4. **Tjek logs:**

   ```bash
   # Hvis kørt med docker-compose:
   docker-compose logs friday-ai

   # Hvis kørt med pnpm dev:
   # Se terminal output
   ```

### TypeScript errors?

```bash
pnpm check  # ✅ Alle fixes er på plads (0 errors)
```

### Database connection fejl?

- Verificer DATABASE_URL i .env
- Tjek at MySQL kører
- Verificer credentials

---

## 📊 **Status Checklist**

- [x] TypeScript errors fixet (16 → 0)
- [x] Dependencies installeret
- [x] .env fil oprettet
- [ ] Database konfigureret og kørende
- [ ] Database schema pushed (`pnpm db:push`)
- [ ] Server starter (`pnpm dev`)
- [ ] Browser tilgængelig (http://localhost:3000)

---

## 🆚 **Sammenligning: Manus vs Lokal**

| Feature               | Manus         | Lokal (Nu)                     |
| --------------------- | ------------- | ------------------------------ |
| **Port**              | Auto-assigned | 3000 (eller findAvailablePort) |
| **Database**          | Manus managed | MySQL (Docker/Local)           |
| **Auth**              | Manus OAuth   | JWT (local storage)            |
| **Environment**       | Manus runtime | .env file                      |
| **Hot Reload**        | ✅            | ✅                             |
| **AI Models**         | ✅            | ✅ (med API keys)              |
| **Gmail/Calendar**    | ✅            | ✅ (med service account)       |
| **Billy Integration** | ✅            | ✅ (med API key)               |

---

## 🎉 **Næste Skridt**

1. **Konfigurer database** (Docker eller local MySQL)
2. **Opdater .env med korrekte værdier**
3. **Push database schema:** `pnpm db:push`
4. **Start server:** `pnpm dev`
5. **Test i browser:** http://localhost:3000

Ved problemer, tjek `DOCKER_SETUP.md` for mere detaljeret guide.



