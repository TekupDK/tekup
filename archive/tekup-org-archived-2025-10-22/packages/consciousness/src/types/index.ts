// Core Consciousness Engine Types

export interface SystemMetrics {
  performance: {
    responseTime: number
    throughput: number
    errorRate: number
    resourceUsage: {
      cpu: number
      memory: number
      disk: number
    }
  }
  business: {
    userSatisfaction: number
    featureAdoption: number
    revenueImpact: number
  }
  technical: {
    codeQuality: number
    testCoverage: number
    technicalDebt: number
  }
}

export interface CodeSection {
  id: string
  path: string
  complexity: number
  performance: number
  maintainability: number
  lastModified: Date
  dependencies: string[]
}

export interface CodeSolution {
  id: string
  description: string
  codeChanges: CodeChange[]
  expectedImpact: {
    performance: number
    maintainability: number
    risk: number
  }
  rollbackPlan: RollbackPlan
}

export interface CodeChange {
  type: 'refactor' | 'optimize' | 'add' | 'remove'
  path: string
  oldCode?: string
  newCode: string
  tests: string[]
}

export interface RollbackPlan {
  steps: string[]
  verification: string[]
  estimatedTime: number
}

export interface EvolutionResult {
  success: boolean
  metrics: SystemMetrics
  changes: CodeChange[]
  rollbackRequired: boolean
  learning: LearningOutcome
}

export interface LearningOutcome {
  patterns: string[]
  insights: string[]
  nextActions: string[]
}

// Natural Language Programming Types
export interface NaturalLanguageRequest {
  id: string
  description: string
  language: 'en' | 'da'
  context: {
    domain: string
    existingCode?: string
    requirements: string[]
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface CodeGeneration {
  id: string
  request: NaturalLanguageRequest
  generatedCode: string
  tests: string[]
  documentation: string
  confidence: number
  alternatives: CodeGeneration[]
}

// Agent Mesh Network Types
export type AgentSpecialty = 
  | 'reasoning' 
  | 'memory' 
  | 'planning' 
  | 'execution' 
  | 'creativity'
  | 'optimization'
  | 'testing'
  | 'deployment'

export interface AgentNode {
  id: string
  specialty: AgentSpecialty
  capabilities: string[]
  performance: {
    accuracy: number
    speed: number
    reliability: number
  }
  communicate(message: AgentMessage, target: AgentNode): Promise<void>
  contribute(problem: Problem): Promise<Solution>
  learn(experience: Experience): Promise<void>
  evolve(): Promise<void>
}

export interface AgentMessage {
  id: string
  from: string
  to: string
  type: 'request' | 'response' | 'notification' | 'command'
  content: any
  priority: number
  timestamp: Date
}

export interface Problem {
  id: string
  description: string
  complexity: number
  domain: string
  constraints: string[]
  urgency: number
}

export interface Solution {
  id: string
  problemId: string
  approach: string
  implementation: string
  confidence: number
  contributors: string[]
  alternatives: Solution[]
}

export interface Experience {
  id: string
  type: 'success' | 'failure' | 'learning'
  context: any
  outcome: any
  lessons: string[]
  timestamp: Date
}

// Reality Awareness Types
export interface PhysicalConstraint {
  id: string
  type: 'physical' | 'regulatory' | 'environmental' | 'social'
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  strength: number
}

export interface RealityMapping {
  id: string
  digitalEntity: string
  physicalEntity: string
  constraints: PhysicalConstraint[]
  relationships: string[]
}

// Predictive Engine Types
export interface UsagePattern {
  id: string
  userId: string
  feature: string
  frequency: number
  timeOfDay: number
  context: any
  timestamp: Date
}

export interface FeatureRequirement {
  id: string
  feature: string
  probability: number
  urgency: number
  impact: number
  implementation: string
}

// Generative UI Types
export interface BehaviorPattern {
  id: string
  userId: string
  interaction: string
  frequency: number
  context: any
  timestamp: Date
}

export interface UILayout {
  id: string
  components: UIComponent[]
  layout: string
  styling: string
  accessibility: string[]
}

export interface UIComponent {
  id: string
  type: string
  props: Record<string, any>
  children: UIComponent[]
  behavior: string
}

export interface PerformanceMetrics {
  id: string
  layoutId: string
  userSatisfaction: number
  taskCompletion: number
  timeToComplete: number
  errorRate: number
}

// Quantum-Inspired Types
export interface QuantumVariable<T> {
  id: string
  states: T[]
  probabilities: number[]
  collapse(): T
  superpose(newStates: T[]): void
  measure(): { value: T; probability: number }
}