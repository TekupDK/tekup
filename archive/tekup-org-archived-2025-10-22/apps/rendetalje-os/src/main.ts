import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-rendetalje-os-src-main-ts');


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('RendetaljeOS API')
    .setDescription('Complete Cleaning Service Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('customers', 'Customer management')
    .addTag('bookings', 'Booking and scheduling')
    .addTag('pricing', 'Pricing and estimation')
    .addTag('invoicing', 'Invoicing and billing')
    .addTag('staff', 'Staff management')
    .addTag('analytics', 'Business analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3020;
  setupSwagger(app);

  await app.listen(port);
  
  logger.info(`🧹 RendetaljeOS API running on port ${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();