// Main entry point for the Tekup Consciousness Engine

export { TekupConsciousness } from './TekupConsciousness'
export { EvolutionEngine } from './engines/EvolutionEngine'
export { NaturalLanguageProcessor } from './engines/NaturalLanguageProcessor'
export { AgentMeshNetwork } from './agents/AgentMeshNetwork'
export { BaseAgent } from './agents/BaseAgent'

// Export all types
export * from './types'

// Export version information
export const VERSION = '0.1.0'
export const DESCRIPTION = 'Tekup Consciousness Engine - Self-evolving, distributed AI consciousness platform'

// Quick start function
export async function createConsciousnessEngine(): Promise<import('./TekupConsciousness').TekupConsciousness> {
  const { TekupConsciousness } = await import('./TekupConsciousness')
  return new TekupConsciousness()
}

// Example usage
export const exampleUsage = `
import { TekupConsciousness } from '@tekup/consciousness'
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-consciousness-src-ind');


// Create the consciousness engine
const consciousness = new TekupConsciousness()

// Bootstrap the system
await consciousness.bootstrap()

// Process natural language requests
const code = await consciousness.processNaturalLanguage({
  id: 'req-1',
  description: 'Create user authentication that checks email and password, hashes passwords securely, and returns JWT token',
  language: 'en',
  context: {
    domain: 'authentication',
    requirements: ['secure', 'jwt', 'password-hashing']
  },
  priority: 'high'
})

// Submit problems to collective intelligence
const solutions = await consciousness.solveProblemCollectively({
  id: 'prob-1',
  description: 'Optimize database queries for lead management system',
  complexity: 7,
  domain: 'performance-optimization',
  constraints: ['maintain-backwards-compatibility', 'zero-downtime'],
  urgency: 8
})

// Trigger evolution
await consciousness.evolve()

// Check status
const status = consciousness.getStatus()
logger.info('Consciousness level:', status.consciousnessLevel)
`