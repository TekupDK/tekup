/**
 * Gmail Tools
 * MCP tools for interacting with Gmail API
 */

import { gmail_v1 } from 'googleapis';
import { getGmailClient } from '../utils/google-auth.js';
import { getGoogleMcpConfig } from '../config.js';
import { log, logError } from '../utils/logger.js';
import {
  GmailMessage,
  SendEmailParams,
  SearchEmailParams,
} from '../types.js';

/**
 * List recent emails
 */
export async function listEmails(args: {
  maxResults?: number;
  query?: string;
  labelIds?: string[];
  pageToken?: string;
}): Promise<{
  messages: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}> {
  try {
    const gmail = getGmailClient();
    
    const params: gmail_v1.Params$Resource$Users$Messages$List = {
      userId: 'me',
      maxResults: args.maxResults || 10,
    };
    
    if (args.query) {
      params.q = args.query;
    }
    
    if (args.labelIds && args.labelIds.length > 0) {
      params.labelIds = args.labelIds;
    }
    
    if (args.pageToken) {
      params.pageToken = args.pageToken;
    }
    
    log.info('Listing emails', params);
    
    const { data } = await gmail.users.messages.list(params);
    
    // Get full message details for each message
    const messages: GmailMessage[] = [];
    if (data.messages) {
      for (const msg of data.messages) {
        try {
          const fullMessage = await getEmailById({ messageId: msg.id! });
          messages.push(fullMessage);
        } catch (error) {
          log.warn('Failed to fetch message details', { messageId: msg.id });
        }
      }
    }
    
    log.info('Emails retrieved', { count: messages.length });
    
    return {
      messages,
      nextPageToken: data.nextPageToken || undefined,
      resultSizeEstimate: data.resultSizeEstimate || undefined,
    };
  } catch (error) {
    logError('Failed to list emails', error);
    throw error;
  }
}

/**
 * Get a specific email by ID
 */
export async function getEmailById(args: {
  messageId: string;
}): Promise<GmailMessage> {
  try {
    const gmail = getGmailClient();
    
    log.info('Getting email', { messageId: args.messageId });
    
    const { data } = await gmail.users.messages.get({
      userId: 'me',
      id: args.messageId,
      format: 'full',
    });
    
    return mapGmailMessageToMessage(data);
  } catch (error) {
    logError('Failed to get email', error);
    throw error;
  }
}

/**
 * Search emails
 */
export async function searchEmails(
  args: SearchEmailParams
): Promise<{
  messages: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}> {
  try {
    const gmail = getGmailClient();
    
    const params: gmail_v1.Params$Resource$Users$Messages$List = {
      userId: 'me',
      q: args.query,
      maxResults: args.maxResults || 20,
    };
    
    if (args.labelIds && args.labelIds.length > 0) {
      params.labelIds = args.labelIds;
    }
    
    if (args.pageToken) {
      params.pageToken = args.pageToken;
    }
    
    log.info('Searching emails', { query: args.query });
    
    const { data } = await gmail.users.messages.list(params);
    
    // Get full message details for each result
    const messages: GmailMessage[] = [];
    if (data.messages) {
      for (const msg of data.messages.slice(0, args.maxResults || 20)) {
        try {
          const fullMessage = await getEmailById({ messageId: msg.id! });
          messages.push(fullMessage);
        } catch (error) {
          log.warn('Failed to fetch message details', { messageId: msg.id });
        }
      }
    }
    
    log.info('Email search completed', {
      query: args.query,
      count: messages.length,
    });
    
    return {
      messages,
      nextPageToken: data.nextPageToken || undefined,
      resultSizeEstimate: data.resultSizeEstimate || undefined,
    };
  } catch (error) {
    logError('Failed to search emails', error);
    throw error;
  }
}

/**
 * Send an email
 */
export async function sendEmail(args: SendEmailParams): Promise<{
  success: boolean;
  messageId: string;
  threadId: string;
}> {
  try {
    const gmail = getGmailClient();
    const config = getGoogleMcpConfig();
    
    // Build email message
    const to = Array.isArray(args.to) ? args.to.join(', ') : args.to;
    const cc = args.cc ? (Array.isArray(args.cc) ? args.cc.join(', ') : args.cc) : '';
    const bcc = args.bcc ? (Array.isArray(args.bcc) ? args.bcc.join(', ') : args.bcc) : '';
    
    const messageParts = [
      `From: ${config.google.impersonatedUser}`,
      `To: ${to}`,
    ];
    
    if (cc) {
      messageParts.push(`Cc: ${cc}`);
    }
    
    if (bcc) {
      messageParts.push(`Bcc: ${bcc}`);
    }
    
    if (args.replyTo) {
      messageParts.push(`Reply-To: ${args.replyTo}`);
    }
    
    messageParts.push(`Subject: ${args.subject}`);
    
    if (args.isHtml) {
      messageParts.push('Content-Type: text/html; charset=utf-8');
    } else {
      messageParts.push('Content-Type: text/plain; charset=utf-8');
    }
    
    messageParts.push('');
    messageParts.push(args.body);
    
    const message = messageParts.join('\n');
    
    // Encode message in base64url
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    log.info('Sending email', {
      to,
      subject: args.subject,
      isHtml: args.isHtml || false,
    });
    
    const { data } = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    log.info('Email sent successfully', {
      messageId: data.id,
      threadId: data.threadId,
    });
    
    return {
      success: true,
      messageId: data.id!,
      threadId: data.threadId!,
    };
  } catch (error) {
    logError('Failed to send email', error);
    throw error;
  }
}

/**
 * Get email labels
 */
export async function getEmailLabels(): Promise<Array<{
  id: string;
  name: string;
  type: string;
}>> {
  try {
    const gmail = getGmailClient();
    
    log.info('Getting email labels');
    
    const { data } = await gmail.users.labels.list({
      userId: 'me',
    });
    
    const labels = (data.labels || []).map(label => ({
      id: label.id!,
      name: label.name!,
      type: label.type!,
    }));
    
    log.info('Email labels retrieved', { count: labels.length });
    
    return labels;
  } catch (error) {
    logError('Failed to get email labels', error);
    throw error;
  }
}

/**
 * Mark email as read
 */
export async function markEmailAsRead(args: {
  messageId: string;
}): Promise<{ success: boolean }> {
  try {
    const gmail = getGmailClient();
    
    log.info('Marking email as read', { messageId: args.messageId });
    
    await gmail.users.messages.modify({
      userId: 'me',
      id: args.messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
    
    log.info('Email marked as read', { messageId: args.messageId });
    
    return { success: true };
  } catch (error) {
    logError('Failed to mark email as read', error);
    throw error;
  }
}

/**
 * Helper function to map Gmail message to our GmailMessage type
 */
function mapGmailMessageToMessage(msg: gmail_v1.Schema$Message): GmailMessage {
  // Extract headers
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || undefined;
  
  return {
    id: msg.id!,
    threadId: msg.threadId!,
    labelIds: msg.labelIds || undefined,
    snippet: msg.snippet || undefined,
    payload: msg.payload as any,
    internalDate: msg.internalDate || undefined,
    from: getHeader('from'),
    to: getHeader('to'),
    subject: getHeader('subject'),
    date: getHeader('date'),
  };
}
