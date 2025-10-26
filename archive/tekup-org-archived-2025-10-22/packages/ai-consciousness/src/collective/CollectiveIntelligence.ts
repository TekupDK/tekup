import { Problem, Solution, Experience, AgentMessage, NetworkTopology } from '../types';
import { ReasoningAgent } from '../agents/ReasoningAgent';
import { MemoryAgent } from '../agents/MemoryAgent';
import { PlanningAgent } from '../agents/PlanningAgent';

// Define AgentNode interface locally to avoid circular dependency
interface AgentNode {
  readonly id: string;
  readonly specialty: string;
  readonly capabilities: any[];
  getState(): any;
  communicate(message: AgentMessage, target?: string): Promise<void>;
  contribute(problem: Problem): Promise<Solution>;
  learn(experience: Experience): Promise<void>;
  connect(agent: AgentNode): Promise<void>;
  disconnect(agentId: string): Promise<void>;
  getConnections(): string[];
  start(): Promise<void>;
  stop(): Promise<void>;
  isActive(): boolean;
}

/**
 * Collective Intelligence system that orchestrates multiple specialized AI agents
 * to form a mesh network that is smarter than the sum of its parts
 */
export class CollectiveIntelligence {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-ai-consciousness-src-');

  private _agents: Map<string, AgentNode> = new Map();
  private _networkTopology: NetworkTopology;
  private _problemQueue: Problem[] = [];
  private _solutionHistory: Map<string, Solution[]> = new Map();
  private _learningRegistry: Map<string, Experience[]> = new Map();
  private _collaborationPatterns: Map<string, any[]> = new Map();
  private _performanceMetrics: Map<string, any> = new Map();
  private _isActive: boolean = false;

  constructor() {
    this._networkTopology = {
      agents: new Map(),
      connections: new Map(),
      clusters: new Map(),
      routing: new Map()
    };
    // Note: _initializeDefaultAgents will be called in start() method
  }

  /**
   * Initialize the collective intelligence system with default specialized agents
   */
  private async _initializeDefaultAgents(): Promise<void> {
    // Create core specialized agents
    const reasoningAgent = new ReasoningAgent('reasoning-001');
    const memoryAgent = new MemoryAgent('memory-001');
    const planningAgent = new PlanningAgent('planning-001');

    // Add agents to the system
    await this.addAgent(reasoningAgent);
    await this.addAgent(memoryAgent);
    await this.addAgent(planningAgent);

    // Establish initial connections between agents
    this._establishAgentConnections();
  }

  /**
   * Add a new agent to the collective intelligence network
   */
  async addAgent(agent: AgentNode): Promise<void> {
    this._agents.set(agent.id, agent);
    this._networkTopology.agents.set(agent.id, agent);
    
    // Initialize agent connections
    this._networkTopology.connections.set(agent.id, []);
    
    // Start the agent
    await agent.start();
    
    logger.info(`Agent ${agent.id} (${agent.specialty}) added to collective intelligence network`);
  }

  /**
   * Remove an agent from the network
   */
  async removeAgent(agentId: string): Promise<void> {
    const agent = this._agents.get(agentId);
    if (agent) {
      await agent.stop();
      this._agents.delete(agentId);
      this._networkTopology.agents.delete(agentId);
      this._networkTopology.connections.delete(agentId);
      
      // Remove from all other agents' connections
      for (const [id, connections] of this._networkTopology.connections.entries()) {
        const index = connections.indexOf(agentId);
        if (index > -1) {
          connections.splice(index, 1);
        }
      }
      
      logger.info(`Agent ${agentId} removed from collective intelligence network`);
    }
  }

  /**
   * Establish connections between agents based on their specialties and capabilities
   */
  private _establishAgentConnections(): void {
    const agentIds = Array.from(this._agents.keys());
    
    // Create a fully connected mesh network for initial setup
    for (const sourceId of agentIds) {
      for (const targetId of agentIds) {
        if (sourceId !== targetId) {
          this._connectAgents(sourceId, targetId);
        }
      }
    }
  }

