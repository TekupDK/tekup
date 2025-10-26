/**
 * MCP (Model Context Protocol) Service for Jarvis
 * Integrates with Zapier MCP for Gmail, Calendar, and automation tools
 */

import { EventEmitter } from 'events';

interface MCPTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface ZapierConfig {
  apiUrl: string;
  authToken: string;
}

export class MCPService extends EventEmitter {
  private zapierConfig: ZapierConfig;
  private availableTools: Map<string, MCPTool>;
  private isConnected: boolean = false;

  constructor() {
    super();
    this.zapierConfig = {
      apiUrl: 'https://mcp.zapier.com/api/mcp/mcp',
      authToken: 'Bearer ZDNiNzU4YzQtNzk3OC00OTA5LTlhYjgtYzdkNTI0YTE2NjQyOmZjY2JiMzZlLTgwZDQtNGZmMi05ZjJlLTEyYjFjMjljYWFhMw=='
    };
    this.availableTools = new Map();
    this.initializeTools();
  }

  private initializeTools() {
    // Gmail tools
    this.registerTool({
      name: 'gmail_find_email',
      description: 'Find email in Gmail',
      parameters: { query: '', limit: 10 }
    });
    this.registerTool({
      name: 'gmail_send_email',
      description: 'Send email via Gmail',
      parameters: { to: '', subject: '', body: '', cc: '', bcc: '' }
    });
    this.registerTool({
      name: 'gmail_create_draft',
      description: 'Create draft email',
      parameters: { to: '', subject: '', body: '' }
    });
    this.registerTool({
      name: 'gmail_reply_to_email',
      description: 'Reply to email',
      parameters: { emailId: '', body: '' }
    });
    this.registerTool({
      name: 'gmail_add_label',
      description: 'Add label to email',
      parameters: { emailId: '', label: '' }
    });
    this.registerTool({
      name: 'gmail_archive_email',
      description: 'Archive email',
      parameters: { emailId: '' }
    });

    // Google Calendar tools
    this.registerTool({
      name: 'calendar_create_detailed_event',
      description: 'Create detailed calendar event',
      parameters: { title: '', start: '', end: '', description: '', location: '', attendees: [] }
    });
    this.registerTool({
      name: 'calendar_find_events',
      description: 'Find calendar events',
      parameters: { timeMin: '', timeMax: '', query: '' }
    });
    this.registerTool({
      name: 'calendar_update_event',
      description: 'Update calendar event',
      parameters: { eventId: '', updates: {} }
    });
    this.registerTool({
      name: 'calendar_delete_event',
      description: 'Delete calendar event',
      parameters: { eventId: '' }
    });
    this.registerTool({
      name: 'calendar_quick_add_event',
      description: 'Quick add calendar event',
      parameters: { text: '' }
    });
    this.registerTool({
      name: 'calendar_find_busy_periods',
      description: 'Find busy periods in calendar',
      parameters: { timeMin: '', timeMax: '' }
    });

    // Google Drive tools
    this.registerTool({
      name: 'drive_find_file',
      description: 'Find file in Google Drive',
      parameters: { query: '', mimeType: '' }
    });
    this.registerTool({
      name: 'drive_find_folder',
      description: 'Find folder in Google Drive',
      parameters: { name: '' }
    });
    this.registerTool({
      name: 'drive_create_file_from_text',
      description: 'Create file from text',
      parameters: { name: '', content: '', folderId: '' }
    });
    this.registerTool({
      name: 'drive_create_folder',
      description: 'Create folder in Drive',
      parameters: { name: '', parentId: '' }
    });
    this.registerTool({
      name: 'drive_copy_file',
      description: 'Copy file',
      parameters: { fileId: '', newName: '' }
    });
    this.registerTool({
      name: 'drive_move_file',
      description: 'Move file',
      parameters: { fileId: '', folderId: '' }
    });
    this.registerTool({
      name: 'drive_delete_file',
      description: 'Delete file',
      parameters: { fileId: '' }
    });
    this.registerTool({
      name: 'drive_share_file',
      description: 'Share file',
      parameters: { fileId: '', email: '', role: 'viewer' }
    });

    // Google Sheets tools
    this.registerTool({
      name: 'sheets_create_spreadsheet',
      description: 'Create new spreadsheet',
      parameters: { title: '' }
    });
    this.registerTool({
      name: 'sheets_add_row',
      description: 'Add row to spreadsheet',
      parameters: { spreadsheetId: '', values: [] }
    });
    this.registerTool({
      name: 'sheets_update_cell',
      description: 'Update cell value',
      parameters: { spreadsheetId: '', cell: '', value: '' }
    });
    this.registerTool({
      name: 'sheets_read_range',
      description: 'Read range from spreadsheet',
      parameters: { spreadsheetId: '', range: '' }
    });

    // Slack tools
    this.registerTool({
      name: 'slack_send_message',
      description: 'Send Slack message',
      parameters: { channel: '', text: '' }
    });
    this.registerTool({
      name: 'slack_create_channel',
      description: 'Create Slack channel',
      parameters: { name: '', isPrivate: false }
    });

    // Airtable tools
    this.registerTool({
      name: 'airtable_create_record',
      description: 'Create Airtable record',
      parameters: { baseId: '', tableId: '', fields: {} }
    });
    this.registerTool({
      name: 'airtable_find_records',
      description: 'Find Airtable records',
      parameters: { baseId: '', tableId: '', filterByFormula: '' }
    });

    // Facebook Pages tools
    this.registerTool({
      name: 'facebook_create_post',
      description: 'Create Facebook page post',
      parameters: { pageId: '', message: '', link: '' }
    });
    this.registerTool({
      name: 'facebook_post_insights',
      description: 'Get post insights',
      parameters: { postId: '' }
    });

    // Google Ads tools
    this.registerTool({
      name: 'google_ads_find_campaign',
      description: 'Find Google Ads campaign',
      parameters: { campaignName: '' }
    });
    this.registerTool({
      name: 'google_ads_create_report',
      description: 'Create ads performance report',
      parameters: { dateRange: '', metrics: [] }
    });

    // General Zapier automation
    this.registerTool({
      name: 'zapier_trigger_zap',
      description: 'Trigger any Zapier automation',
      parameters: { zapId: '', data: {} }
    });
  }

