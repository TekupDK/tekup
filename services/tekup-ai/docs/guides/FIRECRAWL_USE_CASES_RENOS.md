# 🔥 Firecrawl Use Cases for RenOS - Konkrete Eksempler

**Dato:** 7. oktober 2025  
**Formål:** Forklare præcis hvordan Firecrawl automatiserer RenOS workflows

---

## 🎯 Hovedformål: Automatiser Alt Web Scraping

**Før Firecrawl:**
```typescript
// Manual HTML parsing - brud konstant!
const html = await fetch(url);
const $ = cheerio.load(html);
const data = $('.some-class').text(); // Breaks når HTML ændres
```

**Med Firecrawl:**
```
I Copilot Chat:
> "Scrape website and extract contact info"
```

**Resultat:** Clean markdown/JSON output, intet manual parsing!

---

## 💼 RenOS Use Case #1: Lead Email Parsing

### Problem Nu
RenOS modtager leads fra **Leadmail.no** som emails med HTML indhold:

```
Fra: Leadmail.no
Emne: Ny lead - Vinduespolering København
Body: <html>
  <div class="lead-info">
    <p>Navn: Lars Hansen</p>
    <p>Email: lars@example.com</p>
    <p>Telefon: +45 12 34 56 78</p>
    <p>Service: Vinduespolering</p>
    <p>Kvm: 120 m²</p>
  </div>
</html>
```

**Nuværende løsning:**
```typescript
// src/services/leadmailParser.ts
function parseLeadmailEmail(html: string): LeadData {
    // Regex hell eller Cheerio parsing
    const nameMatch = html.match(/Navn: (.+?)</);
    const emailMatch = html.match(/Email: (.+?)</);
    // ... breaks ofte når Leadmail.no ændrer HTML struktur
}
```

**Problem:**
- ❌ Fragile - breaks ved HTML ændringer
- ❌ Svært at maintain
- ❌ Kan ikke håndtere variations i format

---

### Løsning med Firecrawl

**Via Copilot Chat:**
```
Parse this Leadmail.no email HTML and extract structured data:
{html content}

Return JSON with:
- customer_name
- email
- phone
- service_type
- square_meters
- address (if present)
```

**Firecrawl Output:**
```json
{
  "customer_name": "Lars Hansen",
  "email": "lars@example.com",
  "phone": "+45 12 34 56 78",
  "service_type": "Vinduespolering",
  "square_meters": 120,
  "address": null
}
```

**Integration i RenOS:**
```typescript
// src/agents/handlers/leadEmailHandler.ts
async function processLeadEmail(gmailMessageId: string) {
    // 1. Fetch email from Gmail
    const email = await gmailService.getMessage(gmailMessageId);
    
    // 2. Use Firecrawl via Copilot/API
    const leadData = await firecrawlExtract(email.body, {
        schema: {
            customer_name: "string",
            email: "string",
            phone: "string",
            service_type: "string",
            square_meters: "number"
        }
    });
    
    // 3. Create lead in database
    await prisma.lead.create({
        data: {
            name: leadData.customer_name,
            email: leadData.email,
            phone: leadData.phone,
            serviceType: leadData.service_type,
            squareMeters: leadData.square_meters,
            source: "leadmail"
        }
    });
}
```

**Impact:**
- ✅ Robust - håndterer HTML ændringer
- ✅ Automatic structured data extraction
- ✅ No manual parsing maintenance

---

## 🔍 RenOS Use Case #2: Competitor Price Monitoring

### Problem
RenOS skal monitore konkurrent priser for at være competitive:

**Konkurrenter:**
- Molly.dk
- Renova.dk
- Hjemme.dk
- ISS.dk

**Nuværende løsning:**
- ❌ Manuel check af websites
- ❌ Copy-paste til Excel
- ❌ Tidskrævende (30+ min/uge)

---

### Løsning med Firecrawl

**Via Copilot Chat:**
```
Scrape pricing pages from these competitors and extract service prices:
1. https://molly.dk/priser
2. https://renova.dk/priser
3. https://hjemme.dk/priser

For each, extract:
- Service name
- Price per hour
- Minimum hours
- Extra fees
```

**Firecrawl Output:**
```json
{
  "molly": {
    "standard_cleaning": {
      "price_per_hour": 375,
      "minimum_hours": 3,
      "extra_fees": ["Parkering: 50 kr"]
    },
    "window_cleaning": {
      "price_per_hour": 425,
      "minimum_hours": 2
    }
  },
  "renova": {
    "standard_cleaning": {
      "price_per_hour": 350,
      "minimum_hours": 4
    }
  }
}
```