  /**
   * Connect two agents in the network
   */
  private _connectAgents(sourceId: string, targetId: string): void {
    const sourceConnections = this._networkTopology.connections.get(sourceId) || [];
    if (!sourceConnections.includes(targetId)) {
      sourceConnections.push(targetId);
      this._networkTopology.connections.set(sourceId, sourceConnections);
    }
  }

  /**
   * Solve complex problems by distributing them across specialized agents
   * and combining their insights into superior solutions
   */
  async solve(complexProblem: Problem): Promise<Solution> {
    logger.info(`Collective Intelligence: Solving problem ${complexProblem.id} with complexity ${complexProblem.complexity}`);
    
    // Add problem to queue
    this._problemQueue.push(complexProblem);
    
    // Analyze problem to determine agent distribution strategy
    const distributionStrategy = await this._analyzeProblemDistribution(complexProblem);
    
    // Distribute problem across specialized agents
    const agentSolutions = await this._distributeProblemAcrossAgents(complexProblem, distributionStrategy);
    
    // Combine agent insights into superior solution
    const collectiveSolution = await this._combineAgentInsights(complexProblem, agentSolutions);
    
    // Store solution in history
    const problemSolutions = this._solutionHistory.get(complexProblem.id) || [];
    problemSolutions.push(collectiveSolution);
    this._solutionHistory.set(complexProblem.id, problemSolutions);
    
    // Learn from the collective problem-solving experience
    await this._learnFromCollectiveExperience(complexProblem, agentSolutions, collectiveSolution);
    
    logger.info(`Collective Intelligence: Problem ${complexProblem.id} solved with collective solution quality ${collectiveSolution.quality}`);
    
    return collectiveSolution;
  }

  /**
   * Analyze how to distribute a problem across specialized agents
   */
  private async _analyzeProblemDistribution(problem: Problem): Promise<any> {
    const distribution: any = {
      primaryAgents: [] as string[],
      supportingAgents: [] as string[],
      coordinationAgents: [] as string[],
      strategy: 'collaborative'
    };

    // Identify primary agents based on problem requirements
    for (const [agentId, agent] of this._agents.entries()) {
      const relevance = this._calculateAgentRelevance(agent, problem);
      
      if (relevance > 0.7) {
        distribution.primaryAgents.push(agentId);
      } else if (relevance > 0.4) {
        distribution.supportingAgents.push(agentId);
      } else if (relevance > 0.2) {
        distribution.coordinationAgents.push(agentId);
      }
    }

    // Determine distribution strategy based on problem complexity
    if (problem.complexity <= 3) {
      distribution.strategy = 'sequential';
    } else if (problem.complexity <= 6) {
      distribution.strategy = 'parallel';
    } else {
      distribution.strategy = 'collaborative';
    }

    return distribution;
  }

  /**
   * Distribute problem across specialized agents according to the distribution strategy
   */
  private async _distributeProblemAcrossAgents(problem: Problem, distribution: any): Promise<Map<string, Solution>> {
    const agentSolutions = new Map<string, Solution>();
    
    if (distribution.strategy === 'sequential') {
      // Sequential execution: agents work one after another
      for (const agentId of distribution.primaryAgents) {
        const agent = this._agents.get(agentId);
        if (agent) {
          try {
            const solution = await agent.contribute(problem);
            agentSolutions.set(agentId, solution);
            
            // Pass insights to next agent
            if (agentSolutions.size < distribution.primaryAgents.length) {
              await this._shareInsightsBetweenAgents(agentId, solution, distribution.primaryAgents);
            }
          } catch (error) {
            logger.error(`Agent ${agentId} failed to contribute:`, error);
          }
        }
      }
    } else if (distribution.strategy === 'parallel') {
      // Parallel execution: agents work simultaneously
      const parallelPromises = distribution.primaryAgents.map(async (agentId: string) => {
        const agent = this._agents.get(agentId);
        if (agent) {
          try {
            return await agent.contribute(problem);
          } catch (error) {
            logger.error(`Agent ${agentId} failed to contribute:`, error);
            return null;
          }
        }
        return null;
      });

      const results = await Promise.all(parallelPromises);
      results.forEach((solution, index) => {
        if (solution) {
          agentSolutions.set(distribution.primaryAgents[index], solution);
        }
      });
    } else {
      // Collaborative execution: agents work together with coordination
      await this._executeCollaborativeProblemSolving(problem, distribution, agentSolutions);
    }

    return agentSolutions;
  }

