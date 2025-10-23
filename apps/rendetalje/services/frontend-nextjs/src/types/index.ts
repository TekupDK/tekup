export interface User {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'employee' | 'customer'
  organization_id: string
  phone?: string
  avatar_url?: string
  settings?: Record<string, any>
  created_at: string
}

export interface Organization {
  id: string
  name: string
  settings?: Record<string, any>
  created_at: string
}

export interface Customer {
  id: string
  organization_id: string
  name: string
  email?: string
  phone?: string
  address: Address
  preferences?: Record<string, any>
  total_jobs: number
  total_revenue: number
  satisfaction_score?: number
  is_active: boolean
  notes?: string
  created_at: string
}

export interface Address {
  street: string
  city: string
  postal_code: string
  country?: string
}

export interface Job {
  id: string
  job_number: string
  organization_id: string
  customer_id: string
  customer?: Customer
  service_type: string
  status: JobStatus
  scheduled_date: string
  estimated_duration: number
  actual_duration?: number
  location: Address
  special_instructions?: string
  checklist: TaskItem[]
  photos: JobPhoto[]
  quality_score?: number
  profitability?: JobProfitability
  assigned_team_members?: TeamMember[]
  created_at: string
  updated_at: string
}

export type JobStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'rescheduled'

export interface TaskItem {
  id: string
  title: string
  completed: boolean
  required_photo?: boolean
  notes?: string
}

export interface JobPhoto {
  id: string
  url: string
  type: 'before' | 'after' | 'during'
  description?: string
  uploaded_at: string
}

export interface JobProfitability {
  estimated_cost: number
  actual_cost: number
  revenue: number
  profit_margin: number
}

export interface TeamMember {
  id: string
  user_id: string
  user?: User
  organization_id: string
  skills: string[]
  hourly_rate: number
  availability?: Record<string, any>
  performance_metrics?: Record<string, any>
  created_at: string
}

export interface TimeEntry {
  id: string
  job_id?: string
  team_member_id: string
  start_time: string
  end_time?: string
  break_duration?: number
  notes?: string
  created_at: string
}

export interface DashboardKPIs {
  total_revenue: number
  revenue_change: number
  jobs_completed: number
  jobs_change: number
  team_utilization: number
  utilization_change: number
  customer_satisfaction: number
  satisfaction_change: number
  active_jobs: number
  pending_invoices: number
}

export interface RevenueData {
  date: string
  revenue: number
  jobs: number
}

export interface TeamLocation {
  team_member_id: string
  team_member_name: string
  latitude: number
  longitude: number
  current_job?: string
  status: 'available' | 'busy' | 'break' | 'offline'
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  context: 'owner' | 'employee' | 'customer'
  title?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, any>
  created_at: string
}

export interface CustomerMessage {
  id: string
  customer_id: string
  job_id?: string
  sender_id?: string
  sender?: User
  message: string
  message_type: 'text' | 'email' | 'sms'
  attachments?: string[]
  is_read: boolean
  created_at: string
}

export interface CustomerReview {
  id: string
  customer_id: string
  job_id: string
  jobs?: Job
  rating: number
  comment?: string
  photos?: string[]
  created_at: string
}