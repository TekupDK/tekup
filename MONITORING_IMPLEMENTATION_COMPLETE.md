# 🎯 Monitoring Implementation - Complete Guide

**Status**: 🚀 READY TO IMPLEMENT  
**Date**: October 23, 2025  
**Services**: Backend, Frontend, Calendar MCP

---

## 📋 NUVÆRENDE STATUS

### ✅ HAR ALLEREDE

1. **Sentry config filer** → `apps/rendetalje/services/deployment/monitoring/sentry-config.js`
2. **Backend configuration** → Understøtter `SENTRY_DSN` i `configuration.ts`
3. **Render.yaml** → Har `SENTRY_DSN` environment variable defineret
4. **Monitoring.env** → Krypteret fil med Sentry credentials

### ❌ MANGLER

1. **Sentry SDK ikke installeret** i backend/frontend
2. **Sentry ikke initialiseret** i `main.ts`
3. **Winston logger** ikke konfigureret
4. **UptimeRobot** ikke setup
5. **Admin dashboard** ikke bygget

---

## 🚀 IMPLEMENTATION PLAN

### FASE 1: Sentry Setup (1-2 timer)

- [ ] Install Sentry packages
- [ ] Initialize Sentry i backend
- [ ] Initialize Sentry i frontend
- [ ] Test error capture
- [ ] Deploy til Render

### FASE 2: Logging Infrastructure (2-3 timer)

- [ ] Install Winston
- [ ] Setup Supabase transport
- [ ] Create logs table
- [ ] Integrate med existing services

### FASE 3: Uptime Monitoring (30 min)

- [ ] Create UptimeRobot account
- [ ] Add monitors
- [ ] Configure alerts

### FASE 4: Admin Dashboard (3-4 timer)

- [ ] Build dashboard component
- [ ] Integrate Sentry API
- [ ] Display logs from Supabase
- [ ] System health checks

---

## 📦 STEP-BY-STEP GUIDE

### 1️⃣ BACKEND: Install Sentry Dependencies

```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo\apps\rendetalje\services\backend-nestjs
npm install @sentry/node @sentry/profiling-node
```

**Expected output:**
```
added 15 packages, and audited 500 packages in 5s
```

---

### 2️⃣ BACKEND: Create Sentry Module

**File:** `src/common/sentry/sentry.module.ts`

```typescript
import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

@Global()
@Module({})
export class SentryModule {
  static forRoot(): DynamicModule {
    return {
      module: SentryModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'SENTRY',
          useFactory: (configService: ConfigService) => {
            const dsn = configService.get('sentry.dsn');
            const environment = configService.get('sentry.environment');

            if (!dsn) {
              console.warn('⚠️ Sentry DSN not configured. Error tracking disabled.');
              return null;
            }

            Sentry.init({
              dsn,
              environment,
              tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
              profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
              integrations: [
                new ProfilingIntegration(),
                new Sentry.Integrations.Http({ tracing: true }),
              ],
              beforeSend(event, hint) {
                // Filter out non-critical errors
                const error = hint.originalException;
                if (error && error.message) {
                  if (error.message.includes('connection timeout')) return null;
                  if (error.message.includes('Too Many Requests')) return null;
                  if (error.name === 'ValidationError') return null;
                }
                return event;
              },
            });

            console.log('✅ Sentry initialized:', { environment, dsn: dsn.substring(0, 20) + '...' });
            return Sentry;
          },
          inject: [ConfigService],
        },
      ],
      exports: ['SENTRY'],
    };
  }
}
```

---

### 3️⃣ BACKEND: Create Sentry Interceptor

**File:** `src/common/sentry/sentry.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Don't report HTTP errors (they're expected)
        if (!(error instanceof HttpException)) {
          const request = context.switchToHttp().getRequest();
          
          Sentry.withScope((scope) => {
            scope.setContext('request', {
              method: request.method,
              url: request.url,
              headers: this.sanitizeHeaders(request.headers),
              body: this.sanitizeBody(request.body),
            });

            scope.setUser({
              id: request.user?.id,
              email: request.user?.email,
            });

            Sentry.captureException(error);
          });
        }

        return throwError(() => error);
      }),
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }
}
```

---

### 4️⃣ BACKEND: Update main.ts

