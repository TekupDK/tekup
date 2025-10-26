# RenOS Frontend Setup Guide

Frontend til RenOS er nu oprettet i `client/` mappen med React + TypeScript + Vite + TailwindCSS.

## 📦 Installation

### 1. Installer root dependencies (inkl. concurrently)\n\n```powershell\n\nnpm install\n\n```text\n\n\n### 2. Installer client dependencies\n\n```powershell\n\nnpm run install:client\n\n```text\n
eller

```powershell
cd client
npm install
cd ..\n\n```text\n\n\n## 🚀 Kørsel

### Start kun backend\n\n```powershell\n\nnpm run dev\n\n```\n\nBackend kører på `http://localhost:3000`

### Start kun frontend\n\n```powershell\n\nnpm run dev:client\n\n```\n\nFrontend kører på `http://localhost:5173` og proxyer API-kald til backend

### Start både backend og frontend (anbefalet)\n\n```powershell\n\nnpm run dev:all\n\n```text\n
Dette starter begge servere samtidigt med `concurrently`.

## 🏗️ Build

### Build backend\n\n```powershell\n\nnpm run build\n\n```text\n\n\n### Build frontend\n\n```powershell\n\nnpm run build:client\n\n```text\n\n\n### Build begge\n\n```powershell\n\nnpm run build:all\n\n```text\n\n\n## 📁 Projekt Struktur

```\n\nRenOS/
├── src/                    # Backend (Express API)\n\n│   ├── agents/\n\n│   ├── services/
│   └── ...
├── client/                 # Frontend (React)\n\n│   ├── src/\n\n│   │   ├── components/
│   │   │   ├── ui/        # UI komponenter (Card, etc.)\n\n│   │   │   ├── Dashboard.tsx\n\n│   │   │   └── ChatInterface.tsx
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── package.json            # Root package.json\n\n└── README.md\n\n```text\n\n\n## 🎨 Features

### Dashboard View\n\n- **Statistik kort**: Leads, bookinger, konverteringsrate, klager\n\n- **Aktivitetslog**: Real-time overblik over systemaktiviteter\n\n- **Hurtige handlinger**: Send tilbud, book tid, se analyser

### Chat Interface\n\n- **AI Chat**: Kommunikér direkte med RenOS backend\n\n- **Real-time feedback**: Se intent classification og execution results\n\n- **Modern UI**: Clean chat interface med bruger/assistant avatarer

## 🔧 Teknologi

- **React 18** - UI framework\n\n- **TypeScript** - Type safety\n\n- **Vite** - Ultrafast build tool\n\n- **TailwindCSS** - Utility-first CSS\n\n- **Lucide React** - Moderne ikoner\n\n- **API Proxy** - Automatisk routing til backend

## 🌐 API Integration

Frontend er konfigureret til at proxy alle `/api/*` kald til backend på `http://localhost:3000`.

Eksempel API kald fra `ChatInterface.tsx`:\n\n```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: input, channel: 'desktop' })
})\n\n```text\n\n\n## 📝 Næste Skridt

1. **Tilføj autentificering** - OAuth/JWT login system\n\n2. **Real-time updates** - WebSocket integration for live dashboard\n\n3. **Avanceret routing** - React Router for multiple pages\n\n4. **Data fetching** - TanStack Query for caching\n\n5. **Formularer** - React Hook Form for kompleks form handling\n\n6. **Notifikationer** - Toast notifications for system events

## 🐛 Troubleshooting

### Port allerede i brug\n\nHvis port 5173 er optaget, kan du ændre den i `client/vite.config.ts`:\n\n```typescript\n\nserver: {
  port: 5174, // Ny port
  // ...
}\n\n```text\n\n\n### API proxy virker ikke\n\nSørg for at backend kører på `http://localhost:3000` før du starter frontend.

### TypeScript fejl\n\nKør `npm install` i `client/` mappen for at installere dependencies.
