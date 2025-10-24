import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { renos } from '@tekup/database';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get client(): any;
    get customers(): any;
    get jobs(): any;
    get jobAssignments(): any;
    get teamMembers(): any;
    get users(): any;
    get organizations(): any;
    get customerMessages(): any;
    get customerReviews(): any;
    get timeEntries(): any;
    get chatSessions(): any;
    get chatMessages(): any;
    transaction<T>(operations: (prisma: typeof renos) => Promise<T>): Promise<T>;
    $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: any[]): Promise<T>;
    $executeRaw(query: TemplateStringsArray, ...values: any[]): Promise<number>;
}