**File:** `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { SentryInterceptor } from './common/sentry/sentry.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Initialize Sentry FIRST
  const sentryDsn = configService.get('sentry.dsn');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get('sentry.environment'),
      tracesSampleRate: 0.1,
    });
    console.log('✅ Sentry initialized for error tracking');
  }

  // Global Sentry interceptor
  app.useGlobalInterceptors(new SentryInterceptor());

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://rendetaljeos.onrender.com',
      configService.get('FRONTEND_URL')
    ].filter(Boolean),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (configService.get('ENABLE_SWAGGER') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('RendetaljeOS API')
      .setDescription('Complete Operations Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('jobs', 'Job management endpoints')
      .addTag('customers', 'Customer management endpoints')
      .addTag('team', 'Team management endpoints')
      .addTag('billing', 'Billing and invoicing endpoints')
      .addTag('ai-friday', 'AI Friday integration endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'RendetaljeOS API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }

  // Enhanced health check
  app.use('/health', (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get('NODE_ENV'),
      version: '1.0.0',
      services: {
        sentry: sentryDsn ? 'configured' : 'disabled',
        database: configService.get('database.url') ? 'configured' : 'missing',
        supabase: configService.get('supabase.url') ? 'configured' : 'missing',
      }
    };
    res.status(200).json(health);
  });

  // Test Sentry endpoint (only in development)
  if (configService.get('NODE_ENV') === 'development') {
    app.use('/test-sentry', (req, res) => {
      Sentry.captureException(new Error('Test Sentry error - please ignore'));
      res.json({ message: 'Sentry test error sent!' });
    });
  }

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 RendetaljeOS API running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  console.log(`❤️ Health Check: http://localhost:${port}/health`);
  if (configService.get('NODE_ENV') === 'development') {
    console.log(`🧪 Test Sentry: http://localhost:${port}/test-sentry`);
  }
}

bootstrap();
```

---

### 5️⃣ FRONTEND: Install Sentry

```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo\apps\rendetalje\services\frontend-nextjs
npm install @sentry/nextjs
```

---

### 6️⃣ FRONTEND: Configure Sentry

**File:** `sentry.client.config.ts` (create in root)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  beforeSend(event, hint) {
    // Filter non-critical errors
    const error = hint.originalException;
    if (error && error.message) {
      if (error.message.includes('Network Error')) return null;
      if (error.message.includes('ResizeObserver')) return null;
    }
    return event;
  },
});
```

**File:** `sentry.server.config.ts` (create in root)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

### 7️⃣ FRONTEND: Add Error Boundary

**File:** `src/components/ErrorBoundary.tsx` (create)

