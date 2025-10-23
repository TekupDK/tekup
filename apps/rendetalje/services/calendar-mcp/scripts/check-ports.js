#!/usr/bin/env node

/**
 * RenOS Calendar MCP - Port Conflict Detector
 * Checks for port conflicts before starting containers
 */

import net from 'net';

const PORTS = {
  mcp: parseInt(process.env.MCP_PORT || '3001'),
  dashboard: parseInt(process.env.DASHBOARD_PORT || '3006'),
  chatbot: parseInt(process.env.CHATBOT_PORT || '3005'),
  redis: parseInt(process.env.REDIS_PORT || '6379'),
  nginxHttp: parseInt(process.env.NGINX_HTTP_PORT || '80'),
  nginxHttps: parseInt(process.env.NGINX_HTTPS_PORT || '443'),
};

async function checkPort(port, name) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(\âŒ Port \ (\) is IN USE\);
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      console.log(\âœ… Port \ (\) is available\);
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

async function detectConflicts() {
  console.log('ðŸ” Checking for port conflicts...\n');
  const results = [];
  
  for (const [name, port] of Object.entries(PORTS)) {
    const available = await checkPort(port, name);
    results.push({ name, port, available });
  }
  
  const conflicts = results.filter(r => !r.available);
  
  if (conflicts.length === 0) {
    console.log('\nâœ… All ports are available! Ready to start.');
    process.exit(0);
  } else {
    console.log(\\nâŒ Found \ port conflict(s):\);
    conflicts.forEach(c => {
      console.log(\   - \: port \\);
    });
    console.log('\nðŸ’¡ Solution: Change ports in .env or .env.ports\);
    process.exit(1);
  }
}

detectConflicts().catch(console.error);
