import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { ApplicationInfo, PackageInfo, IntegrationInfo } from './types.js';

export class CodeAnalyzer {
  /**
   * Analyze applications in the apps directory
   */
  async analyzeApplications(appsPath: string): Promise<ApplicationInfo[]> {
    const applications: ApplicationInfo[] = [];
    
    try {
      const appDirs = await fs.readdir(appsPath, { withFileTypes: true });
      
      for (const dir of appDirs) {
        if (dir.isDirectory()) {
          const appPath = path.join(appsPath, dir.name);
          const appInfo = await this.analyzeApplication(appPath, dir.name);
          if (appInfo) {
            applications.push(appInfo);
          }
        }
      }
    } catch (error) {
      console.warn('Could not analyze applications:', error);
    }
    
    return applications;
  }

  /**
   * Analyze a single application
   */
  private async analyzeApplication(appPath: string, appName: string): Promise<ApplicationInfo | null> {
    try {
      const packageJsonPath = path.join(appPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      // Determine application type and framework
      const type = this.determineAppType(appName, packageJson);
      const framework = this.determineFramework(packageJson);
      
      // Extract dependencies
      const dependencies = Object.keys({
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      });
      
      return {
        name: appName,
        type,
        framework,
        path: appPath,
        dependencies
      };
    } catch (error) {
      console.warn(`Could not analyze application ${appName}:`, error);
      return null;
    }
  }

  /**
   * Analyze packages in the packages directory
   */
  async analyzePackages(packagesPath: string): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];
    
    try {
      const packageDirs = await fs.readdir(packagesPath, { withFileTypes: true });
      
      for (const dir of packageDirs) {
        if (dir.isDirectory()) {
          const packagePath = path.join(packagesPath, dir.name);
          const packageInfo = await this.analyzePackage(packagePath, dir.name);
          if (packageInfo) {
            packages.push(packageInfo);
          }
        }
      }
    } catch (error) {
      console.warn('Could not analyze packages:', error);
    }
    
