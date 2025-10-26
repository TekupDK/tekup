import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@tekup/shared';

const logger = createLogger('mcp-studio-backend');

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
      'https://mcp-studio.tekup.dk',
      'https://dev.tekup.dk'
    ],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('MCP Studio API')
    .setDescription('Developer tools for building MCP servers and applications')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('projects', 'MCP project management')
    .addTag('servers', 'MCP server development and testing')
    .addTag('tools', 'MCP tool definitions and validation')
    .addTag('resources', 'MCP resource management')
    .addTag('deployment', 'MCP server deployment and hosting')
    .addTag('testing', 'MCP server testing and validation')
    .addTag('marketplace', 'MCP server marketplace and distribution')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3008;
  setupSwagger(app);

  await app.listen(port);

  logger.info(`🛠️ MCP Studio Backend running on port ${port}`);
  logger.info(`📖 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
