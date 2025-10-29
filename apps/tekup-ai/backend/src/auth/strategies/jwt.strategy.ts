import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string; // Supabase user ID
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('app.jwt.secret') ||
        'default-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Find or create user in our database
    let user = await this.prisma.aiUser.findUnique({
      where: { supabaseUserId: payload.sub },
      select: {
        id: true,
        email: true,
        supabaseUserId: true,
      },
    });

    // Auto-create user if doesn't exist (first-time login)
    if (!user) {
      user = await this.prisma.aiUser.create({
        data: {
          supabaseUserId: payload.sub,
          email: payload.email,
        },
        select: {
          id: true,
          email: true,
          supabaseUserId: true,
        },
      });
    }

    return {
      userId: user.id,
      email: user.email,
      supabaseUserId: user.supabaseUserId,
    };
  }
}
