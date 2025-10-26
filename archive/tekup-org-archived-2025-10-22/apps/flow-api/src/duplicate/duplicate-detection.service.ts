import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

export interface DuplicateDetectionConfig {
  tenantId: string;
  enabled: boolean;
  threshold: number; // 0.0 - 1.0, confidence threshold for marking as duplicate
  fieldsToCompare: string[];
  fuzzyMatchingEnabled: boolean;
  fuzzyThreshold: number; // 0.0 - 1.0 for fuzzy matching sensitivity
  autoMergeEnabled: boolean;
  notificationEnabled: boolean;
  customRules?: DuplicateRule[];
}

export interface DuplicateRule {
  name: string;
  fields: string[];
  weight: number; // 0.0 - 1.0 importance of this rule
  condition: 'exact' | 'fuzzy' | 'regex';
  pattern?: string; // For regex condition
}

export interface DuplicateCandidate {
  leadId: string;
  similarityScore: number;
  confidenceScore: number;
  matchedFields: string[];
  details: Record<string, any>;
}

export interface DuplicateGroup {
  groupId: string;
  candidates: DuplicateCandidate[];
  primaryLeadId: string;
  createdAt: Date;
  resolved: boolean;
  resolutionMethod?: 'merged' | 'separate' | 'manual';
}

export interface MergeOperation {
  sourceLeadId: string;
  targetLeadId: string;
  mergedFields: Record<string, any>;
  conflicts: MergeConflict[];
  performedBy: string;
  performedAt: Date;
  auditTrail: MergeAuditEvent[];
}

export interface MergeConflict {
  field: string;
  sourceValue: any;
  targetValue: any;
  resolution: 'source' | 'target' | 'custom';
  customValue?: any;
}

export interface MergeAuditEvent {
  timestamp: Date;
  action: string;
  actor: string;
  details?: Record<string, any>;
}

