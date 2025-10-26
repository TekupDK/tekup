# Tekup Unified Platform - Quick Start Guide

## 🚀 **Get Started in 5 Minutes**

### Prerequisites
- Node.js 18+ installed
- Git installed
- Terminal/Command Prompt access

### 1. Setup Environment

```bash
# Navigate to the platform directory
cd /workspace/apps/tekup-unified-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (optional for development)
```

### 2. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Create database and tables
npm run db:push

# (Optional) Seed with sample data
node migrate-data.js
```

### 3. Start the Platform

```bash
# Start development server
npm run start:dev

# Platform will be available at: http://localhost:3000/api
```

### 4. Test the Platform

```bash
# Run comprehensive test suite
node test-comprehensive.js

# Run simple lead platform test
node test-lead-platform.js
```

## 📋 **Available Endpoints**

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Lead Management
```bash
# List all leads
curl http://localhost:3000/api/leads

# Create a new lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+45 12345678",
    "company": "Example Corp",
    "source": "website",
    "notes": "Interested in our services"
  }'

# Get lead details
curl http://localhost:3000/api/leads/{lead-id}

# Qualify a lead
curl -X POST http://localhost:3000/api/leads/{lead-id}/qualify \
  -H "Content-Type: application/json" \
  -d '{
    "criteria": "Budget verification",
    "result": "Confirmed budget available",
    "score": 85,
    "notes": "Customer has confirmed budget"
  }'

# Convert lead to customer
curl -X POST http://localhost:3000/api/leads/{lead-id}/convert \
  -H "Content-Type: application/json" \
  -d '{
    "conversionType": "customer",
    "notes": "Lead converted successfully"
  }'
```

### CRM Management
```bash
# List customers
curl http://localhost:3000/api/crm/customers

# Create customer
curl -X POST http://localhost:3000/api/crm/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+45 87654321",
    "company": "Acme Corporation",
    "status": "active"
  }'

# List deals
curl http://localhost:3000/api/crm/deals

# Create deal
curl -X POST http://localhost:3000/api/crm/deals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Enterprise License",
    "value": 50000,
    "currency": "DKK",
    "stage": "prospect",
    "probability": 75,
    "customerId": "{customer-id}"
  }'
```

### Analytics
```bash
# Lead conversion analytics
curl http://localhost:3000/api/leads/analytics/conversion

# Lead source analytics
curl http://localhost:3000/api/leads/analytics/sources

# CRM pipeline analytics
curl http://localhost:3000/api/crm/analytics/pipeline
```

## 🧪 **Testing the Platform**

### Run All Tests
```bash
node test-comprehensive.js
```

### Run Specific Tests
```bash
# Lead platform only
node test-lead-platform.js

# Clean database
node cleanup-db.js

# Migrate sample data
node migrate-data.js
```

## 📊 **Sample Data**

The platform comes with sample data including:
- 1 tenant (tekup.dk)
- 1 admin user
- 3 leads (new, qualified, converted)
- 2 customers (enterprise + startup)
- 4 deals (various stages)
- 4 activities (calls, meetings, tasks)
- 2 workflows (lead qualification + onboarding)
- 2 calls (inbound + outbound)

## 🔧 **Configuration**

### Environment Variables
```env
# Database
DATABASE_URL="file:./dev.db"

# AI Configuration (optional)
AI_ENABLED=true
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Application
NODE_ENV=development
PORT=3000

# JWT (for production)
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

### Database Schema
The platform uses Prisma with SQLite for development. Key tables:
- `tenants` - Multi-tenant organizations
- `leads` - Lead records with qualification
- `customers` - Customer management
- `deals` - Sales opportunities
- `activities` - Customer interactions
- `flows` - Workflow automation
- `calls` - Voice communication

## 🚀 **Production Deployment**

### 1. Database Setup
```bash
# Switch to PostgreSQL for production
# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/tekup_unified"
```

### 2. Build for Production
```bash
npm run build
npm run start:prod
```

### 3. Docker Deployment
```bash
# Build Docker image
docker build -t tekup-unified-platform .

# Run container
docker run -p 3000:3000 tekup-unified-platform
```

## 📚 **API Documentation**

### Lead Platform API
- **GET** `/api/leads` - List leads with filtering
- **POST** `/api/leads` - Create new lead
- **GET** `/api/leads/:id` - Get lead details
- **PUT** `/api/leads/:id` - Update lead
- **DELETE** `/api/leads/:id` - Delete lead
- **POST** `/api/leads/:id/qualify` - Qualify lead
- **POST** `/api/leads/:id/convert` - Convert to customer
- **GET** `/api/leads/analytics/*` - Analytics endpoints

### CRM Platform API
- **GET** `/api/crm/customers` - List customers
- **POST** `/api/crm/customers` - Create customer
- **GET** `/api/crm/deals` - List deals
- **POST** `/api/crm/deals` - Create deal
- **GET** `/api/crm/analytics/*` - CRM analytics

### Flow Platform API
- **GET** `/api/flow/templates` - List workflow templates
- **POST** `/api/flow/workflows` - Create workflow
- **POST** `/api/flow/workflows/:id/execute` - Execute workflow
- **GET** `/api/flow/stats` - Flow statistics

## 🆘 **Troubleshooting**

### Common Issues

1. **Database Connection Error**
   ```bash
   # Regenerate Prisma client
   npm run db:generate
   npm run db:push
   ```

2. **Port Already in Use**
   ```bash
   # Change port in .env
   PORT=3001
   ```

3. **Test Failures**
   ```bash
   # Clean database and retry
   node cleanup-db.js
   node test-comprehensive.js
   ```

4. **Build Errors**
   ```bash
   # Clean and reinstall
   rm -rf node_modules
   npm install
   npm run build
   ```

### Getting Help

- Check the logs for detailed error messages
- Run tests to verify functionality
- Review the comprehensive documentation
- Check the development status report

## 🎉 **You're Ready!**

The Tekup Unified Platform is now running and ready for use. You can:

1. **Manage Leads** - Create, qualify, and convert leads
2. **Handle Customers** - Manage customer relationships and deals
3. **Automate Workflows** - Create and execute business processes
4. **Track Analytics** - Monitor performance and insights
5. **Scale Multi-tenant** - Support multiple organizations

**Welcome to the future of business intelligence! 🚀**