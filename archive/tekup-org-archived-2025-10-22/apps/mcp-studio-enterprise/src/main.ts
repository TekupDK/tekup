import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-mcp-studio-enterprise-src');


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
    .setTitle('MCP Studio Enterprise API')
    .setDescription('Enterprise MCP Server Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('authentication', 'Authentication endpoints')
    .addTag('mcp-servers', 'MCP server management')
    .addTag('plugins', 'Plugin marketplace and management')
    .addTag('monitoring', 'Server monitoring and analytics')
    .addTag('billing', 'Subscription and billing management')
    .addTag('organizations', 'Organization and team management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3010;
  setupSwagger(app);

  await app.listen(port);
  
  logger.info(`🚀 MCP Studio Enterprise API running on port ${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();