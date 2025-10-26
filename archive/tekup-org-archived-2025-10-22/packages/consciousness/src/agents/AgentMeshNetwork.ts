import { 
  AgentNode, 
  AgentMessage, 
  Problem, 
  Solution, 
  Experience 
} from '../types'

export class AgentMeshNetwork {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-consciousness-src-age');

  private agents: Map<string, AgentNode> = new Map()
  private messageQueue: AgentMessage[] = []
  private problemRegistry: Map<string, Problem> = new Map()
  private solutionRegistry: Map<string, Solution> = new Map()
  private experienceDatabase: Map<string, Experience> = new Map()
  
  constructor() {
    this.initializeNetwork()
  }

  /**
   * Registers an agent with the network
   */
  registerAgent(agent: AgentNode): void {
    this.agents.set(agent.id, agent)
    logger.info(`🤖 Agent ${agent.id} (${agent.specialty}) registered with network`)
    
    // Notify other agents of new member
    this.broadcastMessage({
      id: `welcome-${Date.now()}`,
      from: 'network',
      to: 'all',
      type: 'notification',
      content: { newAgent: agent.id, specialty: agent.specialty },
      priority: 1,
      timestamp: new Date()
    })
  }

  /**
   * Removes an agent from the network
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      this.agents.delete(agentId)
      logger.info(`👋 Agent ${agentId} unregistered from network`)
      
      // Notify other agents
      this.broadcastMessage({
        id: `goodbye-${Date.now()}`,
        from: 'network',
        to: 'all',
        type: 'notification',
        content: { departedAgent: agentId },
        priority: 1,
        timestamp: new Date()
      })
    }
  }

  /**
   * Sends a message between agents
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    const targetAgent = this.agents.get(message.to)
    if (!targetAgent) {
      logger.warn(`⚠️ Target agent ${message.to} not found`)
      return
    }

    try {
      await targetAgent.communicate(message, this.agents.get(message.from)!)
      logger.info(`📨 Message sent from ${message.from} to ${message.to}`)
    } catch (error) {
      logger.error(`❌ Failed to send message:`, error)
      // Queue message for retry
      this.messageQueue.push(message)
    }
  }

  /**
   * Broadcasts a message to all agents
   */
  async broadcastMessage(message: AgentMessage): Promise<void> {
    const promises = Array.from(this.agents.values()).map(async (agent) => {
      if (agent.id !== message.from) {
        const broadcastMessage = { ...message, to: agent.id }
        await this.sendMessage(broadcastMessage)
      }
    })
    
    await Promise.allSettled(promises)
  }

  /**
   * Submits a problem to the network for collective solving
   */
  async submitProblem(problem: Problem): Promise<Solution[]> {
    logger.info(`🎯 Problem submitted to network: ${problem.description}`)
    
    // Register the problem
    this.problemRegistry.set(problem.id, problem)
    
    // Distribute problem to relevant agents
    const relevantAgents = this.findRelevantAgents(problem)
    logger.info(`🔍 Found ${relevantAgents.length} relevant agents for problem`)
    
    // Collect solutions from agents
    const solutions: Solution[] = []
    const agentPromises = relevantAgents.map(async (agent) => {
      try {
        const solution = await agent.contribute(problem)
        if (solution) {
          solutions.push(solution)
          this.solutionRegistry.set(solution.id, solution)
        }
      } catch (error) {
        logger.error(`❌ Agent ${agent.id} failed to contribute:`, error)
      }
    })
    
    await Promise.allSettled(agentPromises)
    
    // Synthesize collective solution
    const collectiveSolution = await this.synthesizeSolutions(problem, solutions)
    if (collectiveSolution) {
      solutions.push(collectiveSolution)
    }
    
    logger.info(`✅ Network generated ${solutions.length} solutions for problem`)
    return solutions
  }

