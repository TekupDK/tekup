import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import { StructuredLogger } from '../../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../../common/logging/async-context.service.js';
import { Lead } from '@prisma/client';

@Injectable()
export class DuplicateDetectionService {
  constructor(
    private prisma: PrismaService,
    private metrics: MetricsService,
    private logger: StructuredLogger,
    private contextService: AsyncContextService
  ) {}

  /**
   * Check if a lead is a duplicate of an existing lead
   * @param tenantId - The tenant ID
   * @param payload - The lead payload to check
   * @param timeWindowHours - Time window in hours to check for duplicates (default: 168 hours = 7 days)
   * @returns Duplicate lead if found, null otherwise
   */
  async findDuplicate(
    tenantId: string,
    payload: any,
    timeWindowHours: number = 168 // 7 days
  ): Promise<Lead | null> {
    const startTime = Date.now();
    
    try {
      // Extract key fields for duplicate detection
      const email = this.normalizeEmail(payload.email);
      const phone = this.normalizePhone(payload.phone);
      const name = this.normalizeName(payload.name);
      const address = this.normalizeAddress(payload.address);
      const postalCode = this.normalizePostalCode(payload.postal_code || payload.postalCode);
      
      // If we don't have any identifying information, we can't detect duplicates
      if (!email && !phone && !name) {
        this.recordDetectionMetrics('none_found', startTime, tenantId);
        return null;
      }
      
      // Calculate the time window
      const since = new Date();
      since.setHours(since.getHours() - timeWindowHours);
      
      // Try different detection strategies in order of accuracy
      let duplicate: Lead | null = null;
      let strategyUsed: string | null = null;
      
      // Strategy 1: Exact email match (highest confidence)
      if (email) {
        duplicate = await this.findDuplicateByEmail(tenantId, email, since);
        if (duplicate) {
          strategyUsed = 'email_exact';
          this.logger.debug('Duplicate found by exact email match', {
            ...this.contextService.toLogContext(),
            metadata: { 
              originalLeadId: duplicate.id,
              matchingField: 'email',
              email
            }
          });
          this.recordDetectionMetrics(strategyUsed, startTime, tenantId);
          this.metrics.increment('lead_duplicate_detected_total', { 
            tenant: tenantId, 
            strategy: strategyUsed 
          });
          return duplicate;
        }
      }
      
      // Strategy 2: Exact phone match
      if (phone) {
        duplicate = await this.findDuplicateByPhone(tenantId, phone, since);
        if (duplicate) {
          strategyUsed = 'phone_exact';
          this.logger.debug('Duplicate found by exact phone match', {
            ...this.contextService.toLogContext(),
            metadata: { 
              originalLeadId: duplicate.id,
              matchingField: 'phone',
              phone
            }
          });
          this.recordDetectionMetrics(strategyUsed, startTime, tenantId);
          this.metrics.increment('lead_duplicate_detected_total', { 
            tenant: tenantId, 
            strategy: strategyUsed 
          });
          return duplicate;
        }
      }
      
      // Strategy 3: Fuzzy name + address match
      if (name && address && postalCode) {
        duplicate = await this.findDuplicateByNameAndAddress(
          tenantId, 
          name, 
          address, 
          postalCode, 
          since
        );
        if (duplicate) {
          strategyUsed = 'name_address_fuzzy';
          this.logger.debug('Duplicate found by fuzzy name and address match', {
            ...this.contextService.toLogContext(),
            metadata: { 
              originalLeadId: duplicate.id,
              matchingField: 'name_address',
              name,
              postalCode
            }
          });
          this.recordDetectionMetrics(strategyUsed, startTime, tenantId);
          this.metrics.increment('lead_duplicate_detected_total', { 
            tenant: tenantId, 
            strategy: strategyUsed 
          });
          return duplicate;
        }
      }
      
      // Strategy 4: Fuzzy name + phone match
      if (name && phone) {
        duplicate = await this.findDuplicateByNameAndPhone(tenantId, name, phone, since);
        if (duplicate) {
          strategyUsed = 'name_phone_fuzzy';
          this.logger.debug('Duplicate found by fuzzy name and phone match', {
            ...this.contextService.toLogContext(),
            metadata: { 
              originalLeadId: duplicate.id,
              matchingField: 'name_phone',
              name,
              phone
            }
          });
          this.recordDetectionMetrics(strategyUsed, startTime, tenantId);
          this.metrics.increment('lead_duplicate_detected_total', { 
            tenant: tenantId, 
            strategy: strategyUsed 
          });
          return duplicate;
        }
      }
      
      // No duplicate found
      this.recordDetectionMetrics('none_found', startTime, tenantId);
      return null;
    } catch (error) {
      this.logger.error('Error during duplicate detection', {
        ...this.contextService.toLogContext(),
        errorCode: error.name,
        stackTrace: error.stack,
        metadata: { tenantId }
      });
      
      // Record error metrics
      this.recordDetectionMetrics('error', startTime, tenantId);
      
      // In case of error, we don't want to prevent lead creation
      return null;
    }
  }

