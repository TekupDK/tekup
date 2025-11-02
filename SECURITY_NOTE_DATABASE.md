# 🔒 Security Note - Database Credentials

**Important security information about Tekup database credentials**

---

## 🔑 Credential Types

### 1. Supabase Anonymous Key (Public - Safe to Share)

```bash
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Safe to include in:**
- Frontend applications (React, Vue, mobile apps)
- `.env.example` files
- Public documentation
- Version control

**Why it's safe:**
- Designed to be public-facing
- Protected by Row Level Security (RLS) in Supabase
- Only grants access based on RLS policies
- Cannot bypass security rules
- Used for client-side authentication

**What it CAN do:**
- Connect to Supabase from frontend
- Make authorized API calls (based on auth token)
- Subscribe to real-time updates (with RLS)

**What it CANNOT do:**
- Bypass Row Level Security
- Access admin functions
- Modify database schema
- See other users' data (protected by RLS)

---

### 2. Supabase Service Role Key (Secret - Backend Only)

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Keep secure:**
- Backend services only
- Server-side operations
- Admin functions
- Never expose in frontend

**What it CAN do:**
- Bypass Row Level Security
- Full database access
- Admin operations
- Schema modifications (if configured)

**Best practices:**
- ✅ Use environment variables (never hardcode)
- ✅ Restrict to backend services only
- ✅ Never include in frontend code
- ✅ Rotate periodically
- ✅ Use in production environment variables (Railway, Render, etc.)

---

### 3. Database Password (Secret - Backend Only)

```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

🔒 **Highly sensitive:**
- Direct database access
- Full privileges
- Backend only
- Never commit to version control

**Best practices:**
- ❌ Never commit actual password to git
- ✅ Use environment variables
- ✅ Use placeholders in `.env.example` files
- ✅ Get from Supabase dashboard when needed
- ✅ Store in secure credential managers
- ✅ Rotate if compromised

---

## 📋 Current Repository Practice

### What's Committed

The repository includes some credentials in committed files:

**Safe (Public Keys):**
- ✅ `SUPABASE_ANON_KEY` in `.env.example` files
- ✅ `SUPABASE_URL` in `.env.example` files
- ✅ Frontend configuration files

**Consider Rotating:**
- ⚠️ `SUPABASE_SERVICE_KEY` in some files (should be environment-only)
- ⚠️ Actual passwords in some utility scripts

### Recommendation

For enhanced security:

1. **Move service role keys** to environment variables only
2. **Replace hardcoded passwords** with placeholders
3. **Use secrets management** (GitHub Secrets, Railway Secrets, etc.)
4. **Rotate service role key** if exposed

---

## 🛡️ Security Best Practices

### For Development

```bash
# .env.local (never commit)
DATABASE_URL=postgresql://postgres:ACTUAL_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=actual_service_key_here
```

### For .env.example (committed)

```bash
# .env.example (safe to commit)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGci... (public key - safe)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here (placeholder)
```

### For Production

Use environment variables in deployment platforms:

**Railway:**
```bash
# Set in Railway dashboard → Environment Variables
DATABASE_URL=actual_url_with_password
SUPABASE_SERVICE_ROLE_KEY=actual_service_key
```

**Render:**
```bash
# Set in Render dashboard → Environment
DATABASE_URL=actual_url_with_password
SUPABASE_SERVICE_ROLE_KEY=actual_service_key
```

**Vercel/Netlify:**
```bash
# Set in dashboard → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=actual_anon_key (public - safe)
SUPABASE_SERVICE_ROLE_KEY=actual_service_key (server-side only)
```

---

## 🚨 If Credentials Are Compromised

### If Anon Key is Exposed
**Impact:** Low - it's designed to be public
**Action:** No immediate action needed (RLS protects data)

### If Service Role Key is Exposed
**Impact:** HIGH - full database access possible
**Action Required:**

1. **Immediately rotate the key** in Supabase dashboard:
   - Go to Settings → API
   - Generate new service role key
   - Update all backend services

2. **Review access logs** in Supabase dashboard

3. **Check for unauthorized access**

4. **Update all deployment platforms** with new key

### If Database Password is Exposed
**Impact:** CRITICAL - direct database access
**Action Required:**

1. **Immediately reset password** in Supabase dashboard:
   - Go to Settings → Database
   - Reset database password
   - Update all services

2. **Review database audit logs**

3. **Check for unauthorized modifications**

4. **Consider rotating all credentials**

---

## 📚 Additional Resources

### Supabase Security

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/managing-user-data#security-considerations)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)

### General Security

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)

---

## ✅ Security Checklist

For developers:

- [ ] I understand the difference between anon key and service role key
- [ ] I never use service role key in frontend code
- [ ] I use environment variables for all credentials
- [ ] I don't commit actual passwords to version control
- [ ] I know how to rotate credentials if compromised
- [ ] I use RLS policies to protect user data
- [ ] I test my RLS policies thoroughly

For production:

- [ ] All secrets stored in environment variables
- [ ] Service role key only accessible to backend
- [ ] RLS policies enabled and tested
- [ ] Regular security audits scheduled
- [ ] Credential rotation policy in place
- [ ] Access logs monitored

---

**Last Updated:** 2. November 2025  
**Contact:** Security team for concerns