  /**
   * Finds agents most relevant to a given problem
   */
  private findRelevantAgents(problem: Problem): AgentNode[] {
    const relevantAgents: AgentNode[] = []
    
    for (const agent of this.agents.values()) {
      const relevance = this.calculateRelevance(agent, problem)
      if (relevance > 0.5) { // Threshold for relevance
        relevantAgents.push(agent)
      }
    }
    
    // Sort by relevance
    relevantAgents.sort((a, b) => 
      this.calculateRelevance(b, problem) - this.calculateRelevance(a, problem)
    )
    
    return relevantAgents
  }

  /**
   * Calculates how relevant an agent is to a problem
   */
  private calculateRelevance(agent: AgentNode, problem: Problem): number {
    let relevance = 0
    
    // Domain matching
    if (agent.specialty === 'reasoning' && problem.complexity > 5) {
      relevance += 0.3
    }
    
    if (agent.specialty === 'optimization' && problem.domain.includes('performance')) {
      relevance += 0.4
    }
    
    if (agent.specialty === 'testing' && problem.domain.includes('quality')) {
      relevance += 0.3
    }
    
    if (agent.specialty === 'deployment' && problem.domain.includes('infrastructure')) {
      relevance += 0.4
    }
    
    // Capability matching
    const capabilityMatch = agent.capabilities.filter(cap => 
      problem.description.toLowerCase().includes(cap.toLowerCase())
    ).length / agent.capabilities.length
    
    relevance += capabilityMatch * 0.3
    
    // Performance consideration
    relevance += agent.performance.accuracy * 0.2
    
    return Math.min(relevance, 1.0)
  }

  /**
   * Synthesizes multiple solutions into a collective solution
   */
  private async synthesizeSolutions(problem: Problem, solutions: Solution[]): Promise<Solution | null> {
    if (solutions.length < 2) return null
    
    // Find the reasoning agent to synthesize solutions
    const reasoningAgent = Array.from(this.agents.values()).find(a => a.specialty === 'reasoning')
    if (!reasoningAgent) return null
    
    try {
      const synthesisProblem: Problem = {
        id: `synthesis-${problem.id}`,
        description: `Synthesize ${solutions.length} solutions for: ${problem.description}`,
        complexity: problem.complexity + 2,
        domain: 'synthesis',
        constraints: ['Must combine best aspects', 'Must be coherent'],
        urgency: problem.urgency
      }
      
      const synthesisSolution = await reasoningAgent.contribute(synthesisProblem)
      if (synthesisSolution) {
        synthesisSolution.problemId = problem.id
        synthesisSolution.contributors = solutions.map(s => s.id)
        synthesisSolution.confidence = this.calculateCollectiveConfidence(solutions)
        return synthesisSolution
      }
    } catch (error) {
      logger.error('Failed to synthesize solutions:', error)
    }
    
    return null
  }

  /**
   * Calculates collective confidence from multiple solutions
   */
  private calculateCollectiveConfidence(solutions: Solution[]): number {
    if (solutions.length === 0) return 0
    
    const avgConfidence = solutions.reduce((sum, s) => sum + s.confidence, 0) / solutions.length
    const diversityBonus = Math.min(solutions.length * 0.1, 0.3) // Bonus for multiple perspectives
    
    return Math.min(avgConfidence + diversityBonus, 1.0)
  }

  /**
   * Records experience for learning
   */
  async recordExperience(experience: Experience): Promise<void> {
    this.experienceDatabase.set(experience.id, experience)
    logger.info(`📚 Experience recorded: ${experience.type} - ${experience.lessons.length} lessons`)
    
    // Share experience with relevant agents
    await this.distributeExperience(experience)
  }

  /**
   * Distributes experience to relevant agents for learning
   */
  private async distributeExperience(experience: Experience): Promise<void> {
    const relevantAgents = this.findAgentsForExperience(experience)
    
    for (const agent of relevantAgents) {
      try {
        await agent.learn(experience)
      } catch (error) {
        logger.error(`❌ Agent ${agent.id} failed to learn from experience:`, error)
      }
    }
  }

