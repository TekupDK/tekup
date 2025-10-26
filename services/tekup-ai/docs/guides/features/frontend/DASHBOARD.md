# RenOS Dashboard Dokumentation\n\n\n\n## Oversigt\n\n\n\nRenOS Dashboard er en real-time overvågnings- og administrationsgrænseflade, der giver komplet overblik over forretningsaktiviteter, systemets ydeevne og kundeinteraktioner.\n\n\n\n## Funktioner\n\n\n\n### 📊 Kernestatistikker\n\n\n\nDashboardet viser følgende nøgletal i realtid:
\n\n- **Kunder**: Antal aktive kunder i systemet\n\n- **Leads**: Totalt antal leads (alle statusser)\n\n- **Bookinger**: Antal bookinger (alle statusser)\n\n- **Tilbud**: Antal sendte tilbud\n\n- **Omsætning**: Total omsætning fra accepterede tilbud (kr)\n\n- **Aktive Samtaler**: Antal igangværende e-mail-samtaler\n\n\n\n### 🗄️ Cache Performance\n\n\n\nOvervåger systemets cache-ydeevne:
\n\n- **Hit Rate**: Procentdel af cache-hits\n\n- **Hits**: Antal succesfulde cache-opslag\n\n- **Misses**: Antal cache-misses\n\n- **Entries**: Totalt antal elementer i cachen\n\n\n\n### 📋 Seneste Leads\n\n\n\nViser de 5 seneste leads med:
\n\n- Kunde/lead navn\n\n- E-mail-adresse\n\n- Status (med farvekodet badge)\n\n- Oprettelsesdato og tid (dansk format)\n\n\n\n### 📅 Kommende Bookinger\n\n\n\nViser de 5 næste bookinger med:
\n\n- Kundenavn\n\n- Start- og sluttid (dansk format)\n\n- Status (planlagt/bekræftet/osv.)\n\n\n\n## Backend API Endpoints\n\n\n\n### Base URL\n\n\n\n```\n\nhttp://localhost:3000/api/dashboard\n\n```
\n\n### Endpoints\n\n\n\n#### 1. Health Check\n\n\n\n```http\n\nGET /api/dashboard/health\n\n```

**Response:**
\n\n```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}\n\n```
\n\n#### 2. Overview Stats\n\n\n\n```http\n\nGET /api/dashboard/stats/overview\n\n```

**Response:**
\n\n```json
{
  "customers": 42,
  "leads": 156,
  "bookings": 89,
  "quotes": 134,
  "conversations": 23,
  "revenue": 450000
}\n\n```
\n\n#### 3. Recent Leads\n\n\n\n```http\n\nGET /api/dashboard/leads/recent?limit=5\n\n```

**Query Parameters:**
\n\n- `limit` (optional): Antal leads der returneres (standard: 10)\n\n
**Response:**
\n\n```json
[
  {
    "id": "lead-123",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "new",
    "createdAt": "2024-01-15T09:30:00.000Z",
    "customer": {
      "name": "Rengøring Aarhus ApS"
    },
    "quotes": [...],
    "bookings": [...]
  }
]\n\n```
\n\n#### 4. Lead Pipeline\n\n\n\n```http\n\nGET /api/dashboard/leads/pipeline\n\n```

**Response:**
\n\n```json
[
  { "status": "new", "_count": { "id": 45 } },
  { "status": "contacted", "_count": { "id": 32 } },
  { "status": "quoted", "_count": { "id": 28 } },
  { "status": "won", "_count": { "id": 15 } }
]\n\n```
\n\n#### 5. Recent Bookings\n\n\n\n```http\n\nGET /api/dashboard/bookings/recent?limit=10\n\n```

**Query Parameters:**
\n\n- `limit` (optional): Antal bookinger (standard: 10)\n\n\n\n#### 6. Upcoming Bookings\n\n\n\n```http\n\nGET /api/dashboard/bookings/upcoming\n\n```

Returnerer fremtidige bookinger (startTime >= nu) med status 'scheduled' eller 'confirmed', max 20.
\n\n#### 7. Email Activity\n\n\n\n```http\n\nGET /api/dashboard/emails/activity?days=7\n\n```