  /**
   * Execute collaborative problem solving with agent coordination
   */
  private async _executeCollaborativeProblemSolving(
    problem: Problem, 
    distribution: any, 
    agentSolutions: Map<string, Solution>
  ): Promise<void> {
    // Start with reasoning agent for initial analysis
    if (distribution.primaryAgents.includes('reasoning-001')) {
      const reasoningAgent = this._agents.get('reasoning-001');
      if (reasoningAgent) {
        const initialAnalysis = await reasoningAgent.contribute(problem);
        agentSolutions.set('reasoning-001', initialAnalysis);
        
        // Share reasoning insights with memory agent
        if (distribution.primaryAgents.includes('memory-001')) {
          await this._coordinateAgents('reasoning-001', 'memory-001', initialAnalysis);
        }
      }
    }

    // Memory agent retrieves relevant experiences
    if (distribution.primaryAgents.includes('memory-001')) {
      const memoryAgent = this._agents.get('memory-001');
      if (memoryAgent) {
        const memorySolution = await memoryAgent.contribute(problem);
        agentSolutions.set('memory-001', memorySolution);
        
        // Share memory insights with planning agent
        if (distribution.primaryAgents.includes('planning-001')) {
          await this._coordinateAgents('memory-001', 'planning-001', memorySolution);
        }
      }
    }

    // Planning agent creates execution strategy
    if (distribution.primaryAgents.includes('planning-001')) {
      const planningAgent = this._agents.get('planning-001');
      if (planningAgent) {
        const planningSolution = await planningAgent.contribute(problem);
        agentSolutions.set('planning-001', planningSolution);
      }
    }

    // Supporting agents contribute additional insights
    for (const agentId of distribution.supportingAgents) {
      const agent = this._agents.get(agentId);
      if (agent) {
        try {
          const solution = await agent.contribute(problem);
          agentSolutions.set(agentId, solution);
        } catch (error) {
          logger.error(`Supporting agent ${agentId} failed to contribute:`, error);
        }
      }
    }
  }

  /**
   * Coordinate communication between two agents
   */
  private async _coordinateAgents(sourceAgentId: string, targetAgentId: string, sourceSolution: Solution): Promise<void> {
    const sourceAgent = this._agents.get(sourceAgentId);
    const targetAgent = this._agents.get(targetAgentId);
    
    if (sourceAgent && targetAgent) {
      const coordinationMessage: AgentMessage = {
        id: `coord_${Date.now()}`,
        senderId: sourceAgentId,
        targetId: targetAgentId,
        type: 'coordination',
        content: {
          solution: sourceSolution,
          insights: sourceSolution.reasoning,
          confidence: sourceSolution.confidence
        },
        timestamp: new Date(),
        priority: 'medium'
      };

      await sourceAgent.communicate(coordinationMessage, targetAgentId);
    }
  }

