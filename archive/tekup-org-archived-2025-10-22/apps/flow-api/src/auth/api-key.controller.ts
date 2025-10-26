import { 
  Body, 
  Controller, 
  Post, 
  Patch, 
  Param, 
  Get, 
  Delete,
  Query,
  UnauthorizedException, 
  BadRequestException,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EnhancedApiKeyService, CreateApiKeyOptions, RotateApiKeyOptions } from './enhanced-api-key.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { IsString, IsOptional, IsDateString, IsArray, IsEnum, IsNumber, Min } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  tenantSlug: string = '';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsEnum(['development', 'staging', 'production'])
  environment?: string;
}

export class RotateApiKeyDto {
  @IsString()
  apiKeyId: string = '';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  rotatedBy?: string;

  @IsOptional()
  @IsDateString()
  newExpiresAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  keepOldKeyActiveFor?: number; // minutes
}

export class RevokeApiKeyDto {
  @IsString()
  reason: string = '';

  @IsOptional()
  @IsString()
  revokedBy?: string;
}

export class ListApiKeysDto {
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @IsOptional()
  includeInactive?: boolean;
}

@Controller('auth/api-keys')
export class ApiKeyController {
  constructor(
    private prisma: PrismaService,
    private enhancedApiKeyService: EnhancedApiKeyService,
    private logger: StructuredLogger,
    private contextService: AsyncContextService
  ) {}

  /**
   * List API keys for a tenant (admin endpoint)
   */
  @Get()
  async list(@Query() dto: ListApiKeysDto) {
    let tenantId: string;
    
    if (dto.tenantSlug) {
      const tenant = await this.prisma.tenant.findFirst({ 
        where: { slug: dto.tenantSlug } 
      });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }
      tenantId = tenant.id;
    } else {
      // If no tenant specified, require admin privileges (simplified for demo)
      throw new BadRequestException('Tenant slug required');
    }

    const apiKeys = await this.enhancedApiKeyService.listApiKeys(
      tenantId, 
      dto.includeInactive || false
    );

    this.logger.logBusinessEvent(
      'api_keys_listed',
      'api_key',
      tenantId,
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          keyCount: apiKeys.length,
          includeInactive: dto.includeInactive,
        },
      }
    );

    return {
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        keyPrefix: key.keyPrefix,
        active: key.active,
        description: key.description,
        environment: key.environment,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        rotationCount: key.rotationCount,
        scopes: key.scopes,
        permissions: key.permissions,
        createdAt: key.createdAt,
      })),
      count: apiKeys.length,
    };
  }

  /**
   * Create a new API key with enhanced security features
   */
  @Post('create')
  async create(@Body(ValidationPipe) dto: CreateApiKeyDto) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { slug: dto.tenantSlug } 
    });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const options: CreateApiKeyOptions = {
      tenantId: tenant.id,
      description: dto.description,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      scopes: dto.scopes,
      permissions: dto.permissions,
      ipWhitelist: dto.ipWhitelist,
      userAgent: dto.userAgent,
      environment: dto.environment,
    };

    const { apiKey, rawKey } = await this.enhancedApiKeyService.createApiKey(options);

    return {
      key: rawKey,
      keyInfo: {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
        expiresAt: apiKey.expiresAt,
        description: apiKey.description,
        environment: apiKey.environment,
        scopes: apiKey.scopes,
        permissions: apiKey.permissions,
      },
      warning: 'Store this key securely. It will not be shown again.',
    };
  }

  /**
   * Rotate an existing API key
   */
  @Post('rotate')
  async rotate(@Body(ValidationPipe) dto: RotateApiKeyDto) {
    const options: RotateApiKeyOptions = {
      reason: dto.reason,
      rotatedBy: dto.rotatedBy,
      newExpiresAt: dto.newExpiresAt ? new Date(dto.newExpiresAt) : undefined,
      keepOldKeyActiveFor: dto.keepOldKeyActiveFor,
    };

    const { apiKey, rawKey } = await this.enhancedApiKeyService.rotateApiKey(
      dto.apiKeyId,
      options
    );

    return {
      key: rawKey,
      keyInfo: {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
        rotationCount: apiKey.rotationCount,
        expiresAt: apiKey.expiresAt,
      },
      previousKeyPrefix: apiKey.keyPrefix, // This would be updated to show old prefix
      warning: 'Store this new key securely. The old key will be deactivated according to your settings.',
    };
  }

  /**
   * Revoke/deactivate an API key
   */
  @Delete(':id/revoke')
  async revoke(
    @Param('id') apiKeyId: string, 
    @Body(ValidationPipe) dto: RevokeApiKeyDto
  ) {
    await this.enhancedApiKeyService.revokeApiKey(
      apiKeyId,
      dto.reason,
      dto.revokedBy || 'admin'
    );

    return {
      success: true,
      message: 'API key has been revoked',
      revokedAt: new Date(),
      reason: dto.reason,
    };
  }

  /**
   * Get detailed information about an API key
   */
  @Get(':id')
  async getInfo(@Param('id') apiKeyId: string) {
    const apiKey = await this.enhancedApiKeyService.getApiKeyInfo(apiKeyId);
    
    if (!apiKey) {
      throw new BadRequestException('API key not found');
    }

    return {
      keyInfo: {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
        active: apiKey.active,
        description: apiKey.description,
        environment: apiKey.environment,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        rotationCount: apiKey.rotationCount,
        scopes: apiKey.scopes,
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
      },
    };
  }

  /**
   * Check if an API key needs rotation
   */
  @Get(':id/rotation-status')
  async getRotationStatus(@Param('id') apiKeyId: string) {
    const apiKey = await this.enhancedApiKeyService.getApiKeyInfo(apiKeyId);
    
    if (!apiKey) {
      throw new BadRequestException('API key not found');
    }

    // This is a simplified check - the actual logic is in the service
    const shouldRotate = apiKey.rotationCount === 0 || // Legacy key
                        (apiKey.lastUsedAt && 
                         new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) > apiKey.lastUsedAt);

    return {
      apiKeyId,
      shouldRotate,
      rotationCount: apiKey.rotationCount,
      lastUsedAt: apiKey.lastUsedAt,
      recommendations: shouldRotate ? [
        'Consider rotating this key for better security',
        'Old or unused API keys should be rotated regularly',
      ] : [
        'API key is up to date',
      ],
    };
  }

  /**
   * Legacy endpoint for backward compatibility - create key with old format
   */
  @Post('create-legacy')
  async createLegacy(@Body() dto: { tenantSlug: string }) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { slug: dto.tenantSlug } 
    });
    if (!tenant) throw new UnauthorizedException();
    
    // Create using enhanced service but with minimal options for compatibility
    const { rawKey } = await this.enhancedApiKeyService.createApiKey({
      tenantId: tenant.id,
      description: 'Legacy API key',
      environment: 'production',
    });
    
    return { key: rawKey };
  }
}