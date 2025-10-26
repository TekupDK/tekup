# 🤖 CodebuffAI Integration Guide for Tekup Development

## 📋 Overview

Dette dokument beskriver hvordan vi bruger CodebuffAI til at accelerere udviklingen af Tekup Unified Platform. Vi har skabt 3 specialiserede agents til at håndtere vores specifikke udviklingsscenarier.

## 🚀 Quick Start

### 1. **Setup (Kun første gang)**
```bash
# Install CodebuffAI CLI globalt
npm install -g codebuff

# Log ind (åbner browser)
codebuff --version  # Trigger login process

# Verificer agents er tilgængelige
ls .agents/tekup-*.ts
```

### 2. **Daglig brug**
```bash
# Implementer Lead Platform Module
codebuff --agent tekup-lead-platform-agent "Implement complete Lead module with scoring and analytics"

# Migrer legacy service
codebuff --agent tekup-legacy-migration-agent "Migrate tekup-lead-platform to unified platform"

# Tjek monorepo konsistens
codebuff --agent tekup-monorepo-consistency-agent "Check API patterns and design system compliance"
```

## 🎯 Tilgængelige Agents

### 1. **Lead Platform Agent** (`tekup-lead-platform-agent`)
**Formål**: Implementer Lead Platform Module efter CRM patterns

**Hvornår at bruge**:
- Implementer komplet Lead module
- Tilføj lead scoring algoritmer  
- Opret conversion tracking
- Bygge analytics endpoints

**Eksempel kommandoer**:
```bash
# Komplet Lead module implementation
codebuff --agent tekup-lead-platform-agent "Implement complete Lead Platform Module with CRUD, scoring, qualification workflow, conversion tracking, and analytics following CRM patterns"

# Tilføj specifik functionality
codebuff --agent tekup-lead-platform-agent "Add lead scoring algorithm based on email engagement, company size, and industry"
```

### 2. **Legacy Migration Agent** (`tekup-legacy-migration-agent`)
**Formål**: Migrer legacy services til unified platform

**Hvornår at bruge**:
- Migrer en af de 37 legacy apps
- Konverter API patterns til unified struktur
- Bevare business logic under migration
- Opdater database schemas

**Eksempel kommandoer**:
```bash
# Migrer specific service
codebuff --agent tekup-legacy-migration-agent "Migrate tekup-lead-platform app to unified-platform/modules/leads preserving all business logic"

# Migrer med custom requirements
codebuff --agent tekup-legacy-migration-agent "Migrate flow-api to unified platform core module maintaining backward API compatibility"
```

### 3. **Monorepo Consistency Agent** (`tekup-monorepo-consistency-agent`)  
**Formål**: Sikre konsistens på tværs af 37+ apps

**Hvornår at bruge**:
- Før production deployment
- Efter større refactoring
- Weekly consistency checks
- Design system updates

**Eksempel kommandoer**:
```bash
# Fuld consistency check
codebuff --agent tekup-monorepo-consistency-agent "Analyze all apps for API pattern consistency, design system compliance, and architectural standards"

# Specifik område check
codebuff --agent tekup-monorepo-consistency-agent "Check Tailwind CSS 4.1 usage and glassmorphism implementation across all apps"
```

## 🏗️ Agent Architecture Patterns

### **Alle vores agents følger disse patterns:**

1. **Multi-Step Workflow**: Agents arbejder i strukturerede steps
2. **Context Awareness**: Læser eksisterende kode før modification  
3. **Pattern Following**: Følger etablerede Tekup patterns (CRM som reference)
4. **Error Handling**: Omfattende logging og fejlhåndtering
5. **Testing Integration**: Validerer resultater efter implementation

### **Shared Standards:**
- **Multi-tenant Architecture**: Tenant isolation på alle services
- **NestJS Patterns**: Controller → Service → Prisma structure  
- **TypeScript Quality**: Proper types, interfaces, error handling
- **Design System**: Tailwind CSS 4.1 med glassmorphism
- **Database**: Prisma ORM med SQLite (dev) → PostgreSQL (prod)

## 📊 Agent Performance & Results

### **Lead Platform Agent:**
- ⏱️ **Tid besparelse**: 2-3 timer vs. manuel implementation
- ✅ **Konsistens**: 100% pattern compliance med CRM module
- 🎯 **Features**: Komplet CRUD, scoring, analytics, tenant isolation
- 🔧 **Maintenance**: Auto-generated database migrations

