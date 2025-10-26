#!/usr/bin/env node

/**
 * OpenAPI Generation Pipeline
 * 
 * This script generates comprehensive OpenAPI documentation for all NestJS applications
 * and creates interactive API documentation with Postman collections.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const config = {
  appsDir: join(rootDir, 'apps'),
  outputDir: join(rootDir, 'docs/site/static/openapi'),
  docusaurusApiDir: join(rootDir, 'docs/site/api'),
  postmanDir: join(rootDir, 'docs/site/static/postman'),
  tempDir: join(rootDir, '.temp-openapi'),
};

// NestJS applications configuration
const nestjsApps = {
  'flow-api': { 
    port: 3000, 
    description: 'Core backend API service',
    category: 'Core APIs',
    priority: 1,
    hasSwagger: true
  },
  'tekup-crm-api': { 
    port: 3001, 
    description: 'Customer relationship management API',
    category: 'Business APIs',
    priority: 2,
    hasSwagger: true
  },
  'tekup-lead-platform': { 
    port: 3002, 
    description: 'Lead generation and management API',
    category: 'Business APIs',
    priority: 3,
    hasSwagger: true
  },
  'secure-platform': { 
    port: 3003, 
    description: 'Security and compliance API',
    category: 'Security APIs',
    priority: 4,
    hasSwagger: false // Need to add Swagger
  },
  'voicedk-api': { 
    port: 3004, 
    description: 'Danish voice AI processing API',
    category: 'AI APIs',
    priority: 5,
    hasSwagger: true
  },
  'rendetalje-os-backend': { 
    port: 3005, 
    description: 'Construction management backend API',
    category: 'Business APIs',
    priority: 6,
    hasSwagger: true
  },
};

/**
 * Utility functions
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

function getNestJSApps() {
  if (!existsSync(config.appsDir)) {
    log(`Apps directory not found: ${config.appsDir}`, 'error');
    return [];
  }

  return readdirSync(config.appsDir)
    .filter(name => {
      const appDir = join(config.appsDir, name);
      const packageJsonPath = join(appDir, 'package.json');
      
      if (!statSync(appDir).isDirectory() || !existsSync(packageJsonPath)) {
        return false;
      }

      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const hasNestJS = packageJson.dependencies && 
          (packageJson.dependencies['@nestjs/common'] || packageJson.dependencies['@nestjs/core']);
        
        return hasNestJS && nestjsApps[name];
      } catch (error) {
        log(`Error reading package.json for ${name}: ${error.message}`, 'warn');
        return false;
      }
    })
    .map(name => {
      const appDir = join(config.appsDir, name);
      const packageJsonPath = join(appDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      
      return {
        name,
        path: appDir,
        packageJson,
        config: nestjsApps[name]
      };
    })
    .sort((a, b) => a.config.priority - b.config.priority);
}

function generateSwaggerSetup(app) {
  const swaggerSetupPath = join(app.path, 'src/swagger.ts');
  
  if (existsSync(swaggerSetupPath)) {
    log(`Swagger setup already exists for ${app.name}`);
    return;
  }

  const swaggerSetup = `import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('${app.packageJson.name}')
    .setDescription('${app.config.description}')
    .setVersion('${app.packageJson.version || '1.0.0'}')
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
    .addServer('http://localhost:${app.config.port}', 'Development server')
    .addServer('https://api.tekup.org', 'Production server')
    .addTag('${app.name}', '${app.config.description}')
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
    customSiteTitle: '${app.packageJson.name} API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
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
      path.join(outputDir, '${app.name}.json'),
      JSON.stringify(document, null, 2)
    );
    
    console.log(\`OpenAPI spec exported for ${app.name}\`);
  }
}
`;

  writeFileSync(swaggerSetupPath, swaggerSetup);
  log(`Generated Swagger setup for ${app.name}`);
}

function updateMainFile(app) {
  const mainFilePath = join(app.path, 'src/main.ts');
  
  if (!existsSync(mainFilePath)) {
    log(`Main file not found for ${app.name}: ${mainFilePath}`, 'warn');
    return;
  }

  let mainContent = readFileSync(mainFilePath, 'utf8');
  
  // Check if swagger is already imported
  if (mainContent.includes('setupSwagger')) {
    log(`Swagger already configured in main.ts for ${app.name}`);
    return;
  }

  // Add swagger import
  if (!mainContent.includes("import { setupSwagger } from './swagger';")) {
    const importIndex = mainContent.indexOf("import { NestFactory } from '@nestjs/core';");
    if (importIndex !== -1) {
      const afterImport = mainContent.indexOf('\n', importIndex) + 1;
      mainContent = mainContent.slice(0, afterImport) + 
        "import { setupSwagger } from './swagger';\n" + 
        mainContent.slice(afterImport);
    }
  }

  // Add swagger setup call
  if (!mainContent.includes('setupSwagger(app)')) {
    const appListenIndex = mainContent.indexOf('await app.listen(');
    if (appListenIndex !== -1) {
      const beforeListen = mainContent.lastIndexOf('\n', appListenIndex);
      mainContent = mainContent.slice(0, beforeListen + 1) + 
        '\n  // Setup Swagger documentation\n' +
        '  setupSwagger(app);\n' + 
        mainContent.slice(beforeListen + 1);
    }
  }

  writeFileSync(mainFilePath, mainContent);
  log(`Updated main.ts for ${app.name} with Swagger configuration`);
}

function generateOpenAPISpec(app) {
  try {
    log(`Generating OpenAPI spec for ${app.name}...`);
    
    // Build the application first
    log(`Building ${app.name}...`);
    execSync('pnpm build', { 
      cwd: app.path, 
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    // Export OpenAPI spec
    log(`Exporting OpenAPI spec for ${app.name}...`);
    execSync('node dist/main.js', { 
      cwd: app.path, 
      stdio: 'pipe',
      env: { ...process.env, EXPORT_OPENAPI: '1' },
      timeout: 10000
    });
    
    log(`OpenAPI spec generated for ${app.name}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to generate OpenAPI spec for ${app.name}: ${error.message}`, 'error');
    return false;
  }
}

function generatePostmanCollection(app) {
  const openApiPath = join(config.outputDir, `${app.name}.json`);
  
  if (!existsSync(openApiPath)) {
    log(`OpenAPI spec not found for ${app.name}, skipping Postman collection`, 'warn');
    return;
  }

  try {
    const openApiSpec = JSON.parse(readFileSync(openApiPath, 'utf8'));
    
    const postmanCollection = {
      info: {
        name: `${app.packageJson.name} API`,
        description: app.config.description,
        version: app.packageJson.version || '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{jwt_token}}',
            type: 'string'
          }
        ]
      },
      variable: [
        {
          key: 'baseUrl',
          value: `http://localhost:${app.config.port}`,
          type: 'string'
        },
        {
          key: 'jwt_token',
          value: '',
          type: 'string'
        }
      ],
      item: []
    };

    // Convert OpenAPI paths to Postman requests
    if (openApiSpec.paths) {
      Object.entries(openApiSpec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, operation]) => {
          if (typeof operation === 'object' && operation.operationId) {
            const request = {
              name: operation.summary || operation.operationId,
              request: {
                method: method.toUpperCase(),
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: `{{baseUrl}}${path}`,
                  host: ['{{baseUrl}}'],
                  path: path.split('/').filter(p => p)
                },
                description: operation.description || ''
              }
            };

            // Add request body if present
            if (operation.requestBody && operation.requestBody.content) {
              const jsonContent = operation.requestBody.content['application/json'];
              if (jsonContent && jsonContent.schema) {
                request.request.body = {
                  mode: 'raw',
                  raw: JSON.stringify(generateExampleFromSchema(jsonContent.schema), null, 2)
                };
              }
            }

            postmanCollection.item.push(request);
          }
        });
      });
    }

    const postmanPath = join(config.postmanDir, `${app.name}.json`);
    ensureDir(config.postmanDir);
    writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2));
    log(`Generated Postman collection for ${app.name}`);
  } catch (error) {
    log(`Failed to generate Postman collection for ${app.name}: ${error.message}`, 'error');
  }
}

function generateExampleFromSchema(schema) {
  if (!schema) return {};
  
  if (schema.type === 'object' && schema.properties) {
    const example = {};
    Object.entries(schema.properties).forEach(([key, prop]) => {
      example[key] = generateExampleFromSchema(prop);
    });
    return example;
  }
  
  if (schema.type === 'array' && schema.items) {
    return [generateExampleFromSchema(schema.items)];
  }
  
  switch (schema.type) {
    case 'string':
      return schema.example || 'string';
    case 'number':
    case 'integer':
      return schema.example || 0;
    case 'boolean':
      return schema.example || true;
    default:
      return schema.example || null;
  }
}

function generateDocusaurusAPIPages(apps) {
  ensureDir(config.docusaurusApiDir);

  // Generate API overview page
  const overviewContent = `# API Reference

TekUp platform provides comprehensive REST APIs for all business operations. All APIs follow OpenAPI 3.0 specification and include interactive documentation.

## Available APIs

${apps.map(app => `
### ${app.packageJson.name}

**Category:** ${app.config.category}  
**Description:** ${app.config.description}  
**Base URL:** \`http://localhost:${app.config.port}\`

${app.packageJson.description || 'No description available.'}

- [OpenAPI Specification](/openapi/${app.name}.json)
- [Postman Collection](/postman/${app.name}.json)
- [Interactive Documentation](http://localhost:${app.config.port}/api/docs)

`).join('')}

## Authentication

All APIs use JWT Bearer token authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

APIs are rate limited to prevent abuse:
- **Development**: 1000 requests per hour per IP
- **Production**: 10000 requests per hour per authenticated user

## Error Handling

All APIs return consistent error responses:

\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
\`\`\`

## Common Response Formats

### Success Response
\`\`\`json
{
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

### Paginated Response
\`\`\`json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "message": "Success"
}
\`\`\`

## SDK and Client Libraries

- **JavaScript/TypeScript**: \`@tekup/api-client\`
- **Python**: Coming soon
- **PHP**: Coming soon

## Support

- **Documentation**: Browse this comprehensive API documentation
- **GitHub Issues**: [Report API issues](https://github.com/TekUp-org/tekup-org/issues)
- **Community**: Join our [Discord server](https://discord.gg/tekup)
- **Email**: api-support@tekup.org
`;

  writeFileSync(join(config.docusaurusApiDir, 'api-overview.md'), overviewContent);
  log('Generated API overview page');

  // Generate individual API pages
  apps.forEach(app => {
    const apiContent = `# ${app.packageJson.name}

${app.config.description}

## Overview

${app.packageJson.description || 'No description available.'}

**Category:** ${app.config.category}  
**Version:** ${app.packageJson.version || '1.0.0'}  
**Base URL:** \`http://localhost:${app.config.port}\`

## Quick Start

### Authentication
All endpoints require JWT authentication. Include your token in the Authorization header:

\`\`\`bash
curl -H "Authorization: Bearer <your-jwt-token>" \\
     http://localhost:${app.config.port}/api/endpoint
\`\`\`

### Example Request
\`\`\`bash
curl -X GET \\
  http://localhost:${app.config.port}/api/health \\
  -H "Content-Type: application/json"
\`\`\`

## Interactive Documentation

Visit the interactive Swagger documentation at:
[http://localhost:${app.config.port}/api/docs](http://localhost:${app.config.port}/api/docs)

## OpenAPI Specification

Download the complete OpenAPI specification:
- [JSON Format](/openapi/${app.name}.json)
- [YAML Format](/openapi/${app.name}.yaml)

## Postman Collection

Import the Postman collection for easy API testing:
- [Download Collection](/postman/${app.name}.json)

### Importing to Postman
1. Open Postman
2. Click "Import" button
3. Select "Link" tab
4. Paste: \`https://docs.tekup.org/postman/${app.name}.json\`
5. Click "Continue" and "Import"

## Client Libraries

### JavaScript/TypeScript
\`\`\`bash
npm install @tekup/api-client
\`\`\`

\`\`\`typescript
import { createApiClient } from '@tekup/api-client';

const client = createApiClient({
  baseURL: 'http://localhost:${app.config.port}',
  apiKey: 'your-jwt-token'
});

// Example usage
const result = await client.get('/api/endpoint');
\`\`\`

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

## Rate Limits

- **Requests per hour**: 1000 (development), 10000 (production)
- **Concurrent requests**: 10
- **Burst limit**: 100 requests per minute

## Webhooks

${app.name === 'flow-api' ? `
This API supports webhooks for real-time notifications:

### Supported Events
- \`lead.created\`
- \`lead.updated\`
- \`lead.status_changed\`

### Webhook Configuration
\`\`\`bash
curl -X POST http://localhost:${app.config.port}/api/webhooks \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhook",
    "events": ["lead.created", "lead.updated"],
    "secret": "your-webhook-secret"
  }'
\`\`\`
` : 'This API does not currently support webhooks.'}

## Changelog

### Version ${app.packageJson.version || '1.0.0'}
- Initial API release
- Core functionality implemented
- Authentication and authorization

## Support

- **Issues**: [GitHub Issues](https://github.com/TekUp-org/tekup-org/issues)
- **Documentation**: [API Documentation](/api)
- **Community**: [Discord Server](https://discord.gg/tekup)
- **Email**: api-support@tekup.org
`;

    writeFileSync(join(config.docusaurusApiDir, `${app.name}.md`), apiContent);
    log(`Generated API documentation page for ${app.name}`);
  });
}

function updatePackageJsonScripts() {
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  
  // Update scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'docs:openapi': 'node scripts/generate-openapi.mjs',
    'docs:openapi:build': 'cross-env EXPORT_OPENAPI=1 node scripts/generate-openapi.mjs',
    'docs:openapi:watch': 'nodemon --watch apps --ext ts,js --exec "node scripts/generate-openapi.mjs"'
  };
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('Updated package.json scripts');
}

/**
 * Main execution
 */
