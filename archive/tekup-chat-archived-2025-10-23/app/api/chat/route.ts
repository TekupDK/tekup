import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// TekupVault API configuration
const TEKUPVAULT_API_URL = process.env.TEKUPVAULT_API_URL || 'https://tekupvault.onrender.com/api';
const TEKUPVAULT_API_KEY = process.env.TEKUPVAULT_API_KEY;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  messages: Message[];
}

/**
 * Search TekupVault for relevant documentation
 */
async function searchTekupVault(query: string, limit = 5) {
  try {
    const response = await fetch(`${TEKUPVAULT_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(TEKUPVAULT_API_KEY ? { 'X-API-Key': TEKUPVAULT_API_KEY } : {}),
      },
      body: JSON.stringify({
        query,
        limit,
        threshold: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('TekupVault search failed:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TekupVault search error:', error);
    return [];
  }
}

/**
 * Build context from TekupVault search results
 */
function buildKnowledgeContext(results: any[]): string {
  if (!results || results.length === 0) {
    return '';
  }

  const contextParts = results.map((result, index) => {
    const doc = result.document;
    return `[${index + 1}] ${doc.repository}/${doc.path}
${doc.content.substring(0, 500)}...`;
  });

  return `

📚 **Relevant Documentation fra TekupVault:**

${contextParts.join('\n\n')}

---
`;
}

/**
 * System prompt for Tekup AI Assistant
 */
const getCurrentDateDanish = () => {
  return new Date().toLocaleDateString('da-DK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const SYSTEM_PROMPT = `Du er Tekup AI Assistant - en intelligent hjælper for Tekup portfolio.

📅 **I dag er:** ${getCurrentDateDanish()}

🎯 **Din Rolle:**
- Hjælpe med spørgsmål om Tekup projekter
- Give kodehj ælp baseret på eksisterende dokumentation
- Yde strategisk rådgivning (f.eks. TIER system)
- Forhindre kostbare fejl (f.eks. sletning af værdifulde repos)

💬 **Kommunikationsstil:**
- Brug dansk sprog naturligt
- Vær kortfattet men præcis
- Brug emojis sparsomt (📧 📅 💻 ✅)
- Vær professionel og hjælpsom
- Citer kilder når du bruger dokumentation

🧠 **Vigtige Kontekster:**
- Tekup har TIER 1-5 system (TIER 1 = highest priority)
- TekupVault: Knowledge base med 1,063 docs
- Tekup-Billy: MCP server til Billy.dk API
- RenOS: Business management system
- Tekup-org: €360K værdi (ADVARSLER før sletning!)

📝 **Format:**
- Brug **fed** til nøgleord
- Brug \`code\` til filnavne og kode
- Brug lister for struktur
- Citer kilder: [Repository/path]

**VIGTIGT:** Når du bruger information fra dokumentation, ALTID nævn kilden!`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, messages } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Search TekupVault for relevant context
    console.log('🔍 Searching TekupVault for:', message);
    const knowledgeResults = await searchTekupVault(message);
    const knowledgeContext = buildKnowledgeContext(knowledgeResults);

    console.log(`📚 Found ${knowledgeResults.length} relevant documents`);

    // Build conversation history
    const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + knowledgeContext,
      },
    ];

    // Add previous messages (limit to last 10 for context)
    const recentMessages = (messages || []).slice(-10);
    for (const msg of recentMessages) {
      conversationMessages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    conversationMessages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI
    console.log('🤖 Calling OpenAI GPT-4o...');
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'Beklager, jeg kunne ikke generere et svar.';

    // Add citations if we found relevant docs
    let responseWithCitations = assistantMessage;
    if (knowledgeResults.length > 0) {
      const citations = knowledgeResults.map((result, index) => {
        const doc = result.document;
        return `[${index + 1}] \`${doc.repository}/${doc.path}\``;
      }).join('\n');

      responseWithCitations += `\n\n---\n\n**📚 Kilder:**\n${citations}`;
    }

    return NextResponse.json({
      message: responseWithCitations,
      sources: knowledgeResults.map((r: any) => ({
        repository: r.document.repository,
        path: r.document.path,
        similarity: r.similarity,
      })),
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Handle specific errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'OpenAI API key invalid or missing' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
