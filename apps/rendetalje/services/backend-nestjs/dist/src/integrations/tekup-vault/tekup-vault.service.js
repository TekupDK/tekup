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
var TekupVaultService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TekupVaultService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const integration_service_1 = require("../integration.service");
let TekupVaultService = TekupVaultService_1 = class TekupVaultService {
    constructor(integrationService, configService) {
        this.integrationService = integrationService;
        this.configService = configService;
        this.logger = new common_1.Logger(TekupVaultService_1.name);
        this.config = {
            baseUrl: this.configService.get('integrations.tekupVault.url'),
            apiKey: this.configService.get('integrations.tekupVault.apiKey'),
            timeout: 30000,
            retries: 2,
        };
        if (!this.config.baseUrl || !this.config.apiKey) {
            this.logger.warn('TekupVault integration not configured properly');
        }
    }
    async createDocument(documentData) {
        try {
            this.logger.debug('Creating document in TekupVault', { title: documentData.title });
            const response = await this.integrationService.post('tekup-vault', this.config, '/documents', documentData);
            this.logger.log(`Document created in TekupVault: ${response.id}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to create document in TekupVault', error);
            throw new common_1.BadRequestException(`Failed to create document in TekupVault: ${error.message}`);
        }
    }
    async updateDocument(documentId, documentData) {
        try {
            this.logger.debug('Updating document in TekupVault', { documentId });
            const response = await this.integrationService.put('tekup-vault', this.config, `/documents/${documentId}`, documentData);
            this.logger.log(`Document updated in TekupVault: ${documentId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to update document in TekupVault', error);
            throw new common_1.BadRequestException(`Failed to update document in TekupVault: ${error.message}`);
        }
    }
    async getDocument(documentId) {
        try {
            const response = await this.integrationService.get('tekup-vault', this.config, `/documents/${documentId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get document from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to get document from TekupVault: ${error.message}`);
        }
    }
    async deleteDocument(documentId) {
        try {
            await this.integrationService.delete('tekup-vault', this.config, `/documents/${documentId}`);
            this.logger.log(`Document deleted from TekupVault: ${documentId}`);
        }
        catch (error) {
            this.logger.error('Failed to delete document from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to delete document from TekupVault: ${error.message}`);
        }
    }
    async search(searchQuery) {
        try {
            this.logger.debug('Performing semantic search in TekupVault', { query: searchQuery.query });
            const response = await this.integrationService.post('tekup-vault', this.config, '/search', searchQuery);
            this.logger.debug(`Search returned ${response.length} results`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to perform search in TekupVault', error);
            throw new common_1.BadRequestException(`Failed to perform search in TekupVault: ${error.message}`);
        }
    }
    async semanticSearch(query, options = {}) {
        const searchQuery = {
            query,
            type: options.type,
            category: options.category,
            language: 'da',
            limit: options.limit || 10,
            includeContent: true,
        };
        return this.search(searchQuery);
    }
    async getFAQs(category) {
        try {
            const endpoint = category
                ? `/documents?type=faq&category=${encodeURIComponent(category)}`
                : '/documents?type=faq';
            const response = await this.integrationService.get('tekup-vault', this.config, endpoint);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get FAQs from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to get FAQs from TekupVault: ${error.message}`);
        }
    }
    async createFAQ(question, answer, category, tags = []) {
        const faqData = {
            title: question,
            content: answer,
            type: 'faq',
            category,
            tags,
            language: 'da',
        };
        return this.createDocument(faqData);
    }
    async getProcedures(category) {
        try {
            const endpoint = category
                ? `/documents?type=procedure&category=${encodeURIComponent(category)}`
                : '/documents?type=procedure';
            const response = await this.integrationService.get('tekup-vault', this.config, endpoint);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get procedures from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to get procedures from TekupVault: ${error.message}`);
        }
    }
    async createProcedure(title, content, category, tags = []) {
        const procedureData = {
            title,
            content,
            type: 'procedure',
            category,
            tags,
            language: 'da',
        };
        return this.createDocument(procedureData);
    }
    async getKnowledgeBases() {
        try {
            const response = await this.integrationService.get('tekup-vault', this.config, '/knowledge-bases');
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get knowledge bases from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to get knowledge bases from TekupVault: ${error.message}`);
        }
    }
    async createKnowledgeBase(kbData) {
        try {
            this.logger.debug('Creating knowledge base in TekupVault', { name: kbData.name });
            const response = await this.integrationService.post('tekup-vault', this.config, '/knowledge-bases', kbData);
            this.logger.log(`Knowledge base created in TekupVault: ${response.id}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to create knowledge base in TekupVault', error);
            throw new common_1.BadRequestException(`Failed to create knowledge base in TekupVault: ${error.message}`);
        }
    }
    async indexContent(content, metadata = {}) {
        try {
            this.logger.debug('Indexing content in TekupVault');
            await this.integrationService.post('tekup-vault', this.config, '/index', { content, metadata });
            this.logger.log('Content indexed in TekupVault');
        }
        catch (error) {
            this.logger.error('Failed to index content in TekupVault', error);
            throw new common_1.BadRequestException(`Failed to index content in TekupVault: ${error.message}`);
        }
    }
    async bulkIndexDocuments(documents) {
        try {
            this.logger.debug(`Bulk indexing ${documents.length} documents in TekupVault`);
            await this.integrationService.post('tekup-vault', this.config, '/index/bulk', { documents });
            this.logger.log(`Bulk indexed ${documents.length} documents in TekupVault`);
        }
        catch (error) {
            this.logger.error('Failed to bulk index documents in TekupVault', error);
            throw new common_1.BadRequestException(`Failed to bulk index documents in TekupVault: ${error.message}`);
        }
    }
    async getSearchAnalytics(dateFrom, dateTo) {
        try {
            const response = await this.integrationService.get('tekup-vault', this.config, `/analytics/search?from=${dateFrom}&to=${dateTo}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get search analytics from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to get search analytics from TekupVault: ${error.message}`);
        }
    }
    async getPopularDocuments(limit = 10) {
        try {
            const response = await this.integrationService.get('tekup-vault', this.config, `/analytics/popular?limit=${limit}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get popular documents from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to get popular documents from TekupVault: ${error.message}`);
        }
    }
    async searchCleaningProcedures(query) {
        return this.semanticSearch(query, {
            type: 'procedure',
            category: 'cleaning',
            limit: 5,
        });
    }
    async searchCustomerSupport(query) {
        return this.semanticSearch(query, {
            type: 'faq',
            category: 'customer-support',
            limit: 10,
        });
    }
    async getCleaningChecklists() {
        return this.getProcedures('cleaning-checklists');
    }
    async getSafetyProcedures() {
        return this.getProcedures('safety');
    }
    async getTrainingMaterials() {
        try {
            const response = await this.integrationService.get('tekup-vault', this.config, '/documents?type=manual&category=training');
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get training materials from TekupVault', error);
            throw new common_1.BadRequestException(`Failed to get training materials from TekupVault: ${error.message}`);
        }
    }
    async initializeDefaultContent() {
        try {
            this.logger.log('Initializing default content in TekupVault');
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
        }
        catch (error) {
            this.logger.error('Failed to initialize default content in TekupVault', error);
        }
    }
    async healthCheck() {
        try {
            await this.integrationService.get('tekup-vault', this.config, '/health');
            return true;
        }
        catch (error) {
            this.logger.error('TekupVault health check failed', error);
            return false;
        }
    }
};
exports.TekupVaultService = TekupVaultService;
exports.TekupVaultService = TekupVaultService = TekupVaultService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        config_1.ConfigService])
], TekupVaultService);
//# sourceMappingURL=tekup-vault.service.js.map