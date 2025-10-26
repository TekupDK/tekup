import { Injectable } from '@nestjs/common';
// import { CVRService, DanishCompanyInfo, ComplianceStatus } from '@tekup/sso'; // TODO: Fix @tekup/sso package
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('tekup-crm-cvr-integration');

@Injectable()
export class CRMCVRIntegrationService {
  constructor(
    private readonly cvrService: CVRService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Enrich company data with Danish CVR information
   */
  async enrichCompanyWithCVR(companyId: string, cvr: string): Promise<void> {
    try {
      // Lookup company in CVR register
      const cvrData = await this.cvrService.lookupCompanyByCVR(cvr);
      
      // Get compliance status
      const compliance = await this.cvrService.getComplianceStatus(cvr);
      
      // Update company record with CVR data
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          name: cvrData.name,
          cvr: cvrData.cvr,
          legalForm: cvrData.legalForm,
          status: cvrData.status,
          address: {
            street: cvrData.address.street,
            postalCode: cvrData.address.postalCode,
            city: cvrData.address.city,
            country: cvrData.address.country,
          },
          industry: {
            code: cvrData.industry.code,
            description: cvrData.industry.description,
          },
          employees: cvrData.employees,
          founded: cvrData.founded,
          phone: cvrData.phone,
          email: cvrData.email,
          website: cvrData.website,
          creditRating: cvrData.creditRating,
          complianceStatus: {
            isActive: compliance.isActive,
            hasValidAddress: compliance.hasValidAddress,
            gdprCompliant: compliance.gdprCompliant,
            taxCompliant: compliance.taxCompliant,
            riskLevel: compliance.riskLevel,
            lastChecked: compliance.lastChecked,
          },
          lastCvrSync: new Date(),
        },
      });

      // Create activity log
      await this.prisma.activity.create({
        data: {
          type: 'CVR_SYNC',
          description: `Company data synchronized with CVR register`,
          companyId,
          metadata: {
            cvr: cvrData.cvr,
            companyName: cvrData.name,
            riskLevel: compliance.riskLevel,
          },
        },
      });

      logger.info(`Company ${companyId} enriched with CVR data for ${cvr}`);
    } catch (error) {
      logger.error(`CVR enrichment failed for company ${companyId}:`, error);
      
      // Log the failed attempt
      await this.prisma.activity.create({
        data: {
          type: 'CVR_SYNC_FAILED',
          description: `Failed to sync with CVR register: ${error.message}`,
          companyId,
          metadata: { cvr, error: error.message },
        },
      });
      
      throw new Error(`CVR enrichment failed: ${error.message}`);
    }
  }

  /**
   * Auto-validate Danish companies on creation
   */
  async validateDanishCompany(companyData: any): Promise<CompanyValidationResult> {
    try {
      if (!companyData.cvr) {
      return {
        isValid: false,
        errors: ['CVR number is required for Danish companies'],
        warnings: [],
      };
      }

      const cvrData = await this.cvrService.lookupCompanyByCVR(companyData.cvr);
      const compliance = await this.cvrService.getComplianceStatus(companyData.cvr);

      const validationResult: CompanyValidationResult = {
        isValid: true,
        cvrData,
        compliance,
        warnings: [],
        errors: [],
      };

      // Check for warnings
      if (compliance.riskLevel === 'HIGH') {
        validationResult.warnings.push('High risk company - requires additional verification');
      }

      if (!compliance.isActive) {
        validationResult.errors.push('Company is not active in CVR register');
        validationResult.isValid = false;
      }

      if (!compliance.hasValidAddress) {
        validationResult.warnings.push('Company address may be incomplete');
      }

      return validationResult;
    } catch (error) {
      return {
        isValid: false,
        errors: [`CVR validation failed: ${error.message}`],
        warnings: [],
      };
    }
  }

  /**
   * Bulk refresh CVR data for all Danish companies
   */
  async bulkRefreshCVRData(tenantId: string): Promise<BulkRefreshResult> {
    const companies = await this.prisma.company.findMany({
      where: {
        tenantId,
        cvr: { not: null },
      },
      select: { id: true, cvr: true, name: true },
    });

    const results: BulkRefreshResult = {
      total: companies.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const company of companies) {
      try {
        await this.enrichCompanyWithCVR(company.id, company.cvr);
        results.successful++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push({
          companyId: company.id,
          companyName: company.name,
          cvr: company.cvr,
          error: error.message,
        });
      }
    }

    logger.info(`Bulk CVR refresh completed: ${results.successful}/${results.total} successful`);
    return results;
  }

  /**
   * Search for Danish companies by name and suggest CVR matches
   */
  async suggestCVRMatches(companyName: string): Promise<CVRSuggestion[]> {
    try {
      const searchResults = await this.cvrService.searchCompaniesByName(companyName, 5);
      
      return searchResults.map(result => ({
        cvr: result.cvr,
        name: result.name,
        address: result.address,
        status: result.status,
        industry: result.industry,
        matchScore: this.calculateMatchScore(companyName, result.name),
      }));
    } catch (error) {
      logger.error(`CVR suggestion failed for "${companyName}":`, error);
      return [];
    }
  }

  /**
   * Calculate name match score for CVR suggestions
   */
  private calculateMatchScore(searchName: string, cvrName: string): number {
    const search = searchName.toLowerCase();
    const cvr = cvrName.toLowerCase();
    
    if (search === cvr) return 100;
    if (cvr.includes(search) || search.includes(cvr)) return 80;
    
    // Simple character overlap calculation
    const searchChars = new Set(search.replace(/\s/g, ''));
    const cvrChars = new Set(cvr.replace(/\s/g, ''));
    const intersection = new Set([...searchChars].filter(x => cvrChars.has(x)));
    
    return Math.round((intersection.size / Math.max(searchChars.size, cvrChars.size)) * 60);
  }
}

export interface CompanyValidationResult {
  isValid: boolean;
  cvrData?: DanishCompanyInfo;
  compliance?: ComplianceStatus;
  warnings: string[];
  errors: string[];
}

export interface BulkRefreshResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    companyId: string;
    companyName: string;
    cvr: string;
    error: string;
  }>;
}

export interface CVRSuggestion {
  cvr: string;
  name: string;
  address: string;
  status: string;
  industry?: string;
  matchScore: number;
}
