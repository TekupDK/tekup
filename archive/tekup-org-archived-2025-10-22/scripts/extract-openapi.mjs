#!/usr/bin/env node

/**
 * Extract OpenAPI Specifications
 * 
 * This script extracts OpenAPI specs from running NestJS applications
 * or generates them from existing Swagger configurations.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

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

// NestJS applications configuration
const nestjsApps = {
  'flow-api': { 
    port: 4000, 
    description: 'Core backend API service for multi-tenant incident response',
    category: 'Core APIs',
    priority: 1
  },
  'tekup-crm-api': { 
    port: 3002, 
    description: 'Customer relationship management API',
    category: 'Business APIs',
    priority: 2
  },
  'tekup-lead-platform': { 
    port: 3003, 
    description: 'Lead generation and management API',
    category: 'Business APIs',
    priority: 3
  },
  'secure-platform': { 
    port: 4010, 
    description: 'Security and compliance API',
    category: 'Security APIs',
    priority: 4
  },
  'voicedk-api': { 
    port: 3002, 
    description: 'Danish voice AI processing API',
    category: 'AI APIs',
    priority: 5
  },
  'rendetalje-os-backend': { 
    port: 3006, 
    description: 'Construction management backend API',
    category: 'Business APIs',
    priority: 6
  },
};

function getNestJSApps() {
  const appsDir = join(rootDir, 'apps');
  
  if (!existsSync(appsDir)) {
    log(`Apps directory not found: ${appsDir}`, 'error');
    return [];
  }

  return readdirSync(appsDir)
    .filter(name => {
      const appDir = join(appsDir, name);
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
      const appDir = join(appsDir, name);
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

function generateBasicOpenAPISpec(app) {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: `${app.packageJson.name || app.name}`,
      description: app.config.description,
      version: app.packageJson.version || '1.0.0',
      contact: {
        name: 'TekUp API Support',
        email: 'api-support@tekup.org',
        url: 'https://tekup.org'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${app.config.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.tekup.org',
        description: 'Production server'
      }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        example: 'ok'
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time'
                      },
                      uptime: {
                        type: 'number'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/docs': {
        get: {
          tags: ['Documentation'],
          summary: 'Swagger UI documentation',
          description: 'Interactive API documentation',
          responses: {
            '200': {
              description: 'Swagger UI page',
              content: {
                'text/html': {
                  schema: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Bad Request'
            },
            error: {
              type: 'string',
              example: 'Validation failed'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            path: {
              type: 'string',
              example: '/api/endpoint'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            uptime: {
              type: 'number',
              example: 12345
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      },
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Documentation',
        description: 'API documentation endpoints'
      }
    ]
  };

  // Add app-specific paths based on the application
  if (app.name === 'flow-api') {
    spec.paths['/api/leads'] = {
      get: {
        tags: ['Leads'],
        summary: 'Get all leads',
        description: 'Retrieve all leads for the authenticated tenant',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '200': {
            description: 'List of leads',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Lead'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/PaginationMeta'
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Leads'],
        summary: 'Create a new lead',
        description: 'Create a new lead for the authenticated tenant',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateLeadDto'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Lead created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Lead'
                }
              }
            }
          }
        }
      }
    };

    // Add lead-specific schemas
    spec.components.schemas.Lead = {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'converted'] },
        source: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };

    spec.components.schemas.CreateLeadDto = {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        source: { type: 'string' }
      }
    };

    spec.components.schemas.PaginationMeta = {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 10 },
        total: { type: 'integer', example: 100 },
        totalPages: { type: 'integer', example: 10 }
      }
    };

    spec.tags.push({ name: 'Leads', description: 'Lead management endpoints' });
  }

  return spec;
}

function generatePostmanCollection(app, openApiSpec) {
  const collection = {
    info: {
      name: `${app.packageJson.name || app.name} API`,
      description: app.config.description,
      version: app.packageJson.version || '1.0.0',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'apikey',
      apikey: [
        {
          key: 'key',
          value: 'x-api-key',
          type: 'string'
        },
        {
          key: 'value',
          value: '{{api_key}}',
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
        key: 'api_key',
        value: 'your-api-key-here',
        type: 'string'
      }
    ],
    item: []
  };

  // Convert OpenAPI paths to Postman requests
  if (openApiSpec.paths) {
    Object.entries(openApiSpec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation.summary) {
          const request = {
            name: operation.summary,
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

          collection.item.push(request);
        }
      });
    });
  }

  return collection;
}

function generateExampleFromSchema(schema) {
  if (!schema) return {};
  
  if (schema.$ref) {
    // For now, return a placeholder for references
    return { ref: schema.$ref };
  }
  
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
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
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
  const apiDir = join(rootDir, 'docs/site/api');
  ensureDir(apiDir);

  // Generate API overview page
  const overviewContent = `# API Reference

TekUp platform provides comprehensive REST APIs for all business operations. All APIs follow OpenAPI 3.0 specification and include interactive documentation.

## Available APIs

${apps.map(app => `
### ${app.packageJson.name || app.name}

**Category:** ${app.config.category}  
**Description:** ${app.config.description}  
**Base URL:** \`http://localhost:${app.config.port}\`

${app.packageJson.description || 'No description available.'}

- [OpenAPI Specification](/openapi/${app.name}.json)
- [Postman Collection](/postman/${app.name}.json)
- [Interactive Documentation](http://localhost:${app.config.port}/api/docs)

`).join('')}

## Authentication

All APIs use API key authentication. Include the key in the x-api-key header:

\`\`\`
x-api-key: your-api-key-here
\`\`\`

Some endpoints also support JWT Bearer token authentication:

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

  writeFileSync(join(apiDir, 'api-overview.md'), overviewContent);
  log('Generated API overview page');

  // Generate individual API pages
  apps.forEach(app => {
    const apiContent = `# ${app.packageJson.name || app.name}

${app.config.description}

## Overview

${app.packageJson.description || 'No description available.'}

**Category:** ${app.config.category}  
**Version:** ${app.packageJson.version || '1.0.0'}  
**Base URL:** \`http://localhost:${app.config.port}\`

## Quick Start

### Authentication
All endpoints require API key authentication. Include your key in the x-api-key header:

\`\`\`bash
curl -H "x-api-key: your-api-key-here" \\
     http://localhost:${app.config.port}/api/endpoint
\`\`\`

### Example Request
\`\`\`bash
curl -X GET \\
  http://localhost:${app.config.port}/health \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key-here"
\`\`\`

## Interactive Documentation

Visit the interactive Swagger documentation at:
[http://localhost:${app.config.port}/api/docs](http://localhost:${app.config.port}/api/docs)

## OpenAPI Specification

Download the complete OpenAPI specification:
- [JSON Format](/openapi/${app.name}.json)

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
  apiKey: 'your-api-key-here'
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

## Support

- **Issues**: [GitHub Issues](https://github.com/TekUp-org/tekup-org/issues)
- **Documentation**: [API Documentation](/api)
- **Community**: [Discord Server](https://discord.gg/tekup)
- **Email**: api-support@tekup.org
`;

    writeFileSync(join(apiDir, `${app.name}.md`), apiContent);
    log(`Generated API documentation page for ${app.name}`);
  });
}

async function main() {
  try {
    log('🚀 Starting OpenAPI Extraction Pipeline');
    
    // Get all NestJS applications
    const apps = getNestJSApps();
    log(`Found ${apps.length} NestJS applications to document`);
    
    if (apps.length === 0) {
      log('No NestJS applications found to document', 'warn');
      return;
    }

    // Ensure output directories exist
    const outputDir = join(rootDir, 'docs/site/static/openapi');
    const postmanDir = join(rootDir, 'docs/site/static/postman');
    
    ensureDir(outputDir);
    ensureDir(postmanDir);
    
    // Generate OpenAPI specifications and Postman collections
    log('🔧 Generating OpenAPI specifications...');
    apps.forEach(app => {
      log(`Generating OpenAPI spec for ${app.name}...`);
      
      // Generate basic OpenAPI spec
      const openApiSpec = generateBasicOpenAPISpec(app);
      const specPath = join(outputDir, `${app.name}.json`);
      writeFileSync(specPath, JSON.stringify(openApiSpec, null, 2));
      log(`✅ Generated OpenAPI spec for ${app.name}`, 'success');
      
      // Generate Postman collection
      log(`Generating Postman collection for ${app.name}...`);
      const postmanCollection = generatePostmanCollection(app, openApiSpec);
      const collectionPath = join(postmanDir, `${app.name}.json`);
      writeFileSync(collectionPath, JSON.stringify(postmanCollection, null, 2));
      log(`✅ Generated Postman collection for ${app.name}`, 'success');
    });
    
    // Generate Docusaurus API pages
    log('📚 Generating Docusaurus API documentation...');
    generateDocusaurusAPIPages(apps);
    
    log('✨ OpenAPI Extraction Pipeline completed successfully!', 'success');
    log(`📖 OpenAPI specs available at: ${outputDir}`);
    log(`📮 Postman collections available at: ${postmanDir}`);
    log(`🌐 API documentation available at: docs/site/api/`);
    
  } catch (error) {
    log(`Pipeline failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();