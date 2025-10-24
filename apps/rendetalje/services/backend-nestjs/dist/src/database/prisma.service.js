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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_1 = require("@tekup/database");
let PrismaService = PrismaService_1 = class PrismaService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        try {
            await database_1.renos.$connect();
            this.logger.log('Connected to tekup-database (renos schema)');
        }
        catch (error) {
            this.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        try {
            await database_1.renos.$disconnect();
            this.logger.log('Disconnected from tekup-database');
        }
        catch (error) {
            this.logger.error('Failed to disconnect from database:', error);
        }
    }
    get client() {
        return database_1.renos;
    }
    get customers() {
        return database_1.renos.customers;
    }
    get jobs() {
        return database_1.renos.jobs;
    }
    get jobAssignments() {
        return database_1.renos.job_assignments;
    }
    get teamMembers() {
        return database_1.renos.team_members;
    }
    get users() {
        return database_1.renos.users;
    }
    get organizations() {
        return database_1.renos.organizations;
    }
    get customerMessages() {
        return database_1.renos.customer_messages;
    }
    get customerReviews() {
        return database_1.renos.customer_reviews;
    }
    get timeEntries() {
        return database_1.renos.time_entries;
    }
    get chatSessions() {
        return database_1.renos.chat_sessions;
    }
    get chatMessages() {
        return database_1.renos.chat_messages;
    }
    async transaction(operations) {
        return database_1.renos.$transaction(operations);
    }
    async $queryRaw(query, ...values) {
        return database_1.renos.$queryRaw(query, ...values);
    }
    async $executeRaw(query, ...values) {
        return database_1.renos.$executeRaw(query, ...values);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map