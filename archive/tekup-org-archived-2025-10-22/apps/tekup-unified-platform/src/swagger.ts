import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Tekup Unified Platform API')
    .setDescription(`
      # Tekup Unified Platform API Documentation
      
      ## Overview
      The Tekup Unified Platform consolidates all Tekup services into a single, powerful business intelligence platform.
      
      ## Features
      - **Lead Management**: Advanced lead qualification, scoring, and conversion
      - **CRM System**: Customer relationship and deal management
      - **Workflow Automation**: Process automation and monitoring
      - **Voice Integration**: Call management and processing
      - **Multi-tenant Architecture**: Complete data isolation
      - **AI Integration**: Optional AI services with fallbacks
      
      ## Authentication
      All endpoints require proper authentication. Use the JWT token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
      
      ## Multi-tenancy
      All data is automatically scoped to the current tenant based on the domain or tenant ID.
      
      ## Rate Limiting
      API requests are rate limited to prevent abuse. Current limits:
      - 1000 requests per hour per IP
      - 100 requests per minute per user
      
      ## Support
      For API support, contact: api-support@tekup.dk
    `)
    .setVersion('1.0.0')
    .setContact('Tekup Support', 'https://tekup.dk', 'support@tekup.dk')
    .setLicense('Proprietary', 'https://tekup.dk/license')
    .addServer('https://tekup.dk/api', 'Production Server')
    .addServer('http://localhost:3000/api', 'Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Core', 'Core platform functionality and health checks')
    .addTag('Leads', 'Lead management, qualification, and conversion')
    .addTag('CRM', 'Customer relationship management')
    .addTag('Flow', 'Workflow automation and process management')
    .addTag('Voice', 'Voice communication and call management')
    .addTag('Analytics', 'Business intelligence and reporting')
    .addTag('AI', 'Artificial intelligence services')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    customSiteTitle: 'Tekup Unified Platform API',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1f2937; }
      .swagger-ui .info .description { color: #6b7280; }
    `,
  });

  return document;
}