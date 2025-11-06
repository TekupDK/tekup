export interface CustomerCaseAnalysis {
  customer: {
    id: string | number;
    name: string | null;
    email: string;
    phone: string | null;
    address?: string | null;
    property?: {
      size?: number;
      type?: string;
    };
    lead_source?: string | null;
    status?: "resolved" | "open" | "pending" | string;
    satisfaction?: "medium" | "high" | "low";
  };

  conflict?: {
    type: string;
    severity: "low" | "medium" | "high";
    root_cause?: string;
  };

  timeline?: Array<
    | {
        date: string; // ISO date
        event: "quote_sent";
        quote: {
          hours_work: string; // e.g., "2.5-3"
          team_size: number | null | string; // can be missing
          price: number; // DKK
        };
      }
    | {
        date: string;
        event:
          | "booking_cancelled"
          | "cancelled_by_us"
          | "service_executed"
          | "complaint_filed"
          | "resolved";
        reason?: string;
        customer_reaction?: string;
        executed?: {
          team_size: number;
          time_on_site: string;
          total_work_hours: number;
          price_charged: number;
        };
        final_price?: number;
        resolution_type?: string;
        message?: string;
      }
  >;

  lessons?: {
    root_cause_analysis?: string[];
    fix_applied?: string[];
  };

  similar_cases?: string[];
}
