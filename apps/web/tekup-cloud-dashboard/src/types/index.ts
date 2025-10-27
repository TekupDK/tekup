export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  created_at: string;
  active: boolean;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  created_at: string;
}

export interface AIAgent {
  id: string;
  name: string;
  type: 'lead_capture' | 'email_automation' | 'calendar' | 'invoicing' | 'support' | 'analytics' | 'orchestrator';
  status: 'active' | 'processing' | 'error' | 'idle';
  last_activity: string;
  tasks_processed: number;
  average_response_time: number;
  description: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source: 'gmail' | 'calendar' | 'website' | 'manual' | 'referral';
  value: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  lead_id?: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  paid_at?: string;
}

export interface Activity {
  id: string;
  tenant_id: string;
  user_id?: string;
  agent_id?: string;
  type: 'lead_created' | 'invoice_sent' | 'email_sent' | 'meeting_scheduled' | 'system_alert' | 'agent_action';
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SystemMetric {
  id: string;
  service_name: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time: number;
  uptime_percentage: number;
  last_check: string;
  error_count: number;
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  type?: string;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  tenant_id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  sent_count: number;
  open_rate: number;
  click_rate: number;
  scheduled_at?: string;
  created_at: string;
}

export interface AgentTask {
  id: string;
  agent_id: string;
  tenant_id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AnalyticsMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

// Infrastructure Metrics Types
export interface InfrastructureMetric {
  id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number; // KB/s
  network_out: number; // KB/s
  service_id: string;
}

export interface APIPerformanceMetric {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  response_time: number; // ms
  status_code: number;
  request_size: number; // bytes
  response_size: number; // bytes
  error_rate: number; // percentage
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// Real-time WebSocket Message Types
export interface RealTimeMetric {
  type: 'infrastructure' | 'api_performance' | 'system_alert';
  data: InfrastructureMetric | APIPerformanceMetric | SystemAlert;
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  service_name: string;
  timestamp: string;
  acknowledged: boolean;
}
