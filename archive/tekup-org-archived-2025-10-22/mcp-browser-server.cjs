#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const WebSocket = require('ws');

class BrowserMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'browser-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.websocket = null;
    this.isInitialized = false;
    this.setupToolHandlers();
    this.connectToExtension();
  }

  connectToExtension() {
    // Connect to our WebSocket server
    try {
      this.websocket = new WebSocket('ws://localhost:9009');
      
      this.websocket.on('open', () => {
        console.error('📡 Connected to BrowserMCP extension');
        this.isInitialized = true;
      });

      this.websocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.error('📨 Received from extension:', message.type);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      this.websocket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });

      this.websocket.on('close', () => {
        console.error('🔌 WebSocket connection closed');
        this.isInitialized = false;
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connectToExtension(), 5000);
      });
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
    }
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'browser_navigate',
            description: 'Navigate to a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to'
                }
              },
              required: ['url']
            }
          },
          {
            name: 'browser_click',
            description: 'Click on an element',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector of element to click'
                }
              },
              required: ['selector']
            }
          },
          {
            name: 'browser_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'browser_get_content',
            description: 'Get the text content of the current page',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'browser_type',
            description: 'Type text in an input field',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector of input element'
                },
                text: {
                  type: 'string',
                  description: 'Text to type'
                }
              },
              required: ['selector', 'text']
            }
          },
          {
            name: 'browser_wait',
            description: 'Wait for an element to appear',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector to wait for'
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in milliseconds',
                  default: 5000
                }
              },
              required: ['selector']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'browser_navigate':
            return await this.navigate(args.url);
          case 'browser_click':
            return await this.click(args.selector);
          case 'browser_screenshot':
            return await this.screenshot();
          case 'browser_get_content':
            return await this.getContent();
          case 'browser_type':
            return await this.type(args.selector, args.text);
          case 'browser_wait':
            return await this.wait(args.selector, args.timeout);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async sendCommand(action, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN || !this.isInitialized) {
        reject(new Error('WebSocket not connected or not initialized'));
        return;
      }

      const message = {
        type: 'browser_action',
        action: action,
        params: params,
        timestamp: new Date().toISOString()
      };

      // Set up response handler
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 10000);

      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.type === 'browser_response' && response.action === action) {
            clearTimeout(timeout);
            this.websocket.off('message', responseHandler);
            resolve(response);
          }
        } catch (error) {
          // Ignore parse errors for other messages
        }
      };

      this.websocket.on('message', responseHandler);
      this.websocket.send(JSON.stringify(message));
    });
  }

  async navigate(url) {
    const response = await this.sendCommand('navigate', { url });
    return {
      content: [
        {
          type: 'text',
          text: `Navigated to ${url}`
        }
      ]
    };
  }

  async click(selector) {
    const response = await this.sendCommand('click', { selector });
    return {
      content: [
        {
          type: 'text',
          text: `Clicked on element: ${selector}`
        }
      ]
    };
  }

  async screenshot() {
    const response = await this.sendCommand('screenshot');
    return {
      content: [
        {
          type: 'text',
          text: 'Screenshot taken successfully'
        }
      ]
    };
  }

  async getContent() {
    const response = await this.sendCommand('get_content');
    return {
      content: [
        {
          type: 'text',
          text: response.content || 'Page content retrieved'
        }
      ]
    };
  }

  async type(selector, text) {
    const response = await this.sendCommand('type', { selector, text });
    return {
      content: [
        {
          type: 'text',
          text: `Typed "${text}" into ${selector}`
        }
      ]
    };
  }

  async wait(selector, timeout = 5000) {
    const response = await this.sendCommand('wait', { selector, timeout });
    return {
      content: [
        {
          type: 'text',
          text: `Waited for element: ${selector}`
        }
      ]
    };
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('🚀 BrowserMCP server started');
    } catch (error) {
      console.error('❌ Failed to start MCP server:', error);
      throw error;
    }
  }
}

// Start the server
if (require.main === module) {
  const server = new BrowserMCPServer();
  server.run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = BrowserMCPServer;
