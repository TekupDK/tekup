import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://tekup.dk', 'https://*.tekup.dk']
      : true,
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // Setup Swagger documentation
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Tekup Unified Platform is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
