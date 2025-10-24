import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService implements OnModuleInit {
    private readonly configService;
    private _client;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    get client(): SupabaseClient;
    createClientWithAuth(accessToken: string): SupabaseClient;
}
