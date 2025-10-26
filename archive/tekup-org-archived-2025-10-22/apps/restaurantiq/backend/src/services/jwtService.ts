/**
 * JWT Service for RestaurantIQ
 * Handles JWT token generation, validation, and refresh
 */

import jwt from 'jsonwebtoken';
import { loggers } from '../config/logger';
import { cache } from '../config/redis';

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: string[];
  locationAccess: string[];
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessTokenExpiry = process.env.JWT_EXPIRATION || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRATION || '7d';
    this.issuer = process.env.JWT_ISSUER || 'restaurantiq';
    this.audience = process.env.JWT_AUDIENCE || 'restaurantiq-users';
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(payload: JWTPayload): Promise<TokenPair> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Generate access token
      const accessToken = jwt.sign(
        {
          ...payload,
          type: 'access',
          iat: now,
        },
        this.accessTokenSecret,
        {
          expiresIn: this.accessTokenExpiry,
          issuer: this.issuer,
          audience: this.audience,
        }
      );

      // Generate refresh token with unique JTI
      const refreshTokenId = `${payload.userId}_${Date.now()}`;
      const refreshToken = jwt.sign(
        {
          userId: payload.userId,
          tenantId: payload.tenantId,
          type: 'refresh',
          jti: refreshTokenId,
          iat: now,
        },
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiry,
          issuer: this.issuer,
          audience: this.audience,
        }
      );

      // Store refresh token in Redis with expiry
      const refreshTokenTTL = this.getExpiryInSeconds(this.refreshTokenExpiry);
      await cache.set(
        `refresh_token:${refreshTokenId}`,
        {
          userId: payload.userId,
          tenantId: payload.tenantId,
          createdAt: new Date().toISOString(),
        },
        refreshTokenTTL
      );

      // Calculate access token expiry in seconds
      const accessTokenTTL = this.getExpiryInSeconds(this.accessTokenExpiry);

      loggers.debug('Generated token pair', {
        userId: payload.userId,
        tenantId: payload.tenantId,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: accessTokenTTL,
      };
    } catch (error) {
      loggers.error('Failed to generate token pair', {
        userId: payload.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as any;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
        locationAccess: decoded.locationAccess || [],
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token and check if it exists in Redis
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string; tenantId: string }> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in Redis
      const storedToken = await cache.get(`refresh_token:${decoded.jti}`);
      if (!storedToken) {
        throw new Error('Refresh token revoked or expired');
      }

      return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw error;
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string, userPayload: JWTPayload): Promise<string> {
    try {
      // Verify refresh token
      const tokenData = await this.verifyRefreshToken(refreshToken);
      
      if (tokenData.userId !== userPayload.userId) {
        throw new Error('Token user mismatch');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          ...userPayload,
          type: 'access',
          iat: Math.floor(Date.now() / 1000),
        },
        this.accessTokenSecret,
        {
          expiresIn: this.accessTokenExpiry,
          issuer: this.issuer,
          audience: this.audience,
        }
      );

      loggers.debug('Access token refreshed', {
        userId: userPayload.userId,
        tenantId: userPayload.tenantId,
      });

      return accessToken;
    } catch (error) {
      loggers.warn('Failed to refresh access token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        ignoreExpiration: true, // Allow revoking expired tokens
      }) as any;

      if (decoded.jti) {
        await cache.del(`refresh_token:${decoded.jti}`);
        loggers.debug('Refresh token revoked', {
          jti: decoded.jti,
          userId: decoded.userId,
        });
      }
    } catch (error) {
      loggers.warn('Failed to revoke refresh token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - revoking invalid tokens should be silent
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const pattern = `refresh_token:${userId}_*`;
      const keys = await cache.keys(pattern);
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => cache.del(key)));
        loggers.info('All user tokens revoked', {
          userId,
          tokenCount: keys.length,
        });
      }
    } catch (error) {
      loggers.error('Failed to revoke all user tokens', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Convert JWT expiry string to seconds
   */
  private getExpiryInSeconds(expiry: string): number {
    // Handle different expiry formats
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const jwtService = new JWTService();
