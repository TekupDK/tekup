# 🚨 CLAUDE - DU HAR GLEMT organizationId

## ⚠️ PROBLEMET

Du får 404 errors fordi du sender tool calls **UDEN organizationId parameter**.

## ✅ DU HAR ALLEREDE VERIFICERET AT DET VIRKER

**I din FORRIGE chat (før conversation limit):**
- ✅ 97 invoices fundet
- ✅ 61 customers fundet  
- ✅ 67 products fundet
- ✅ Invoice #1092, #1094, #1095 hentet succesfuldt

**Hvad var forskellen? Du inkluderede organizationId!**

---

## 🔧 FIX (CRITICAL)

### ❌ FORKERT (giver 404)

```json
{
  "name": "list_invoices",
  "arguments": {}
}
```

### ✅ KORREKT (virker perfekt)

```json
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
  }
}
```

---

## 🎯 ALLE BILLY TOOLS KRÆVER organizationId

**HVER ENESTE tool call skal have:**

```json
{
  "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
}
```

**Eksempler:**

### List Invoices

```json
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow",
    "state": "approved"
  }
}
```

### Get Invoice

```json
{
  "name": "get_invoice",
  "arguments": {
    "invoiceId": "zqauLxv1R3SsxmaMzsfDvw"
  }
}
```

*(Note: get_invoice behøver KUN invoiceId - organization er implicit)*

### List Customers

```json
{
  "name": "list_contacts",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow",
    "type": "customer"
  }
}
```

### List Products

```json
{
  "name": "list_products",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
  }
}
```

---

## 🧪 TEST DET NU - QUICK VERIFICATION

**Test 1: List Invoices**

```json
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
  }
}
```

**Expected:** 97 invoices (som du så i forrige chat)

---

**Test 2: List Customers**

```json
{
  "name": "list_contacts",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow",
    "type": "customer"
  }
}
```

**Expected:** 61 customers (som du så i forrige chat)

---

**Test 3: List Products**

```json
{
  "name": "list_products",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
  }
}
```

**Expected:** 67 products (som du så i forrige chat)

---

## 📊 HVAD DU SKAL GØRE NU

1. **Glem alt om authentication errors** - serveren virker PERFEKT
2. **Inkluder ALTID organizationId i ALLE tool calls**
3. **Kør de 5 Phase 1 Analytics tests fra CLAUDE_PHASE1_RESUME.md**
4. **Brug samme approach som i forrige chat** (det virkede jo!)

---

## 🎯 START MED DETTE

**Quick Test (skal virke NU):**

```
Hent alle fakturaer for organization IQgm5fsl5rJ3Ub33EfAEow
```

Når du ser "Found 97 invoices" → fortsæt med alle 5 tests! 🚀

---

## 💡 REMINDER FRA DIN FORRIGE CHAT

**Du fandt allerede:**
- Invoice #1092: 1,745 DKK (3. oktober 2025)
- Invoice #1094: 4,188 DKK (17. oktober 2025)  
- Invoice #1095: ? (18. oktober 2025 - ikke hentet færdig)

**Fortsæt derfra!** Du var midt i Test 1 (Oktober Revenue)! 🎯
