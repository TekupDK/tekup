import { faker } from '@faker-js/faker';

export interface VoiceCommand {
  text: string;
  language: 'da' | 'en';
  expectedIntent: string;
  expectedEntities: Record<string, any>;
  context?: Record<string, any>;
}

export interface VoiceResponse {
  text: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  actions: string[];
}

export class VoiceAgentTester {
  private testCommands: VoiceCommand[] = [];
  private mockGeminiResponses: Map<string, VoiceResponse> = new Map();

  constructor() {
    this.initializeTestCommands();
    this.initializeMockResponses();
  }

  // Danish language test commands for different business scenarios
  private initializeTestCommands(): void {
    // Foodtruck Fiesta commands
    this.testCommands.push(
      {
        text: 'Opret en bestilling for John Doe med 2 hotdogs og 1 cola',
        language: 'da',
        expectedIntent: 'create_order',
        expectedEntities: {
          customer: 'John Doe',
          items: ['hotdogs', 'cola'],
          quantities: [2, 1],
        },
        context: { business: 'foodtruck' },
      },
      {
        text: 'Hvor er min foodtruck lige nu?',
        language: 'da',
        expectedIntent: 'get_location',
        expectedEntities: { asset: 'foodtruck' },
        context: { business: 'foodtruck' },
      },
      {
        text: 'Start betaling for ordre 12345',
        language: 'da',
        expectedIntent: 'start_payment',
        expectedEntities: { orderId: '12345' },
        context: { business: 'foodtruck' },
      }
    );

    // Essenza Perfume commands
    this.testCommands.push(
      {
        text: 'Tjek lagerbeholdning for Chanel No. 5',
        language: 'da',
        expectedIntent: 'check_inventory',
        expectedEntities: { product: 'Chanel No. 5' },
        context: { business: 'perfume' },
      },
      {
        text: 'Anbefal en parfume til en kvinde på 30 år',
        language: 'da',
        expectedIntent: 'recommend_product',
        expectedEntities: { 
          gender: 'female',
          age: 30,
          category: 'perfume'
        },
        context: { business: 'perfume' },
      }
    );

    // Rendetalje commands
    this.testCommands.push(
      {
        text: 'Opret et nyt projekt for husrenovering i København',
        language: 'da',
        expectedIntent: 'create_project',
        expectedEntities: {
          projectType: 'husrenovering',
          location: 'København',
        },
        context: { business: 'construction' },
      },
      {
        text: 'Planlæg møde med kunde om projekt 67890',
        language: 'da',
        expectedIntent: 'schedule_meeting',
        expectedEntities: { projectId: '67890' },
        context: { business: 'construction' },
      }
    );

    // Cross-business commands
    this.testCommands.push(
      {
        text: 'Vis mig alle leads fra denne måned',
        language: 'da',
        expectedIntent: 'list_leads',
        expectedEntities: { timeRange: 'this_month' },
        context: { business: 'cross-business' },
      },
      {
        text: 'Start compliance check for NIS2',
        language: 'da',
        expectedIntent: 'start_compliance',
        expectedEntities: { regulation: 'NIS2' },
        context: { business: 'cross-business' },
      }
    );
  }

  private initializeMockResponses(): void {
    this.testCommands.forEach(command => {
      this.mockGeminiResponses.set(command.text, {
        text: this.generateMockResponse(command),
        intent: command.expectedIntent,
        entities: command.expectedEntities,
        confidence: faker.number.float({ min: 0.8, max: 1.0 }),
        actions: this.generateActions(command.expectedIntent),
      });
    });
  }

  private generateMockResponse(command: VoiceCommand): string {
    const responses = {
      create_order: 'Jeg opretter en bestilling for dig',
      get_location: 'Din foodtruck er lokaleret på Nørrebrogade 42',
      start_payment: 'Jeg starter betalingsprocessen for ordre 12345',
      check_inventory: 'Lagerbeholdning for Chanel No. 5: 15 stk på lager',
      recommend_product: 'Baseret på din beskrivelse, vil jeg anbefale Dior J\'adore',
      create_project: 'Jeg opretter et nyt projekt for husrenovering i København',
      schedule_meeting: 'Jeg planlægger et møde om projekt 67890',
      list_leads: 'Her er alle leads fra denne måned',
      start_compliance: 'Jeg starter compliance check for NIS2',
    };

    return responses[command.expectedIntent] || 'Jeg forstod din forespørgsel';
  }

