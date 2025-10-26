# RenOS Backend API

> AI-powered automation system for Rendetalje.dk operations

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-blueviolet)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Overview

RenOS Backend is the core API powering automated operations for Rendetalje.dk. It provides intelligent email management, calendar booking automation, customer relationship management, and AI-driven decision making through a modular agent architecture.

### Key Features

- 🤖 **AI Agent System**: Intent classification, task planning, and automated execution
- 📧 **Email Automation**: Gmail integration with auto-response, threading, and lead detection
- 📅 **Calendar Management**: Google Calendar sync with booking availability and conflict detection
- 👥 **Customer Management**: CRM with conversation tracking and lead linkage
- 🔍 **Quote Generation**: Automated quote creation and validation
- 📊 **Analytics & Reporting**: Customer insights, booking statistics, and email metrics
- 🔄 **Background Workers**: Scheduled tasks for email ingestion, follow-ups, and cache cleanup
- 🛡️ **Safety Rails**: Dry-run mode, approval workflows, and comprehensive logging

## 🏗️ Architecture

```
src/
├── agents/              # AI core (intent, planner, executor)
│   ├── intentClassifier.ts
│   ├── taskPlanner.ts
│   ├── planExecutor.ts
│   └── handlers/        # Task execution handlers
├── services/            # External integrations
│   ├── gmailService.ts
│   ├── calendarService.ts
│   └── googleAuth.ts
├── tools/               # CLI utilities and management tools
├── types.ts             # Shared TypeScript types
├── config.ts            # App configuration
├── logger.ts            # Pino logging
└── errors.ts            # Custom error classes

prisma/
└── schema.prisma        # Database schema
```

### Agent Architecture

**Intent → Plan → Execute**

1. **Intent Classification** (`intentClassifier.ts`): Maps natural language to structured intents (e.g., `email.lead`, `calendar.booking`)
2. **Task Planning** (`taskPlanner.ts`): Generates execution plan with dependencies and blocking logic
3. **Execution** (`planExecutor.ts`): Runs tasks via handlers or Tool Registry pattern

See `.github/copilot-instructions.md` for detailed architecture documentation.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (or Supabase)
- Google Cloud Project with Gmail & Calendar APIs enabled

### Installation

```bash
# Clone repository
git clone https://github.com/JonasAbde/renos-backend.git
cd renos-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:push
npm run db:generate

# Optional: Seed test data
npm run db:seed
```

### Development

```bash
# Start dev server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Mode
RUN_MODE=dry-run              # dry-run | live

# Database
DATABASE_URL=postgresql://...

# Google APIs
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GOOGLE_REFRESH_TOKEN=...

# AI Providers
OPENAI_API_KEY=...
GEMINI_API_KEY=...

# Optional: Redis for caching
REDIS_URL=...

# Optional: Sentry for monitoring
SENTRY_DSN=...
```

### Safety Configuration

All email and calendar mutations respect safety flags:

- `RUN_MODE=dry-run`: No external modifications (default)
- `RUN_MODE=live`: Enable actual Gmail/Calendar operations
- Feature flags: `AUTO_RESPONSE_ENABLED`, `FOLLOW_UP_ENABLED`, `ESCALATION_ENABLED`

## 📚 API Scripts

### Email Management

```bash
npm run email:pending      # List pending auto-responses
npm run email:approve      # Approve pending email
npm run email:stats        # Email statistics
npm run email:monitor      # Monitor email queue
```

### Calendar & Booking

```bash
npm run booking:availability  # Check availability
npm run booking:next-slot     # Get next available slot
npm run calendar:sync         # Sync Google Calendar to DB
```

### Customer Management

```bash
npm run customer:list         # List all customers
npm run customer:stats        # Customer statistics
npm run customer:import-csv   # Import from CSV
```

### Database Operations

```bash
npm run db:studio      # Open Prisma Studio
npm run db:push        # Push schema changes
npm run db:migrate     # Run migrations
npm run db:audit       # Audit relations
```

### Testing & Verification

```bash
npm run verify:google           # Verify Google API setup
npm run test:integration        # Run integration tests
npm run llm:test                # Test LLM providers
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration

# Verbose integration tests
npm run test:integration:verbose
```

Tests are located in `tests/` and use Vitest.

## 📖 Documentation

- `docs/CALENDAR_BOOKING.md`: Booking flows and availability logic
- `docs/EMAIL_AUTO_RESPONSE.md`: AI reply generation and approval
- `.github/copilot-instructions.md`: Complete architecture guide
- `README.md` (this file): Getting started

## 🛠️ Development Patterns

### Adding a New Capability

1. **Define Intent**: Add regex pattern to `intentClassifier.ts`
2. **Plan Tasks**: Emit `PlannedTask` in `taskPlanner.ts`
3. **Execute**: Create handler in `src/agents/handlers/` or add tool to Tool Registry
4. **Test**: Add tests in `tests/` and run in dry-run mode first

### Service Layer Pattern

All external I/O goes through service layer:

```typescript
import { gmailService } from './services/gmailService';
import { isLiveMode } from './config';

if (!isLiveMode()) {
  logger.info('Dry-run: Would send email');
  return;
}

await gmailService.sendEmail({ to, subject, body });
```

### Error Handling

Use custom error classes from `errors.ts`:

```typescript
import { ValidationError, RateLimitError } from './errors';

if (!isValid) {
  throw new ValidationError('Invalid input');
}
```

## 🐛 Debugging

```bash
# Check Google API setup
npm run verify:google

# Monitor logs (pino-pretty)
npm run dev

# Test specific features
npm run gemini:test
npm run email:test-mock
npm run booking:check-slot
```

## 📦 Docker Support

```bash
# Build image
npm run docker:build

# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## 🚨 Common Issues

### 1. "Unknown kunde" errors
- Run `npm run customer:import-csv` to import customer data
- Verify email matching logic in `emailIngestWorker.ts`

### 2. Google API authentication failures
- Refresh OAuth token: `npm run verify:google`
- Check redirect URI matches Google Console

### 3. Database connection errors
- Verify `DATABASE_URL` in `.env`
- Run `npm run db:push` to sync schema

### 4. Rate limit errors
- Backend uses exponential backoff for Google APIs
- Check `express-rate-limit` config in `index.ts`

## 🔐 Security

- All sensitive data in `.env` (never committed)
- Google credentials via OAuth 2.0
- API rate limiting enabled
- Sentry integration for error tracking
- Dry-run mode prevents accidental mutations

See `SECURITY.md` for security policy.

## 🤝 Contributing

See `CONTRIBUTING.md` for contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- **Jonas Abde** - *Initial work* - [JonasAbde](https://github.com/JonasAbde)

---

**Note**: This is the backend API only. For the frontend dashboard, see [renos-frontend](https://github.com/JonasAbde/renos-frontend).
