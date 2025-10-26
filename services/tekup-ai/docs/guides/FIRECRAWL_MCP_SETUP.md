# 🔥 Firecrawl MCP Setup Guide

**Dato:** 7. oktober 2025  
**Purpose:** Tilføj web scraping til GitHub Copilot for automatisk lead detection

---

## 🎯 Hvad er Firecrawl MCP?

**Official MCP server** fra Firecrawl.dev der giver web scraping capabilities til AI assistants.

**Use Cases for RenOS:**
- ✅ Scrape Leadmail.no emails automatisk
- ✅ Extract lead data fra company websites
- ✅ Monitor konkurrent services
- ✅ Convert messy HTML til struktureret data

---

## 🚀 Quick Setup (5 minutter)

### Step 1: Get API Key

1. **Gå til:** <https://firecrawl.dev>
2. **Sign up** (gratis tier inkluderet):
   - 500 credits/måned gratis
   - Perfect til testing
3. **Dashboard → API Keys**
4. **Create New Key**
5. **Copy API key** (gem i password manager!)

---

### Step 2: Add to MCP Config

**Location:** `C:\Users\empir\AppData\Roaming\Code\User\mcp.json`

**Add this to `servers` section:**

```json
{
  "servers": {
    "upstash/context7": { /* existing */ },
    "microsoft/playwright-mcp": { /* existing */ },
    "render": { /* existing */ },
    
    "firecrawl": {
      "command": "npx",
      "args": [
        "-y",
        "firecrawl-mcp"
      ],
      "env": {
        "FIRECRAWL_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Note:** Package name is `firecrawl-mcp` (not `@mendable/firecrawl-mcp`).

**Replace `YOUR_API_KEY_HERE`** med din faktiske API key!

---

### Step 3: Reload VS Code

```
Ctrl+Shift+P > "Developer: Reload Window"
```

---

### Step 4: Test i Copilot Chat

```
> Scrape this website: https://rendetalje.dk
> Extract all text from https://leadmail.no/latest
> Get company information from https://competitor.dk
```

---

## 🎨 Example Use Cases

### 1. Lead Detection fra Leadmail.no

**Before (Manual):**
```typescript
// src/services/leadmailParser.ts
const html = await fetchEmail(messageId);
const parsed = parseLeadmailHtml(html);
const lead = extractLeadData(parsed);
```

**After (Natural Language):**
```
I Copilot Chat:
> "Scrape latest leads from Leadmail.no inbox and extract: name, email, phone, service requested, square meters"
```

---

### 2. Competitor Research

**Before:** Manual Google search + copy-paste

**After:**
```
> "Scrape all service pages from molly.dk and extract: service names, prices, service areas"
> "Compare our pricing with competitors: renova.dk, molly.dk, hjemme.dk"
```

---

### 3. Company Information Enrichment

**Before:** Manual research for each lead

**After:**
```
> "For lead email 'info@johansen-entreprise.dk', scrape their website and extract: company size, services offered, office locations"
```

---

## 📊 Pricing

### Free Tier (Included)
- 500 credits/month
- Perfect for testing og development
- ~500 page scrapes

### Paid Plans (Hvis nødvendigt)
- Starter: $20/month (5,000 credits)
- Growth: $100/month (50,000 credits)
- Enterprise: Custom pricing

**RenOS Usage Estimate:**
- ~50 lead emails/måned × 1 credit = 50 credits
- Competitor research: ~20 pages/måned = 20 credits
- Total: ~100 credits/måned → **Free tier er nok!**

---

## 🔧 Advanced Features

### 1. Structured Data Extraction

**Firecrawl kan returnere JSON:**
```
> "Scrape https://leadmail.no/email/123 and return JSON with keys: customer_name, phone, email, service_type, square_meters"
```

**Output:**
```json
{
  "customer_name": "Lars Hansen",
  "phone": "+45 12 34 56 78",
  "email": "lars@example.com",
  "service_type": "window_cleaning",
  "square_meters": 120
}
```

---

### 2. Batch Scraping

**Scrape multiple pages:**
```
> "Scrape all these URLs and extract company names:
   - https://company1.dk
   - https://company2.dk
   - https://company3.dk"
```

---

### 3. Screenshot + Text

**Get both visual and text:**
```
> "Scrape https://competitor.dk/pricing and take screenshot + extract all text"
```

---

## 🛡️ Security Notes

### API Key Storage

**ALDRIG commit API key til Git!**

✅ **Gem i:**
- Password manager (1Password, LastPass)
- mcp.json (lokalt, ikke committed)

❌ **IKKE her:**
- .env fil (hvis committed)
- Source code
- Slack/email

### Rate Limiting

Firecrawl har rate limits:
- Free tier: 10 requests/min
- Paid: 100 requests/min

**For RenOS:** Gratis tier er mere end nok!

---

## 🔄 Integration with RenOS

### Potential Automation

**1. Lead Email Processor:**
```typescript
// src/agents/handlers/leadEmailHandler.ts
async function processLeadEmail(gmailMessageId: string) {
    // Step 1: Fetch email fra Gmail
    const email = await gmailService.getMessage(gmailMessageId);
    
    // Step 2: Use Firecrawl MCP via Copilot
    // Natural language: "Extract lead data from this email HTML"
    const leadData = await firecrawlExtract(email.body);
    
    // Step 3: Create lead in database
    await createLead(leadData);
}
```

**2. Competitor Monitor:**
```typescript
// src/tools/competitorMonitor.ts
async function monitorCompetitors() {
    const competitors = ['renova.dk', 'molly.dk', 'hjemme.dk'];
    
    for (const url of competitors) {
        // Use Firecrawl MCP: "Scrape pricing page"
        const pricing = await firecrawlScrape(`https://${url}/priser`);
        
        // Analyze and alert if changes
        await comparePricing(url, pricing);
    }
}
```

---

## 🎯 Next Steps

### Immediate
1. **Get API key** fra firecrawl.dev
2. **Add to mcp.json** (see Step 2 above)
3. **Reload VS Code**
4. **Test** scraping med Copilot Chat

### This Week
5. **Integrate** med lead detection workflow
6. **Setup** competitor monitoring
7. **Document** common scraping patterns

### Next Week
8. **Build** automated lead processor
9. **Add** company enrichment
10. **Monitor** credit usage

---

## 📚 Resources

- **Website:** <https://firecrawl.dev>
- **Docs:** <https://docs.firecrawl.dev>
- **MCP Docs:** <https://docs.firecrawl.dev/mcp>
- **API Reference:** <https://docs.firecrawl.dev/api-reference>
- **Pricing:** <https://firecrawl.dev/pricing>

---

## 🎉 Summary

**Firecrawl MCP giver:**
- ✅ Natural language web scraping
- ✅ Structured data extraction
- ✅ No more manual HTML parsing
- ✅ Perfect til lead automation

**Setup:**
1. Get API key (2 min)
2. Add to mcp.json (1 min)
3. Reload VS Code (10 sec)
4. Start scraping! 🚀

**Impact på RenOS:**
- Automatic lead detection
- Competitor intelligence
- Company enrichment
- All via natural language in Copilot! 💪
