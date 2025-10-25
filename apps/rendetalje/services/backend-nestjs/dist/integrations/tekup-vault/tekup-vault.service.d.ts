import { ConfigService } from '@nestjs/config';
import { IntegrationService } from '../integration.service';
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
export declare class TekupVaultService {
    private readonly integrationService;
    private readonly configService;
    private readonly logger;
    private readonly config;
    constructor(integrationService: IntegrationService, configService: ConfigService);
    createDocument(documentData: VaultDocument): Promise<VaultDocument>;
    updateDocument(documentId: string, documentData: Partial<VaultDocument>): Promise<VaultDocument>;
    getDocument(documentId: string): Promise<VaultDocument>;
    deleteDocument(documentId: string): Promise<void>;
    search(searchQuery: SearchQuery): Promise<SearchResult[]>;
    semanticSearch(query: string, options?: {
        type?: string;
        category?: string;
        limit?: number;
    }): Promise<SearchResult[]>;
    getFAQs(category?: string): Promise<VaultDocument[]>;
    createFAQ(question: string, answer: string, category: string, tags?: string[]): Promise<VaultDocument>;
    getProcedures(category?: string): Promise<VaultDocument[]>;
    createProcedure(title: string, content: string, category: string, tags?: string[]): Promise<VaultDocument>;
    getKnowledgeBases(): Promise<KnowledgeBase[]>;
    createKnowledgeBase(kbData: KnowledgeBase): Promise<KnowledgeBase>;
    indexContent(content: string, metadata?: Record<string, any>): Promise<void>;
    bulkIndexDocuments(documents: VaultDocument[]): Promise<void>;
    getSearchAnalytics(dateFrom: string, dateTo: string): Promise<any>;
    getPopularDocuments(limit?: number): Promise<VaultDocument[]>;
    searchCleaningProcedures(query: string): Promise<SearchResult[]>;
    searchCustomerSupport(query: string): Promise<SearchResult[]>;
    getCleaningChecklists(): Promise<VaultDocument[]>;
    getSafetyProcedures(): Promise<VaultDocument[]>;
    getTrainingMaterials(): Promise<VaultDocument[]>;
    initializeDefaultContent(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
