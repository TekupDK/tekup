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
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor(configService) {
        super({
            datasources: {
                db: {
                    url: configService.get('DATABASE_URL'),
                },
            },
            log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
        this.configService = configService;
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Connected to tekup-database (renos schema)');
        }
        catch (error) {
            this.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('Disconnected from tekup-database');
        }
        catch (error) {
            this.logger.error('Failed to disconnect from database:', error);
        }
    }
    get client() {
        return this;
    }
    get customers() {
        return this.renosCustomer;
    }
    get jobs() {
        return this.renosLead;
    }
    get jobAssignments() {
        return this.renosBooking;
    }
    get customerMessages() {
        return this.renosEmailMessage;
    }
    get customerReviews() {
        return this.renosCustomer;
    }
    get timeEntries() {
        return this.renosBreak;
    }
    get chatSessions() {
        return this.renosChatSession;
    }
    get chatMessages() {
        return this.renosChatMessage;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map