  /**
   * Find duplicate by exact email match
   */
  private async findDuplicateByEmail(
    tenantId: string,
    email: string,
    since: Date
  ): Promise<Lead | null> {
    return this.prisma.lead.findFirst({
      where: {
        tenantId,
        createdAt: { gte: since },
        payload: { path: ['email'], equals: email }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find duplicate by exact phone match
   */
  private async findDuplicateByPhone(
    tenantId: string,
    phone: string,
    since: Date
  ): Promise<Lead | null> {
    return this.prisma.lead.findFirst({
      where: {
        tenantId,
        createdAt: { gte: since },
        payload: { path: ['phone'], equals: phone }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find duplicate by fuzzy name and address match
   */
  private async findDuplicateByNameAndAddress(
    tenantId: string,
    name: string,
    address: string,
    postalCode: string,
    since: Date
  ): Promise<Lead | null> {
    // First get leads with matching postal code in the time window
    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
        payload: { path: ['postal_code'], equals: postalCode }
      }
    });

    // Check each lead for name similarity
    for (const lead of leads) {
      const leadName = this.normalizeName(lead.payload?.['name']);
      if (leadName && this.calculateLevenshteinDistance(name, leadName) <= 2) {
        // Name is similar, check address
        const leadAddress = this.normalizeAddress(lead.payload?.['address']);
        if (leadAddress && this.calculateLevenshteinDistance(address, leadAddress) <= 3) {
          return lead;
        }
      }
    }

    return null;
  }

  /**
   * Find duplicate by fuzzy name and phone match
   */
  private async findDuplicateByNameAndPhone(
    tenantId: string,
    name: string,
    phone: string,
    since: Date
  ): Promise<Lead | null> {
    // First get leads with matching phone in the time window
    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
        payload: { path: ['phone'], equals: phone }
      }
    });

    // Check each lead for name similarity
    for (const lead of leads) {
      const leadName = this.normalizeName(lead.payload?.['name']);
      if (leadName && this.calculateLevenshteinDistance(name, leadName) <= 2) {
        return lead;
      }
    }

    return null;
  }

  /**
   * Merge a new lead with an existing duplicate
   * @param existingLead - The existing lead to merge into
   * @param newPayload - The payload of the new lead
   * @returns Merged payload
   */
  mergeLeadPayloads(existingLead: Lead, newPayload: any): any {
    const mergedPayload = { ...existingLead.payload };
    
    // Merge fields, preferring non-empty values from new payload
    Object.keys(newPayload).forEach(key => {
      if (newPayload[key] && 
          newPayload[key] !== '' && 
          (!mergedPayload[key] || mergedPayload[key] === '')) {
        mergedPayload[key] = newPayload[key];
      }
    });
    
    return mergedPayload;
  }

  /**
   * Normalize email for comparison
   */
  private normalizeEmail(email: string): string | undefined {
    if (!email) return undefined;
    return email.toLowerCase().trim();
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string | undefined {
    if (!phone) return undefined;
    // Remove all non-digit characters and ensure +45 prefix for Danish numbers
    let normalized = phone.replace(/\D/g, '');
    if (normalized.length === 8 && !normalized.startsWith('45')) {
      normalized = '45' + normalized;
    }
    return normalized;
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string | undefined {
    if (!name) return undefined;
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalize address for comparison
   */
  private normalizeAddress(address: string): string | undefined {
    if (!address) return undefined;
    return address.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalize postal code for comparison
   */
  private normalizePostalCode(postalCode: string): string | undefined {
    if (!postalCode) return undefined;
    return postalCode.replace(/\s+/g, '').toUpperCase();
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return track[str2.length][str1.length];
  }

  /**
   * Record metrics for duplicate detection
   */
  private recordDetectionMetrics(strategy: string, startTime: number, tenantId: string): void {
    const duration = Date.now() - startTime;
    this.metrics.increment('duplicate_detection_total', { strategy, tenant: tenantId });
    this.metrics.histogram('duplicate_detection_duration_seconds', duration / 1000, { tenant: tenantId });
  }
}