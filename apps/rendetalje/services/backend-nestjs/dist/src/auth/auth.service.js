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
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthService = class AuthService {
    constructor(jwtService, configService, supabaseService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.supabaseService = supabaseService;
    }
    async register(createUserDto) {
        const { email, password, name, role, organizationId, phone } = createUserDto;
        const { data: existingUser } = await this.supabaseService.client.auth.admin.getUserByEmail(email);
        if (existingUser.user) {
            throw new common_1.ConflictException('User with this email already exists');
        }
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
            throw new common_1.BadRequestException(`Failed to create user: ${authError.message}`);
        }
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
            await this.supabaseService.client.auth.admin.deleteUser(authData.user.id);
            throw new common_1.BadRequestException(`Failed to create user profile: ${dbError.message}`);
        }
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
    async login(loginDto) {
        const { email, password } = loginDto;
        const { data: authData, error: authError } = await this.supabaseService.client.auth.signInWithPassword({
            email,
            password,
        });
        if (authError) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { data: userData, error: dbError } = await this.supabaseService.client
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        if (dbError || !userData) {
            throw new common_1.UnauthorizedException('User profile not found');
        }
        if (!userData.is_active) {
            throw new common_1.UnauthorizedException('User account is deactivated');
        }
        await this.supabaseService.client
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', authData.user.id);
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
    async refreshToken(userId) {
        const { data: userData, error } = await this.supabaseService.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !userData) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!userData.is_active) {
            throw new common_1.UnauthorizedException('User account is deactivated');
        }
        const payload = {
            sub: userData.id,
            email: userData.email,
            role: userData.role,
            organizationId: userData.organization_id
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken };
    }
    async requestPasswordReset(email) {
        const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${this.configService.get('FRONTEND_URL')}/auth/reset-password`,
        });
        if (error) {
            throw new common_1.BadRequestException(`Failed to send reset email: ${error.message}`);
        }
        return { message: 'Password reset email sent successfully' };
    }
    async resetPassword(resetPasswordDto) {
        const { token, password } = resetPasswordDto;
        const { error } = await this.supabaseService.client.auth.updateUser({
            password,
        });
        if (error) {
            throw new common_1.BadRequestException(`Failed to reset password: ${error.message}`);
        }
        return { message: 'Password reset successfully' };
    }
    async changePassword(userId, changePasswordDto) {
        const { currentPassword, newPassword } = changePasswordDto;
        const { data: userData } = await this.supabaseService.client
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();
        if (!userData) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const { error: verifyError } = await this.supabaseService.client.auth.signInWithPassword({
            email: userData.email,
            password: currentPassword,
        });
        if (verifyError) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const { error: updateError } = await this.supabaseService.client.auth.updateUser({
            password: newPassword,
        });
        if (updateError) {
            throw new common_1.BadRequestException(`Failed to change password: ${updateError.message}`);
        }
        return { message: 'Password changed successfully' };
    }
    async validateUser(userId) {
        const { data: userData, error } = await this.supabaseService.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !userData) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!userData.is_active) {
            throw new common_1.UnauthorizedException('User account is deactivated');
        }
        return userData;
    }
    async updateProfile(userId, updateData) {
        const { id, organization_id, role, created_at, updated_at, ...allowedUpdates } = updateData;
        const { data: userData, error } = await this.supabaseService.client
            .from('users')
            .update(allowedUpdates)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to update profile: ${error.message}`);
        }
        return userData;
    }
    async deactivateUser(userId) {
        const { error } = await this.supabaseService.client
            .from('users')
            .update({ is_active: false })
            .eq('id', userId);
        if (error) {
            throw new common_1.BadRequestException(`Failed to deactivate user: ${error.message}`);
        }
        return { message: 'User deactivated successfully' };
    }
    async activateUser(userId) {
        const { error } = await this.supabaseService.client
            .from('users')
            .update({ is_active: true })
            .eq('id', userId);
        if (error) {
            throw new common_1.BadRequestException(`Failed to activate user: ${error.message}`);
        }
        return { message: 'User activated successfully' };
    }
    async getUsersByOrganization(organizationId, role) {
        let query = this.supabaseService.client
            .from('users')
            .select('*')
            .eq('organization_id', organizationId);
        if (role) {
            query = query.eq('role', role);
        }
        const { data: users, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch users: ${error.message}`);
        }
        return users || [];
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map