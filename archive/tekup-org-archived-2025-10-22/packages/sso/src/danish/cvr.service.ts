import { Injectable } from '@nestjs/common';
import { createLogger } from '@tekup/shared';

const logger = createLogger('tekup-cvr-service');

@Injectable()
export class CVRService {
  private readonly cvrApiUrl = 'https://cvrapi.dk/api';
  private readonly virkApiUrl = 'https://data.virk.dk/datakatalog/offentliggoerelsesoverblik';

  /**
   * Lookup Danish company by CVR number
   */
  async lookupCompanyByCVR(cvr: string): Promise<DanishCompanyInfo> {
    const cleanCvr = cvr.replace(/\s/g, '');
    
    if (!this.isValidCVR(cleanCvr)) {
      throw new Error('Invalid CVR number format');
    }

    try {
      const response = await fetch(`${this.cvrApiUrl}?search=${cleanCvr}&country=dk&format=json`);
      
      if (!response.ok) {
        throw new Error(`CVR lookup failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.error) {
        throw new Error('Company not found in CVR register');
      }

      const companyInfo: DanishCompanyInfo = {
        cvr: cleanCvr,
        name: data.name,
        legalForm: data.companyform?.longdesc,
        status: data.status,
        address: {
          street: data.address,
          postalCode: data.zipcode,
          city: data.city,
          country: 'Denmark'
        },
        industry: {
          code: data.industrycode,
          description: data.industrydesc
        },
        employees: data.employees,
        founded: data.startdate,
        phone: data.phone,
        email: data.email,
        website: data.homepage,
        creditRating: data.creditStartDate ? 'Available' : 'Not Available',
        lastUpdated: new Date()
      };

      logger.info(`CVR lookup successful for ${cleanCvr}: ${data.name}`);
      
      return companyInfo;
    } catch (error) {
      logger.error(`CVR lookup failed for ${cleanCvr}:`, error);
      throw new Error('Failed to lookup company in CVR register');
    }
  }

  /**
   * Search for Danish companies by name
   */
  async searchCompaniesByName(name: string, limit: number = 10): Promise<DanishCompanySearchResult[]> {
    try {
      const response = await fetch(`${this.cvrApiUrl}?search=${encodeURIComponent(name)}&country=dk&format=json`);
      
      if (!response.ok) {
        throw new Error(`Company search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        return [];
      }

      const results = data.slice(0, limit).map(company => ({
        cvr: company.vat,
        name: company.name,
        address: `${company.address}, ${company.zipcode} ${company.city}`,
        status: company.status,
        industry: company.industrydesc
      }));

      logger.info(`Company search for "${name}" returned ${results.length} results`);
      
      return results;
    } catch (error) {
      logger.error(`Company search failed for "${name}":`, error);
      throw new Error('Failed to search companies');
    }
  }

  /**
   * Validate Danish CVR number format
   */
  private isValidCVR(cvr: string): boolean {
    // CVR numbers are 8 digits
    const cvrRegex = /^\d{8}$/;
    return cvrRegex.test(cvr);
  }

  /**
   * Get company compliance status (simplified)
   */
  async getComplianceStatus(cvr: string): Promise<ComplianceStatus> {
    const company = await this.lookupCompanyByCVR(cvr);
    
    // Basic compliance checks
    const compliance: ComplianceStatus = {
      cvr,
      isActive: company.status === 'ACTIVE',
      hasValidAddress: Boolean(company.address?.street && company.address?.postalCode),
      gdprCompliant: true, // Would need actual GDPR status check
      taxCompliant: true, // Would integrate with SKAT (Danish tax authority)
      lastChecked: new Date(),
      riskLevel: this.calculateRiskLevel(company)
    };

    return compliance;
  }

  /**
   * Calculate basic risk level for Danish company
   */
  private calculateRiskLevel(company: DanishCompanyInfo): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // Risk factors
    if (company.status !== 'ACTIVE') riskScore += 3;
    if (!company.phone && !company.email) riskScore += 2;
    if (!company.website) riskScore += 1;
    if (company.employees && company.employees < 5) riskScore += 1;

    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }
}

export interface DanishCompanyInfo {
  cvr: string;
  name: string;
  legalForm?: string;
  status: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  industry: {
    code?: string;
    description?: string;
  };
  employees?: number;
  founded?: string;
  phone?: string;
  email?: string;
  website?: string;
  creditRating?: string;
  lastUpdated: Date;
}

export interface DanishCompanySearchResult {
  cvr: string;
  name: string;
  address: string;
  status: string;
  industry?: string;
}

export interface ComplianceStatus {
  cvr: string;
  isActive: boolean;
  hasValidAddress: boolean;
  gdprCompliant: boolean;
  taxCompliant: boolean;
  lastChecked: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
