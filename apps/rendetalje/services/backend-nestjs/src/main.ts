import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

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

  // Health check
  app.use('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get('NODE_ENV'),
      version: '1.0.0'
    });
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 RendetaljeOS API running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  console.log(`❤️ Health Check: http://localhost:${port}/health`);
}

bootstrap();