import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@tekup/shared';

const logger = createLogger('foodtruck-os-backend');

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
      'https://foodtruck.tekup.dk',
      'https://app.tekup.dk'
    ],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FoodTruck OS API')
    .setDescription('Danish food truck management system with food safety compliance')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('trucks', 'Food truck management')
    .addTag('inventory', 'Inventory and stock management')
    .addTag('pos', 'Point of sale system')
    .addTag('compliance', 'Danish food safety compliance')
    .addTag('routes', 'Route optimization and scheduling')
    .addTag('events', 'Event bookings and management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3005;
  setupSwagger(app);

  await app.listen(port);

  logger.info(`🚚 FoodTruck OS Backend running on port ${port}`);
  logger.info(`📖 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
