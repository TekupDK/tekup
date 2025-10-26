import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TekUpSSOService } from '../sso.service.js';
import { JwtPayload, TenantContext } from '../types/auth.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'tekup-jwt') {
  constructor(private readonly ssoService: TekUpSSOService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'tekup-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<TenantContext> {
    try {
      // Validate the token and get current user context
      const token = ExtractJwt.fromAuthHeaderAsBearerToken();
      return await this.ssoService.verifyToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
