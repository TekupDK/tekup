import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface CVRCompany {
  cvr: string;
  name: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  status: 'active' | 'inactive' | 'dissolved';
  industry: {
    code: string;
    description: string;
  };
  employees: number;
  foundedDate: Date;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  financials?: {
    revenue?: number;
    year?: number;
  };
}

export interface PEPPOLInfo {
  participantId: string;
  scheme: string;
  capabilities: string[];
  accessPoint: string;
  registrationDate: Date;
}

@Injectable()
export class CVRLookupService {
  private readonly logger = new Logger(CVRLookupService.name);
  private readonly CVR_API_BASE = 'https://cvrapi.dk/api';

  async lookupCompany(cvr: string): Promise<CVRCompany> {
    this.logger.log(`Looking up CVR: ${cvr}`);

    try {
      // Clean CVR number (remove spaces, hyphens)
      const cleanCvr = cvr.replace(/[\s-]/g, '');
      
      if (!/^\d{8}$/.test(cleanCvr)) {
        throw new Error('Invalid CVR format. Must be 8 digits.');
      }

      // Call CVR API (in production, use official Erhvervsstyrelsen API)
      const response = await axios.get(`${this.CVR_API_BASE}`, {
        params: {
          search: cleanCvr,
          country: 'dk',
          format: 'json',
        },
        timeout: 10000,
      });

      if (response.data.error) {
        throw new Error(`CVR lookup failed: ${response.data.error}`);
      }

      const data = response.data;
      
      const company: CVRCompany = {
        cvr: cleanCvr,
        name: data.name || 'Unknown Company',
        address: {
          street: data.address || '',
          postalCode: data.zipcode || '',
          city: data.city || '',
          country: 'Denmark',
        },
        status: this.mapStatus(data.status),
        industry: {
          code: data.industrycode || '',
          description: data.industrydesc || '',
        },
        employees: data.employees || 0,
        foundedDate: data.startdate ? new Date(data.startdate) : new Date(),
        contact: {
          phone: data.phone,
          email: data.email,
          website: data.homepage,
        },
      };

      this.logger.log(`CVR lookup successful: ${company.name}`);
      return company;

    } catch (error) {
      this.logger.error(`CVR lookup failed for ${cvr}:`, error);
      throw new Error(`Failed to lookup CVR ${cvr}: ${error.message}`);
    }
  }

  async checkPEPPOLRegistration(cvr: string): Promise<PEPPOLInfo | null> {
    this.logger.log(`Checking PEPPOL registration for CVR: ${cvr}`);

    try {
      // In production, integrate with PEPPOL SMP lookup
      // For now, simulate the check
      
      const cleanCvr = cvr.replace(/[\s-]/g, '');
      
      // Simulate PEPPOL lookup (in real implementation, query PEPPOL SMP)
      const isPeppolRegistered = Math.random() > 0.7; // 30% of companies are PEPPOL registered
      
      if (!isPeppolRegistered) {
        return null;
      }

      return {
        participantId: `0184:${cleanCvr}`,
        scheme: 'DK:CVR',
        capabilities: ['invoice', 'credit-note', 'order'],
        accessPoint: 'https://ap.peppol.dk',
        registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      };

    } catch (error) {
      this.logger.error(`PEPPOL lookup failed for ${cvr}:`, error);
      return null;
    }
  }

  async validateVATNumber(vatNumber: string): Promise<boolean> {
    this.logger.log(`Validating VAT number: ${vatNumber}`);

    try {
      // Danish VAT numbers are CVR + 'DK' prefix
      if (!vatNumber.startsWith('DK')) {
        return false;
      }

      const cvr = vatNumber.substring(2);
      const company = await this.lookupCompany(cvr);
      
      return company.status === 'active';

    } catch (error) {
      this.logger.error(`VAT validation failed for ${vatNumber}:`, error);
      return false;
    }
  }

  async getCompanyFinancials(cvr: string): Promise<any> {
    this.logger.log(`Fetching financials for CVR: ${cvr}`);

    try {
      // In production, integrate with Erhvervsstyrelsen's financial data API
      // For now, return simulated data
      
      return {
        cvr,
        latestYear: 2023,
        revenue: Math.floor(Math.random() * 50000000) + 1000000, // 1M to 50M DKK
        employees: Math.floor(Math.random() * 200) + 5,
        profitMargin: Math.random() * 20 + 5, // 5-25%
        creditRating: ['AAA', 'AA', 'A', 'BBB', 'BB'][Math.floor(Math.random() * 5)],
        lastUpdated: new Date(),
      };

    } catch (error) {
      this.logger.error(`Financial lookup failed for ${cvr}:`, error);
      throw error;
    }
  }

  private mapStatus(status: string): 'active' | 'inactive' | 'dissolved' {
    switch (status?.toLowerCase()) {
      case 'aktiv':
      case 'active':
        return 'active';
      case 'opløst':
      case 'dissolved':
        return 'dissolved';
      default:
        return 'inactive';
    }
  }
}