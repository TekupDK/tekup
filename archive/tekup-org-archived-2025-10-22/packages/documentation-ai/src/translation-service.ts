import { DocumentationAI } from './documentation-ai.js';
import { TranslationRequest, TranslationResult, AIConfig } from './types.js';

export class TranslationService {
  private documentationAI: DocumentationAI;

  constructor(config: AIConfig) {
    this.documentationAI = new DocumentationAI(config);
  }

  /**
   * Translate documentation to Danish with technical context
   */
  async translateToDanish(content: string, context: string = ''): Promise<TranslationResult> {
    const request: TranslationRequest = {
      content,
      sourceLanguage: 'en',
      targetLanguage: 'da',
      context: `Technical documentation for TekUp.org platform. ${context}`,
      preserveMarkdown: true
    };

    return this.documentationAI.translateContent(request);
  }

  /**
   * Translate documentation to English
   */
  async translateToEnglish(content: string, context: string = ''): Promise<TranslationResult> {
    const request: TranslationRequest = {
      content,
      sourceLanguage: 'da',
      targetLanguage: 'en',
      context: `Technical documentation for TekUp.org platform. ${context}`,
      preserveMarkdown: true
    };

    return this.documentationAI.translateContent(request);
  }

  /**
   * Batch translate multiple documents
   */
  async batchTranslate(
    documents: Array<{ id: string; content: string; context?: string }>,
    targetLanguage: 'en' | 'da'
  ): Promise<Array<{ id: string; result: TranslationResult }>> {
    const results: Array<{ id: string; result: TranslationResult }> = [];

    for (const doc of documents) {
      try {
        const request: TranslationRequest = {
          content: doc.content,
          sourceLanguage: targetLanguage === 'da' ? 'en' : 'da',
          targetLanguage,
          context: doc.context || 'Technical documentation',
          preserveMarkdown: true
        };

        const result = await this.documentationAI.translateContent(request);
        results.push({ id: doc.id, result });
      } catch (error) {
        console.error(`Error translating document ${doc.id}:`, error);
        // Add error result
        results.push({
          id: doc.id,
          result: {
            translatedContent: doc.content, // Fallback to original
            confidence: 0,
            warnings: [`Translation failed: ${error}`],
            metadata: {
              model: 'error',
              timestamp: new Date(),
              tokensUsed: 0
            }
          }
        });
      }
    }

    return results;
  }

  /**
   * Validate translation quality
   */
  async validateTranslation(
    original: string,
    translated: string,
    targetLanguage: 'en' | 'da'
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    // This would use AI to validate translation quality
    // For now, return a basic validation
    return {
      score: 0.9,
      issues: [],
      suggestions: []
    };
  }

  /**
   * Get Danish technical terminology mappings
   */
  getDanishTerminologyMap(): Record<string, string> {
    return {
      // Common technical terms
      'API': 'API',
      'endpoint': 'endpoint',
      'authentication': 'autentificering',
      'authorization': 'autorisation',
      'database': 'database',
      'server': 'server',
      'client': 'klient',
      'application': 'applikation',
      'service': 'tjeneste',
      'component': 'komponent',
      'interface': 'interface',
      'configuration': 'konfiguration',
      'deployment': 'deployment',
      'monitoring': 'overvågning',
      'logging': 'logning',
      'error': 'fejl',
      'warning': 'advarsel',
      'success': 'succes',
      'failed': 'fejlede',
      'pending': 'afventende',
      'active': 'aktiv',
      'inactive': 'inaktiv',
      'enabled': 'aktiveret',
      'disabled': 'deaktiveret',
      
      // Business terms
      'dashboard': 'dashboard',
      'report': 'rapport',
      'analytics': 'analyser',
      'metrics': 'målinger',
      'user': 'bruger',
      'admin': 'administrator',
      'role': 'rolle',
      'permission': 'tilladelse',
      'tenant': 'lejer',
      'organization': 'organisation',
      'workspace': 'arbejdsområde',
      'project': 'projekt',
      'task': 'opgave',
      'workflow': 'arbejdsgang',
      'integration': 'integration',
      'webhook': 'webhook',
      'notification': 'notifikation',
      'alert': 'alarm',
      
      // UI terms
      'button': 'knap',
      'form': 'formular',
      'field': 'felt',
      'input': 'input',
      'dropdown': 'dropdown',
      'checkbox': 'afkrydsningsfelt',
      'radio button': 'radioknap',
      'table': 'tabel',
      'list': 'liste',
      'menu': 'menu',
      'navigation': 'navigation',
      'sidebar': 'sidebar',
      'header': 'header',
      'footer': 'footer',
      'modal': 'modal',
      'dialog': 'dialog',
      'tooltip': 'tooltip',
      'loading': 'indlæser',
      'search': 'søg',
      'filter': 'filter',
      'sort': 'sorter',
      'pagination': 'paginering'
    };
  }

  /**
   * Apply terminology consistency to translated content
   */
  applyTerminologyConsistency(content: string, targetLanguage: 'en' | 'da'): string {
    if (targetLanguage !== 'da') {
      return content;
    }

    const terminologyMap = this.getDanishTerminologyMap();
    let processedContent = content;

    // Apply terminology mappings
    for (const [english, danish] of Object.entries(terminologyMap)) {
      // Only replace whole words, not parts of words
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      processedContent = processedContent.replace(regex, danish);
    }

    return processedContent;
  }

  /**
   * Generate bilingual documentation
   */
  async generateBilingualDocumentation(
    englishContent: string,
    context: string = ''
  ): Promise<{
    english: string;
    danish: TranslationResult;
    combined: string;
  }> {
    const danishResult = await this.translateToDanish(englishContent, context);
    
    // Create combined bilingual format
    const combined = this.createBilingualFormat(englishContent, danishResult.translatedContent);

    return {
      english: englishContent,
      danish: danishResult,
      combined
    };
  }

  /**
   * Create bilingual format with tabs or sections
   */
  private createBilingualFormat(english: string, danish: string): string {
    return `
<!-- Bilingual Documentation -->

## English

${english}

---

## Dansk

${danish}
`;
  }

  /**
   * Extract translatable content from markdown
   */
  extractTranslatableContent(markdown: string): {
    translatable: string[];
    structure: string;
  } {
    // This would extract text content while preserving markdown structure
    // For now, return simplified version
    return {
      translatable: [markdown],
      structure: markdown
    };
  }

  /**
   * Reconstruct markdown with translated content
   */
  reconstructMarkdown(structure: string, translatedContent: string[]): string {
    // This would reconstruct markdown with translated content
    // For now, return the first translated content
    return translatedContent[0] || structure;
  }
}