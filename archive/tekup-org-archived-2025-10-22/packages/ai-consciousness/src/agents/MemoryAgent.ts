import { BaseAgentNode } from './AgentNode';
import { Problem, Solution, Experience, AgentMessage, AgentCapability } from '../types';
import { AgentSpecialty } from '../types';

/**
 * Specialized agent for long-term memory, knowledge storage, and retrieval
 */
export class MemoryAgent extends BaseAgentNode {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-ai-consciousness-src-');

  private _memoryStore: Map<string, any> = new Map();
  private _associations: Map<string, Set<string>> = new Map();
  private _accessPatterns: Map<string, number> = new Map();
  private _memoryHierarchy: Map<string, 'episodic' | 'semantic' | 'procedural'> = new Map();
  private _forgettingCurve: Map<string, { lastAccess: Date; strength: number }> = new Map();

  constructor(id: string) {
    const capabilities: AgentCapability[] = [
      {
        specialty: 'memory',
        strength: 10,
        confidence: 0.95,
        experience: 8,
        adaptability: 6
      },
      {
        specialty: 'perception',
        strength: 6,
        confidence: 0.7,
        experience: 3,
        adaptability: 5
      }
    ];

    super(id, 'memory', capabilities);
    this._initializeMemoryStructures();
  }

  protected async _solveProblem(problem: Problem): Promise<Solution> {
    if (!this._canHandleProblem(problem)) {
      throw new Error(`Problem ${problem.id} is outside my memory capabilities`);
    }

    // Analyze memory requirements
    const memoryAnalysis = await this._analyzeMemoryRequirements(problem);
    
    // Retrieve relevant memories
    const relevantMemories = await this._retrieveRelevantMemories(problem);
    
    // Synthesize memory-based insights
    const insights = await this._synthesizeInsights(relevantMemories, problem);
    
    // Generate memory-based solution
    const approach = await this._generateMemoryBasedApproach(problem, insights);
    
    // Evaluate confidence and quality
    const confidence = this._calculateMemoryConfidence(relevantMemories, insights);
    const quality = this._calculateMemoryQuality(insights, approach);

    return {
      id: `memory_solution_${Date.now()}`,
      problemId: problem.id,
      agentId: this.id,
      approach: approach,
      reasoning: insights,
      implementation: await this._generateMemoryImplementation(approach, insights),
      confidence: confidence,
      quality: quality,
      tradeoffs: await this._identifyMemoryTradeoffs(approach),
      alternatives: await this._generateMemoryAlternatives(problem, insights),
      timestamp: new Date()
    };
  }

