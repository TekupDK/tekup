import { DocumentationAI } from '../documentation-ai.js';
import { AIConfig } from '../types.js';

// Mock the AI providers
jest.mock('openai');
jest.mock('@google/generative-ai');

describe('DocumentationAI', () => {
  let docAI: DocumentationAI;
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

    docAI = new DocumentationAI(mockConfig);
  });

  describe('analyzeCodeChanges', () => {
    it('should analyze code changes and return documentation updates', async () => {
      const mockDiff = `
diff --git a/src/api/users.ts b/src/api/users.ts
index 1234567..abcdefg 100644
--- a/src/api/users.ts
+++ b/src/api/users.ts
@@ -10,6 +10,12 @@ export class UsersController {
   async getUser(@Param('id') id: string) {
     return this.usersService.findById(id);
   }
+
+  @Post()
+  async createUser(@Body() userData: CreateUserDto) {
+    return this.usersService.create(userData);
+  }
 }
`;

      // Mock OpenAI response
      const mockOpenAI = require('openai');
      mockOpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify([{
                  type: 'api-change',
                  files: ['src/api/users.ts'],
                  suggestedChanges: ['Add documentation for createUser endpoint'],
                  priority: 'medium',
                  confidence: 0.9,
                  reasoning: 'New API endpoint added'
                }])
              }
            }]
          })
        }
      };

      const updates = await docAI.analyzeCodeChanges(mockDiff);

      expect(updates).toHaveLength(1);
      expect(updates[0].type).toBe('api-change');
      expect(updates[0].priority).toBe('medium');
    });

    it('should handle empty diff gracefully', async () => {
      const updates = await docAI.analyzeCodeChanges('');
      expect(updates).toEqual([]);
    });
  });

  describe('translateContent', () => {
    it('should translate content to Danish', async () => {
      const mockOpenAI = require('openai');
      mockOpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Bruger API\n\nDette API giver endpoints til at administrere brugere.'
              }
            }],
            usage: {
              total_tokens: 50
            }
          })
        }
      };

      const request = {
        content: 'User API\n\nThis API provides endpoints for managing users.',
        sourceLanguage: 'en' as const,
        targetLanguage: 'da' as const,
        context: 'API documentation',
        preserveMarkdown: true
      };

      const result = await docAI.translateContent(request);

      expect(result.translatedContent).toContain('Bruger API');
      expect(result.confidence).toBe(0.9);
      expect(result.metadata.tokensUsed).toBe(50);
    });
  });

  describe('createCodebaseSnapshot', () => {
    it('should create a codebase snapshot', async () => {
      // Mock file system operations
      jest.doMock('fs/promises', () => ({
        readdir: jest.fn().mockResolvedValue([]),
        readFile: jest.fn().mockResolvedValue(''),
        stat: jest.fn().mockResolvedValue({ mtime: new Date(), size: 100 })
      }));

      jest.doMock('glob', () => ({
        glob: jest.fn().mockResolvedValue([])
      }));

      const snapshot = await docAI.createCodebaseSnapshot('./test');

      expect(snapshot).toHaveProperty('files');
      expect(snapshot).toHaveProperty('dependencies');
      expect(snapshot).toHaveProperty('architecture');
      expect(snapshot).toHaveProperty('timestamp');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai');
      mockOpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      };

      const updates = await docAI.analyzeCodeChanges('test diff');
      expect(updates).toEqual([]);
    });

    it('should throw error for unconfigured provider', async () => {
      const configWithoutProviders: AIConfig = {
        defaultProvider: 'openai',
        translationProvider: 'openai'
      };

      const docAIWithoutConfig = new DocumentationAI(configWithoutProviders);

      await expect(docAIWithoutConfig.analyzeCodeChanges('test'))
        .rejects.toThrow('Provider openai not configured');
    });
  });
});