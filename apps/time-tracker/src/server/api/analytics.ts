import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../lib/supabase';
import { generateMonthlyReport, calculateFBSettlement } from '../../shared/utils';
import type { MonthlyStats, ApiResponse } from '../../shared/types';

// GET /api/analytics/monthly - Get monthly statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // Default to current month

    // Get jobs for the month
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`);

    if (jobsError) {
      return NextResponse.json(
        { success: false, error: jobsError.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Generate monthly report
    const report = generateMonthlyReport(jobs || [], month);

    // Get or create FB settlement
    const { data: existingSettlement } = await supabaseAdmin
      .from('fb_settlements')
      .select('*')
      .eq('month', `${month}-01`)
      .single();

    let fbSettlement;
    if (existingSettlement) {
      fbSettlement = existingSettlement;
    } else {
      // Create new FB settlement if it doesn't exist
      const settlementData = calculateFBSettlement(jobs || []);
      if (settlementData.totalHours > 0) {
        const { data: newSettlement, error: settlementError } = await supabaseAdmin
          .from('fb_settlements')
          .insert({
            month: `${month}-01`,
            total_hours: settlementData.totalHours,
            hourly_rate: settlementData.hourlyRate,
            total_amount: settlementData.totalAmount,
            paid: false,
          })
          .select()
          .single();

        if (settlementError) {
          console.error('Error creating FB settlement:', settlementError);
        } else {
          fbSettlement = newSettlement;
        }
      }
    }

    const result: MonthlyStats = {
      month,
      totalHours: report.totalHours,
      fbHours: report.fbSettlement.totalHours,
      ownHours: report.totalHours - report.fbSettlement.totalHours,
      totalRevenue: report.totalRevenue,
      totalCost: report.totalCost,
      totalProfit: report.totalProfit,
      avgHourlyRate: report.avgHourlyRate,
      jobs: jobs || [],
      fbSettlement: fbSettlement || undefined,
    };

    return NextResponse.json(
      { success: true, data: result } as ApiResponse<MonthlyStats>
    );
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate analytics' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// GET /api/analytics/fb-settlement - Get FB settlement for a month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, markAsPaid } = body;

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month parameter is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Get jobs for the month
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`);

    if (jobsError) {
      return NextResponse.json(
        { success: false, error: jobsError.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Calculate FB settlement
    const settlementData = calculateFBSettlement(jobs || []);

    // Update or create settlement
    const { data: settlement, error: settlementError } = await supabaseAdmin
      .from('fb_settlements')
      .upsert({
        month: `${month}-01`,
        total_hours: settlementData.totalHours,
        hourly_rate: settlementData.hourlyRate,
        total_amount: settlementData.totalAmount,
        paid: markAsPaid || false,
        paid_at: markAsPaid ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (settlementError) {
      return NextResponse.json(
        { success: false, error: settlementError.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: settlement } as ApiResponse<typeof settlement>
    );
  } catch (error) {
    console.error('FB settlement error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process FB settlement' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}