import { z } from 'zod';

// TekupVault API Configuration
const TEKUPVAULT_URL = process.env.TEKUPVAULT_API_URL || 'https://tekupvault.onrender.com/api';
const TEKUPVAULT_KEY = process.env.TEKUPVAULT_API_KEY || 'tekup_vault_api_key_2025_secure';

// Response schemas
const searchResultSchema = z.object({
  content: z.string(),
  metadata: z.object({
    file_path: z.string(),
    repository: z.string().optional(),
    line_start: z.number().optional(),
    line_end: z.number().optional(),
  }),
  similarity: z.number(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  query: z.string(),
  total: z.number(),
});

/**
 * Search TekupVault for relevant documentation and code
 */
export async function searchTekupVault(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${TEKUPVAULT_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEKUPVAULT_KEY,
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!response.ok) {
      throw new Error(`TekupVault API error: ${response.status}`);
    }

    const data = await response.json();
    const validated = searchResponseSchema.parse(data);
    return validated.results;
  } catch (error) {
    console.error('TekupVault search failed:', error);
    // Graceful degradation - return empty results
    return [];
  }
}

/**
 * Get specific document by ID
 */
export async function getDocument(documentId: string) {
  try {
    const response = await fetch(`${TEKUPVAULT_URL}/documents/${documentId}`, {
      headers: {
        'X-API-Key': TEKUPVAULT_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Document fetch failed:', error);
    return null;
  }
}

/**
 * Format search results as context for AI
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant documentation found in TekupVault.';
  }

  const formatted = results.map((result, idx) => {
    const { file_path, repository, line_start, line_end } = result.metadata;
    const location = line_start
      ? `${file_path} (lines ${line_start}-${line_end})`
      : file_path;
    const repo = repository ? `[${repository}] ` : '';

    return `
## Source ${idx + 1}: ${repo}${location}
Relevance: ${(result.similarity * 100).toFixed(1)}%

\`\`\`
${result.content}
\`\`\`
`;
  }).join('\n');

  return `
# Relevant Documentation from TekupVault

${formatted}

Use this context to provide accurate, Tekup-specific answers. Always cite sources.
`;
}

/**
 * Extract citations from search results
 */
export function extractCitations(results: SearchResult[]) {
  return results.map(result => ({
    source: result.metadata.repository || 'TekupVault',
    file_path: result.metadata.file_path,
    line_start: result.metadata.line_start,
    line_end: result.metadata.line_end,
    snippet: result.content.slice(0, 200) + '...',
  }));
}

/**
 * Archive chat session to TekupVault
 * For future retrieval and context enrichment
 */
export async function archiveChatToVault(
  sessionId: string,
  messages: Array<{ role: string; content: string }>,
  summary: string
) {
  try {
    const response = await fetch(`${TEKUPVAULT_URL}/archive/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEKUPVAULT_KEY,
      },
      body: JSON.stringify({
        session_id: sessionId,
        messages,
        summary,
        tags: ['chat-session', 'ai-assistant'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Archive failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to archive chat to TekupVault:', error);
    // Non-critical failure - continue
    return null;
  }
}