  private generateActions(intent: string): string[] {
    const actionMap: Record<string, string[]> = {
      create_order: ['validate_customer', 'check_inventory', 'create_order_record'],
      get_location: ['get_gps_coordinates', 'format_address'],
      start_payment: ['validate_order', 'initiate_payment_gateway'],
      check_inventory: ['query_database', 'format_response'],
      recommend_product: ['analyze_preferences', 'query_catalog', 'rank_products'],
      create_project: ['validate_requirements', 'create_project_record', 'notify_team'],
      schedule_meeting: ['check_availability', 'create_calendar_event', 'send_invitations'],
      list_leads: ['query_database', 'apply_filters', 'format_results'],
      start_compliance: ['validate_regulation', 'create_checklist', 'assign_responsibilities'],
    };

    return actionMap[intent] || ['process_request'];
  }

  // Test voice command recognition
  async testVoiceRecognition(command: VoiceCommand): Promise<VoiceResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockResponse = this.mockGeminiResponses.get(command.text);
    if (!mockResponse) {
      throw new Error(`No mock response found for command: ${command.text}`);
    }
    
    return mockResponse;
  }

  // Test intent classification accuracy
  async testIntentClassification(commands: VoiceCommand[]): Promise<{
    accuracy: number;
    misclassifications: Array<{ command: string; expected: string; actual: string }>;
  }> {
    let correct = 0;
    const misclassifications: Array<{ command: string; expected: string; actual: string }> = [];

    for (const command of commands) {
      const response = await this.testVoiceRecognition(command);
      
      if (response.intent === command.expectedIntent) {
        correct++;
      } else {
        misclassifications.push({
          command: command.text,
          expected: command.expectedIntent,
          actual: response.intent,
        });
      }
    }

    return {
      accuracy: correct / commands.length,
      misclassifications,
    };
  }

  // Test entity extraction
  async testEntityExtraction(commands: VoiceCommand[]): Promise<{
    accuracy: number;
    missingEntities: Array<{ command: string; missing: string[] }>;
  }> {
    let totalEntities = 0;
    let extractedEntities = 0;
    const missingEntities: Array<{ command: string; missing: string[] }> = [];

    for (const command of commands) {
      const response = await this.testVoiceRecognition(command);
      const expectedKeys = Object.keys(command.expectedEntities);
      totalEntities += expectedKeys.length;

      for (const key of expectedKeys) {
        if (response.entities[key] !== undefined) {
          extractedEntities++;
        }
      }

      const missing = expectedKeys.filter(key => response.entities[key] === undefined);
      if (missing.length > 0) {
        missingEntities.push({
          command: command.text,
          missing,
        });
      }
    }

    return {
      accuracy: extractedEntities / totalEntities,
      missingEntities,
    };
  }

  // Test Danish language processing
  async testDanishLanguageProcessing(): Promise<{
    commands: VoiceCommand[];
    results: Array<{ command: VoiceCommand; response: VoiceResponse; processingTime: number }>;
  }> {
    const danishCommands = this.testCommands.filter(cmd => cmd.language === 'da');
    const results = [];

    for (const command of danishCommands) {
      const startTime = Date.now();
      const response = await this.testVoiceRecognition(command);
      const processingTime = Date.now() - startTime;

      results.push({ command, response, processingTime });
    }

    return { commands: danishCommands, results };
  }

  // Test business-specific workflows
  async testBusinessWorkflow(businessType: string): Promise<{
    workflow: string[];
    success: boolean;
    errors: string[];
  }> {
    const businessCommands = this.testCommands.filter(cmd => 
      cmd.context?.business === businessType
    );

    const workflow: string[] = [];
    const errors: string[] = [];
    let success = true;

    for (const command of businessCommands) {
      try {
        const response = await this.testVoiceRecognition(command);
        workflow.push(`${command.text} → ${response.intent}`);
        
        if (response.confidence < 0.8) {
          errors.push(`Low confidence for: ${command.text}`);
          success = false;
        }
      } catch (error) {
        errors.push(`Failed to process: ${command.text} - ${error}`);
        success = false;
      }
    }

    return { workflow, success, errors };
  }

  // Get all test commands
  getTestCommands(): VoiceCommand[] {
    return [...this.testCommands];
  }

  // Get commands by business type
  getCommandsByBusiness(businessType: string): VoiceCommand[] {
    return this.testCommands.filter(cmd => cmd.context?.business === businessType);
  }

  // Get commands by language
  getCommandsByLanguage(language: 'da' | 'en'): VoiceCommand[] {
    return this.testCommands.filter(cmd => cmd.language === language);
  }
}

// Factory function for creating voice agent testers
export function createVoiceAgentTester(): VoiceAgentTester {
  return new VoiceAgentTester();
}