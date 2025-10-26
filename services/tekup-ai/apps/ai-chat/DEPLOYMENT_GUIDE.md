# Tekup AI Assistant - Deployment Guide

**Version:** 1.0  
**Date:** October 18, 2025  
**Status:** Production Ready

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ installed
- OpenAI API key
- TekupVault API running (https://tekupvault.onrender.com)
- Supabase project (optional for persistence)

### Setup Steps

```bash
# 1. Navigate to project
cd c:\Users\empir\tekup-chat

# 2. Install dependencies
npm install

# 3. Configure environment
# Copy .env.local and add your keys
OPENAI_API_KEY=sk-your-key-here
TEKUPVAULT_API_KEY=tekup_vault_api_key_2025_secure

# 4. Run development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
```

---

## ✅ Pre-Deployment Checklist

### Environment Variables

- [ ] `OPENAI_API_KEY` - OpenAI API key (required)
- [ ] `TEKUPVAULT_API_KEY` - TekupVault API key (required)
- [ ] `TEKUPVAULT_API_URL` - Default: https://tekupvault.onrender.com
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (optional)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (optional)

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console.errors in production code
- [ ] All imports working correctly

### Testing

- [ ] Test streaming API endpoint
- [ ] Verify TekupVault integration
- [ ] Test on mobile devices
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

**Pros:** Automatic deployments, global CDN, zero config, free tier

**Steps:**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd c:\Users\empir\tekup-chat
vercel

# 4. Add environment variables in Vercel dashboard
# Settings → Environment Variables
# Add: OPENAI_API_KEY, TEKUPVAULT_API_KEY, etc.

# 5. Production deployment
vercel --prod
```

**Post-Deployment:**
- Custom domain: Add in Vercel dashboard
- Analytics: Enable in Project Settings
- Monitoring: Use Vercel Analytics

---

### Option 2: Render.com

**Pros:** Good for full-stack apps, PostgreSQL included, free tier

**Steps:**

1. Create `render.yaml`:

```yaml
services:
  - type: web
    name: tekup-chat
    runtime: node
    region: frankfurt
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENAI_API_KEY
        sync: false
      - key: TEKUPVAULT_API_KEY
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
```

2. Push to GitHub
3. Connect GitHub repo in Render dashboard
4. Add environment variables
5. Deploy

---

### Option 3: Self-Hosted (Docker)

**Pros:** Full control, own infrastructure

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Deploy:**

```bash
# Build image
docker build -t tekup-chat .

# Run container
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e TEKUPVAULT_API_KEY=your_key \
  --name tekup-chat \
  tekup-chat
```

---

## 🗄️ Database Setup (Supabase)

### Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_sessions_updated ON chat_sessions(updated_at DESC);

-- Row-level security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies (public access for MVP, add auth later)
CREATE POLICY "Allow all access to chat_sessions" ON chat_sessions
  FOR ALL USING (true);

CREATE POLICY "Allow all access to messages" ON messages
  FOR ALL USING (true);
```

---

## 🔒 Security Checklist

### API Keys

- [ ] Never commit `.env.local` to Git
- [ ] Use environment variables in production
- [ ] Rotate keys every 90 days
- [ ] Monitor API usage for anomalies

### Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }

  if (userLimit.count >= maxRequests) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  userLimit.count++;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### CORS

```typescript
// src/app/api/chat/stream/route.ts
export async function POST(req: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  // ... rest of handler
}
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

## 🧪 Testing in Production

### Smoke Tests

```bash
# Test homepage
curl https://your-domain.com

# Test chat API
curl -X POST https://your-domain.com/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, test!"}'

# Test TekupVault integration
curl -X POST https://your-domain.com/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Show me Billy.dk docs","useVault":true}'
```

### Performance Benchmarks

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API Response Time (p95): < 2s
- Streaming Latency: < 500ms

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📈 Scaling Considerations

### Horizontal Scaling

- Vercel automatically handles scaling
- For self-hosted: Use load balancer (Nginx, Cloudflare)
- Stateless architecture allows multiple instances

### Database Optimization

```sql
-- Add materialized view for frequent queries
CREATE MATERIALIZED VIEW recent_sessions AS
SELECT *
FROM chat_sessions
WHERE updated_at > NOW() - INTERVAL '30 days'
ORDER BY updated_at DESC;

-- Refresh every hour
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('refresh-sessions', '0 * * * *', 
  'REFRESH MATERIALIZED VIEW recent_sessions');
```

### Caching

```typescript
// Redis caching for TekupVault results
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

async function getCachedVaultResults(query: string) {
  const cached = await redis.get(`vault:${query}`);
  if (cached) return cached;

  const results = await searchVault({ query });
  await redis.set(`vault:${query}`, results, { ex: 3600 }); // 1 hour TTL
  return results;
}
```

---

## 🆘 Troubleshooting

### Common Issues

**1. OpenAI API Errors**
```
Error: 429 Too Many Requests
Solution: Check rate limits, upgrade tier, add retry logic
```

**2. TekupVault Timeout**
```
Error: Request timeout
Solution: Increase threshold, reduce limit, check Render status
```

**3. Build Failures**
```
Error: Module not found
Solution: Run `npm install`, check imports, clear .next cache
```

**4. Streaming Not Working**
```
Error: EventSource failed
Solution: Check Edge Runtime, verify CORS, test locally first
```

---

## 📞 Support & Maintenance

### Health Checks

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      openai: await checkOpenAI(),
      tekupvault: await checkTekupVault(),
      database: await checkDatabase(),
    },
  };

  const allHealthy = Object.values(health.services).every((s) => s.status === 'ok');

  return Response.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
```

### Backup Strategy

- **Database:** Daily backups via Supabase
- **Conversations:** Export to JSON weekly
- **Code:** GitHub repository
- **Environment:** Document all env vars

---

**Last Updated:** October 18, 2025  
**Next Review:** After first deployment  
**Status:** ✅ Ready for Production
