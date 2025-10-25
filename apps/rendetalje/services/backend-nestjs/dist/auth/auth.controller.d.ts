import { AuthService, AuthResponse } from './auth.service';
import { CreateUserDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto';
import { User } from './entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<AuthResponse>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    refreshToken(req: any): Promise<{
        accessToken: string;
    }>;
    getProfile(req: any): Promise<User>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<User>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<void>;
}
