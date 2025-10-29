# RendetaljeOS Frontend

Next.js 15 frontend for RendetaljeOS - Operations Management System for Rendetalje.dk

## Features

- **Owner Portal Dashboard** with real-time KPIs and analytics
- **Interactive Charts** for revenue and performance tracking
- **Team Location Tracking** with live map integration
- **Real-time Notifications** system
- **Responsive Design** with Tailwind CSS
- **Authentication** with Supabase Auth
- **TypeScript** for type safety

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Supabase** - Authentication and database
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Framer Motion** - Animations

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Update the environment variables with your Supabase credentials.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   └── providers/         # Context providers
├── lib/                   # Utilities and configurations
│   ├── api.ts            # API client
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
└── types/                 # TypeScript type definitions
    └── index.ts          # Main types
```

## Dashboard Features

### KPI Cards

- Total Revenue with month-over-month change
- Jobs Completed with performance metrics
- Team Utilization tracking
- Customer Satisfaction scores

### Revenue Chart

- Interactive line/bar charts
- Multiple time periods (7d, 30d, 90d)
- Revenue and job count correlation

### Team Map

- Real-time team member locations
- Status indicators (available, busy, break, offline)
- Individual team member details

### Notification Center

- Real-time notifications
- Mark as read functionality
- Different notification types (info, success, warning, error)

## Authentication

The app uses Supabase Auth with the following features:

- Email/password authentication
- Session management
- Role-based access control
- Automatic token refresh

## API Integration

The frontend communicates with the NestJS backend through a centralized API client:

- Automatic token management
- Error handling
- Type-safe requests
- RESTful endpoints

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Code Style

- ESLint configuration for Next.js
- Prettier for code formatting
- TypeScript strict mode
- Tailwind CSS for styling

## Deployment

The frontend is configured for deployment on Render.com:

1. Build command: `npm run build`
2. Start command: `npm start`
3. Environment variables configured in Render dashboard

## Future Enhancements

- Employee Portal implementation
- Customer Portal implementation
- AI Friday chat widget integration
- Mobile responsiveness improvements
- Advanced analytics and reporting
- Real-time WebSocket integration
- Push notifications
- Offline functionality
