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
var GdprService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let GdprService = GdprService_1 = class GdprService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GdprService_1.name);
    }
    async requestDataExport(userId, email) {
        const existingRequest = await this.prisma.renosDataExportRequest.findFirst({
            where: {
                userId,
                status: 'pending',
            },
        });
        if (existingRequest) {
            return existingRequest;
        }
        const request = await this.prisma.renosDataExportRequest.create({
            data: {
                userId,
                email,
                status: 'pending',
            },
        });
        this.logger.log(`Data export requested for user ${userId}`);
        return request;
    }
    async getDataExportStatus(userId) {
        return this.prisma.renosDataExportRequest.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async requestDataDeletion(userId, email, reason) {
        const existingRequest = await this.prisma.renosDataDeletionRequest.findFirst({
            where: {
                userId,
                status: { in: ['pending', 'processing'] },
            },
        });
        if (existingRequest) {
            return existingRequest;
        }
        const scheduledDeletionDate = new Date();
        scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);
        const request = await this.prisma.renosDataDeletionRequest.create({
            data: {
                userId,
                email,
                scheduledDeletionDate,
                reason,
                status: 'pending',
            },
        });
        this.logger.log(`Data deletion requested for user ${userId}, scheduled for ${scheduledDeletionDate}`);
        return request;
    }
    async cancelDataDeletion(userId) {
        const request = await this.prisma.renosDataDeletionRequest.findFirst({
            where: {
                userId,
                status: { in: ['pending', 'processing'] },
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('No pending deletion request found');
        }
        await this.prisma.renosDataDeletionRequest.update({
            where: { id: request.id },
            data: { status: 'cancelled' },
        });
        this.logger.log(`Data deletion cancelled for user ${userId}`);
        return true;
    }
    async recordConsent(userId, consentType, granted, ipAddress, userAgent, version = '1.0') {
        const existingConsent = await this.prisma.renosConsentRecord.findFirst({
            where: {
                userId,
                consentType,
                granted: true,
                revokedAt: null,
            },
        });
        if (existingConsent && !granted) {
            await this.prisma.renosConsentRecord.update({
                where: { id: existingConsent.id },
                data: { revokedAt: new Date() },
            });
        }
        const consent = await this.prisma.renosConsentRecord.create({
            data: {
                userId,
                consentType,
                granted,
                ipAddress,
                userAgent,
                version,
            },
        });
        this.logger.log(`Consent recorded for user ${userId}: ${consentType} = ${granted}`);
        return consent;
    }
    async getConsentStatus(userId, consentType) {
        return this.prisma.renosConsentRecord.findMany({
            where: {
                userId,
                ...(consentType && { consentType }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPrivacyPolicy(version) {
        if (version) {
            const policy = await this.prisma.renosPrivacyPolicy.findUnique({
                where: { version },
            });
            if (!policy) {
                throw new common_1.NotFoundException(`Privacy policy version ${version} not found`);
            }
            return policy;
        }
        const activePolicy = await this.prisma.renosPrivacyPolicy.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
        });
        if (!activePolicy) {
            throw new common_1.NotFoundException('No active privacy policy found');
        }
        return activePolicy;
    }
    async updatePrivacyPolicy(content, version) {
        await this.prisma.$transaction(async (tx) => {
            await tx.renosPrivacyPolicy.updateMany({
                where: { active: true },
                data: { active: false },
            });
            await tx.renosPrivacyPolicy.create({
                data: {
                    version,
                    content,
                    active: true,
                },
            });
        });
        this.logger.log(`Privacy policy updated to version ${version}`);
    }
    async cleanupExpiredData() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await this.prisma.renosDataExportRequest.deleteMany({
            where: {
                status: 'completed',
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        this.logger.log(`Cleaned up ${result.count} expired export requests`);
    }
    async processScheduledDeletions() {
        const requests = await this.prisma.renosDataDeletionRequest.findMany({
            where: {
                status: 'pending',
                scheduledDeletionDate: {
                    lte: new Date(),
                },
            },
        });
        for (const request of requests) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    await tx.renosDataDeletionRequest.update({
                        where: { id: request.id },
                        data: { status: 'processing' },
                    });
                    await tx.renosUser.delete({
                        where: { id: request.userId },
                    });
                    await tx.renosDataDeletionRequest.update({
                        where: { id: request.id },
                        data: { status: 'completed' },
                    });
                });
                this.logger.log(`User ${request.userId} data deleted successfully`);
            }
            catch (error) {
                this.logger.error(`Failed to delete user ${request.userId} data:`, error);
            }
        }
    }
};
exports.GdprService = GdprService;
exports.GdprService = GdprService = GdprService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GdprService);
//# sourceMappingURL=gdpr.service.js.map