```typescript
'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', errorInfo);
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>🚨 Noget gik galt</h2>
          <p>Vi arbejder på at løse problemet.</p>
          <button onClick={() => window.location.reload()}>
            Genindlæs siden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### 8️⃣ WINSTON LOGGING SETUP

**Backend:** Install Winston

```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo\apps\rendetalje\services\backend-nestjs
npm install winston winston-supabase-transport
```

**File:** `src/common/logger/logger.service.ts`

```typescript
import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('supabase.url');
    const supabaseKey = this.configService.get('supabase.serviceRoleKey');
    
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          })
        ),
      }),
    ];

    // Add Supabase transport if configured
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      transports.push(
        new winston.transports.Stream({
          stream: {
            write: async (message: string) => {
              try {
                const logEntry = JSON.parse(message);
                await supabase.from('application_logs').insert({
                  timestamp: new Date().toISOString(),
                  level: logEntry.level,
                  message: logEntry.message,
                  metadata: logEntry.meta || {},
                  service: 'rendetalje-backend',
                });
              } catch (error) {
                console.error('Failed to write log to Supabase:', error);
              }
            },
          } as any,
          format: winston.format.json(),
        })
      );
    }

    this.logger = winston.createLogger({
      level: this.configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
      format: winston.format.json(),
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

---

### 9️⃣ SUPABASE: Create Logs Table

**SQL:** Run in Supabase SQL Editor

```sql
-- Create application logs table
CREATE TABLE IF NOT EXISTS application_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  service VARCHAR(50),
  user_id UUID,
  request_id VARCHAR(100),
  
  -- Indexes for fast queries
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_logs_timestamp ON application_logs(timestamp DESC);
CREATE INDEX idx_logs_level ON application_logs(level);
CREATE INDEX idx_logs_service ON application_logs(service);
CREATE INDEX idx_logs_user ON application_logs(user_id);
CREATE INDEX idx_logs_created ON application_logs(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert
CREATE POLICY "Service role can insert logs" 
  ON application_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Authenticated users can read their own logs
CREATE POLICY "Users can read logs" 
  ON application_logs 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create view for recent errors
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  id,
  timestamp,
  level,
  message,
  service,
  metadata
FROM application_logs
WHERE level IN ('error', 'critical')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;

COMMENT ON TABLE application_logs IS 'Centralized application logs from all services';
```

---

### 🔟 UPTIME MONITORING SETUP

**1. Create UptimeRobot Account**

- Go to: <https://uptimerobot.com>
- Sign up (gratis)
- Email: <jonas@tekup.dk> (eller din email)

**2. Add Monitors**

**Monitor 1: Backend Health**

- Type: HTTP(s)
- URL: `https://rendetalje-backend.onrender.com/health`
- Name: `RendetaljeOS Backend`
- Interval: 5 minutes
- Alert: Email når down

**Monitor 2: Frontend**

- Type: HTTP(s)
- URL: `https://rendetalje-frontend-owner.onrender.com`
- Name: `RendetaljeOS Frontend (Owner)`
- Interval: 5 minutes

**Monitor 3: Calendar MCP**

- Type: HTTP(s)
- URL: `https://[SERVICE NOT DEPLOYED]/health`
- Name: `RenOS Calendar MCP`
- Interval: 5 minutes

---

### 1️⃣1️⃣ ENVIRONMENT VARIABLES

**Render.com Dashboard:**

For hver service, tilføj disse environment variables:

```bash
# Sentry
SENTRY_DSN=https://YOUR_DSN@o12345.ingest.sentry.io/67890
SENTRY_ENVIRONMENT=production

# For frontend (Next.js)
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN@o12345.ingest.sentry.io/67890
```

---

## 📊 VERIFICATION CHECKLIST

### ✅ Backend Verification

```powershell
# 1. Build should succeed
npm run build

# 2. Start locally
npm run start:dev

# 3. Check health endpoint
curl http://localhost:3001/health
# Should return: { status: 'ok', services: { sentry: 'configured' } }

# 4. Test Sentry
curl http://localhost:3001/test-sentry
# Check Sentry dashboard for error
```

### ✅ Frontend Verification

```powershell
# 1. Build should succeed
npm run build

# 2. Start locally
npm run dev

# 3. Check console
# Should see: "Sentry initialized"

# 4. Test error boundary
# Throw error in component, should appear in Sentry
```

### ✅ Supabase Verification

```sql
-- Check table exists
SELECT * FROM application_logs LIMIT 10;

-- Check recent errors
SELECT * FROM recent_errors;
```

---

## 🎯 DEPLOYMENT STEPS

### 1. Commit Changes

```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo
git add .
git commit -m "feat: Add Sentry error tracking and Winston logging"
git push origin master
```

### 2. Configure Render Environment

1. Go to Render Dashboard
2. For **rendetalje-backend**:
   - Add `SENTRY_DSN` from secrets
   - Redeploy

3. For **rendetalje-frontend-owner**:
   - Add `NEXT_PUBLIC_SENTRY_DSN`
   - Redeploy

### 3. Verify Production

```powershell
# Backend health
curl https://rendetalje-backend.onrender.com/health

# Should show sentry: 'configured'
```

---

## 📈 NEXT STEPS (After Deployment)

### Week 1: Monitor & Tune

- [ ] Check Sentry daily for errors
- [ ] Review UptimeRobot alerts
- [ ] Tune error filters if too noisy

### Week 2: Build Dashboard

- [ ] Create admin panel component
- [ ] Show recent errors from Sentry API
- [ ] Show logs from Supabase
- [ ] Display uptime stats

### Week 3: Optimize

- [ ] Add custom Sentry events for important actions
- [ ] Setup Sentry releases for better tracking
- [ ] Configure Sentry alerts (Slack/Email)

---

## 🔗 USEFUL LINKS

- **Sentry Dashboard**: <https://sentry.io/organizations/YOUR_ORG/projects/>
- **UptimeRobot**: <https://uptimerobot.com/dashboard>
- **Render Logs**: <https://dashboard.render.com/>
- **Supabase Logs**: <https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/logs>

---

## 💰 COST ESTIMATE

```yaml
Sentry:
  Free tier: 5,000 errors/month
  Cost: $0 (gratis indtil I rammer 5k errors)

UptimeRobot:
  Free tier: 50 monitors, 5-min intervals
  Cost: $0

Winston + Supabase:
  Storage: ~10MB/month for logs
  Cost: $0 (inkluderet i Supabase free tier)

Total monthly cost: $0 ✅
```

---

## 🎉 SUCCESS CRITERIA

Efter implementation skal I kunne:

✅ **Se fejl i real-time** → Sentry dashboard  
✅ **Få alerts ved downtime** → UptimeRobot email  
✅ **Søge i logs** → Supabase logs table  
✅ **Track performance** → Sentry performance monitoring  
✅ **Debug production issues** → Sentry + logs kombineret  

---

**Klar til at starte?** Lad os implementere det hele! 🚀
