/**
 * Core types for Distributed AI Consciousness System
 */

export type AgentSpecialty = 'reasoning' | 'memory' | 'planning' | 'perception' | 'creativity' | 'optimization';

export interface AgentMessage {
  id: string;
  senderId: string;
  targetId?: string; // undefined for broadcast
  type: 'query' | 'response' | 'insight' | 'coordination' | 'learning';
  content: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface Problem {
  id: string;
  type: string;
  description: string;
  complexity: number; // 1-10 scale
  requirements: string[];
  constraints: string[];
  context: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
}

export interface Solution {
  id: string;
  problemId: string;
  agentId: string;
  approach: string;
  reasoning: string[];
  implementation: string;
  confidence: number; // 0-1 scale
  quality: number; // 1-10 scale
  tradeoffs: string[];
  alternatives: string[];
  timestamp: Date;
}

export interface Experience {
  id: string;
  agentId: string;
  type: 'success' | 'failure' | 'learning' | 'adaptation';
  context: Record<string, any>;
  outcome: any;
  lessons: string[];
  timestamp: Date;
  impact: number; // 1-10 scale
}

export interface AgentCapability {
  specialty: AgentSpecialty;
  strength: number; // 1-10 scale
  confidence: number; // 0-1 scale
  experience: number; // years or equivalent
  adaptability: number; // 1-10 scale
}

export interface AgentState {
  id: string;
  status: 'idle' | 'working' | 'communicating' | 'learning' | 'error';
  currentTask?: string;
  load: number; // 0-1 scale
  health: number; // 0-1 scale
  lastActivity: Date;
}

export interface NetworkTopology {
  agents: Map<string, any>; // Using any to avoid circular dependency
  connections: Map<string, string[]>; // agentId -> connected agentIds
  clusters: Map<string, string[]>; // clusterId -> agentIds
  routing: Map<string, string[]>; // sourceId -> targetId -> path
}