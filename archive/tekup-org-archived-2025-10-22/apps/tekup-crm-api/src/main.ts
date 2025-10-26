import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: configService.get('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
      max: configService.get('RATE_LIMIT_MAX_REQUESTS', 100), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
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

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (configService.get('SWAGGER_ENABLED', true)) {
    const config = new DocumentBuilder()
      .setTitle('TekUp CRM API - Danish Cleaning Industry')
      .setDescription('Backend API for Danish cleaning industry job scheduling system')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Tenants', 'Multi-tenant management')
      .addTag('Customers', 'Customer management for Danish cleaning companies')
      .addTag('Jobs', 'Cleaning job scheduling and management')
      .addTag('Team', 'Team member management')
      .addTag('Routes', 'Route optimization for Danish addresses')
      .addTag('Analytics', 'Business analytics and reporting')
      .addTag('Inventory', 'Equipment and supplies management')
      .addTag('Calendar', 'Calendar and scheduling events')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`📚 Swagger documentation available at /api-docs`);
  }

  // Health check endpoint
  app.use('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get('NODE_ENV', 'development'),
    });
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  logger.log(`🚀 TekUp CRM API is running on port ${port}`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`🇩🇰 Danish Cleaning Industry Platform Ready`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});