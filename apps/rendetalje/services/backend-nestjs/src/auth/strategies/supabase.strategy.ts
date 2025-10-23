import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuthService } from '../auth.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {
    super();
  }

  async validate(req: any): Promise<any> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization header found');
    }

    const token = authHeader.substring(7);

    try {
      // Verify Supabase JWT token
      const { data: { user }, error } = await this.supabaseService.client.auth.getUser(token);
      
      if (error || !user) {
        throw new UnauthorizedException('Invalid Supabase token');
      }

      // Get user profile from database
      const userProfile = await this.authService.validateUser(user.id);

      return {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        organizationId: userProfile.organization_id,
        phone: userProfile.phone,
        avatarUrl: userProfile.avatar_url,
        settings: userProfile.settings,
        isActive: userProfile.is_active,
        lastLoginAt: userProfile.last_login_at,
        supabaseUser: user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}