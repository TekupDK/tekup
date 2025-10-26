import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Airtable from 'airtable';
import { Logger, ConfigManager, TextProcessor } from '../../shared/utils.js';
import { TranscriptData, Speaker, SpeechSegment, TranscriptMetadata } from '../../types/index.js';

/**
 * Transcript Intelligence MCP Server
 * Handles transcript retrieval from Airtable and preprocessing
 */
export class TranscriptIntelligenceServer {
  private server: Server;
  private logger: Logger;
  private airtable: Airtable;
  private config: any;

  constructor() {
    this.logger = Logger.getInstance();
    this.config = ConfigManager.getAirtableConfig();
    
    // Initialize Airtable
    this.airtable = new Airtable({ apiKey: this.config.apiKey });

    this.server = new Server(
      {
        name: 'transcript-intelligence-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupErrorHandling();
  }

  private setupTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'process_transcript',
            description: 'Retrieve and process a transcript from Airtable',
            inputSchema: {
              type: 'object',
              properties: {
                transcriptId: {
                  type: 'string',
                  description: 'The record ID of the transcript in Airtable'
                }
              },
              required: ['transcriptId']
            }
          },
          {
            name: 'list_transcripts',
            description: 'List available transcripts from Airtable',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of transcripts to return',
                  default: 10
                },
                filterFormula: {
                  type: 'string',
                  description: 'Airtable filter formula'
                }
              }
            }
          },
          {
            name: 'analyze_speakers',
            description: 'Analyze and identify speakers in a transcript',
            inputSchema: {
              type: 'object',
              properties: {
                transcriptContent: {
                  type: 'string',
                  description: 'The raw transcript content'
                }
              },
              required: ['transcriptContent']
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'process_transcript':
            return await this.processTranscript(args.transcriptId as string);
          
          case 'list_transcripts':
            return await this.listTranscripts(args.limit as number, args.filterFormula as string);
          
          case 'analyze_speakers':
            return await this.analyzeSpeakers(args.transcriptContent as string);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      this.logger.error('Transcript Intelligence Server error:', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down Transcript Intelligence Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Process a transcript from Airtable
   */
  private async processTranscript(transcriptId: string): Promise<{ content: TranscriptData }> {
    this.logger.info(`Processing transcript: ${transcriptId}`);

    try {
      // Retrieve transcript from Airtable
      const base = this.airtable.base(this.config.baseId);
      const table = base(this.config.tableName);
      
      const record = await table.find(transcriptId);
      
      if (!record) {
        throw new Error(`Transcript not found: ${transcriptId}`);
      }

      // Extract transcript data from Airtable record
      const rawContent = record.get('Transcript') as string;
      const recordingDate = record.get('Recording Date') as string;
      const participants = record.get('Participants') as string[];
      const duration = record.get('Duration') as number;
      const company = record.get('Company') as string;
      const industry = record.get('Industry') as string;

      if (!rawContent) {
        throw new Error(`No transcript content found for record: ${transcriptId}`);
      }

      // Clean and process the transcript
      const cleanedContent = TextProcessor.cleanTranscript(rawContent);
      
      // Analyze speakers
      const speakers = await this.identifySpeakers(cleanedContent);

      // Create metadata
      const metadata: TranscriptMetadata = {
        duration: duration || 0,
        recordingDate: recordingDate ? new Date(recordingDate) : new Date(),
        participants: participants || [],
        company: company || undefined,
        industry: industry || undefined
      };

      const transcriptData: TranscriptData = {
        id: transcriptId,
        content: cleanedContent,
        speakers,
        metadata
      };

      this.logger.info(`Successfully processed transcript: ${transcriptId}`);
      return { content: transcriptData };

    } catch (error) {
      this.logger.error(`Error processing transcript ${transcriptId}:`, error);
      throw new Error(`Failed to process transcript: ${error.message}`);
    }
  }

  /**
   * List available transcripts from Airtable
   */
  private async listTranscripts(limit: number = 10, filterFormula?: string): Promise<{ content: any[] }> {
    this.logger.info(`Listing transcripts (limit: ${limit})`);

    try {
      const base = this.airtable.base(this.config.baseId);
      const table = base(this.config.tableName);
      
      const queryOptions: any = {
        maxRecords: limit,
        sort: [{ field: 'Recording Date', direction: 'desc' }]
      };

      if (filterFormula) {
        queryOptions.filterByFormula = filterFormula;
      }

      const records = await table.select(queryOptions).all();
      
      const transcripts = records.map(record => ({
        id: record.id,
        company: record.get('Company'),
        recordingDate: record.get('Recording Date'),
        duration: record.get('Duration'),
        participants: record.get('Participants'),
        hasTranscript: !!record.get('Transcript')
      }));

      this.logger.info(`Found ${transcripts.length} transcripts`);
      return { content: transcripts };

    } catch (error) {
      this.logger.error('Error listing transcripts:', error);
      throw new Error(`Failed to list transcripts: ${error.message}`);
    }
  }

  /**
   * Analyze speakers in transcript content
   */
  private async analyzeSpeakers(transcriptContent: string): Promise<{ content: Speaker[] }> {
    this.logger.info('Analyzing speakers in transcript');

    try {
      const speakers = await this.identifySpeakers(transcriptContent);
      return { content: speakers };

    } catch (error) {
      this.logger.error('Error analyzing speakers:', error);
      throw new Error(`Failed to analyze speakers: ${error.message}`);
    }
  }

  /**
   * Identify and segment speakers in the transcript
   */
  private async identifySpeakers(content: string): Promise<Speaker[]> {
    const speakers: Speaker[] = [];
    const lines = content.split('\n').filter(line => line.trim());

    let currentSpeaker: Speaker | null = null;
    let timestamp = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line contains speaker identification (e.g., "John:", "Speaker 1:", etc.)
      const speakerMatch = trimmedLine.match(/^([^:]+):\s*(.*)$/);
      
      if (speakerMatch) {
        const [, speakerName, speechText] = speakerMatch;
        
        // Find or create speaker
        let speaker = speakers.find(s => s.name === speakerName.trim());
        if (!speaker) {
          speaker = {
            id: `speaker_${speakers.length + 1}`,
            name: speakerName.trim(),
            role: this.determineSpeakerRole(speakerName.trim()),
            segments: []
          };
          speakers.push(speaker);
        }

        // Add speech segment
        if (speechText.trim()) {
          const segment: SpeechSegment = {
            startTime: timestamp,
            endTime: timestamp + this.estimateSegmentDuration(speechText),
            text: speechText.trim(),
            confidence: 0.9
          };
          speaker.segments.push(segment);
          timestamp = segment.endTime;
        }

        currentSpeaker = speaker;
      } else if (currentSpeaker && trimmedLine) {
        // Continue previous speaker's segment
        const lastSegment = currentSpeaker.segments[currentSpeaker.segments.length - 1];
        if (lastSegment) {
          lastSegment.text += ' ' + trimmedLine;
          lastSegment.endTime = timestamp + this.estimateSegmentDuration(trimmedLine);
          timestamp = lastSegment.endTime;
        }
      }
    }

    // If no speaker identification found, create a single unknown speaker
    if (speakers.length === 0) {
      speakers.push({
        id: 'speaker_unknown',
        name: 'Unknown Speaker',
        role: 'unknown',
        segments: [{
          startTime: 0,
          endTime: this.estimateSegmentDuration(content),
          text: content,
          confidence: 0.5
        }]
      });
    }

    return speakers;
  }

  /**
   * Determine speaker role based on name/context
   */
  private determineSpeakerRole(speakerName: string): 'prospect' | 'salesperson' | 'unknown' {
    const name = speakerName.toLowerCase();
    
    // Common salesperson indicators
    if (name.includes('sales') || name.includes('rep') || name.includes('account') || 
        name.includes('manager') || name.includes('consultant')) {
      return 'salesperson';
    }
    
    // Common prospect indicators
    if (name.includes('client') || name.includes('customer') || name.includes('prospect') ||
        name.includes('ceo') || name.includes('cto') || name.includes('director')) {
      return 'prospect';
    }
    
    return 'unknown';
  }

  /**
   * Estimate segment duration based on text length
   */
  private estimateSegmentDuration(text: string): number {
    // Rough estimate: 150 words per minute, average 5 characters per word
    const wordsPerMinute = 150;
    const charactersPerWord = 5;
    const charactersPerSecond = (wordsPerMinute * charactersPerWord) / 60;
    
    return Math.max(1, Math.round(text.length / charactersPerSecond));
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Transcript Intelligence Server started and listening...');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new TranscriptIntelligenceServer();
  server.start().catch((error) => {
    console.error('Failed to start Transcript Intelligence Server:', error);
    process.exit(1);
  });
}
