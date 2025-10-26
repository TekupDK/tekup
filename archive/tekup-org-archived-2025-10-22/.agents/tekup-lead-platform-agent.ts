import type {
  AgentDefinition,
  AgentStepContext,
  ToolCall,
} from './types/agent-definition'

const definition: AgentDefinition = {
  id: 'tekup-lead-platform-agent',
  displayName: 'Tekup Lead Platform Module Implementation Agent',
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
      description: 'Specific requirements for the Lead Platform Module implementation',
    },
  },

  spawnerPrompt:
    'Spawn when you need to implement the Lead Platform Module for the Tekup Unified Platform following the same patterns as the CRM module',

  systemPrompt: `
You are an expert NestJS and TypeScript developer specializing in enterprise SaaS platforms.
Your job is to implement the Lead Platform Module for the Tekup Unified Platform.

CRITICAL REQUIREMENTS:
1. Follow the EXACT same patterns as the CRM module in apps/tekup-unified-platform/src/modules/crm/
2. Implement multi-tenant architecture with tenant isolation
3. Use Prisma ORM with SQLite for development
4. Include comprehensive error handling and logging
5. Implement proper TypeScript types and interfaces
6. Follow NestJS best practices with dependency injection
7. Include lead scoring, qualification, and conversion tracking
8. Add analytics endpoints for business intelligence

TECH STACK:
- NestJS (Node.js framework)
- TypeScript
- Prisma ORM
- SQLite (development) → PostgreSQL (production)
- Multi-tenant SaaS architecture
  `,

  instructionsPrompt: `
Your task is to implement a complete Lead Platform Module that mirrors the CRM module structure.

IMPLEMENTATION STEPS:
1. Analyze the existing CRM module structure and patterns
2. Read the Prisma schema to understand the database structure
3. Create Lead entity interfaces and types
4. Implement LeadController with full CRUD operations
5. Implement LeadService with business logic
6. Add lead scoring algorithm
7. Add lead qualification workflow  
8. Add conversion tracking (lead → customer)
9. Add analytics endpoints
10. Update Prisma schema with Lead model
11. Generate and run database migration
12. Update the main app module to include LeadModule

SPECIFIC FEATURES TO IMPLEMENT:
- Lead CRUD operations (create, read, update, delete)
- Lead search and filtering
- Lead scoring based on configurable criteria
- Lead qualification workflow with status tracking
- Lead source tracking and analytics
- Lead assignment and distribution
- Lead follow-up scheduling and reminders
- Conversion tracking when leads become customers
- Analytics dashboard data (conversion rates, source performance, etc.)
- Multi-tenant data isolation
- Comprehensive error handling
- Audit logging for all lead operations

Make sure to follow the exact same patterns, error handling, and architectural decisions as the CRM module.
  `,

  handleSteps: function* ({ agentState, prompt, params }: AgentStepContext) {
    // Step 1: Analyze existing CRM module structure
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "I'll start by analyzing the existing CRM module structure to understand the patterns and architecture I need to follow for the Lead Platform Module.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'list_files',
      input: {
        path: 'apps/tekup-unified-platform/src/modules/crm',
        recursive: true,
      },
    } satisfies ToolCall

    yield {
      toolName: 'read_files',
      input: {
        paths: [
          'apps/tekup-unified-platform/src/modules/crm/crm.controller.ts',
          'apps/tekup-unified-platform/src/modules/crm/crm.service.ts',
          'apps/tekup-unified-platform/src/modules/crm/crm.module.ts',
        ],
      },
    } satisfies ToolCall

    // Step 2: Read Prisma schema and understand database structure
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Now I'll examine the Prisma schema to understand the current database structure and plan the Lead model.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'read_files',
      input: {
        paths: [
          'apps/tekup-unified-platform/prisma/schema.prisma',
        ],
      },
    } satisfies ToolCall

    // Step 3: Check current lead module placeholder if it exists
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Let me check if there's already a lead module placeholder and see what exists.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'list_files',
      input: {
        path: 'apps/tekup-unified-platform/src/modules',
        recursive: true,
      },
    } satisfies ToolCall

    // Step 4: Create the Lead module directory structure
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Now I'll create the complete Lead Platform Module following the exact same patterns as the CRM module. I'll start with the interfaces and types, then implement the controller, service, and module files.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    // Step 5: Let AI create all the implementation files
    yield 'STEP_ALL'

    // Step 6: Update database schema and run migrations
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Finally, I'll update the Prisma schema with the Lead model and generate the database migration.",
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
