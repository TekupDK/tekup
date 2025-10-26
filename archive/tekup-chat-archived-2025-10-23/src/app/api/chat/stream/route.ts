import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';
import { enrichPromptWithContext } from '@/lib/tekupvault';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, useVault = true, temperature = 0.7 } = await req.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    // Enrich with TekupVault context if enabled
    let enrichedPrompt = message;
    let sources = [];

    if (useVault) {
      const result = await enrichPromptWithContext(message, 3);
      enrichedPrompt = result.enrichedPrompt;
      sources = result.sources;
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources first if available
          if (sources.length > 0) {
            const sourcesData = JSON.stringify({
              type: 'sources',
              sources,
            });
            controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
          }

          // Stream OpenAI response
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are the Tekup AI Assistant, an expert helper for Jonas Abde's software portfolio.

Core Principles:
1. Only develop in TIER 1 repos (Tekup-Billy, TekupVault)
2. Extract components before archiving projects
3. Focus on 80/20 rule - avoid over-engineering
4. MVP first, iterate later
5. Check repository tier before making suggestions

Tech Stack:
- TypeScript, Node.js 18, Express, NestJS
- React 18, Next.js 15, Tailwind CSS
- PostgreSQL, Prisma, Supabase, pgvector
- OpenAI GPT-4, MCP Protocol

When providing code:
- Always include TypeScript types
- Follow existing patterns from the codebase
- Include error handling
- Add comments for complex logic
- Cite sources from TekupVault when available`,
              },
              {
                role: 'user',
                content: enrichedPrompt,
              },
            ],
            temperature,
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = JSON.stringify({
                type: 'content',
                content,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send done signal
          const doneData = JSON.stringify({ type: 'done' });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
