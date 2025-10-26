# 🚀 Installation Guide - Supabase Migration til renos-backend

## 📋 Forudsætninger

- Node.js installeret
- npm eller yarn package manager
- Adgang til din separate `renos-backend` mappe
- Supabase projekt credentials (allerede konfigureret)

## 🎯 Step-by-Step Installation

### 1️⃣ Kopier Migration Package

```powershell
# Naviger til din renos-backend mappe
cd C:\Users\empir\renos-backend

# Kopier alle filer fra migration package
# (Du skal kopiere hele supabase-migration-package mappen til renos-backend)
```

### 2️⃣ Installer Dependencies

```powershell
# Installer Supabase dependencies
npm install @supabase/supabase-js @supabase/ssr

# Hvis du bruger TypeScript
npm install -D @types/node
```

### 3️⃣ Konfigurer Environment Variables

```powershell
# Kopier environment template til .env
copy .env.supabase .env

# Rediger .env filen og erstat:
# [DIN_SERVICE_KEY_HER] med din rigtige service key
# [DIT_PASSWORD] med dit database password
```

### 4️⃣ Integrer Filerne

**A. Kopier konfigurationsfiler:**
```
lib/supabase.ts → src/lib/supabase.ts
middleware/supabaseAuth.ts → src/middleware/supabaseAuth.ts
components/auth/SupabaseAuthProvider.tsx → src/components/auth/SupabaseAuthProvider.tsx
```

**B. Opdater din server.ts:**
```typescript
// Tilføj til din server.ts
import { requireAuth } from './middleware/supabaseAuth';

// Brug middleware på beskyttede routes
app.use('/api/protected', requireAuth);
```

### 5️⃣ Kør Migration Script

```powershell
# Kør det automatiske setup script
.\scripts\supabase-migration.ps1
```

### 6️⃣ Test Forbindelsen

```powershell
# Test Supabase forbindelse
node -e "
const { supabase } = require('./src/lib/supabase');
console.log('Supabase client:', !!supabase);
"
```

## 🔧 Manual Integration Steps

Hvis du foretrækker manuel integration:

### Package.json Updates

Tilføj til din `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0"
  }
}
```

### TypeScript Configuration

Hvis du bruger TypeScript, tilføj til `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

## 🔐 Environment Variables Checklist

Sørg for at din `.env` indeholder:

```env
✅ SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
✅ SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ SUPABASE_SERVICE_KEY=[din service key]
✅ DATABASE_URL=postgresql://postgres:[password]@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

## 🧪 Verification Steps

### 1. Test Supabase Client
```javascript
const { supabase } = require('./src/lib/supabase');
console.log('Supabase initialized:', !!supabase);
```

### 2. Test Authentication Middleware
```javascript
const { requireAuth } = require('./src/middleware/supabaseAuth');
console.log('Auth middleware loaded:', typeof requireAuth);
```

### 3. Test Database Connection
```javascript
const { supabase } = require('./src/lib/supabase');
supabase.from('todos').select('*').limit(1)
  .then(({ data, error }) => {
    console.log('Database test:', error ? 'Failed' : 'Success');
  });
```

## 🚨 Troubleshooting

### Common Issues:

**1. Module not found errors:**
```powershell
npm install @supabase/supabase-js @supabase/ssr
```

**2. Environment variables not loaded:**
```powershell
# Tjek at .env filen er i root directory
# Tjek at der ikke er mellemrum omkring = tegnet
```

**3. TypeScript errors:**
```powershell
npm install -D @types/node
```

**4. Database connection errors:**
- Tjek DATABASE_URL password
- Tjek Supabase project status
- Tjek firewall/network settings

## 📚 Next Steps

Efter succesfuld installation:

1. **Læs dokumentationen:** `SUPABASE_FIX_GUIDE.md`
2. **Migrer data:** Brug `supabase-migration.sql`
3. **Test authentication:** Implementer login/logout
4. **Setup RLS:** Konfigurer Row Level Security

## 🆘 Support

Hvis du støder på problemer:

1. Tjek `SUPABASE_FIX_GUIDE.md` for detaljerede løsninger
2. Kør `npm run dev` og tjek console for errors
3. Verificer alle environment variables er korrekte

---

**Held og lykke med migrationen! 🎉**