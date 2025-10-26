#!/usr/bin/env node

/**
 * Swagger Setup Script
 * 
 * This script sets up Swagger/OpenAPI documentation for NestJS applications
 * that don't already have it configured.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
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
        return packageJson.dependencies && 
          (packageJson.dependencies['@nestjs/common'] || packageJson.dependencies['@nestjs/core']);
      } catch (error) {
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
        packageJson
      };
    });
}

function hasSwaggerDependency(app) {
  return app.packageJson.dependencies && app.packageJson.dependencies['@nestjs/swagger'];
}

function addSwaggerDependency(app) {
  if (hasSwaggerDependency(app)) {
    log(`${app.name} already has @nestjs/swagger dependency`);
    return;
  }

  const packageJsonPath = join(app.path, 'package.json');
  app.packageJson.dependencies['@nestjs/swagger'] = '^7.4.2';
  
  writeFileSync(packageJsonPath, JSON.stringify(app.packageJson, null, 2));
  log(`Added @nestjs/swagger dependency to ${app.name}`);
}

function createSwaggerSetup(app) {
  const swaggerPath = join(app.path, 'src/swagger.ts');
  
  if (existsSync(swaggerPath)) {
    log(`Swagger setup already exists for ${app.name}`);
    return;
  }

  const swaggerContent = `import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('${app.name} API')
    .setDescription('${app.packageJson.description || 'API documentation'}')
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
    .addTag('${app.name}', '${app.packageJson.description || 'API endpoints'}')
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
    customSiteTitle: '${app.name} API Documentation',
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
    
    console.log(\`✅ OpenAPI spec exported for ${app.name}\`);
    
    // Exit after exporting to prevent the app from starting
    process.exit(0);
  }
}
`;

  writeFileSync(swaggerPath, swaggerContent);
  log(`Created Swagger setup for ${app.name}`);
}

function updateMainFile(app) {
  const mainPath = join(app.path, 'src/main.ts');
  
  if (!existsSync(mainPath)) {
    log(`Main file not found for ${app.name}`, 'warn');
    return;
  }

  let content = readFileSync(mainPath, 'utf8');
  
  // Check if swagger is already imported
  if (content.includes('setupSwagger')) {
    log(`Swagger already configured in ${app.name}`);
    return;
  }

  // Add import
  if (!content.includes("import { setupSwagger } from './swagger';")) {
    const lines = content.split('\n');
    const importIndex = lines.findIndex(line => line.includes("import { NestFactory }"));
    if (importIndex !== -1) {
      lines.splice(importIndex + 1, 0, "import { setupSwagger } from './swagger';");
      content = lines.join('\n');
    }
  }

  // Add setup call
  if (!content.includes('setupSwagger(app)')) {
    const lines = content.split('\n');
    const listenIndex = lines.findIndex(line => line.includes('await app.listen('));
    if (listenIndex !== -1) {
      lines.splice(listenIndex, 0, '  setupSwagger(app);', '');
      content = lines.join('\n');
    }
  }

  writeFileSync(mainPath, content);
  log(`Updated main.ts for ${app.name}`);
}

function createOpenAPIExportScript() {
  const scriptContent = `#!/usr/bin/env node

/**
 * OpenAPI Export Script
 * Exports OpenAPI specifications from all NestJS applications
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const apps = [
  { name: 'flow-api', port: 3000 },
  { name: 'tekup-crm-api', port: 3001 },
  { name: 'tekup-lead-platform', port: 3002 },
  { name: 'secure-platform', port: 3003 },
  { name: 'voicedk-api', port: 3004 },
];

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
  console.log(\`\${prefix} [\${timestamp}] \${message}\`);
}

async function exportOpenAPI() {
  log('🚀 Starting OpenAPI export...');
  
  for (const app of apps) {
    try {
      log(\`Exporting OpenAPI spec for \${app.name}...\`);
      
      const appPath = join(rootDir, 'apps', app.name);
      
      // Build the app first
      execSync('pnpm build', { 
        cwd: appPath, 
        stdio: 'pipe' 
      });
      
      // Export OpenAPI spec
      execSync('node dist/main.js', { 
        cwd: appPath, 
        stdio: 'pipe',
        env: { ...process.env, EXPORT_OPENAPI: '1' },
        timeout: 5000
      });
      
      log(\`✅ Exported OpenAPI spec for \${app.name}\`, 'success');
    } catch (error) {
      log(\`❌ Failed to export OpenAPI spec for \${app.name}: \${error.message}\`, 'error');
    }
  }
  
  log('✨ OpenAPI export completed!', 'success');
}

exportOpenAPI();
`;

  writeFileSync(join(rootDir, 'scripts/export-openapi.mjs'), scriptContent);
  log('Created OpenAPI export script');
}

async function main() {
  try {
    log('🚀 Setting up Swagger for NestJS applications');
    
    const apps = getNestJSApps();
    log(`Found ${apps.length} NestJS applications`);
    
    if (apps.length === 0) {
      log('No NestJS applications found', 'warn');
      return;
    }

    for (const app of apps) {
      log(`Setting up Swagger for ${app.name}...`);
      
      // Add Swagger dependency if missing
      addSwaggerDependency(app);
      
      // Create Swagger setup file
      createSwaggerSetup(app);
      
      // Update main.ts file
      updateMainFile(app);
    }
    
    // Create export script
    createOpenAPIExportScript();
    
    log('✨ Swagger setup completed successfully!', 'success');
    log('💡 Run "pnpm install" to install new dependencies');
    log('💡 Run "node scripts/export-openapi.mjs" to export OpenAPI specs');
    
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();