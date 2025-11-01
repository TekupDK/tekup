import { NextRequest, NextResponse } from 'next/server';

/**
 * MOCK Chat API - Works without OpenAI key
 * Use this for testing UI without API costs
 * 
 * To use: Rename to route.ts (backup original first)
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  messages: Message[];
}

/**
 * Mock responses baseret på keywords
 */
function generateMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Billy.dk faktura
  if (lowerMessage.includes('faktura') || lowerMessage.includes('billy')) {
    return `📧 **Sådan laver du en faktura i Billy.dk:**

\`\`\`typescript
// POST /invoices endpoint
const invoice = await fetch('https://api.billy.dk/invoices', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customerId: 'cust_123',
    lines: [
      {
        description: 'Rengøring 4 timer',
        quantity: 4,
        unitPrice: 349,
        total: 1396
      }
    ]
  })
});
\`\`\`

**Kilde:** [Tekup-Billy/docs/API_REFERENCE.md]`;
  }

  // Tekup-org deletion warning
  if (lowerMessage.includes('slet') && lowerMessage.includes('tekup-org')) {
    return `⚠️ **ADVARSEL: Slet IKKE Tekup-org!**

**Værdi analyse:**
- 💰 €360,000 extractable værdi
- 🎨 Design system (€50K værdi)
- 📊 Database schemas (€30K værdi)
- 🔧 Utility functions (€20K værdi)

**I stedet for at slette:**
1. Extract design system → nyt repo
2. Extract reusable components → component library
3. Archive som reference
4. Keep git history

**Kilde:** [Tekup-Cloud/STRATEGIC_ANALYSIS_2025.md]`;
  }

  // TekupVault
  if (lowerMessage.includes('tekupvault') || lowerMessage.includes('knowledge')) {
    return `📚 **TekupVault - Tekup Knowledge Base**

**Status:** ✅ Operational
- 1,063 dokumenter indexeret
- 8 repositories covered
- Semantic search med pgvector
- REST API + MCP server

**Integration:**
\`\`\`typescript
const results = await fetch('https://tekupvault.onrender.com/api/search', {
  method: 'POST',
  body: JSON.stringify({ query: 'MCP tools', limit: 5 })
});
\`\`\`

**Kilde:** [TekupVault/README.md]`;
  }

  // Generic help
  if (lowerMessage.includes('hjælp') || lowerMessage.includes('help')) {
    return `🤖 **Tekup AI Assistant - Jeg kan hjælpe med:**

1. **📧 Billy.dk Integration**
   - Fakturaer, kunder, produkter
   - API endpoints og eksempler

2. **🎯 Strategic Decisions**
   - TIER system prioritering
   - Repository management
   - Architecture anbefalinger

3. **💻 Code Help**
   - TypeScript patterns
   - MCP tool development
   - Deployment guides

4. **📚 Knowledge Search**
   - Søg i 1,063 Tekup docs
   - Find code examples
   - Best practices

**Prøv at spørge:** "Hvordan laver jeg en faktura?" eller "Skal jeg slette Tekup-org?"`;
  }

  // Default response
  return `🤖 **Hej! Jeg er Tekup AI Assistant.**

Jeg kan hjælpe med:
- Billy.dk API og fakturaer
- TekupVault integration
- Strategic beslutninger (TIER system)
- Code eksempler fra Tekup projekter

**Dette er en MOCK version** - ingen OpenAI API key påkrævet.

For fulde AI capabilities, tilføj din OpenAI key i \`.env.local\`.

**Hvad vil du vide om?**`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockResponse = generateMockResponse(message);

    return NextResponse.json({
      message: mockResponse,
      sources: [],
      mock: true,
    });

  } catch (error: any) {
    console.error('Mock Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