  /**
   * Finds agents that should learn from an experience
   */
  private findAgentsForExperience(experience: Experience): AgentNode[] {
    const relevantAgents: AgentNode[] = []
    
    for (const agent of this.agents.values()) {
      if (this.shouldAgentLearn(agent, experience)) {
        relevantAgents.push(agent)
      }
    }
    
    return relevantAgents
  }

  /**
   * Determines if an agent should learn from an experience
   */
  private shouldAgentLearn(agent: AgentNode, experience: Experience): boolean {
    // All agents should learn from general experiences
    if (experience.type === 'learning') return true
    
    // Specialized agents learn from relevant experiences
    if (agent.specialty === 'optimization' && experience.type === 'success') return true
    if (agent.specialty === 'testing' && experience.type === 'failure') return true
    
    return false
  }

  /**
   * Initiates network-wide evolution
   */
  async evolveNetwork(): Promise<void> {
    logger.info('🧬 Initiating network-wide evolution...')
    
    const evolutionPromises = Array.from(this.agents.values()).map(async (agent) => {
      try {
        await agent.evolve()
        logger.info(`✅ Agent ${agent.id} evolved successfully`)
      } catch (error) {
        logger.error(`❌ Agent ${agent.id} evolution failed:`, error)
      }
    })
    
    await Promise.allSettled(evolutionPromises)
    
    // Analyze network performance
    await this.analyzeNetworkPerformance()
  }

  /**
   * Analyzes overall network performance
   */
  private async analyzeNetworkPerformance(): Promise<void> {
    const totalAgents = this.agents.size
    const activeProblems = this.problemRegistry.size
    const totalSolutions = this.solutionRegistry.size
    const totalExperiences = this.experienceDatabase.size
    
    logger.info(`
📊 Network Performance Report:
   Agents: ${totalAgents}
   Active Problems: ${activeProblems}
   Solutions Generated: ${totalSolutions}
   Experiences Recorded: ${totalExperiences}
   Average Solutions per Problem: ${activeProblems > 0 ? (totalSolutions / activeProblems).toFixed(2) : 0}
    `)
    
    // Identify areas for improvement
    if (totalSolutions / Math.max(activeProblems, 1) < 1.5) {
      logger.info('⚠️ Network may need more diverse agent types')
    }
    
    if (totalExperiences < totalSolutions * 0.5) {
      logger.info('⚠️ Network may not be learning enough from solutions')
    }
  }

  /**
   * Gets network statistics
   */
  getNetworkStats(): {
    totalAgents: number
    agentTypes: Record<string, number>
    activeProblems: number
    totalSolutions: number
    totalExperiences: number
  } {
    const agentTypes: Record<string, number> = {}
    
    for (const agent of this.agents.values()) {
      agentTypes[agent.specialty] = (agentTypes[agent.specialty] || 0) + 1
    }
    
    return {
      totalAgents: this.agents.size,
      agentTypes,
      activeProblems: this.problemRegistry.size,
      totalSolutions: this.solutionRegistry.size,
      totalExperiences: this.experienceDatabase.size
    }
  }

  /**
   * Initializes the network
   */
  private initializeNetwork(): void {
    logger.info('🌐 Initializing Agent Mesh Network...')
    
    // Start message processing loop
    setInterval(() => {
      this.processMessageQueue()
    }, 1000)
    
    // Start periodic network analysis
    setInterval(() => {
      this.analyzeNetworkPerformance()
    }, 60000) // Every minute
  }

  /**
   * Processes queued messages
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return
    
    const message = this.messageQueue.shift()!
    try {
      await this.sendMessage(message)
    } catch (error) {
      logger.error('Failed to process queued message:', error)
      // Re-queue with exponential backoff
      if (message.priority < 10) {
        message.priority += 1
        this.messageQueue.push(message)
      }
    }
  }
}