#!/bin/bash

echo "🔧 Updating Tekup Dependencies for Business Automation..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Update Flow API dependencies
print_status "Updating Flow API dependencies..."
cd /home/ubuntu/tekup_design_export/Tekup-org/apps/flow-api

npm install --save \
  @sendgrid/mail@^7.7.0 \
  openai@^4.0.0 \
  googleapis@^126.0.1 \
  node-cron@^3.0.2 \
  nodemailer@^6.9.0 \
  @types/node-cron@^3.0.8 \
  @types/nodemailer@^6.4.11

print_success "Flow API dependencies updated"

# Update CRM API dependencies
print_status "Updating CRM API dependencies..."
cd ../tekup-crm-api

npm install --save \
  @sendgrid/mail@^7.7.0 \
  googleapis@^126.0.1 \
  node-cron@^3.0.2 \
  @types/node-cron@^3.0.8

print_success "CRM API dependencies updated"

# Update Lead Platform dependencies
print_status "Updating Lead Platform dependencies..."
cd ../tekup-lead-platform

npm install --save \
  googleapis@^126.0.1 \
  @sendgrid/mail@^7.7.0

print_success "Lead Platform dependencies updated"

print_success "All dependencies updated successfully! 🎉"

echo ""
echo "📦 New packages installed:"
echo "• @sendgrid/mail - Email service for auto-response"
echo "• openai - AI lead scoring (optional)"
echo "• googleapis - Google Calendar/Gmail integration"
echo "• node-cron - Scheduled automation jobs"
echo "• nodemailer - Alternative email service"
echo ""
echo "🔧 Next steps:"
echo "1. Copy .env.automation variables to your .env files"
echo "2. Add automation schema extensions to schema.prisma"
echo "3. Run 'npx prisma db push' to update database"
echo "4. Deploy the automation system"
