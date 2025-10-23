import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationService, IntegrationConfig } from '../integration.service';

export interface VaultDocument {
  id?: string;
  title: string;
  content: string;
  type: 'faq' | 'procedure' | 'policy' | 'manual' | 'template';
  category: string;
  tags: string[];
  language: string;
  version?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  score: number;
  highlights: string[];
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  type?: string;
  category?: string;
  language?: string;
  limit?: number;
  offset?: number;
  includeContent?: boolean;
}

export interface KnowledgeBase {
  id?: string;
  name: string;
  description: string;
  language: string;
  isPublic: boolean;
  documents: VaultDocument[];
}

@Injectable()
export class TekupVaultService {
  private readonly logger = new Logger(TekupVaultService.name);
  private readonly config: IntegrationConfig;

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      baseUrl: this.configService.get<string>('integrations.tekupVault.url'),
      apiKey: this.configService.get<string>('integrations.tekupVault.apiKey'),
      timeout: 30000,
      retries: 2,
    };

    if (!this.config.baseUrl || !this.config.apiKey) {
      this.logger.warn('TekupVault integration not configured properly');
    }
  }

  // Document Management
  async createDocument(documentData: VaultDocument): Promise<VaultDocument> {
    try {
      this.logger.debug('Creating document in TekupVault', { title: documentData.title });
      
      const response = await this.integrationService.post<VaultDocument>(
        'tekup-vault',
        this.config,
        '/documents',
        documentData,
      );

      this.logger.log(`Document created in TekupVault: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to create document in TekupVault', error);
      throw new BadRequestException(`Failed to create document in TekupVault: ${error.message}`);
    }
  }

  async updateDocument(documentId: string, documentData: Partial<VaultDocument>): Promise<VaultDocument> {
    try {
      this.logger.debug('Updating document in TekupVault', { documentId });
      
      const response = await this.integrationService.put<VaultDocument>(
        'tekup-vault',
        this.config,
        `/documents/${documentId}`,
        documentData,
      );

      this.logger.log(`Document updated in TekupVault: ${documentId}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to update document in TekupVault', error);
      throw new BadRequestException(`Failed to update document in TekupVault: ${error.message}`);
    }
  }

  async getDocument(documentId: string): Promise<VaultDocument> {
    try {
      const response = await this.integrationService.get<VaultDocument>(
        'tekup-vault',
        this.config,
        `/documents/${documentId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get document from TekupVault', error);
      throw new BadRequestException(`Failed to get document from TekupVault: ${error.message}`);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.integrationService.delete(
        'tekup-vault',
        this.config,
        `/documents/${documentId}`,
      );

      this.logger.log(`Document deleted from TekupVault: ${documentId}`);
    } catch (error) {
      this.logger.error('Failed to delete document from TekupVault', error);
      throw new BadRequestException(`Failed to delete document from TekupVault: ${error.message}`);
    }
  }

  // Semantic Search
  async search(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      this.logger.debug('Performing semantic search in TekupVault', { query: searchQuery.query });
      
      const response = await this.integrationService.post<SearchResult[]>(
        'tekup-vault',
        this.config,
        '/search',
        searchQuery,
      );

      this.logger.debug(`Search returned ${response.length} results`);
      return response;
    } catch (error) {
      this.logger.error('Failed to perform search in TekupVault', error);
      throw new BadRequestException(`Failed to perform search in TekupVault: ${error.message}`);
    }
  }

  async semanticSearch(query: string, options: {
    type?: string;
    category?: string;
    limit?: number;
  } = {}): Promise<SearchResult[]> {
    const searchQuery: SearchQuery = {
      query,
      type: options.type,
      category: options.category,
      language: 'da', // Danish
      limit: options.limit || 10,
      includeContent: true,
    };

    return this.search(searchQuery);
  }

  // FAQ Management
  async getFAQs(category?: string): Promise<VaultDocument[]> {
    try {
      const endpoint = category 
        ? `/documents?type=faq&category=${encodeURIComponent(category)}`
        : '/documents?type=faq';
      
      const response = await this.integrationService.get<VaultDocument[]>(
        'tekup-vault',
        this.config,
        endpoint,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get FAQs from TekupVault', error);
      throw new BadRequestException(`Failed to get FAQs from TekupVault: ${error.message}`);
    }
  }

  async createFAQ(question: string, answer: string, category: string, tags: string[] = []): Promise<VaultDocument> {
    const faqData: VaultDocument = {
      title: question,
      content: answer,
      type: 'faq',
      category,
      tags,
      language: 'da',
    };

    return this.createDocument(faqData);
  }

  // Procedure Management
  async getProcedures(category?: string): Promise<VaultDocument[]> {
    try {
      const endpoint = category 
        ? `/documents?type=procedure&category=${encodeURIComponent(category)}`
        : '/documents?type=procedure';
      
      const response = await this.integrationService.get<VaultDocument[]>(
        'tekup-vault',
        this.config,
        endpoint,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get procedures from TekupVault', error);
      throw new BadRequestException(`Failed to get procedures from TekupVault: ${error.message}`);
    }
  }

  async createProcedure(
    title: string, 
    content: string, 
    category: string, 
    tags: string[] = []
  ): Promise<VaultDocument> {
    const procedureData: VaultDocument = {
      title,
      content,
      type: 'procedure',
      category,
      tags,
      language: 'da',
    };

    return this.createDocument(procedureData);
  }

  // Knowledge Base Management
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    try {
      const response = await this.integrationService.get<KnowledgeBase[]>(
        'tekup-vault',
        this.config,
        '/knowledge-bases',
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get knowledge bases from TekupVault', error);
      throw new BadRequestException(`Failed to get knowledge bases from TekupVault: ${error.message}`);
    }
  }

  async createKnowledgeBase(kbData: KnowledgeBase): Promise<KnowledgeBase> {
    try {
      this.logger.debug('Creating knowledge base in TekupVault', { name: kbData.name });
      
      const response = await this.integrationService.post<KnowledgeBase>(
        'tekup-vault',
        this.config,
        '/knowledge-bases',
        kbData,
      );

      this.logger.log(`Knowledge base created in TekupVault: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to create knowledge base in TekupVault', error);
      throw new BadRequestException(`Failed to create knowledge base in TekupVault: ${error.message}`);
    }
  }

  // Content Indexing
  async indexContent(content: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      this.logger.debug('Indexing content in TekupVault');
      
      await this.integrationService.post(
        'tekup-vault',
        this.config,
        '/index',
        { content, metadata },
      );

      this.logger.log('Content indexed in TekupVault');
    } catch (error) {
      this.logger.error('Failed to index content in TekupVault', error);
      throw new BadRequestException(`Failed to index content in TekupVault: ${error.message}`);
    }
  }

  async bulkIndexDocuments(documents: VaultDocument[]): Promise<void> {
    try {
      this.logger.debug(`Bulk indexing ${documents.length} documents in TekupVault`);
      
      await this.integrationService.post(
        'tekup-vault',
        this.config,
        '/index/bulk',
        { documents },
      );

      this.logger.log(`Bulk indexed ${documents.length} documents in TekupVault`);
    } catch (error) {
      this.logger.error('Failed to bulk index documents in TekupVault', error);
      throw new BadRequestException(`Failed to bulk index documents in TekupVault: ${error.message}`);
    }
  }

  // Analytics
  async getSearchAnalytics(dateFrom: string, dateTo: string): Promise<any> {
    try {
      const response = await this.integrationService.get(
        'tekup-vault',
        this.config,
        `/analytics/search?from=${dateFrom}&to=${dateTo}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get search analytics from TekupVault', error);
      throw new BadRequestException(`Failed to get search analytics from TekupVault: ${error.message}`);
    }
  }

  async getPopularDocuments(limit: number = 10): Promise<VaultDocument[]> {
    try {
      const response = await this.integrationService.get<VaultDocument[]>(
        'tekup-vault',
        this.config,
        `/analytics/popular?limit=${limit}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get popular documents from TekupVault', error);
      throw new BadRequestException(`Failed to get popular documents from TekupVault: ${error.message}`);
    }
  }

  // Utility methods for RendetaljeOS integration
  async searchCleaningProcedures(query: string): Promise<SearchResult[]> {
    return this.semanticSearch(query, {
      type: 'procedure',
      category: 'cleaning',
      limit: 5,
    });
  }

  async searchCustomerSupport(query: string): Promise<SearchResult[]> {
    return this.semanticSearch(query, {
      type: 'faq',
      category: 'customer-support',
      limit: 10,
    });
  }

  async getCleaningChecklists(): Promise<VaultDocument[]> {
    return this.getProcedures('cleaning-checklists');
  }

  async getSafetyProcedures(): Promise<VaultDocument[]> {
    return this.getProcedures('safety');
  }

  async getTrainingMaterials(): Promise<VaultDocument[]> {
    try {
      const response = await this.integrationService.get<VaultDocument[]>(
        'tekup-vault',
        this.config,
        '/documents?type=manual&category=training',
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get training materials from TekupVault', error);
      throw new BadRequestException(`Failed to get training materials from TekupVault: ${error.message}`);
    }
  }

  // Initialize default content for RendetaljeOS
  async initializeDefaultContent(): Promise<void> {
    try {
      this.logger.log('Initializing default content in TekupVault');

      // Create default FAQs
      const defaultFAQs = [
        {
          question: 'Hvad skal jeg gøre hvis kunden ikke er hjemme?',
          answer: 'Kontakt kunden via telefon eller SMS. Hvis der ikke er svar, følg proceduren for aflysning og ombestilling.',
          category: 'customer-support',
          tags: ['kunde', 'aflysning', 'procedure'],
        },
        {
          question: 'Hvordan håndterer jeg skader under rengøring?',
          answer: 'Stop arbejdet øjeblikkeligt, dokumenter skaden med fotos, og kontakt din supervisor. Udfyld skaderapport inden for 24 timer.',
          category: 'safety',
          tags: ['skade', 'sikkerhed', 'rapport'],
        },
        {
          question: 'Hvilke rengøringsmidler må jeg bruge?',
          answer: 'Brug kun godkendte, miljøvenlige rengøringsmidler fra vores leverandørliste. Tjek altid produktdatablade før brug.',
          category: 'cleaning',
          tags: ['rengøringsmidler', 'miljø', 'sikkerhed'],
        },
      ];

      for (const faq of defaultFAQs) {
        await this.createFAQ(faq.question, faq.answer, faq.category, faq.tags);
      }

      // Create default procedures
      const defaultProcedures = [
        {
          title: 'Standard Rengøringsprocedure',
          content: `
1. Ankomst og forberedelse
   - Tjek ind via app
   - Kontakt kunde hvis nødvendigt
   - Klargør udstyr og materialer

2. Rengøring
   - Følg tjekliste for servicetypen
   - Tag før-billeder
   - Udfør rengøring systematisk

3. Afslutning
   - Tag efter-billeder
   - Få kundens underskrift
   - Tjek ud via app
          `,
          category: 'cleaning',
          tags: ['procedure', 'standard', 'tjekliste'],
        },
      ];

      for (const procedure of defaultProcedures) {
        await this.createProcedure(procedure.title, procedure.content, procedure.category, procedure.tags);
      }

      this.logger.log('Default content initialized in TekupVault');
    } catch (error) {
      this.logger.error('Failed to initialize default content in TekupVault', error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.integrationService.get(
        'tekup-vault',
        this.config,
        '/health',
      );
      return true;
    } catch (error) {
      this.logger.error('TekupVault health check failed', error);
      return false;
    }
  }
}