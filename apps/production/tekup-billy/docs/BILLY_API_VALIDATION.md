# 🔍 Billy.dk API Validation Checklist

**Date:** October 14, 2025  
**Purpose:** Verify Billy.dk API capabilities before v1.3.0 implementation  
**Priority:** CRITICAL - Must complete before Week 1 starts  

---

## ⚠️ **CRITICAL VALIDATION ITEMS**

### **1. Webhook Support Verification** 🔴 HIGH PRIORITY

**Question:** Does Billy.dk support webhooks for real-time event notifications?

**How to Test:**

```bash
# Test 1: Check if webhooks endpoint exists
curl -X GET "https://www.billy.dk/api/v2/webhooks" \
  -H "X-Access-Token: YOUR_API_KEY" \
  -H "Content-Type: application/json"

# Expected Response if supported:
# 200 OK with list of webhooks
# OR 200 OK with empty array []

# Expected Response if NOT supported:
# 404 Not Found
```

**Test Results:**
- [ ] Webhooks endpoint exists: YES / NO
- [ ] Can list webhooks: YES / NO
- [ ] Can create webhook: YES / NO
- [ ] Supported events: _____________

**Decision Matrix:**
- ✅ **If YES:** Implement full webhook system (Week 1-2)
- ❌ **If NO:** Implement polling-based sync (Week 1, 1 day)

---

### **2. New Endpoint Verification** 🟡 MEDIUM PRIORITY

**Test each planned endpoint:**

#### **A. Bank Payments** (`/v2/bankPayments`)

```bash
curl -X GET "https://www.billy.dk/api/v2/bankPayments?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO
- [ ] Documentation available: YES / NO

---

#### **B. Files** (`/v2/files`)

```bash
curl -X GET "https://www.billy.dk/api/v2/files?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Supports file upload: YES / NO
- [ ] Max file size: _____ MB

---

#### **C. Bills** (`/v2/bills`)

```bash
curl -X GET "https://www.billy.dk/api/v2/bills?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO

---

#### **D. Organizations** (`/v2/organizations`)

```bash
curl -X GET "https://www.billy.dk/api/v2/organizations/YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Can update settings: YES / NO

---

#### **E. Contact Persons** (`/v2/contactPersons`)

```bash
curl -X GET "https://www.billy.dk/api/v2/contactPersons?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO

---

#### **F. Recurring Invoices** (`/v2/recurringInvoices`)

```bash
curl -X GET "https://www.billy.dk/api/v2/recurringInvoices?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO

---

#### **G. Reports** (`/v2/reports`)

```bash
curl -X GET "https://www.billy.dk/api/v2/reports?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Available report types: ___________

---

#### **H. VAT Reports** (`/v2/vatReports`)

```bash
curl -X GET "https://www.billy.dk/api/v2/vatReports?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO

---

#### **I. Time Entries** (`/v2/timeEntries`) ⚠️ UNCONFIRMED

```bash
curl -X GET "https://www.billy.dk/api/v2/timeEntries?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO
- [ ] **Defer to v1.4 if NO**

---

#### **J. Projects** (`/v2/projects`) ⚠️ UNCONFIRMED

```bash
curl -X GET "https://www.billy.dk/api/v2/projects?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO
- [ ] **Defer to v1.4 if NO**

---

#### **K. Categories** (`/v2/categories`) ⚠️ UNCONFIRMED

```bash
curl -X GET "https://www.billy.dk/api/v2/categories?organizationId=YOUR_ORG_ID" \
  -H "X-Access-Token: YOUR_API_KEY"
```

- [ ] Endpoint exists: YES / NO
- [ ] Returns data: YES / NO
- [ ] **Defer to v1.4 if NO**

---

### **3. API Rate Limits** 🟢 LOW PRIORITY

**Test rate limit behavior:**

```bash
# Send 20 rapid requests
for i in {1..20}; do
  curl -X GET "https://www.billy.dk/api/v2/customers?organizationId=YOUR_ORG_ID" \
    -H "X-Access-Token: YOUR_API_KEY" &
done
```

**Questions:**
- [ ] Rate limit exists: YES / NO
- [ ] Limit per minute: _____
- [ ] Limit per hour: _____
- [ ] Rate limit header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`?
- [ ] Retry-After header on 429: YES / NO

**Findings:**

```
Current rate limit understanding:
- Per minute: _____ requests
- Per hour: _____ requests
- Response header: _____
```

---

### **4. Webhook Event Types** (If webhooks supported)

**Test webhook creation:**

```bash
# Create test webhook
curl -X POST "https://www.billy.dk/api/v2/webhooks" \
  -H "X-Access-Token: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/webhook/billy",
    "events": ["*"]
  }'
