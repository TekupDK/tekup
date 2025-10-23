# Secrets Setup - RenOS Calendar MCP

This directory contains template files for secrets.
DO NOT put real credentials here - this directory is tracked in Git!

## Setup Instructions

1. Copy files from this directory to ../. secrets/

2. Fill in actual credentials:

   google-private-key.txt
   - Get from: https://console.cloud.google.com/iam-admin/serviceaccounts?project=renos-465008
   - Service account: renos-319@renos-465008.iam.gserviceaccount.com
   - Download JSON key and extract the "private_key" field

   supabase-anon-key.txt
   - Get from: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/settings/api
   - Copy the "anon public" key

   supabase-service-key.txt
   - Get from: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/settings/api
   - Copy the "service_role" key (secret!)

   twilio-auth-token.txt (OPTIONAL)
   - Get from: https://console.twilio.com/
   - Copy Auth Token

3. The ../. secrets/ directory is Git ignored and will never be committed

## Automated Alternative

Use the AI browser automation prompt:
   deployment/COMET_PROMPT.md

This can fetch credentials automatically from dashboards.

## Security

NEVER:
- Commit real secrets to Git
- Share secrets in plain text
- Post secrets in chat/email

ALWAYS:
- Keep secrets in deployment/.secrets/ (Git ignored)
- Use environment variables in production
- Rotate secrets regularly

