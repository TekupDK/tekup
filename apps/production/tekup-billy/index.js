// Railway/Railpack entry point
// This file ensures Railpack can find and start the Billy-mcp server

console.log('[RAILPACK] Billy-mcp By Tekup v2.0.0 - Railpack entry point');

// Import and start the HTTP server using tsx
import('./src/http-server.ts').catch((error) => {
  console.error('[RAILPACK] Failed to start http-server:', error);
  process.exit(1);
});
