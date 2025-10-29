# 📋 Billy MCP - Daily Operations Guide

**Version:** 1.0  
**Last Updated:** 21. oktober 2025  
**Purpose:** Step-by-step guide til daglig brug af Billy.dk med AI-assistance

---

## 🎯 Hvornår Skal Du Bruge Denne Guide?

**Brug denne guide når du skal:**
- ✅ Godkende og sende draft fakturaer
- ✅ Oprette nye fakturaer
- ✅ Følge op på ubetalte fakturaer
- ✅ Vedligeholde produktkatalog
- ✅ Analysere business performance
- ✅ Rydde op i systemet

---

## 🚨 DAGLIG ROUTINE (5-10 minutter hver morgen)

### Morning Checklist

**1. Check Draft Fakturaer** (2 min)

```
Billy.dk → Fakturaer → Kladder

For hver draft:
- Review beløb og detaljer
- Godkend hvis klar
- Slet hvis forkert/duplikat
```

**2. Check Ubetalte Fakturaer** (3 min)

```
Billy.dk → Fakturaer → Ubetalte

For fakturaer der forfalder inden for 3 dage:
- Send venlig reminder
- Mark i kalender hvis over 30 dage

For fakturaer over 30 dage:
- Send 2nd reminder (mere direkte)
- Overvej telefonopkald
```

**3. Quick Performance Check** (2 min)

```
Billy.dk → Rapporter → Oversigt

Check:
- Dagens indbetalinger
- Denne uges omsætning
- Outstanding balance
```

**4. Inbox Check** (3 min)

```
Email → Billy notifications

Handle:
- Payment confirmations
- Customer responses
- System alerts
```

---

## 📝 OPRET NY FAKTURA (5-10 minutter)

### Standard Workflow

**Step 1: Vælg Kunde** (1 min)

```
Billy.dk → Fakturaer → Ny Faktura
1. Søg kunde (eller opret ny hvis første gang)
2. Verify kunde detaljer korrekte
3. Check tidligere fakturaer hvis nødvendigt
```

**Step 2: Tilføj Produkter** (3 min)

```
Brug ALTID standardprodukter:
- REN-001: Fast Rengøring (349 DKK/time)
- REN-002: Hovedrengøring (399 DKK/time)
- REN-003: Flytterengøring (349 DKK/time)
- REN-004: Erhvervsrengøring (325 DKK/time)
- REN-005: Specialrengøring (349 DKK/time)
- REN-006: Airbnb Rengøring (349 DKK/time)
- REN-007: Vinduespudsning (450 DKK/time)

VIGTIGT:
- Brug beskrivelsesfeltet til kunde-specifikke detaljer
- Opret IKKE nye produkter uden godkendelse
- Standard priser medmindre aftalt anderledes
```

**Step 3: Tilføj Detaljer** (2 min)

```
I beskrivelsesfeltet:
- Adresse hvor arbejdet blev udført
- Dato og klokkeslæt for arbejdet
- Antal personer
- Specielle opgaver udført
- Noter om kvalitet/problemer

Eksempel:
"Flytterengøring - Tendrup Møllevej 103, 8543 Hornslet

Udført 17-18. oktober 2025
2 medarbejdere × 9 timer = 18 arbejdstimer
(Faktureret 15 timer efter aftale)

Omfattede: Alle rum, køkken, bad, vinduer"
```

**Step 4: Set Betalingsbetingelser** (1 min)

```
Standard: 14 dage netto
Kendte kunder: Kan være 30 dage
Nye kunder: 7 dage eller forudbetaling
```

**Step 5: Godkend og Send** (1 min)

```
1. Review alt én gang mere
2. Klik "Godkend og send"
3. Verify email sendt
4. Note fakturanummer til egen records
```

---

## 🔍 MÅNEDLIG ANALYTICS (30 minutter - 1. i måneden)

### Brug Claude/ChatGPT med Billy MCP

**Prompt Template:**

```
Run Billy MCP Phase 1 Analytics for [MÅNED ÅR]:

1. Total revenue for måneden
   - Breakdown by product type
   - Compare with previous month

2. Top 5 customers by revenue
   - Which customers grew/shrank?
   - Any new large customers?

3. Product performance
   - Which products sold best?
   - Any unused products to archive?

4. Payment status
   - How many invoices overdue?
   - Average days to payment?
   - Any concerning trends?

5. Draft invoices
   - Any old drafts to clean up?
   - Total potential revenue waiting?

Return structured markdown report.

Organization ID: IQgm5fsl5rJ3Ub33EfAEow
```

**Hvad du gør med resultaterne:**

```
1. Save report: reports/YYYY-MM-analytics.md
2. Identify actionable items:
   - Products to archive?
   - Customers to follow up with?
   - Pricing adjustments needed?
3. Share relevant insights with team
4. Track month-over-month trends
```

---

## 📦 PRODUKTVEDLIGEHOLDELSE (15 min - kvartalsvis)

### Quarterly Product Review

