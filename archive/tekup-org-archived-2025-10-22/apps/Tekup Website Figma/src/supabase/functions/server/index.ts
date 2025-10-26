import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS Configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use('*', logger(console.log));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Health check
app.get('/make-server-68ad12b6/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Tekup Backend API'
  });
});

// Demo Booking Endpoint
app.post('/make-server-68ad12b6/demo-booking', async (c) => {
  try {
    const booking = await c.req.json();
    
    // Validate required fields
    const required = ['firstName', 'lastName', 'email', 'company'];
    for (const field of required) {
      if (!booking[field]) {
        return c.json({ error: `${field} is required` }, 400);
      }
    }

    // Generate booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store booking in KV store
    await kv.set(`demo_booking:${bookingId}`, {
      ...booking,
      id: bookingId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      source: 'tekup_website'
    });

    // Store in recent bookings list
    const recentBookings = await kv.get('recent_demo_bookings') || [];
    recentBookings.unshift({
      id: bookingId,
      name: `${booking.firstName} ${booking.lastName}`,
      company: booking.company,
      email: booking.email,
      createdAt: new Date().toISOString()
    });
    
    // Keep only last 50 bookings
    if (recentBookings.length > 50) {
      recentBookings.splice(50);
    }
    
    await kv.set('recent_demo_bookings', recentBookings);

    // Update booking stats
    const stats = await kv.get('booking_stats') || { total: 0, thisMonth: 0, thisWeek: 0 };
    stats.total += 1;
    stats.thisMonth += 1;
    stats.thisWeek += 1;
    await kv.set('booking_stats', stats);

    console.log(`Demo booking created: ${bookingId} for ${booking.email}`);

    return c.json({ 
      success: true, 
      bookingId,
      message: 'Demo booking created successfully'
    });

  } catch (error) {
    console.log(`Demo booking error: ${error}`);
    return c.json({ error: 'Failed to create demo booking' }, 500);
  }
});

// Contact Form Endpoint
app.post('/make-server-68ad12b6/contact', async (c) => {
  try {
    const contact = await c.req.json();
    
    // Validate required fields
    const required = ['firstName', 'lastName', 'email', 'subject', 'message'];
    for (const field of required) {
      if (!contact[field]) {
        return c.json({ error: `${field} is required` }, 400);
      }
    }

    // Generate contact ID
    const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store contact in KV store
    await kv.set(`contact:${contactId}`, {
      ...contact,
      id: contactId,
      status: 'new',
      createdAt: new Date().toISOString(),
      source: 'tekup_website'
    });

    // Store in recent contacts list
    const recentContacts = await kv.get('recent_contacts') || [];
    recentContacts.unshift({
      id: contactId,
      name: `${contact.firstName} ${contact.lastName}`,
      company: contact.company || 'N/A',
      email: contact.email,
      subject: contact.subject,
      inquiryType: contact.inquiryType || 'general',
      createdAt: new Date().toISOString()
    });
    
    // Keep only last 100 contacts
    if (recentContacts.length > 100) {
      recentContacts.splice(100);
    }
    
    await kv.set('recent_contacts', recentContacts);

    // Update contact stats
    const stats = await kv.get('contact_stats') || { total: 0, thisMonth: 0, thisWeek: 0 };
    stats.total += 1;
    stats.thisMonth += 1;
    stats.thisWeek += 1;
    await kv.set('contact_stats', stats);

    console.log(`Contact form submitted: ${contactId} from ${contact.email}`);

    return c.json({ 
      success: true, 
      contactId,
      message: 'Contact form submitted successfully'
    });

  } catch (error) {
    console.log(`Contact form error: ${error}`);
    return c.json({ error: 'Failed to submit contact form' }, 500);
  }
});

