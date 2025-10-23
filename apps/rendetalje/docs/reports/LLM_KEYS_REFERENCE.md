# LLM API Keys Reference - Tekup Portfolio

**Oprettet:** 2025-10-17  
**Formål:** Central reference for alle LLM API keys på tværs af Tekup projekter

## 🔑 **OPENAI API KEYS**

### TekupVault (PRODUCTION)
```
OPENAI_API_KEY=<stored-in-render-environment-variables>
```

**Brugt til:**
- OpenAI text-embedding-3-small (1536 dimensions)
- Semantic search i vault_embeddings table
- Deployed på: Render.com (Frankfurt region)

**Konfigureret i:**
- ✅ Render.com Environment Variables (TekupVault service)
- ✅ TekupVault/.env (lokal development)

---

## 🤖 **GEMINI API KEY**

### Google Gemini (BACKUP/FALLBACK)
```
GEMINI_KEY=AIzaSyCIrKq05UNN62NTcaTBWRgN2yj1YvHwu6I
```

**Brugt i projekter:**
- ✅ **Tekup Google AI** - Primær Gemini integration (RenOS backend)
- ✅ **RendetaljeOS/renos-backend** - Gemini 2.0 Flash Thinking support
- ✅ **Tekup-org/mcp-gmail-server** - Gmail automation med Gemini
- 📍 **TekupVault** - IKKE konfigureret endnu (kun OpenAI)

**Model capabilities:**
- Gemini 2.0 Flash (thinking mode)
- Gemini Pro (standard mode)
- Function calling support
- Multimodal input (tekst + billeder)

---

## 🔄 **FAILOVER STRATEGI**

**Hvis OpenAI credits løber tør:**

### Option 1: Gemini i TekupVault (ANBEFALET)
```bash
cd C:\Users\empir\TekupVault

# Tilføj til packages/vault-search/src/embeddings.ts:
# Switch fra OpenAI embedding til Google PaLM embedding
# Eller brug Gemini Pro til text generation fallback
```

**Kræver:**
1. Tilføj `@google/generative-ai` package
2. Update embedding pipeline i `packages/vault-search/`
3. Migrate vector dimensions (OpenAI=1536, Google PaLM kan være anderledes)
4. Regenerate alle embeddings (kun én gang)

### Option 2: Køb flere OpenAI credits
- Gå til platform.openai.com
- Billing → Add credits
- Text-embedding-3-small er billigst (~$0.00002/1K tokens)

---

## 📊 **USAGE & MONITORING**

### OpenAI Usage (TekupVault)
- **Embedding cost:** ~$0.00002 per 1K tokens
- **Estimated monthly:** ~100K documents × 500 tokens avg = 50M tokens = ~$1
- **Monitor:** platform.openai.com/usage

### Gemini Usage
- **Free tier:** 15 requests/min, 1M tokens/min
- **Paid tier (Gemini Pro):** $0.50 per 1M input tokens
- **Monitor:** console.cloud.google.com/apis/api/generativeai/quotas

---

## 🎯 **IMMEDIATE ACTIONS**

- [x] OpenAI key allerede konfigureret i TekupVault Render ✅
- [ ] Test semantic search virker (`POST /api/search`)
- [ ] Monitor OpenAI usage (check dashboard)
- [ ] (Optional) Tilføj Gemini fallback til TekupVault
- [ ] Dokumenter i ChatGPT Project for future reference

---

## 📂 **FILE LOCATIONS**

**OpenAI configurations:**
```
C:\Users\empir\TekupVault\.env
C:\Users\empir\TekupVault\packages\vault-search\src\embeddings.ts
```

**Gemini configurations:**
```
C:\Users\empir\Tekup Google AI\.env
C:\Users\empir\RendetaljeOS\apps\backend\.env
C:\Users\empir\Tekup-org\mcp-gmail-server\.env
```

---

## 🔒 **SECURITY NOTES**

- ⚠️ Disse keys giver fuld API access - ALDRIG commit til git
- ✅ Render.com environment variables er encrypted at rest
- ✅ Supabase Service Key er også sensitiv (full database access)
- 🔄 Rotér keys regelmæssigt (hver 90 dage anbefalet)

---

**Last Updated:** 2025-10-17  
**Maintained by:** Jonas Abde  
**For ChatGPT Project:** Upload til Tekup-workspace for LLM key reference
