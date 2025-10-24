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
    get customers(): import("@prisma/client").Prisma.RenosCustomerDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get jobs(): import("@prisma/client").Prisma.RenosLeadDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get jobAssignments(): import("@prisma/client").Prisma.RenosBookingDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get customerMessages(): import("@prisma/client").Prisma.RenosEmailMessageDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get customerReviews(): import("@prisma/client").Prisma.RenosCustomerDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get timeEntries(): import("@prisma/client").Prisma.RenosBreakDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get chatSessions(): import("@prisma/client").Prisma.RenosChatSessionDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get chatMessages(): import("@prisma/client").Prisma.RenosChatMessageDelegate<import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
