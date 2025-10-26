/**
 * Base Agent Node for MiniCPM Integration
 * 
 * Simplified version of BaseAgentNode for standalone use
 */

export interface AgentConfig {
  specialization: string;
  capabilities: string[];
}

export abstract class BaseAgentNode {
  public readonly id: string;
  public readonly specialty: string;
  public readonly capabilities: string[];
  protected logger: any;

  constructor(id: string, specialty: string, config: AgentConfig) {
    this.id = id;
    this.specialty = specialty;
    this.capabilities = config.capabilities;
    
    // Simple console logger
    this.logger = {
      info: (message: string, ...args: any[]) => console.log(`[${this.id}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => console.warn(`[${this.id}] ${message}`, ...args),
      error: (message: string, ...args: any[]) => console.error(`[${this.id}] ${message}`, ...args)
    };
  }

  abstract initialize(): Promise<void>;
  abstract cleanup(): Promise<void>;
  
  getState(): any {
    return {
      id: this.id,
      specialty: this.specialty,
      capabilities: this.capabilities,
      isActive: true
    };
  }
}