**Query Parameters:**
\n\n- `days` (optional): Antal dage tilbage (standard: 7)\n\n
**Response:**
\n\n```json
[
  {
    "date": "2024-01-15",
    "inbound": 15,
    "outbound": 23,
    "aiGenerated": 18
  }
]\n\n```
\n\n#### 8. AI Metrics\n\n\n\n```http\n\nGET /api/dashboard/ai/metrics\n\n```

**Response:**
\n\n```json
{
  "total": 156,
  "byModel": [
    { "model": "gpt-4", "_count": { "id": 98 } },
    { "model": "gpt-3.5-turbo", "_count": { "id": 58 } }
  ]
}\n\n```
\n\n#### 9. Cache Stats\n\n\n\n```http\n\nGET /api/dashboard/cache/stats\n\n```

**Response:**
\n\n```json
{
  "hits": 1234,
  "misses": 56,
  "size": 42,
  "hitRate": "95.7%"
}\n\n```
\n\n#### 10. Top Customers\n\n\n\n```http\n\nGET /api/dashboard/customers/top?limit=10\n\n```

**Query Parameters:**
\n\n- `limit` (optional): Antal kunder (standard: 10)\n\n
**Response:**
\n\n```json
[
  {
    "id": "cust-123",
    "name": "Rengøring Aarhus ApS",
    "email": "kontakt@rengoring-aarhus.dk",
    "totalRevenue": 125000
  }
]\n\n```
\n\n#### 11. Revenue Timeline\n\n\n\n```http\n\nGET /api/dashboard/revenue/timeline?days=30\n\n```

**Query Parameters:**
\n\n- `days` (optional): Antal dage (standard: 30)\n\n
**Response:**
\n\n```json
[
  {
    "date": "2024-01-15",
    "revenue": 45000,
    "count": 5
  }
]\n\n```
\n\n#### 12. System Health\n\n\n\n```http\n\nGET /api/dashboard/system/health\n\n```

**Response:**
\n\n```json
{
  "database": "connected",
  "cache": {
    "hits": 1234,
    "misses": 56,
    "size": 42,
    "hitRate": "95.7%"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}\n\n```
\n\n## Frontend Implementation\n\n\n\n### Teknologi Stack\n\n\n\n- **React 18.2.0**: UI framework\n\n- **TypeScript**: Type safety\n\n- **Vite 5.4**: Build tool og dev server\n\n- **Tailwind CSS**: Styling\n\n- **Lucide React**: Ikoner\n\n\n\n### Komponent Struktur\n\n\n\n```\n\nclient/src/
├── components/
│   ├── Dashboard.tsx         # Hovedkomponent med real-time data\n\n│   ├── ChatInterface.tsx     # Chat-grænseflade\n\n│   └── ui/\n\n│       └── Card.tsx          # Genbrugelige Card-komponenter\n\n├── App.tsx                   # Tab-navigation (Dashboard/Chat)\n\n└── main.tsx                  # Entry point\n\n```\n\n\n\n### State Management\n\n\n\nDashboardet bruger React hooks til state management:
\n\n```typescript
const [stats, setStats] = useState<OverviewStats | null>(null);
const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);\n\n```
\n\n### Auto-Refresh\n\n\n\nData opdateres automatisk hvert 30. sekund:
\n\n```typescript
useEffect(() => {
  const fetchData = async () => { /* ... */ };\n\n  
  fetchData();
  const interval = setInterval(fetchData, 30000);
  
  return () => clearInterval(interval);
}, []);\n\n```
\n\n### Status Farver\n\n\n\nStatus badges får automatisk farver baseret på status:
\n\n- **Ny/New**: Blå\n\n- **Kontaktet/Contacted**: Gul\n\n- **Tilbud/Quoted**: Lilla\n\n- **Vundet/Won**: Grøn\n\n- **Tabt/Lost**: Rød\n\n- **Planlagt/Scheduled**: Indigo\n\n- **Bekræftet/Confirmed**: Grøn\n\n- **Gennemført/Completed**: Grå\n\n- **Annulleret/Cancelled**: Rød\n\n\n\n## Kørsel\n\n\n\n### Backend (Port 3000)\n\n\n\n```bash\n\nnpm run dev\n\n```
\n\n### Frontend (Port 5173)\n\n\n\n```bash\n\ncd client
npm install  # Første gang\n\nnpm run dev\n\n```\n\n\n\n### Adgang\n\n\n\n- **Dashboard**: <http://localhost:5173>\n\n- **API**: <http://localhost:3000/api/dashboard/>*\n\n\n\n## CORS Konfiguration\n\n\n\nBackend tillader CORS fra alle origins (udvikling):
\n\n```javascript
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});\n\n```

