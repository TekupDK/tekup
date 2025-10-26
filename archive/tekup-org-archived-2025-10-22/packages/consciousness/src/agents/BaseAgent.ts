import { 
  AgentNode, 
  AgentMessage, 
  Problem, 
  Solution, 
  Experience,
  AgentSpecialty
} from '../types'

export abstract class BaseAgent implements AgentNode {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-consciousness-src-age');

  public readonly id: string
  public readonly specialty: AgentSpecialty
  public readonly capabilities: string[]
  public performance: {
    accuracy: number
    speed: number
    reliability: number
  }
  
  protected messageHistory: AgentMessage[] = []
  protected experienceHistory: Experience[] = []
  protected learningRate: number = 0.1
  
  constructor(
    id: string,
    specialty: AgentSpecialty,
    capabilities: string[],
    initialPerformance: {
      accuracy: number
      speed: number
      reliability: number
    }
  ) {
    this.id = id
    this.specialty = specialty
    this.capabilities = capabilities
    this.performance = initialPerformance
  }

  /**
   * Handles communication with other agents
   */
  async communicate(message: AgentMessage, target: AgentNode): Promise<void> {
    this.messageHistory.push(message)
    
    // Process the message based on type
    switch (message.type) {
      case 'request':
        await this.handleRequest(message)
        break
      case 'response':
        await this.handleResponse(message)
        break
      case 'notification':
        await this.handleNotification(message)
        break
      case 'command':
        await this.handleCommand(message)
        break
      default:
        logger.warn(`Unknown message type: ${message.type}`)
    }
    
    // Learn from communication
    await this.learnFromCommunication(message)
  }

  /**
   * Contributes to solving a problem
   */
  abstract contribute(problem: Problem): Promise<Solution>

  /**
   * Learns from experiences
   */
  async learn(experience: Experience): Promise<void> {
    this.experienceHistory.push(experience)
    
    // Update performance based on experience
    await this.updatePerformance(experience)
    
    // Store experience for future reference
    await this.storeExperience(experience)
    
    logger.info(`🧠 Agent ${this.id} learned from ${experience.type} experience`)
  }

  /**
   * Evolves the agent's capabilities
   */
  async evolve(): Promise<void> {
    logger.info(`🧬 Agent ${this.id} evolving...`)
    
    // Analyze performance trends
    const performanceTrend = this.analyzePerformanceTrend()
    
    // Identify areas for improvement
    const improvements = this.identifyImprovements()
    
    // Apply improvements
    await this.applyImprovements(improvements)
    
    // Update capabilities
    await this.updateCapabilities()
    
    logger.info(`✅ Agent ${this.id} evolution completed`)
  }

  /**
   * Handles incoming requests
   */
  protected async handleRequest(message: AgentMessage): Promise<void> {
    // Default implementation - override in subclasses
    logger.info(`📥 Agent ${this.id} received request: ${message.content}`)
  }

  /**
   * Handles incoming responses
   */
  protected async handleResponse(message: AgentMessage): Promise<void> {
    // Default implementation - override in subclasses
    logger.info(`📥 Agent ${this.id} received response: ${message.content}`)
  }

  /**
   * Handles incoming notifications
   */
  protected async handleNotification(message: AgentMessage): Promise<void> {
    // Default implementation - override in subclasses
    logger.info(`📢 Agent ${this.id} received notification: ${message.content}`)
  }

  /**
   * Handles incoming commands
   */
  protected async handleCommand(message: AgentMessage): Promise<void> {
    // Default implementation - override in subclasses
    logger.info(`⚡ Agent ${this.id} received command: ${message.content}`)
  }

  /**
   * Learns from communication patterns
   */
  protected async learnFromCommunication(message: AgentMessage): Promise<void> {
    // Analyze communication patterns
    const patterns = this.analyzeCommunicationPatterns()
    
    // Update performance based on patterns
    if (patterns.effectiveCommunication > 0.8) {
      this.performance.reliability = Math.min(this.performance.reliability + 0.01, 1.0)
    }
  }

  /**
   * Updates performance metrics based on experience
   */
  protected async updatePerformance(experience: Experience): Promise<void> {
    if (experience.type === 'success') {
      this.performance.accuracy = Math.min(this.performance.accuracy + this.learningRate, 1.0)
      this.performance.reliability = Math.min(this.performance.reliability + this.learningRate * 0.5, 1.0)
    } else if (experience.type === 'failure') {
      this.performance.accuracy = Math.max(this.performance.accuracy - this.learningRate * 0.5, 0.0)
      this.performance.reliability = Math.max(this.performance.reliability - this.learningRate * 0.3, 0.0)
    } else if (experience.type === 'learning') {
      this.performance.speed = Math.min(this.performance.speed + this.learningRate * 0.3, 1.0)
    }
  }

  /**
   * Stores experience for future reference
   */
  protected async storeExperience(experience: Experience): Promise<void> {
    // In a real implementation, this would store to a database
    // For now, just keep in memory
    if (this.experienceHistory.length > 100) {
      this.experienceHistory = this.experienceHistory.slice(-100)
    }
  }

