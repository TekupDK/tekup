// Shared types for the AI Proposal Engine

export interface TranscriptData {
  id: string;
  content: string;
  speakers: Speaker[];
  metadata: TranscriptMetadata;
}

export interface Speaker {
  id: string;
  name?: string;
  role: 'prospect' | 'salesperson' | 'unknown';
  segments: SpeechSegment[];
}

export interface SpeechSegment {
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
}

export interface TranscriptMetadata {
  duration: number;
  recordingDate: Date;
  participants: string[];
  company?: string;
  industry?: string;
}

export interface BuyingSignal {
  type: BuyingSignalType;
  text: string;
  confidence: number;
  timestamp: number;
  speaker: string;
  context: string;
}

export enum BuyingSignalType {
  URGENCY = 'urgency',
  BUDGET = 'budget',
  AUTHORITY = 'authority',
  PAIN_POINT = 'pain_point',
  INTEREST = 'interest',
  TIMELINE = 'timeline',
  COMPETITIVE = 'competitive',
  TECHNICAL_REQUIREMENT = 'technical_requirement'
}

export interface PainPoint {
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  relatedSignals: string[];
}

export interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  summary: string;
  keyInsights: string[];
  statistics: Statistic[];
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
  publishDate?: Date;
}

export interface Statistic {
  value: string;
  description: string;
  source: string;
}

export interface ProposalNarrative {
  sections: ProposalSection[];
  tone: 'professional' | 'casual' | 'technical' | 'consultative';
  targetAudience: string;
  keyMessages: string[];
}

export interface ProposalSection {
  type: ProposalSectionType;
  title: string;
  content: string;
  order: number;
}

export enum ProposalSectionType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  PROBLEM_STATEMENT = 'problem_statement',
  PROPOSED_SOLUTION = 'proposed_solution',
  BENEFITS = 'benefits',
  IMPLEMENTATION = 'implementation',
  TIMELINE = 'timeline',
  PRICING = 'pricing',
  NEXT_STEPS = 'next_steps',
  APPENDIX = 'appendix'
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  styling: DocumentStyling;
}

export interface TemplateSection {
  placeholder: string;
  type: ProposalSectionType;
  required: boolean;
  formatting: SectionFormatting;
}

export interface SectionFormatting {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  alignment: 'left' | 'center' | 'right' | 'justify';
  spacing: number;
}

export interface DocumentStyling {
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  headerStyle: SectionFormatting;
  bodyStyle: SectionFormatting;
}

export interface ProposalGenerationRequest {
  transcriptId: string;
  templateId?: string;
  customInstructions?: string;
  targetAudience?: string;
  companyContext?: CompanyContext;
}

export interface CompanyContext {
  name: string;
  industry: string;
  size: string;
  challenges: string[];
  goals: string[];
}

export interface ProposalGenerationResult {
  documentUrl: string;
  generationTime: number;
  confidence: number;
  usedSignals: BuyingSignal[];
  researchSources: ResearchSource[];
  sections: ProposalSection[];
}

export interface MCPServerConfig {
  name: string;
  port: number;
  capabilities: string[];
  dependencies: string[];
}

export interface MCPHostConfig {
  port: number;
  servers: MCPServerConfig[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