    return packages;
  }

  /**
   * Analyze a single package
   */
  private async analyzePackage(packagePath: string, packageName: string): Promise<PackageInfo | null> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      // Extract exports from index file
      const exports = await this.extractExports(packagePath);
      
      return {
        name: packageJson.name || `@tekup/${packageName}`,
        version: packageJson.version || '0.1.0',
        path: packagePath,
        exports
      };
    } catch (error) {
      console.warn(`Could not analyze package ${packageName}:`, error);
      return null;
    }
  }

  /**
   * Detect integrations between applications
   */
  async detectIntegrations(applications: ApplicationInfo[]): Promise<IntegrationInfo[]> {
    const integrations: IntegrationInfo[] = [];
    
    for (const app of applications) {
      // Look for API clients and WebSocket connections
      const appIntegrations = await this.analyzeAppIntegrations(app);
      integrations.push(...appIntegrations);
    }
    
    return integrations;
  }

  /**
   * Analyze integrations for a specific application
   */
  private async analyzeAppIntegrations(app: ApplicationInfo): Promise<IntegrationInfo[]> {
    const integrations: IntegrationInfo[] = [];
    
    try {
      // Look for API client usage
      const apiClientUsage = await this.findAPIClientUsage(app.path);
      integrations.push(...apiClientUsage);
      
      // Look for WebSocket connections
      const websocketConnections = await this.findWebSocketConnections(app.path);
      integrations.push(...websocketConnections);
      
      // Look for database connections
      const dbConnections = await this.findDatabaseConnections(app.path);
      integrations.push(...dbConnections);
      
    } catch (error) {
      console.warn(`Could not analyze integrations for ${app.name}:`, error);
    }
    
    return integrations;
  }

  /**
   * Find API client usage in application
   */
  private async findAPIClientUsage(appPath: string): Promise<IntegrationInfo[]> {
    const integrations: IntegrationInfo[] = [];
    
    try {
      const files = await glob('**/*.{ts,js,tsx,jsx}', {
        cwd: appPath,
        ignore: ['**/node_modules/**', '**/dist/**']
      });
      
      for (const file of files) {
        const filePath = path.join(appPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Look for API client imports and usage
        if (content.includes('@tekup/api-client')) {
          // Extract API endpoints being called
          const endpoints = this.extractAPIEndpoints(content);
          
          for (const endpoint of endpoints) {
            integrations.push({
              source: path.basename(appPath),
              target: endpoint.service,
              type: 'api',
              description: `API call to ${endpoint.endpoint}`
            });
          }
        }
      }
    } catch (error) {
      console.warn('Could not find API client usage:', error);
    }
    
    return integrations;
  }

  /**
   * Find WebSocket connections in application
   */
  private async findWebSocketConnections(appPath: string): Promise<IntegrationInfo[]> {
    const integrations: IntegrationInfo[] = [];
    
    try {
      const files = await glob('**/*.{ts,js,tsx,jsx}', {
        cwd: appPath,
        ignore: ['**/node_modules/**', '**/dist/**']
      });
      
      for (const file of files) {
        const filePath = path.join(appPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Look for WebSocket usage
        if (content.includes('WebSocket') || content.includes('socket.io')) {
          integrations.push({
            source: path.basename(appPath),
            target: 'websocket-server',
            type: 'websocket',
            description: 'WebSocket connection for real-time communication'
          });
        }
      }
    } catch (error) {
      console.warn('Could not find WebSocket connections:', error);
    }
    
    return integrations;
  }

  /**
   * Find database connections in application
   */
  private async findDatabaseConnections(appPath: string): Promise<IntegrationInfo[]> {
    const integrations: IntegrationInfo[] = [];
    
    try {
      // Look for Prisma schema
      const prismaSchemaPath = path.join(appPath, 'prisma', 'schema.prisma');
      try {
        await fs.access(prismaSchemaPath);
        integrations.push({
          source: path.basename(appPath),
          target: 'postgresql',
          type: 'database',
          description: 'PostgreSQL database connection via Prisma'
        });
      } catch {
        // No Prisma schema found
      }
      
      // Look for other database connections in code
      const files = await glob('**/*.{ts,js}', {
        cwd: appPath,
        ignore: ['**/node_modules/**', '**/dist/**']
      });
      
      for (const file of files) {
        const filePath = path.join(appPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        if (content.includes('mongoose') || content.includes('mongodb')) {
          integrations.push({
            source: path.basename(appPath),
            target: 'mongodb',
            type: 'database',
            description: 'MongoDB connection'
          });
        }
      }
    } catch (error) {
      console.warn('Could not find database connections:', error);
    }
    
    return integrations;
  }

  /**
   * Extract exports from package index file
   */
  private async extractExports(packagePath: string): Promise<string[]> {
    const exports: string[] = [];
    
    try {
      const indexFiles = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];
      
      for (const indexFile of indexFiles) {
        const indexPath = path.join(packagePath, indexFile);
        try {
          const content = await fs.readFile(indexPath, 'utf-8');
          
          // Extract export statements
          const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
          if (exportMatches) {
            for (const match of exportMatches) {
              const exportName = match.match(/(\w+)$/)?.[1];
              if (exportName) {
                exports.push(exportName);
              }
            }
          }
          
          // Extract named exports
          const namedExportMatches = content.match(/export\s*\{([^}]+)\}/g);
          if (namedExportMatches) {
            for (const match of namedExportMatches) {
              const names = match.match(/\{([^}]+)\}/)?.[1];
              if (names) {
                const exportNames = names.split(',').map(name => name.trim());
                exports.push(...exportNames);
              }
            }
          }
          
          break; // Found index file, stop looking
        } catch {
          // Index file not found, try next
        }
      }
    } catch (error) {
      console.warn('Could not extract exports:', error);
    }
    
    return exports;
  }

  /**
   * Determine application type from name and package.json
   */
  private determineAppType(appName: string, packageJson: any): ApplicationInfo['type'] {
    if (appName.includes('-api') || packageJson.dependencies?.['@nestjs/core']) {
      return 'api';
    }
    if (appName.includes('-web') || packageJson.dependencies?.['next']) {
      return 'web';
    }
    if (packageJson.dependencies?.['electron']) {
      return 'desktop';
    }
    if (packageJson.dependencies?.['react-native']) {
      return 'mobile';
    }
    return 'web'; // Default
  }

  /**
   * Determine framework from package.json dependencies
   */
  private determineFramework(packageJson: any): string {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps['@nestjs/core']) return 'NestJS';
    if (deps['next']) return 'Next.js';
    if (deps['react']) return 'React';
    if (deps['vue']) return 'Vue.js';
    if (deps['electron']) return 'Electron';
    if (deps['react-native']) return 'React Native';
    
    return 'Unknown';
  }

  /**
   * Extract API endpoints from code content
   */
  private extractAPIEndpoints(content: string): Array<{ service: string; endpoint: string }> {
    const endpoints: Array<{ service: string; endpoint: string }> = [];
    
    // This is a simplified implementation - in practice, this would be more sophisticated
    const apiCallMatches = content.match(/api\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g);
    
    if (apiCallMatches) {
      for (const match of apiCallMatches) {
        const endpointMatch = match.match(/['"`]([^'"`]+)['"`]/);
        if (endpointMatch) {
          endpoints.push({
            service: 'api-service', // Would need more sophisticated detection
            endpoint: endpointMatch[1]
          });
        }
      }
    }
    
    return endpoints;
  }
}