import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../lib/supabase';
import { getCalendarService } from '../services/calendar';
import { calculateFBSettlement, generateMonthlyReport } from '../../shared/utils';
import type { Job, MonthlyStats, ApiResponse } from '../../shared/types';

// GET /api/jobs - Get all jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const team = searchParams.get('team');
    const status = searchParams.get('status');
    const customer = searchParams.get('customer');

    let query = supabaseAdmin.from('jobs').select('*');

    // Apply filters
    if (month) {
      query = query.gte('date', `${month}-01`).lt('date', `${month}-31`);
    }
    if (team) {
      query = query.eq('team', team);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (customer) {
      query = query.ilike('customer_name', `%${customer}%`);
    }

    const { data: jobs, error } = await query.order('date', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: jobs } as ApiResponse<Job[]>
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const jobData = {
      calendar_event_id: body.calendarEventId,
      date: body.date,
      customer_name: body.customerName,
      team: body.team,
      hours_worked: body.hoursWorked,
      revenue: body.revenue,
      cost: body.team === 'FB' ? body.hoursWorked * 90 : 0,
      job_type: body.jobType,
      status: body.status || 'planned',
      notes: body.notes,
    };

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: job } as ApiResponse<Job>,
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: job } as ApiResponse<Job>
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', params.id);

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