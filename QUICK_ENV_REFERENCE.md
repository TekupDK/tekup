# 🚀 Quick Reference - Dev vs Prod Scripts

## Mest Brugte Scripts

### 💻 Development (dagligt arbejde)

```powershell
pnpm run dev                # Start dev server
pnpm run analyze:customer   # Analyse Emil case
pnpm run migrate:emails     # Sync emails
pnpm run db:push:dev        # Push schema changes
```

### 🚀 Production

```powershell
pnpm run build              # Build til production
pnpm run start              # Start prod server
pnpm run analyze:customer:prod
pnpm run migrate:emails:prod
pnpm run db:push:prod
```

## Hurtig Setup

```powershell
# 1. Opret miljø-filer
Copy-Item .env.dev.template .env.dev
Copy-Item .env.prod.template .env.prod

# 2. Rediger med dine credentials
code .env.dev
code .env.prod

# 3. Test
pnpm run dev
```

## Filer

- `.env.dev` → Development credentials (IKKE på git)
- `.env.prod` → Production credentials (IKKE på git)
- `.env.dev.template` → Template (KAN deles)
- `.env.prod.template` → Template (KAN deles)

## Status: ✅ TESTET OG VIRKER

Customer analysis script kører perfekt med ny miljø-setup!
