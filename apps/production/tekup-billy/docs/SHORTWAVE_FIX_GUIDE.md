# Shortwave Billy Integration Fix Guide

**Problem:** Shortwave bruger gammel Billy MCP version (Render.com) som ikke har v2.0.2/v2.0.3 fixes
**Solution:** Opdater til Railway (v2.0.3) eller deploy v2.0.3 til Render.com

**Date:** November 26, 2025

---

## 🔴 Nuværende Problem

### Tom Frandsen Case (Fra Shortwave Chat)

**Hvad skete:**
1. ✅ `create_customer` → Fejlede første gang
2. ✅ `create_customer` → Success anden gang
3. ✅ `create_invoice` → Success (2.792 kr DRAFT)
4. ❌ `update_customer` → **FEJLEDE: "Invalid response format"**

**Shortwave's forklaring:**
> "Billy.dk's API har en kendt begrænsning med at gemme email og telefon for private kunder"

**Realiteten:**
- Det er IKKE en Billy API limitation
- Det er en bug i Billy MCP v1.x/v2.0.0
- Fixed i v2.0.1 (1. november 2025)
- Fixed i v2.0.2 (26. november 2025) for createContact
- Enhanced i v2.0.3 (26. november 2025) med smart cache

---

## ✅ LØSNING 1: Opdater Shortwave til Railway (ANBEFALET)

### Step 1: Find Shortwave's Billy Integration

1. Åbn Shortwave
2. Gå til Settings → AI → Integrations/Connectors
3. Find "Billy" eller "Billy MCP" connector

### Step 2: Opdater URL

**Gammel URL (Render.com - BROKEN):**
```
https://tekup-billy.onrender.com
```

**Ny URL (Railway - v2.0.3):**
```
https://tekup-billy-production.up.railway.app
```

### Step 3: Test Integration

Send denne besked til Shortwave:

```
@friday validate Billy auth and show version
```

**Forventet response:**
```json
{
  "success": true,
  "version": "2.0.3",
  "organization": "Rendetalje",
  "features": [
    "parseResponse helper",
    "smart cache fallback",
    "authentication-aware caching"
  ]
}
```

### Step 4: Test Tom Frandsen Update

```
@friday update customer Tom Frandsen (ID: 57DvDpbSQJqcCFvNNTntZg) with:
- Email: tom.frandsen58@gmail.com
- Phone: 22 61 62 10
- Address: Alkevej 2, 8250 Egå, Danmark
```

**Forventet resultat med v2.0.3:**
```
✅ Customer updated successfully
- Name: Tom Frandsen
- Email: tom.frandsen58@gmail.com
- Phone: 22 61 62 10
- Address: Alkevej 2, 8250 Egå, Danmark
```

**INGEN fejl om "Billy API limitation"!**

---

## ✅ LØSNING 2: Deploy v2.0.3 til Render.com

Hvis du SKAL bruge Render.com URL (f.eks. hvis Shortwave ikke kan ændres):

### Step 1: Check Current Render.com Version

```bash
curl https://tekup-billy.onrender.com/version
```

**Hvis version < 2.0.3:**

### Step 2: Deploy til Render.com

```bash
cd /home/user/tekup/apps/production/tekup-billy

# Ensure you're on latest
git checkout main
git pull

# Verify version in package.json
grep version package.json
# Should show: "version": "2.0.3"

# Push to Render.com (if configured)
git push render main

# Or manual deploy via Render.com dashboard
```

### Step 3: Trigger Render Deploy

1. Gå til https://dashboard.render.com
2. Find "tekup-billy" service
3. Klik "Manual Deploy" → "Deploy latest commit"
4. Vent på deploy (2-5 minutter)

### Step 4: Verify Deployment

```bash
# Check version
curl https://tekup-billy.onrender.com/version

# Expected: {"version": "2.0.3", ...}

# Test health
curl https://tekup-billy.onrender.com/health

# Expected: {"status": "healthy", ...}
```

### Step 5: Test in Shortwave

```
@friday validate Billy auth
@friday update Tom Frandsen customer info
```

---

## 📊 Version Comparison

