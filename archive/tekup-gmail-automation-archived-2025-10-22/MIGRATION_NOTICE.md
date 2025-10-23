# ⚠️ MIGRATION NOTICE

**Dato:** 22. Oktober 2025

## ⚠️ DETTE REPOSITORY ER MIGRERET

Indholdet af dette repository er blevet konsolideret til:

📦 **`tekup-gmail-services`**  
📍 **Location:** `C:\Users\empir\tekup-gmail-services`

---

## 🔄 Migration Detaljer

Dette repository var en del af Gmail repos konsolidering:

### Migreret til:
- **apps/gmail-automation/** - Python Gmail forwarding og receipt processing
- **apps/gmail-mcp-server/** - Node.js MCP server

### Konsolideret med:
- Tekup Google AI Gmail services (TypeScript)
- RenOS email automation features

---

## 📚 Nye Repository Struktur

```
tekup-gmail-services/
├── apps/
│   ├── gmail-automation/      (migreret herfra)
│   ├── gmail-mcp-server/       (migreret herfra)
│   └── renos-gmail-services/  (fra Tekup Google AI)
├── shared/
├── config/
└── docs/
```

---

## ⚠️ VIGTIGT

**BRUG IKKE DETTE REPOSITORY TIL NY UDVIKLING!**

Al fremtidig udvikling skal ske i:
👉 `C:\Users\empir\tekup-gmail-services`

Dette repository kan slettes efter 1 uges verifikation af at alt virker i det nye repository.

---

## 🗑️ Sletning

Dette repository kan slettes med:

```powershell
cd C:\Users\empir
Remove-Item -Recurse -Force "tekup-gmail-automation"
```

**Vent dog til efter 1 uge for at sikre alt virker!**

---

**Backup:** `C:\Users\empir\gmail-repos-backup-2025-10-22\tekup-gmail-automation`

