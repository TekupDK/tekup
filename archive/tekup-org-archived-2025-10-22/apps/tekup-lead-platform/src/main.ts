import { config as dotenvConfig } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'node:fs';
import { AppModule } from './app.module';
// Use dynamic import for ES module
const configPromise = import('@tekup/config');
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-tekup-lead-platform-src-m');


async function bootstrap() {
  // Load environment variables
  dotenvConfig();
  
  // Dynamic import for ES module
  const { loadConfig, logConfig } = await configPromise;
  const { config } = loadConfig({ onError: (errs) => logger.error('[lead-platform:config:error]', errs) });
  logConfig('lead-platform:config');
  
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration for multi-tenant access
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://lead.tekup.dk',
      /\.tekup\.dk$/
    ],
    credentials: true,
  });

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TekUp Lead Platform API')
    .setDescription('Advanced multi-tenant lead management and qualification system')
    .setVersion('0.1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-tenant-key',
        in: 'header',
      },
      'tenant-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  if (process.env.EXPORT_OPENAPI === '1') {
    mkdirSync('docs/build/openapi', { recursive: true });
    writeFileSync('docs/build/openapi/tekup-lead-platform.json', JSON.stringify(document, null, 2));
    await app.close();
    return;
  }

  const port = parseInt(process.env.PORT || '3003', 10);
  setupSwagger(app);

  await app.listen(port);
  
  logger.info(`🚀 TekUp Lead Platform running on port ${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