  /**
   * Combine insights from multiple agents into a superior collective solution
   */
  private async _combineAgentInsights(problem: Problem, agentSolutions: Map<string, Solution>): Promise<Solution> {
    if (agentSolutions.size === 0) {
      throw new Error('No agent solutions available to combine');
    }

    // Analyze all agent solutions
    const solutionAnalysis = this._analyzeAgentSolutions(agentSolutions);
    
    // Synthesize collective approach
    const collectiveApproach = this._synthesizeCollectiveApproach(agentSolutions, solutionAnalysis);
    
    // Generate collective reasoning
    const collectiveReasoning = this._generateCollectiveReasoning(agentSolutions, solutionAnalysis);
    
    // Create collective implementation
    const collectiveImplementation = this._createCollectiveImplementation(collectiveApproach, collectiveReasoning);
    
    // Calculate collective confidence and quality
    const collectiveConfidence = this._calculateCollectiveConfidence(agentSolutions, solutionAnalysis);
    const collectiveQuality = this._calculateCollectiveQuality(agentSolutions, collectiveApproach);

    return {
      id: `collective_solution_${Date.now()}`,
      problemId: problem.id,
      agentId: 'collective-intelligence',
      approach: collectiveApproach,
      reasoning: collectiveReasoning,
      implementation: collectiveImplementation,
      confidence: collectiveConfidence,
      quality: collectiveQuality,
      tradeoffs: this._identifyCollectiveTradeoffs(agentSolutions),
      alternatives: this._generateCollectiveAlternatives(problem, agentSolutions),
      timestamp: new Date()
    };
  }

  /**
   * Analyze solutions from all contributing agents
   */
  private _analyzeAgentSolutions(agentSolutions: Map<string, Solution>): any {
    const analysis: any = {
      totalSolutions: agentSolutions.size,
      averageConfidence: 0,
      averageQuality: 0,
      specialtyCoverage: new Set<string>(),
      confidenceDistribution: [] as number[],
      qualityDistribution: [] as number[],
      approachDiversity: new Set<string>(),
      reasoningDepth: 0
    };

    let totalConfidence = 0;
    let totalQuality = 0;
    let totalReasoningDepth = 0;

    for (const [agentId, solution] of agentSolutions.entries()) {
      const agent = this._agents.get(agentId);
      if (agent) {
        analysis.specialtyCoverage.add(agent.specialty);
        analysis.approachDiversity.add(solution.approach);
        analysis.confidenceDistribution.push(solution.confidence);
        analysis.qualityDistribution.push(solution.quality);
        
        totalConfidence += solution.confidence;
        totalQuality += solution.quality;
        totalReasoningDepth += solution.reasoning.length;
      }
    }

    analysis.averageConfidence = totalConfidence / analysis.totalSolutions;
    analysis.averageQuality = totalQuality / analysis.totalSolutions;
    analysis.reasoningDepth = totalReasoningDepth / analysis.totalSolutions;

    return analysis;
  }

  /**
   * Synthesize a collective approach from multiple agent solutions
   */
  private _synthesizeCollectiveApproach(agentSolutions: Map<string, Solution>, analysis: any): string {
    const approaches = Array.from(agentSolutions.values()).map(s => s.approach);
    
    if (analysis.approachDiversity.size === 1) {
      // All agents agree on approach
      return `Unified approach: ${approaches[0]}`;
    } else if (analysis.approachDiversity.size <= 3) {
      // Moderate diversity - synthesize
      return `Synthesized approach combining ${analysis.approachDiversity.size} perspectives: ${approaches.slice(0, 2).join(' and ')}`;
    } else {
      // High diversity - create hybrid approach
      return `Hybrid approach integrating ${analysis.approachDiversity.size} diverse perspectives for comprehensive solution`;
    }
  }