| Feature | Render (v1.x/v2.0.0) | Railway (v2.0.3) |
|---------|---------------------|------------------|
| **createCustomer** | ❌ Fails on singular response | ✅ Handles both formats |
| **updateCustomer** | ❌ "Invalid response format" | ✅ parseResponse helper |
| **createInvoice** | ⚠️ Unreliable | ✅ parseResponse helper |
| **Cache Fallback** | ⚠️ Returns old data for auth errors | ✅ Smart auth-aware cache |
| **Error Messages** | ❌ Generic errors | ✅ Clear, actionable errors |
| **Email/Phone Update** | ❌ "Billy API limitation" | ✅ Works perfectly |

---

## 🧪 Test Cases

### Test Case 1: Create Customer

**Input:**
```typescript
{
  name: "Peder Kjær",
  email: "pederkjaer@hotmail.com",
  phone: "31 77 90 87",
  address: {
    street: "Sifsgade 51, 4.1",
    city: "Åbyhøj",
    zipcode: "8230",
    country: "DK"
  }
}
```

**v1.x/v2.0.0 (Render):**
```
❌ Error: Invalid response format from Billy API - expected contacts array
Retry...
❌ Error again...
Retry...
✅ Success (after 2-3 attempts)
⚠️ Email/phone NOT saved ("Billy API limitation")
```

**v2.0.3 (Railway):**
```
✅ Success (first attempt)
✅ Email/phone saved correctly
✅ All fields populated
```

### Test Case 2: Update Customer

**Input:**
```typescript
{
  contactId: "57DvDpbSQJqcCFvNNTntZg",
  email: "tom.frandsen58@gmail.com",
  phone: "22 61 62 10",
  address: {
    street: "Alkevej 2",
    city: "Egå",
    zipcode: "8250"
  }
}
```

**v1.x/v2.0.0 (Render):**
```
❌ Error: Invalid response format from Billy API - expected contact or contacts
⚠️ LLM concludes: "Billy API limitation for person-type customers"
⚠️ Suggests manual update in Billy.dk web interface
```

**v2.0.3 (Railway):**
```
✅ Success
✅ All fields updated:
   - Email: tom.frandsen58@gmail.com
   - Phone: 22 61 62 10
   - Address: Alkevej 2, 8250 Egå
```

---

## 🎯 Why v2.0.3 Fixes This

### The parseResponse Helper

**File:** `src/billy-client.ts:292-318`

```typescript
/**
 * Parse Billy API response that can be either singular or plural format
 * Billy API inconsistently returns either {item: {...}} or {items: [...]}
 */
private parseResponse<T>(
  response: Record<string, any>,
  singularKey: string,   // "contact"
  pluralKey: string,     // "contacts"
  context: string        // "create contact"
): T | undefined {
  // Try singular format first: {contact: {...}}
  if (response[singularKey] != null && typeof response[singularKey] === "object") {
    return response[singularKey] as T;
  }

  // Try plural format: {contacts: [...]}
  if (response[pluralKey] != null && Array.isArray(response[pluralKey]) && response[pluralKey].length > 0) {
    return response[pluralKey][0] as T;
  }

  // No valid response found
  log.error(`Invalid ${context} response structure`, null, { response });
  return undefined;
}
```

**Usage in createContact (v2.0.2):**
```typescript
const createdContact = this.parseResponse<BillyContact>(
  response,
  "contact",      // ✅ Handles {contact: {...}}
  "contacts",     // ✅ Handles {contacts: [...]}
  "create contact"
);
```

**Usage in updateContact (v2.0.1):**
```typescript
const contact = this.parseResponse<BillyContact>(
  response,
  "contact",      // ✅ Handles {contact: {...}}
  "contacts",     // ✅ Handles {contacts: [...]}
  "update contact"
);
```

---

## 📈 Expected Impact

### Token Usage

| Workflow | Render (v1.x) | Railway (v2.0.3) | Reduction |
|----------|---------------|------------------|-----------|
| Create customer + invoice | ~8,000 | ~600 | 92.5% |
| Update customer info | ~5,000 | ~400 | 92% |
| Handle errors + retries | +3,000 | 0 | 100% |

