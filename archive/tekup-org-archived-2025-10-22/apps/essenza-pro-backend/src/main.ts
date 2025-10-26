import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@tekup/shared';

const logger = createLogger('essenza-pro-backend');

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
      'https://essenza.tekup.dk',
      'https://app.tekup.dk'
    ],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EssenzaPro API')
    .setDescription('Wellness and beauty industry platform for Danish market')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('bookings', 'Appointment and service booking management')
    .addTag('services', 'Beauty and wellness service catalog')
    .addTag('clients', 'Client management and profiles')
    .addTag('staff', 'Staff scheduling and management')
    .addTag('loyalty', 'Loyalty programs and rewards')
    .addTag('payments', 'Payment processing and invoicing')
    .addTag('marketing', 'Marketing automation and campaigns')
    .addTag('analytics', 'Business analytics and reporting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3007;
  setupSwagger(app);

  await app.listen(port);

  logger.info(`💆‍♀️ EssenzaPro Backend running on port ${port}`);
  logger.info(`📖 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
