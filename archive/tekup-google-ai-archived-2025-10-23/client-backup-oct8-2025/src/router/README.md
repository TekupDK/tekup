# 🚀 RenOS Router System

## Oversigt
RenOS bruger React Router v6 til client-side routing med en moderne arkitektur der understøtter:
- Nested routes
- Route guards
- Lazy loading
- TypeScript integration

## Struktur
```
router/
├── index.tsx      # Hovedrouter konfiguration
├── routes.tsx     # Route definitioner
├── guards.tsx     # Route guards og authentication
├── types.ts       # TypeScript interfaces
└── README.md      # Denne fil
```

## Brug

### Tilføj Ny Route
```typescript
// 1. Tilføj route i routes.tsx
{
  path: 'new-page',
  element: <NewPage />,
  title: 'Ny Side',
  protected: true
}

// 2. Opret komponent i pages/NewPage/
// 3. Tilføj til navigation i Layout.tsx
```

### Route Guards
```typescript
// Brug guards til beskyttelse
{
  path: 'admin',
  element: <AdminPage />,
  protected: true,
  roles: ['admin']
}
```

## API Reference

### RouteConfig Interface
```typescript
interface RouteConfig {
  path: string;           // Route path
  element: ReactNode;     // React komponent
  title: string;          // Side titel
  protected?: boolean;    // Kræver authentication
  roles?: string[];       // Krævede roller
  children?: RouteConfig[]; // Nested routes
}
```

### NavigationItem Interface
```typescript
interface NavigationItem {
  name: string;           // Display navn
  href: string;           // Route path
  icon: React.ComponentType; // Lucide ikon
  current?: boolean;      // Aktuel side
  badge?: string | number; // Badge tekst
}
```

## Eksempler

### Opret Beskyttet Route
```typescript
{
  path: 'settings',
  element: <Settings />,
  title: 'Indstillinger',
  protected: true,
  roles: ['admin', 'user']
}
```

### Opret Public Route
```typescript
{
  path: 'about',
  element: <About />,
  title: 'Om Os'
}
```

## Migration fra Gammel Struktur

### Før (State-based)
```typescript
const [currentPage, setCurrentPage] = useState('dashboard');
const renderPage = () => {
  switch (currentPage) {
    case 'dashboard': return <Dashboard />;
    // ...
  }
};
```

### Efter (Router-based)
```typescript
// I routes.tsx
{
  path: 'dashboard',
  element: <Dashboard />,
  title: 'Dashboard'
}
```

## Troubleshooting

### Common Issues
1. **Import fejl**: Sørg for korrekte relative paths
2. **Route ikke fundet**: Tjek path spelling
3. **Guard fejl**: Verificer authentication state

### Debug Tips
```typescript
// Tilføj console.log i guards
export const authGuard: RouteGuard = {
  canActivate: () => {
    const isAuth = checkAuth();
    console.log('Auth check:', isAuth);
    return isAuth;
  }
};
```

## Performance

### Lazy Loading
```typescript
// Lazy load komponenter
const LazyComponent = lazy(() => import('../pages/LazyPage'));
```

### Code Splitting
Router systemet understøtter automatisk code splitting gennem React.lazy().

## Sikkerhed

### Route Protection
- Alle protected routes kræver authentication
- Role-based access control
- Automatic redirect til login

### Best Practices
- Brug altid TypeScript interfaces
- Valider alle route parameters
- Test guards thoroughly
