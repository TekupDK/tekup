# RendetaljeOS Deployment Guide

## Overview

This guide covers the deployment of RendetaljeOS to production environments using Render.com for hosting and Supabase for database services.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Supabase)    │
│   Render.com    │    │   Render.com    │    │   Cloud         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Redis Cache   │    │   File Storage  │
│   (Expo/RN)     │    │   Render.com    │    │   Supabase      │
│   EAS Build     │    │                 │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Accounts
- [Render.com](https://render.com) account
- [Supabase](https://supabase.com) account
- [GitHub](https://github.com) repository
- [Expo](https://expo.dev) account (for mobile app)

### Required Tools
- Node.js 18+ and npm
- Git
- Docker (for local development)
- Expo CLI (for mobile deployment)

## Environment Setup

### Environment Variables

Create the following environment files:

#### Backend (.env.production)
```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/[database]
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-key]

# Authentication
JWT_SECRET=[generate-strong-secret]
JWT_EXPIRES_IN=7d

# Redis Cache
REDIS_URL=redis://[username]:[password]@[host]:[port]

# External Services
BILLY_API_KEY=[billy-api-key]
BILLY_API_URL=https://api.billy.dk/v2
TEKUP_VAULT_URL=[tekup-vault-url]
TEKUP_VAULT_API_KEY=[api-key]
AI_FRIDAY_URL=[friday-api-url]
AI_FRIDAY_API_KEY=[friday-api-key]

# File Storage
SUPABASE_STORAGE_BUCKET=rendetalje-files

# Email
SMTP_HOST=[smtp-host]
SMTP_PORT=587
SMTP_USER=[smtp-username]
SMTP_PASS=[smtp-password]
FROM_EMAIL=noreply@rendetalje.dk

# Monitoring
SENTRY_DSN=[sentry-dsn]
LOG_LEVEL=info

# Security
ENCRYPTION_KEY=[32-byte-hex-key]
CORS_ORIGIN=https://portal.rendetalje.dk,https://kunde.rendetalje.dk

# Rate Limiting
RATE_LIMIT_TTL=3600
RATE_LIMIT_LIMIT=1000
```

#### Frontend (.env.production)
```bash
# API
NEXT_PUBLIC_API_URL=https://api.rendetalje.dk
NEXT_PUBLIC_WS_URL=wss://api.rendetalje.dk

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[google-maps-key]

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=[google-analytics-id]
NEXT_PUBLIC_HOTJAR_ID=[hotjar-id]

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FRIDAY=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true

# CDN
NEXT_PUBLIC_CDN_URL=https://cdn.rendetalje.dk
```

## Database Setup

### Supabase Configuration

1. **Create Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Initialize project
   supabase init
   ```

2. **Run Database Migrations**
   ```bash
   # Apply all migrations
   supabase db push
   
   # Or run individual migration files
   psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
   psql $DATABASE_URL -f database/migrations/002_add_indexes.sql
   # ... continue for all migration files
   ```

3. **Setup Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
   -- ... continue for all tables
   
   -- Apply RLS policies (see database/security/rls_policies.sql)
   ```

4. **Configure Storage Buckets**
   ```sql
   -- Create storage buckets
   INSERT INTO storage.buckets (id, name, public) VALUES 
   ('job-photos', 'job-photos', false),
   ('customer-documents', 'customer-documents', false),
   ('system-assets', 'system-assets', true);
   
   -- Set up storage policies
   CREATE POLICY "Users can upload job photos" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'job-photos' AND auth.role() = 'authenticated');
   ```

## Backend Deployment

### Render.com Web Service

1. **Create Web Service**
   - Connect GitHub repository
   - Select `backend` as root directory
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

2. **Configure Environment Variables**
   Add all production environment variables in Render dashboard

3. **Health Check Endpoint**
   ```typescript
   // Add to main.ts or health controller
   @Get('/health')
   healthCheck() {
     return {
       status: 'ok',
       timestamp: new Date().toISOString(),
       version: process.env.npm_package_version
     };
   }
   ```

4. **Dockerfile (Optional)**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "run", "start:prod"]
   ```

### Redis Cache Setup

1. **Create Redis Service on Render**
   - Add Redis service
   - Note connection URL
   - Configure in backend environment variables

2. **Redis Configuration**
   ```typescript
   // redis.config.ts
   export const redisConfig = {
     host: process.env.REDIS_HOST,
     port: parseInt(process.env.REDIS_PORT),
     password: process.env.REDIS_PASSWORD,
     retryDelayOnFailover: 100,
     maxRetriesPerRequest: 3,
   };
   ```

## Frontend Deployment

### Next.js on Render.com

1. **Create Static Site**
   - Connect GitHub repository
   - Select `frontend` as root directory
   - Build Command: `npm install && npm run build`
   - Publish Directory: `out` (for static export) or `dist`

2. **Build Configuration**
   ```javascript
   // next.config.js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export', // For static hosting
     trailingSlash: true,
     images: {
       unoptimized: true, // Required for static export
       domains: ['supabase.co', 'cdn.rendetalje.dk']
     },
     env: {
       CUSTOM_KEY: process.env.CUSTOM_KEY,
     },
   };
   
   module.exports = nextConfig;
   ```

3. **Custom Domain Setup**
   - Add custom domain in Render dashboard
   - Configure DNS records:
     ```
     portal.rendetalje.dk CNAME your-app.onrender.com
     kunde.rendetalje.dk CNAME your-customer-app.onrender.com
     ```

## Mobile App Deployment

### Expo Application Services (EAS)

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   eas login
   ```

2. **Configure EAS Build**
   ```json
   // eas.json
   {
     "cli": {
       "version": ">= 5.4.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "aab"
         }
       }
     },
     "submit": {
       "production": {
         "android": {
           "serviceAccountKeyPath": "./google-service-account.json",
           "track": "internal"
         }
       }
     }
   }
   ```

3. **Build and Deploy**
   ```bash
   # Build for production
   eas build --platform android --profile production
   
   # Submit to Google Play Store
   eas submit --platform android --profile production
   ```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm run test
          cd ../frontend && npm run test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: render-deploy/github-action@v1
        with:
          service-id: ${{ secrets.RENDER_BACKEND_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: render-deploy/github-action@v1
        with:
          service-id: ${{ secrets.RENDER_FRONTEND_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  build-mobile:
    needs: test
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[mobile]')
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build mobile app
        run: |
          cd RendetaljeOS-Mobile
          npm ci
          eas build --platform android --profile production --non-interactive
```

## Monitoring and Logging

### Application Monitoring

1. **Sentry Setup**
   ```typescript
   // Backend: main.ts
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

   ```typescript
   // Frontend: _app.tsx
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
   });
   ```

2. **Health Checks**
   ```typescript
   // health.controller.ts
   @Controller('health')
   export class HealthController {
     @Get()
     async check() {
       return {
         status: 'ok',
         timestamp: new Date().toISOString(),
         database: await this.checkDatabase(),
         redis: await this.checkRedis(),
         external: await this.checkExternalServices()
       };
     }
   }
   ```

3. **Logging Configuration**
   ```typescript
   // logger.config.ts
   import { WinstonModule } from 'nest-winston';
   import * as winston from 'winston';
   
   export const loggerConfig = WinstonModule.createLogger({
     transports: [
       new winston.transports.Console({
         format: winston.format.combine(
           winston.format.timestamp(),
           winston.format.json()
         )
       }),
       new winston.transports.File({
         filename: 'logs/error.log',
         level: 'error'
       })
     ]
   });
   ```

## Security Configuration

### SSL/TLS Setup

1. **Render.com automatically provides SSL certificates**
2. **Force HTTPS redirects**
   ```typescript
   // main.ts
   app.use((req, res, next) => {
     if (req.header('x-forwarded-proto') !== 'https') {
       res.redirect(`https://${req.header('host')}${req.url}`);
     } else {
       next();
     }
   });
   ```

### Security Headers

```typescript
// security.middleware.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Backup and Recovery

### Database Backups

1. **Automated Supabase Backups**
   - Supabase provides automatic daily backups
   - Configure retention period in dashboard

2. **Manual Backup Script**
   ```bash
   #!/bin/bash
   # backup.sh
   
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="backup_${DATE}.sql"
   
   pg_dump $DATABASE_URL > $BACKUP_FILE
   
   # Upload to cloud storage
   aws s3 cp $BACKUP_FILE s3://rendetalje-backups/
   
   # Clean up local file
   rm $BACKUP_FILE
   ```

### File Storage Backups

```bash
# Backup Supabase Storage
supabase storage download --recursive job-photos ./backups/photos/
supabase storage download --recursive customer-documents ./backups/documents/
```

## Performance Optimization

### CDN Setup

1. **Configure CDN for static assets**
   ```javascript
   // next.config.js
   module.exports = {
     assetPrefix: process.env.NODE_ENV === 'production' 
       ? 'https://cdn.rendetalje.dk' 
       : '',
   };
   ```

2. **Image Optimization**
   ```typescript
   // Image service configuration
   export const imageConfig = {
     domains: ['supabase.co', 'cdn.rendetalje.dk'],
     formats: ['image/webp', 'image/avif'],
     minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
   };
   ```

### Database Performance

1. **Connection Pooling**
   ```typescript
   // database.config.ts
   export const databaseConfig = {
     url: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false },
     pool: {
       min: 2,
       max: 10,
       acquireTimeoutMillis: 30000,
       idleTimeoutMillis: 30000
     }
   };
   ```

2. **Query Optimization**
   ```sql
   -- Run performance analysis
   EXPLAIN ANALYZE SELECT * FROM jobs WHERE status = 'pending';
   
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_jobs_status_date ON jobs(status, scheduled_date);
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Check for TypeScript errors
   npm run type-check
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT version();"
   
   # Check connection pool
   SELECT * FROM pg_stat_activity WHERE datname = 'your_database';
   ```

3. **Memory Issues**
   ```bash
   # Monitor memory usage
   node --max-old-space-size=4096 dist/main.js
   
   # Analyze heap dumps
   npm install -g clinic
   clinic doctor -- node dist/main.js
   ```

### Rollback Procedures

1. **Application Rollback**
   ```bash
   # Render.com rollback
   render services rollback [service-id] [deployment-id]
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   pg_restore --clean --no-acl --no-owner -d $DATABASE_URL backup_file.sql
   ```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Update dependencies (security patches)

2. **Monthly**
   - Database maintenance (VACUUM, ANALYZE)
   - Review and rotate logs
   - Security audit

3. **Quarterly**
   - Dependency updates
   - Performance optimization review
   - Disaster recovery testing

### Monitoring Checklist

- [ ] Application uptime > 99.9%
- [ ] Response time < 200ms (95th percentile)
- [ ] Error rate < 0.1%
- [ ] Database connections < 80% of limit
- [ ] Memory usage < 80%
- [ ] Disk usage < 80%

---

*For deployment support, contact: devops@rendetalje.dk*