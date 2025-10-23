# RenOS Calendar Intelligence Dashboard

Mobile-first PWA dashboard til RenOS Calendar Intelligence MCP.

## Features

✅ **Real-time Dashboard**
- I dag's bookinger
- Manglende fakturaer
- Overtids-alerts
- Profit tracking

✅ **Mobile PWA**
- Installérbar på mobil
- Offline support
- Push notifications (upcoming)
- Native feel

✅ **Quick Actions**
- Opret ny booking
- Generer fakturaer
- Se kunder
- Statistik

## Setup

```bash
cd dashboard
npm install
npm run dev
```

Åbn http://localhost:5173

## Build Production

```bash
npm run build
```

Output i `dist/` folder - klar til deployment på Render.com eller Vercel.

## Deploy til Vercel

```bash
npm install -g vercel
vercel --prod
```

## Environment Variables

Opret `.env`:

```bash
VITE_API_URL=https://renos-calendar-mcp.onrender.com
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Vite PWA** - Progressive Web App
- **Axios** - HTTP client
- **date-fns** - Date formatting

