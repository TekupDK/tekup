#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class DebugMCPServer {
  constructor() {
    // Log to stderr so it doesn't interfere with MCP protocol
    console.error('🐛 Debug MCP Server starting...');
    
    this.server = new Server(
      {
        name: 'debug-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    process.on('SIGINT', () => {
      console.error('🐛 Received SIGINT, exiting...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.error('🐛 Received SIGTERM, exiting...');
      process.exit(0);
    });
  }

  setupHandlers() {
    // Log all incoming requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('🐛 Received ListTools request');
      return {
        tools: [
          {
            name: 'debug_test',
            description: 'A debug test tool',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Test message'
                }
              },
              required: ['message']
            }
          }
        ]
      };
    });
  }

  async run() {
    try {
      console.error('🐛 Setting up stdio transport...');
      const transport = new StdioServerTransport();
      
      console.error('🐛 Connecting server to transport...');
      await this.server.connect(transport);
      
      console.error('🐛 Debug MCP server is ready and connected!');
      
      // Keep the process alive
      process.stdin.resume();
      
    } catch (error) {
      console.error('🐛 Error starting server:', error);
      process.exit(1);
    }
  }
}

// Start the server
if (require.main === module) {
  const server = new DebugMCPServer();
  server.run().catch((error) => {
    console.error('🐛 Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = DebugMCPServer;
