import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLoggerService } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  tenantId: string;
  active: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  rotationCount: number;
  scopes: string[];
  permissions: string[];
  description?: string;
  environment: string;
  createdAt: Date;
}

export interface CreateApiKeyOptions {
  tenantId: string;
  description?: string;
  expiresAt?: Date;
  scopes?: string[];
  permissions?: string[];
  ipWhitelist?: string[];
  userAgent?: string;
  environment?: string;
}

export interface RotateApiKeyOptions {
  reason?: string;
  rotatedBy?: string;
  newExpiresAt?: Date;
  keepOldKeyActiveFor?: number; // Minutes to keep old key active
}

export interface ApiKeyValidationResult {
  valid: boolean;
  apiKey?: ApiKeyInfo;
  reason?: string;
  shouldRotate?: boolean;
}

export interface ApiKeyUsageData {
  endpoint: string;
  method: string;
  responseStatus: number;
  responseTime?: number;
  userAgent?: string;
  ipAddress?: string;
  requestSize?: number;
  responseSize?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class EnhancedApiKeyService {
  private readonly logger = new Logger(EnhancedApiKeyService.name);
  private readonly saltRounds = 12;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly structuredLogger: StructuredLoggerService,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    // Start background cleanup tasks
    this.startBackgroundCleanup();
  }

  /**
   * Create a new API key with enhanced security features
   */
  async createApiKey(options: CreateApiKeyOptions): Promise<{ apiKey: ApiKeyInfo; rawKey: string }> {
    const rawKey = this.generateSecureKey();
    const hashedKey = await bcrypt.hash(rawKey, this.saltRounds);
    const keyPrefix = rawKey.substring(0, 8);

    try {
      const apiKey = await this.prisma.apiKey.create({
        data: {
          tenantId: options.tenantId,
          hashedKey,
          keyPrefix,
          active: true,
          expiresAt: options.expiresAt,
          scopes: options.scopes || [],
          permissions: options.permissions || [],
          ipWhitelist: options.ipWhitelist || [],
          userAgent: options.userAgent,
          description: options.description,
          environment: options.environment || 'production',
          rotationCount: 0,
        },
      });

      const apiKeyInfo: ApiKeyInfo = {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix!,
        tenantId: apiKey.tenantId,
        active: apiKey.active,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        rotationCount: apiKey.rotationCount,
        scopes: apiKey.scopes,
        permissions: apiKey.permissions,
        description: apiKey.description,
        environment: apiKey.environment,
        createdAt: apiKey.createdAt,
      };

      this.structuredLogger.log(
        'API key created',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            apiKeyId: apiKey.id,
            tenantId: options.tenantId,
            keyPrefix,
            expiresAt: options.expiresAt,
            environment: options.environment,
            scopeCount: options.scopes?.length || 0,
            permissionCount: options.permissions?.length || 0,
          },
        }
      );

      this.metricsService.increment('api_key_created_total', {
        tenant: options.tenantId,
        environment: options.environment || 'production',
      });

