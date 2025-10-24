import { UserRole } from '../enums/user-role.enum';
export interface User {
    id: string;
    organization_id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    avatar_url?: string;
    settings?: Record<string, any>;
    is_active: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
}
