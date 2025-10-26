import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const contacts = new Hono();

// CORS setup
contacts.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.supabase.co'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

contacts.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Mock lead data for development
const mockLeads = [
  {
    id: '1',
    company: 'TechStart ApS',
    score: 95,
    status: 'hot',
    lastActivity: '2 min siden',
    value: 125000,
    contactPerson: 'Lars Nielsen',
    email: 'lars@techstart.dk',
    phone: '+45 12 34 56 78',
    source: 'LinkedIn',
    createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
  },
  {
    id: '2',
    company: 'Digital Solutions',
    score: 87,
    status: 'warm',
    lastActivity: '15 min siden',
    value: 85000,
    contactPerson: 'Maria Hansen',
    email: 'maria@digitalsolutions.dk',
    phone: '+45 98 76 54 32',
    source: 'Google Ads',
    createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
  },
  {
    id: '3',
    company: 'Innovation Hub',
    score: 76,
    status: 'warm',
    lastActivity: '1 time siden',
    value: 65000,
    contactPerson: 'Peter Andersen',
    email: 'peter@innovationhub.dk',
    phone: '+45 11 22 33 44',
    source: 'Webinar',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '4',
    company: 'StartupCorp',
    score: 82,
    status: 'hot',
    lastActivity: '3 timer siden',
    value: 95000,
    contactPerson: 'Anna Jacobsen',
    email: 'anna@startupcorp.dk',
    phone: '+45 55 66 77 88',
    source: 'Referral',
    createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
  },
  {
    id: '5',
    company: 'CloudTech',
    score: 71,
    status: 'cold',
    lastActivity: '1 dag siden',
    value: 45000,
    contactPerson: 'Michael Storm',
    email: 'michael@cloudtech.dk',
    phone: '+45 99 88 77 66',
    source: 'Website',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  }
];

// Top leads endpoint
contacts.get('/top-leads', async (c) => {
  try {
    const tenantId = c.req.header('x-tenant-id') || 'default';
    const limit = parseInt(c.req.query('limit') || '10');
    
    // Get from cache or database
    const cacheKey = `top_leads_${tenantId}`;
    let leads = await kv.get(cacheKey);
    
    if (!leads) {
      // For now, use mock data. In production, query from database
      leads = mockLeads
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(lead => ({
          ...lead,
          // Randomize score slightly for demo
          score: Math.max(70, Math.min(100, lead.score + (Math.random() - 0.5) * 5))
        }));
      
      // Cache for 2 minutes
      await kv.set(cacheKey, leads, { ttl: 120 });
    }
    
    return c.json({
      success: true,
      data: leads.slice(0, limit)
    });
  } catch (error) {
    console.error('Top leads error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch top leads'
    }, 500);
  }
});

// All contacts endpoint
contacts.get('/', async (c) => {
  try {
    const tenantId = c.req.header('x-tenant-id') || 'default';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const sort = c.req.query('sort') || 'score';
    
    let filteredLeads = [...mockLeads];
    
    // Filter by status if provided
    if (status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === status);
    }
    
    // Sort leads
    switch (sort) {
      case 'score':
        filteredLeads.sort((a, b) => b.score - a.score);
        break;
      case 'recent':
        filteredLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'value':
        filteredLeads.sort((a, b) => b.value - a.value);
        break;
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
    
    return c.json({
      success: true,
      data: {
        leads: paginatedLeads,
        pagination: {
          page,
          limit,
          total: filteredLeads.length,
          pages: Math.ceil(filteredLeads.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Contacts list error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch contacts'
    }, 500);
  }
});

// Single contact endpoint
contacts.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const lead = mockLeads.find(l => l.id === id);
    
    if (!lead) {
      return c.json({
        success: false,
        error: 'Contact not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Contact details error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch contact details'
    }, 500);
  }
});

// Create new contact
contacts.post('/', async (c) => {
  try {
    const tenantId = c.req.header('x-tenant-id') || 'default';
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.company || !body.contactPerson || !body.email) {
      return c.json({
        success: false,
        error: 'Missing required fields: company, contactPerson, email'
      }, 400);
    }
    
    const newLead = {
      id: `${Date.now()}`,
      company: body.company,
      score: body.score || Math.floor(Math.random() * 30) + 70,
      status: body.status || 'cold',
      lastActivity: 'Lige nu',
      value: body.value || 0,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone || '',
      source: body.source || 'Manual',
      createdAt: new Date().toISOString(),
    };
    
    // In production, save to database
    // For demo, add to mock data
    mockLeads.unshift(newLead);
    
    // Clear cache
    await kv.del(`top_leads_${tenantId}`);
    
    return c.json({
      success: true,
      data: newLead
    }, 201);
  } catch (error) {
    console.error('Create contact error:', error);
    return c.json({
      success: false,
      error: 'Failed to create contact'
    }, 500);
  }
});

export { contacts };
