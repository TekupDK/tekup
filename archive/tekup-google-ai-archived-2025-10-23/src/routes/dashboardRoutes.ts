import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Mock data functions - replace with actual database queries

const getOverviewStats = (period: string) => ({
  customers: Math.floor(Math.random() * 100),
  leads: Math.floor(Math.random() * 50),
  bookings: Math.floor(Math.random() * 30),
  quotes: Math.floor(Math.random() * 20),
  conversations: Math.floor(Math.random() * 200),
  revenue: Math.floor(Math.random() * 50000),
});

const getCacheStats = () => ({
  hits: Math.floor(Math.random() * 1000),
  misses: Math.floor(Math.random() * 100),
  size: Math.floor(Math.random() * 1024), // in KB
  hitRate: `${(Math.random() * (100 - 80) + 80).toFixed(2)}%`,
});

const getRecentLeads = (limit: number) => Array.from({ length: limit }, (_, i) => ({
  id: `lead_${i}`,
  name: `Lead ${i + 1}`,
  email: `lead${i + 1}@example.com`,
  status: ['New', 'Contacted', 'Qualified'][Math.floor(Math.random() * 3)],
  createdAt: new Date().toISOString(),
}));

const getUpcomingBookings = () => Array.from({ length: 5 }, (_, i) => ({
  id: `booking_${i}`,
  startTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + (i * 24 * 60 * 60 * 1000) + (60 * 60 * 1000)).toISOString(),
  status: 'Confirmed',
  lead: { name: `Customer ${i}` },
}));

const getRevenueData = (period: string) => {
  const days = period === '24h' ? 1 : (period === '7d' ? 7 : 30);
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revenue: Math.floor(Math.random() * 2000),
  })).reverse();
};

const getServiceData = () => [
  { name: 'Service A', value: 400, color: '#8884d8' },
  { name: 'Service B', value: 300, color: '#82ca9d' },
  { name: 'Service C', value: 300, color: '#ffc658' },
  { name: 'Service D', value: 200, color: '#ff8042' },
];

// Routes
router.get('/stats/overview', requireAuth, (req, res) => {
  const { period = '7d' } = req.query;
  res.json(getOverviewStats(period as string));
});

router.get('/cache/stats', requireAuth, (req, res) => {
  res.json(getCacheStats());
});

router.get('/leads/recent', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit as string) || 5;
  res.json(getRecentLeads(limit));
});

router.get('/bookings/upcoming', requireAuth, (req, res) => {
  res.json(getUpcomingBookings());
});

router.get('/revenue', requireAuth, (req, res) => {
  const { period = '7d' } = req.query;
  res.json(getRevenueData(period as string));
});

router.get('/services', requireAuth, (req, res) => {
  res.json(getServiceData());
});

// Customer360 endpoints - missing from verification report
router.get('/customers/:id/threads', requireAuth, (req, res) => {
  const { id } = req.params;
  // Mock email threads for Customer360 interface
  const threads = Array.from({ length: 5 }, (_, i) => ({
    id: `thread_${i}`,
    subject: `Email Thread ${i + 1}`,
    lastMessage: `Latest message in thread ${i + 1}`,
    messageCount: Math.floor(Math.random() * 10) + 1,
    updatedAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
    status: ['Active', 'Closed', 'Pending'][Math.floor(Math.random() * 3)],
    participants: [`customer${id}@example.com`, 'support@rendetalje.dk']
  }));
  res.json(threads);
});

router.get('/customers/:id/leads', requireAuth, (req, res) => {
  const { id } = req.params;
  // Mock leads for specific customer - as mentioned in verification report
  const leads = Array.from({ length: 3 }, (_, i) => ({
    id: `lead_${id}_${i}`,
    customerId: id,
    name: `Lead ${i + 1} for Customer ${id}`,
    email: `lead${i + 1}@customer${id}.com`,
    status: ['New', 'Contacted', 'Qualified', 'Converted'][Math.floor(Math.random() * 4)],
    source: ['Website', 'Email', 'Phone', 'Referral'][Math.floor(Math.random() * 4)],
    value: Math.floor(Math.random() * 10000),
    createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    quotes: [
      {
        id: `quote_${i}`,
        amount: Math.floor(Math.random() * 5000),
        status: 'Pending'
      }
    ]
  }));
  res.json(leads);
});

router.get('/customers/:id/bookings', requireAuth, (req, res) => {
  const { id } = req.params;
  // Mock bookings for specific customer - Customer360 tab content
  const bookings = Array.from({ length: 4 }, (_, i) => ({
    id: `booking_${id}_${i}`,
    customerId: id,
    startTime: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)).toISOString(),
    status: ['Confirmed', 'Pending', 'Completed', 'Cancelled'][Math.floor(Math.random() * 4)],
    service: `Service ${String.fromCharCode(65 + i)}`,
    notes: `Booking notes for customer ${id}`,
    createdAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString()
  }));
  res.json(bookings);
});

export default router;