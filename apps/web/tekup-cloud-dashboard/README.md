# Tekup Cloud Dashboard

En moderne, produktionsklar dashboard-applikation til Tekup Cloud-platformen, bygget med React, TypeScript, Vite og TailwindCSS.

## 🚀 Funktioner

- **Real-time Dashboard**: Live KPI-metrics og systemovervågning
- **Lead Management**: Automatisk lead-capture og -håndtering
- **AI Agent Monitoring**: Overvågning af AI-agenter og deres performance
- **System Health**: Real-time systemsundhedstjek og alerts
- **Autentificering**: Sikker brugerautentificering via Supabase
- **Multi-tenant Support**: Understøtter flere klienter i samme installation
- **Responsive Design**: Optimeret til desktop og mobile enheder
- **Dark/Light Mode**: Brugervenlig tema-switching

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API

## 📋 Forudsætninger

- Node.js 18+
- npm eller yarn
- Supabase-konto og projekt

## 🔧 Installation

1. **Klon repositoriet**
   ```bash
   git clone <repository-url>
   cd tekup-cloud-dashboard
   ```

2. **Installer dependencies**
   ```bash
   npm install
   ```

3. **Opsæt miljøvariabler**
   ```bash
   cp .env.example .env
   ```

   Udfyld `.env` filen med dine Supabase-credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_NAME=Tekup Cloud Dashboard
   VITE_API_BASE_URL=https://api.tekup.dk
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Projektstruktur

```
src/
├── components/          # Genanvendelige UI-komponenter
│   ├── auth/           # Autentificeringskomponenter
│   ├── ui/             # Basis UI-komponenter
│   └── ...
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility-funktioner og konfiguration
├── pages/              # Side-komponenter
├── types/              # TypeScript type-definitioner
└── App.tsx             # Hovedapplikation
```

## 🔐 Autentificering

Dashboardet bruger Supabase Auth til sikker brugerautentificering:

- Email/password login
- Automatisk session-håndtering
- Beskyttede ruter
- Rolle-baseret adgangskontrol

## 📊 Data Integration

### Supabase Integration

- Real-time database-forbindelse
- Automatisk data-synkronisering
- Optimistisk UI-opdateringer

### External APIs

- **TekupVault**: Knowledge base og dokumentsøgning
- **Billy.dk**: Fakturering og regnskab
- **Google APIs**: Kalender og email-integration

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

### Deployment til Vercel

1. Forbind repository til Vercel
2. Tilføj miljøvariabler i Vercel dashboard
3. Deploy automatisk ved push til main branch

### Deployment til Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Tilføj miljøvariabler i Netlify dashboard

## 🧪 Testing

```bash
# Kør tests
npm run test

# Kør tests med coverage
npm run test:coverage

# Kør linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📈 Performance

- **Lazy Loading**: Komponenter indlæses kun når nødvendigt
- **Code Splitting**: Automatisk opdeling af JavaScript-bundles
- **Image Optimization**: Optimerede billeder og ikoner
- **Caching**: Intelligent caching af API-kald

## 🔧 Konfiguration

### Miljøvariabler

Se `.env.example` for alle tilgængelige konfigurationsmuligheder.

### Feature Flags

```env
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_BILLING=true
VITE_FEATURE_CHAT=true
```

## 🐛 Fejlfinding

### Almindelige problemer

1. **Supabase connection fejl**
   - Tjek at VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY er korrekte
   - Verificer at Supabase-projektet er aktivt

2. **Build fejl**
   - Slet `node_modules` og kør `npm install` igen
   - Tjek at alle dependencies er kompatible

3. **Styling problemer**
   - Verificer at TailwindCSS er korrekt konfigureret
   - Tjek at alle CSS-klasser er gyldige

## 📝 API Dokumentation

### Authentication Endpoints

- `POST /auth/login` - Bruger login
- `POST /auth/register` - Bruger registrering
- `POST /auth/logout` - Bruger logout

### Dashboard Endpoints

- `GET /api/kpis` - Hent KPI-metrics
- `GET /api/activities` - Hent nylige aktiviteter
- `GET /api/agents` - Hent AI-agent status

Se `src/lib/api.ts` for komplet API-dokumentation.

## 🤝 Bidrag

1. Fork projektet
2. Opret en feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit dine ændringer (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Åbn en Pull Request

## 📄 Licens

Dette projekt er licenseret under MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 📞 Support

For support og spørgsmål:

- Email: <support@tekup.dk>
- Documentation: [docs.tekup.dk](https://docs.tekup.dk)
- Issues: [GitHub Issues](https://github.com/tekup/tekup-cloud-dashboard/issues)

## 🔄 Changelog

Se [CHANGELOG.md](CHANGELOG.md) for en komplet liste over ændringer og versioner.
