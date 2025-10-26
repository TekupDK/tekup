# Deployment Guide - Tekup Cloud Dashboard

Denne guide beskriver, hvordan du deployer Tekup Cloud Dashboard til forskellige hosting-platforme.

## 📋 Pre-deployment Checklist

- [ ] Alle miljøvariabler er konfigureret
- [ ] Supabase-projekt er opsat og konfigureret
- [ ] Build kører uden fejl (`npm run build`)
- [ ] Tests passerer (`npm run test`)
- [ ] Linting er clean (`npm run lint`)

## 🌐 Vercel Deployment (Anbefalet)

### Automatisk Deployment

1. **Forbind Repository**
   ```bash
   # Push til GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Opsæt Vercel Project**
   - Gå til [vercel.com](https://vercel.com)
   - Klik "New Project"
   - Import dit GitHub repository
   - Vælg "tekup-cloud-dashboard"

3. **Konfigurer Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Tilføj Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   VITE_APP_NAME=Tekup Cloud Dashboard
   VITE_API_BASE_URL=https://api.tekup.dk
   VITE_ENVIRONMENT=production
   VITE_FEATURE_ANALYTICS=true
   VITE_FEATURE_BILLING=true
   VITE_FEATURE_CHAT=true
   ```

5. **Deploy**
   - Klik "Deploy"
   - Vent på build completion
   - Test deployment på den genererede URL

### Manual Deployment via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Login til Vercel
vercel login

# Deploy
vercel --prod
```

## 🚀 Netlify Deployment

### Via Git Integration

1. **Forbind Repository**
   - Gå til [netlify.com](https://netlify.com)
   - Klik "New site from Git"
   - Vælg GitHub og dit repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Environment Variables**
   Tilføj samme variabler som til Vercel i Netlify dashboard.

4. **Deploy Settings**
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = "dist"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Manual Deployment

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Build projektet
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass https://api.tekup.dk;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### Docker Commands

```bash
# Build image
docker build -t tekup-cloud-dashboard .

# Run container
docker run -p 3000:80 tekup-cloud-dashboard

# Med environment variables
docker run -p 3000:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  tekup-cloud-dashboard
```

## ☁️ AWS S3 + CloudFront

### S3 Setup

```bash
# Build projektet
npm run build

# Upload til S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Opsæt bucket for static hosting
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html
```

### CloudFront Distribution

```json
{
  "Origins": [{
    "DomainName": "your-bucket-name.s3.amazonaws.com",
    "Id": "S3-your-bucket-name",
    "S3OriginConfig": {
      "OriginAccessIdentity": ""
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-bucket-name",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true
  },
  "CustomErrorResponses": [{
    "ErrorCode": 404,
    "ResponseCode": 200,
    "ResponsePagePath": "/index.html"
  }]
}
```

## 🔧 Environment-Specific Configuration

### Development
```env
VITE_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_URL=your_dev_supabase_url
```

### Staging
```env
VITE_ENVIRONMENT=staging
VITE_API_BASE_URL=https://staging-api.tekup.dk
VITE_SUPABASE_URL=your_staging_supabase_url
```

### Production
```env
VITE_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.tekup.dk
VITE_SUPABASE_URL=your_prod_supabase_url
```

## 📊 Monitoring & Analytics

### Performance Monitoring

```javascript
// src/lib/monitoring.ts
export const initMonitoring = () => {
  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    // Sentry, LogRocket, eller anden monitoring
  }
};
```

### Analytics Setup

```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: document.title,
  page_location: window.location.href
});
```

## 🔒 Security Considerations

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               connect-src 'self' https://api.tekup.dk https://*.supabase.co;">
```

### HTTPS Enforcement

```javascript
// Redirect HTTP til HTTPS i production
if (location.protocol !== 'https:' && import.meta.env.VITE_ENVIRONMENT === 'production') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

## 🚨 Troubleshooting

### Almindelige Deployment Issues

1. **Build Fejl**
   ```bash
   # Clear cache og reinstaller
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variables Ikke Loaded**
   - Tjek at variablerne starter med `VITE_`
   - Verificer at de er tilføjet i hosting platform
   - Restart deployment efter tilføjelse

3. **Routing Issues (404 på refresh)**
   - Opsæt redirects til `/index.html`
   - Tjek server konfiguration for SPA support

4. **API Connection Issues**
   - Verificer CORS-indstillinger på backend
   - Tjek at API URLs er korrekte
   - Test API endpoints direkte

### Health Check Endpoint

```javascript
// src/lib/health.ts
export const healthCheck = async () => {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch {
    return false;
  }
};
```

## 📈 Performance Optimization

### Build Optimization

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### CDN Configuration

```javascript
// Preload kritiske ressourcer
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://api.tekup.dk">
<link rel="dns-prefetch" href="https://supabase.co">
```

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
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

Dette deployment guide sikrer en pålidelig og skalerbar deployment af Tekup Cloud Dashboard.