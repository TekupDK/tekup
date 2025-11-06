# Inbound Email SMTP Server Setup

This directory contains the inbound-email SMTP server setup for Phase 0 email infrastructure.

## Setup Instructions

### Option 1: Clone Repository (Recommended)

```bash
# From project root
cd inbound-email
git clone https://github.com/sendbetter/inbound-email.git .
npm install
```

### Option 2: Use Pre-built Image (If Available)

If a Docker image is available, update `docker-compose.yml` to use:

```yaml
image: sendbetter/inbound-email:latest
```

Instead of build context.

### Option 3: Manual Installation

```bash
cd inbound-email
npm init -y
npm install inbound-email mailparser
# Create index.js based on inbound-email documentation
```

## Configuration

Environment variables (set in docker-compose.yml or .env):

- `WEBHOOK_URL`: http://host.docker.internal:3000/api/inbound/email
- `WEBHOOK_SECRET`: (optional) HMAC secret for webhook verification
- `STORAGE_TYPE`: local (default) or supabase
- `PORT`: 25 (SMTP)
- `SUBMISSION_PORT`: 587 (SMTP submission)

## Testing

After starting the service:

1. Test SMTP connection: `telnet localhost 25`
2. Send test email to the SMTP server
3. Verify webhook receives data at `/api/inbound/email`
