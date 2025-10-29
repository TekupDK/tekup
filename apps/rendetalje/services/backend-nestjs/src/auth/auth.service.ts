import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CreateUserDto, LoginDto, UpdateProfileDto } from "./dto";
import { User, UserRole } from "./entities/user.entity";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: Omit<User, "passwordHash">;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    // Initialize Supabase client with service key for admin operations
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseKey = this.configService.get<string>("SUPABASE_SERVICE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "❌ Supabase configuration missing! Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env"
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("✅ Supabase Auth initialized:", supabaseUrl);
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const { email, password, name, role, phone } = createUserDto;

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          phone,
          role: role || UserRole.EMPLOYEE,
          isActive: true,
        },
      });

    if (authError) {
      if (
        authError.message?.includes("already registered") ||
        authError.message?.includes("already been registered")
      ) {
        throw new ConflictException("User with this email already exists");
      }
      throw new ConflictException(
        `Failed to create user: ${authError.message}`
      );
    }

    if (!authData.user) {
      throw new ConflictException(
        "Failed to create user - no user data returned"
      );
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: authData.user.id,
      email: authData.user.email!,
      role: authData.user.user_metadata.role || UserRole.EMPLOYEE,
    };
    const accessToken = this.jwtService.sign(payload);

    // Return user data
    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      name: authData.user.user_metadata.name || email.split("@")[0],
      phone: authData.user.user_metadata.phone || null,
      role: authData.user.user_metadata.role || UserRole.EMPLOYEE,
      isActive: true,
      createdAt: new Date(authData.user.created_at),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    return {
      user,
      accessToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Sign in with Supabase Auth
    const { data: authData, error: authError } =
      await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is active
    if (authData.user.user_metadata.isActive === false) {
      throw new UnauthorizedException("Account is deactivated");
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: authData.user.id,
      email: authData.user.email!,
      role: authData.user.user_metadata.role || UserRole.EMPLOYEE,
    };
    const accessToken = this.jwtService.sign(payload);

    // Update last login timestamp
    await this.supabase.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        ...authData.user.user_metadata,
        lastLoginAt: new Date().toISOString(),
      },
    });

    // Return user data
    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      name: authData.user.user_metadata.name || email.split("@")[0],
      phone: authData.user.user_metadata.phone || null,
      role: authData.user.user_metadata.role || UserRole.EMPLOYEE,
      isActive: authData.user.user_metadata.isActive !== false,
      createdAt: new Date(authData.user.created_at),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    return {
      user,
      accessToken,
    };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    // Get current user from Supabase
    const { data: userData, error: userError } =
      await this.supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      throw new UnauthorizedException("User not found");
    }

    if (userData.user.user_metadata.isActive === false) {
      throw new UnauthorizedException("Account is deactivated");
    }

    // Generate new JWT token
    const payload: JwtPayload = {
      sub: userData.user.id,
      email: userData.user.email!,
      role: userData.user.user_metadata.role || UserRole.EMPLOYEE,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async validateUser(userId: string): Promise<User> {
    const { data: userData, error: userError } =
      await this.supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      throw new UnauthorizedException("User not found");
    }

    if (userData.user.user_metadata.isActive === false) {
      throw new UnauthorizedException("Account is deactivated");
    }

    const user: User = {
      id: userData.user.id,
      email: userData.user.email!,
      name:
        userData.user.user_metadata.name || userData.user.email!.split("@")[0],
      phone: userData.user.user_metadata.phone || null,
      role: userData.user.user_metadata.role || UserRole.EMPLOYEE,
      isActive: userData.user.user_metadata.isActive !== false,
      createdAt: new Date(userData.user.created_at),
      updatedAt: new Date(),
      lastLoginAt: userData.user.user_metadata.lastLoginAt
        ? new Date(userData.user.user_metadata.lastLoginAt)
        : null,
    };

    return user;
  }

  async getUserById(id: string): Promise<User> {
    const { data: userData, error: userError } =
      await this.supabase.auth.admin.getUserById(id);

    if (userError || !userData.user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user: User = {
      id: userData.user.id,
      email: userData.user.email!,
      name:
        userData.user.user_metadata.name || userData.user.email!.split("@")[0],
      phone: userData.user.user_metadata.phone || null,
      role: userData.user.user_metadata.role || UserRole.EMPLOYEE,
      isActive: userData.user.user_metadata.isActive !== false,
      createdAt: new Date(userData.user.created_at),
      updatedAt: new Date(),
      lastLoginAt: userData.user.user_metadata.lastLoginAt
        ? new Date(userData.user.user_metadata.lastLoginAt)
        : null,
    };

    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto
  ): Promise<User> {
    // Update user metadata in Supabase
    const { data: userData, error: updateError } =
      await this.supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...updateProfileDto,
          updatedAt: new Date().toISOString(),
        },
      });

    if (updateError || !userData.user) {
      throw new NotFoundException("Failed to update user profile");
    }

    const user: User = {
      id: userData.user.id,
      email: userData.user.email!,
      name:
        userData.user.user_metadata.name || userData.user.email!.split("@")[0],
      phone: userData.user.user_metadata.phone || null,
      role: userData.user.user_metadata.role || UserRole.EMPLOYEE,
      isActive: userData.user.user_metadata.isActive !== false,
      createdAt: new Date(userData.user.created_at),
      updatedAt: new Date(),
      lastLoginAt: userData.user.user_metadata.lastLoginAt
        ? new Date(userData.user.user_metadata.lastLoginAt)
        : null,
    };

    return user;
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user to verify old password
    const { data: userData, error: userError } =
      await this.supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      throw new NotFoundException("User not found");
    }

    // Verify old password by attempting to sign in
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: userData.user.email!,
      password: oldPassword,
    });

    if (signInError) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Update password in Supabase
    const { error: updateError } =
      await this.supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      throw new UnauthorizedException("Failed to change password");
    }
  }
}
