import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('tekup-crm-api API')
    .setDescription('API documentation')
    .setVersion('0.1.0')
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
    .addTag('tekup-crm-api', 'API endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'tekup-crm-api API Documentation',
  });

  // Export OpenAPI spec for documentation generation
  if (process.env.EXPORT_OPENAPI) {
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(__dirname, '../../docs/site/static/openapi');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'tekup-crm-api.json'),
      JSON.stringify(document, null, 2)
    );
    
    console.log(`✅ OpenAPI spec exported for tekup-crm-api`);
    
    // Exit after exporting to prevent the app from starting
    process.exit(0);
  }
}
