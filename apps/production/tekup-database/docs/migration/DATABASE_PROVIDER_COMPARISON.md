# 🗄️ Database Provider Sammenligning

**Dato:** 22. Oktober 2025, 03:48  
**Formål:** Evaluere ALLE muligheder for central Tekup database

---

## 🎯 Alternativer til Supabase

### **Option 1: Supabase** ☁️ (Current Plan)

**Hvad det er:**

- Open-source Firebase alternativ
- Managed PostgreSQL med extras (Auth, Storage, Realtime)
- Built-in pgvector support
- Auto backups, monitoring, APIs

**Pricing:**
```
FREE tier:
- 500 MB database
- 500K API requests/måned
- 1 GB file storage
- 2 GB bandwidth
= $0/mdr ✅

Pro tier:
- 8 GB database
- 50 GB bandwidth
- Dedicated resources
- Point-in-time recovery
= $25/mdr
```

**Pros:**

- ✅ FREE tier dækker vores behov nu
- ✅ pgvector support (for TekupVault embeddings)
- ✅ Auto backups daily
- ✅ Built-in Auth & RLS
- ✅ Real-time subscriptions
- ✅ EU regions (Frankfurt, Paris)
- ✅ Godt UI dashboard
- ✅ Vi bruger det allerede (2 projekter)

**Cons:**

- ❌ Vendor lock-in (men det er bare Postgres)
- ❌ Cost ved scale ($25/mdr Pro tier)
- ❌ Network latency (cloud only)

**Nuværende brug:**

- TekupVault: 1 projekt (Paris)
- RenOS + Billy: 1 projekt (Frankfurt)

---

### **Option 2: Render.com PostgreSQL** 🎨

**Hvad det er:**

- Managed PostgreSQL fra Render.com
- Samme provider som vores web services
- Simple deployment

**Pricing:**
```
Starter:
- 1 GB storage
- 97 connection limit
= $7/mdr

Standard:
- 10 GB storage
- 197 connections
- Auto backups
= $25/mdr

Pro:
- 100 GB storage
- 397 connections
- Daily backups
= $90/mdr
```

**Pros:**

- ✅ Same provider som web services (simplere)
- ✅ EU regions (Frankfurt)
- ✅ Auto backups
- ✅ PostgreSQL 16 support
- ✅ Direct connection (low latency)

**Cons:**

- ❌ INGEN FREE tier ($7/mdr minimum)
- ❌ pgvector support ukendt
- ❌ Ingen built-in Auth/Realtime
- ❌ Mindre features end Supabase
- ❌ Dyrere ved scale

**Vurdering:** Dyrere end Supabase uden ekstra features

---

### **Option 3: Railway.app** 🚂

**Hvad det er:**

- Developer-first platform
- Managed PostgreSQL
- Auto-scaling

**Pricing:**
```
Hobby:
- $5 free credits/mdr
- Pay-as-you-go efter det
- ~$0.01/GB storage
- ~$0.10/GB bandwidth
= $5-15/mdr (estimat)

Pro:
- $20/mdr base
- Dedicated resources
= $20+/mdr
```

**Pros:**

- ✅ Developer-friendly
- ✅ Auto-scaling
- ✅ Nice CLI tools
- ✅ PostgreSQL extensions support

**Cons:**

- ❌ Ingen rigtig free tier
- ❌ Pricing kan være uforudsigelig
- ❌ Mindre etableret end andre
- ❌ Ingen built-in extras

---

### **Option 4: Neon** ⚡

**Hvad det er:**

- Serverless Postgres
- Instant branching (database branches!)
- Auto-scaling to zero

**Pricing:**
```
FREE tier:
- 512 MB storage
- 1 project
- Auto-suspend after inactivity
= $0/mdr ✅

Pro:
- Unlimited projects
- 10 GB storage
- No auto-suspend
= $19/mdr
```

**Pros:**

- ✅ FREE tier med real Postgres
- ✅ Database branching (cool for testing)
- ✅ Serverless (scales to zero)
- ✅ PostgreSQL 16
- ✅ EU regions

**Cons:**

- ❌ 512 MB limit (tight)
- ❌ Auto-suspend kan være irriterende
- ❌ Ingen pgvector? (skal verificeres)
- ❌ Nyere platform (mindre track record)

---

### **Option 5: PlanetScale** 🌍

**Hvad det er:**

- Serverless MySQL (NOT PostgreSQL!)
- Database branching workflow

**Pricing:**
```
Hobby:
- 5 GB storage
- 1 billion row reads/mdr
= $0/mdr ✅

Scaler:
- 10 GB storage
- Auto-scaling
= $29/mdr
```

**Pros:**

- ✅ Generous free tier
- ✅ Amazing branching workflow
- ✅ Auto-scaling

**Cons:**

