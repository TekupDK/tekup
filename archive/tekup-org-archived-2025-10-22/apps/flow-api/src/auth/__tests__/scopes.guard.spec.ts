import { Test, TestingModule } from '@nestjs/testing';
import { ScopesGuard } from '../scopes.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('ScopesGuard', () => {
  let guard: ScopesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScopesGuard, Reflector],
    }).compile();

    guard = module.get<ScopesGuard>(ScopesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('Basic Scope Validation', () => {
    it('should allow access for admin scope', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['admin'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:leads']);

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should allow access for matching scope', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['read:leads'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:leads']);

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should deny access for insufficient scopes', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['read:leads'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['manage:leads']);

      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should throw error for missing API key context', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: undefined,
            apiKeyScopes: [],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:leads']);

      expect(() => guard.canActivate(mockContext as any)).toThrow(UnauthorizedException);
    });
  });

  describe('Cross-Tenant Access Controls', () => {
    it('should allow cross-tenant read with proper permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['cross_tenant:read'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['cross_tenant:read']) // SCOPES_KEY
        .mockReturnValueOnce(['cross_tenant:read']) // CROSS_TENANT_KEY
        .mockReturnValueOnce(undefined); // BUSINESS_ACCESS_KEY

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should deny cross-tenant access without proper permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['read:leads'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(['cross_tenant:read']) // CROSS_TENANT_KEY
        .mockReturnValueOnce(undefined); // BUSINESS_ACCESS_KEY

      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should allow cross-tenant write with read permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['cross_tenant:read'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(['cross_tenant:read']) // CROSS_TENANT_KEY
        .mockReturnValueOnce(undefined); // BUSINESS_ACCESS_KEY

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should allow cross-tenant admin with write permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['cross_tenant:write'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(['cross_tenant:read']) // CROSS_TENANT_KEY
        .mockReturnValueOnce(undefined); // BUSINESS_ACCESS_KEY

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should require admin scope for cross-tenant admin operations', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['cross_tenant:read'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(['cross_tenant:admin']) // CROSS_TENANT_KEY
        .mockReturnValueOnce(undefined); // BUSINESS_ACCESS_KEY

      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });
  });

  describe('Business Access Controls', () => {
    it('should allow business access for matching tenant', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'foodtruck-tenant-id',
            apiKeyScopes: ['business:foodtruck'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(['business:foodtruck']); // BUSINESS_ACCESS_KEY

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should allow tekup admin access to any business', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'foodtruck-tenant-id',
            apiKeyScopes: ['business:tekup_admin'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(['business:foodtruck']); // BUSINESS_ACCESS_KEY

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should deny business access for non-matching tenant', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'foodtruck-tenant-id',
            apiKeyScopes: ['business:essenza'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(['business:essenza']); // BUSINESS_ACCESS_KEY

      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should deny access for unknown tenant', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'unknown-tenant-id',
            apiKeyScopes: ['business:foodtruck'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(['business:foodtruck']); // BUSINESS_ACCESS_KEY

      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });
  });

  describe('Combined Permission Validation', () => {
    it('should allow access with both scope and business permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'foodtruck-tenant-id',
            apiKeyScopes: ['read:leads', 'business:foodtruck'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['read:leads']) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(['business:foodtruck']); // BUSINESS_ACCESS_KEY

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should deny access with scope but no business permission', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'foodtruck-tenant-id',
            apiKeyScopes: ['read:leads'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['read:leads']) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(['business:essenza']); // BUSINESS_ACCESS_KEY

      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should allow access with no requirements', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: [],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(undefined); // BUSINESS_ACCESS_KEY

      expect(guard.canActivate(mockContext as any)).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should provide detailed error for cross-tenant permission failure', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'test-tenant',
            apiKeyScopes: ['read:leads'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([]) // SCOPES_KEY
        .mockReturnValueOnce(['cross_tenant:admin']) // CROSS_TENANT_KEY
        .mockReturnValueOnce(undefined); // BUSINESS_ACCESS_KEY

      try {
        guard.canActivate(mockContext as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('insufficient_cross_tenant_permissions');
        expect(error.message).toContain('Cross-tenant operations require specific permissions');
      }
    });

    it('should provide detailed error for business permission failure', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'foodtruck-tenant-id',
            apiKeyScopes: ['read:leads'],
          }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['read:leads']) // SCOPES_KEY
        .mockReturnValueOnce(undefined) // CROSS_TENANT_KEY
        .mockReturnValueOnce(['business:essenza']); // BUSINESS_ACCESS_KEY

      try {
        guard.canActivate(mockContext as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('insufficient_business_permissions');
        expect(error.message).toContain('Business-specific operations require appropriate permissions');
      }
    });
  });
});
