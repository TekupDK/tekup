# 🚀 RendetaljeOS Team Production Guide

**Production-klar workspace til Rendetalje.dk teamet**

## 📋 Quick Start for Team

### 1. Åbn Production Workspace
```bash
# Åbn VS Code med team workspace
code RendetaljeOS-Team-Production.code-workspace
```

### 2. Install Dependencies
```bash
# Install alle dependencies
npm run setup

# Eller individuelt
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../shared && npm install
```

### 3. Environment Setup
```bash
# Backend environment
cp backend/.env.example backend/.env
# Rediger backend/.env med production credentials

# Frontend environment  
cp frontend/.env.example frontend/.env
# Rediger frontend/.env med production URLs
```

### 4. Start Development
```bash
# Start alle services
npm run dev

# Eller brug VS Code task: Ctrl+Shift+P -> "Tasks: Run Task" -> "🚀 Start Development"
```

## 🌐 Production URLs

### Live System
- **Owner Portal**: https://rendetaljeos.onrender.com/owner
- **Employee Portal**: https://rendetaljeos.onrender.com/employee  
- **Customer Portal**: https://rendetaljeos.onrender.com/customer
- **API**: https://rendetaljeos-api.onrender.com
- **API Docs**: https://rendetaljeos-api.onrender.com/api/docs

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs

## 👥 Team Roller og Adgang

### Owner (Ejer)
- **Adgang**: Fuld systemadgang til alle portaler
- **Features**: 
  - Business dashboard med KPIs
  - Customer management
  - Team performance analytics
  - Financial reporting
  - AI Friday assistant

### Admin (Administrator)
- **Adgang**: Administrativ adgang til owner og employee portaler
- **Features**:
  - Job scheduling og management
  - Team coordination
  - Quality control
  - Customer support

### Employee (Medarbejder)
- **Adgang**: Employee portal og mobile app
- **Features**:
  - Daily job assignments
  - Time tracking
  - Job checklists
  - Photo documentation
  - Route optimization

### Customer (Kunde)
- **Adgang**: Customer portal
- **Features**:
  - Online booking
  - Service history
  - Invoice access
  - Direct messaging
  - Rating system

## 🛠️ Development Workflow

### 1. Feature Development
```bash
# Opret feature branch
git checkout -b feature/ny-feature

# Udvikl feature
# ... kod arbejde ...

# Test feature
npm run test
npm run lint

# Commit og push
git add .
git commit -m "feat: tilføj ny feature"
git push origin feature/ny-feature

# Opret Pull Request
```

### 2. Code Quality
```bash
# Lint og format kode
npm run lint

# Run tests
npm run test

# Type check
cd frontend && npm run type-check
cd backend && npm run build
```

### 3. VS Code Tasks
Brug `Ctrl+Shift+P` og søg efter "Tasks: Run Task":
- 🚀 Start Development
- 🏗️ Build Production  
- 🧪 Run Tests
- 🔍 Lint & Format
- 🐳 Docker Development

## 🔧 Debugging

### Backend Debugging
1. Åbn VS Code
2. Gå til Run and Debug (Ctrl+Shift+D)
3. Vælg "🔧 Debug Backend"
4. Tryk F5 for at starte debugging

### Frontend Debugging
1. Åbn VS Code
2. Gå til Run and Debug (Ctrl+Shift+D)  
3. Vælg "🌐 Debug Frontend"
4. Tryk F5 for at starte debugging

## 📱 Mobile App Development

### Setup React Native
```bash
# Install Expo CLI
npm install -g @expo/cli

# Start mobile development
cd mobile
npm install
expo start
```

### Testing på Device
1. Install Expo Go app på din telefon
2. Scan QR koden fra Expo development server
3. Test app funktionalitet

## 🗄️ Database Management

### Supabase Dashboard
- **URL**: https://supabase.com/dashboard
- **Project**: rendetaljeos-production

### Local Database
```bash
# Start local Supabase
cd database
supabase start

# Reset database
supabase db reset

# Apply migrations
supabase db push
```

## 🔌 API Integration Testing

### Tekup-Billy Integration
```bash
# Test Billy.dk integration
curl -X POST http://localhost:3001/api/v1/integrations/billy/test
```

### TekupVault Integration  
```bash
# Test knowledge search
curl -X POST http://localhost:3001/api/v1/integrations/tekupvault/search \
  -H "Content-Type: application/json" \
  -d '{"query": "cleaning procedures"}'
```

### AI Friday Integration
```bash
# Test AI Friday chat
curl -X POST http://localhost:3001/api/v1/ai-friday/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad er dagens opgaver?", "context": "employee"}'
```

## 🚀 Deployment Process

### Automatic Deployment
- **Trigger**: Push til `main` branch
- **Platform**: Render.com
- **Process**: GitHub Actions CI/CD pipeline

### Manual Deployment
```bash
# Build production
npm run build

# Deploy til Render
git push origin main
```

### Environment Variables
Sørg for at følgende environment variables er sat i Render.com:

#### Backend
- `DATABASE_URL`: Supabase connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `JWT_SECRET`: JWT signing secret
- `TEKUP_BILLY_URL`: Billy integration URL
- `TEKUPVAULT_URL`: TekupVault integration URL
- `AI_FRIDAY_URL`: AI Friday chat URL

#### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## 🧪 Testing Strategy

### Unit Tests
```bash
# Backend unit tests
cd backend && npm run test

# Frontend unit tests  
cd frontend && npm run test
```

### Integration Tests
```bash
# End-to-end tests
cd backend && npm run test:e2e

# API integration tests
npm run test:integration
```

### Manual Testing Checklist
- [ ] Owner portal dashboard loads
- [ ] Employee can log time
- [ ] Customer can book service
- [ ] AI Friday responds correctly
- [ ] Mobile app syncs data
- [ ] Invoices generate via Billy
- [ ] Real-time updates work

## 📊 Monitoring & Analytics

### Production Monitoring
- **Error Tracking**: Sentry integration
- **Performance**: Core Web Vitals
- **Uptime**: Render.com health checks
- **Logs**: Structured logging med correlation IDs

### Business Analytics
- **KPIs**: Revenue, jobs completed, customer satisfaction
- **Team Performance**: Time tracking, efficiency metrics
- **Customer Insights**: Booking patterns, service preferences

## 🆘 Troubleshooting

### Common Issues

#### "Cannot connect to database"
```bash
# Check Supabase connection
cd backend
npm run test:db-connection
```

#### "Frontend won't start"
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

#### "API integration failing"
```bash
# Check service health
curl http://localhost:3001/api/v1/health
```

### Support Contacts
- **Technical Lead**: [navn]@rendetalje.dk
- **DevOps**: [navn]@rendetalje.dk  
- **Business Owner**: [navn]@rendetalje.dk

## 📚 Documentation Links

- [API Documentation](http://localhost:3001/api/docs)
- [Database Schema](./database/README.md)
- [Frontend Components](./frontend/src/components/README.md)
- [Integration Guides](./docs/integrations/)
- [Deployment Guide](./docs/deployment.md)

## 🔄 Regular Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor system performance
- [ ] Review customer feedback

### Weekly  
- [ ] Update dependencies
- [ ] Run security scans
- [ ] Backup database
- [ ] Review analytics

### Monthly
- [ ] Performance optimization
- [ ] Security audit
- [ ] Team training updates
- [ ] Feature planning

---

**RendetaljeOS Production Team** 🧹✨  
*Powering efficient cleaning operations for Rendetalje.dk*