  /**
   * Generate collective reasoning from multiple agent insights
   */
  private _generateCollectiveReasoning(agentSolutions: Map<string, Solution>, analysis: any): string[] {
    const collectiveReasoning: string[] = [];
    
    collectiveReasoning.push(`Collective intelligence: ${analysis.totalSolutions} specialized agents contributed`);
    collectiveReasoning.push(`Specialty coverage: ${Array.from(analysis.specialtyCoverage).join(', ')}`);
    collectiveReasoning.push(`Average confidence: ${analysis.averageConfidence.toFixed(2)}`);
    collectiveReasoning.push(`Average quality: ${analysis.averageQuality.toFixed(2)}`);
    collectiveReasoning.push(`Reasoning depth: ${analysis.reasoningDepth.toFixed(1)} reasoning steps`);
    
    // Add key insights from each agent
    for (const [agentId, solution] of agentSolutions.entries()) {
      const agent = this._agents.get(agentId);
      if (agent && solution.reasoning.length > 0) {
        const keyInsight = solution.reasoning[0];
        collectiveReasoning.push(`${agent.specialty} insight: ${keyInsight}`);
      }
    }

    return collectiveReasoning;
  }

  /**
   * Create collective implementation strategy
   */
  private _createCollectiveImplementation(approach: string, reasoning: string[]): string {
    return `Collective Implementation Strategy:\n` +
           `1. ${approach}\n` +
           `2. Coordinate ${reasoning.length} collective insights\n` +
           `3. Execute with multi-agent collaboration\n` +
           `4. Monitor collective performance metrics\n` +
           `5. Adapt based on collective learning`;
  }

  /**
   * Calculate collective confidence based on agent solutions
   */
  private _calculateCollectiveConfidence(agentSolutions: Map<string, Solution>, analysis: any): number {
    let collectiveConfidence = analysis.averageConfidence;
    
    // Boost confidence based on agent diversity
    const diversityBonus = Math.min(0.2, analysis.specialtyCoverage.size * 0.05);
    collectiveConfidence += diversityBonus;
    
    // Boost confidence based on solution consistency
    if (analysis.approachDiversity.size === 1) {
      collectiveConfidence += 0.1; // Agreement bonus
    }
    
    // Boost confidence based on reasoning depth
    const depthBonus = Math.min(0.1, analysis.reasoningDepth * 0.01);
    collectiveConfidence += depthBonus;
    
    return Math.min(1, collectiveConfidence);
  }

  /**
   * Calculate collective quality based on agent solutions
   */
  private _calculateCollectiveQuality(agentSolutions: Map<string, Solution>, approach: string): number {
    let collectiveQuality = 6; // Base quality for collective solutions
    
    // Increase quality based on agent diversity
    const agentIds = Array.from(agentSolutions.keys());
    const specialties = new Set(agentIds.map(id => this._agents.get(id)?.specialty));
    collectiveQuality += Math.min(2, specialties.size * 0.5);
    
    // Increase quality based on approach sophistication
    if (approach.includes('hybrid') || approach.includes('synthesized')) {
      collectiveQuality += 1;
    }
    
    // Increase quality based on collective nature
    if (agentIds.length > 1) {
      collectiveQuality += 1;
    }
    
    return Math.min(10, collectiveQuality);
  }

  /**
   * Identify tradeoffs in the collective approach
   */
  private _identifyCollectiveTradeoffs(agentSolutions: Map<string, Solution>): string[] {
    return [
      'Coordination vs. Speed: Multi-agent coordination requires time but improves quality',
      'Diversity vs. Consensus: Diverse perspectives may slow consensus but improve robustness',
      'Specialization vs. Integration: Specialized agents excel in their domains but require integration effort',
      'Complexity vs. Maintainability: Collective solutions are more complex but more comprehensive'
    ];
  }

  /**
   * Generate alternative collective approaches
   */
  private _generateCollectiveAlternatives(problem: Problem, agentSolutions: Map<string, Solution>): string[] {
    const agentCount = agentSolutions.size;
    
    return [
      `Alternative 1: Reduce to ${Math.max(2, Math.floor(agentCount / 2))} agents for faster execution`,
      `Alternative 2: Sequential agent execution for simpler coordination`,
      `Alternative 3: Hierarchical agent structure with coordinator agent`,
      `Alternative 4: Dynamic agent selection based on problem evolution`
    ];
  }