```

**Document supported events:**
- [ ] `invoice.created`
- [ ] `invoice.updated`
- [ ] `invoice.sent`
- [ ] `invoice.paid`
- [ ] `invoice.overdue`
- [ ] `invoice.cancelled`
- [ ] `customer.created`
- [ ] `customer.updated`
- [ ] `customer.deleted`
- [ ] `product.created`
- [ ] `product.updated`
- [ ] `product.deleted`
- [ ] `contact.created`
- [ ] `contact.updated`
- [ ] `contact.deleted`
- [ ] Other: ___________

**Webhook Signature:**
- [ ] Signature algorithm: HMAC-SHA256 / Other: _____
- [ ] Signature header name: _____
- [ ] Secret key location: _____

---

## 📊 **VALIDATION SUMMARY**

### **Endpoint Verification Matrix:**

| Endpoint | Exists | Priority | Include in v1.3.0 |
|----------|--------|----------|-------------------|
| `/v2/bankPayments` | ☐ YES ☐ NO | P0 | ☐ YES ☐ DEFER |
| `/v2/files` | ☐ YES ☐ NO | P0 | ☐ YES ☐ DEFER |
| `/v2/bills` | ☐ YES ☐ NO | P1 | ☐ YES ☐ DEFER |
| `/v2/organizations` | ☐ YES ☐ NO | P1 | ☐ YES ☐ DEFER |
| `/v2/contactPersons` | ☐ YES ☐ NO | P1 | ☐ YES ☐ DEFER |
| `/v2/recurringInvoices` | ☐ YES ☐ NO | P1 | ☐ YES ☐ DEFER |
| `/v2/reports` | ☐ YES ☐ NO | P2 | ☐ YES ☐ DEFER |
| `/v2/vatReports` | ☐ YES ☐ NO | P2 | ☐ YES ☐ DEFER |
| `/v2/timeEntries` | ☐ YES ☐ NO | P3 | ☐ DEFER |
| `/v2/projects` | ☐ YES ☐ NO | P3 | ☐ DEFER |
| `/v2/categories` | ☐ YES ☐ NO | P3 | ☐ DEFER |

**Confirmed Endpoints:** _**/ 11  
**P0/P1 Endpoints:****_ / 6  
**Ready for v1.3.0:** YES / NO  

---

## 🚀 **INFRASTRUCTURE SETUP**

### **Redis Setup:**

- [ ] Redis Cloud account created
- [ ] Connection string obtained
- [ ] Tested locally: `redis-cli -u YOUR_REDIS_URL ping`
- [ ] Environment variable configured: `REDIS_URL`

**Redis Connection String:**

```
redis://default:PASSWORD@HOST:PORT
```

### **Environment Variables:**

- [ ] `BILLY_API_KEY` - Billy.dk API key
- [ ] `BILLY_ORGANIZATION_ID` - Test organization ID
- [ ] `BILLY_WEBHOOK_SECRET` - Webhook signing secret (if applicable)
- [ ] `REDIS_URL` - Redis connection string
- [ ] `SUPABASE_URL` - Already configured
- [ ] `SUPABASE_SERVICE_KEY` - Already configured

---

## ✅ **VALIDATION COMPLETION CRITERIA**

**Ready to start Week 1 implementation when:**
- [x] Schema migration file created (002_v1.3.0_schema_additions.sql) ✅
- [ ] At least 4 P0/P1 endpoints confirmed working
- [ ] Webhook support verified (YES or NO decision made)
- [ ] Redis infrastructure setup complete
- [ ] Rate limits documented
- [ ] All environment variables configured

**Estimated Time:** 2-3 days (Oct 14-17, 2025)

---

## 📝 **TEST SCRIPT**

Save this as `validate-billy-api.sh`:

```bash
#!/bin/bash

# Billy.dk API Validation Script
# Usage: ./validate-billy-api.sh

API_KEY="${BILLY_API_KEY}"
ORG_ID="${BILLY_ORGANIZATION_ID}"
BASE_URL="https://www.billy.dk/api/v2"

echo "🔍 Validating Billy.dk API Endpoints..."
echo ""

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local name=$2
  
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "${BASE_URL}${endpoint}?organizationId=${ORG_ID}" \
    -H "X-Access-Token: ${API_KEY}")
  
  if [ "$response" = "200" ]; then
    echo "✅ ${name}: SUCCESS (200)"
  elif [ "$response" = "404" ]; then
    echo "❌ ${name}: NOT FOUND (404)"
  else
    echo "⚠️  ${name}: UNKNOWN (${response})"
  fi
}

# Test each endpoint
test_endpoint "/bankPayments" "Bank Payments"
test_endpoint "/files" "Files"
test_endpoint "/bills" "Bills"
test_endpoint "/organizations/${ORG_ID}" "Organizations"
test_endpoint "/contactPersons" "Contact Persons"
test_endpoint "/recurringInvoices" "Recurring Invoices"
test_endpoint "/reports" "Reports"
test_endpoint "/vatReports" "VAT Reports"
test_endpoint "/timeEntries" "Time Entries"
test_endpoint "/projects" "Projects"
test_endpoint "/categories" "Categories"

echo ""
echo "Testing webhooks..."
webhook_response=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "${BASE_URL}/webhooks" \
  -H "X-Access-Token: ${API_KEY}")

if [ "$webhook_response" = "200" ]; then
  echo "✅ Webhooks: SUPPORTED"
else
  echo "❌ Webhooks: NOT SUPPORTED"
fi

echo ""
echo "✅ Validation complete!"
```

---

**Next Steps:**
1. Run validation script
2. Document results in this file
3. Update v1.3.0_REVISED_PRIORITIES.md based on findings
4. Proceed to Week 1 implementation

---

**Validation Status:** ⏳ PENDING  
**Validated By:** _____________  
**Date Completed:** _____________  
**Approved to Start:** YES / NO
