export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          calendar_event_id: string
          date: string
          customer_name: string
          team: string
          hours_worked: number
          revenue: number
          cost: number
          profit: number
          job_type: string
          status: string
          invoice_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          calendar_event_id: string
          date: string
          customer_name: string
          team: string
          hours_worked: number
          revenue: number
          cost?: number
          profit?: number
          job_type: string
          status?: string
          invoice_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          calendar_event_id?: string
          date?: string
          customer_name?: string
          team?: string
          hours_worked?: number
          revenue?: number
          cost?: number
          profit?: number
          job_type?: string
          status?: string
          invoice_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fb_settlements: {
        Row: {
          id: string
          month: string
          total_hours: number
          hourly_rate: number
          total_amount: number
          paid: boolean
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          month: string
          total_hours: number
          hourly_rate?: number
          total_amount: number
          paid?: boolean
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          month?: string
          total_hours?: number
          hourly_rate?: number
          total_amount?: number
          paid?: boolean
          paid_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}