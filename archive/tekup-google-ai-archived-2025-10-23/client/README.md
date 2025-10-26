# RenOS Client

Frontend dashboard til RenOS - Rendetalje Operating System.

## Teknologi Stack

- **React 18** - UI framework\n\n- **TypeScript** - Type safety\n\n- **Vite** - Build tool\n\n- **TailwindCSS** - Styling\n\n- **Lucide React** - Icons

## Installation

```powershell
cd client
npm install\n\n```text\n\n\n## Udvikling

Start udviklings-serveren (med API proxy til backend):

```powershell
npm run dev\n\n```text\n
Åbner på `http://localhost:5173`

API-kald til `/api/*` proxies automatisk til backend på `http://localhost:3000`

## Build

```powershell
npm run build\n\n```text\n
Output placeres i `dist/` mappen.

## Funktioner

### Dashboard\n\n- Overblik over leads, bookinger og statistik\n\n- Real-time aktivitetslog\n\n- Hurtige handlinger

### Chat Interface\n\n- AI-drevet chat med RenOS backend\n\n- Real-time kommunikation med `/api/chat` endpoint\n\n- Intent classification og execution feedback

## Struktur

```\n\nsrc/
├── components/
│   ├── ui/          # Genbrugelige UI komponenter\n\n│   ├── Dashboard.tsx\n\n│   └── ChatInterface.tsx
├── lib/
│   └── utils.ts     # Helper funktioner\n\n├── App.tsx          # Hovedkomponent\n\n├── main.tsx         # Entry point\n\n└── index.css        # Global styles\n\n```text\n

<!-- Force redeploy 10/06/2025 23:00:21 for SPA routing fix -->
# Deployment trigger - Dashboard upgrade 2025-10-08 16:59
