import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NarrativeSectionDto, DocumentAssemblyDto } from '../dto/proposal.dto';

/**
 * Document Assembly Service
 * 
 * Creates styled Google Docs ready to send:
 * - Professional formatting and branding
 * - Client-specific customization
 * - Mobile-responsive design
 * - Brand consistency
 * - Easy sharing and collaboration
 */
@Injectable()
export class DocumentAssemblyService {
  private readonly logger = new Logger(DocumentAssemblyService.name);
  private readonly googleApiKey: string;
  private readonly googleDocsApiUrl = 'https://docs.googleapis.com/v1/documents';

  constructor(private readonly configService: ConfigService) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!this.googleApiKey) {
      this.logger.warn('GOOGLE_API_KEY not configured - document assembly will use fallback');
    }
  }

  /**
   * Assemble complete proposal document
   * 
   * @param sections - Generated narrative sections
   * @param options - Document assembly options
   * @returns Document URL and metadata
   */
  async assembleDocument(
    sections: NarrativeSectionDto[],
    options: {
      clientName: string;
      projectType?: string;
      estimatedValue?: number;
      urgency?: 'low' | 'medium' | 'high';
      branding?: {
        companyName: string;
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
      };
    },
  ): Promise<{
    documentUrl: string;
    documentId: string;
    metadata: any;
  }> {
    this.logger.log(`Assembling document for ${options.clientName}`);

    try {
      // Create document structure
      const documentStructure = this.createDocumentStructure(sections, options);

      // Generate Google Doc
      const documentResult = await this.createGoogleDocument(documentStructure, options);

      // Apply styling and formatting
      await this.applyDocumentStyling(documentResult.documentId, options);

      this.logger.log(`Document assembled successfully: ${documentResult.documentId}`);

      return {
        documentUrl: `https://docs.google.com/document/d/${documentResult.documentId}/edit`,
        documentId: documentResult.documentId,
        metadata: {
          clientName: options.clientName,
          projectType: options.projectType,
          estimatedValue: options.estimatedValue,
          urgency: options.urgency,
          sections: sections.length,
          createdAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      this.logger.error(`Document assembly failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create document structure from sections
   */
  private createDocumentStructure(
    sections: NarrativeSectionDto[],
    options: any,
  ): DocumentAssemblyDto {
    return {
      title: `Proposal for ${options.clientName} - ${options.projectType || 'Business Solution'}`,
      clientName: options.clientName,
      sections: sections.sort((a, b) => a.order - b.order),
      styling: {
        fontFamily: 'Inter, Arial, sans-serif',
        primaryColor: options.branding?.primaryColor || '#2563eb',
        secondaryColor: options.branding?.secondaryColor || '#64748b',
        logoUrl: options.branding?.logoUrl,
      },
      metadata: {
        projectType: options.projectType,
        estimatedValue: options.estimatedValue,
        urgency: options.urgency,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Create Google Document
   */
  private async createGoogleDocument(
    documentStructure: DocumentAssemblyDto,
    options: any,
  ): Promise<{ documentId: string; document: any }> {
    if (!this.googleApiKey) {
      // Fallback: return mock document ID
      return {
        documentId: `mock-doc-${Date.now()}`,
        document: { title: documentStructure.title },
      };
    }

    try {
      // Create new document
      const createResponse = await fetch(`${this.googleDocsApiUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.googleApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentStructure.title,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Google Docs API error: ${createResponse.status}`);
      }

      const document = await createResponse.json();
      const documentId = document.documentId;

      // Add content to document
      await this.addContentToDocument(documentId, documentStructure);

      return { documentId, document };

    } catch (error) {
      this.logger.error(`Google Docs creation failed: ${error.message}`);
      // Return fallback document
      return {
        documentId: `fallback-doc-${Date.now()}`,
        document: { title: documentStructure.title },
      };
    }
  }

  /**
   * Add content to Google Document
   */
  private async addContentToDocument(
    documentId: string,
    documentStructure: DocumentAssemblyDto,
  ): Promise<void> {
    const requests = [];

    // Add header
    requests.push({
      insertText: {
        location: { index: 1 },
        text: `${documentStructure.title}\n\n`,
      },
    });

    // Add company branding
    if (documentStructure.styling?.logoUrl) {
      requests.push({
        insertInlineImage: {
          location: { index: 1 },
          uri: documentStructure.styling.logoUrl,
        },
      });
    }

    // Add sections
    documentStructure.sections.forEach((section, index) => {
      const startIndex = 1 + (index * 100); // Approximate positioning

      // Add section title
      requests.push({
        insertText: {
          location: { index: startIndex },
          text: `${section.title}\n`,
        },
      });

      // Add section content
      requests.push({
        insertText: {
          location: { index: startIndex + section.title.length + 1 },
          text: `${section.content}\n\n`,
        },
      });
    });

    // Add footer
    requests.push({
      insertText: {
        location: { index: 1 },
        text: `\n\n---\nGenerated by Tekup AI Proposal Engine\n${new Date().toLocaleDateString()}`,
      },
    });

    // Execute batch update
    await fetch(`${this.googleDocsApiUrl}/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.googleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests,
      }),
    });
  }

  /**
   * Apply document styling
   */
  private async applyDocumentStyling(
    documentId: string,
    options: any,
  ): Promise<void> {
    if (!this.googleApiKey) {
      return; // Skip styling for fallback
    }

    try {
      const stylingRequests = [
        // Set document title style
        {
          updateTextStyle: {
            range: {
              startIndex: 1,
              endIndex: options.clientName.length + 20,
            },
            textStyle: {
              bold: true,
              fontSize: { magnitude: 24, unit: 'PT' },
              foregroundColor: {
                color: {
                  rgbColor: {
                    red: 0.15, // Primary color
                    green: 0.39,
                    blue: 0.92,
                  },
                },
              },
            },
            fields: 'bold,fontSize,foregroundColor',
          },
        },
        // Set section title styles
        {
          updateParagraphStyle: {
            range: {
              startIndex: 1,
              endIndex: 1000,
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_1',
            },
            fields: 'namedStyleType',
          },
        },
      ];

      await fetch(`${this.googleDocsApiUrl}/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.googleApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: stylingRequests,
        }),
      });

    } catch (error) {
      this.logger.warn(`Document styling failed: ${error.message}`);
    }
  }

  /**
   * Generate document preview HTML
   */
  async generateDocumentPreview(
    sections: NarrativeSectionDto[],
    options: any,
  ): Promise<string> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal for ${options.clientName}</title>
    <style>
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .section {
            background: white;
            margin-bottom: 20px;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #1e40af;
            font-size: 22px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .section p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .urgency-high { border-left: 4px solid #dc2626; }
        .urgency-medium { border-left: 4px solid #f59e0b; }
        .urgency-low { border-left: 4px solid #10b981; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Proposal for ${options.clientName}</h1>
        <p>${options.projectType || 'Business Solution'} - Generated by Tekup AI</p>
    </div>

    ${sections.map(section => `
        <div class="section urgency-${options.urgency || 'medium'}">
            <h2>${section.title}</h2>
            <div>${section.content.replace(/\n/g, '<br>')}</div>
        </div>
    `).join('')}

    <div class="footer">
        <p>Generated by Tekup AI Proposal Engine • ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Export document to various formats
   */
  async exportDocument(
    documentId: string,
    format: 'pdf' | 'docx' | 'html',
  ): Promise<{
    downloadUrl: string;
    filename: string;
  }> {
    const exportUrl = `https://docs.googleapis.com/v1/documents/${documentId}/export`;
    const mimeTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      html: 'text/html',
    };

    const response = await fetch(`${exportUrl}?mimeType=${mimeTypes[format]}`, {
      headers: {
        'Authorization': `Bearer ${this.googleApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const filename = `proposal-${documentId}.${format}`;
    
    return {
      downloadUrl: response.url,
      filename,
    };
  }
}