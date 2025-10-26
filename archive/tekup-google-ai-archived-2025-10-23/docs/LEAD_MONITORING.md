# Lead Monitoring System\n\n\n\nAutomatisk overvågningssystem for nye leads fra Leadmail.no.
\n\n## 📋 Oversigt\n\n\n\nLead Monitoring System checker automatisk Gmail for nye emails fra Leadmail.no, parser lead-data og gemmer dem struktureret. Systemet kan køre som en scheduled task der tjekker hver 15-30 minutter.
\n\n## 🎯 Features\n\n\n\n- ✅ **Automatisk detektion** - Finder Leadmail.no emails automatisk\n\n- ✅ **Struktureret parsing** - Ekstraherer navn, email, telefon, adresse, m², osv.\n\n- ✅ **Scheduled monitoring** - Kører automatisk hver X minutter (konfigurerbar)\n\n- ✅ **Notifikationer** - Callback-baseret notifikationssystem\n\n- ✅ **In-memory storage** - Gemmer leads i hukommelsen (kan udvides til database)\n\n- ✅ **Duplikatbeskyttelse** - Behandler ikke samme lead to gange\n\n\n\n## 📦 Parsed Lead Data\n\n\n\nHvert lead indeholder:
\n\n```typescript
interface ParsedLead {
    // Source
    source: string;           // e.g., "Rengøring.nu"
    receivedAt: Date;         // Modtagelsestidspunkt
    emailId: string;          // Gmail message ID
    threadId: string;         // Gmail thread ID

    // Contact
    name?: string;            // "Andreas Slot Tanderup"
    email?: string;           // "kunde@example.com"
    phone?: string;           // "+4512345678"
    address?: string;         // "Tendrup Møllevej 103, 8870 Langå"

    // Property
    squareMeters?: number;    // 150
    rooms?: number;           // 5
    propertyType?: string;    // "Villa/Parcelhus"

    // Service
    taskType?: string;        // "Fast rengøringshjælp" eller "Flytterengøring"
    serviceNeeded?: string;
    preferredDates?: string[];
    ownerOrRenter?: string;

    // Raw
    rawSnippet: string;       // Original email snippet
}\n\n```
\n\n## 🚀 Brug\n\n\n\n### CLI Commands\n\n\n\n```bash\n\n# Check for nye leads ÉN gang\n\nnpm run leads:check\n\n\n\n# Start kontinuerlig monitoring (hver 20 min)\n\nnpm run leads:monitor\n\n\n\n# List alle gemte leads\n\nnpm run leads:list\n\n```\n\n\n\n### Programmatisk Brug\n\n\n\n```typescript\n\nimport {
    startLeadMonitoring,
    stopLeadMonitoring,
    onNewLead,
    checkForNewLeads,
    getLeads,
    getLeadsBySource,
} from "./services/leadMonitor";

// 1. Start monitoring (hver 20 minutter)
const task = startLeadMonitoring("*/20 * * * *");\n\n
// 2. Registrer notifikation når nye leads findes
onNewLead((lead) => {
    console.log(`🔔 Nyt lead: ${lead.name} - ${lead.taskType}`);\n\n    // Send email, SMS, eller gem i database
});

// 3. Check manuelt for nye leads
const newLeads = await checkForNewLeads();

// 4. Hent alle leads
const allLeads = getLeads();

// 5. Filter leads by source
const rengNuLeads = getLeadsBySource("Rengøring.nu");

// 6. Stop monitoring
stopLeadMonitoring(task);\n\n```
\n\n## ⏰ Cron Schedule Examples\n\n\n\n```typescript\n\n// Hver 15 minutter
startLeadMonitoring("*/15 * * * *");\n\n
// Hver 30 minutter
startLeadMonitoring("*/30 * * * *");\n\n
// Hver time
startLeadMonitoring("0 * * * *");\n\n
// Hver dag kl. 09:00
startLeadMonitoring("0 9 * * *");\n\n
// Hver mandag kl. 08:00
startLeadMonitoring("0 8 * * 1");\n\n```
\n\n## 🔗 Integration med Express Server\n\n\n\n```typescript\n\nimport express from "express";
import { startLeadMonitoring, onNewLead, getLeads } from "./services/leadMonitor";

const app = express();

// Start monitoring når serveren starter
startLeadMonitoring("*/20 * * * *");\n\n
// Notifikation ved nye leads
onNewLead(async (lead) => {
    // Send til AI agent for auto-respons
    await sendAutoResponse(lead);
    
    // Gem i database
    await saveLeadToDatabase(lead);
    
    // Send notifikation til admin
    await notifyAdmin(lead);
});

