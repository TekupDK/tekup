import { NextRequest, NextResponse } from 'next/server';
import { streamResponse } from '@/lib/openai';
import { addMessage } from '@/lib/supabase';
import { searchTekupVault, extractCitations } from '@/lib/tekupvault';
import { z } from 'zod';

// Request validation schema
const chatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message, messages } = chatRequestSchema.parse(body);

    // Search TekupVault for relevant context
    const searchResults = await searchTekupVault(message, 5);
    const citations = extractCitations(searchResults);

    // Save user message
    await addMessage(sessionId, 'user', message);

    // Create stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          // Stream AI response
          for await (const chunk of streamResponse(
            [...messages, { role: 'user', content: message }],
            message
          )) {
            fullResponse += chunk;
            
            // Send chunk to client
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            );
          }

          // Save complete assistant response
          await addMessage(
            sessionId,
            'assistant',
            fullResponse,
            citations.length > 0 ? citations : undefined
          );

          // Send done signal with citations
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, citations })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
