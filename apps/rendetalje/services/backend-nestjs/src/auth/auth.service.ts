import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from './dto';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{ user: User; accessToken: string }> {
    const { email, password, name, role, organizationId, phone } = createUserDto;

    // Check if user already exists
    const { data: existingUser } = await this.supabaseService.client.auth.admin.getUserByEmail(email);
    if (existingUser.user) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabaseService.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        organization_id: organizationId,
        phone,
      },
    });

    if (authError) {
      throw new BadRequestException(`Failed to create user: ${authError.message}`);
    }

    // Create user record in database
    const { data: userData, error: dbError } = await this.supabaseService.client
      .from('users')
      .insert({
        id: authData.user.id,
        organization_id: organizationId,
        email,
        name,
        role,
        phone,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup auth user if database insert fails
      await this.supabaseService.client.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException(`Failed to create user profile: ${dbError.message}`);
    }

    // Generate JWT token
    const payload = { 
      sub: authData.user.id, 
      email, 
      role, 
      organizationId 
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: userData,
      accessToken,
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string }> {
    const { email, password } = loginDto;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user profile from database
    const { data: userData, error: dbError } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (dbError || !userData) {
      throw new UnauthorizedException('User profile not found');
    }

    if (!userData.is_active) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Update last login
    await this.supabaseService.client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Generate JWT token
    const payload = { 
      sub: authData.user.id, 
      email: userData.email, 
      role: userData.role, 
      organizationId: userData.organization_id 
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: userData,
      accessToken,
    };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    // Get current user data
    const { data: userData, error } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      throw new UnauthorizedException('User not found');
    }

    if (!userData.is_active) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Generate new JWT token
    const payload = { 
      sub: userData.id, 
      email: userData.email, 
      role: userData.role, 
      organizationId: userData.organization_id 
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.configService.get('FRONTEND_URL')}/auth/reset-password`,
    });

    if (error) {
      throw new BadRequestException(`Failed to send reset email: ${error.message}`);
    }

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;

    const { error } = await this.supabaseService.client.auth.updateUser({
      password,
    });

    if (error) {
      throw new BadRequestException(`Failed to reset password: ${error.message}`);
    }

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user email for verification
    const { data: userData } = await this.supabaseService.client
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!userData) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const { error: verifyError } = await this.supabaseService.client.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword,
    });

    if (verifyError) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await this.supabaseService.client.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new BadRequestException(`Failed to change password: ${updateError.message}`);
    }

    return { message: 'Password changed successfully' };
  }

  async validateUser(userId: string): Promise<User> {
    const { data: userData, error } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      throw new UnauthorizedException('User not found');
    }

    if (!userData.is_active) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return userData;
  }

  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    // Remove fields that shouldn't be updated via this method
    const { id, organization_id, role, created_at, updated_at, ...allowedUpdates } = updateData;

    const { data: userData, error } = await this.supabaseService.client
      .from('users')
      .update(allowedUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update profile: ${error.message}`);
    }

    return userData;
  }

  async deactivateUser(userId: string): Promise<{ message: string }> {
    const { error } = await this.supabaseService.client
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) {
      throw new BadRequestException(`Failed to deactivate user: ${error.message}`);
    }

    return { message: 'User deactivated successfully' };
  }

  async activateUser(userId: string): Promise<{ message: string }> {
    const { error } = await this.supabaseService.client
      .from('users')
      .update({ is_active: true })
      .eq('id', userId);

    if (error) {
      throw new BadRequestException(`Failed to activate user: ${error.message}`);
    }

    return { message: 'User activated successfully' };
  }

  async getUsersByOrganization(organizationId: string, role?: UserRole): Promise<User[]> {
    let query = this.supabaseService.client
      .from('users')
      .select('*')
      .eq('organization_id', organizationId);

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }

    return users || [];
  }
}