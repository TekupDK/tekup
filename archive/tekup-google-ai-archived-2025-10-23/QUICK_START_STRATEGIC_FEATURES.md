# 🚀 Quick Start - Strategiske Features

**TL;DR:** Sådan bruger du de nye data-cleaning og lead scoring features **NU**.

---

## ⚡ **1. Data-Cleaning - Fjern Duplikater**

### **Problem du har:**
- 20+ "Re: Re: Lars Skytte Poulsen" duplikater
- Mange "N/A" værdier
- Inkonsistent data-format

### **Løsning (2 minutter):**

```bash
# 1. Kør komplet data-cleaning
curl -X POST https://api.renos.dk/api/data-quality/clean/all

# 2. Se resultaterne
curl https://api.renos.dk/api/data-quality/report
```

### **Hvad sker der:**
- ✅ Fjerner alle duplikerede leads (baseret på email)
- ✅ Standardiser telefonnumre til dansk format (+45 12 34 56 78)
- ✅ Validerer og fixer email-adresser
- ✅ Genererer rapport med anbefalinger

---

## 🎯 **2. Lead Scoring - Prioriter Automatisk**

### **Problem du har:**
- Alle leads behandles ens
- Hot leads opdages for sent
- Tid spildes på low-quality leads

### **Løsning (30 sekunder):**

```bash
# Score alle eksisterende leads
curl -X POST https://api.renos.dk/api/leads/score-all
```

### **Hvad sker der:**
Hver lead får en score (0-100) baseret på:
- **Response Speed** (nyere = højere score)
- **Contact Quality** (email + phone = bedst)
- **Service Value** (højere værdi = højere score)
- **Engagement** (mere aktivitet = højere score)

### **Tiers:**
- **🔥 HOT** (75-100): Kontakt OMGÅENDE
- **🌡️ WARM** (50-74): Kontakt inden 24 timer
- **❄️ COLD** (0-49): Lav prioritet

---

## 📊 **3. Se Resultater i Database**

### **Check Lead Scores:**
```sql
SELECT 
  id,
  name,
  email,
  score,
  priority,
  createdAt
FROM leads
ORDER BY score DESC
LIMIT 20;
```

### **Count by Priority:**
```sql
SELECT 
  priority,
  COUNT(*) as count
FROM leads
WHERE status NOT IN ('converted', 'lost')
GROUP BY priority;
```

---

## 🎯 **4. Integration i Frontend (Next Step)**

### **A. Dashboard Widget - Top Priority Leads**

```tsx
// client/src/components/PriorityLeadsWidget.tsx
import { useState, useEffect } from 'react';

export function PriorityLeadsWidget() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    fetch('/api/leads/prioritized?limit=10')
      .then(res => res.json())
      .then(data => setLeads(data));
  }, []);

  return (
    <div className="stats-card-premium">
      <h3>🔥 Hot Leads</h3>
      {leads.map(({ lead, score }) => (
        <div key={lead.id} className="lead-item">
          <span>{lead.name}</span>
          <span className={`tier-${score.tier}`}>
            {score.score} points
          </span>
        </div>
      ))}
    </div>
  );
}
```

### **B. Lead List - Show Scores**

```tsx
// Tilføj til Leads.tsx
<td className="p-4">
  <span className={`status-badge-premium ${getPriorityColor(lead.priority)}`}>
    {lead.score || 'N/A'} points
  </span>
</td>
```

---

## ⚙️ **5. Automatiser med Cron Jobs**

### **Setup Daglig Data-Cleaning:**

```typescript
// src/jobs/dataCleaningJob.ts
import cron from 'node-cron';
import { runCompleteDataCleaning } from '../services/dataCleaningService';

// Kør hver nat kl. 03:00
cron.schedule('0 3 * * *', async () => {
  console.log('Running nightly data cleaning...');
  await runCompleteDataCleaning();
});
```

### **Setup Automatic Lead Scoring:**