// API endpoint til at hente leads
app.get("/api/leads", (req, res) => {
    const leads = getLeads();
    res.json({ leads, count: leads.length });
});\n\n```
\n\n## 📊 Lead Parser Features\n\n\n\n### Name Extraction\n\n\n\nFinder navn fra:
\n\n- Subject line: `"Andreas Slot Tanderup fra Rengøring.nu"`\n\n- Email body patterns\n\n\n\n### Contact Information\n\n\n\nParser:
\n\n- Email: Standard email patterns\n\n- Phone: Danske telefonnumre (+45, 12 34 56 78)\n\n- Address: Vejnavne og postnumre\n\n\n\n### Property Details\n\n\n\nEkstraherer:
\n\n- Square meters: `150 m²` eller `"150 kvadratmeter"`\n\n- Property type: `"Villa/Parcelhus"`, `"Lejlighed"`, etc.\n\n- Rooms: Antal værelser\n\n\n\n### Service Type\n\n\n\nIdentificerer:
\n\n- `"Fast rengøringshjælp"`\n\n- `"Flytterengøring"`\n\n- `"Erhvervsrengøring"`\n\n- `"Vinduespudsning"`\n\n\n\n## 🧪 Testing\n\n\n\n```bash\n\n# Run lead monitoring tests (når de er oprettet)\n\nnpm test -- leadMonitor\n\n\n\n# Check for real leads\n\nnpm run leads:check\n\n```\n\n\n\n## 📈 Monitoring Statistics\n\n\n\n```typescript\n\nimport { getMonitoringStats } from "./services/leadMonitor";

const stats = getMonitoringStats();
console.log(stats);
// {
//   totalLeads: 5,
//   processedEmailIds: 50,
//   callbacksRegistered: 2
// }\n\n```
\n\n## 🔜 Future Enhancements\n\n\n\n### Short Term\n\n\n\n- [ ] Database persistence (PostgreSQL/Prisma)\n\n- [ ] Auto-response email templates\n\n- [ ] SMS notifications via Twilio\n\n- [ ] Lead scoring/prioritization\n\n- [ ] Duplicate lead detection (same name/email)\n\n\n\n### Long Term\n\n\n\n- [ ] Lead assignment (fordel til medarbejdere)\n\n- [ ] CRM integration\n\n- [ ] Analytics dashboard\n\n- [ ] Machine learning for lead quality scoring\n\n- [ ] Integration med kalender-booking\n\n\n\n## 🐛 Troubleshooting\n\n\n\n### No leads found\n\n\n\n```bash\n\n# Check Gmail authentication\n\nnpm run verify:google\n\n\n\n# Check recent emails manually\n\nnpm run data:gmail\n\n```\n\n\n\n### Parsing errors\n\n\n\n- Check logger output for parse failures\n\n- Verify Leadmail.no email format hasn't changed\n\n- Adjust regex patterns in `leadParser.ts`\n\n\n\n### Monitoring not running\n\n\n\n- Verify cron schedule is valid\n\n- Check server logs for errors\n\n- Ensure Gmail API credentials are valid\n\n\n\n## 📝 Example Output\n\n\n\n```\n\n🔍 Checking for new Leadmail.no leads...

✅ Found 2 new lead(s):

────────────────────────────────────────────────────────────────
📧 Lead ID: 19996dbc0efdcf1b
👤 Name: Andreas Slot Tanderup
📍 Source: Rengøring.nu
🏠 Task Type: Fast rengøringshjælp
📐 Property: Villa/Parcelhus
📏 Size: 150 m²
🗺️  Address: Tendrup Møllevej 103, 8870 Langå
✉️  Email: andreas@example.com
📞 Phone: +4512345678
⏰ Received: 29. sep. 2025, 21.03
────────────────────────────────────────────────────────────────

📊 Statistics:
   Total leads stored: 2
   Processed email IDs: 10\n\n```
\n\n## 🔐 Security\n\n\n\n- Lead data er kun gemt i hukommelsen (forsvinder ved genstart)\n\n- For persistent storage, brug database med proper access control\n\n- Gmail API credentials skal beskyttes med environment variables\n\n- Overvej GDPR compliance når du gemmer persondata\n\n\n\n## 📚 Related Documentation\n\n\n\n- [Google Auth Setup](./SETUP_CHECKLIST.md)\n\n- [Data Fetching](./DATA_FETCHING.md)\n\n- [Gmail Service API](../src/services/gmailService.ts)