@Injectable()
export class DuplicateDetectionService {
  private readonly logger = new Logger(DuplicateDetectionService.name);
  private readonly defaultConfig: DuplicateDetectionConfig = {
    tenantId: '',
    enabled: true,
    threshold: 0.8,
    fieldsToCompare: ['name', 'email', 'phone', 'company'],
    fuzzyMatchingEnabled: true,
    fuzzyThreshold: 0.7,
    autoMergeEnabled: false,
    notificationEnabled: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Find potential duplicates for a lead
   */
  async findDuplicates(leadId: string, tenantId: string): Promise<DuplicateCandidate[]> {
    try {
      // Get the lead to check for duplicates
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId, tenantId },
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} not found for tenant ${tenantId}`);
      }

      // Get tenant configuration
      const config = await this.getTenantConfig(tenantId);

      if (!config.enabled) {
        return [];
      }

      // Build search criteria based on configuration
      const searchCriteria = this.buildSearchCriteria(lead, config);

      // Find potential duplicates
      const potentialDuplicates = await this.prisma.lead.findMany({
        where: {
          tenantId,
          id: { not: leadId },
          OR: searchCriteria,
        },
        take: 50, // Limit to prevent performance issues
      });

      // Calculate similarity scores for each potential duplicate
      const candidates: DuplicateCandidate[] = [];

      for (const duplicate of potentialDuplicates) {
        const similarity = await this.calculateSimilarity(lead, duplicate, config);
        
        if (similarity.confidenceScore >= config.threshold) {
          candidates.push({
            leadId: duplicate.id,
            similarityScore: similarity.similarityScore,
            confidenceScore: similarity.confidenceScore,
            matchedFields: similarity.matchedFields,
            details: similarity.details,
          });
        }
      }

      // Sort by confidence score descending
      candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

      // Record metrics
      this.metricsService.increment('duplicate_detection_checks_total', {
        tenant: tenantId,
      });

      this.metricsService.histogram('duplicate_candidates_found', candidates.length, {
        tenant: tenantId,
      });

      return candidates;
    } catch (error) {
      this.logger.error(`Failed to find duplicates for lead ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Create a duplicate group for potential duplicates
   */
  async createDuplicateGroup(
    tenantId: string,
    leadIds: string[]
  ): Promise<DuplicateGroup> {
    if (leadIds.length < 2) {
      throw new Error('At least 2 leads required to create a duplicate group');
    }

    // Verify all leads exist and belong to tenant
    const leads = await this.prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        tenantId,
      },
    });

    if (leads.length !== leadIds.length) {
      throw new Error('Some leads not found or access denied');
    }

    // Create duplicate group
    const group = await this.prisma.duplicateGroup.create({
      data: {
        tenantId,
        resolved: false,
        primaryLeadId: leadIds[0], // First lead as primary by default
        duplicateMembers: {
          create: leadIds.map(leadId => ({ leadId })),
        },
      },
      include: {
        duplicateMembers: true,
      },
    });

    // Find candidates for each lead in the group
    const candidates: DuplicateCandidate[] = [];
    for (const leadId of leadIds) {
      const duplicates = await this.findDuplicates(leadId, tenantId);
      candidates.push(...duplicates);
    }

    // Log the creation
    this.structuredLogger.info(
      'Duplicate group created',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          groupId: group.id,
          tenantId,
          leadCount: leadIds.length,
          primaryLeadId: group.primaryLeadId,
        },
      }
    );

    return {
      groupId: group.id,
      candidates,
      primaryLeadId: group.primaryLeadId,
      createdAt: group.createdAt,
      resolved: group.resolved,
    };
  }

  /**
   * Merge duplicate leads
   */
  async mergeDuplicates(
    sourceLeadId: string,
    targetLeadId: string,
    tenantId: string,
    performedBy: string,
    fieldResolutions?: Record<string, any>
  ): Promise<MergeOperation> {
    // Verify both leads exist and belong to tenant
    const [sourceLead, targetLead] = await Promise.all([
      this.prisma.lead.findUnique({
        where: { id: sourceLeadId, tenantId },
      }),
      this.prisma.lead.findUnique({
        where: { id: targetLeadId, tenantId },
      }),
    ]);

    if (!sourceLead || !targetLead) {
      throw new Error('One or both leads not found or access denied');
    }

    // Identify conflicts and resolve them
    const conflicts = this.identifyConflicts(sourceLead, targetLead);
    const resolvedFields = this.resolveConflicts(conflicts, fieldResolutions);

    // Start audit trail
    const auditTrail: MergeAuditEvent[] = [
      {
        timestamp: new Date(),
        action: 'merge_initiated',
        actor: performedBy,
        details: {
          sourceLeadId,
          targetLeadId,
        },
      },
    ];

    try {
      // Perform merge in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update target lead with merged data
        const updatedTarget = await tx.lead.update({
          where: { id: targetLeadId },
          data: resolvedFields,
        });

        // Move events from source to target
        await tx.leadEvent.updateMany({
          where: { leadId: sourceLeadId },
          data: { leadId: targetLeadId },
        });

        // Mark source lead as duplicate
        await tx.lead.update({
          where: { id: sourceLeadId },
          data: {
            duplicateOf: targetLeadId,
            status: 'LOST', // Mark as lost since it's now a duplicate
          },
        });

        // Create audit event
        auditTrail.push({
          timestamp: new Date(),
          action: 'merge_completed',
          actor: performedBy,
          details: {
            updatedFields: Object.keys(resolvedFields),
            eventCount: sourceLead.events?.length || 0,
          },
        });

        return updatedTarget;
      });

      // Create merge operation record
      const mergeOperation: MergeOperation = {
        sourceLeadId,
        targetLeadId,
        mergedFields: resolvedFields,
        conflicts,
        performedBy,
        performedAt: new Date(),
        auditTrail,
      };

      // Log successful merge
      this.structuredLogger.info(
        'Leads merged successfully',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            sourceLeadId,
            targetLeadId,
            tenantId,
            conflictCount: conflicts.length,
            performedBy,
          },
        }
      );

      // Record metrics
      this.metricsService.increment('leads_merged_total', {
        tenant: tenantId,
      });

      return mergeOperation;
    } catch (error) {
      // Log failed merge
      auditTrail.push({
        timestamp: new Date(),
        action: 'merge_failed',
        actor: performedBy,
        details: {
          error: error.message,
        },
      });

      this.logger.error(`Failed to merge leads ${sourceLeadId} and ${targetLeadId}:`, error);
      throw error;
    }
  }

  /**
   * Get tenant-specific duplicate detection configuration
   */
  async getTenantConfig(tenantId: string): Promise<DuplicateDetectionConfig> {
    try {
      // Try to get tenant-specific config from settings
      const setting = await this.prisma.tenantSetting.findUnique({
        where: {
          tenantId_key: {
            tenantId,
            key: 'duplicate_detection_config',
          },
        },
      });

      if (setting) {
        const config = { ...this.defaultConfig, ...JSON.parse(setting.value as string) };
        config.tenantId = tenantId;
        return config;
      }

      // Return default config with tenant ID
      return { ...this.defaultConfig, tenantId };
    } catch (error) {
      this.logger.warn(`Failed to get tenant config for ${tenantId}, using defaults:`, error);
      return { ...this.defaultConfig, tenantId };
    }
  }

  /**
   * Update tenant duplicate detection configuration
   */
  async updateTenantConfig(
    tenantId: string,
    config: Partial<DuplicateDetectionConfig>
  ): Promise<DuplicateDetectionConfig> {
    const existingConfig = await this.getTenantConfig(tenantId);
    const updatedConfig = { ...existingConfig, ...config };

    await this.prisma.tenantSetting.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: 'duplicate_detection_config',
        },
      },
      create: {
        tenantId,
        key: 'duplicate_detection_config',
        value: JSON.stringify(updatedConfig),
      },
      update: {
        value: JSON.stringify(updatedConfig),
      },
    });

    this.structuredLogger.info(
      'Duplicate detection config updated',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          updatedFields: Object.keys(config),
        },
      }
    );

    return updatedConfig;
  }

  /**
   * Resolve a duplicate group
   */
  async resolveDuplicateGroup(
    groupId: string,
    tenantId: string,
    resolutionMethod: 'merged' | 'separate' | 'manual',
    primaryLeadId?: string
  ): Promise<DuplicateGroup> {
    // Verify the group exists and belongs to tenant
    const group = await this.prisma.duplicateGroup.findUnique({
      where: { id: groupId, tenantId },
      include: { duplicateMembers: true },
    });

    if (!group) {
      throw new Error(`Duplicate group ${groupId} not found for tenant ${tenantId}`);
    }

    // Update the group
    const updatedGroup = await this.prisma.duplicateGroup.update({
      where: { id: groupId },
      data: {
        resolved: true,
        resolutionMethod,
        primaryLeadId: primaryLeadId || group.primaryLeadId,
      },
      include: { duplicateMembers: true },
    });

    // Log the resolution
    this.structuredLogger.info(
      'Duplicate group resolved',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          groupId: group.id,
          tenantId,
          resolutionMethod,
          primaryLeadId: updatedGroup.primaryLeadId,
        },
      }
    );

    // Find candidates for the group
    const candidates: DuplicateCandidate[] = [];
    for (const member of updatedGroup.duplicateMembers) {
      const duplicates = await this.findDuplicates(member.leadId, tenantId);
      candidates.push(...duplicates);
    }

    return {
      groupId: updatedGroup.id,
      candidates,
      primaryLeadId: updatedGroup.primaryLeadId,
      createdAt: updatedGroup.createdAt,
      resolved: updatedGroup.resolved,
      resolutionMethod: updatedGroup.resolutionMethod,
    };
  }

  /**
   * Delete a duplicate group (mark as not duplicate)
   */
  async deleteDuplicateGroup(
    groupId: string,
    tenantId: string
  ): Promise<boolean> {
    // Verify the group exists and belongs to tenant
    const group = await this.prisma.duplicateGroup.findUnique({
      where: { id: groupId, tenantId },
    });

    if (!group) {
      throw new Error(`Duplicate group ${groupId} not found for tenant ${tenantId}`);
    }

    // Delete the group
    await this.prisma.duplicateGroup.delete({
      where: { id: groupId },
    });

    // Log the deletion
    this.structuredLogger.info(
      'Duplicate group deleted',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          groupId,
          tenantId,
        },
      }
    );

    return true;
  }

  /**
   * Get all duplicate groups for a tenant
   */
  async getDuplicateGroups(
    tenantId: string,
    options?: {
      resolved?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<DuplicateGroup[]> {
    const groups = await this.prisma.duplicateGroup.findMany({
      where: {
        tenantId,
        resolved: options?.resolved,
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        duplicateMembers: true,
      },
    });

    const result: DuplicateGroup[] = [];
    for (const group of groups) {
      // Find candidates for the group
      const candidates: DuplicateCandidate[] = [];
      for (const member of group.duplicateMembers) {
        const duplicates = await this.findDuplicates(member.leadId, tenantId);
        candidates.push(...duplicates);
      }

      result.push({
        groupId: group.id,
        candidates,
        primaryLeadId: group.primaryLeadId,
        createdAt: group.createdAt,
        resolved: group.resolved,
        resolutionMethod: group.resolutionMethod,
      });
    }

    return result;
  }

  /**
   * Get a specific duplicate group
   */
  async getDuplicateGroup(
    groupId: string,
    tenantId: string
  ): Promise<DuplicateGroup> {
    const group = await this.prisma.duplicateGroup.findUnique({
      where: { id: groupId, tenantId },
      include: { duplicateMembers: true },
    });

    if (!group) {
      throw new Error(`Duplicate group ${groupId} not found for tenant ${tenantId}`);
    }

    // Find candidates for the group
    const candidates: DuplicateCandidate[] = [];
    for (const member of group.duplicateMembers) {
      const duplicates = await this.findDuplicates(member.leadId, tenantId);
      candidates.push(...duplicates);
    }

    return {
      groupId: group.id,
      candidates,
      primaryLeadId: group.primaryLeadId,
      createdAt: group.createdAt,
      resolved: group.resolved,
      resolutionMethod: group.resolutionMethod,
    };
  }

  private buildSearchCriteria(lead: any, config: DuplicateDetectionConfig): any[] {
    const criteria: any[] = [];

    // Exact matching on key fields
    if (lead.email) {
      criteria.push({ email: lead.email });
    }

    if (lead.phone) {
      criteria.push({ phone: lead.phone });
    }

    if (lead.name) {
      criteria.push({ name: lead.name });
    }

    if (lead.company) {
      criteria.push({ company: lead.company });
    }

    // Fuzzy matching if enabled
    if (config.fuzzyMatchingEnabled && lead.name) {
      // This would require a more sophisticated fuzzy search implementation
      // For now, we'll add a simple pattern match
      criteria.push({ 
        name: {
          contains: lead.name.substring(0, Math.min(3, lead.name.length)),
        },
      });
    }

    return criteria;
  }

  private async calculateSimilarity(
    lead1: any,
    lead2: any,
    config: DuplicateDetectionConfig
  ): Promise<{
    similarityScore: number;
    confidenceScore: number;
    matchedFields: string[];
    details: Record<string, any>;
  }> {
    let totalScore = 0;
    let maxScore = 0;
    const matchedFields: string[] = [];
    const details: Record<string, any> = {};

    // Compare each configured field
    for (const field of config.fieldsToCompare) {
      const value1 = lead1[field];
      const value2 = lead2[field];
      
      if (value1 && value2) {
        maxScore += 1;
        
        let fieldScore = 0;
        
        if (config.fuzzyMatchingEnabled) {
          const fuzzyScore = this.calculateFuzzySimilarity(value1.toString(), value2.toString());
          if (fuzzyScore >= config.fuzzyThreshold) {
            fieldScore = fuzzyScore;
            matchedFields.push(field);
          }
        } else {
          // Exact matching
          if (value1.toString().toLowerCase() === value2.toString().toLowerCase()) {
            fieldScore = 1;
            matchedFields.push(field);
          }
        }
        
        totalScore += fieldScore;
        details[field] = {
          value1,
          value2,
          score: fieldScore,
        };
      }
    }

    const similarityScore = maxScore > 0 ? totalScore / maxScore : 0;
    const confidenceScore = similarityScore; // Could be enhanced with ML model

    return {
      similarityScore,
      confidenceScore,
      matchedFields,
      details,
    };
  }

  private calculateFuzzySimilarity(str1: string, str2: string): number {
    // Simple implementation using Levenshtein distance
    // In a real implementation, this would use a more sophisticated algorithm
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private identifyConflicts(lead1: any, lead2: any): MergeConflict[] {
    const conflicts: MergeConflict[] = [];

    // Check for conflicts in all fields
    for (const [field, value1] of Object.entries(lead1)) {
      const value2 = (lead2 as any)[field];
      
      // Skip non-data fields
      if (['id', 'tenantId', 'createdAt', 'updatedAt', 'events'].includes(field)) {
        continue;
      }

      // Check if both values exist and are different
      if (value1 !== null && value1 !== undefined && 
          value2 !== null && value2 !== undefined && 
          value1.toString() !== value2.toString()) {
        conflicts.push({
          field,
          sourceValue: value1,
          targetValue: value2,
          resolution: 'source', // Default to source value
        });
      }
    }

    return conflicts;
  }

  private resolveConflicts(
    conflicts: MergeConflict[],
    fieldResolutions?: Record<string, any>
  ): Record<string, any> {
    const resolvedFields: Record<string, any> = {};

    for (const conflict of conflicts) {
      if (fieldResolutions && fieldResolutions[conflict.field] !== undefined) {
        // Use provided resolution
        resolvedFields[conflict.field] = fieldResolutions[conflict.field];
      } else {
        // Use default resolution (source value)
        resolvedFields[conflict.field] = conflict.sourceValue;
      }
    }

    return resolvedFields;
  }
}