  protected async _processMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'query':
        await this._handleMemoryQuery(message);
        break;
      case 'insight':
        await this._storeInsight(message);
        break;
      case 'coordination':
        await this._handleMemoryCoordination(message);
        break;
      case 'learning':
        await this._integrateLearningMessage(message);
        break;
      default:
        logger.info(`MemoryAgent ${this.id}: Unhandled message type: ${message.type}`);
    }
  }

  protected async _integrateLearning(experience: Experience): Promise<void> {
    // Store the experience in memory
    await this._storeExperience(experience);
    
    // Extract and store patterns
    const patterns = this._extractMemoryPatterns(experience);
    await this._storePatterns(patterns);
    
    // Update associations
    await this._updateAssociations(experience);
    
    // Apply forgetting curve
    await this._applyForgettingCurve(experience);
  }

  // Memory-specific methods
  async storeMemory(key: string, value: any, type: 'episodic' | 'semantic' | 'procedural' = 'semantic'): Promise<void> {
    this._memoryStore.set(key, value);
    this._memoryHierarchy.set(key, type);
    this._accessPatterns.set(key, 0);
    this._forgettingCurve.set(key, { lastAccess: new Date(), strength: 1.0 });
    
    // Create associations based on content
    await this._createAssociations(key, value);
  }

  async retrieveMemory(key: string): Promise<any> {
    const memory = this._memoryStore.get(key);
    if (memory) {
      // Update access patterns
      const accessCount = this._accessPatterns.get(key) || 0;
      this._accessPatterns.set(key, accessCount + 1);
      
      // Update forgetting curve
      const forgetting = this._forgettingCurve.get(key);
      if (forgetting) {
        forgetting.lastAccess = new Date();
        forgetting.strength = Math.min(1.0, forgetting.strength + 0.1);
        this._forgettingCurve.set(key, forgetting);
      }
    }
    return memory;
  }

  async searchMemories(query: string, limit: number = 10): Promise<Array<{ key: string; value: any; relevance: number }>> {
    const results: Array<{ key: string; value: any; relevance: number }> = [];
    
    for (const [key, value] of this._memoryStore.entries()) {
      const relevance = this._calculateRelevance(query, key, value);
      if (relevance > 0.3) { // Minimum relevance threshold
        results.push({ key, value, relevance });
      }
    }
    
    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  async getAssociations(key: string): Promise<string[]> {
    return Array.from(this._associations.get(key) || []);
  }

  async createAssociation(sourceKey: string, targetKey: string, strength: number = 0.5): Promise<void> {
    if (!this._associations.has(sourceKey)) {
      this._associations.set(sourceKey, new Set());
    }
    this._associations.get(sourceKey)!.add(targetKey);
    
    // Bidirectional association
    if (!this._associations.has(targetKey)) {
      this._associations.set(targetKey, new Set());
    }
    this._associations.get(targetKey)!.add(sourceKey);
  }

  private async _analyzeMemoryRequirements(problem: Problem): Promise<any> {
    return {
      memoryTypes: this._identifyRequiredMemoryTypes(problem),
      searchQueries: this._generateSearchQueries(problem),
      associationPaths: this._identifyAssociationPaths(problem),
      temporalContext: this._extractTemporalContext(problem)
    };
  }

  private async _retrieveRelevantMemories(problem: Problem): Promise<Array<{ key: string; value: any; relevance: number }>> {
    const searchQueries = this._generateSearchQueries(problem);
    const memories: Array<{ key: string; value: any; relevance: number }> = [];
    
    for (const query of searchQueries) {
      const results = await this.searchMemories(query, 5);
      memories.push(...results);
    }
    
    // Remove duplicates and sort by relevance
    const uniqueMemories = new Map<string, { key: string; value: any; relevance: number }>();
    memories.forEach(memory => {
      if (!uniqueMemories.has(memory.key) || uniqueMemories.get(memory.key)!.relevance < memory.relevance) {
        uniqueMemories.set(memory.key, memory);
      }
    });
    
    return Array.from(uniqueMemories.values())
      .sort((a, b) => b.relevance - a.relevance);
  }

  private async _synthesizeInsights(memories: Array<{ key: string; value: any; relevance: number }>, problem: Problem): Promise<string[]> {
    const insights: string[] = [];
    
    if (memories.length === 0) {
      insights.push('No relevant memories found for this problem');
      return insights;
    }
    
    // Group memories by type
    const episodicMemories = memories.filter(m => this._memoryHierarchy.get(m.key) === 'episodic');
    const semanticMemories = memories.filter(m => this._memoryHierarchy.get(m.key) === 'semantic');
    const proceduralMemories = memories.filter(m => this._memoryHierarchy.get(m.key) === 'procedural');
    
    if (episodicMemories.length > 0) {
      insights.push(`Found ${episodicMemories.length} relevant past experiences`);
    }
    
    if (semanticMemories.length > 0) {
      insights.push(`Retrieved ${semanticMemories.length} knowledge items`);
    }
    
    if (proceduralMemories.length > 0) {
      insights.push(`Identified ${proceduralMemories.length} procedural patterns`);
    }
    
    // Analyze patterns across memories
    const patterns = this._analyzeMemoryPatterns(memories);
    if (patterns.length > 0) {
      insights.push(`Detected patterns: ${patterns.join(', ')}`);
    }
    
    // Identify gaps in knowledge
    const gaps = this._identifyKnowledgeGaps(problem, memories);
    if (gaps.length > 0) {
      insights.push(`Knowledge gaps identified: ${gaps.join(', ')}`);
    }
    
    return insights;
  }

  private async _generateMemoryBasedApproach(problem: Problem, insights: string[]): Promise<string> {
    const approach = `Based on ${insights.length} memory insights, I recommend leveraging ` +
                    `${this._determineMemoryStrategy(insights)} approach. ` +
                    `This strategy draws from ${this._summarizeMemorySources(insights)} ` +
                    `and addresses ${this._identifyKeyAspects(problem)}.`;
    
    return approach;
  }

  private async _generateMemoryImplementation(approach: string, insights: string[]): Promise<string> {
    return `Memory-based implementation: ${approach}\n` +
           `Key memory insights: ${insights.slice(0, 3).join('; ')}\n` +
           `Memory retrieval strategy: ${this._defineMemoryStrategy(insights)}`;
  }

  private async _identifyMemoryTradeoffs(approach: string): Promise<string[]> {
    return [
      'Memory vs. Speed: Comprehensive memory search may slow response time',
      'Accuracy vs. Efficiency: Detailed memory analysis increases accuracy but requires more processing',
      'Relevance vs. Coverage: Focused memory retrieval may miss peripheral but valuable information'
    ];
  }

  private async _generateMemoryAlternatives(problem: Problem, insights: string[]): Promise<string[]> {
    return [
      'Alternative 1: Shallow memory search with quick response',
      'Alternative 2: Deep memory analysis with comprehensive coverage',
      'Alternative 3: Hybrid approach combining recent and long-term memories'
    ];
  }

  private _calculateMemoryConfidence(memories: Array<{ key: string; value: any; relevance: number }>, insights: string[]): number {
    let confidence = 0.3; // Base confidence
    
    // Increase confidence based on memory quantity and quality
    confidence += Math.min(0.4, memories.length * 0.1);
    
    // Increase confidence based on memory relevance
    const avgRelevance = memories.reduce((sum, m) => sum + m.relevance, 0) / Math.max(1, memories.length);
    confidence += avgRelevance * 0.2;
    
    // Increase confidence based on insights quality
    confidence += Math.min(0.1, insights.length * 0.02);
    
    return Math.min(1, confidence);
  }

  private _calculateMemoryQuality(insights: string[], approach: string): number {
    let quality = 4; // Base quality
    
    // Increase quality based on insights depth
    quality += Math.min(3, insights.length * 0.5);
    
    // Increase quality based on approach sophistication
    if (approach.includes('hybrid') || approach.includes('comprehensive')) {
      quality += 1;
    }
    
    // Increase quality based on memory strategy
    if (approach.includes('pattern') || approach.includes('association')) {
      quality += 1;
    }
    
    return Math.min(10, quality);
  }

  private _initializeMemoryStructures(): void {
    // Initialize with some basic memory structures
    this._memoryStore.set('system:initialized', { timestamp: new Date(), version: '1.0' });
    this._memoryHierarchy.set('system:initialized', 'semantic');
  }

  private _identifyRequiredMemoryTypes(problem: Problem): string[] {
    const types: string[] = [];
    
    if (problem.description.includes('experience') || problem.description.includes('past')) {
      types.push('episodic');
    }
    
    if (problem.description.includes('knowledge') || problem.description.includes('information')) {
      types.push('semantic');
    }
    
    if (problem.description.includes('procedure') || problem.description.includes('how')) {
      types.push('procedural');
    }
    
    return types.length > 0 ? types : ['semantic', 'episodic', 'procedural'];
  }

  private _generateSearchQueries(problem: Problem): string[] {
    const queries: string[] = [];
    
    // Extract key terms from problem description
    const words = problem.description.toLowerCase().split(/\s+/);
    const keyTerms = words.filter(word => word.length > 3);
    
    // Generate queries from key terms
    keyTerms.forEach(term => {
      queries.push(term);
      queries.push(`${term} pattern`);
      queries.push(`${term} solution`);
    });
    
    // Add problem type specific queries
    queries.push(problem.type);
    queries.push(`${problem.type} approach`);
    
    return queries.slice(0, 10); // Limit to 10 queries
  }

  private _identifyAssociationPaths(problem: Problem): string[] {
    const paths: string[] = [];
    
    // Identify potential association paths based on problem context
    if (problem.context) {
      Object.keys(problem.context).forEach(key => {
        paths.push(key);
        paths.push(`${key} related`);
      });
    }
    
    return paths;
  }

  private _extractTemporalContext(problem: Problem): any {
    return {
      hasDeadline: !!problem.deadline,
      deadline: problem.deadline,
      isUrgent: problem.priority === 'critical' || problem.priority === 'high',
      timeContext: problem.deadline ? 'time-constrained' : 'flexible'
    };
  }

  private _calculateRelevance(query: string, key: string, value: any): number {
    let relevance = 0;
    
    // Check key relevance
    if (key.toLowerCase().includes(query.toLowerCase())) {
      relevance += 0.4;
    }
    
    // Check value relevance (if it's a string)
    if (typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase())) {
      relevance += 0.3;
    }
    
    // Check access patterns (frequently accessed memories are more relevant)
    const accessCount = this._accessPatterns.get(key) || 0;
    relevance += Math.min(0.2, accessCount * 0.05);
    
    // Check forgetting curve (stronger memories are more relevant)
    const forgetting = this._forgettingCurve.get(key);
    if (forgetting) {
      relevance += forgetting.strength * 0.1;
    }
    
    return Math.min(1, relevance);
  }

  private _analyzeMemoryPatterns(memories: Array<{ key: string; value: any; relevance: number }>): string[] {
    const patterns: string[] = [];
    
    // Analyze access patterns
    const highAccessMemories = memories.filter(m => (this._accessPatterns.get(m.key) || 0) > 5);
    if (highAccessMemories.length > 0) {
      patterns.push('frequently accessed');
    }
    
    // Analyze memory types
    const memoryTypes = new Set(memories.map(m => this._memoryHierarchy.get(m.key)));
    if (memoryTypes.size > 1) {
      patterns.push('mixed memory types');
    }
    
    // Analyze relevance distribution
    const avgRelevance = memories.reduce((sum, m) => sum + m.relevance, 0) / memories.length;
    if (avgRelevance > 0.7) {
      patterns.push('high relevance cluster');
    }
    
    return patterns;
  }

  private _identifyKnowledgeGaps(problem: Problem, memories: Array<{ key: string; value: any; relevance: number }>): string[] {
    const gaps: string[] = [];
    
    // Check if we have memories for each requirement
    problem.requirements.forEach(req => {
      const hasMemory = memories.some(m => 
        m.key.toLowerCase().includes(req.toLowerCase()) || 
        (typeof m.value === 'string' && m.value.toLowerCase().includes(req.toLowerCase()))
      );
      
      if (!hasMemory) {
        gaps.push(req);
      }
    });
    
    return gaps;
  }

  private _determineMemoryStrategy(insights: string[]): string {
    if (insights.some(i => i.includes('patterns'))) {
      return 'pattern-based';
    } else if (insights.some(i => i.includes('experiences'))) {
      return 'experience-based';
    } else if (insights.some(i => i.includes('knowledge'))) {
      return 'knowledge-based';
    } else {
      return 'adaptive memory';
    }
  }

  private _summarizeMemorySources(insights: string[]): string {
    const sources: string[] = [];
    
    if (insights.some(i => i.includes('experiences'))) {
      sources.push('past experiences');
    }
    
    if (insights.some(i => i.includes('knowledge'))) {
      sources.push('stored knowledge');
    }
    
    if (insights.some(i => i.includes('patterns'))) {
      sources.push('identified patterns');
    }
    
    return sources.length > 0 ? sources.join(', ') : 'available memories';
  }

  private _identifyKeyAspects(problem: Problem): string {
    return problem.requirements.slice(0, 2).join(' and ');
  }

  private _defineMemoryStrategy(insights: string[]): string {
    if (insights.some(i => i.includes('gaps'))) {
      return 'identify and fill knowledge gaps';
    } else if (insights.some(i => i.includes('patterns'))) {
      return 'apply pattern recognition';
    } else {
      return 'leverage existing knowledge';
    }
  }

  private async _storeExperience(experience: Experience): Promise<void> {
    const key = `experience:${experience.id}`;
    await this.storeMemory(key, experience, 'episodic');
  }

  private _extractMemoryPatterns(experience: Experience): Map<string, any> {
    const patterns = new Map<string, any>();
    
    if (experience.lessons.length > 0) {
      patterns.set(`lessons:${experience.id}`, experience.lessons);
    }
    
    if (experience.context) {
      patterns.set(`context:${experience.id}`, experience.context);
    }
    
    return patterns;
  }

  private async _storePatterns(patterns: Map<string, any>): Promise<void> {
    patterns.forEach(async (value, key) => {
      await this.storeMemory(key, value, 'semantic');
    });
  }

  private async _updateAssociations(experience: Experience): Promise<void> {
    // Create associations between experience and its components
    const experienceKey = `experience:${experience.id}`;
    
    if (experience.lessons.length > 0) {
      await this.createAssociation(experienceKey, `lessons:${experience.id}`, 0.8);
    }
    
    if (experience.context) {
      await this.createAssociation(experienceKey, `context:${experience.id}`, 0.6);
    }
  }

  private async _applyForgettingCurve(experience: Experience): Promise<void> {
    // Apply forgetting curve to related memories
    const experienceKey = `experience:${experience.id}`;
    const associations = await this.getAssociations(experienceKey);
    
    associations.forEach(async (assocKey) => {
      const forgetting = this._forgettingCurve.get(assocKey);
      if (forgetting) {
        // Decay strength over time
        const timeDiff = Date.now() - forgetting.lastAccess.getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        forgetting.strength = Math.max(0.1, forgetting.strength - (daysDiff * 0.01));
        this._forgettingCurve.set(assocKey, forgetting);
      }
    });
  }

  private async _createAssociations(key: string, value: any): Promise<void> {
    // Create associations based on content similarity
    for (const [existingKey, existingValue] of this._memoryStore.entries()) {
      if (existingKey !== key) {
        const similarity = this._calculateSimilarity(value, existingValue);
        if (similarity > 0.5) {
          await this.createAssociation(key, existingKey, similarity);
        }
      }
    }
  }

  private _calculateSimilarity(value1: any, value2: any): number {
    // Simple similarity calculation
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      const words1 = new Set(value1.toLowerCase().split(/\s+/));
      const words2 = new Set(value2.toLowerCase().split(/\s+/));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      return intersection.size / union.size;
    }
    return 0.1; // Default low similarity for non-string values
  }

  private async _handleMemoryQuery(message: AgentMessage): Promise<void> {
    logger.info(`MemoryAgent ${this.id}: Processing memory query: ${message.content}`);
  }

  private async _storeInsight(message: AgentMessage): Promise<void> {
    const key = `insight:${Date.now()}`;
    await this.storeMemory(key, message.content, 'semantic');
  }

  private async _handleMemoryCoordination(message: AgentMessage): Promise<void> {
    logger.info(`MemoryAgent ${this.id}: Coordinating memory operations: ${message.content}`);
  }

  private async _integrateLearningMessage(message: AgentMessage): Promise<void> {
    const key = `learning:${Date.now()}`;
    await this.storeMemory(key, message.content, 'procedural');
  }
}