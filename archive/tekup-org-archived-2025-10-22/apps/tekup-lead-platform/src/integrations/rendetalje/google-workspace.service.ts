import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-tekup-lead-platform-src-i');

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: { filename: string; content: string; mimeType: string }[];
}

export interface SLAAction {
  leadId: string;
  action: 'immediate_contact' | 'schedule_follow_up' | 'nurture_sequence' | 'escalate';
  priority: 'high' | 'medium' | 'low';
  dueAt: Date;
  completedAt?: Date;
}

@Injectable()
export class GoogleWorkspaceService {
  private gmail: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Initialize Google Auth with service account or OAuth2
      this.auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
        scopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels',
          'https://www.googleapis.com/auth/calendar',
        ],
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    } catch (error) {
      logger.error('Failed to initialize Google Workspace auth:', error);
    }
  }

  /**
   * Send email via Gmail API
   */
  async sendEmail(message: EmailMessage): Promise<{ messageId: string; success: boolean }> {
    try {
      const emailContent = this.createEmailContent(message);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(emailContent).toString('base64url'),
        },
      });

      return {
        messageId: response.data.id,
        success: true,
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Read emails from Gmail inbox
   */
  async readEmails(query?: string, maxResults: number = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query || 'is:unread',
        maxResults,
      });

      const messages = response.data.messages || [];
      const emailDetails = [];

      for (const message of messages) {
        const messageDetail = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        emailDetails.push(this.parseEmailMessage(messageDetail.data));
      }

      return emailDetails;
    } catch (error) {
      logger.error('Failed to read emails:', error);
      throw new Error(`Email reading failed: ${error.message}`);
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });

      return true;
    } catch (error) {
      logger.error('Failed to mark email as read:', error);
      return false;
    }
  }

  /**
   * Create email content in RFC 2822 format
   */
  private createEmailContent(message: EmailMessage): string {
    const lines = [
      `To: ${message.to}`,
      `From: ${message.from || 'info@rendetalje.dk'}`,
      `Subject: ${message.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      message.body,
    ];

    if (message.cc && message.cc.length > 0) {
      lines.splice(2, 0, `Cc: ${message.cc.join(', ')}`);
    }

    if (message.bcc && message.bcc.length > 0) {
      lines.splice(message.cc ? 3 : 2, 0, `Bcc: ${message.bcc.join(', ')}`);
    }

    return lines.join('\r\n');
  }

  /**
   * Parse Gmail message data
   */
  private parseEmailMessage(messageData: any) {
    const headers = messageData.payload.headers;
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    if (messageData.payload.body?.data) {
      body = Buffer.from(messageData.payload.body.data, 'base64').toString();
    } else if (messageData.payload.parts) {
      // Handle multipart messages
      const textPart = messageData.payload.parts.find((part: any) => 
        part.mimeType === 'text/plain'
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    return {
      id: messageData.id,
      threadId: messageData.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      body: body.trim(),
      snippet: messageData.snippet,
      labelIds: messageData.labelIds || [],
    };
  }

  /**
   * Search for specific emails
   */
  async searchEmails(searchQuery: string) {
    return this.readEmails(searchQuery, 50);
  }

  /**
   * Get unread lead emails
   */
  async getUnreadLeadEmails() {
    const queries = [
      'from:leadpoint.dk is:unread',
      'from:leadmail.no is:unread',
      'from:3match.dk is:unread',
      'subject:"nyt lead" is:unread',
      'subject:"ny henvendelse" is:unread',
    ];

    const allEmails = [];
    
    for (const query of queries) {
      try {
        const emails = await this.readEmails(query, 20);
        allEmails.push(...emails);
      } catch (error) {
        logger.error(`Failed to search with query "${query}":`, error);
      }
    }

    // Remove duplicates based on message ID
    const uniqueEmails = allEmails.filter((email, index, self) => 
      index === self.findIndex(e => e.id === email.id)
    );

    return uniqueEmails;
  }

  /**
   * Apply Gmail label to message based on lead action
   */
  async applyLeadLabel(messageId: string, nextAction: string): Promise<boolean> {
    try {
      const labelMap = {
        'immediate_contact': 'HOT_LEAD',
        'schedule_follow_up': 'WARM_LEAD', 
        'nurture_sequence': 'COLD_LEAD',
        'disqualify': 'UNQUALIFIED',
      };

      const labelName = labelMap[nextAction] || 'NEEDS_REVIEW';
      
      // First ensure label exists
      const labelId = await this.ensureLabelExists(labelName);
      
      // Apply label to message
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });

      return true;
    } catch (error) {
      logger.error('Failed to apply Gmail label:', error);
      return false;
    }
  }

  /**
   * Create SLA-based action and set reminder
   */
  async createSLAAction(slaAction: SLAAction): Promise<boolean> {
    try {
      const urgencyHours = {
        'immediate_contact': 2,    // 2 hours for hot leads
        'schedule_follow_up': 24,  // 24 hours for warm leads
        'nurture_sequence': 72,    // 72 hours for cold leads
        'escalate': 4,             // 4 hours for escalations
      };

      const hours = urgencyHours[slaAction.action] || 24;
      const dueDate = new Date(Date.now() + hours * 60 * 60 * 1000);

      // Create calendar reminder for SLA action
      const event = {
        summary: `SLA: ${slaAction.action} for Lead ${slaAction.leadId}`,
        description: `Priority: ${slaAction.priority}\nAction: ${slaAction.action}\nLead: ${slaAction.leadId}`,
        start: {
          dateTime: dueDate.toISOString(),
          timeZone: 'Europe/Copenhagen',
        },
        end: {
          dateTime: new Date(dueDate.getTime() + 30 * 60 * 1000).toISOString(), // 30 min
          timeZone: 'Europe/Copenhagen',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 0 },
          ],
        },
        colorId: slaAction.priority === 'high' ? '11' : slaAction.priority === 'medium' ? '5' : '2', // Red, Yellow, Green
      };

      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        requestBody: event,
      });

      return true;
    } catch (error) {
      logger.error('Failed to create SLA action:', error);
      return false;
    }
  }

  /**
   * Send email with ICS attachment
   */
  async sendEmailWithAttachment(message: EmailMessage): Promise<{ messageId: string; success: boolean }> {
    try {
      const emailContent = this.createEmailContentWithAttachments(message);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(emailContent).toString('base64url'),
        },
      });

      return {
        messageId: response.data.id,
        success: true,
      };
    } catch (error) {
      logger.error('Failed to send email with attachment:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  private async ensureLabelExists(labelName: string): Promise<string> {
    try {
      // Get existing labels
      const labelsResponse = await this.gmail.users.labels.list({
        userId: 'me',
      });

      const existingLabel = labelsResponse.data.labels?.find(
        (label: any) => label.name === labelName
      );

      if (existingLabel) {
        return existingLabel.id;
      }

      // Create new label
      const createResponse = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          messageListVisibility: 'show',
          labelListVisibility: 'labelShow',
        },
      });

      return createResponse.data.id;
    } catch (error) {
      logger.error('Failed to ensure label exists:', error);
      throw error;
    }
  }

  private createEmailContentWithAttachments(message: EmailMessage): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;
    
    let content = [
      `To: ${message.to}`,
      `From: ${message.from || 'info@rendetalje.dk'}`,
      `Subject: ${message.subject}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      message.body,
    ];

    // Add attachments
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        content.push(
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          attachment.content,
        );
      }
    }

    content.push(`--${boundary}--`);
    return content.join('\r\n');
  }
}
