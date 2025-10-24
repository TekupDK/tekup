export declare class HealthController {
    check(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
    checkDatabase(): Promise<{
        status: string;
        database: string;
        timestamp: string;
    }>;
}
