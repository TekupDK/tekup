import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, ResetPasswordDto, ChangePasswordDto, UpdateProfileDto } from './dto';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/interfaces/user.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        user: User;
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: User;
        accessToken: string;
    }>;
    refreshToken(req: any): Promise<{
        accessToken: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<User>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<User>;
    getUsers(req: any, role?: UserRole): Promise<User[]>;
    deactivateUser(userId: string): Promise<{
        message: string;
    }>;
    activateUser(userId: string): Promise<{
        message: string;
    }>;
}