**Automation (Cron Job):**
```typescript
// src/tools/competitorMonitor.ts
async function monitorCompetitors() {
    const competitors = [
        { name: 'Molly', url: 'https://molly.dk/priser' },
        { name: 'Renova', url: 'https://renova.dk/priser' },
        { name: 'Hjemme', url: 'https://hjemme.dk/priser' }
    ];
    
    for (const competitor of competitors) {
        // Use Firecrawl to scrape
        const pricing = await firecrawlScrape(competitor.url);
        
        // Store in database
        await prisma.competitorPricing.create({
            data: {
                competitor: competitor.name,
                pricing: pricing,
                scrapedAt: new Date()
            }
        });
        
        // Alert if price changed
        const previous = await prisma.competitorPricing.findFirst({
            where: { competitor: competitor.name },
            orderBy: { scrapedAt: 'desc' },
            skip: 1
        });
        
        if (previous && hasSignificantChange(previous.pricing, pricing)) {
            await sendAlert(`${competitor.name} changed pricing!`);
        }
    }
}

// Run weekly
cron.schedule('0 9 * * 1', monitorCompetitors); // Every Monday 9am
```

**Impact:**
- ✅ Automatic weekly monitoring
- ✅ Alert on price changes
- ✅ Data-driven pricing decisions
- ✅ Save 30+ min/week

---

## 🏢 RenOS Use Case #3: Company Enrichment

### Problem
Når et lead kommer ind, RenOS ved kun email/navn:

```
Lead: info@firma-abc.dk
Name: Unknown company
```

**Nuværende løsning:**
- ❌ Manuel Google search
- ❌ Manual website check
- ❌ Tidskrævende (5-10 min per lead)

---

### Løsning med Firecrawl

**Via Copilot Chat:**
```
For email domain: firma-abc.dk
1. Find company website
2. Scrape and extract:
   - Company name
   - Industry/services
   - Company size (if mentioned)
   - Office locations
   - Contact info
```

**Firecrawl Output:**
```json
{
  "company_name": "ABC Entreprise ApS",
  "industry": "Byggeri og renovation",
  "services": [
    "Byggeprojekter",
    "Renovering",
    "Vedligeholdelse"
  ],
  "employees": "25-50",
  "locations": ["København", "Aarhus"],
  "phone": "+45 33 12 34 56",
  "website": "https://firma-abc.dk"
}
```

**Integration:**
```typescript
// src/agents/handlers/leadEnrichmentHandler.ts
async function enrichLead(leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    
    if (!lead.email) return;
    
    // Extract domain from email
    const domain = lead.email.split('@')[1];
    
    // Use Firecrawl to scrape company website
    const companyInfo = await firecrawlExtract(`https://${domain}`, {
        schema: {
            company_name: "string",
            industry: "string",
            services: "array",
            employees: "string",
            locations: "array"
        }
    });
    
    // Update lead with enriched data
    await prisma.lead.update({
        where: { id: leadId },
        data: {
            companyName: companyInfo.company_name,
            industry: companyInfo.industry,
            estimatedSize: companyInfo.employees,
            notes: `Services: ${companyInfo.services.join(', ')}`
        }
    });
    
    // Calculate potential value
    const potentialValue = estimatePotentialValue(companyInfo);
    
    // Prioritize high-value leads
    if (potentialValue > 10000) {
        await notifyHighValueLead(lead, companyInfo);
    }
}
```

**Impact:**
- ✅ Automatic company research
- ✅ Better lead qualification
- ✅ Prioritize high-value leads
- ✅ Save 5-10 min per lead

---

## 📊 RenOS Use Case #4: Market Intelligence

### Problem
RenOS vil forstå markedet bedre:
- Hvilke services er populære?
- Hvad markedsfører konkurrenter?
- Nye trends i branchen?

---

### Løsning med Firecrawl

**Monthly Market Scan:**
```
Scrape these competitor websites and extract:
1. Main services offered (homepage)
2. New services launched (blog/news)
3. Special offers/discounts
4. Customer testimonials/reviews

Competitors:
- molly.dk
- renova.dk
- hjemme.dk
- iss.dk
```

**Analysis:**
```typescript
// src/tools/marketIntelligence.ts
async function analyzeMarket() {
    const competitors = [...];
    
    const insights = await Promise.all(
        competitors.map(async (comp) => {
            const homepage = await firecrawlScrape(comp.url);
            const services = extractServices(homepage);
            const offers = extractOffers(homepage);
            
            return {
                competitor: comp.name,
                services,
                offers,
                scrapedAt: new Date()
            };
        })
    );
    
    // Aggregate insights
    const popularServices = findMostOfferedServices(insights);
    const pricingTrends = analyzePricingTrends(insights);
    
    // Generate report
    await generateMarketReport({
        popularServices,
        pricingTrends,
        recommendations: generateRecommendations(insights)
    });
}