async function main() {
  try {
    log('🚀 Starting OpenAPI Generation Pipeline');
    
    // Get all NestJS applications
    const apps = getNestJSApps();
    log(`Found ${apps.length} NestJS applications to document`);
    
    if (apps.length === 0) {
      log('No NestJS applications found to document', 'warn');
      return;
    }

    // Ensure output directories exist
    ensureDir(config.outputDir);
    ensureDir(config.postmanDir);
    ensureDir(config.docusaurusApiDir);
    
    // Setup Swagger for apps that don't have it
    log('📝 Setting up Swagger documentation...');
    apps.forEach(app => {
      if (!app.config.hasSwagger) {
        generateSwaggerSetup(app);
        updateMainFile(app);
      }
    });
    
    // Generate OpenAPI specifications
    log('🔧 Generating OpenAPI specifications...');
    const successfulApps = [];
    for (const app of apps) {
      const success = generateOpenAPISpec(app);
      if (success) {
        successfulApps.push(app);
      }
    }
    
    // Generate Postman collections
    log('📮 Generating Postman collections...');
    successfulApps.forEach(generatePostmanCollection);
    
    // Generate Docusaurus API pages
    log('📚 Generating Docusaurus API documentation...');
    generateDocusaurusAPIPages(successfulApps);
    
    // Update package.json scripts
    log('📦 Updating package.json scripts...');
    updatePackageJsonScripts();
    
    log('✨ OpenAPI Generation Pipeline completed successfully!', 'success');
    log(`📖 OpenAPI specs available at: ${config.outputDir}`);
    log(`📮 Postman collections available at: ${config.postmanDir}`);
    log(`🌐 API documentation available at: ${config.docusaurusApiDir}`);
    
  } catch (error) {
    log(`Pipeline failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, getNestJSApps, generateOpenAPISpec };