  /**
   * Analyzes performance trends over time
   */
  protected analyzePerformanceTrend(): {
    accuracy: 'improving' | 'declining' | 'stable'
    speed: 'improving' | 'declining' | 'stable'
    reliability: 'improving' | 'declining' | 'stable'
  } {
    if (this.experienceHistory.length < 5) {
      return { accuracy: 'stable', speed: 'stable', reliability: 'stable' }
    }
    
    const recent = this.experienceHistory.slice(-5)
    const older = this.experienceHistory.slice(-10, -5)
    
    const recentSuccess = recent.filter(e => e.type === 'success').length / recent.length
    const olderSuccess = older.filter(e => e.type === 'success').length / older.length
    
    return {
      accuracy: recentSuccess > olderSuccess ? 'improving' : recentSuccess < olderSuccess ? 'declining' : 'stable',
      speed: 'stable', // Would need more granular metrics
      reliability: recentSuccess > olderSuccess ? 'improving' : recentSuccess < olderSuccess ? 'declining' : 'stable'
    }
  }

  /**
   * Identifies areas for improvement
   */
  protected identifyImprovements(): string[] {
    const improvements: string[] = []
    
    if (this.performance.accuracy < 0.8) {
      improvements.push('accuracy')
    }
    
    if (this.performance.speed < 0.7) {
      improvements.push('speed')
    }
    
    if (this.performance.reliability < 0.9) {
      improvements.push('reliability')
    }
    
    return improvements
  }

  /**
   * Applies identified improvements
   */
  protected async applyImprovements(improvements: string[]): Promise<void> {
    for (const improvement of improvements) {
      switch (improvement) {
        case 'accuracy':
          this.learningRate = Math.min(this.learningRate * 1.1, 0.3)
          break
        case 'speed':
          // Optimize internal algorithms
          break
        case 'reliability':
          // Add error handling and validation
          break
      }
    }
  }

  /**
   * Updates agent capabilities based on learning
   */
  protected async updateCapabilities(): Promise<void> {
    // Analyze successful experiences to identify new capabilities
    const successfulExperiences = this.experienceHistory.filter(e => e.type === 'success')
    
    for (const experience of successfulExperiences) {
      const newCapabilities = this.extractCapabilitiesFromExperience(experience)
      for (const capability of newCapabilities) {
        if (!this.capabilities.includes(capability)) {
          this.capabilities.push(capability)
          logger.info(`🆕 Agent ${this.id} gained new capability: ${capability}`)
        }
      }
    }
  }

  /**
   * Extracts new capabilities from experiences
   */
  protected extractCapabilitiesFromExperience(experience: Experience): string[] {
    const capabilities: string[] = []
    
    // Analyze experience context and outcome to identify new capabilities
    if (experience.context && typeof experience.context === 'object') {
      const context = experience.context as any
      
      if (context.domain && !this.capabilities.includes(context.domain)) {
        capabilities.push(context.domain)
      }
      
      if (context.technology && !this.capabilities.includes(context.technology)) {
        capabilities.push(context.technology)
      }
    }
    
    return capabilities
  }

  /**
   * Analyzes communication patterns
   */
  protected analyzeCommunicationPatterns(): {
    effectiveCommunication: number
    responseTime: number
    messageVolume: number
  } {
    if (this.messageHistory.length === 0) {
      return { effectiveCommunication: 0, responseTime: 0, messageVolume: 0 }
    }
    
    const recentMessages = this.messageHistory.slice(-20)
    const requests = recentMessages.filter(m => m.type === 'request')
    const responses = recentMessages.filter(m => m.type === 'response')
    
    const effectiveCommunication = responses.length / Math.max(requests.length, 1)
    const responseTime = this.calculateAverageResponseTime(recentMessages)
    const messageVolume = recentMessages.length
    
    return { effectiveCommunication, responseTime, messageVolume }
  }

  /**
   * Calculates average response time
   */
  protected calculateAverageResponseTime(messages: AgentMessage[]): number {
    const requestResponsePairs: { request: AgentMessage; response: AgentMessage }[] = []
    
    for (const request of messages.filter(m => m.type === 'request')) {
      const response = messages.find(m => 
        m.type === 'response' && 
        m.content?.requestId === request.id
      )
      
      if (response) {
        requestResponsePairs.push({ request, response })
      }
    }
    
    if (requestResponsePairs.length === 0) return 0
    
    const totalTime = requestResponsePairs.reduce((sum, pair) => {
      return sum + (pair.response.timestamp.getTime() - pair.request.timestamp.getTime())
    }, 0)
    
    return totalTime / requestResponsePairs.length
  }

  /**
   * Gets agent status information
   */
  getStatus(): {
    id: string
    specialty: AgentSpecialty
    capabilities: string[]
    performance: {
      accuracy: number
      speed: number
      reliability: number
    }
    messageCount: number
    experienceCount: number
    learningRate: number
  } {
    return {
      id: this.id,
      specialty: this.specialty,
      capabilities: this.capabilities,
      performance: this.performance,
      messageCount: this.messageHistory.length,
      experienceCount: this.experienceHistory.length,
      learningRate: this.learningRate
    }
  }
}