// Run monthly
cron.schedule('0 9 1 * *', analyzeMarket); // 1st of each month
```

**Impact:**
- ✅ Data-driven business decisions
- ✅ Spot market trends early
- ✅ Competitive advantage
- ✅ Strategic service planning

---

## 🤖 RenOS Use Case #5: Automated Content Generation

### Problem
RenOS skal opdatere website content baseret på:
- Competitor analysis
- Service descriptions
- SEO optimization

---

### Løsning med Firecrawl + Gemini

**Workflow:**
```typescript
// 1. Scrape top 3 competitors
const competitorContent = await Promise.all([
    firecrawlScrape('https://molly.dk/services/kontor-rengoring'),
    firecrawlScrape('https://renova.dk/erhverv'),
    firecrawlScrape('https://hjemme.dk/kontorrengoring')
]);

// 2. Analyze with Gemini
const analysis = await gemini.completeChat([
    {
        role: "system",
        content: "Analyze competitor content and suggest improvements for our service page"
    },
    {
        role: "user",
        content: `
            Competitors content:
            ${competitorContent.map(c => c.markdown).join('\n---\n')}
            
            Our current content:
            ${ourCurrentContent}
            
            Suggest:
            1. Missing selling points
            2. Better service descriptions
            3. SEO improvements
        `
    }
]);

// 3. Generate improved content
const improvedContent = await gemini.completeChat([
    {
        role: "user",
        content: `Write improved service page based on analysis: ${analysis}`
    }
]);
```

**Impact:**
- ✅ Always competitive content
- ✅ SEO optimized
- ✅ Save content writing time

---

## 📈 ROI Beregning

### Time Savings per Month

| Task | Time Before | Time After | Savings |
|------|-------------|------------|---------|
| Lead email parsing | 2 hours | 0 hours | **2 hours** |
| Competitor monitoring | 2 hours | 15 min | **1.75 hours** |
| Company research | 10 hours | 1 hour | **9 hours** |
| Market analysis | 4 hours | 30 min | **3.5 hours** |
| **TOTAL** | **18 hours** | **2.25 hours** | **15.75 hours/month** |

### Cost-Benefit

**Firecrawl Cost:**
- Free tier: 500 credits/month = 0 kr
- Paid tier (if needed): $20/month = ~150 kr

**Value of Time Saved:**
- 15.75 hours × 500 kr/hour = **7,875 kr/month**

**ROI:** 7,875 kr saved vs. 0-150 kr cost = **5,250% ROI** 🚀

---

## 🎯 Implementation Priority

### Phase 1: Quick Wins (This Week)
1. **Lead Email Parsing** - Immediate impact, high value
2. **Manual testing** via Copilot Chat

### Phase 2: Automation (Next Week)
3. **Competitor Monitoring** - Cron job
4. **Company Enrichment** - Automatic on new leads

### Phase 3: Advanced (Next Month)
5. **Market Intelligence** - Monthly reports
6. **Content Generation** - Quarterly updates

---

## 🛠️ Technical Integration

### Option 1: Via Copilot Chat (Manual)
**Use now for ad-hoc scraping:**
```
> "Scrape molly.dk/priser and extract pricing"
> "Get company info from firma-abc.dk"
```

### Option 2: Via Firecrawl API (Automated)
**Build into RenOS handlers:**
```typescript
// src/services/firecrawlService.ts
export class FirecrawlService {
    private apiKey = process.env.FIRECRAWL_API_KEY;
    
    async scrape(url: string, format: 'markdown' | 'json' = 'markdown') {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, formats: [format] })
        });
        
        return response.json();
    }
    
    async extract(url: string, schema: any) {
        // Use Firecrawl Extract endpoint for structured data
    }
}
```

---

## 🎉 Konklusion

**Firecrawl giver RenOS:**
- ✅ Automatic lead data extraction
- ✅ Competitive intelligence
- ✅ Company enrichment
- ✅ Market insights
- ✅ 15.75 hours saved per month
- ✅ 5,250% ROI

**Start nu:**
1. Test via Copilot Chat (manual)
2. Build API integration (automated)
3. Set up cron jobs (scheduled)

**Resultat:** RenOS bliver data-driven og automation-first! 🚀