      return { apiKey: apiKeyInfo, rawKey };
    } catch (error) {
      this.logger.error('Failed to create API key:', error);
      throw new BadRequestException('Failed to create API key');
    }
  }

  /**
   * Validate an API key and return key information
   */
  async validateApiKey(rawKey: string, ipAddress?: string, userAgent?: string): Promise<ApiKeyValidationResult> {
    if (!rawKey) {
      return { valid: false, reason: 'Missing key' };
    }

    // Legacy key support: check plain 'key' column first (for dev/auto-seed)
    try {
      const legacyKey = await this.prisma.apiKey.findFirst({
        where: {
          key: rawKey,
          active: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
          revokedAt: null,
        },
        include: {
          tenant: true,
        },
      });

      if (legacyKey) {
        this.structuredLogger.warn(
          'Legacy API key used - should be migrated',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              apiKeyId: legacyKey.id,
              tenantId: legacyKey.tenantId,
            },
          }
        );

        this.metricsService.increment('api_key_validation_success_total', {
          tenant: legacyKey.tenantId,
          environment: legacyKey.environment,
        });

        const apiKeyInfo: ApiKeyInfo = {
          id: legacyKey.id,
          keyPrefix: rawKey.substring(0, 8),
          tenantId: legacyKey.tenantId,
          active: legacyKey.active,
          expiresAt: legacyKey.expiresAt,
          lastUsedAt: legacyKey.lastUsedAt,
          rotationCount: legacyKey.rotationCount,
          scopes: legacyKey.scopes,
          permissions: legacyKey.permissions,
          description: legacyKey.description,
          environment: legacyKey.environment,
          createdAt: legacyKey.createdAt,
        };

        // Encourage rotation for legacy keys
        return { valid: true, apiKey: apiKeyInfo, shouldRotate: true };
      }
    } catch (e) {
      // ignore and continue with hashed validation
    }

    if (rawKey.length < 32) {
      return { valid: false, reason: 'Invalid key format' };
    }

    const keyPrefix = rawKey.substring(0, 8);

    try {
      // Find potential keys by prefix for efficiency
      const potentialKeys = await this.prisma.apiKey.findMany({
        where: {
          keyPrefix,
          active: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
          revokedAt: null,
        },
        include: {
          tenant: true,
        },
      });

      // Check each potential key with bcrypt
      for (const apiKey of potentialKeys) {
        if (apiKey.hashedKey && await bcrypt.compare(rawKey, apiKey.hashedKey)) {
          // Validate IP whitelist
          if (apiKey.ipWhitelist.length > 0 && ipAddress) {
            if (!this.isIpWhitelisted(ipAddress, apiKey.ipWhitelist)) {
              this.structuredLogger.warn(
                'API key access denied - IP not whitelisted',
                {
                  ...this.contextService.toLogContext(),
                  metadata: {
                    apiKeyId: apiKey.id,
                    keyPrefix: apiKey.keyPrefix,
                    ipAddress,
                    whitelist: apiKey.ipWhitelist,
                  },
                }
              );
              
              this.metricsService.increment('api_key_validation_failed_total', {
                tenant: apiKey.tenantId,
                reason: 'ip_not_whitelisted',
              });
              
              return { valid: false, reason: 'IP address not whitelisted' };
            }
          }

          // Validate User-Agent if specified
          if (apiKey.userAgent && userAgent && !userAgent.includes(apiKey.userAgent)) {
            this.structuredLogger.warn(
              'API key access denied - User-Agent mismatch',
              {
                ...this.contextService.toLogContext(),
                metadata: {
                  apiKeyId: apiKey.id,
                  keyPrefix: apiKey.keyPrefix,
                  expectedUserAgent: apiKey.userAgent,
                  actualUserAgent: userAgent,
                },
              }
            );
            
            this.metricsService.increment('api_key_validation_failed_total', {
              tenant: apiKey.tenantId,
              reason: 'user_agent_mismatch',
            });
            
            return { valid: false, reason: 'User-Agent mismatch' };
          }

          // Update last used timestamp
          await this.updateLastUsed(apiKey.id);

          const apiKeyInfo: ApiKeyInfo = {
            id: apiKey.id,
            keyPrefix: apiKey.keyPrefix!,
            tenantId: apiKey.tenantId,
            active: apiKey.active,
            expiresAt: apiKey.expiresAt,
            lastUsedAt: new Date(), // Just updated
            rotationCount: apiKey.rotationCount,
            scopes: apiKey.scopes,
            permissions: apiKey.permissions,
            description: apiKey.description,
            environment: apiKey.environment,
            createdAt: apiKey.createdAt,
          };

          // Check if key should be rotated (based on age, usage, etc.)
          const shouldRotate = this.shouldRotateKey(apiKey);

          this.metricsService.increment('api_key_validation_success_total', {
            tenant: apiKey.tenantId,
            environment: apiKey.environment,
          });

          return { valid: true, apiKey: apiKeyInfo, shouldRotate };
        }
      }

      

      this.metricsService.increment('api_key_validation_failed_total', {
        reason: 'key_not_found',
      });

      return { valid: false, reason: 'Invalid or expired API key' };
    } catch (error) {
      this.logger.error('API key validation error:', error);
      this.metricsService.increment('api_key_validation_error_total');
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Rotate an API key
   */
  async rotateApiKey(apiKeyId: string, options: RotateApiKeyOptions = {}): Promise<{ apiKey: ApiKeyInfo; rawKey: string }> {
    const existingKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!existingKey || !existingKey.active) {
      throw new BadRequestException('API key not found or inactive');
    }

    const newRawKey = this.generateSecureKey();
    const newHashedKey = await bcrypt.hash(newRawKey, this.saltRounds);
    const newKeyPrefix = newRawKey.substring(0, 8);

    try {
      // Create rotation history entry
      await this.prisma.apiKeyRotationHistory.create({
        data: {
          apiKeyId: existingKey.id,
          oldKeyPrefix: existingKey.keyPrefix,
          newKeyPrefix,
          rotatedBy: options.rotatedBy,
          reason: options.reason,
          metadata: {
            oldRotationCount: existingKey.rotationCount,
            rotatedAt: new Date(),
          },
        },
      });

      // Update the API key
      const updatedKey = await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          hashedKey: newHashedKey,
          keyPrefix: newKeyPrefix,
          rotatedFrom: existingKey.keyPrefix,
          rotationCount: existingKey.rotationCount + 1,
          expiresAt: options.newExpiresAt,
          // Clear legacy key field
          key: null,
        },
      });

      // Optionally keep old key active for transition period
      if (options.keepOldKeyActiveFor && options.keepOldKeyActiveFor > 0) {
        setTimeout(async () => {
          try {
            await this.revokeApiKey(apiKeyId, 'Automatic revocation after rotation period', 'system');
          } catch (error) {
            this.logger.error('Failed to revoke old key after rotation:', error);
          }
        }, options.keepOldKeyActiveFor * 60 * 1000);
      }

      const apiKeyInfo: ApiKeyInfo = {
        id: updatedKey.id,
        keyPrefix: updatedKey.keyPrefix!,
        tenantId: updatedKey.tenantId,
        active: updatedKey.active,
        expiresAt: updatedKey.expiresAt,
        lastUsedAt: updatedKey.lastUsedAt,
        rotationCount: updatedKey.rotationCount,
        scopes: updatedKey.scopes,
        permissions: updatedKey.permissions,
        description: updatedKey.description,
        environment: updatedKey.environment,
        createdAt: updatedKey.createdAt,
      };

      this.structuredLogger.log(
        'API key rotated',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            apiKeyId: updatedKey.id,
            tenantId: updatedKey.tenantId,
            oldPrefix: existingKey.keyPrefix,
            newPrefix: newKeyPrefix,
            rotationCount: updatedKey.rotationCount,
            reason: options.reason,
            rotatedBy: options.rotatedBy,
          },
        }
      );

      this.metricsService.increment('api_key_rotated_total', {
        tenant: updatedKey.tenantId,
        environment: updatedKey.environment,
      });

      return { apiKey: apiKeyInfo, rawKey: newRawKey };
    } catch (error) {
      this.logger.error('Failed to rotate API key:', error);
      throw new BadRequestException('Failed to rotate API key');
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: string, reason: string, revokedBy: string): Promise<void> {
    try {
      const apiKey = await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          active: false,
          revokedAt: new Date(),
          revokedBy,
          revokedReason: reason,
        },
      });

      this.structuredLogger.log(
        'API key revoked',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            apiKeyId,
            tenantId: apiKey.tenantId,
            keyPrefix: apiKey.keyPrefix,
            reason,
            revokedBy,
          },
        }
      );

      this.metricsService.increment('api_key_revoked_total', {
        tenant: apiKey.tenantId,
        environment: apiKey.environment,
      });
    } catch (error) {
      this.logger.error(`Failed to revoke API key ${apiKeyId}:`, error);
      throw new BadRequestException('Failed to revoke API key');
    }
  }

  /**
   * Log API key usage
   */
  async logUsage(apiKeyId: string, usageData: ApiKeyUsageData): Promise<void> {
    try {
      await this.prisma.apiKeyUsageLog.create({
        data: {
          apiKeyId,
          endpoint: usageData.endpoint,
          method: usageData.method,
          responseStatus: usageData.responseStatus,
          responseTime: usageData.responseTime,
          userAgent: usageData.userAgent,
          ipAddress: usageData.ipAddress,
          requestSize: usageData.requestSize,
          responseSize: usageData.responseSize,
          metadata: usageData.metadata,
        },
      });

      this.metricsService.increment('api_key_usage_logged_total', {
        endpoint: usageData.endpoint,
        method: usageData.method,
        status: usageData.responseStatus.toString(),
      });
    } catch (error) {
      // Don't fail the request if usage logging fails
      this.logger.error('Failed to log API key usage:', error);
    }
  }

  /**
   * Get API key information by ID
   */
  async getApiKeyInfo(apiKeyId: string): Promise<ApiKeyInfo | null> {
    try {
      const apiKey = await this.prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      if (!apiKey) {
        return null;
      }

      return {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix || 'legacy',
        tenantId: apiKey.tenantId,
        active: apiKey.active,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        rotationCount: apiKey.rotationCount,
        scopes: apiKey.scopes,
        permissions: apiKey.permissions,
        description: apiKey.description,
        environment: apiKey.environment,
        createdAt: apiKey.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get API key info for ${apiKeyId}:`, error);
      return null;
    }
  }

  /**
   * List API keys for a tenant
   */
  async listApiKeys(tenantId: string, includeInactive: boolean = false): Promise<ApiKeyInfo[]> {
    try {
      const whereClause: any = { tenantId };
      if (!includeInactive) {
        whereClause.active = true;
        whereClause.revokedAt = null;
      }

      const apiKeys = await this.prisma.apiKey.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      return apiKeys.map((key: any) => ({
        id: key.id,
        keyPrefix: key.keyPrefix || 'legacy',
        tenantId: key.tenantId,
        active: key.active,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        rotationCount: key.rotationCount,
        scopes: key.scopes,
        permissions: key.permissions,
        description: key.description,
        environment: key.environment,
        createdAt: key.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to list API keys for tenant ${tenantId}:`, error);
      return [];
    }
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const result = await this.prisma.apiKey.updateMany({
        where: {
          active: true,
          expiresAt: { lt: new Date() },
          revokedAt: null,
        },
        data: {
          active: false,
          revokedAt: new Date(),
          revokedReason: 'Expired automatically',
        },
      });

      if (result.count > 0) {
        this.structuredLogger.log(
          `Cleaned up ${result.count} expired API keys`,
          this.contextService.toLogContext()
        );

        this.metricsService.increment('api_key_cleanup_expired_total', {
          count: result.count.toString(),
        });
      }

      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired API keys:', error);
      return 0;
    }
  }

  private generateSecureKey(): string {
    const keyLength = 32;
    const randomBytes = crypto.randomBytes(keyLength);
    return `pk_${randomBytes.toString('hex')}`;
  }

  private isIpWhitelisted(ipAddress: string, whitelist: string[]): boolean {
    if (whitelist.length === 0) return true;
    
    // Support CIDR notation and exact matches
    for (const whitelistEntry of whitelist) {
      if (whitelistEntry === ipAddress) return true;
      
      // Basic CIDR check (simplified, could be enhanced with proper CIDR library)
      if (whitelistEntry.includes('/')) {
        const [network, prefixLength] = whitelistEntry.split('/');
        // Simplified IP range check - in production use proper CIDR library
        if (ipAddress.startsWith(network.split('.').slice(0, Math.floor(parseInt(prefixLength) / 8)).join('.'))) {
          return true;
        }
      }
    }
    
    return false;
  }

  private shouldRotateKey(apiKey: any): boolean {
    // Key should be rotated if:
    
    // 1. It's a legacy key (no hashed version)
    if (!apiKey.hashedKey) return true;
    
    // 2. It's very old (e.g., > 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    if (apiKey.createdAt < ninetyDaysAgo) return true;
    
    // 3. It has been rotated many times (potential security issue)
    if (apiKey.rotationCount > 10) return true;
    
    // 4. It hasn't been used recently but is still active
    if (apiKey.lastUsedAt) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (apiKey.lastUsedAt < thirtyDaysAgo) return true;
    }
    
    return false;
  }

  private async updateLastUsed(apiKeyId: string): Promise<void> {
    try {
      await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      // Don't fail validation if we can't update timestamp
      this.logger.debug(`Failed to update lastUsedAt for key ${apiKeyId}:`, error);
    }
  }

  private startBackgroundCleanup(): void {
    // Clean up expired keys every hour
    setInterval(async () => {
      try {
        await this.cleanupExpiredKeys();
      } catch (error) {
        this.logger.error('Background cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Clean up old usage logs every day (keep 90 days)
    setInterval(async () => {
      try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const result = await this.prisma.apiKeyUsageLog.deleteMany({
          where: { timestamp: { lt: ninetyDaysAgo } },
        });
        
        if (result.count > 0) {
          this.structuredLogger.log(
            `Cleaned up ${result.count} old usage log entries`,
            this.contextService.toLogContext()
          );
        }
      } catch (error) {
        this.logger.error('Usage log cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
}