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
exports.SupabaseStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_custom_1 = require("passport-custom");
const supabase_service_1 = require("../../supabase/supabase.service");
const auth_service_1 = require("../auth.service");
let SupabaseStrategy = class SupabaseStrategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'supabase') {
    constructor(supabaseService, authService) {
        super();
        this.supabaseService = supabaseService;
        this.authService = authService;
    }
    async validate(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('No authorization header found');
        }
        const token = authHeader.substring(7);
        try {
            const { data: { user }, error } = await this.supabaseService.client.auth.getUser(token);
            if (error || !user) {
                throw new common_1.UnauthorizedException('Invalid Supabase token');
            }
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
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.SupabaseStrategy = SupabaseStrategy;
exports.SupabaseStrategy = SupabaseStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        auth_service_1.AuthService])
], SupabaseStrategy);
//# sourceMappingURL=supabase.strategy.js.map