```typescript
// src/jobs/leadScoringJob.ts
import cron from 'node-cron';
import { scoreAllLeads } from '../services/leadScoringService';

// Kør hver time
cron.schedule('0 * * * *', async () => {
  console.log('Scoring new leads...');
  await scoreAllLeads();
});
```

---

## 📧 **6. Email Alerts for Hot Leads**

```typescript
// src/services/leadAlertService.ts
import { prisma } from '../lib/db';
import { sendEmail } from './emailService';

export async function alertHotLeads() {
  const hotLeads = await prisma.lead.findMany({
    where: {
      score: { gte: 75 },
      status: 'new',
    },
  });

  if (hotLeads.length > 0) {
    await sendEmail({
      to: 'sales@rendetalje.dk',
      subject: `🔥 ${hotLeads.length} Hot Leads Need Attention!`,
      html: `
        <h2>High Priority Leads:</h2>
        ${hotLeads.map(lead => `
          <p>
            <strong>${lead.name}</strong><br>
            Email: ${lead.email}<br>
            Score: ${lead.score} points<br>
            <a href="https://renos.dk/leads/${lead.id}">View Lead</a>
          </p>
        `).join('')}
      `,
    });
  }
}
```

---

## 🎯 **7. Business Rules**

### **Sales Team Workflow:**

1. **Morgen (09:00):**
   - Tjek hot leads list
   - Kontakt alle 75+ score leads omgående

2. **Middag (12:00):**
   - Følg op på warm leads (50-74)
   - Prioriter højeste scores først

3. **Eftermiddag (15:00):**
   - Review cold leads hvis tid tillader
   - Fokuser på leads med potential for upsell

4. **Aften (17:00):**
   - Se dagens conversion rate
   - Plan næste dags prioriteter

---

## 📊 **8. Success Metrics**

### **Track These KPIs:**

```typescript
// Dashboard metrics
const metrics = {
  hotLeadResponseTime: avg(time_to_contact for score >= 75),
  overallConversionRate: (converted / total) * 100,
  scoreAccuracy: (predicted_conversions / actual_conversions),
  dataQuality: (leads_with_complete_data / total_leads) * 100,
};
```

### **Weekly Report:**
```sql
SELECT 
  DATE_TRUNC('week', created_at) as week,
  priority,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions,
  (COUNT(CASE WHEN status = 'converted' THEN 1 END)::float / COUNT(*)::float * 100) as conversion_rate
FROM leads
GROUP BY week, priority
ORDER BY week DESC, priority;
```

---

## ✅ **Quick Checklist**

- [ ] **Deploy services** til production
- [ ] **Run initial data-cleaning** (fjern duplikater)
- [ ] **Score existing leads** (beregn alle scores)
- [ ] **Add dashboard widget** (vis hot leads)
- [ ] **Setup cron jobs** (automatisk daglig kørsel)
- [ ] **Configure alerts** (email ved hot leads)
- [ ] **Train sales team** (brug af prioriteter)
- [ ] **Monitor metrics** (track conversion rates)

---

## 🚨 **Immediate Actions (Today):**

1. **Deploy Backend:**
   ```bash
   git add src/services/*
   git add src/routes/dataQualityRoutes.ts
   git commit -m "feat: Add data cleaning and lead scoring"
   git push origin main
   ```

2. **Run Data Cleaning:**
   ```bash
   curl -X POST https://api.renos.dk/api/data-quality/clean/all
   ```

3. **Score All Leads:**
   ```bash
   curl -X POST https://api.renos.dk/api/leads/score-all
   ```

4. **Verify Results:**
   ```bash
   curl https://api.renos.dk/api/data-quality/report
   ```

---

## 💡 **Pro Tips**

1. **Start Simple:** Brug scoring til at sortere din lead-liste
2. **Iterate:** Juster scoring-vægte baseret på faktiske conversions
3. **Automate:** Setup cron jobs så det kører automatisk
4. **Measure:** Track conversion rates før/efter implementation
5. **Optimize:** Fine-tune baseret på data efter 2-4 uger

---

**Start NU - de største problemer kan løses i dag!** 🚀