- ❌ MySQL (vi bruger Postgres overalt!)
- ❌ Skal rewrite alle schemas
- ❌ Ingen pgvector support
- ❌ Migration ville være MASSIV

**Vurdering:** ❌ IKKE relevant (MySQL)

---

### **Option 6: Aiven** 🦅

**Hvad det er:**

- Multi-cloud managed databases
- Enterprise-grade
- EU-baseret (Finland)

**Pricing:**
```
Startup:
- 10 GB storage
- High availability
= $55/mdr

Business:
- 50 GB storage
- EU compliance
= $110/mdr
```

**Pros:**

- ✅ EU-baseret (GDPR++)
- ✅ Multi-cloud (AWS, GCP, Azure)
- ✅ Enterprise features
- ✅ PostgreSQL extensions

**Cons:**

- ❌ DYRE ($55/mdr minimum)
- ❌ Overkill for vores behov
- ❌ Ingen free tier

**Vurdering:** For enterprise, for dyrt

---

### **Option 7: AWS RDS** ☁️

**Hvad det er:**

- Amazon Relational Database Service
- Managed PostgreSQL

**Pricing:**
```
Free Tier (12 måneder):
- db.t3.micro instance
- 20 GB storage
- 20 GB backup
= $0/mdr (first year)

After free tier:
- db.t3.micro: ~$15/mdr
- db.t3.small: ~$30/mdr
- Storage: $0.115/GB/mdr
= $20-50/mdr
```

**Pros:**

- ✅ Industry standard
- ✅ Massiv ecosystem
- ✅ Full control
- ✅ EU regions (Frankfurt)
- ✅ Alle PostgreSQL extensions

**Cons:**

- ❌ Kompleks setup
- ❌ Dyrt efter free tier
- ❌ Kræver AWS ekspertise
- ❌ Billing kan være surprise

**Vurdering:** Overkill, komplekst

---

### **Option 8: Google Cloud SQL** 🔵

**Hvad det er:**

- Google's managed PostgreSQL
- Similar til AWS RDS

**Pricing:**
```
Shared-core:
- db-f1-micro
- 10 GB storage
= ~$10/mdr

Standard:
- 1 vCPU, 3.75 GB RAM
- 10 GB storage
= ~$25/mdr
```

**Pros:**

- ✅ Google infrastructure
- ✅ EU regions
- ✅ Good performance
- ✅ PostgreSQL 16

**Cons:**

- ❌ Ingen free tier
- ❌ Kompleks pricing
- ❌ Overkill for os

---

### **Option 9: DigitalOcean Managed Databases** 🌊

**Hvad det er:**

- Simple managed PostgreSQL
- Developer-friendly

**Pricing:**
```
Basic:
- 1 GB RAM, 10 GB storage
= $15/mdr

Professional:
- 4 GB RAM, 40 GB storage
- Standby nodes
= $60/mdr
```

**Pros:**

- ✅ Simple pricing
- ✅ Developer-friendly
- ✅ EU regions (Frankfurt)
- ✅ Good docs

**Cons:**

- ❌ Ingen free tier
- ❌ $15/mdr minimum
- ❌ Mindre features end Supabase

---

### **Option 10: Self-Hosted (Docker)** 🐳 (What we did!)

**Hvad det er:**

- Kør PostgreSQL selv i Docker
- Full kontrol

**Pricing:**
```
Development (local):
= $0 ✅

Production (VPS):
- Hetzner Cloud: €5/mdr (~$5)
- Linode: $5/mdr
- DigitalOcean: $6/mdr
= $5-10/mdr
```

**Pros:**

- ✅ FREE for development
- ✅ Full kontrol
- ✅ Billigst for production ($5/mdr)
- ✅ Ingen vendor lock-in
- ✅ Offline development muligt
- ✅ Vi har det allerede! (tekup-database)

**Cons:**

- ❌ Manual backups
- ❌ Manual scaling
- ❌ Manual security updates
- ❌ Skal selv maintaine
- ❌ Ingen built-in features
- ❌ Downtime ved reboot

**Nuværende status:**

- ✅ tekup-database køre i Docker
- ✅ 53 tabeller deployed
- ✅ Virker lokalt

---

## 📊 Side-by-Side Sammenligning

