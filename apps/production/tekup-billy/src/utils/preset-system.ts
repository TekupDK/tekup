import { dataLogger } from './data-logger.js';

export interface UserPattern {
  userId?: string;
  businessType: 'freelancer' | 'retail' | 'service' | 'unknown';
  commonActions: string[];
  frequentParameters: Record<string, any>;
  timePatterns: {
    mostActiveHours: number[];
    mostActiveDays: string[];
  };
  preferences: {
    defaultPaymentTerms?: number;
    preferredInvoiceFormat?: string;
    commonProductCategories?: string[];
    averageInvoiceValue?: number;
  };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  businessType: 'freelancer' | 'retail' | 'service' | 'general';
  actions: PresetAction[];
  conditions?: PresetCondition[];
  usage_count: number;
  created_at: Date;
  last_used?: Date;
}

export interface PresetAction {
  tool: string;
  action: string;
  parameters: Record<string, any>;
  order: number;
  description: string;
}

export interface PresetCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export class PresetSystem {
  private presets: Map<string, Preset> = new Map();
  private userPatterns: Map<string, UserPattern> = new Map();

  constructor() {
    this.initializeDefaultPresets();
  }

  /**
   * Analyze user behavior from data logger to identify patterns
   */
  async analyzeUserPatterns(userId: string = 'default'): Promise<UserPattern> {
    const logs = dataLogger.getRecentActions(100);
    const userLogs = logs.filter((log: any) => log.userId === userId || !log.userId);

    if (userLogs.length === 0) {
      return {
        businessType: 'unknown',
        commonActions: [],
        frequentParameters: {},
        timePatterns: {
          mostActiveHours: [],
          mostActiveDays: []
        },
        preferences: {}
      };
    }

    // Analyze patterns
    const actionCounts: Record<string, number> = {};
    const parameterCounts: Record<string, Record<string, number>> = {};

    userLogs.forEach((log: any) => {
      const actionKey = `${log.tool}_${log.action}`;
      actionCounts[actionKey] = (actionCounts[actionKey] || 0) + 1;

      if (log.parameters) {
        Object.entries(log.parameters).forEach(([key, value]) => {
          if (!parameterCounts[key]) {
            parameterCounts[key] = {};
          }
          const valueStr = String(value);
          parameterCounts[key][valueStr] = (parameterCounts[key][valueStr] || 0) + 1;
        });
      }
    });

    const commonActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action);

    const frequentParameters: Record<string, any> = {};
    Object.entries(parameterCounts).forEach(([key, values]) => {
      const mostFrequent = Object.entries(values)
        .sort(([, a], [, b]) => b - a)[0];
      if (mostFrequent) {
        frequentParameters[key] = mostFrequent[0];
      }
    });

    const businessType = this.inferBusinessType(commonActions);

    const pattern: UserPattern = {
      userId,
      businessType,
      commonActions,
      frequentParameters,
      timePatterns: {
        mostActiveHours: [9, 10, 11, 14, 15, 16],
        mostActiveDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      preferences: this.calculatePreferences(userLogs)
    };

    this.userPatterns.set(userId, pattern);
    return pattern;
  }

  /**
   * Generate personalized presets based on user patterns
   */
  async generatePersonalizedPresets(userId: string = 'default'): Promise<Preset[]> {
    const pattern = await this.analyzeUserPatterns(userId);
    const presets: Preset[] = [];

    if (pattern.commonActions.length > 0) {
      presets.push(this.createWorkflowPreset(pattern));
      presets.push(this.createQuickActionPreset(pattern));
    }

    presets.push(this.createQuickInvoicePreset(pattern));
    presets.push(this.createCustomerOnboardingPreset(pattern));

    // Store presets
    presets.forEach(preset => {
      this.presets.set(preset.id, preset);
    });

    return presets;
  }

  /**
   * Get recommended presets for a user
   */
  getRecommendedPresets(userId: string = 'default', limit: number = 5): Preset[] {
    const pattern = this.userPatterns.get(userId);
    if (!pattern) {
      return Array.from(this.presets.values()).slice(0, limit);
    }

    const allPresets = Array.from(this.presets.values());
    return allPresets
      .filter(preset => 
        preset.businessType === pattern.businessType || 
        preset.businessType === 'general'
      )
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  }

