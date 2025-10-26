import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { Logger, ConfigManager } from '../../shared/utils.js';
import { 
  ProposalNarrative,
  ProposalSection,
  DocumentTemplate,
  DocumentStyling
} from '../../types/index.js';

/**
 * Document Assembly MCP Server
 * Creates professionally styled Google Docs from proposal narratives
 */
export class DocumentAssemblyServer {
  private server: Server;
  private logger: Logger;
  private googleConfig: any;
  private docs: any;
  private drive: any;

  constructor() {
    this.logger = Logger.getInstance();
    this.googleConfig = ConfigManager.getGoogleConfig();
    
    // Initialize Google APIs
    this.initializeGoogleAPIs();

    this.server = new Server(
      {
        name: 'document-assembly-server',
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

  private initializeGoogleAPIs(): void {
    try {
      const auth = new google.auth.OAuth2(
        this.googleConfig.clientId,
        this.googleConfig.clientSecret,
        this.googleConfig.redirectUri
      );

      if (this.googleConfig.refreshToken) {
        auth.setCredentials({
          refresh_token: this.googleConfig.refreshToken
        });
      }

      this.docs = google.docs({ version: 'v1', auth });
      this.drive = google.drive({ version: 'v3', auth });

    } catch (error) {
      this.logger.warn('Google APIs not configured, using mock mode');
      this.docs = null;
      this.drive = null;
    }
  }

  private setupTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_document',
            description: 'Create a Google Doc from a proposal narrative',
            inputSchema: {
              type: 'object',
              properties: {
                narrative: {
                  type: 'object',
                  description: 'The proposal narrative to convert to a document'
                },
                templateId: {
                  type: 'string',
                  description: 'Optional template ID to use'
                },
                title: {
                  type: 'string',
                  description: 'Document title'
                }
              },
              required: ['narrative']
            }
          },
          {
            name: 'apply_styling',
            description: 'Apply professional styling to a Google Doc',
            inputSchema: {
              type: 'object',
              properties: {
                documentId: {
                  type: 'string',
                  description: 'Google Doc ID to style'
                },
                styling: {
                  type: 'object',
                  description: 'Styling configuration'
                }
              },
              required: ['documentId']
            }
          },
          {
            name: 'export_document',
            description: 'Export document in various formats',
            inputSchema: {
              type: 'object',
              properties: {
                documentId: {
                  type: 'string',
                  description: 'Google Doc ID to export'
                },
                format: {
                  type: 'string',
                  enum: ['pdf', 'docx', 'html'],
                  description: 'Export format'
                }
              },
              required: ['documentId', 'format']
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_document':
            return await this.createDocument(
              args.narrative as ProposalNarrative,
              args.templateId as string,
              args.title as string
            );
          
          case 'apply_styling':
            return await this.applyStyling(
              args.documentId as string,
              args.styling as DocumentStyling
            );
          
          case 'export_document':
            return await this.exportDocument(
              args.documentId as string,
              args.format as string
            );
          
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
      this.logger.error('Document Assembly Server error:', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down Document Assembly Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Create a Google Doc from proposal narrative
   */
  private async createDocument(
    narrative: ProposalNarrative,
    templateId?: string,
    title?: string
  ): Promise<{ content: { documentUrl: string, documentId: string } }> {
    this.logger.info('Creating Google Doc from narrative');

    try {
      if (!this.docs) {
        // Return mock document URL if Google APIs not configured
        const mockUrl = 'https://docs.google.com/document/d/mock-document-id/edit';
        this.logger.warn('Google APIs not configured, returning mock document URL');
        return { 
          content: { 
            documentUrl: mockUrl,
            documentId: 'mock-document-id'
          } 
        };
      }

      // Create new document
      const documentTitle = title || this.generateDocumentTitle(narrative);
      
      const createResponse = await this.docs.documents.create({
        requestBody: {
          title: documentTitle
        }
      });

      const documentId = createResponse.data.documentId;
      
      if (!documentId) {
        throw new Error('Failed to create document');
      }

      // Build document content
      const requests = await this.buildDocumentRequests(narrative);

      // Apply content to document
      if (requests.length > 0) {
        await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests
          }
        });
      }

      // Apply professional styling
      await this.applyDefaultStyling(documentId);

      // Make document shareable
      await this.makeDocumentShareable(documentId);

      const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

      this.logger.info(`Created document: ${documentUrl}`);
      return { 
        content: { 
          documentUrl,
          documentId
        } 
      };

    } catch (error) {
      this.logger.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  /**
   * Apply styling to a Google Doc
   */
  private async applyStyling(
    documentId: string,
    styling?: DocumentStyling
  ): Promise<{ content: { success: boolean } }> {
    this.logger.info(`Applying styling to document: ${documentId}`);

    try {
      if (!this.docs) {
        this.logger.warn('Google APIs not configured, skipping styling');
        return { content: { success: false } };
      }

      const stylingRequests = this.buildStylingRequests(styling);

      if (stylingRequests.length > 0) {
        await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: stylingRequests
          }
        });
      }

      return { content: { success: true } };

    } catch (error) {
      this.logger.error('Error applying styling:', error);
      throw new Error(`Failed to apply styling: ${error.message}`);
    }
  }

  /**
   * Export document in specified format
   */
  private async exportDocument(
    documentId: string,
    format: string
  ): Promise<{ content: { exportUrl: string } }> {
    this.logger.info(`Exporting document ${documentId} as ${format}`);

    try {
      if (!this.drive) {
        const mockUrl = `https://docs.google.com/document/d/${documentId}/export?format=${format}`;
        return { content: { exportUrl: mockUrl } };
      }

      let mimeType: string;
      switch (format) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'html':
          mimeType = 'text/html';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=${format}`;

      return { content: { exportUrl } };

    } catch (error) {
      this.logger.error('Error exporting document:', error);
      throw new Error(`Failed to export document: ${error.message}`);
    }
  }

  /**
   * Generate document title from narrative
   */
  private generateDocumentTitle(narrative: ProposalNarrative): string {
    const currentDate = new Date().toLocaleDateString();
    const audience = narrative.targetAudience || 'Client';
    
    return `Business Proposal - ${audience} - ${currentDate}`;
  }

  /**
   * Build document content requests
   */
  private async buildDocumentRequests(narrative: ProposalNarrative): Promise<any[]> {
    const requests: any[] = [];
    let currentIndex = 1; // Start after title

    // Sort sections by order
    const sortedSections = narrative.sections.sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      // Add section heading
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `\n\n${section.title}\n\n`
        }
      });
      currentIndex += section.title.length + 4;

      // Add section content
      const formattedContent = this.formatSectionContent(section.content);
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: formattedContent + '\n'
        }
      });
      currentIndex += formattedContent.length + 1;
    }

    return requests;
  }

  /**
   * Format section content for Google Docs
   */
  private formatSectionContent(content: string): string {
    // Clean up content and ensure proper formatting
    return content
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold (will be styled later)
      .replace(/\*(.*?)\*/g, '$1'); // Remove markdown italic (will be styled later)
  }

  /**
   * Apply default professional styling
   */
  private async applyDefaultStyling(documentId: string): Promise<void> {
    if (!this.docs) return;

    const stylingRequests = [
      // Set document margins
      {
        updateDocumentStyle: {
          documentStyle: {
            marginTop: { magnitude: 72, unit: 'PT' },
            marginBottom: { magnitude: 72, unit: 'PT' },
            marginLeft: { magnitude: 72, unit: 'PT' },
            marginRight: { magnitude: 72, unit: 'PT' }
          },
          fields: 'marginTop,marginBottom,marginLeft,marginRight'
        }
      },
      // Set default font
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: -1 },
          textStyle: {
            fontFamily: 'Arial',
            fontSize: { magnitude: 11, unit: 'PT' }
          },
          fields: 'fontFamily,fontSize'
        }
      }
    ];

    try {
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: stylingRequests
        }
      });
    } catch (error) {
      this.logger.error('Error applying default styling:', error);
    }
  }

  /**
   * Build styling requests from styling configuration
   */
  private buildStylingRequests(styling?: DocumentStyling): any[] {
    if (!styling) return [];

    const requests: any[] = [];

    // Apply header styling
    if (styling.headerStyle) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: 1, endIndex: -1 },
          textStyle: {
            fontSize: { magnitude: styling.headerStyle.fontSize, unit: 'PT' },
            bold: styling.headerStyle.fontWeight === 'bold'
          },
          fields: 'fontSize,bold'
        }
      });
    }

    // Apply font family
    if (styling.fontFamily) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: 1, endIndex: -1 },
          textStyle: {
            fontFamily: styling.fontFamily
          },
          fields: 'fontFamily'
        }
      });
    }

    return requests;
  }

  /**
   * Make document shareable
   */
  private async makeDocumentShareable(documentId: string): Promise<void> {
    if (!this.drive) return;

    try {
      await this.drive.permissions.create({
        fileId: documentId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (error) {
      this.logger.warn('Could not make document publicly shareable:', error);
      // Continue without making it public - document will still be accessible to creator
    }
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Document Assembly Server started and listening...');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new DocumentAssemblyServer();
  server.start().catch((error) => {
    console.error('Failed to start Document Assembly Server:', error);
    process.exit(1);
  });
}
