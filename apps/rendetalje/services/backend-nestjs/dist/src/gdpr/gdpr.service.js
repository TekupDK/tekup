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
const supabase_service_1 = require("../supabase/supabase.service");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let GdprService = GdprService_1 = class GdprService {
    constructor(supabaseService, configService) {
        this.supabaseService = supabaseService;
        this.configService = configService;
        this.logger = new common_1.Logger(GdprService_1.name);
        this.encryptionKey = this.configService.get('ENCRYPTION_KEY') ||
            crypto.randomBytes(32).toString('hex');
    }
    async requestDataExport(userId, email) {
        try {
            const existingRequest = await this.supabaseService.client
                .from('data_export_requests')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .single();
            if (existingRequest.data) {
                return {
                    userId,
                    email,
                    requestDate: new Date(existingRequest.data.request_date),
                    status: existingRequest.data.status,
                    downloadUrl: existingRequest.data.download_url,
                    expiresAt: existingRequest.data.expires_at ? new Date(existingRequest.data.expires_at) : undefined
                };
            }
            const { data, error } = await this.supabaseService.client
                .from('data_export_requests')
                .insert({
                user_id: userId,
                email,
                request_date: new Date().toISOString(),
                status: 'pending'
            })
                .select()
                .single();
            if (error)
                throw error;
            this.processDataExport(userId, data.id);
            return {
                userId,
                email,
                requestDate: new Date(data.request_date),
                status: data.status
            };
        }
        catch (error) {
            this.logger.error(`Failed to request data export for user ${userId}:`, error);
            throw error;
        }
    }
    async processDataExport(userId, requestId) {
        try {
            await this.supabaseService.client
                .from('data_export_requests')
                .update({ status: 'processing' })
                .eq('id', requestId);
            const userData = await this.collectUserData(userId);
            const encryptedData = this.encryptData(JSON.stringify(userData));
            const downloadUrl = await this.generateSecureDownloadUrl(encryptedData, userId);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            await this.supabaseService.client
                .from('data_export_requests')
                .update({
                status: 'completed',
                download_url: downloadUrl,
                expires_at: expiresAt.toISOString()
            })
                .eq('id', requestId);
            this.logger.log(`Data export completed for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Data export failed for user ${userId}:`, error);
            await this.supabaseService.client
                .from('data_export_requests')
                .update({ status: 'failed' })
                .eq('id', requestId);
        }
    }
    async collectUserData(userId) {
        const userData = {
            user: null,
            profile: null,
            customers: [],
            jobs: [],
            timeEntries: [],
            communications: [],
            satisfactionRatings: [],
            consentRecords: [],
            exportDate: new Date().toISOString()
        };
        const { data: user } = await this.supabaseService.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        userData.user = user;
        const { data: profile } = await this.supabaseService.client
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        userData.profile = profile;
        const { data: customers } = await this.supabaseService.client
            .from('customers')
            .select('*')
            .eq('organization_id', user?.organization_id);
        userData.customers = customers || [];
        const { data: jobs } = await this.supabaseService.client
            .from('jobs')
            .select(`
        *,
        customer:customers(*),
        time_entries(*),
        photos(*),
        checklist_items(*)
      `)
            .eq('organization_id', user?.organization_id);
        userData.jobs = jobs || [];
        const { data: timeEntries } = await this.supabaseService.client
            .from('time_entries')
            .select('*')
            .eq('user_id', userId);
        userData.timeEntries = timeEntries || [];
        const { data: communications } = await this.supabaseService.client
            .from('customer_communications')
            .select('*')
            .eq('created_by', userId);
        userData.communications = communications || [];
        const { data: ratings } = await this.supabaseService.client
            .from('customer_satisfaction')
            .select('*')
            .eq('organization_id', user?.organization_id);
        userData.satisfactionRatings = ratings || [];
        const { data: consents } = await this.supabaseService.client
            .from('consent_records')
            .select('*')
            .eq('user_id', userId);
        userData.consentRecords = consents || [];
        return userData;
    }
    async requestDataDeletion(userId, email, reason) {
        try {
            const existingRequest = await this.supabaseService.client
                .from('data_deletion_requests')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['pending', 'processing'])
                .single();
            if (existingRequest.data) {
                return {
                    userId,
                    email,
                    requestDate: new Date(existingRequest.data.request_date),
                    scheduledDeletionDate: new Date(existingRequest.data.scheduled_deletion_date),
                    status: existingRequest.data.status,
                    reason: existingRequest.data.reason
                };
            }
            const scheduledDeletionDate = new Date();
            scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);
            const { data, error } = await this.supabaseService.client
                .from('data_deletion_requests')
                .insert({
                user_id: userId,
                email,
                request_date: new Date().toISOString(),
                scheduled_deletion_date: scheduledDeletionDate.toISOString(),
                status: 'pending',
                reason
            })
                .select()
                .single();
            if (error)
                throw error;
            this.logger.log(`Data deletion requested for user ${userId}, scheduled for ${scheduledDeletionDate}`);
            return {
                userId,
                email,
                requestDate: new Date(data.request_date),
                scheduledDeletionDate: new Date(data.scheduled_deletion_date),
                status: data.status,
                reason: data.reason
            };
        }
        catch (error) {
            this.logger.error(`Failed to request data deletion for user ${userId}:`, error);
            throw error;
        }
    }
    async cancelDataDeletion(userId) {
        try {
            const { error } = await this.supabaseService.client
                .from('data_deletion_requests')
                .update({ status: 'cancelled' })
                .eq('user_id', userId)
                .eq('status', 'pending');
            if (error)
                throw error;
            this.logger.log(`Data deletion cancelled for user ${userId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to cancel data deletion for user ${userId}:`, error);
            return false;
        }
    }
    async processScheduledDeletions() {
        try {
            const now = new Date();
            const { data: pendingDeletions } = await this.supabaseService.client
                .from('data_deletion_requests')
                .select('*')
                .eq('status', 'pending')
                .lte('scheduled_deletion_date', now.toISOString());
            for (const deletion of pendingDeletions || []) {
                await this.executeDataDeletion(deletion.user_id, deletion.id);
            }
        }
        catch (error) {
            this.logger.error('Failed to process scheduled deletions:', error);
        }
    }
    async executeDataDeletion(userId, requestId) {
        try {
            await this.supabaseService.client
                .from('data_deletion_requests')
                .update({ status: 'processing' })
                .eq('id', requestId);
            await this.supabaseService.client
                .from('consent_records')
                .delete()
                .eq('user_id', userId);
            await this.supabaseService.client
                .from('time_entries')
                .delete()
                .eq('user_id', userId);
            await this.supabaseService.client
                .from('customer_communications')
                .delete()
                .eq('created_by', userId);
            await this.supabaseService.client
                .from('jobs')
                .update({ assigned_to: null })
                .eq('assigned_to', userId);
            await this.supabaseService.client
                .from('user_profiles')
                .delete()
                .eq('user_id', userId);
            await this.supabaseService.client
                .from('users')
                .delete()
                .eq('id', userId);
            await this.supabaseService.client
                .from('data_deletion_requests')
                .update({ status: 'completed' })
                .eq('id', requestId);
            this.logger.log(`Data deletion completed for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Data deletion failed for user ${userId}:`, error);
            await this.supabaseService.client
                .from('data_deletion_requests')
                .update({ status: 'failed' })
                .eq('id', requestId);
        }
    }
    async recordConsent(userId, consentType, granted, ipAddress, userAgent, version = '1.0') {
        try {
            const consentRecord = {
                user_id: userId,
                consent_type: consentType,
                granted,
                granted_at: new Date().toISOString(),
                revoked_at: granted ? null : new Date().toISOString(),
                ip_address: ipAddress,
                user_agent: userAgent,
                version
            };
            const { data, error } = await this.supabaseService.client
                .from('consent_records')
                .insert(consentRecord)
                .select()
                .single();
            if (error)
                throw error;
            return {
                userId,
                consentType,
                granted,
                grantedAt: new Date(data.granted_at),
                revokedAt: data.revoked_at ? new Date(data.revoked_at) : undefined,
                ipAddress,
                userAgent,
                version
            };
        }
        catch (error) {
            this.logger.error(`Failed to record consent for user ${userId}:`, error);
            throw error;
        }
    }
    async getConsentStatus(userId, consentType) {
        try {
            let query = this.supabaseService.client
                .from('consent_records')
                .select('*')
                .eq('user_id', userId)
                .order('granted_at', { ascending: false });
            if (consentType) {
                query = query.eq('consent_type', consentType);
            }
            const { data, error } = await query;
            if (error)
                throw error;
            return (data || []).map(record => ({
                userId: record.user_id,
                consentType: record.consent_type,
                granted: record.granted,
                grantedAt: new Date(record.granted_at),
                revokedAt: record.revoked_at ? new Date(record.revoked_at) : undefined,
                ipAddress: record.ip_address,
                userAgent: record.user_agent,
                version: record.version
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get consent status for user ${userId}:`, error);
            throw error;
        }
    }
    encryptData(data) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decryptData(encryptedData) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async generateSecureDownloadUrl(encryptedData, userId) {
        const token = crypto.randomBytes(32).toString('hex');
        return `https://secure-downloads.rendetalje.dk/data-export/${token}`;
    }
    async cleanupExpiredData() {
        try {
            const now = new Date();
            await this.supabaseService.client
                .from('data_export_requests')
                .delete()
                .lt('expires_at', now.toISOString());
            const sevenYearsAgo = new Date();
            sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
            await this.supabaseService.client
                .from('consent_records')
                .delete()
                .lt('granted_at', sevenYearsAgo.toISOString());
            const threeYearsAgo = new Date();
            threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
            await this.supabaseService.client
                .from('customer_communications')
                .delete()
                .lt('created_at', threeYearsAgo.toISOString());
            this.logger.log('Expired data cleanup completed');
        }
        catch (error) {
            this.logger.error('Failed to cleanup expired data:', error);
        }
    }
    async getPrivacyPolicy(version) {
        try {
            let query = this.supabaseService.client
                .from('privacy_policies')
                .select('*')
                .eq('active', true);
            if (version) {
                query = query.eq('version', version);
            }
            else {
                query = query.order('created_at', { ascending: false }).limit(1);
            }
            const { data, error } = await query.single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            this.logger.error('Failed to get privacy policy:', error);
            throw error;
        }
    }
    async updatePrivacyPolicy(content, version) {
        try {
            await this.supabaseService.client
                .from('privacy_policies')
                .update({ active: false })
                .eq('active', true);
            await this.supabaseService.client
                .from('privacy_policies')
                .insert({
                content,
                version,
                active: true,
                created_at: new Date().toISOString()
            });
            this.logger.log(`Privacy policy updated to version ${version}`);
        }
        catch (error) {
            this.logger.error('Failed to update privacy policy:', error);
            throw error;
        }
    }
};
exports.GdprService = GdprService;
exports.GdprService = GdprService = GdprService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], GdprService);
//# sourceMappingURL=gdpr.service.js.map