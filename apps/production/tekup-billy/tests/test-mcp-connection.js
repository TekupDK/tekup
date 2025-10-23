/**
 * Test MCP SSE Connection
 * Simple script to verify MCP endpoint works
 */

import https from 'https';

const MCP_URL = 'https://tekup-billy.onrender.com/mcp';

console.log('🔍 Testing MCP SSE connection...');
console.log('URL:', MCP_URL);
console.log('');

const req = https.get(MCP_URL, {
    headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
    }
}, (res) => {
    console.log('✅ Connection established!');
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('');
    console.log('📡 Listening for SSE events...');
    console.log('');

    res.on('data', (chunk) => {
        const data = chunk.toString();
        console.log('📨 Received:', data);
    });

    res.on('end', () => {
        console.log('');
        console.log('🔌 Connection closed by server');
    });

    // Close after 10 seconds
    setTimeout(() => {
        console.log('');
        console.log('⏱️  10 seconds elapsed, closing connection...');
        req.destroy();
        process.exit(0);
    }, 10000);
});

req.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
});

req.end();
