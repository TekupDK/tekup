import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import MarkdownIt from 'markdown-it';
import * as yaml from 'js-yaml';
import {
  AIConfig,
  CodebaseSnapshot,
  Documentation,
  DocumentationUpdate,
  TranslationRequest,
  TranslationResult,
  UsageAnalytics,
  ContentOptimization,
  CodeFile,
  ArchitectureInfo
} from './types.js';

export class DocumentationAI {
  private openai?: OpenAI;
  private gemini?: GoogleGenerativeAI;
  private config: AIConfig;
  private markdown: MarkdownIt;

  constructor(config: AIConfig) {
    this.config = config;
    this.markdown = new MarkdownIt();

    if (config.openai) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
    }

    if (config.gemini) {
      this.gemini = new GoogleGenerativeAI(config.gemini.apiKey);
    }
  }

  /**
   * Analyze code changes and suggest documentation updates
   */
  async analyzeCodeChanges(diff: string): Promise<DocumentationUpdate[]> {
    const provider = this.config.defaultProvider;
    
    const prompt = `
Analyze the following code changes and suggest documentation updates:

${diff}

Please identify:
1. API changes that need documentation updates
2. New components that need documentation
3. Architecture changes that affect system design
4. Breaking changes that need migration guides

Return a JSON array of DocumentationUpdate objects with type, files, suggestedChanges, priority, confidence, and reasoning.
`;

    try {
      let response: string;
      
      if (provider === 'openai' && this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: this.config.openai!.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.openai!.maxTokens,
          temperature: 0.3,
        });
        response = completion.choices[0]?.message?.content || '';
      } else if (provider === 'gemini' && this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: this.config.gemini!.model });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } else {
        throw new Error(`Provider ${provider} not configured`);
      }

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Error analyzing code changes:', error);
      return [];
    }
  }

  /**
   * Generate documentation from codebase snapshot
   */
  async generateDocumentation(codebase: CodebaseSnapshot): Promise<Documentation[]> {
    const documentation: Documentation[] = [];
    
    // Generate API documentation
    const apiDocs = await this.generateAPIDocumentation(codebase);
    documentation.push(...apiDocs);
    
    // Generate component documentation
    const componentDocs = await this.generateComponentDocumentation(codebase);
    documentation.push(...componentDocs);
    
    // Generate architecture documentation
    const archDocs = await this.generateArchitectureDocumentation(codebase);
    documentation.push(...archDocs);
    
    return documentation;
  }

  /**
   * Generate API documentation from codebase
   */
  private async generateAPIDocumentation(codebase: CodebaseSnapshot): Promise<Documentation[]> {
    const apiFiles = codebase.files.filter(file => 
      file.path.includes('controller') || 
      file.path.includes('route') || 
      file.path.includes('api')
    );

    const docs: Documentation[] = [];

    for (const file of apiFiles) {
      const prompt = `
Generate comprehensive API documentation for the following code:

File: ${file.path}
Content:
${file.content}

Please generate:
1. API endpoint descriptions
2. Request/response schemas
3. Authentication requirements
4. Error handling
5. Usage examples

Format as markdown documentation.
`;

      try {
        const content = await this.generateContent(prompt);
        
        docs.push({
          id: `api-${path.basename(file.path, path.extname(file.path))}`,
          title: `API Documentation: ${path.basename(file.path)}`,
          content,
          type: 'api',
          language: 'en',
          version: '1.0.0',
          lastUpdated: new Date(),
          metadata: {
            author: 'AI Documentation Generator',
            tags: ['api', 'endpoints', 'reference'],
            relatedDocs: [],
            targetAudience: 'developer',
            complexity: 'intermediate'
          }
        });
      } catch (error) {
        console.error(`Error generating API docs for ${file.path}:`, error);
      }
    }

    return docs;
  }

  /**
   * Generate component documentation
   */
  private async generateComponentDocumentation(codebase: CodebaseSnapshot): Promise<Documentation[]> {
    const componentFiles = codebase.files.filter(file => 
      file.path.includes('component') && 
      (file.type === 'typescript' || file.type === 'javascript')
    );

    const docs: Documentation[] = [];

    for (const file of componentFiles) {
      const prompt = `
Generate component documentation for the following React/UI component:

File: ${file.path}
Content:
${file.content}

Please generate:
1. Component overview and purpose
2. Props interface and descriptions
3. Usage examples
4. Styling information
5. Accessibility considerations

Format as markdown documentation.
`;

      try {
        const content = await this.generateContent(prompt);
        
        docs.push({
          id: `component-${path.basename(file.path, path.extname(file.path))}`,
          title: `Component: ${path.basename(file.path)}`,
          content,
          type: 'component',
          language: 'en',
          version: '1.0.0',
          lastUpdated: new Date(),
          metadata: {
            author: 'AI Documentation Generator',
            tags: ['component', 'ui', 'react'],
            relatedDocs: [],
            targetAudience: 'developer',
            complexity: 'beginner'
          }
        });
      } catch (error) {
        console.error(`Error generating component docs for ${file.path}:`, error);
      }
    }

    return docs;
  }

  /**
   * Generate architecture documentation
   */
  private async generateArchitectureDocumentation(codebase: CodebaseSnapshot): Promise<Documentation[]> {
    const prompt = `
Generate comprehensive architecture documentation based on the following codebase structure:

Applications: ${JSON.stringify(codebase.architecture.applications, null, 2)}
Packages: ${JSON.stringify(codebase.architecture.packages, null, 2)}
Integrations: ${JSON.stringify(codebase.architecture.integrations, null, 2)}

Please generate:
1. System overview and architecture
2. Application relationships and data flow
3. Package dependencies and structure
4. Integration patterns and communication
5. Deployment architecture
6. Security considerations

Format as comprehensive markdown documentation with Mermaid diagrams where appropriate.
`;

    try {
      const content = await this.generateContent(prompt);
      
      return [{
        id: 'system-architecture',
        title: 'System Architecture Overview',
        content,
        type: 'architecture',
        language: 'en',
        version: '1.0.0',
        lastUpdated: new Date(),
        metadata: {
          author: 'AI Documentation Generator',
          tags: ['architecture', 'system', 'overview'],
          relatedDocs: [],
          targetAudience: 'developer',
          complexity: 'advanced'
        }
      }];
    } catch (error) {
      console.error('Error generating architecture docs:', error);
      return [];
    }
  }

  /**
   * Translate content to target language
   */
  async translateContent(request: TranslationRequest): Promise<TranslationResult> {
    const provider = this.config.translationProvider;
    
    const prompt = `
Translate the following ${request.sourceLanguage} content to ${request.targetLanguage}:

Context: ${request.context}
${request.preserveMarkdown ? 'Preserve all markdown formatting.' : ''}

Content:
${request.content}

Please provide accurate translation while maintaining technical terminology and context.
${request.targetLanguage === 'da' ? 'Use Danish technical terms where appropriate, but keep English terms for widely-used technical concepts.' : ''}
`;

    try {
      let translatedContent: string;
      let tokensUsed = 0;
      
      if (provider === 'openai' && this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: this.config.openai!.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.openai!.maxTokens,
          temperature: 0.3,
        });
        translatedContent = completion.choices[0]?.message?.content || '';
        tokensUsed = completion.usage?.total_tokens || 0;
      } else if (provider === 'gemini' && this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: this.config.gemini!.model });
        const result = await model.generateContent(prompt);
        translatedContent = result.response.text();
        // Gemini doesn't provide token usage in the same way
      } else {
        throw new Error(`Translation provider ${provider} not configured`);
      }

      return {
        translatedContent,
        confidence: 0.9, // AI confidence estimation
        warnings: [],
        metadata: {
          model: provider === 'openai' ? this.config.openai!.model : this.config.gemini!.model,
          timestamp: new Date(),
          tokensUsed
        }
      };
    } catch (error) {
      console.error('Error translating content:', error);
      throw error;
    }
  }

  /**
   * Optimize content based on usage analytics
   */
  async optimizeContent(content: string, analytics: UsageAnalytics): Promise<ContentOptimization> {
    const prompt = `
Analyze and optimize the following documentation content based on usage analytics:

Content:
${content}

Analytics:
- Views: ${analytics.views}
- Average time spent: ${analytics.timeSpent}s
- Popular sections: ${analytics.popularSections.join(', ')}
- User feedback: ${analytics.userFeedback.map(f => `${f.rating}/5 - ${f.comment}`).join('; ')}
- Common search queries: ${analytics.searchQueries.join(', ')}

Please suggest improvements for:
1. Content structure and organization
2. Clarity and readability
3. Missing information based on search queries
4. Examples and code snippets
5. Navigation and findability

Provide specific, actionable suggestions with impact and effort estimates.
`;

    try {
      const response = await this.generateContent(prompt);
      
      // Parse suggestions from AI response
      const suggestions = this.parseSuggestions(response);
      
      return {
        documentId: analytics.documentId,
        suggestions,
        analytics,
        priority: this.calculatePriority(analytics, suggestions)
      };
    } catch (error) {
      console.error('Error optimizing content:', error);
      throw error;
    }
  }

  /**
   * Create codebase snapshot for analysis
   */
  async createCodebaseSnapshot(rootPath: string): Promise<CodebaseSnapshot> {
    const files = await this.scanCodebase(rootPath);
    const architecture = await this.analyzeArchitecture(rootPath);
    
    return {
      files,
      dependencies: await this.extractDependencies(rootPath),
      architecture,
      timestamp: new Date()
    };
  }

  /**
   * Scan codebase for relevant files
   */
  private async scanCodebase(rootPath: string): Promise<CodeFile[]> {
    const patterns = [
      '**/*.ts',
      '**/*.js',
      '**/*.tsx',
      '**/*.jsx',
      '**/*.md',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml'
    ];

    const excludePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**'
    ];

    const files: CodeFile[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: rootPath,
        ignore: excludePatterns,
        absolute: true
      });

      for (const filePath of matches) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const stats = await fs.stat(filePath);
          
          files.push({
            path: path.relative(rootPath, filePath),
            content,
            type: this.getFileType(filePath),
            lastModified: stats.mtime,
            size: stats.size
          });
        } catch (error) {
          console.warn(`Could not read file ${filePath}:`, error);
        }
      }
    }

    return files;
  }

  /**
   * Analyze codebase architecture
   */
  private async analyzeArchitecture(rootPath: string): Promise<ArchitectureInfo> {
    // This is a simplified implementation - in practice, this would be more sophisticated
    const appsPath = path.join(rootPath, 'apps');
    const packagesPath = path.join(rootPath, 'packages');
    
    const applications = await this.scanApplications(appsPath);
    const packages = await this.scanPackages(packagesPath);
    const integrations = await this.detectIntegrations(applications);
    
    return {
      applications,
      packages,
      integrations
    };
  }

  /**
   * Generate content using configured AI provider
   */
  private async generateContent(prompt: string): Promise<string> {
    const provider = this.config.defaultProvider;
    
    if (provider === 'openai' && this.openai) {
      const completion = await this.openai.chat.completions.create({
        model: this.config.openai!.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.openai!.maxTokens,
        temperature: 0.3,
      });
      return completion.choices[0]?.message?.content || '';
    } else if (provider === 'gemini' && this.gemini) {
      const model = this.gemini.getGenerativeModel({ model: this.config.gemini!.model });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } else {
      throw new Error(`Provider ${provider} not configured`);
    }
  }

  // Helper methods
  private getFileType(filePath: string): CodeFile['type'] {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.md':
        return 'markdown';
      case '.json':
        return 'json';
      case '.yaml':
      case '.yml':
        return 'yaml';
      default:
        return 'other';
    }
  }

  private async scanApplications(appsPath: string): Promise<any[]> {
    // Implementation would scan apps directory and extract application info
    return [];
  }

  private async scanPackages(packagesPath: string): Promise<any[]> {
    // Implementation would scan packages directory and extract package info
    return [];
  }

  private async detectIntegrations(applications: any[]): Promise<any[]> {
    // Implementation would analyze applications to detect integrations
    return [];
  }

  private async extractDependencies(rootPath: string): Promise<string[]> {
    // Implementation would extract dependencies from package.json files
    return [];
  }

  private parseSuggestions(response: string): any[] {
    // Implementation would parse AI response to extract structured suggestions
    return [];
  }

  private calculatePriority(analytics: UsageAnalytics, suggestions: any[]): 'low' | 'medium' | 'high' {
    // Implementation would calculate priority based on analytics and suggestions
    return 'medium';
  }
}