# @tekup/documentation-ai

AI-powered documentation generation and management system for the TekUp.org platform.

## Features

- **AI Documentation Generation**: Automatically generate comprehensive documentation from code
- **Code Analysis**: Analyze codebase structure and extract architectural information
- **Danish Translation**: Specialized translation service for Danish localization
- **Content Optimization**: Optimize documentation based on usage analytics
- **Change Detection**: Monitor code changes and suggest documentation updates

## Installation

```bash
pnpm add @tekup/documentation-ai
```

## Usage

### Basic Setup

```typescript
import { DocumentationAI, CodeAnalyzer, TranslationService } from '@tekup/documentation-ai';

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 4000
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro'
  },
  defaultProvider: 'openai',
  translationProvider: 'openai'
};

const docAI = new DocumentationAI(config);
const codeAnalyzer = new CodeAnalyzer();
const translator = new TranslationService(config);
```

### Generate Documentation from Code

```typescript
// Create codebase snapshot
const snapshot = await docAI.createCodebaseSnapshot('./');

// Generate documentation
const documentation = await docAI.generateDocumentation(snapshot);

console.log(`Generated ${documentation.length} documentation files`);
```

### Analyze Code Changes

```typescript
// Analyze git diff for documentation updates
const gitDiff = `
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

const updates = await docAI.analyzeCodeChanges(gitDiff);
console.log('Suggested documentation updates:', updates);
```

### Danish Translation

```typescript
// Translate documentation to Danish
const englishContent = `
# User Management API

This API provides endpoints for managing users in the system.

## Endpoints

- GET /users/:id - Get user by ID
- POST /users - Create new user
`;

const danishResult = await translator.translateToDanish(
  englishContent,
  'API documentation for user management'
);

console.log('Danish translation:', danishResult.translatedContent);
```

### Content Optimization

```typescript
// Optimize content based on analytics
const analytics = {
  documentId: 'api-users',
  views: 1500,
  timeSpent: 120,
  searchQueries: ['create user', 'user validation', 'error handling'],
  userFeedback: [
    { rating: 4, comment: 'Good examples needed', timestamp: new Date(), helpful: true }
  ],
  popularSections: ['Authentication', 'Error Responses']
};

const optimization = await docAI.optimizeContent(englishContent, analytics);
console.log('Optimization suggestions:', optimization.suggestions);
```

### Code Analysis

```typescript
// Analyze applications and packages
const applications = await codeAnalyzer.analyzeApplications('./apps');
const packages = await codeAnalyzer.analyzePackages('./packages');
const integrations = await codeAnalyzer.detectIntegrations(applications);

console.log(`Found ${applications.length} applications`);
console.log(`Found ${packages.length} packages`);
console.log(`Detected ${integrations.length} integrations`);
```

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Gemini Configuration  
GEMINI_API_KEY=your_gemini_api_key
```

### AI Provider Configuration

```typescript
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4', // or 'gpt-3.5-turbo'
    maxTokens: 4000
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro'
  },
  defaultProvider: 'openai', // or 'gemini'
  translationProvider: 'openai' // or 'gemini'
};
```

## API Reference

### DocumentationAI

Main class for AI-powered documentation operations.

#### Methods

- `analyzeCodeChanges(diff: string): Promise<DocumentationUpdate[]>`
- `generateDocumentation(codebase: CodebaseSnapshot): Promise<Documentation[]>`
- `translateContent(request: TranslationRequest): Promise<TranslationResult>`
- `optimizeContent(content: string, analytics: UsageAnalytics): Promise<ContentOptimization>`
- `createCodebaseSnapshot(rootPath: string): Promise<CodebaseSnapshot>`

### CodeAnalyzer

Utility for analyzing codebase structure and extracting information.

#### Methods

- `analyzeApplications(appsPath: string): Promise<ApplicationInfo[]>`
- `analyzePackages(packagesPath: string): Promise<PackageInfo[]>`
- `detectIntegrations(applications: ApplicationInfo[]): Promise<IntegrationInfo[]>`

### TranslationService

Specialized service for Danish/English translation of technical documentation.

#### Methods

- `translateToDanish(content: string, context?: string): Promise<TranslationResult>`
- `translateToEnglish(content: string, context?: string): Promise<TranslationResult>`
- `batchTranslate(documents: Array<{id: string, content: string}>, targetLanguage: 'en' | 'da'): Promise<Array<{id: string, result: TranslationResult}>>`
- `generateBilingualDocumentation(englishContent: string, context?: string): Promise<{english: string, danish: TranslationResult, combined: string}>`

## Types

### DocumentationUpdate

```typescript
interface DocumentationUpdate {
  type: 'api-change' | 'component-update' | 'architecture-change' | 'content-optimization';
  files: string[];
  suggestedChanges: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasoning: string;
}
```

### TranslationResult

```typescript
interface TranslationResult {
  translatedContent: string;
  confidence: number;
  warnings: string[];
  metadata: {
    model: string;
    timestamp: Date;
    tokensUsed: number;
  };
}
```

## Danish Localization

The translation service includes specialized support for Danish technical documentation:

- **Technical Terminology**: Maintains consistency for technical terms
- **Context Awareness**: Understands TekUp.org platform context
- **Markdown Preservation**: Preserves formatting and structure
- **Bilingual Output**: Can generate combined English/Danish documentation

### Danish Technical Terms

The service maintains a comprehensive mapping of technical terms:

- `authentication` → `autentificering`
- `authorization` → `autorisation`
- `configuration` → `konfiguration`
- `deployment` → `deployment`
- `monitoring` → `overvågning`

## Error Handling

All methods include comprehensive error handling:

```typescript
try {
  const result = await docAI.generateDocumentation(snapshot);
} catch (error) {
  console.error('Documentation generation failed:', error);
  // Handle error appropriately
}
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure Danish translations are accurate

## License

MIT License - see LICENSE file for details.