// Lead Analytics Endpoint
app.get('/make-server-68ad12b6/lead-analytics', async (c) => {
  try {
    // Generate realistic demo data based on time
    const now = new Date();
    const days = ['Sø', 'Ma', 'Ti', 'On', 'To', 'Fr', 'Lø'];
    
    const leadData = days.map((day, index) => {
      const baseLeads = 20 + Math.floor(Math.random() * 25);
      const conversionRate = 0.6 + Math.random() * 0.3;
      
      return {
        name: day,
        leads: baseLeads,
        conversion: Math.floor(baseLeads * conversionRate),
        date: new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000).toISOString()
      };
    });

    const stats = {
      totalLeads: leadData.reduce((sum, day) => sum + day.leads, 0),
      totalConversions: leadData.reduce((sum, day) => sum + day.conversion, 0),
      avgConversionRate: leadData.reduce((sum, day) => sum + (day.conversion / day.leads), 0) / leadData.length,
      lastUpdated: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: leadData,
      stats,
      period: '7d'
    });

  } catch (error) {
    console.log(`Lead analytics error: ${error}`);
    return c.json({ error: 'Failed to fetch lead analytics' }, 500);
  }
});

// Dashboard Data Endpoint
app.get('/make-server-68ad12b6/dashboard-data', async (c) => {
  try {
    // Get real booking and contact stats
    const bookingStats = await kv.get('booking_stats') || { total: 0, thisMonth: 0, thisWeek: 0 };
    const contactStats = await kv.get('contact_stats') || { total: 0, thisMonth: 0, thisWeek: 0 };
    const recentBookings = await kv.get('recent_demo_bookings') || [];
    const recentContacts = await kv.get('recent_contacts') || [];

    // Generate some demo metrics
    const metrics = {
      totalLeads: 2847 + bookingStats.total,
      conversionRate: 68.2,
      aiAutomation: 89,
      supportTickets: 145 - contactStats.total,
      activeCustomers: 1247,
      pipelineValue: 2.3,
      aiTicketsResolved: 847,
      avgResponseTime: 1.2,
      satisfactionScore: 4.8
    };

    // Recent activities combining real and demo data
    const activities = [
      ...recentBookings.slice(0, 3).map(booking => ({
        id: `booking_${booking.id}`,
        type: 'demo_booked',
        title: 'Ny demo booking',
        description: `${booking.name} fra ${booking.company} bookede en demo`,
        time: new Date(booking.createdAt).toLocaleString('da-DK'),
        icon: 'Calendar',
        color: 'blue'
      })),
      ...recentContacts.slice(0, 2).map(contact => ({
        id: `contact_${contact.id}`,
        type: 'contact_received',
        title: 'Ny henvendelse',
        description: `${contact.name} sendte besked: "${contact.subject}"`,
        time: new Date(contact.createdAt).toLocaleString('da-DK'),
        icon: 'Mail',
        color: 'emerald'
      }))
    ].slice(0, 5);

    return c.json({
      success: true,
      metrics,
      activities,
      stats: {
        bookings: bookingStats,
        contacts: contactStats
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.log(`Dashboard data error: ${error}`);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// Get Recent Bookings
app.get('/make-server-68ad12b6/recent-bookings', async (c) => {
  try {
    const recentBookings = await kv.get('recent_demo_bookings') || [];
    
    return c.json({
      success: true,
      bookings: recentBookings.slice(0, 20), // Return last 20
      total: recentBookings.length
    });

  } catch (error) {
    console.log(`Recent bookings error: ${error}`);
    return c.json({ error: 'Failed to fetch recent bookings' }, 500);
  }
});

// Newsletter Signup
app.post('/make-server-68ad12b6/newsletter', async (c) => {
  try {
    const { email, name } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if already subscribed
    const existing = await kv.get(`newsletter:${email}`);
    if (existing) {
      return c.json({ message: 'Already subscribed to newsletter' });
    }

    // Store subscription
    await kv.set(`newsletter:${email}`, {
      email,
      name: name || '',
      subscribedAt: new Date().toISOString(),
      status: 'active'
    });

    // Update newsletter stats
    const stats = await kv.get('newsletter_stats') || { total: 0 };
    stats.total += 1;
    await kv.set('newsletter_stats', stats);

    console.log(`Newsletter subscription: ${email}`);

    return c.json({ 
      success: true,
      message: 'Successfully subscribed to newsletter'
    });

  } catch (error) {
    console.log(`Newsletter signup error: ${error}`);
    return c.json({ error: 'Failed to subscribe to newsletter' }, 500);
  }
});

// Error handling middleware
app.onError((err, c) => {
  console.log(`Server error: ${err.message}`);
  return c.json({ error: 'Internal server error' }, 500);
});

// Start server
Deno.serve(app.fetch);
