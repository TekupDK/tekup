const WebSocket = require('ws');
const http = require('http');

// Create WebSocket server directly on port
const wss = new WebSocket.Server({ 
  port: 9009,
  host: 'localhost'
});

console.log('🌐 BrowserMCP WebSocket server starting on ws://localhost:9009/');

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('🔗 New BrowserMCP connection established');
  console.log('Origin:', req.headers.origin);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'BrowserMCP WebSocket server connected',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);
      
      // Echo back or handle specific message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
        case 'browser_action':
          handleBrowserAction(ws, message);
          break;
        default:
          ws.send(JSON.stringify({ 
            type: 'ack', 
            originalType: message.type,
            timestamp: new Date().toISOString() 
          }));
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid JSON message',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('🔌 BrowserMCP connection closed');
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Handle browser actions
function handleBrowserAction(ws, message) {
  console.log('🖱️ Browser action:', message.action);
  
  // Send response back
  ws.send(JSON.stringify({
    type: 'browser_response',
    action: message.action,
    success: true,
    timestamp: new Date().toISOString()
  }));
}

// Server is automatically started when WebSocket server is created
console.log('✅ BrowserMCP WebSocket server running on ws://localhost:9009/');
console.log('🔗 Chrome extension can now connect');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down BrowserMCP server...');
  wss.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

// Keep server alive
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
});
