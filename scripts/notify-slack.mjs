#!/usr/bin/env node
import https from 'https';

const webhook = process.env.SLACK_WEBHOOK_URL;
const text = process.env.SLACK_MESSAGE || 'Migration check failed';

if (!webhook) {
  console.error('SLACK_WEBHOOK_URL not set; skipping Slack notification');
  process.exit(0);
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = https.request(options, res => {
      let chunks = '';
      res.on('data', c => (chunks += c));
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const payload = { text };
post(webhook, payload)
  .then(res => {
    console.log('Slack notified', res.status);
  })
  .catch(err => {
    console.error('Failed to notify Slack', err.message);
    process.exit(1);
  });