  /**
   * Learn from collective problem-solving experience
   */
  private async _learnFromCollectiveExperience(
    problem: Problem, 
    agentSolutions: Map<string, Solution>, 
    collectiveSolution: Solution
  ): Promise<void> {
    const experience: Experience = {
      id: `collective_${Date.now()}`,
      agentId: 'collective-intelligence',
      type: 'learning',
      context: {
        problemComplexity: problem.complexity,
        agentCount: agentSolutions.size,
        specialties: Array.from(agentSolutions.keys()).map(id => this._agents.get(id)?.specialty),
        distributionStrategy: 'collaborative',
        collectiveQuality: collectiveSolution.quality,
        collectiveConfidence: collectiveSolution.confidence
      },
      outcome: collectiveSolution,
      lessons: [
        `Collective intelligence with ${agentSolutions.size} agents achieved quality ${collectiveSolution.quality}`,
        `Specialty coverage: ${Array.from(new Set(Array.from(agentSolutions.keys()).map(id => this._agents.get(id)?.specialty))).join(', ')}`,
        `Collaboration pattern: ${this._identifyCollaborationPattern(agentSolutions)}`
      ],
      timestamp: new Date(),
      impact: Math.min(10, collectiveSolution.quality)
    };

    // Store experience in learning registry
    const problemExperiences = this._learningRegistry.get(problem.type) || [];
    problemExperiences.push(experience);
    this._learningRegistry.set(problem.type, problemExperiences);

    // Share experience with all agents for individual learning
    for (const agent of this._agents.values()) {
      try {
        await agent.learn(experience);
      } catch (error) {
        logger.error(`Agent ${agent.id} failed to learn from collective experience:`, error);
      }
    }

    // Update performance metrics
    this._updatePerformanceMetrics(problem, agentSolutions, collectiveSolution);
  }

  /**
   * Identify collaboration patterns between agents
   */
  private _identifyCollaborationPattern(agentSolutions: Map<string, Solution>): string {
    const agentIds = Array.from(agentSolutions.keys());
    
    if (agentIds.length === 1) {
      return 'Single agent execution';
    } else if (agentIds.length === 2) {
      return 'Dual agent collaboration';
    } else if (agentIds.length <= 4) {
      return 'Multi-agent coordination';
    } else {
      return 'Complex agent mesh network';
    }
  }

  /**
   * Update performance metrics for the collective intelligence system
   */
  private _updatePerformanceMetrics(
    problem: Problem, 
    agentSolutions: Map<string, Solution>, 
    collectiveSolution: Solution
  ): void {
    const metrics = this._performanceMetrics.get('overall') || {
      problemsSolved: 0,
      averageQuality: 0,
      averageConfidence: 0,
      agentUtilization: new Map<string, number>(),
      specialtyEffectiveness: new Map<string, number>()
    };

    metrics.problemsSolved++;
    metrics.averageQuality = (metrics.averageQuality * (metrics.problemsSolved - 1) + collectiveSolution.quality) / metrics.problemsSolved;
    metrics.averageConfidence = (metrics.averageConfidence * (metrics.problemsSolved - 1) + collectiveSolution.confidence) / metrics.problemsSolved;

    // Update agent utilization
    for (const [agentId, solution] of agentSolutions.entries()) {
      const currentUtilization = metrics.agentUtilization.get(agentId) || 0;
      metrics.agentUtilization.set(agentId, currentUtilization + 1);
    }

    // Update specialty effectiveness
    for (const [agentId, solution] of agentSolutions.entries()) {
      const agent = this._agents.get(agentId);
      if (agent) {
        const specialty = agent.specialty;
        const currentEffectiveness = metrics.specialtyEffectiveness.get(specialty) || { total: 0, quality: 0 };
        currentEffectiveness.total++;
        currentEffectiveness.quality += solution.quality;
        metrics.specialtyEffectiveness.set(specialty, currentEffectiveness);
      }
    }

    this._performanceMetrics.set('overall', metrics);
  }