**⚠️ OBS:** I produktion bør CORS konfigureres til kun at tillade specifikke origins.\n\n\n\n## Fejlfinding\n\n\n\n### Backend Problemer\n\n\n\n1. **Port 3000 optaget**: Tjek at ingen andre processer bruger porten\n\n2. **Database fejl**: Verificér at Prisma Client er genereret (`npx prisma generate`)\n\n3. **Cache fejl**: Cache service initialiseres automatisk ved opstart
\n\n### Frontend Problemer\n\n\n\n1. **API fejl**: Tjek at backend kører på port 3000\n\n2. **CORS fejl**: Verificér at CORS middleware er konfigureret korrekt\n\n3. **Manglende data**: Åbn browser console for at se fejlmeddelelser\n\n4. **Build fejl**: Slet `node_modules` og kør `npm install` igen
\n\n## Tilpasning\n\n\n\n### Ændre Refresh Interval\n\n\n\nI `Dashboard.tsx`:
\n\n```typescript
const interval = setInterval(fetchData, 30000); // Ændre 30000 til ønsket ms\n\n```
\n\n### Tilføje Nye Stats\n\n\n\n1. Tilføj nyt endpoint i `src/api/dashboardRoutes.ts`\n\n2. Tilføj interface i `Dashboard.tsx`\n\n3. Tilføj state og fetch-logik\n\n4. Tilføj UI-komponenter
\n\n### Ændre Antal Viste Items\n\n\n\nQuery parameters kan justeres:
\n\n```typescript
fetch(`${API_BASE}/leads/recent?limit=10`) // Ændre 10 til ønsket antal\n\n```
\n\n## Performance\n\n\n\n### Caching\n\n\n\n- Backend bruger in-memory cache med TTL\n\n- Cache stats vises i dashboard\n\n- Cache ryddes automatisk ved udløb\n\n\n\n### Database Queries\n\n\n\n- Alle queries er optimeret med Prisma\n\n- Inkluderer kun nødvendige relationer\n\n- Bruger `select` til at begrænse felter\n\n\n\n### Frontend Optimering\n\n\n\n- Parallel data fetching med `Promise.all`\n\n- Loading states forhindrer UI-flicker\n\n- Conditional rendering for bedre UX\n\n\n\n## Sikkerhed\n\n\n\n### Anbefalinger for Produktion\n\n\n\n1. **API Authentication**: Tilføj JWT eller API-nøgler\n\n2. **CORS**: Begræns til kun production frontend URL\n\n3. **Rate Limiting**: Implementer rate limiting på endpoints\n\n4. **Input Validation**: Validér alle query parameters\n\n5. **HTTPS**: Brug kun HTTPS i produktion\n\n6. **Environment Variables**: Gem sensitive data i `.env`
\n\n## Videreudvikling\n\n\n\n### Planlagte Features\n\n\n\n- [ ] Grafer og charts for revenue timeline\n\n- [ ] AI metrics visualisering\n\n- [ ] Lead pipeline funnel diagram\n\n- [ ] Real-time notifications (WebSocket)\n\n- [ ] Export til PDF/Excel\n\n- [ ] Filtreringsmuligheder\n\n- [ ] Customizable dashboard layout\n\n- [ ] Dark mode\n\n\n\n### API Udvidelser\n\n\n\n- [ ] Filtrering på datointerval\n\n- [ ] Sortering og pagination\n\n- [ ] Aggregeret statistik pr. periode\n\n- [ ] Custom rapporter\n\n\n\n## Support\n\n\n\nFor spørgsmål eller problemer, kontakt udviklingsteamet eller se kildekoden:
\n\n- **Backend**: `src/api/dashboardRoutes.ts`, `src/server.ts`\n\n- **Frontend**: `client/src/components/Dashboard.tsx`\n\n- **Database Schema**: `prisma/schema.prisma`\n\n
---

**Senest opdateret**: 2024-01-15  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
