import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, LoginDto, UpdateProfileDto } from './dto';
import { User } from './entities/user.entity';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
export interface AuthResponse {
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(createUserDto: CreateUserDto): Promise<AuthResponse>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    refreshToken(userId: string): Promise<{
        accessToken: string;
    }>;
    validateUser(userId: string): Promise<User>;
    getUserById(id: string): Promise<User>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
}
