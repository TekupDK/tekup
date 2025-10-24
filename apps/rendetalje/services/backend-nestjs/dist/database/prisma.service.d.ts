import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get client(): this;
    get customers(): any;
    get jobs(): any;
    get jobAssignments(): any;
    get customerMessages(): any;
    get customerReviews(): any;
    get timeEntries(): any;
    get chatSessions(): any;
    get chatMessages(): any;
}