**Step 1: Check Product Count** (2 min)

```
Billy.dk → Indstillinger → Produkter

Count:
- Active products: Should be 10-15 max
- Inactive products: OK to have many (historical)

If active > 15: Time for cleanup!
```

**Step 2: Run Usage Analysis** (5 min)

```
Prompt til Claude/ChatGPT:

"Analyze Billy products. For each active product:
- Usage count (last 90 days)
- Revenue generated (last 90 days)  
- Recommendation: Keep or Archive

Organization ID: IQgm5fsl5rJ3Ub33EfAEow"
```

**Step 3: Archive Unused** (5 min)

```
For products with:
- 0 usage in 90 days
- Low revenue (<1,000 DKK/quarter)
- Customer-specific names

Action: Mark as inactive (don't delete!)
```

**Step 4: Update Documentation** (3 min)

```
Update quick reference if prices changed
Update team if new products added
Remove archived products from shortcuts
```

---

## 💰 BETALINGSPÅMINDELSER (Automatisk workflow)

### Week 1: Pre-reminder (7 dage før forfaldsdag)

```
Til: [Kunde]
Emne: Venlig påmindelse - Faktura #[XXXX] forfalder snart

Hej [Kundenavn],

Dette er blot en venlig påmindelse om at faktura #[XXXX] 
på [BELØB] DKK forfalder d. [DATO].

Hvis du allerede har betalt, bedes du se bort fra denne mail.

Med venlig hilsen,
[Dit navn]
```

### Week 2: Payment due (på forfaldsdagen)

```
Til: [Kunde]
Emne: Faktura #[XXXX] forfalder i dag

Hej [Kundenavn],

Faktura #[XXXX] på [BELØB] DKK forfalder i dag d. [DATO].

Hvis du har spørgsmål eller brug for en betalingsplan, 
så kontakt os venligst.

Med venlig hilsen,
[Dit navn]
```

### Week 3: 7 days overdue

```
Til: [Kunde]
Emne: Påmindelse - Faktura #[XXXX] er forfalden

Hej [Kundenavn],

Vi har desværre ikke modtaget betaling for faktura #[XXXX] 
på [BELØB] DKK, som forfaldt d. [DATO].

Vi beder dig venligst betale hurtigst muligt for at undgå 
rykkergebyr.

Ved spørgsmål, kontakt os på [TELEFON/EMAIL].

Med venlig hilsen,
[Dit navn]
```

### Week 4: 14+ days overdue

```
Til: [Kunde]
Emne: SIDSTE PÅMINDELSE - Faktura #[XXXX]

Hej [Kundenavn],

Dette er vores sidste påmindelse før sagen overdrages 
til inkasso.

Faktura #[XXXX] på [BELØB] DKK er nu [X] dage forfalden.

Betal venligst senest [DATO] for at undgå yderligere gebyr.

Kontakt os øjeblikkeligt hvis der er problemer: [TELEFON]

Med venlig hilsen,
[Dit navn]
```

---

## 🤖 BRUG AF AI-ASSISTENTER (Claude, ChatGPT, Copilot)

### Hvornår bruge AI?

**Brug AI til:**
- ✅ Månedlige analytics rapporter
- ✅ Product usage analysis
- ✅ Customer analysis (top customers, payment patterns)
- ✅ Bulk data operations (export, transform)
- ✅ Trend identification
- ✅ Forecasting

**IKKE bruge AI til:**
- ❌ Godkende betalinger (manual review altid!)
- ❌ Slet kunder/fakturaer (for risikabelt)
- ❌ Ændre priser uden review
- ❌ Send fakturaer uden verifikation

### Setup Billy MCP Connection

**For Claude Desktop:**

```json
{
  "mcpServers": {
    "tekup-billy": {
      "command": "node",
      "args": ["C:\\path\\to\\Tekup-Billy\\dist\\index.js"],
      "env": {
        "BILLY_API_KEY": "your-api-key",
        "BILLY_ORGANIZATION_ID": "IQgm5fsl5rJ3Ub33EfAEow"
      }
    }
  }
}
```

**For ChatGPT (HTTP):**

```
1. ChatGPT → Settings → Actions
2. Add New Action
3. Import OpenAPI schema:
   https://tekup-billy.onrender.com/openapi.json
4. Add API Key i Authentication
5. Test med simple prompt
```

### Standard Prompts til AI

**Monthly Report:**

```
Run Phase 1 Analytics for [MÅNED]. 
Compare with previous month. 
Highlight significant changes.
```

**Product Cleanup:**

```
Analyze all active products. 
Show usage count, revenue, last used.
Recommend which to archive.
```

**Customer Analysis:**

```
Analyze top 10 customers.
Show: invoices, revenue, payment speed, trends.
Flag any at-risk customers.
```

**Payment Follow-up:**

```
List all invoices overdue >7 days.
Group by customer.
Show total outstanding per customer.
Suggest priority for follow-up.
```

---

## ⚠️ COMMON MISTAKES (Undgå disse!)

