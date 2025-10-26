# 🚀 RenOS - Rendetalje Management System

## Oversigt
RenOS er et moderne, React-baseret rendetalje management system med glassmorphism design og PWA capabilities. Systemet er bygget med moderne web teknologier og følger best practices for performance, sikkerhed og brugeroplevelse.

## ✨ Features

### 🎨 Design System
- **Glassmorphism UI** - Moderne transparent design
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** - Automatisk tema detection
- **Smooth Animations** - CSS transitions og transforms

### 🚀 Performance
- **Code Splitting** - Route-based lazy loading
- **PWA Support** - Offline functionality
- **Bundle Optimization** - Minimal bundle size
- **Caching Strategy** - Intelligent caching

### 🔐 Sikkerhed
- **Clerk Authentication** - Moderne auth system
- **Route Guards** - Beskyttede sider
- **Role-based Access** - Granular permissions
- **HTTPS Only** - Sikker kommunikation

### 📱 PWA Features
- **Offline Support** - Fungerer uden internet
- **Push Notifications** - Real-time updates
- **App Installation** - Native app experience
- **Background Sync** - Data synchronization

## 🏗️ Arkitektur

### Tech Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible components
- **Clerk** - Authentication
- **Lucide React** - Icons

### Mappestruktur
```
client/src/
├── components/           # Genbrugelige UI komponenter
├── pages/               # Side-specifikke komponenter
├── features/            # Feature-baserede moduler
├── router/              # Routing system
├── shared/              # Shared utilities
├── hooks/               # Custom React hooks
├── lib/                 # Library konfiguration
└── types/               # TypeScript definitions
```

## 🚀 Kom i Gang

### Prerequisites
- Node.js 18+
- npm eller yarn
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/renos.git
cd renos

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=https://api.renos.dk
```

## 📚 Dokumentation

### Core Documentation
- **[Arkitektur](ARCHITECTURE.md)** - System arkitektur og design
- **[Router System](router/README.md)** - Routing og navigation
- **[Migration Guide](MIGRATION.md)** - Migration fra gammel struktur
- **[PWA Setup](PWA_SETUP.md)** - Progressive Web App konfiguration
- **[Performance](PERFORMANCE.md)** - Performance optimization

### API Documentation
- **[API Reference](docs/api.md)** - API endpoints og types
- **[Component Library](docs/components.md)** - UI komponenter
- **[Hooks](docs/hooks.md)** - Custom React hooks
- **[Utils](docs/utils.md)** - Utility funktioner

## 🛠️ Udvikling

### Scripts
```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier

# Analysis
npm run analyze      # Bundle analysis
npm run lighthouse   # Performance audit
```

### Code Standards
- **TypeScript** - Strict mode enabled
- **ESLint** - Airbnb config
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Conventional Commits** - Commit messages

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request
# Review and merge
```

## 🧪 Testing

### Test Strategy
- **Unit Tests** - Jest + React Testing Library
- **Integration Tests** - API integration
- **E2E Tests** - Playwright
- **Performance Tests** - Lighthouse CI

### Running Tests
```bash
# All tests
npm run test

# Specific test file
npm run test Customer.test.tsx

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📦 Deployment

### Production Build
```bash
# Build application
npm run build

# Preview build
npm run preview

# Deploy to Vercel
vercel --prod
```

### Environment Variables
```bash
# Production
VITE_CLERK_PUBLISHABLE_KEY=prod_key
VITE_API_URL=https://api.renos.dk
VITE_ENVIRONMENT=production
```

## 🔧 Konfiguration

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        accent: '#8b5cf6',
        glass: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
};
```

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npm run type-check
```

#### Import Errors
```typescript
// Check path aliases
import { Component } from '@/components/Component';
// Not
import { Component } from '../../../components/Component';
```

#### Performance Issues
```bash
# Analyze bundle
npm run analyze

# Check Lighthouse
npm run lighthouse
```

### Debug Tips
- Use React DevTools Profiler
- Check Chrome DevTools Performance tab
- Monitor Network tab for slow requests
- Use Lighthouse for performance audit

## 🤝 Bidrag

### Contributing Guidelines
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Review Process
- Automated tests must pass
- Code review required
- Performance impact assessed
- Documentation updated

## 📄 Licens

MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 🆘 Support

### Hjælp og Support
- **GitHub Issues** - Bug reports og feature requests
- **Discord** - Community support
- **Email** - support@renos.dk
- **Documentation** - Se docs/ mappen

### Community
- **GitHub Discussions** - Q&A og diskussioner
- **Discord Server** - Real-time chat
- **Stack Overflow** - Tag: renos
- **Twitter** - @renos_dk

## 🗺️ Roadmap

### Q1 2024
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Real-time collaboration
- [ ] Advanced reporting

### Q2 2024
- [ ] AI integration
- [ ] Advanced automation
- [ ] Multi-tenant support
- [ ] Enterprise features

## 🙏 Tak

Tak til alle bidragydere og brugere af RenOS systemet.

---

**RenOS** - Moderne rendetalje management for det 21. århundrede 🚀