### User Experience

**Before (Render v1.x):**
- ❌ 2-3 retry attempts per operation
- ❌ "Billy API limitation" explanations
- ❌ Manual fixes required
- ⏱️ 3-5 minutes per workflow
- 😠 Frustrating

**After (Railway v2.0.3):**
- ✅ Success on first attempt
- ✅ All fields save correctly
- ✅ No manual intervention
- ⏱️ 30 seconds per workflow
- 😊 Seamless

---

## 🚨 Common Pitfalls

### Pitfall 1: Assuming "Billy API Limitation" is Real

**Wrong:**
> "Billy API can't save email/phone for person-type customers"

**Right:**
> "Billy MCP v1.x has a bug parsing Billy API responses. Fixed in v2.0.1+"

### Pitfall 2: Not Checking Version

**Wrong:**
```
@friday create customer with email/phone
❌ Fails
Conclusion: "Must be a Billy API issue"
```

**Right:**
```
@friday show Billy MCP version
Response: "v1.4.4" ← OLD!
Conclusion: "Need to update to v2.0.3"
```

### Pitfall 3: Using Wrong URL

**Wrong:**
```
https://tekup-billy.onrender.com ← v1.x/v2.0.0
```

**Right:**
```
https://tekup-billy-production.up.railway.app ← v2.0.3
```

---

## ✅ Verification Checklist

After updating to v2.0.3:

- [ ] Billy MCP version is 2.0.3 (`/version` endpoint)
- [ ] `create_customer` with email/phone succeeds first try
- [ ] `update_customer` with email/phone succeeds
- [ ] No "Billy API limitation" errors
- [ ] Tom Frandsen customer fully updated
- [ ] Tom Frandsen invoice sent successfully
- [ ] All 137 existing customers work correctly
- [ ] Authentication errors don't return cached data
- [ ] Cache metadata appears in fallback responses

---

## 📞 Troubleshooting

### Issue: Shortwave Still Shows Old Version

**Check:**
```bash
# Which URL is Shortwave using?
# Look in Shortwave settings → AI → Integrations
```

**Fix:**
1. Clear Shortwave cache/cookies
2. Re-authenticate with Billy connector
3. Verify URL is Railway, not Render

### Issue: Railway Endpoint Not Working

**Check:**
```bash
curl https://tekup-billy-production.up.railway.app/health
```

**If returns error:**
1. Check Railway dashboard for service status
2. Check Railway logs: `railway logs --follow`
3. Verify environment variables are set

### Issue: Render.com Deploy Stuck

**Check:**
1. Render.com dashboard → "tekup-billy" service
2. Look at deploy logs
3. Check for build errors

**Fix:**
1. Trigger manual deploy
2. Or push to Render git remote again

---

## 🎯 Recommended Action

**For Shortwave:**
1. ✅ Update URL til Railway (5 minutter)
2. ✅ Test Tom Frandsen update (1 minut)
3. ✅ Verify all features work (5 minutter)

**For Render.com (optional):**
1. Deploy v2.0.3 til Render (10 minutter)
2. Keep as backup endpoint
3. Monitor both Railway + Render

---

## 📚 Related Documentation

- [BILLY_LLM_RESEARCH.md](./BILLY_LLM_RESEARCH.md) - Research om hvorfor v3.0 er nødvendig
- [BILLY_V3_ARCHITECTURE.md](./BILLY_V3_ARCHITECTURE.md) - Future architecture
- [MIGRATION_V2_TO_V3.md](./MIGRATION_V2_TO_V3.md) - Migration plan
- [CHANGELOG.md](../CHANGELOG.md) - v2.0.1, v2.0.2, v2.0.3 release notes

---

## 🎉 Success Criteria

You'll know v2.0.3 works when:

1. ✅ Tom Frandsen customer fully updated (email, phone, address)
2. ✅ Invoice sent to tom.frandsen58@gmail.com successfully
3. ✅ No "Billy API limitation" messages
4. ✅ All operations succeed on first attempt
5. ✅ Shortwave shows version "2.0.3"

---

**Last Updated:** November 26, 2025
**Version:** 1.0
**Status:** Ready to Execute
