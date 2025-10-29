# RenOS Time & Revenue Tracker

A comprehensive time tracking and revenue management system for Rendetalje.dk, built with Next.js, TypeScript, and Supabase. Automatically syncs with Google Calendar to track work hours, calculate revenue, and manage FB Rengøring settlements.

## Features

- **📅 Google Calendar Integration**: Automatically sync calendar events to extract work data
- **⏰ Time Tracking**: Track hours worked by team (Jonas+Rawan vs FB Rengøring)
- **💰 Revenue Calculation**: Calculate revenue and profit from job data
- **👥 FB Settlement Management**: Automated calculation of FB Rengøring payments (90 kr/hour)
- **📊 Dashboard Analytics**: Real-time KPIs and monthly statistics
- **🔄 Real-time Sync**: Keep data synchronized with Google Calendar
- **📱 Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **External APIs**: Google Calendar API, Billy.dk API
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages)
│   ├── api/               # API routes
│   │   ├── jobs/         # Jobs CRUD operations
│   │   ├── calendar/     # Calendar sync endpoints
│   │   └── analytics/    # Analytics and reporting
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard page
├── client/               # Frontend components and logic
│   ├── components/       # React components
│   │   └── dashboard/    # Dashboard-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Client-side utilities
│   └── store/           # State management
├── server/               # Backend services and API logic
│   ├── api/             # API route handlers
│   ├── lib/             # Server-side utilities
│   └── services/        # Business logic services
└── shared/               # Shared types and utilities
    ├── types/           # TypeScript type definitions
    └── utils/           # Shared utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Cloud Console project with Calendar API enabled
- Service account credentials for Google Calendar API

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd Tekup/apps/time-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables (see Configuration section below).

4. **Set up Supabase database:**
   ```bash
   # Run the schema in your Supabase SQL editor
   # File: supabase-schema.sql
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Calendar API Configuration
GOOGLE_CALENDAR_ID=your_calendar_id_here
GOOGLE_CLIENT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY="your_private_key_here"

# Billy.dk API Configuration (optional)
BILLY_API_KEY=your_billy_api_key_here
BILLY_COMPANY_ID=your_billy_company_id_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Google Calendar Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing

2. **Enable Calendar API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it

3. **Create Service Account:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Download the JSON key file

4. **Extract credentials:**
   ```bash
   # From the downloaded JSON file
   GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

5. **Share Calendar:**
   - Go to Google Calendar
   - Find your "RenOS Automatisk Booking" calendar
   - Share with your service account email
   - Grant "Make changes to events" permission

### Supabase Setup

1. **Create Supabase project:**
   - Go to [Supabase](https://supabase.com)
   - Create a new project

2. **Run database schema:**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL script

3. **Get API keys:**
   - Go to Settings > API
   - Copy your project URL and anon key
   - Copy your service role key (keep this secret!)

## Usage

### Dashboard

The main dashboard shows:

- **KPI Cards**: Total jobs, hours, revenue, profit, and average hourly rate
- **FB Settlement**: Current month FB Rengøring settlement status
- **Recent Jobs**: Table of recent work entries

### Calendar Sync

1. **Click "Sync Calendar"** in the top right
2. **System will:**
   - Fetch events from Google Calendar
   - Parse event descriptions for work data
   - Create/update job records in database
   - Calculate FB settlement amounts

### FB Settlement Management

- **Automatic calculation**: 90 kr per hour for FB team jobs
- **Monthly tracking**: Settlement amounts by month
- **Payment status**: Mark settlements as paid
- **Job breakdown**: See which jobs contribute to settlement

## API Reference

### Jobs API

- `GET /api/jobs` - Get all jobs (with optional filters)
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job

### Calendar API

- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/sync` - Sync calendar to jobs

### Analytics API

- `GET /api/analytics/monthly` - Get monthly statistics
- `POST /api/analytics/fb-settlement` - Update FB settlement

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js configuration
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first styling

## Deployment

### Render.com Deployment

1. **Connect repository** to Render
2. **Set environment variables** in Render dashboard
3. **Configure build settings:**
   - Build command: `npm run build`
   - Start command: `npm start`
   - Node version: 18

### Environment Variables in Render

Add all environment variables from `.env.example` to your Render service settings.

## Database Schema

### Jobs Table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_event_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  team TEXT NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) GENERATED ALWAYS AS (revenue - cost) STORED,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'planned',
  invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### FB Settlements Table

```sql
CREATE TABLE fb_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  total_hours DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(5,2) DEFAULT 90,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_hours * hourly_rate) STORED,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is private and proprietary to Rendetalje.dk.

## Support

For support, contact the development team at <info@rendetalje.dk>.

---

**Built with ❤️ for Rendetalje.dk**
