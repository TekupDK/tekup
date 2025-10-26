import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHmac } from 'crypto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private prisma: PrismaService) {}

  async generateApiKey(tenantId: string, name: string, permissions: string[]) {
    try {
      // Generate a random API key
      const key = randomBytes(32).toString('hex');
      
      // Create a hash for storage (never store the actual key)
      const hash = createHmac('sha256', process.env.API_KEY_SECRET || 'default-secret')
        .update(key)
        .digest('hex');

      // Store the hashed key in the database
      const apiKey = await this.prisma.ApiKey.create({
        data: {
          tenantId,
          name,
          hash,
          permissions,
        },
      });

      this.logger.log(`Generated API key ${name} for tenant ${tenantId}`);
      
      // Return the actual key only once (it should be stored securely by the client)
      return {
        id: apiKey.id,
        key, // This is the only time the actual key is returned
        name: apiKey.name,
        createdAt: apiKey.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to generate API key: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateApiKey(key: string, requiredPermissions: string[] = []): Promise<{ tenantId: string; name: string } | null> {
    try {
      // Create hash of the provided key
      const hash = createHmac('sha256', process.env.API_KEY_SECRET || 'default-secret')
        .update(key)
        .digest('hex');

      // Look up the key in the database
      const apiKey = await this.prisma.ApiKey.findUnique({
        where: {
          hash,
        },
      });

      if (!apiKey) {
        return null;
      }

      // Check if the key has the required permissions
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(permission => 
          apiKey.permissions.includes(permission)
        );
        
        if (!hasPermission) {
          return null;
        }
      }

      return {
        tenantId: apiKey.tenantId,
        name: apiKey.name,
      };
    } catch (error) {
      this.logger.error(`Failed to validate API key: ${error.message}`, error.stack);
      return null;
    }
  }

  async revokeApiKey(id: string, tenantId: string) {
    try {
      await this.prisma.ApiKey.delete({
        where: {
          id,
          tenantId,
        },
      });

      this.logger.log(`Revoked API key ${id} for tenant ${tenantId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to revoke API key: ${error.message}`, error.stack);
      throw error;
    }
  }

  async listApiKeys(tenantId: string) {
    try {
      const apiKeys = await this.prisma.ApiKey.findMany({
        where: {
          tenantId,
        },
        select: {
          id: true,
          name: true,
          permissions: true,
          createdAt: true,
          lastUsedAt: true,
        },
      });

      return apiKeys;
    } catch (error) {
      this.logger.error(`Failed to list API keys: ${error.message}`, error.stack);
      throw error;
    }
  }
}