import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-voicedk-api-src-main-ts');


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());
  
  // CORS for web clients
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://tekup.dk',
      'https://*.tekup.dk'
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('VoiceDK API')
    .setDescription('Danish Voice Command Processing API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('voice-processing', 'Voice command processing endpoints')
    .addTag('business-config', 'Business configuration management')
    .addTag('analytics', 'Usage analytics and reporting')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  setupSwagger(app);

  await app.listen(port);
  
  logger.info(`🎤 VoiceDK API running on port ${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();