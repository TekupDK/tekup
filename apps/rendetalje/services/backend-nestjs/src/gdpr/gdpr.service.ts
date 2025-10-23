import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface DataExportRequest {
  userId: string;
  email: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  userId: string;
  email: string;
  requestDate: Date;
  scheduledDeletionDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  reason?: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
}

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 
      crypto.randomBytes(32).toString('hex');
  }

  // Data Export (Right to Data Portability)
  async requestDataExport(userId: string, email: string): Promise<DataExportRequest> {
    try {
      // Check if there's already a pending request
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

      // Create new export request
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

      if (error) throw error;

      // Start background export process
      this.processDataExport(userId, data.id);

      return {
        userId,
        email,
        requestDate: new Date(data.request_date),
        status: data.status
      };
    } catch (error) {
      this.logger.error(`Failed to request data export for user ${userId}:`, error);
      throw error;
    }
  }

  private async processDataExport(userId: string, requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.supabaseService.client
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Collect all user data
      const userData = await this.collectUserData(userId);

      // Encrypt sensitive data
      const encryptedData = this.encryptData(JSON.stringify(userData));

      // Generate secure download URL (in real implementation, upload to secure storage)
      const downloadUrl = await this.generateSecureDownloadUrl(encryptedData, userId);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

      // Update request with download URL
      await this.supabaseService.client
        .from('data_export_requests')
        .update({
          status: 'completed',
          download_url: downloadUrl,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', requestId);

      this.logger.log(`Data export completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Data export failed for user ${userId}:`, error);
      
      await this.supabaseService.client
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  private async collectUserData(userId: string): Promise<any> {
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

    // Get user data
    const { data: user } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    userData.user = user;

    // Get user profile
    const { data: profile } = await this.supabaseService.client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    userData.profile = profile;

    // Get customers (if user is owner/admin)
    const { data: customers } = await this.supabaseService.client
      .from('customers')
      .select('*')
      .eq('organization_id', user?.organization_id);
    userData.customers = customers || [];

    // Get jobs
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

    // Get time entries
    const { data: timeEntries } = await this.supabaseService.client
      .from('time_entries')
      .select('*')
      .eq('user_id', userId);
    userData.timeEntries = timeEntries || [];

    // Get communication logs
    const { data: communications } = await this.supabaseService.client
      .from('customer_communications')
      .select('*')
      .eq('created_by', userId);
    userData.communications = communications || [];

    // Get satisfaction ratings
    const { data: ratings } = await this.supabaseService.client
      .from('customer_satisfaction')
      .select('*')
      .eq('organization_id', user?.organization_id);
    userData.satisfactionRatings = ratings || [];

    // Get consent records
    const { data: consents } = await this.supabaseService.client
      .from('consent_records')
      .select('*')
      .eq('user_id', userId);
    userData.consentRecords = consents || [];

    return userData;
  }

  // Data Deletion (Right to be Forgotten)
  async requestDataDeletion(userId: string, email: string, reason?: string): Promise<DataDeletionRequest> {
    try {
      // Check if there's already a pending request
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

      // Schedule deletion for 30 days from now (grace period)
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

      if (error) throw error;

      this.logger.log(`Data deletion requested for user ${userId}, scheduled for ${scheduledDeletionDate}`);

      return {
        userId,
        email,
        requestDate: new Date(data.request_date),
        scheduledDeletionDate: new Date(data.scheduled_deletion_date),
        status: data.status,
        reason: data.reason
      };
    } catch (error) {
      this.logger.error(`Failed to request data deletion for user ${userId}:`, error);
      throw error;
    }
  }

  async cancelDataDeletion(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from('data_deletion_requests')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      this.logger.log(`Data deletion cancelled for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel data deletion for user ${userId}:`, error);
      return false;
    }
  }

  async processScheduledDeletions(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to process scheduled deletions:', error);
    }
  }

  private async executeDataDeletion(userId: string, requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.supabaseService.client
        .from('data_deletion_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Delete user data in correct order (respecting foreign key constraints)
      
      // 1. Delete consent records
      await this.supabaseService.client
        .from('consent_records')
        .delete()
        .eq('user_id', userId);

      // 2. Delete time entries
      await this.supabaseService.client
        .from('time_entries')
        .delete()
        .eq('user_id', userId);

      // 3. Delete communication logs
      await this.supabaseService.client
        .from('customer_communications')
        .delete()
        .eq('created_by', userId);

      // 4. Anonymize job assignments (don't delete jobs as they may be needed for business records)
      await this.supabaseService.client
        .from('jobs')
        .update({ assigned_to: null })
        .eq('assigned_to', userId);

      // 5. Delete user profile
      await this.supabaseService.client
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      // 6. Delete user account
      await this.supabaseService.client
        .from('users')
        .delete()
        .eq('id', userId);

      // 7. Update deletion request status
      await this.supabaseService.client
        .from('data_deletion_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      this.logger.log(`Data deletion completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Data deletion failed for user ${userId}:`, error);
      
      await this.supabaseService.client
        .from('data_deletion_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  // Consent Management
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    version: string = '1.0'
  ): Promise<ConsentRecord> {
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

      if (error) throw error;

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
    } catch (error) {
      this.logger.error(`Failed to record consent for user ${userId}:`, error);
      throw error;
    }
  }

  async getConsentStatus(userId: string, consentType?: string): Promise<ConsentRecord[]> {
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
      if (error) throw error;

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
    } catch (error) {
      this.logger.error(`Failed to get consent status for user ${userId}:`, error);
      throw error;
    }
  }

  // Data Encryption/Decryption
  private encryptData(data: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptData(encryptedData: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async generateSecureDownloadUrl(encryptedData: string, userId: string): Promise<string> {
    // In a real implementation, this would upload to secure storage (S3, etc.)
    // and return a signed URL. For now, we'll return a placeholder.
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store the encrypted data with the token (in real implementation)
    // This is a simplified version
    return `https://secure-downloads.rendetalje.dk/data-export/${token}`;
  }

  // Data Retention Management
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      
      // Clean up expired export requests
      await this.supabaseService.client
        .from('data_export_requests')
        .delete()
        .lt('expires_at', now.toISOString());

      // Clean up old consent records (keep for 7 years as per GDPR)
      const sevenYearsAgo = new Date();
      sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
      
      await this.supabaseService.client
        .from('consent_records')
        .delete()
        .lt('granted_at', sevenYearsAgo.toISOString());

      // Clean up old communication logs (keep for 3 years)
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      await this.supabaseService.client
        .from('customer_communications')
        .delete()
        .lt('created_at', threeYearsAgo.toISOString());

      this.logger.log('Expired data cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup expired data:', error);
    }
  }

  // Privacy Policy and Terms Management
  async getPrivacyPolicy(version?: string): Promise<any> {
    try {
      let query = this.supabaseService.client
        .from('privacy_policies')
        .select('*')
        .eq('active', true);

      if (version) {
        query = query.eq('version', version);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();
      if (error) throw error;

      return data;
    } catch (error) {
      this.logger.error('Failed to get privacy policy:', error);
      throw error;
    }
  }

  async updatePrivacyPolicy(content: string, version: string): Promise<void> {
    try {
      // Deactivate current policy
      await this.supabaseService.client
        .from('privacy_policies')
        .update({ active: false })
        .eq('active', true);

      // Create new policy
      await this.supabaseService.client
        .from('privacy_policies')
        .insert({
          content,
          version,
          active: true,
          created_at: new Date().toISOString()
        });

      this.logger.log(`Privacy policy updated to version ${version}`);
    } catch (error) {
      this.logger.error('Failed to update privacy policy:', error);
      throw error;
    }
  }
}