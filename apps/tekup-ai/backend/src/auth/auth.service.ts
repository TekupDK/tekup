import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../database/prisma.service';

export interface SignUpDto {
  email: string;
  password: string;
  name?: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('app.supabase.url');
    const supabaseKey = this.configService.get<string>(
      'app.supabase.serviceRoleKey',
    );

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase configuration missing');
      throw new Error('Supabase configuration required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Sign up a new user
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    try {
      // Create user in Supabase
      const { data, error } = await this.supabase.auth.signUp({
        email: signUpDto.email,
        password: signUpDto.password,
        options: {
          data: {
            name: signUpDto.name,
          },
        },
      });

      if (error) {
        this.logger.error(`Sign up failed: ${error.message}`);
        throw new UnauthorizedException(error.message);
      }

      if (!data.user) {
        throw new UnauthorizedException('Sign up failed');
      }

      // Create user in our database
      const user = await this.prisma.aiUser.create({
        data: {
          supabaseUserId: data.user.id,
          email: signUpDto.email,
          name: signUpDto.name,
        },
      });

      // Create default settings
      await this.prisma.aiUserSettings.create({
        data: {
          userId: user.id,
        },
      });

      return {
        accessToken: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token || '',
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
        },
      };
    } catch (error) {
      this.logger.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: signInDto.email,
        password: signInDto.password,
      });

      if (error) {
        this.logger.error(`Sign in failed: ${error.message}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException('Sign in failed');
      }

      // Get or create user in our database
      let user = await this.prisma.aiUser.findUnique({
        where: { supabaseUserId: data.user.id },
      });

      if (!user) {
        user = await this.prisma.aiUser.create({
          data: {
            supabaseUserId: data.user.id,
            email: signInDto.email,
          },
        });

        // Create default settings
        await this.prisma.aiUserSettings.create({
          data: {
            userId: user.id,
          },
        });
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
        },
      };
    } catch (error) {
      this.logger.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.aiUser.findUnique({
        where: { supabaseUserId: data.user.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
        },
      };
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut(accessToken: string): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch (error) {
      this.logger.error('Sign out error:', error);
      // Don't throw error on sign out failure
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      return !error && !!data.user;
    } catch {
      return false;
    }
  }
}
