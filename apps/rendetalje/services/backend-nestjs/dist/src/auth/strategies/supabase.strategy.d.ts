import { SupabaseService } from '../../supabase/supabase.service';
import { AuthService } from '../auth.service';
declare const SupabaseStrategy_base: new (...args: any[]) => any;
export declare class SupabaseStrategy extends SupabaseStrategy_base {
    private readonly supabaseService;
    private readonly authService;
    constructor(supabaseService: SupabaseService, authService: AuthService);
    validate(req: any): Promise<any>;
}
export {};
