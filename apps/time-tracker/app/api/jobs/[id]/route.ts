import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/server/lib/supabase';
import type { Job, ApiResponse } from '../../../../src/shared/types';

// Billy.dk integration
const BILLY_API_KEY = process.env.BILLY_API_KEY;
const BILLY_ORGANIZATION_ID = process.env.BILLY_ORGANIZATION_ID;
const BILLY_API_BASE = process.env.BILLY_API_BASE || 'https://api.billysbilling.com/v2';

// GET /api/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = id;
  try {
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Transform database job to match frontend type
    const transformedJob: Job = {
      id: job.id,
      calendarEventId: job.calendar_event_id,
      date: job.date,
      customerName: job.customer_name,
      team: job.team as any,
      hoursWorked: job.hours_worked,
      revenue: job.revenue,
      cost: job.cost,
      profit: job.profit,
      jobType: job.job_type as any,
      status: job.status as any,
      invoiceId: job.invoice_id || undefined,
      notes: job.notes || undefined,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };

    return NextResponse.json(
      { success: true, data: transformedJob } as ApiResponse<Job>
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update a specific job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = id;
  try {
    const body = await request.json();

    const updateData = {
      customer_name: body.customerName,
      team: body.team,
      hours_worked: body.hoursWorked,
      revenue: body.revenue,
      cost: body.team === 'FB' ? body.hoursWorked * 90 : 0,
      job_type: body.jobType,
      status: body.status,
      notes: body.notes,
    };

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Transform database job to match frontend type
    const transformedJob: Job = {
      id: job.id,
      calendarEventId: job.calendar_event_id,
      date: job.date,
      customerName: job.customer_name,
      team: job.team as any,
      hoursWorked: job.hours_worked,
      revenue: job.revenue,
      cost: job.cost,
      profit: job.profit,
      jobType: job.job_type as any,
      status: job.status as any,
      invoiceId: job.invoice_id || undefined,
      notes: job.notes || undefined,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };

    return NextResponse.json(
      { success: true, data: transformedJob } as ApiResponse<Job>
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a specific job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = id;
  try {
    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: null } as ApiResponse<null>
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/jobs/[id]/invoice - Create invoice for job
export async function POST_INVOICE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = id;
  try {
    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Check if Billy is configured
    if (!BILLY_API_KEY || !BILLY_ORGANIZATION_ID) {
      return NextResponse.json(
        { success: false, error: 'Billy.dk integration not configured' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create invoice in Billy.dk
    const invoiceResponse = await fetch(`${BILLY_API_BASE}/invoices`, {
      method: 'POST',
      headers: {
        'X-Access-Token': BILLY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: BILLY_ORGANIZATION_ID,
        type: 'invoice',
        entryDate: job.date,
        paymentTermsMode: 'net',
        paymentTermsDays: 14,
        contactId: await getOrCreateBillyContact(job.customer_name),
        lines: [{
          description: `${job.job_type} - ${job.customer_name}`,
          quantity: job.hours_worked,
          unitPrice: job.revenue / job.hours_worked,
          productId: await getCleaningProductId(),
        }],
      }),
    });

    if (!invoiceResponse.ok) {
      const errorData = await invoiceResponse.json();
      return NextResponse.json(
        { success: false, error: `Billy API error: ${errorData.message || 'Unknown error'}` } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const billyInvoice = await invoiceResponse.json();

    // Update job with invoice ID
    await supabaseAdmin
      .from('jobs')
      .update({
        invoice_id: billyInvoice.invoice.id,
        status: 'invoiced'
      })
      .eq('id', jobId);

    return NextResponse.json(
      {
        success: true,
        data: {
          invoiceId: billyInvoice.invoice.id,
          invoiceNumber: billyInvoice.invoice.invoiceNo,
          status: 'created'
        }
      } as ApiResponse<any>
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// Helper function to get or create Billy contact
async function getOrCreateBillyContact(customerName: string): Promise<string> {
  // First, try to find existing contact
  const searchResponse = await fetch(`${BILLY_API_BASE}/contacts`, {
    headers: {
      'X-Access-Token': BILLY_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: BILLY_ORGANIZATION_ID,
    }),
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.contacts && searchData.contacts.length > 0) {
      // Look for exact match
      const exactMatch = searchData.contacts.find((c: any) => c.name === customerName);
      if (exactMatch) return exactMatch.id;
      // Return first contact as fallback
      return searchData.contacts[0].id;
    }
  }

  // Create new contact if not found
  const createResponse = await fetch(`${BILLY_API_BASE}/contacts`, {
    method: 'POST',
    headers: {
      'X-Access-Token': BILLY_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: BILLY_ORGANIZATION_ID,
      type: 'customer',
      name: customerName,
      contactNo: '',
      contactPersons: [{
        name: customerName,
        email: '',
      }],
    }),
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create Billy contact');
  }

  const createData = await createResponse.json();
  return createData.contact.id;
}

// Helper function to get cleaning product ID
async function getCleaningProductId(): Promise<string> {
  // Try to find existing cleaning product
  const searchResponse = await fetch(`${BILLY_API_BASE}/products`, {
    headers: {
      'X-Access-Token': BILLY_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: BILLY_ORGANIZATION_ID,
    }),
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.products && searchData.products.length > 0) {
      // Return first product found
      return searchData.products[0].id;
    }
  }

  // Create default cleaning product if none exists
  const createResponse = await fetch(`${BILLY_API_BASE}/products`, {
    method: 'POST',
    headers: {
      'X-Access-Token': BILLY_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: BILLY_ORGANIZATION_ID,
      name: 'Rengøring',
      description: 'Rengøringstjenester',
      prices: [{
        currencyId: 'DKK',
        unitPrice: 0, // Will be set per invoice line
      }],
    }),
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create Billy product');
  }

  const createData = await createResponse.json();
  return createData.product.id;
}