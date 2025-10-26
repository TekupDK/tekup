import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@tekup/shared';

const logger = createLogger('rendetalje-os-backend');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://rendetalje.tekup.dk',
      'https://app.tekup.dk'
    ],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('RendetaljeOS API')
    .setDescription('Professional cleaning service management system for Danish market')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('teams', 'Cleaning team management')
    .addTag('scheduling', 'Route optimization and scheduling')
    .addTag('quality', 'Quality control and inspections')
    .addTag('customers', 'Customer management and communication')
    .addTag('compliance', 'Danish employment law compliance')
    .addTag('billing', 'Time tracking and billing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Health check endpoint for Docker
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      message: 'Rendetalje OS API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  const port = process.env.PORT || 3006;
  setupSwagger(app);

  await app.listen(port);

  logger.info(`🧹 RendetaljeOS Backend running on port ${port}`);
  logger.info(`📖 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
