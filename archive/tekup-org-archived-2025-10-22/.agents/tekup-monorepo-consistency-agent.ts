import type {
  AgentDefinition,
  AgentStepContext,
  ToolCall,
} from './types/agent-definition'

const definition: AgentDefinition = {
  id: 'tekup-monorepo-consistency-agent',
  displayName: 'Tekup Monorepo Consistency Agent',
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
      description: 'Areas to check for consistency (e.g., "API patterns", "design system", "all")',
    },
  },

  spawnerPrompt:
    'Spawn when you need to ensure consistency across the Tekup monorepo with 37+ apps, checking patterns, design system usage, and architectural standards',

  systemPrompt: `
You are an expert software architect specializing in large-scale monorepo management and consistency enforcement.
Your job is to maintain consistency across the Tekup monorepo with 37+ applications.

MONOREPO CONTEXT:
- 37+ applications in the apps/ directory
- Unified platform strategy consolidating legacy services
- Shared design system with Tailwind CSS 4.1
- Multi-tenant SaaS architecture
- Mix of NestJS backends and Next.js frontends
- Python AgentScope backend integration

CONSISTENCY AREAS TO MONITOR:
1. **API Patterns**: Consistent endpoint structures, error handling, response formats
2. **Design System**: Proper Tailwind CSS 4.1 usage, glassmorphism effects, P3 colors
3. **Architecture**: Multi-tenant patterns, service structure, dependency injection
4. **File Structure**: Consistent directory organization and naming conventions
5. **Package Management**: Aligned dependency versions and configurations
6. **TypeScript Standards**: Consistent types, interfaces, and code quality
7. **Environment Variables**: Proper .env management and validation
8. **Database Patterns**: Consistent Prisma usage and schema patterns
  `,

  instructionsPrompt: `
Your task is to analyze the monorepo for consistency issues and provide actionable recommendations.

ANALYSIS PROCESS:
1. Scan all applications in the apps/ directory
2. Identify inconsistencies in patterns, structure, and standards
3. Check adherence to the unified design system
4. Validate API endpoint patterns and response structures
5. Review package.json files for version alignment
6. Check TypeScript configuration consistency
7. Validate environment variable patterns
8. Generate a detailed report with specific recommendations

FOCUS AREAS:
- **Unified Platform Integration**: Ensure apps follow unified platform patterns
- **Design System Compliance**: Verify Tailwind CSS 4.1 and glassmorphism usage
- **API Standardization**: Check NestJS controller patterns and error handling
- **Multi-Tenancy**: Validate tenant isolation patterns
- **Code Quality**: Ensure TypeScript best practices
- **Performance**: Identify optimization opportunities
- **Security**: Check for consistent security patterns

Provide specific, actionable recommendations with file paths and code examples.
  `,

  handleSteps: function* ({ agentState, prompt, params }: AgentStepContext) {
    // Step 1: Get overview of all applications
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "I'll start by getting an overview of all applications in the monorepo to understand the scope and identify areas for consistency analysis.",
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

    // Step 2: Analyze package.json files for dependency consistency
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Now I'll analyze package.json files across applications to check for dependency version consistency and identify potential issues.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'find apps -name "package.json" -type f',
        process_type: 'SYNC',
        timeout_seconds: 30,
      },
    } satisfies ToolCall

    // Step 3: Check design system usage patterns
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "I'll check for consistent design system usage, particularly Tailwind CSS 4.1 configuration and glassmorphism patterns.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'find apps -name "tailwind.config.*" -type f',
        process_type: 'SYNC',
        timeout_seconds: 30,
      },
    } satisfies ToolCall

    // Step 4: Analyze API patterns in NestJS applications
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Let me analyze API patterns in NestJS applications to ensure consistent controller structures and error handling.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'find apps -name "*.controller.ts" -type f',
        process_type: 'SYNC',
        timeout_seconds: 30,
      },
    } satisfies ToolCall

    // Step 5: Check TypeScript configuration consistency
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "I'll check TypeScript configuration files for consistency across the monorepo.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'find apps -name "tsconfig.json" -o -name "tsconfig.*.json" -type f',
        process_type: 'SYNC',
        timeout_seconds: 30,
      },
    } satisfies ToolCall

    // Step 6: Analyze environment variable patterns
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Now I'll check environment variable patterns and .env files for consistency.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'find apps -name ".env*" -type f',
        process_type: 'SYNC',
        timeout_seconds: 30,
      },
    } satisfies ToolCall

    // Step 7: Read key reference files for pattern analysis
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "I'll read some key reference files to understand the expected patterns and standards.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield {
      toolName: 'read_files',
      input: {
        paths: [
          'apps/tekup-unified-platform/src/modules/crm/crm.controller.ts',
          'apps/tekup-unified-platform/package.json',
          'packages/design-system/package.json',
          'README.md',
        ],
      },
    } satisfies ToolCall

    // Step 8: Let AI perform detailed analysis and generate report
    yield {
      toolName: 'add_message',
      input: {
        role: 'assistant',
        content: "Based on my analysis, I'll now generate a comprehensive consistency report with specific recommendations for improving patterns, alignment, and standards across the monorepo.",
      },
      includeToolCall: false,
    } satisfies ToolCall

    yield 'STEP_ALL'
  },
}

export default definition
