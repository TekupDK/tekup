"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const supabase_js_1 = require("@supabase/supabase-js");
const user_entity_1 = require("./entities/user.entity");
let AuthService = class AuthService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        const supabaseUrl = this.configService.get("SUPABASE_URL");
        const supabaseKey = this.configService.get("SUPABASE_SERVICE_KEY");
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("❌ Supabase configuration missing! Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env");
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        console.log("✅ Supabase Auth initialized:", supabaseUrl);
    }
    async register(createUserDto) {
        const { email, password, name, role, phone } = createUserDto;
        const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                phone,
                role: role || user_entity_1.UserRole.EMPLOYEE,
                isActive: true,
            },
        });
        if (authError) {
            if (authError.message?.includes("already registered") ||
                authError.message?.includes("already been registered")) {
                throw new common_1.ConflictException("User with this email already exists");
            }
            throw new common_1.ConflictException(`Failed to create user: ${authError.message}`);
        }
        if (!authData.user) {
            throw new common_1.ConflictException("Failed to create user - no user data returned");
        }
        const payload = {
            sub: authData.user.id,
            email: authData.user.email,
            role: authData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
        };
        const accessToken = this.jwtService.sign(payload);
        const user = {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata.name || email.split("@")[0],
            phone: authData.user.user_metadata.phone || null,
            role: authData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
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
    async login(loginDto) {
        const { email, password } = loginDto;
        const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (authError || !authData.user) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        if (authData.user.user_metadata.isActive === false) {
            throw new common_1.UnauthorizedException("Account is deactivated");
        }
        const payload = {
            sub: authData.user.id,
            email: authData.user.email,
            role: authData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
        };
        const accessToken = this.jwtService.sign(payload);
        await this.supabase.auth.admin.updateUserById(authData.user.id, {
            user_metadata: {
                ...authData.user.user_metadata,
                lastLoginAt: new Date().toISOString(),
            },
        });
        const user = {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata.name || email.split("@")[0],
            phone: authData.user.user_metadata.phone || null,
            role: authData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
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
    async refreshToken(userId) {
        const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        if (userData.user.user_metadata.isActive === false) {
            throw new common_1.UnauthorizedException("Account is deactivated");
        }
        const payload = {
            sub: userData.user.id,
            email: userData.user.email,
            role: userData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken };
    }
    async validateUser(userId) {
        const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        if (userData.user.user_metadata.isActive === false) {
            throw new common_1.UnauthorizedException("Account is deactivated");
        }
        const user = {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.user_metadata.name || userData.user.email.split("@")[0],
            phone: userData.user.user_metadata.phone || null,
            role: userData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
            isActive: userData.user.user_metadata.isActive !== false,
            createdAt: new Date(userData.user.created_at),
            updatedAt: new Date(),
            lastLoginAt: userData.user.user_metadata.lastLoginAt
                ? new Date(userData.user.user_metadata.lastLoginAt)
                : null,
        };
        return user;
    }
    async getUserById(id) {
        const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(id);
        if (userError || !userData.user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        const user = {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.user_metadata.name || userData.user.email.split("@")[0],
            phone: userData.user.user_metadata.phone || null,
            role: userData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
            isActive: userData.user.user_metadata.isActive !== false,
            createdAt: new Date(userData.user.created_at),
            updatedAt: new Date(),
            lastLoginAt: userData.user.user_metadata.lastLoginAt
                ? new Date(userData.user.user_metadata.lastLoginAt)
                : null,
        };
        return user;
    }
    async updateProfile(userId, updateProfileDto) {
        const { data: userData, error: updateError } = await this.supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...updateProfileDto,
                updatedAt: new Date().toISOString(),
            },
        });
        if (updateError || !userData.user) {
            throw new common_1.NotFoundException("Failed to update user profile");
        }
        const user = {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.user_metadata.name || userData.user.email.split("@")[0],
            phone: userData.user.user_metadata.phone || null,
            role: userData.user.user_metadata.role || user_entity_1.UserRole.EMPLOYEE,
            isActive: userData.user.user_metadata.isActive !== false,
            createdAt: new Date(userData.user.created_at),
            updatedAt: new Date(),
            lastLoginAt: userData.user.user_metadata.lastLoginAt
                ? new Date(userData.user.user_metadata.lastLoginAt)
                : null,
        };
        return user;
    }
    async changePassword(userId, oldPassword, newPassword) {
        const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user) {
            throw new common_1.NotFoundException("User not found");
        }
        const { error: signInError } = await this.supabase.auth.signInWithPassword({
            email: userData.user.email,
            password: oldPassword,
        });
        if (signInError) {
            throw new common_1.UnauthorizedException("Current password is incorrect");
        }
        const { error: updateError } = await this.supabase.auth.admin.updateUserById(userId, {
            password: newPassword,
        });
        if (updateError) {
            throw new common_1.UnauthorizedException("Failed to change password");
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map