### ❌ Fejl at Undgå

**1. Oprette nye produkter hele tiden**

```
Problem: Ender med 100+ produkter
Solution: Brug standardprodukter + beskrivelser
```

**2. Glemme at godkende drafts**

```
Problem: Mistet omsætning, forsinket betaling
Solution: Daily morning check (5 min)
```

**3. Ikke følge op på forfaldne fakturaer**

```
Problem: Dårlig cash flow, tab af penge
Solution: Automatisk reminder workflow
```

**4. Slette gamle produkter**

```
Problem: Ødelagt fakturahistorik
Solution: Arkiver (marker inaktiv) i stedet
```

**5. Inkonsistente priser**

```
Problem: Kundeforvirring, tab af profit
Solution: Standard prisliste, kun afvigelser med note
```

**6. Manglende backup**

```
Problem: Data loss hvis Billy.dk issues
Solution: Export data månedligt
```

### ✅ Best Practices

**1. Konsistent navngivning**

```
Products: REN-00X format
Customers: Fulde navne, korrekt adresse
Descriptions: Struktureret format
```

**2. Regular reviews**

```
Daily: Drafts + overdue (5 min)
Weekly: Cash flow check (10 min)
Monthly: Full analytics (30 min)
Quarterly: Product cleanup (15 min)
```

**3. Documentation**

```
Note special arrangements med kunder
Document pricing exceptions
Keep change log for product catalog
```

**4. Communication**

```
Proactive reminders (før forfaldsdag)
Quick responses til kunde-spørgsmål
Clear invoice descriptions
```

---

## 📊 KPIs at Tracke

### Business Health Indicators

**Revenue Metrics:**

```
- Monthly revenue trend
- Average invoice amount
- Revenue per product type
- Revenue per customer
```

**Payment Metrics:**

```
- Average days to payment
- % invoices paid on time
- % invoices overdue
- Outstanding balance
```

**Efficiency Metrics:**

```
- Time to create invoice (target: <5 min)
- Draft-to-sent ratio (target: >90%)
- Product catalog size (target: 10-15)
- Customer retention rate
```

**Quality Metrics:**

```
- Invoice error rate (target: <5%)
- Customer complaints
- Payment disputes
- Cancellation rate
```

### Monthly Review Template

```markdown
# Monthly Business Review - [MÅNED ÅR]

## Revenue
- Total: [X,XXX] DKK
- vs. last month: +/- [X]%
- Top product: [Product name]
- Top customer: [Customer name]

## Payments
- On-time rate: [X]%
- Avg days to payment: [X] days
- Overdue amount: [X,XXX] DKK
- Concerning accounts: [List]

## Efficiency
- Invoices created: [X]
- Avg time per invoice: [X] min
- Draft backlog: [X]
- Product count: [X]

## Actions This Month
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

## Goals Next Month
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]
```

---

## 🆘 TROUBLESHOOTING

### Billy.dk Login Issues

```
1. Check internet connection
2. Clear browser cache
3. Try incognito mode
4. Reset password if needed
5. Contact Billy support: help.billy.dk
```

### Billy MCP Connection Issues

```
1. Check server status:
   Invoke-RestMethod https://tekup-billy.onrender.com/health

2. Verify API key still valid

3. Check organizationId correct

4. Review server logs on Render.com

5. Restart MCP server if needed
```

### Missing Data Issues

```
1. Check filters (dates, states, etc.)
2. Verify not looking at wrong organization
3. Check if data was deleted accidentally
4. Contact Billy support if data lost
5. Restore from backup if available
```

---

## 📞 Support Contacts

**Billy.dk Support:**
- Website: <https://help.billy.dk>
- Email: <support@billy.dk>
- Phone: [Billy support number]

**Billy MCP (Tekup):**
- Server: <https://tekup-billy.onrender.com>
- GitHub: <https://github.com/TekupDK/Tekup-Billy>
- Health: <https://tekup-billy.onrender.com/health>

**AI Assistants:**
- Claude Desktop: For local MCP usage
- ChatGPT Plus: For HTTP API usage
- GitHub Copilot: For code questions

---

## 📚 Reference Documents

**In This Repository:**
- `CLAUDE_PHASE1_FINAL_REPORT.md` - Analytics baseline
- `ACTION_PLAN_OCT21.md` - Prioritized tasks
- `PRODUCT_CLEANUP_PLAN.md` - Product consolidation guide
- `PRODUCT_CLEANUP_EXECUTION.md` - Step-by-step cleanup
- `README.md` - Technical setup
- `.github/copilot-instructions.md` - AI assistant context

**Billy.dk Resources:**
- Help Center: <https://help.billy.dk>
- API Docs: <https://www.billy.dk/api>
- Video Tutorials: <https://www.billy.dk/support>

---

**Guide Version:** 1.0  
**Last Updated:** 21. oktober 2025  
**Next Review:** 21. januar 2026

**Changes:**
- v1.0 (Oct 21, 2025): Initial version based on Phase 1 findings
