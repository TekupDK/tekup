import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../src/server/lib/supabase';
import type { ApiResponse } from '../../../../../src/shared/types';

// Billy.dk integration
const BILLY_API_KEY = process.env.BILLY_API_KEY;
const BILLY_ORGANIZATION_ID = process.env.BILLY_ORGANIZATION_ID;
const BILLY_API_BASE = process.env.BILLY_API_BASE || 'https://api.billysbilling.com/v2';

// POST /api/jobs/[id]/invoice - Create invoice for job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Check if job is already invoiced
    if (job.invoice_id) {
      return NextResponse.json(
        { success: false, error: 'Job is already invoiced' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check if Billy is configured
    if (!BILLY_API_KEY || !BILLY_ORGANIZATION_ID) {
      return NextResponse.json(
        { success: false, error: 'Billy.dk integration not configured' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Get or create Billy contact
    const contactId = await getOrCreateBillyContact(job.customer_name);

    // Get cleaning product ID
    const productId = await getCleaningProductId();

    // Calculate unit price
    const unitPrice = job.hours_worked > 0 ? job.revenue / job.hours_worked : job.revenue;

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
        contactId: contactId,
        lines: [{
          description: `${job.job_type} - ${job.customer_name} (${job.hours_worked} timer)`,
          quantity: job.hours_worked,
          unitPrice: unitPrice,
          productId: productId,
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

    // Update job with invoice ID and status
    await supabaseAdmin
      .from('jobs')
      .update({
        invoice_id: billyInvoice.invoice.id,
        status: 'invoiced'
      })
      .eq('id', id);

    return NextResponse.json(
      {
        success: true,
        data: {
          invoiceId: billyInvoice.invoice.id,
          invoiceNumber: billyInvoice.invoice.invoiceNo,
          status: 'created',
          amount: billyInvoice.invoice.totalAmount,
          dueDate: calculateDueDate(job.date)
        }
      } as ApiResponse<any>
    );
  } catch (error) {
    console.error('Invoice creation error:', error);
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
    method: 'GET',
    headers: {
      'X-Access-Token': BILLY_API_KEY!,
    },
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.contacts && searchData.contacts.length > 0) {
      // Look for exact match first
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
    method: 'GET',
    headers: {
      'X-Access-Token': BILLY_API_KEY!,
    },
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.products && searchData.products.length > 0) {
      // Look for cleaning product
      const cleaningProduct = searchData.products.find((p: any) =>
        p.name.toLowerCase().includes('rengør') ||
        p.name.toLowerCase().includes('clean')
      );
      if (cleaningProduct) return cleaningProduct.id;
      // Return first product as fallback
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

// Helper function to calculate due date (14 days from invoice date)
function calculateDueDate(invoiceDate: string): string {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
}