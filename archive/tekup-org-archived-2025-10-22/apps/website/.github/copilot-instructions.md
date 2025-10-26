# Copilot Instructions for TekUp Website

## Project Overview
TekUp is a React 18 + Vite + TypeScript web application built with a modular component architecture. This is a "cleaned" version that resolves previous "white screen" and layout-locking issues by removing service worker interference in development and simplifying CSS complexity.

## Tech Stack & Key Dependencies
- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.20 (custom config with enhanced HMR)
- **Styling**: Tailwind CSS 4.1.13 + shadcn/ui components
- **State**: @tanstack/react-query for server state
- **Routing**: React Router DOM 6.30.1
- **UI Components**: Radix UI primitives + custom components

## Architecture Patterns

### Component Organization
```
src/components/
├── ui/           # shadcn/ui base components (button, card, etc.)
├── TekUp2025*    # Main application components (modular sections)
├── *Section.tsx  # Landing page sections (Hero, About, Contact)
├── tools/        # CSS development tools components
└── *.tsx         # Standalone utility components (PWA, Chat, etc.)
```

### Key Components
- `TekUp2025Complete.tsx`: Main app wrapper with internal routing
- `TekUp2025Navigation/Hero/Dashboard/Footer.tsx`: Core app sections
- `PWAUpdateManager.tsx`: Production-only PWA update handling
- CSS dev tools: `CSSDevToolsController`, `FlexboxDebugger`, `CSSGridInspector`

## Development Workflow

### Critical Development Rules
1. **PWA disabled in dev**: Service worker only loads in production to prevent cache conflicts
2. **Port 3001**: Development server runs on localhost:3001 (not 3000)
3. **No complex CSS effects in dev**: backdrop-filter, complex box-shadows removed for stability
4. **Enhanced HMR**: Custom CSS injection middleware for instant Tailwind updates

### Build & Development Commands
```bash
npm run dev        # Development server (port 3001)
npm run build      # Production build
npm run build:dev  # Development build
```

### VS Code Tasks Available
- "Start Development Server" (auto-runs on folder open)
- "Build CSS", "Watch CSS", "Lint CSS"
- "Start Live Server" for testing builds
- CSS analysis and performance audit tasks

## CSS & Styling Conventions

### Tailwind Configuration
- **Design System**: CSS variables in HSL format (`hsl(var(--primary))`)
- **Custom Fonts**: Orbitron (monospace), Inter (sans-serif)
- **Color Tokens**: Extended primary/secondary with glow variants
- **Content Paths**: `./src/**/*.{ts,tsx}`, `./index.html`

### Component Styling Patterns
```tsx
// Standard className composition using cn() utility
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  "responsive-classes",
  conditionalClass && "conditional-classes",
  className // Allow prop override
)} />
```

### CSS Development Tools
- Live editing playground with real-time preview
- Flexbox/Grid visual debuggers
- Color palette manager with HSL variable editing
- Performance analyzer for CSS bundle size

## Aliases & Imports
```typescript
"@/*"              → "./src/*"
"@tekup/shared/*"  → "../../packages/shared/src/*"
```

## Docker & Deployment
- Development: `docker-compose up` (port 8080)
- Hot reload volumes mounted for `/src`, `/public`, config files
- Environment: `NODE_ENV=development`, `CHOKIDAR_USEPOLLING=true`

## PowerShell Scripts
- `live-edit.ps1`: Multi-browser launch with device emulation
- `css-dev-manager.ps1`: CSS development workflow automation
- Docker management scripts: `docker-up.ps1`, `docker-down.ps1`

## PWA Implementation
- **Development**: PWA features completely disabled
- **Production**: Dynamic manifest registration, update manager UI
- Service worker at `/sw.prod.js` with offline caching
- Icons generated programmatically (see `generate-icons.js`)

## Common Patterns

### Error Boundaries
```tsx
// PWA initialization pattern
useEffect(() => {
  if (import.meta.env.PROD) {
    import('./utils/pwa').then(({ initializePWA }) => {
      initializePWA();
    }).catch(console.error);
  }
}, []);
```

### State Management
- React Query for server state and caching
- Local state with useState/useEffect
- No global state management (Redux/Zustand)

### CSS Variable Usage
```css
/* Use HSL variables with fallbacks */
color: hsl(var(--primary));
background: hsl(var(--background));
```

## Troubleshooting Notes
- **White screen issues**: Usually PWA/SW interference - ensure SW disabled in dev
- **CSS not updating**: Check Tailwind content paths, restart dev server
- **Port conflicts**: App uses 3001, HMR uses 24678
- **Docker issues**: Use provided PowerShell scripts for consistent environment