import { TranslationService } from '../translation-service.js';
import { AIConfig } from '../types.js';

// Mock the DocumentationAI class
jest.mock('../documentation-ai.js');

describe('TranslationService', () => {
  let translationService: TranslationService;
  let mockConfig: AIConfig;

  beforeEach(() => {
    mockConfig = {
      openai: {
        apiKey: 'test-key',
        model: 'gpt-4',
        maxTokens: 4000
      },
      defaultProvider: 'openai',
      translationProvider: 'openai'
    };

    translationService = new TranslationService(mockConfig);
  });

  describe('translateToDanish', () => {
    it('should translate English content to Danish', async () => {
      const mockDocumentationAI = require('../documentation-ai.js').DocumentationAI;
      mockDocumentationAI.prototype.translateContent = jest.fn().mockResolvedValue({
        translatedContent: 'Bruger API\n\nDette API giver endpoints til at administrere brugere.',
        confidence: 0.9,
        warnings: [],
        metadata: {
          model: 'gpt-4',
          timestamp: new Date(),
          tokensUsed: 50
        }
      });

      const result = await translationService.translateToDanish(
        'User API\n\nThis API provides endpoints for managing users.',
        'API documentation'
      );

      expect(result.translatedContent).toContain('Bruger API');
      expect(result.confidence).toBe(0.9);
      expect(mockDocumentationAI.prototype.translateContent).toHaveBeenCalledWith({
        content: 'User API\n\nThis API provides endpoints for managing users.',
        sourceLanguage: 'en',
        targetLanguage: 'da',
        context: 'Technical documentation for TekUp.org platform. API documentation',
        preserveMarkdown: true
      });
    });
  });

  describe('translateToEnglish', () => {
    it('should translate Danish content to English', async () => {
      const mockDocumentationAI = require('../documentation-ai.js').DocumentationAI;
      mockDocumentationAI.prototype.translateContent = jest.fn().mockResolvedValue({
        translatedContent: 'User API\n\nThis API provides endpoints for managing users.',
        confidence: 0.9,
        warnings: [],
        metadata: {
          model: 'gpt-4',
          timestamp: new Date(),
          tokensUsed: 50
        }
      });

      const result = await translationService.translateToEnglish(
        'Bruger API\n\nDette API giver endpoints til at administrere brugere.',
        'API documentation'
      );

      expect(result.translatedContent).toContain('User API');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('batchTranslate', () => {
    it('should translate multiple documents', async () => {
      const mockDocumentationAI = require('../documentation-ai.js').DocumentationAI;
      mockDocumentationAI.prototype.translateContent = jest.fn()
        .mockResolvedValueOnce({
          translatedContent: 'Første dokument',
          confidence: 0.9,
          warnings: [],
          metadata: { model: 'gpt-4', timestamp: new Date(), tokensUsed: 30 }
        })
        .mockResolvedValueOnce({
          translatedContent: 'Andet dokument',
          confidence: 0.8,
          warnings: [],
          metadata: { model: 'gpt-4', timestamp: new Date(), tokensUsed: 25 }
        });

      const documents = [
        { id: 'doc1', content: 'First document' },
        { id: 'doc2', content: 'Second document' }
      ];

      const results = await translationService.batchTranslate(documents, 'da');

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('doc1');
      expect(results[0].result.translatedContent).toBe('Første dokument');
      expect(results[1].id).toBe('doc2');
      expect(results[1].result.translatedContent).toBe('Andet dokument');
    });

    it('should handle translation errors gracefully', async () => {
      const mockDocumentationAI = require('../documentation-ai.js').DocumentationAI;
      mockDocumentationAI.prototype.translateContent = jest.fn()
        .mockResolvedValueOnce({
          translatedContent: 'Første dokument',
          confidence: 0.9,
          warnings: [],
          metadata: { model: 'gpt-4', timestamp: new Date(), tokensUsed: 30 }
        })
        .mockRejectedValueOnce(new Error('Translation failed'));

      const documents = [
        { id: 'doc1', content: 'First document' },
        { id: 'doc2', content: 'Second document' }
      ];

      const results = await translationService.batchTranslate(documents, 'da');

      expect(results).toHaveLength(2);
      expect(results[0].result.translatedContent).toBe('Første dokument');
      expect(results[1].result.translatedContent).toBe('Second document'); // Fallback to original
      expect(results[1].result.confidence).toBe(0);
      expect(results[1].result.warnings[0]).toContain('Translation failed');
    });
  });

  describe('getDanishTerminologyMap', () => {
    it('should return Danish terminology mappings', () => {
      const terminologyMap = translationService.getDanishTerminologyMap();

      expect(terminologyMap['authentication']).toBe('autentificering');
      expect(terminologyMap['authorization']).toBe('autorisation');
      expect(terminologyMap['configuration']).toBe('konfiguration');
      expect(terminologyMap['user']).toBe('bruger');
      expect(terminologyMap['API']).toBe('API'); // Should remain the same
    });
  });

  describe('applyTerminologyConsistency', () => {
    it('should apply Danish terminology to content', () => {
      const content = 'The user authentication system requires proper configuration.';
      const result = translationService.applyTerminologyConsistency(content, 'da');

      expect(result).toContain('bruger');
      expect(result).toContain('autentificering');
      expect(result).toContain('konfiguration');
    });

    it('should not modify English content', () => {
      const content = 'The user authentication system requires proper configuration.';
      const result = translationService.applyTerminologyConsistency(content, 'en');

      expect(result).toBe(content);
    });

    it('should only replace whole words', () => {
      const content = 'The configuration file contains authentication settings.';
      const result = translationService.applyTerminologyConsistency(content, 'da');

      // Should replace 'configuration' and 'authentication' but not parts of words
      expect(result).toContain('konfiguration');
      expect(result).toContain('autentificering');
    });
  });

  describe('generateBilingualDocumentation', () => {
    it('should generate bilingual documentation', async () => {
      const mockDocumentationAI = require('../documentation-ai.js').DocumentationAI;
      mockDocumentationAI.prototype.translateContent = jest.fn().mockResolvedValue({
        translatedContent: 'Bruger API\n\nDette API giver endpoints.',
        confidence: 0.9,
        warnings: [],
        metadata: { model: 'gpt-4', timestamp: new Date(), tokensUsed: 50 }
      });

      const englishContent = 'User API\n\nThis API provides endpoints.';
      const result = await translationService.generateBilingualDocumentation(englishContent);

      expect(result.english).toBe(englishContent);
      expect(result.danish.translatedContent).toContain('Bruger API');
      expect(result.combined).toContain('## English');
      expect(result.combined).toContain('## Dansk');
      expect(result.combined).toContain(englishContent);
      expect(result.combined).toContain('Bruger API');
    });
  });
});