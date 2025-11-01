#!/usr/bin/env node
/**
 * Google MCP Server - STDIO Transport
 * Main entry point for running the MCP server with stdio transport
 * 
 * This is used when connecting from local MCP clients like Claude Desktop
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { validateGoogleMcpConfig } from './config.js';
import { log } from './utils/logger.js';

// Import tool functions
import * as calendarTools from './tools/calendar.js';
import * as gmailTools from './tools/gmail.js';

// Server information
const SERVER_INFO = {
  name: 'google-mcp-server',
  version: '1.0.0',
  description: 'Google Workspace MCP Server - Gmail and Calendar integration for AI agents',
};

/**
 * Setup MCP server with tools
 */
function setupServer(server: Server): void {
  // Calendar tools
  server.setRequestHandler(
    { method: 'tools/list' },
    async () => ({
      tools: [
        // Calendar tools
        {
          name: 'list_calendar_events',
          description: 'List upcoming calendar events with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: {
                type: 'number',
                description: 'Maximum number of events to return (default: 10)',
              },
              timeMin: {
                type: 'string',
                description: 'Start time in ISO 8601 format (default: now)',
              },
              timeMax: {
                type: 'string',
                description: 'End time in ISO 8601 format',
              },
              query: {
                type: 'string',
                description: 'Text search query',
              },
            },
          },
        },
        {
          name: 'get_calendar_event',
          description: 'Get details of a specific calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'Calendar event ID',
              },
            },
            required: ['eventId'],
          },
        },
        {
          name: 'create_calendar_event',
          description: 'Create a new calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'Event title/summary',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              location: {
                type: 'string',
                description: 'Event location',
              },
              startTime: {
                type: 'string',
                description: 'Start time in ISO 8601 format',
              },
              endTime: {
                type: 'string',
                description: 'End time in ISO 8601 format',
              },
              attendees: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of attendee email addresses',
              },
              timeZone: {
                type: 'string',
                description: 'Time zone (default: Europe/Copenhagen)',
              },
            },
            required: ['summary', 'startTime', 'endTime'],
          },
        },
        {
          name: 'update_calendar_event',
          description: 'Update an existing calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'Calendar event ID to update',
              },
              summary: {
                type: 'string',
                description: 'New event title/summary',
              },
              description: {
                type: 'string',
                description: 'New event description',
              },
              location: {
                type: 'string',
                description: 'New event location',
              },
              startTime: {
                type: 'string',
                description: 'New start time in ISO 8601 format',
              },
              endTime: {
                type: 'string',
                description: 'New end time in ISO 8601 format',
              },
              attendees: {
                type: 'array',
                items: { type: 'string' },
                description: 'New list of attendee email addresses',
              },
            },
            required: ['eventId'],
          },
        },
        {
          name: 'delete_calendar_event',
          description: 'Delete a calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'Calendar event ID to delete',
              },
            },
            required: ['eventId'],
          },
        },
        {
          name: 'check_calendar_conflicts',
          description: 'Check for calendar conflicts in a time range',
          inputSchema: {
            type: 'object',
            properties: {
              startTime: {
                type: 'string',
                description: 'Start time in ISO 8601 format',
              },
              endTime: {
                type: 'string',
                description: 'End time in ISO 8601 format',
              },
              excludeEventId: {
                type: 'string',
                description: 'Event ID to exclude from conflict check',
              },
            },
            required: ['startTime', 'endTime'],
          },
        },
        // Gmail tools
        {
          name: 'list_emails',
          description: 'List recent emails with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: {
                type: 'number',
                description: 'Maximum number of emails to return (default: 10)',
              },
              query: {
                type: 'string',
                description: 'Gmail search query (e.g., "from:user@example.com")',
              },
              labelIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by label IDs (e.g., ["INBOX", "UNREAD"])',
              },
              pageToken: {
                type: 'string',
                description: 'Page token for pagination',
              },
            },
          },
        },
        {
          name: 'get_email',
          description: 'Get details of a specific email',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'Gmail message ID',
              },
            },
            required: ['messageId'],
          },
        },
        {
          name: 'search_emails',
          description: 'Search emails using Gmail search syntax',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Gmail search query',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum results (default: 20)',
              },
              labelIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by label IDs',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'send_email',
          description: 'Send an email',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                oneOf: [
                  { type: 'string' },
                  { type: 'array', items: { type: 'string' } },
                ],
                description: 'Recipient email address(es)',
              },
              subject: {
                type: 'string',
                description: 'Email subject',
              },
              body: {
                type: 'string',
                description: 'Email body',
              },
              cc: {
                oneOf: [
                  { type: 'string' },
                  { type: 'array', items: { type: 'string' } },
                ],
                description: 'CC recipients',
              },
              bcc: {
                oneOf: [
                  { type: 'string' },
                  { type: 'array', items: { type: 'string' } },
                ],
                description: 'BCC recipients',
              },
              replyTo: {
                type: 'string',
                description: 'Reply-to address',
              },
              isHtml: {
                type: 'boolean',
                description: 'Whether body is HTML (default: false)',
              },
            },
            required: ['to', 'subject', 'body'],
          },
        },
        {
          name: 'get_email_labels',
          description: 'Get all email labels',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'mark_email_as_read',
          description: 'Mark an email as read',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'Gmail message ID',
              },
            },
            required: ['messageId'],
          },
        },
      ],
    })
  );

  // Handle tool calls
  server.setRequestHandler(
    { method: 'tools/call' },
    async (request: any) => {
      const { name, arguments: args } = request.params;
      
      try {
        log.info('Tool called', { name, args });
        
        let result: any;
        
        // Calendar tools
        if (name === 'list_calendar_events') {
          result = await calendarTools.listCalendarEvents(args);
        } else if (name === 'get_calendar_event') {
          result = await calendarTools.getCalendarEvent(args);
        } else if (name === 'create_calendar_event') {
          result = await calendarTools.createCalendarEvent(args);
        } else if (name === 'update_calendar_event') {
          result = await calendarTools.updateCalendarEvent(args);
        } else if (name === 'delete_calendar_event') {
          result = await calendarTools.deleteCalendarEvent(args);
        } else if (name === 'check_calendar_conflicts') {
          result = await calendarTools.checkCalendarConflicts(args);
        }
        // Gmail tools
        else if (name === 'list_emails') {
          result = await gmailTools.listEmails(args);
        } else if (name === 'get_email') {
          result = await gmailTools.getEmailById(args);
        } else if (name === 'search_emails') {
          result = await gmailTools.searchEmails(args);
        } else if (name === 'send_email') {
          result = await gmailTools.sendEmail(args);
        } else if (name === 'get_email_labels') {
          result = await gmailTools.getEmailLabels();
        } else if (name === 'mark_email_as_read') {
          result = await gmailTools.markEmailAsRead(args);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
        
        log.info('Tool executed successfully', { name });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        log.error('Tool execution failed', {
          name,
          error: error instanceof Error ? error.message : String(error),
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Main function
 */
async function main() {
  try {
    // Validate configuration
    validateGoogleMcpConfig();
    
    // Create server
    const server = new Server(SERVER_INFO, {
      capabilities: {
        tools: {},
      },
    });
    
    // Setup tools
    setupServer(server);
    
    // Connect using stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    log.info('Google MCP Server started with STDIO transport');
  } catch (error) {
    log.error('Failed to start Google MCP Server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run main function
main();