  private registerTool(tool: MCPTool) {
    this.availableTools.set(tool.name, tool);
    console.log(`📦 MCP Tool registered: ${tool.name}`);
  }

  async connect(): Promise<boolean> {
    try {
      // Test connection to Zapier MCP
      const response = await fetch(`${this.zapierConfig.apiUrl}/health`, {
        headers: {
          'Authorization': this.zapierConfig.authToken
        }
      });

      if (response.ok) {
        this.isConnected = true;
        this.emit('connected');
        console.log('✅ MCP Service connected to Zapier');
        return true;
      }
    } catch (error) {
      console.error('❌ MCP connection failed:', error);
      this.isConnected = false;
      this.emit('error', error);
    }
    return false;
  }

  async executeTool(toolName: string, parameters: Record<string, any>): Promise<MCPResponse> {
    if (!this.isConnected) {
      await this.connect();
    }

    const tool = this.availableTools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolName} not found`
      };
    }

    try {
      console.log(`🔧 Executing MCP tool: ${toolName}`, parameters);
      
      const response = await fetch(`${this.zapierConfig.apiUrl}/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Authorization': this.zapierConfig.authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
      });

      if (response.ok) {
        const data = await response.json();
        this.emit('tool_executed', { tool: toolName, result: data });
        return {
          success: true,
          data
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error
        };
      }
    } catch (error) {
      console.error(`❌ MCP tool execution failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Gmail specific methods
  async readEmails(limit: number = 10, query?: string): Promise<MCPResponse> {
    return this.executeTool('gmail_read', { limit, query });
  }

  async sendEmail(to: string, subject: string, body: string, cc?: string): Promise<MCPResponse> {
    return this.executeTool('gmail_send', { to, subject, body, cc });
  }

  async searchEmails(query: string, limit: number = 20): Promise<MCPResponse> {
    return this.executeTool('gmail_search', { query, limit });
  }

  // Calendar specific methods
  async createCalendarEvent(
    title: string,
    start: string,
    end: string,
    description?: string,
    location?: string,
    attendees?: string[]
  ): Promise<MCPResponse> {
    return this.executeTool('calendar_create_event', {
      title,
      start,
      end,
      description,
      location,
      attendees
    });
  }

  async listCalendarEvents(timeMin?: string, timeMax?: string, limit: number = 10): Promise<MCPResponse> {
    return this.executeTool('calendar_list_events', { timeMin, timeMax, limit });
  }

  async updateCalendarEvent(
    eventId: string,
    updates: Partial<{
      title: string;
      start: string;
      end: string;
      description: string;
    }>
  ): Promise<MCPResponse> {
    return this.executeTool('calendar_update_event', {
      eventId,
      ...updates
    });
  }

  async deleteCalendarEvent(eventId: string): Promise<MCPResponse> {
    return this.executeTool('calendar_delete_event', { eventId });
  }

  // Zapier automation
  async triggerZap(zapId: string, data: any): Promise<MCPResponse> {
    return this.executeTool('zapier_trigger_zap', { zapId, data });
  }

  getAvailableTools(): MCPTool[] {
    return Array.from(this.availableTools.values());
  }

  isToolAvailable(toolName: string): boolean {
    return this.availableTools.has(toolName);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let mcpServiceInstance: MCPService | null = null;

export function getMCPService(): MCPService {
  if (!mcpServiceInstance) {
    mcpServiceInstance = new MCPService();
  }
  return mcpServiceInstance;
}