| Provider | Free Tier | Paid Start | pgvector | EU Region | Complexity | Best For |
|----------|-----------|------------|----------|-----------|------------|----------|
| **Supabase** | ✅ 500MB | $25/mdr | ✅ Yes | ✅ Frankfurt | 🟢 Low | **Us!** |
| **Render** | ❌ None | $7/mdr | ❓ Unknown | ✅ Frankfurt | 🟢 Low | Simple apps |
| **Railway** | ⚠️ $5 credit | $5-15/mdr | ✅ Yes | ✅ EU | 🟡 Medium | Developers |
| **Neon** | ✅ 512MB | $19/mdr | ❓ Unknown | ✅ EU | 🟢 Low | Startups |
| **PlanetScale** | ✅ 5GB | $29/mdr | ❌ MySQL | ✅ EU | 🟡 Medium | MySQL apps |
| **Aiven** | ❌ None | $55/mdr | ✅ Yes | ✅ Finland | 🔴 High | Enterprise |
| **AWS RDS** | ⚠️ 12mo | $20/mdr | ✅ Yes | ✅ Frankfurt | 🔴 High | Large scale |
| **GCP SQL** | ❌ None | $10/mdr | ✅ Yes | ✅ EU | 🔴 High | Google stack |
| **DigitalOcean** | ❌ None | $15/mdr | ✅ Yes | ✅ Frankfurt | 🟡 Medium | Simple |
| **Self-hosted** | ✅ $0 | $5/mdr VPS | ✅ Yes | ✅ Anywhere | 🔴 High | Full control |

---

## 🎯 Anbefaling Baseret På Vores Behov

### **Vores Requirements:**

1. ✅ PostgreSQL 16 (vi bruger Prisma schemas)
2. ✅ pgvector support (TekupVault embeddings)
3. ✅ EU region (GDPR, latency til DK)
4. ✅ Multi-schema support (vault, billy, renos, crm, flow)
5. ✅ Lav cost (vi er småt nu)
6. ✅ Room for growth
7. ✅ Auto backups

### **Top 3 Muligheder:**

#### 🥇 **#1: Supabase** (WINNER)

```
Nuværende plan ✅

Pros:
+ FREE tier dækker os NU (500MB, 500k requests)
+ Vi bruger det allerede (2 projekter)
+ pgvector built-in
+ Auto backups
+ Nice features (Auth, Realtime, Storage)
+ EU regions

Cons:
- $25/mdr når vi scaler
- Nogle vendor lock-in features

Anbefaling: FORTSÆT MED SUPABASE
- Merge 2 projekter til 1
- Stay on FREE tier
- Upgrade til Pro når vi rammer limits
```

#### 🥈 **#2: Hybrid (Supabase + Self-hosted)**

```
Ny ide: BEST OF BOTH WORLDS

Setup:
- Production: Supabase (managed, reliable)
- Development: Docker/tekup-database (offline, fast)
- Same schemas everywhere

Pros:
+ Production reliability (Supabase)
+ Development speed (local)
+ Offline development muligt
+ Billigt ($0-25/mdr)

Cons:
- To environments at maintaine
- Skal sync schemas mellem dem

Anbefaling: GOD KOMPROMIS
- Brug Supabase for production
- Brug tekup-database lokalt
- Deploy samme schemas begge steder
```

#### 🥉 **#3: Full Self-hosted**

```
All-in på Docker/VPS

Setup:
- Development: Docker localhost
- Production: Hetzner Cloud VPS (€5/mdr)
- Manual backups & monitoring

Pros:
+ Billigst ($5/mdr production)
+ Full kontrol
+ Ingen vendor lock-in

Cons:
- Manual alt (backups, scaling, security)
- No built-in features
- Mere DevOps work
- Risk of data loss hvis vi fejler backup

Anbefaling: KUN hvis budget er mega tight
- Vi skal selv håndtere ALT
- Ikke anbefalet for production kritiske apps
```

---

## 💡 MIN KLARE ANBEFALING

### **GÅ MED HYBRID APPROACH:**

```
PRODUCTION (Apps deployed til Render.com):
├── Database: Supabase (Frankfurt)
│   ├── Free tier NU
│   ├── Pro tier ($25) når vi scaler
│   ├── Auto backups
│   └── Reliability ✅
│
DEVELOPMENT (Local machines):
├── Database: tekup-database (Docker)
│   ├── Samme schemas som Supabase
│   ├── Offline development
│   ├── Fast iterations
│   └── Free ✅
```

**Setup:**

1. **Production:** Deploy schemas til Supabase (Frankfurt RenOS projekt)
2. **Development:** Brug tekup-database Docker lokalt
3. **Sync:** Prisma migrations køre på begge

**Benefits:**

- ✅ Best of both worlds
- ✅ Production: Managed & reliable
- ✅ Development: Fast & offline
- ✅ Low cost ($0 now, $25 later)
- ✅ We already have both!

---

## 🚀 Konklusion

**Fortsæt med Supabase fordi:**

1. Vi bruger det allerede (2 projekter)
2. FREE tier dækker os perfekt NU
3. pgvector support (kritisk for TekupVault)
4. EU regions (Frankfurt)
5. Auto backups & monitoring
6. Room for growth ($25/mdr Pro tier)
7. Minimal migration (merge 2 projekter)

**PLUS brug tekup-database lokalt for development speed!**

---

**Decision time:** Fortsæt med Supabase som planlagt? ✅
