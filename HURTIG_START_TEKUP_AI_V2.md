# ⚡ Hurtig Start: Tekup AI V2

**🇩🇰 Dansk hurtig guide til at komme i gang med tekup-ai-v2**

---

## 🎯 Hvad er tekup-ai-v2?

`tekup-ai-v2` er Friday AI V2 - en avanceret AI-assistent til Rendetalje med:

- 📧 **Unified Inbox:** Gmail, Kalender, Fakturaer, Leads, Opgaver
- 🤖 **4 AI Modeller:** Gemini, Claude, GPT-4o, Manus AI
- 💼 **Business Integration:** Billy.dk, Google Workspace
- 🚀 **Moderne Tech Stack:** React 19, tRPC, TypeScript

---

## 🚀 Kom i Gang på 5 Minutter

### Trin 1: Initialiser Submodule

```bash
cd /path/to/tekup
git submodule update --init --remote services/tekup-ai-v2
```

### Trin 2: Installer og Konfigurer

```bash
cd services/tekup-ai-v2
pnpm install
cp .env.example .env
# Rediger .env med dine API nøgler
```

### Trin 3: Setup Database

```bash
pnpm db:push
```

### Trin 4: Start!

```bash
pnpm dev
```

Åbn `http://localhost:3000` i din browser! 🎉

---

## 📚 Fuld Dokumentation

### Guides

- **🇩🇰 Komplet Dansk Guide:** [TEKUP_AI_V2_UDVIKLINGS_GUIDE.md](TEKUP_AI_V2_UDVIKLINGS_GUIDE.md)
- **🇬🇧 English Guide:** [TEKUP_AI_V2_SETUP_GUIDE.md](TEKUP_AI_V2_SETUP_GUIDE.md)
- **📖 Services README:** [services/README.md](services/README.md)

### Baggrundsinformation

- **Migration Detaljer:** [FRIDAY_AI_V2_MIGRATION_COMPLETE.md](FRIDAY_AI_V2_MIGRATION_COMPLETE.md)
- **GitHub Organisation:** [GITHUB_TEKUPDK_ORGANIZATION.md](GITHUB_TEKUPDK_ORGANIZATION.md)
- **Workspace Guide:** [WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md)

---

## 🔧 Fejlfinding

### Problem: Tomt directory

```bash
git submodule update --init --remote services/tekup-ai-v2
```

### Problem: Dependencies fejler

```bash
cd services/tekup-ai-v2
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Problem: Database fejl

```bash
# Verificer DATABASE_URL i .env
# Kør migration igen
pnpm db:push
```

---

## 🎯 Hvad Nu?

Efter setup kan du:

- ✅ **Læse den komplette guide:** Se [TEKUP_AI_V2_UDVIKLINGS_GUIDE.md](TEKUP_AI_V2_UDVIKLINGS_GUIDE.md)
- ✅ **Udforske koden:** Browse `services/tekup-ai-v2/client` og `server`
- ✅ **Se live demo:** <https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer>
- ✅ **Besøg repository:** <https://github.com/TekupDK/tekup-friday>

---

## 💡 Hurtige Tips

```bash
# Se alle kommandoer
pnpm run

# Database UI
pnpm db:studio

# Type check
pnpm check

# Run tests
pnpm test
```

---

**Held og lykke! 🚀**

Hvis du har spørgsmål, se de komplette guides ovenfor.
