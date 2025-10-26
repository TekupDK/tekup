import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('essenza-pro API')
    .setDescription('EssenzaPro - Fragrance & Beauty Business CRM Platform')
    .setVersion('1.0.0')
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
    .addTag('essenza-pro', 'EssenzaPro - Fragrance & Beauty Business CRM Platform')
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
    customSiteTitle: 'essenza-pro API Documentation',
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
      path.join(outputDir, 'essenza-pro.json'),
      JSON.stringify(document, null, 2)
    );
    
    console.log(`✅ OpenAPI spec exported for essenza-pro`);
    
    // Exit after exporting to prevent the app from starting
    process.exit(0);
  }
}
