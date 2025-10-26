# 🏗️ RenOS Arkitektur Dokumentation

## Oversigt
RenOS er et moderne React-baseret rendetalje management system med en skalerbar arkitektur der understøtter:
- Component-based design
- Feature-based organization
- Modern routing
- PWA capabilities
- Glassmorphism design system

## Mappestruktur

```
client/src/
├── components/           # Genbrugelige UI komponenter
│   ├── ui/              # Base UI komponenter (Radix UI)
│   ├── Layout.tsx       # Hovedlayout med navigation
│   └── ...              # Andre shared komponenter
├── pages/               # Side-specifikke komponenter
│   ├── Dashboard/       # Dashboard side
│   ├── Customers/       # Kunder side
│   ├── Leads/          # Leads side
│   ├── Bookings/       # Bookinger side
│   ├── Quotes/         # Tilbud side
│   ├── Analytics/      # Analytics side
│   ├── Services/       # Services side
│   └── Settings/       # Indstillinger side
├── features/           # Feature-baserede moduler
│   ├── auth/           # Authentication logic
│   ├── customers/      # Customer management
│   ├── leads/          # Lead management
│   └── shared/         # Shared feature logic
├── router/             # Routing system
│   ├── index.tsx       # Router konfiguration
│   ├── routes.tsx      # Route definitioner
│   ├── guards.tsx      # Route guards
│   └── types.ts        # Router types
├── shared/             # Shared utilities
│   ├── api/            # API klienter
│   ├── types/          # Global types
│   └── utils/          # Utility funktioner
├── hooks/              # Custom React hooks
├── lib/                # Library konfiguration
└── types/              # TypeScript type definitions
```

## Design System

### Glassmorphism Design
RenOS bruger et moderne glassmorphism design system med:
- Transparente kort med blur effekter
- Konsistent farvepalette
- Responsive design
- Dark/light mode support

### Farvepalette
```css
:root {
  --primary: #3b82f6;        /* Blå */
  --accent: #8b5cf6;         /* Lilla */
  --success: #10b981;        /* Grøn */
  --warning: #f59e0b;        /* Orange */
  --destructive: #ef4444;    /* Rød */
  --glass: rgba(255, 255, 255, 0.1);
  --glass-hover: rgba(255, 255, 255, 0.2);
}
```

### Komponent Klasser
```css
.glass-card {
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.glass-hover {
  transition: all 0.3s ease;
}

.glass-hover:hover {
  background: var(--glass-hover);
  transform: translateY(-2px);
}
```

## Routing Arkitektur

### Router System
- **React Router v6** for client-side routing
- **Nested routes** for bedre organization
- **Route guards** for authentication
- **Lazy loading** for performance

### Route Struktur
```typescript
/                    # Dashboard (beskyttet)
/customers          # Kunder (beskyttet)
/leads              # Leads (beskyttet)
/bookings           # Bookinger (beskyttet)
/quotes             # Tilbud (beskyttet)
/analytics          # Analytics (beskyttet)
/services           # Services (beskyttet)
/settings           # Indstillinger (beskyttet)
```

## State Management

### Lokal State
- **useState** for komponent-specifik state
- **useReducer** for kompleks state logic
- **Custom hooks** for genbrugelig state logic

### Global State (Fremtidig)
- **Zustand** for global state management
- **React Query** for server state
- **Context API** for theme og settings

## API Integration

### API Struktur
```typescript
// API klient
const api = {
  customers: {
    getAll: () => fetch('/api/customers'),
    create: (data) => fetch('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetch(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetch(`/api/customers/${id}`, { method: 'DELETE' })
  }
};
```

### Error Handling
- Global error boundary
- API error handling
- User-friendly error messages
- Retry logic for failed requests

## Performance

### Code Splitting
- Route-based code splitting
- Lazy loading af komponenter
- Dynamic imports

### Optimization
- React.memo for komponenter
- useMemo for expensive calculations
- useCallback for event handlers
- Virtual scrolling for store lister

## Sikkerhed

### Authentication
- **Clerk** for user authentication
- JWT tokens for API calls
- Role-based access control

### Route Protection
- Protected routes kræver authentication
- Role-based route access
- Automatic redirect til login

## PWA Features

### Service Worker
- Offline support
- Background sync
- Push notifications

### Manifest
- App metadata
- Icon definitions
- Theme colors
- Display modes

## Testing Strategy

### Unit Tests
- Jest for test runner
- React Testing Library for komponent tests
- Custom hooks testing

### Integration Tests
- API integration tests
- User flow tests
- E2E tests med Playwright

## Deployment

### Build Process
- Vite for bundling
- TypeScript compilation
- CSS optimization
- Asset optimization

### Environment
- Development: Local Vite server
- Staging: Vercel preview
- Production: Vercel deployment

## Udvikling

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Husky for git hooks

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Semantic versioning

## Skalering

### Fremtidige Forbedringer
- Micro-frontend architecture
- Server-side rendering (SSR)
- Edge computing
- Real-time updates

### Performance Monitoring
- Web Vitals tracking
- Error monitoring
- User analytics
- Performance budgets
