# RenOS Frontend

> Modern React dashboard for Rendetalje.dk operations management

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com/)

## 🎯 Overview

RenOS Frontend er et moderne React dashboard til at administrere Rendetalje.dk's daglige operationer. Bygget med fokus på performance, developer experience, og brugervenlighed.

## 🚀 Tech Stack

- **Framework:** React 18 med TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router v6
- **Data Fetching:** TanStack Query (React Query)
- **State Management:** Zustand
- **HTTP Client:** Axios

## 📦 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/JonasAbde/renos-frontend.git
cd renos-frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env med backend URL

# Start dev server
npm run dev
```

Frontend kører nu på `http://localhost:5173`

## ⚙️ Configuration

### Environment Variables

Opret `.env` fil:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=RenOS
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=true
```

### Tailwind Configuration

Se `tailwind.config.js` for at tilpasse farver, fonts, og spacing.

## 📁 Projekt Struktur

```
src/
├── api/              # API client og HTTP requests
│   ├── client.ts     # Axios instance
│   └── hooks/        # TanStack Query hooks
├── components/       # Reusable UI komponenter
│   ├── ui/           # Basis UI komponenter (buttons, inputs, etc.)
│   └── layout/       # Layout komponenter (header, sidebar, etc.)
├── features/         # Feature-baserede modules
│   ├── dashboard/    # Dashboard views
│   ├── customers/    # Customer management
│   ├── bookings/     # Booking management
│   └── emails/       # Email management
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
├── types/            # TypeScript types
├── utils/            # Helper functions
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## 🛠️ Development

### Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

### API Integration

API client er konfigureret i `src/api/client.ts`:

```typescript
import { apiClient } from '@/api/client';

// Eksempel: Hent data
const response = await apiClient.get('/api/customers');

// Med TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['customers'],
  queryFn: () => apiClient.get('/api/customers'),
});
```

### State Management

Zustand stores i `src/stores/`:

```typescript
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

## 🎨 Styling

### Tailwind CSS

Brug Tailwind utility classes direkte i komponenter:

```tsx
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow">
  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
</div>
```

### Custom Colors

Definer custom farver i `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      brand: {
        500: '#0ea5e9',
        // ...
      },
    },
  },
}
```

## 🧪 Testing

```bash
# Run tests (når de er implementeret)
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📦 Build & Deploy

### Production Build

```bash
npm run build
```

Output i `dist/` folder.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## 🔄 Integration med Backend

Frontend kommunikerer med backend API via:

1. **API Client** (`src/api/client.ts`): Axios instance med auth interceptors
2. **TanStack Query**: Data fetching med caching og automatic refetching
3. **TypeScript Types**: Shared types mellem frontend og backend (sync manuelt eller via npm package)

Se backend repo for API dokumentation: [renos-backend](https://github.com/JonasAbde/renos-backend)

## 🚨 Common Issues

### 1. CORS Errors
- Backend skal have CORS konfigureret til at acceptere requests fra `http://localhost:5173`
- Se backend `src/index.ts` CORS config

### 2. API Connection Failed
- Check at backend kører på `http://localhost:3000`
- Verificer `VITE_API_URL` i `.env` fil

### 3. Tailwind Styles Not Working
- Kør `npm install` igen
- Check at `tailwind.config.js` indeholder korrekt `content` paths

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

Se `CONTRIBUTING.md` for contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- **Jonas Abde** - *Initial work* - [JonasAbde](https://github.com/JonasAbde)

---

**Note**: Dette er frontend dashboard'et. For backend API, see [renos-backend](https://github.com/JonasAbde/renos-backend).
