import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadConfig, logConfig } from '@tekup/config';
import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { AppModule } from './modules/app.module.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiKeyMiddleware } from './auth/api-key.middleware.js';
import { EnhancedApiKeyService } from './auth/enhanced-api-key.service.js';
import { TenantContextService } from './auth/tenant-context.service.js';
import { LoggingMiddleware } from './common/logging.middleware.js';
import { RateLimitMiddleware } from './common/rate-limit.middleware.js';
import { MetricsService } from './metrics/metrics.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-main-ts');


async function bootstrap() {
  // Load .env and, if present, .env.<NODE_ENV> (e.g., .env.production)
  dotenvConfig();
  const env = process.env.NODE_ENV || 'development';
  const envFile = path.resolve(process.cwd(), `.env.${env}`);
  if (fs.existsSync(envFile)) {
    dotenvConfig({ path: envFile, override: false });
  }
  // Load configuration centrally (will throw on invalid); mark required keys if needed later
  const { config } = loadConfig({ required: ['FLOW_API_URL'] as any, onError: (errs: string[]) => logger.error('[config:error]', errs) });
  logConfig('flow-api:config');
  const app = await NestFactory.create(AppModule);
  // Configure CORS from env (comma-separated allowed origins). Default: '*'
  const corsOrigin = (process.env.CORS_ORIGIN || '*').trim();
  if (corsOrigin === '*' || corsOrigin.toLowerCase() === 'true') {
    app.enableCors();
  } else {
    const origins = corsOrigin.split(',').map((s) => s.trim()).filter(Boolean);
    app.enableCors({ origin: origins, credentials: true });
  }
  // Apply API key middleware globally except for /metrics (public) for now
  const prisma = app.get(PrismaService);
  const metrics = app.get(MetricsService);
  const apiKeyMiddleware = app.get(ApiKeyMiddleware, { strict: false }) ||
    new ApiKeyMiddleware(
      prisma,
      app.get(EnhancedApiKeyService),
      app.get(TenantContextService)
    );
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/metrics')) return next();
    apiKeyMiddleware.use(req, res, next);
  });
  app.use(new RateLimitMiddleware(metrics).use);
  // Logging (after tenant resolution for tenant_id in logs)
  app.use(new LoggingMiddleware().use);
  // Build info metric (populated from env / package)
  try {
    // Dynamically import package.json (works after build via copying or bundler include)
    const pkg = await import('../package.json', { assert: { type: 'json' } } as any).catch(()=>({default:{version:'0.0.0'}}));
    metrics.setBuildInfo({ version: (pkg as any).default.version || '0.0.0', node: process.version.replace('v','') });
  } catch { /* ignore */ }

  // Optional auto-seed for demo mode (NOT for production). Controlled by PX_AUTO_SEED=true.
  if (process.env.PX_AUTO_SEED === 'true') {
    await autoSeed(prisma);
  }
  // Setup Swagger/OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TekUp Flow API')
    .setDescription('Multi-tenant incident response API with real-time capabilities')
    .setVersion(process.env.npm_package_version || '0.1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'apiKey')
    .addTag('leads', 'Lead management and ingestion')
    .addTag('tenants', 'Multi-tenant operations')
    .addTag('events', 'Real-time events and notifications')
    .addTag('metrics', 'System metrics and monitoring')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  
  // OpenAPI export when requested
  if (process.env.EXPORT_OPENAPI === '1') {
    mkdirSync('docs/build/openapi', { recursive: true });
    writeFileSync('docs/build/openapi/flow-api.json', JSON.stringify(document, null, 2));
    await app.close();
    return;
  }

  // Setup Swagger UI in development
  if (process.env.NODE_ENV === 'development') {
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'TekUp Flow API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
      },
    });
  }

  const port = process.env.PX_API_PORT || 4000;
  setupSwagger(app);

  await app.listen(port);
  // eslint-disable-next-line no-console
  logger.info('API listening on http://localhost:' + port);
}
bootstrap();

// Demo seeding: creates two tenants + api keys if absent
async function autoSeed(prisma: any) {
  try {
    const tCount = await prisma.tenant.count();
    if (tCount >= 2) return; // assume already seeded
    const t1 = await prisma.tenant.upsert({ where: { slug: 'demo1' }, update: {}, create: { slug: 'demo1', name: 'Demo Tenant 1' } });
    const t2 = await prisma.tenant.upsert({ where: { slug: 'demo2' }, update: {}, create: { slug: 'demo2', name: 'Demo Tenant 2' } });
    await prisma.apiKey.upsert({ where: { key: 'demo-tenant-key-1' }, update: {}, create: { key: 'demo-tenant-key-1', tenantId: t1.id } });
    await prisma.apiKey.upsert({ where: { key: 'demo-tenant-key-2' }, update: {}, create: { key: 'demo-tenant-key-2', tenantId: t2.id } });
    // eslint-disable-next-line no-console
    logger.info('[auto-seed] Created demo tenants and API keys');
  } catch (e) {
    // eslint-disable-next-line no-console
    logger.info('[auto-seed] failed', e);
  }
}