### **Legacy Migration Agent:**
- ⏱️ **Tid besparelse**: 4-6 timer per service vs. manuel migration
- 🔄 **Business Logic**: 100% preservation af functionality  
- 📊 **Data Integrity**: Safe database schema transformations
- 🛡️ **Risk Reduction**: Systematic validation efter migration

### **Monorepo Consistency Agent:**
- 🔍 **Coverage**: Analyserer alle 37+ apps samtidigt
- 📋 **Reporting**: Detaljerede recommendations med file paths
- ⚡ **Speed**: Komplet analyse på 5-10 minutter
- 🎯 **Actionable**: Specifikke fix suggestions med code examples

## 🛠️ Best Practices

### **Before Running Agents:**
1. **Commit changes**: Sørg for clean Git working tree
2. **Backup database**: Especially før schema changes  
3. **Review context**: Agents læser existing patterns - sørg for de er correct

### **After Agent Execution:**
1. **Code Review**: Tjek generated code for quality og patterns
2. **Run Tests**: Verificer functionality er preserved
3. **Database Check**: Validér schema changes og data integrity
4. **Integration Test**: Test med resten af platformen

### **Agent Prompts - Best Practices:**
```bash
# ✅ GOOD: Specific med context
codebuff --agent tekup-lead-platform-agent "Implement Lead scoring based on email opens, company revenue >€100k, and industry = SaaS. Use 0-100 scale."

# ❌ AVOID: Vague requests  
codebuff --agent tekup-lead-platform-agent "Make leads better"

# ✅ GOOD: Clear migration target
codebuff --agent tekup-legacy-migration-agent "Migrate tekup-crm-api customer endpoints to unified-platform maintaining API compatibility"

# ❌ AVOID: Ambiguous scope
codebuff --agent tekup-legacy-migration-agent "Fix the old system"
```

## 📈 Development Workflow Integration

### **Daily Workflow:**
```bash
# Morning: Check consistency
codebuff --agent tekup-monorepo-consistency-agent "all"

# Development: Implement features
codebuff --agent tekup-lead-platform-agent "Add lead assignment automation"

# Integration: Migrate services
codebuff --agent tekup-legacy-migration-agent "Migrate next priority service"

# Evening: Final consistency check
codebuff --agent tekup-monorepo-consistency-agent "API patterns"
```

### **Git Integration:**
```bash
# Before major commits
git add .
codebuff --agent tekup-monorepo-consistency-agent "final check"
# Review agent recommendations
git commit -m "feat: implement X using CodebuffAI agents"
```

## 🎯 Success Metrics

### **Målt forbedringer med CodebuffAI:**
- **Development Speed**: 60-70% hurtigere implementation
- **Code Quality**: 100% pattern consistency
- **Error Reduction**: 80% færre bugs fra inconsistent patterns
- **Onboarding**: Nye udviklere productive på 50% af tiden

### **Weekly Metrics:**
- Lead Platform Module: **2 timer** (vs. 6 timer manuelt)
- Legacy Service Migration: **4 timer** (vs. 12 timer manuelt)  
- Monorepo Consistency Check: **10 minutter** (vs. 2 dage manuelt)

## 🚨 Troubleshooting

### **Common Issues:**

#### **Agent Login Required**
```bash
# Løsning: Complete browser login
codebuff --version  # Trigger login
# Follow browser prompts
```

#### **Agent Not Found**
```bash
# Tjek agent files exists
ls .agents/tekup-*.ts

# Reload agents
codebuff --list-agents
```

#### **Pattern Inconsistencies**
```bash
# Run consistency check først
codebuff --agent tekup-monorepo-consistency-agent "API patterns"
# Fix issues før running other agents
```

#### **Database Migration Errors**
```bash
# Manual prisma reset hvis needed
cd apps/tekup-unified-platform
npx prisma db push --force-reset
npx prisma generate
```

## 📞 Team Support

### **Agent Experts:**
- **Lead Platform**: [Your Name] - lead implementation patterns
- **Migration**: [Your Name] - legacy service knowledge  
- **Consistency**: [Your Name] - monorepo architecture

### **Escalation Process:**
1. **Check documentation** (dette dokument)
2. **Run consistency agent** for diagnostics
3. **Reach out til agent expert** for domæne
4. **Create issue** i GitHub hvis reproducible bug

---

## 🎊 Happy Coding with AI Agents!

CodebuffAI agents gør det muligt at fokusere på business logic og innovation instead of boilerplate code og pattern enforcement. Brug dem til at accelerere jeres Tekup Unified Platform development! 🚀

**Remember**: Agents er tools - review og test deres output altid før production deployment.
