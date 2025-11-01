import OpenAI from 'openai';
import { searchTekupVault, formatSearchResults } from './tekupvault';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// System prompt for Tekup AI Assistant
const SYSTEM_PROMPT = `You are the Tekup AI Assistant - an expert coding assistant with deep knowledge of the Tekup portfolio.

## Your Knowledge Base

You have access to 1,063 documents from 8 repositories via TekupVault:
- Tekup-Billy: Billy.dk API integration, MCP server
- TekupVault: Knowledge base, RAG architecture
- RendetaljeOS-Mobile: Cleaning service mobile app
- TekupMobileApp: Marketing mobile app
- Tekup-org: Design system, AgentScope (extraction candidate)
- And 3 more repositories

## Core Principles

1. **Only develop in TIER 1 repositories** (Tekup-Billy, TekupVault)
2. **Extract before deleting** - especially from Tekup-org (€360K value!)
3. **Focus beats sprawl** - 80/20 rule
4. **MVP first** - avoid over-engineering
5. **TypeScript strict mode** - type safety is mandatory

## Technology Stack

- TypeScript, Node.js 18+, NestJS, Next.js 15
- PostgreSQL, Prisma ORM, Supabase, pgvector
- OpenAI GPT-4, MCP (Model Context Protocol)
- Zod validation, Vitest testing
- Deployed on Render.com (Frankfurt)

## Response Guidelines

1. **Always cite sources** - reference specific files and line numbers
2. **Provide working code** - examples should run immediately
3. **Follow Tekup patterns** - reference existing implementations
4. **Warn about mistakes** - especially strategic decisions (like deleting Tekup-org!)
5. **Be concise** - developers are busy

## Strategic Context

- Portfolio owner: Jonas Abde
- Focus: Consolidation phase, reduce sprawl
- Priority: Extract value from Tekup-org before archiving
- Lesson learned: Tekup-org had 30+ apps, abandoned in 28 days due to over-engineering

When answering:
1. Search TekupVault for relevant context
2. Use Tekup-specific patterns and examples
3. Cite sources with file paths
4. Consider strategic implications
5. Prevent costly mistakes

You are helpful, accurate, and strategic. You save developers time by providing context-aware answers.`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate AI response with TekupVault context
 */
export async function generateResponse(
  messages: ChatMessage[],
  searchQuery?: string
): Promise<string> {
  // Search TekupVault if query provided
  let contextMessages = [...messages];
  
  if (searchQuery) {
    const results = await searchTekupVault(searchQuery, 5);
    const context = formatSearchResults(results);
    
    // Insert context before last user message
    if (context && results.length > 0) {
      contextMessages.splice(contextMessages.length - 1, 0, {
        role: 'system',
        content: context,
      });
    }
  }

  // Add system prompt if not present
  if (contextMessages[0]?.role !== 'system') {
    contextMessages.unshift({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: contextMessages,
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || 'No response generated';
}

/**
 * Stream AI response with Server-Sent Events
 */
export async function* streamResponse(
  messages: ChatMessage[],
  searchQuery?: string
): AsyncGenerator<string> {
  // Search TekupVault if query provided
  let contextMessages = [...messages];
  
  if (searchQuery) {
    const results = await searchTekupVault(searchQuery, 5);
    const context = formatSearchResults(results);
    
    if (context && results.length > 0) {
      contextMessages.splice(contextMessages.length - 1, 0, {
        role: 'system',
        content: context,
      });
    }
  }

  // Add system prompt if not present
  if (contextMessages[0]?.role !== 'system') {
    contextMessages.unshift({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
  }

  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages: contextMessages,
    temperature: 0.7,
    max_tokens: 2000,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Generate chat summary for archival
 */
export async function generateSummary(
  messages: ChatMessage[]
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheaper model for summaries
    messages: [
      {
        role: 'system',
        content: 'Summarize this chat conversation in 2-3 sentences. Focus on key topics, decisions, and outcomes.',
      },
      {
        role: 'user',
        content: JSON.stringify(messages),
      },
    ],
    temperature: 0.5,
    max_tokens: 150,
  });

  return response.choices[0]?.message?.content || 'Chat conversation';
}
