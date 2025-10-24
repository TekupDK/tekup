import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from './dto';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/interfaces/user.interface';
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    private readonly supabaseService;
    constructor(jwtService: JwtService, configService: ConfigService, supabaseService: SupabaseService);
    register(createUserDto: CreateUserDto): Promise<{
        user: User;
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: User;
        accessToken: string;
    }>;
    refreshToken(userId: string): Promise<{
        accessToken: string;
    }>;
    requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<User>;
    updateProfile(userId: string, updateData: Partial<User>): Promise<User>;
    deactivateUser(userId: string): Promise<{
        message: string;
    }>;
    activateUser(userId: string): Promise<{
        message: string;
    }>;
    getUsersByOrganization(organizationId: string, role?: UserRole): Promise<User[]>;
}