  /**
   * Execute a preset
   */
  async executePreset(presetId: string, overrideParams?: Record<string, any>): Promise<any[]> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset ${presetId} not found`);
    }

    const startTime = Date.now();
    const results: any[] = [];

    try {
      // Log start
      await dataLogger.logAction({
        action: 'execute_preset',
        tool: 'preset_system',
        parameters: { presetId, overrideParams },
        result: 'success',
        metadata: { executionTime: 0 }
      });

      // Execute actions in order
      const sortedActions = preset.actions.sort((a, b) => a.order - b.order);
      
      for (const action of sortedActions) {
        const params = { ...action.parameters, ...overrideParams };
        const result = await this.executeAction(action.tool, action.action, params);
        results.push(result);
      }

      // Update usage count
      preset.usage_count++;
      preset.last_used = new Date();

      const executionTime = Date.now() - startTime;

      // Log success
      await dataLogger.logAction({
        action: 'execute_preset',
        tool: 'preset_system',
        parameters: { presetId, overrideParams },
        result: 'success',
        metadata: { executionTime }
      });

      return results;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log error
      await dataLogger.logAction({
        action: 'execute_preset',
        tool: 'preset_system',
        parameters: { presetId, overrideParams },
        result: 'error',
        metadata: { 
          executionTime,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });

      throw error;
    }
  }

  /**
   * List all available presets
   */
  listPresets(businessType?: string): Preset[] {
    const allPresets = Array.from(this.presets.values());
    if (businessType) {
      return allPresets.filter(preset => 
        preset.businessType === businessType || preset.businessType === 'general'
      );
    }
    return allPresets;
  }

  /**
   * Create a custom preset
   */
  createCustomPreset(
    name: string,
    description: string,
    businessType: 'freelancer' | 'retail' | 'service' | 'general',
    actions: PresetAction[]
  ): Preset {
    const preset: Preset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      businessType,
      actions,
      usage_count: 0,
      created_at: new Date()
    };

    this.presets.set(preset.id, preset);
    return preset;
  }

  private initializeDefaultPresets(): void {
    const defaultPresets: Preset[] = [
      {
        id: 'quick_customer_create',
        name: 'Quick Customer Creation',
        description: 'Quickly create a new customer',
        businessType: 'general',
        actions: [{
          tool: 'customers',
          action: 'create',
          parameters: {},
          order: 1,
          description: 'Create new customer'
        }],
        usage_count: 0,
        created_at: new Date()
      },
      {
        id: 'quick_invoice_create',
        name: 'Quick Invoice Creation',
        description: 'Quickly create a new invoice',
        businessType: 'general',
        actions: [{
          tool: 'invoices',
          action: 'create',
          parameters: { amount: 100, description: 'Service provided' },
          order: 1,
          description: 'Create new invoice'
        }],
        usage_count: 0,
        created_at: new Date()
      }
    ];

    defaultPresets.forEach(preset => {
      this.presets.set(preset.id, preset);
    });
  }

  private inferBusinessType(commonActions: string[]): 'freelancer' | 'retail' | 'service' | 'unknown' {
    const actionString = commonActions.join(' ').toLowerCase();
    
    if (actionString.includes('invoice') && actionString.includes('customer')) {
      return 'freelancer';
    } else if (actionString.includes('product') && actionString.includes('inventory')) {
      return 'retail';
    } else if (actionString.includes('service') || actionString.includes('booking')) {
      return 'service';
    }
    
    return 'unknown';
  }

  private calculatePreferences(logs: any[]): UserPattern['preferences'] {
    const preferences: UserPattern['preferences'] = {};
    
    // Calculate average invoice value
    const invoiceAmounts = logs
      .filter(log => log.tool === 'invoices' && log.parameters?.amount)
      .map(log => Number(log.parameters.amount))
      .filter(amount => !isNaN(amount));
    
    if (invoiceAmounts.length > 0) {
      preferences.averageInvoiceValue = Math.round(
        invoiceAmounts.reduce((sum, amount) => sum + amount, 0) / invoiceAmounts.length
      );
    }

    return preferences;
  }

  private createWorkflowPreset(pattern: UserPattern): Preset {
    const actions: PresetAction[] = pattern.commonActions.slice(0, 3).map((action, index) => {
      const parts = action.split('_');
      const tool = parts[0] || 'unknown';
      const actionName = parts.slice(1).join('_') || 'action';
      
      return {
        tool,
        action: actionName,
        parameters: {},
        order: index + 1,
        description: `Execute ${actionName} on ${tool}`
      };
    });

    const businessType = pattern.businessType === 'unknown' ? 'general' : pattern.businessType;

    return {
      id: `workflow_${pattern.businessType}_${Date.now()}`,
      name: `${pattern.businessType} Workflow`,
      description: `Automated workflow based on your common ${pattern.businessType} activities`,
      businessType,
      actions,
      usage_count: 0,
      created_at: new Date()
    };
  }

  private createQuickActionPreset(pattern: UserPattern): Preset {
    if (pattern.commonActions.length === 0) {
      // Return a default preset if no common actions
      return {
        id: `quick_default_${Date.now()}`,
        name: 'Quick Action',
        description: 'Default quick action preset',
        businessType: 'general',
        actions: [{
          tool: 'customers',
          action: 'list',
          parameters: {},
          order: 1,
          description: 'List customers'
        }],
        usage_count: 0,
        created_at: new Date()
      };
    }

    const mostCommonAction = pattern.commonActions[0];
    if (!mostCommonAction) {
      return {
        id: `quick_default_${Date.now()}`,
        name: 'Quick Default Action',
        description: 'Default quick action preset',
        businessType: 'general',
        actions: [{
          tool: 'customers',
          action: 'list',
          parameters: {},
          order: 1,
          description: 'List customers'
        }],
        usage_count: 0,
        created_at: new Date()
      };
    }
    
    const parts = mostCommonAction.split('_');
    const tool = parts[0] || 'unknown';
    const actionName = parts.slice(1).join('_') || 'action';

    const businessType = pattern.businessType === 'unknown' ? 'general' : pattern.businessType;

    return {
      id: `quick_${tool}_${actionName}_${Date.now()}`,
      name: `Quick ${actionName}`,
      description: `Quickly execute ${actionName} with your preferred settings`,
      businessType,
      actions: [{
        tool,
        action: actionName,
        parameters: {},
        order: 1,
        description: `Quick ${actionName} action`
      }],
      usage_count: 0,
      created_at: new Date()
    };
  }

  private createQuickInvoicePreset(pattern: UserPattern): Preset {
    const businessType = pattern.businessType === 'unknown' ? 'general' : pattern.businessType;

    return {
      id: `quick_invoice_${Date.now()}`,
      name: 'Quick Invoice Creation',
      description: 'Create an invoice with your preferred settings',
      businessType,
      actions: [{
        tool: 'invoices',
        action: 'create',
        parameters: {
          amount: pattern.preferences.averageInvoiceValue || 100,
          description: 'Service provided',
          paymentTermsDays: pattern.preferences.defaultPaymentTerms || 30
        },
        order: 1,
        description: 'Create invoice with preferred settings'
      }],
      usage_count: 0,
      created_at: new Date()
    };
  }

  private createCustomerOnboardingPreset(pattern: UserPattern): Preset {
    const businessType = pattern.businessType === 'unknown' ? 'general' : pattern.businessType;

    return {
      id: `customer_onboarding_${Date.now()}`,
      name: 'Customer Onboarding',
      description: 'Complete customer setup workflow',
      businessType,
      actions: [
        {
          tool: 'customers',
          action: 'create',
          parameters: {},
          order: 1,
          description: 'Create new customer'
        },
        {
          tool: 'invoices',
          action: 'create',
          parameters: {
            amount: pattern.preferences.averageInvoiceValue || 100,
            description: 'Initial service',
            paymentTermsDays: pattern.preferences.defaultPaymentTerms || 30
          },
          order: 2,
          description: 'Create initial invoice'
        }
      ],
      usage_count: 0,
      created_at: new Date()
    };
  }

  private async executeAction(tool: string, action: string, parameters: Record<string, any>): Promise<any> {
    // This would integrate with the actual tool implementations
    // For now, return a mock result
    return {
      tool,
      action,
      parameters,
      result: 'success',
      timestamp: new Date()
    };
  }
}

export const presetSystem = new PresetSystem();