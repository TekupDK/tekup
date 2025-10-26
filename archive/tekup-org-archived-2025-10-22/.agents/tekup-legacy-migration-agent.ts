import type {
  AgentDefinition,
  AgentStepContext,
  ToolCall,
} from './types/agent-definition'

const definition: AgentDefinition = {
  id: 'tekup-legacy-migration-agent',
  displayName: 'Tekup Legacy Services Migration Agent',
  model: 'anthropic/claude-4-sonnet-20250522',
  toolNames: [
    'read_files',
    'write_file',
    'run_terminal_command',
    'list_files',
    'add_message',
    'end_turn'
  ],

  inputSchema: {
    prompt: {
      type: 'string',
      description: 'Which legacy service to migrate (e.g., "tekup-crm-api", "tekup-lead-platform", "flow-api")',
    },
  },

  spawnerPrompt:
    'Spawn when you need to migrate legacy Tekup services into the unified platform, preserving business logic and data structures',

  systemPrompt: `
You are an expert in legacy system migration and code transformation specializing in enterprise SaaS platforms.
Your job is to migrate legacy Tekup services into the unified platform architecture.

MIGRATION CONTEXT:
- **Source**: Individual legacy services (tekup-crm-api, tekup-lead-platform, flow-api, etc.)
- **Target**: Unified platform at apps/tekup-unified-platform/src/modules/
- **Architecture**: Multi-tenant NestJS with Prisma ORM
- **Patterns**: Follow existing CRM module structure and patterns
- **Data**: Preserve all business logic and data relationships

LEGACY SERVICES TO MIGRATE:
1. **tekup-crm-api** → unified-platform/modules/crm/ (COMPLETED)
2. **tekup-lead-platform** → unified-platform/modules/leads/
3. **flow-api** → unified-platform/modules/flow/
4. **voicedk-api** → unified-platform/modules/voice/
5. **jarvis-api** → unified-platform/modules/jarvis/
6. **secure-platform** → unified-platform/modules/security/

MIGRATION STRATEGY:
1. **Analysis Phase**: Understand legacy service structure and business logic
2. **Pattern Mapping**: Map legacy patterns to unified platform architecture  
3. **Data Migration**: Transform database schemas to unified Prisma models
4. **Business Logic**: Preserve and adapt core functionality
5. **API Compatibility**: Maintain backward compatibility where needed
6. **Testing**: Ensure functionality parity with legacy services
  `,

  instructionsPrompt: `
Your task is to systematically migrate a legacy service into the unified platform.

MIGRATION PROCESS:
1. **Legacy Service Analysis**:
   - Scan the legacy service directory structure
   - Identify controllers, services, models, and business logic
   - Document API endpoints and data models
   - Analyze database schemas and relationships

2. **Architecture Mapping**:
   - Map legacy controllers to unified platform controller patterns
   - Transform legacy services to follow NestJS patterns
   - Adapt database models to Prisma schema
   - Ensure multi-tenant compatibility

3. **Code Transformation**:
   - Create new module structure in unified platform
   - Transform controllers following CRM module patterns
   - Migrate business logic to service classes
   - Update database models for Prisma ORM

4. **Integration**:
   - Update main app module to include new module
   - Generate database migrations
   - Update environment variables
   - Add proper error handling and logging

5. **Validation**:
   - Compare API endpoints (legacy vs unified)
   - Validate business logic preservation
   - Test database operations
   - Ensure tenant isolation works

CRITICAL REQUIREMENTS:
- Preserve ALL business logic and functionality
- Maintain API compatibility where possible
- Follow existing unified platform patterns
- Implement proper tenant isolation
- Include comprehensive error handling
- Add proper TypeScript types and interfaces
  `,

  handleSteps: function* ({ agentState, prompt, params }: AgentStepContext) {
    // Step 1: Identify and analyze the legacy service
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: `I'll start by analyzing the legacy service structure to understand what needs to be migrated to the unified platform.`,
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'list_files',
      input: {
        path: 'apps',
        recursive: false,
      },
    } satisfies ToolCall

    // Step 2: Deep dive into legacy service structure
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Now I'll examine the specific legacy service structure to understand the business logic and patterns that need to be preserved.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield 'STEP'

    // Step 3: Analyze unified platform patterns
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "I'll study the existing unified platform structure to understand the target patterns and architecture.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'read_files',
      input: {
        paths: [
          'apps/tekup-unified-platform/src/modules/crm/crm.controller.ts',
          'apps/tekup-unified-platform/src/modules/crm/crm.service.ts',
          'apps/tekup-unified-platform/src/modules/crm/crm.module.ts',
          'apps/tekup-unified-platform/prisma/schema.prisma',
        ],
      },
    } satisfies ToolCall

    // Step 4: Create migration plan
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Based on my analysis, I'll create a detailed migration plan and start implementing the new module structure.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield 'STEP'

    // Step 5: Execute migration
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Now I'll execute the migration, creating the new module structure and transforming the legacy code to follow unified platform patterns.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield 'STEP_ALL'

    // Step 6: Update database and run migrations
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Finally, I'll update the database schema and run the necessary migrations to support the migrated functionality.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'cd apps/tekup-unified-platform && npx prisma generate',
        process_type: 'SYNC',
        timeout_seconds: 60,
      },
    } satisfies ToolCall

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'cd apps/tekup-unified-platform && npx prisma db push',
        process_type: 'SYNC',
        timeout_seconds: 60,
      },
    } satisfies ToolCall

    yield 'STEP_ALL'
  },
}

export default definition
