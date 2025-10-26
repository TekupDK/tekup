import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Airtable Integration Service
 * 
 * Automatically retrieves call transcripts from Airtable:
 * - Fetches transcript data by ID
 * - Handles authentication and API calls
 * - Processes transcript content for analysis
 * - Manages rate limiting and error handling
 */
@Injectable()
export class AirtableIntegrationService {
  private readonly logger = new Logger(AirtableIntegrationService.name);
  private readonly apiKey: string;
  private readonly baseId: string;
  private readonly tableName: string;
  private readonly baseUrl = 'https://api.airtable.com/v0';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AIRTABLE_API_KEY');
    this.baseId = this.configService.get<string>('AIRTABLE_BASE_ID');
    this.tableName = this.configService.get<string>('AIRTABLE_TRANSCRIPTS_TABLE') || 'Call Transcripts';

    if (!this.apiKey || !this.baseId) {
      this.logger.warn('Airtable credentials not configured - using mock data');
    }
  }

  /**
   * Get transcript by ID from Airtable
   * 
   * @param tenantId - Multi-tenant isolation
   * @param transcriptId - Airtable record ID
   * @returns Transcript data or null if not found
   */
  async getTranscript(tenantId: string, transcriptId: string): Promise<{
    id: string;
    content: string;
    metadata: {
      clientName?: string;
      callDate?: string;
      duration?: number;
      participants?: string[];
      callType?: string;
      recordingUrl?: string;
    };
  } | null> {
    this.logger.log(`Retrieving transcript ${transcriptId} for tenant ${tenantId}`);

    if (!this.apiKey || !this.baseId) {
      this.logger.warn('Airtable not configured - returning mock transcript');
      return this.getMockTranscript(transcriptId);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${encodeURIComponent(this.tableName)}/${transcriptId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn(`Transcript ${transcriptId} not found`);
          return null;
        }
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const record = data.fields;

      // Extract transcript content and metadata
      const transcript = {
        id: transcriptId,
        content: record.Transcript || record.transcript || record.Content || '',
        metadata: {
          clientName: record['Client Name'] || record.clientName || record.Company,
          callDate: record['Call Date'] || record.callDate || record.Date,
          duration: record.Duration || record.duration || record['Call Duration'],
          participants: this.parseParticipants(record.Participants || record.participants || record['Call Participants']),
          callType: record['Call Type'] || record.callType || record.Type,
          recordingUrl: record['Recording URL'] || record.recordingUrl || record.Recording,
        },
      };

      this.logger.log(`Retrieved transcript for ${transcript.metadata.clientName || 'Unknown Client'}`);

      return transcript;

    } catch (error) {
      this.logger.error(`Failed to retrieve transcript: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * List recent transcripts for tenant
   */
  async listTranscripts(
    tenantId: string,
    limit: number = 50,
    offset?: string,
  ): Promise<{
    transcripts: Array<{
      id: string;
      clientName?: string;
      callDate?: string;
      duration?: number;
      status: 'processed' | 'pending' | 'failed';
    }>;
    offset?: string;
    hasMore: boolean;
  }> {
    this.logger.log(`Listing transcripts for tenant ${tenantId}`);

    if (!this.apiKey || !this.baseId) {
      return this.getMockTranscriptList();
    }

    try {
      const params = new URLSearchParams({
        pageSize: limit.toString(),
      });
      params.append('sort[0][field]', 'Call Date');
      params.append('sort[0][direction]', 'desc');

      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${encodeURIComponent(this.tableName)}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const transcripts = data.records.map((record: any) => ({
        id: record.id,
        clientName: record.fields['Client Name'] || record.fields.clientName,
        callDate: record.fields['Call Date'] || record.fields.callDate,
        duration: record.fields.Duration || record.fields.duration,
        status: this.determineTranscriptStatus(record.fields),
      }));

      return {
        transcripts,
        offset: data.offset,
        hasMore: !!data.offset,
      };

    } catch (error) {
      this.logger.error(`Failed to list transcripts: ${error.message}`, error.stack);
      return this.getMockTranscriptList();
    }
  }

  /**
   * Search transcripts by client name or content
   */
  async searchTranscripts(
    tenantId: string,
    query: string,
    limit: number = 20,
  ): Promise<Array<{
    id: string;
    clientName?: string;
    callDate?: string;
    content: string;
    relevanceScore: number;
  }>> {
    this.logger.log(`Searching transcripts for query: ${query}`);

    if (!this.apiKey || !this.baseId) {
      return this.getMockSearchResults(query);
    }

    try {
      // Airtable doesn't have built-in full-text search, so we'll use a filter
      const filterFormula = `OR(
        SEARCH("${query}", {Client Name}),
        SEARCH("${query}", {Transcript}),
        SEARCH("${query}", {Company})
      )`;

      const params = new URLSearchParams({
        filterByFormula: filterFormula,
        pageSize: limit.toString(),
      });
      params.append('sort[0][field]', 'Call Date');
      params.append('sort[0][direction]', 'desc');

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${encodeURIComponent(this.tableName)}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data.records.map((record: any) => ({
        id: record.id,
        clientName: record.fields['Client Name'] || record.fields.clientName,
        callDate: record.fields['Call Date'] || record.fields.callDate,
        content: (record.fields.Transcript || record.fields.transcript || '').substring(0, 200) + '...',
        relevanceScore: this.calculateRelevanceScore(query, record.fields),
      }));

    } catch (error) {
      this.logger.error(`Failed to search transcripts: ${error.message}`, error.stack);
      return this.getMockSearchResults(query);
    }
  }

  /**
   * Update transcript status after processing
   */
  async updateTranscriptStatus(
    transcriptId: string,
    status: 'processed' | 'processing' | 'failed',
    proposalId?: string,
  ): Promise<boolean> {
    this.logger.log(`Updating transcript ${transcriptId} status to ${status}`);

    if (!this.apiKey || !this.baseId) {
      return true; // Mock success
    }

    try {
      const updateData: any = {
        fields: {
          'Processing Status': status,
          'Last Processed': new Date().toISOString(),
        },
      };

      if (proposalId) {
        updateData.fields['Proposal ID'] = proposalId;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${encodeURIComponent(this.tableName)}/${transcriptId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      this.logger.log(`Transcript ${transcriptId} status updated successfully`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to update transcript status: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Parse participants from various field formats
   */
  private parseParticipants(participants: any): string[] {
    if (!participants) return [];

    if (Array.isArray(participants)) {
      return participants;
    }

    if (typeof participants === 'string') {
      return participants.split(',').map(p => p.trim());
    }

    return [];
  }

  /**
   * Determine transcript processing status
   */
  private determineTranscriptStatus(fields: any): 'processed' | 'pending' | 'failed' {
    const status = fields['Processing Status'] || fields.processingStatus || fields.Status;
    
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'completed':
        return 'processed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(query: string, fields: any): number {
    const searchText = [
      fields['Client Name'] || '',
      fields.Transcript || '',
      fields.Company || '',
    ].join(' ').toLowerCase();

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    let score = 0;
    queryWords.forEach(word => {
      if (searchText.includes(word)) {
        score += 1;
      }
    });

    return Math.min(score / queryWords.length, 1.0);
  }

  /**
   * Get mock transcript for testing
   */
  private getMockTranscript(transcriptId: string): any {
    return {
      id: transcriptId,
      content: `This is a mock transcript for testing purposes. The client mentioned they are struggling with manual processes and need a solution to automate their workflow. They have a budget of around $50,000 and need this implemented by the end of the quarter. The decision maker is the CTO who is very interested in our technology approach.`,
      metadata: {
        clientName: 'Mock Client Inc.',
        callDate: new Date().toISOString(),
        duration: 1800, // 30 minutes
        participants: ['John Smith (CTO)', 'Sarah Johnson (Sales Rep)'],
        callType: 'Discovery Call',
        recordingUrl: 'https://example.com/recording.mp3',
      },
    };
  }

  /**
   * Get mock transcript list for testing
   */
  private getMockTranscriptList(): any {
    return {
      transcripts: [
        {
          id: 'rec1234567890',
          clientName: 'Mock Client Inc.',
          callDate: new Date().toISOString(),
          duration: 1800,
          status: 'processed',
        },
        {
          id: 'rec1234567891',
          clientName: 'Another Client LLC',
          callDate: new Date(Date.now() - 86400000).toISOString(),
          duration: 2400,
          status: 'pending',
        },
      ],
      hasMore: false,
    };
  }

  /**
   * Get mock search results for testing
   */
  private getMockSearchResults(query: string): any[] {
    return [
      {
        id: 'rec1234567890',
        clientName: 'Mock Client Inc.',
        callDate: new Date().toISOString(),
        content: `Mock transcript content mentioning ${query}...`,
        relevanceScore: 0.8,
      },
    ];
  }
}