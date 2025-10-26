// Local shim for @tekup/shared to unblock Voice-Agent dev while shared package stabilizes

// Types used around the Voice-Agent app
export interface VoiceCommand {
  name: string;
  params?: Record<string, any>;
}

export interface VoiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  tenant?: string;
  timestamp: Date | string;
}

export interface ConversationTurn {
  // Support both role and type props to match various call sites
  role?: 'user' | 'assistant' | 'system'
  type?: 'user' | 'assistant' | 'system'
  id?: string
  content: string
  timestamp?: string | number | Date
  tenant?: string
  audio?: string
}

export interface TenantSettings {
  brand_display_name?: string;
  [k: string]: any;
}

export interface TenantContext {
  tenantId: string;
  settings?: TenantSettings;
}

export interface VoiceSession {
  id: string;
  tenantId: string;
  turns: ConversationTurn[];
}

// Event placeholders
export interface VoiceEvent { type?: string; payload?: any }
export interface LeadEvent { type?: string; payload?: any }
export interface IntegrationEvent { type?: string; payload?: any }

// Basic command catalog (stub)
export const DANISH_VOICE_COMMANDS: VoiceCommand[] = [
  { name: 'create_lead' },
  { name: 'get_leads' },
  { name: 'search_leads' },
  { name: 'get_metrics' },
  { name: 'start_backup' },
  { name: 'compliance_check' },
];

export function getCommandsByCategory(_category: string): VoiceCommand[] {
  return DANISH_VOICE_COMMANDS;
}

// Thin console-based logger compatible with existing call sites
export function createLogger(name: string) {
  return {
    info: (msg: string, ...args: any[]) => console.log(`[${name}] INFO:`, msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`[${name}] WARN:`, msg, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[${name}] ERROR:`, msg, ...args),
  };
}
