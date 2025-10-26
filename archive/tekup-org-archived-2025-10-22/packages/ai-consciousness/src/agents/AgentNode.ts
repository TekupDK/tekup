import { 
  AgentSpecialty, 
  AgentMessage, 
  Problem, 
  Solution, 
  Experience, 
  AgentCapability, 
  AgentState 
} from '../types';

/**
 * Core interface for AI agents in the distributed consciousness network
 */
export interface AgentNode {
  // Core identity and capabilities
  readonly id: string;
  readonly specialty: AgentSpecialty;
  readonly capabilities: AgentCapability[];
  
  // Current state
  getState(): AgentState;
  
  // Core functionality
  communicate(message: AgentMessage, target?: string): Promise<void>;
  contribute(problem: Problem): Promise<Solution>;
  learn(experience: Experience): Promise<void>;
  
  // Network operations
  connect(agent: AgentNode): Promise<void>;
  disconnect(agentId: string): Promise<void>;
  getConnections(): string[];
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  isActive(): boolean;
}

/**
 * Abstract base class for implementing specialized AI agents
 */
export abstract class BaseAgentNode implements AgentNode {
  protected _id: string;
  protected _specialty: AgentSpecialty;
  protected _capabilities: AgentCapability[];
  protected _connections: Set<string> = new Set();
  protected _state: AgentState;
  protected _active: boolean = false;
  protected _messageQueue: AgentMessage[] = [];
  protected _experienceLog: Experience[] = [];

  constructor(
    id: string, 
    specialty: AgentSpecialty, 
    capabilities: AgentCapability[]
  ) {
    this._id = id;
    this._specialty = specialty;
    this._capabilities = capabilities;
    this._state = {
      id: id,
      status: 'idle',
      load: 0,
      health: 1,
      lastActivity: new Date()
    };
  }

  get id(): string { return this._id; }
  get specialty(): AgentSpecialty { return this._specialty; }
  get capabilities(): AgentCapability[] { return this._capabilities; }

  getState(): AgentState {
    return { ...this._state };
  }

  async communicate(message: AgentMessage, target?: string): Promise<void> {
    if (!this._active) {
      throw new Error(`Agent ${this._id} is not active`);
    }

    // Add to message queue for processing
    this._messageQueue.push({
      ...message,
      senderId: this._id,
      targetId: target,
      timestamp: new Date()
    });

    this._updateState('communicating');
    await this._processMessage(message);
  }

  async contribute(problem: Problem): Promise<Solution> {
    if (!this._active) {
      throw new Error(`Agent ${this._id} is not active`);
    }

    this._updateState('working', problem.id);
    
    try {
      const solution = await this._solveProblem(problem);
      this._updateState('idle');
      return solution;
    } catch (error) {
      this._updateState('error');
      throw error;
    }
  }

  async learn(experience: Experience): Promise<void> {
    this._experienceLog.push(experience);
    await this._integrateLearning(experience);
    this._updateState('learning');
  }

  async connect(agent: AgentNode): Promise<void> {
    if (agent.id === this._id) {
      throw new Error('Cannot connect to self');
    }
    
    this._connections.add(agent.id);
    await this._onAgentConnected(agent);
  }

  async disconnect(agentId: string): Promise<void> {
    this._connections.delete(agentId);
    await this._onAgentDisconnected(agentId);
  }

  getConnections(): string[] {
    return Array.from(this._connections);
  }

  async start(): Promise<void> {
    this._active = true;
    this._state.status = 'idle';
    this._state.lastActivity = new Date();
    await this._onStart();
  }

  async stop(): Promise<void> {
    this._active = false;
    this._state.status = 'idle';
    await this._onStop();
  }

  isActive(): boolean {
    return this._active;
  }

  // Abstract methods to be implemented by specialized agents
  protected abstract _solveProblem(problem: Problem): Promise<Solution>;
  protected abstract _processMessage(message: AgentMessage): Promise<void>;
  protected abstract _integrateLearning(experience: Experience): Promise<void>;
  
  // Optional lifecycle hooks
  protected async _onStart(): Promise<void> {}
  protected async _onStop(): Promise<void> {}
  protected async _onAgentConnected(agent: AgentNode): Promise<void> {}
  protected async _onAgentDisconnected(agentId: string): Promise<void> {}

  // Helper methods
  protected _updateState(status: AgentState['status'], currentTask?: string): void {
    this._state.status = status;
    this._state.currentTask = currentTask;
    this._state.lastActivity = new Date();
    
    if (status === 'working') {
      this._state.load = Math.min(1, this._state.load + 0.1);
    } else if (status === 'idle') {
      this._state.load = Math.max(0, this._state.load - 0.05);
    }
  }

  protected _getCapabilityStrength(specialty: AgentSpecialty): number {
    const capability = this._capabilities.find(c => c.specialty === specialty);
    return capability?.strength || 0;
  }

  protected _canHandleProblem(problem: Problem): boolean {
    // Check if agent has the capability to handle this problem type
    const relevantCapabilities = this._capabilities.filter(c => 
      problem.requirements.some(req => req.toLowerCase().includes(c.specialty))
    );
    
    return relevantCapabilities.length > 0 && 
           relevantCapabilities.some(c => c.strength >= problem.complexity * 0.7);
  }
}