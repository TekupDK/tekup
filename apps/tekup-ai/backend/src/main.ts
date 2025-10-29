import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: true,
  });

  const configService = app.get(ConfigService);

  // Sentry Error Tracking
  const sentryDsn = configService.get<string>('app.sentry.dsn');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get<string>('app.sentry.environment'),
      tracesSampleRate: configService.get<number>(
        'app.sentry.tracesSampleRate',
      ),
      integrations: [new ProfilingIntegration()],
    });
    console.log('Sentry initialized');
  }

  // Global API Prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Security - Helmet
  if (configService.get<boolean>('app.features.helmet')) {
    app.use(helmet());
  }

  // Compression
  if (configService.get<boolean>('app.features.compression')) {
    app.use(compression());
  }

  // CORS Configuration
  const corsOrigins = configService.get<string[]>('app.cors.origin') || [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: configService.get<boolean>('app.cors.credentials'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global Validation Pipe
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

  // Swagger API Documentation
  if (configService.get<boolean>('app.features.swagger')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TekupAI API')
      .setDescription(
        'TekupAI Backend API - AI Assistant with MCP Integration',
      )
      .setVersion(configService.get<string>('app.apiVersion') || '1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('ai', 'AI chat and streaming endpoints')
      .addTag('conversations', 'Conversation management')
      .addTag('memories', 'Memory system')
      .addTag('users', 'User management')
      .addTag('mcp', 'MCP server management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }

  // Start Server
  const port = configService.get<number>('app.port') || 3001;
  await app.listen(port);

  const appUrl = configService.get<string>('app.appUrl');
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   TekupAI Backend - NestJS API Server                    ║
║                                                           ║
║   Server:     ${appUrl?.padEnd(37) || 'http://localhost:3001'.padEnd(37)}    ║
║   API:        ${`${appUrl}/${apiPrefix}`.padEnd(37)}    ║
║   Docs:       ${`${appUrl}/${apiPrefix}/docs`.padEnd(37)}    ║
║   Environment: ${configService.get<string>('app.nodeEnv')?.padEnd(36) || 'development'.padEnd(36)}    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  if (configService.get<boolean>('app.features.swagger')) {
    console.log(
      `📚 Swagger API Documentation: ${appUrl}/${apiPrefix}/docs\n`,
    );
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