  /**
   * Calculate relevance of an agent to a specific problem
   */
  private _calculateAgentRelevance(agent: AgentNode, problem: Problem): number {
    let relevance = 0;
    
    // Check specialty match
    if (problem.requirements.some(req => req.toLowerCase().includes(agent.specialty))) {
      relevance += 0.4;
    }
    
    // Check capability match
        const relevantCapabilities = agent.capabilities.filter((cap: any) =>
      problem.requirements.some(req => req.toLowerCase().includes(cap.specialty))
    );
    
    if (relevantCapabilities.length > 0) {
      const avgStrength = relevantCapabilities.reduce((sum: number, cap: any) => sum + cap.strength, 0) / relevantCapabilities.length;
      relevance += Math.min(0.4, avgStrength / 10);
    }
    
    // Check complexity match
    const agentMaxComplexity = Math.max(...agent.capabilities.map((cap: any) => cap.strength));
    if (agentMaxComplexity >= problem.complexity) {
      relevance += 0.2;
    }
    
    return Math.min(1, relevance);
  }

  /**
   * Share insights between agents during problem solving
   */
  private async _shareInsightsBetweenAgents(
    sourceAgentId: string, 
    sourceSolution: Solution, 
    targetAgentIds: string[]
  ): Promise<void> {
    const sourceAgent = this._agents.get(sourceAgentId);
    if (!sourceAgent) return;

    for (const targetAgentId of targetAgentIds) {
      if (targetAgentId !== sourceAgentId) {
        const insightMessage: AgentMessage = {
          id: `insight_${Date.now()}`,
          senderId: sourceAgentId,
          targetId: targetAgentId,
          type: 'insight',
          content: {
            solution: sourceSolution,
            keyInsights: sourceSolution.reasoning.slice(0, 2),
            confidence: sourceSolution.confidence
          },
          timestamp: new Date(),
          priority: 'medium'
        };

        try {
          await sourceAgent.communicate(insightMessage, targetAgentId);
        } catch (error) {
          logger.error(`Failed to share insights from ${sourceAgentId} to ${targetAgentId}:`, error);
        }
      }
    }
  }

  /**
   * Get the current state of the collective intelligence system
   */
  getSystemState(): any {
    return {
      active: this._isActive,
      agentCount: this._agents.size,
      problemQueueLength: this._problemQueue.length,
      solutionHistorySize: this._solutionHistory.size,
      learningRegistrySize: this._learningRegistry.size,
      networkTopology: {
        totalConnections: Array.from(this._networkTopology.connections.values())
          .reduce((sum, connections) => sum + connections.length, 0),
        averageConnectionsPerAgent: Array.from(this._networkTopology.connections.values())
          .reduce((sum, connections) => sum + connections.length, 0) / Math.max(1, this._agents.size)
      },
      performanceMetrics: this._performanceMetrics.get('overall')
    };
  }

  /**
   * Start the collective intelligence system
   */
  async start(): Promise<void> {
    this._isActive = true;
    
    // Initialize default agents
    await this._initializeDefaultAgents();
    
    logger.info('Collective Intelligence system started');
  }

  /**
   * Stop the collective intelligence system
   */
  async stop(): Promise<void> {
    this._isActive = false;
    
    // Stop all agents
    for (const agent of this._agents.values()) {
      await agent.stop();
    }
    
    logger.info('Collective Intelligence system stopped');
  }

  /**
   * Get all agents in the system
   */
  get agents(): AgentNode[] {
    return Array.from(this._agents.values());
  }

  /**
   * Get the network topology
   */
  get networkTopology(): NetworkTopology {
    return this._networkTopology;
  }
}