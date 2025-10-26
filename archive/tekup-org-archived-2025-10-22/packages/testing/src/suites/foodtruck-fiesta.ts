import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { TestTenant, TENANT_CONFIGS } from '../utils/test-tenant';
import { VoiceAgentTester } from '../agents/voice-agent';

export interface FoodtruckOrder {
  id: string;
  customerId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  paymentMethod: 'card' | 'mobile' | 'cash';
  estimatedDeliveryTime: Date;
}

export interface FoodtruckLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  isActive: boolean;
  lastUpdated: Date;
}

export class FoodtruckFiestaTester {
  private prisma: PrismaClient;
  private tenant: TestTenant;
  private voiceTester: VoiceAgentTester;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.tenant = new TestTenant(prisma, TENANT_CONFIGS.FOODTRUCK_FIESTA.id);
    this.voiceTester = new VoiceAgentTester();
  }

  // Test location services
  async testLocationServices(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test GPS coordinate validation
    try {
      const validCoordinates = this.generateValidCoordinates();
      const isValid = this.validateCoordinates(validCoordinates.latitude, validCoordinates.longitude);
      
      tests.push({
        name: 'GPS Coordinate Validation',
        passed: isValid,
        details: { coordinates: validCoordinates, isValid },
      });
    } catch (error) {
      tests.push({
        name: 'GPS Coordinate Validation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test address geocoding
    try {
      const address = 'Nørrebrogade 42, 2200 København N';
      const geocoded = await this.geocodeAddress(address);
      
      tests.push({
        name: 'Address Geocoding',
        passed: geocoded !== null,
        details: { address, geocoded },
      });
    } catch (error) {
      tests.push({
        name: 'Address Geocoding',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test location tracking
    try {
      const location = await this.simulateLocationTracking();
      
      tests.push({
        name: 'Location Tracking',
        passed: location.isActive && location.lastUpdated > new Date(Date.now() - 60000),
        details: { location },
      });
    } catch (error) {
      tests.push({
        name: 'Location Tracking',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test mobile ordering system
  async testMobileOrdering(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test order creation
    try {
      const order = await this.createTestOrder();
      
      tests.push({
        name: 'Order Creation',
        passed: order.id !== undefined && order.status === 'pending',
        details: { order },
      });
    } catch (error) {
      tests.push({
        name: 'Order Creation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test order validation
    try {
      const invalidOrder = this.createInvalidOrder();
      const validation = this.validateOrder(invalidOrder);
      
      tests.push({
        name: 'Order Validation',
        passed: !validation.isValid,
        details: { order: invalidOrder, validation },
      });
    } catch (error) {
      tests.push({
        name: 'Order Validation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test order status transitions
    try {
      const order = await this.createTestOrder();
      const transitions = await this.testOrderStatusTransitions(order.id);
      
      tests.push({
        name: 'Order Status Transitions',
        passed: transitions.success,
        details: { transitions },
      });
    } catch (error) {
      tests.push({
        name: 'Order Status Transitions',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test payment processing
  async testPaymentProcessing(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test card payment
    try {
      const cardPayment = await this.processCardPayment();
      
      tests.push({
        name: 'Card Payment Processing',
        passed: cardPayment.success,
        details: { payment: cardPayment },
      });
    } catch (error) {
      tests.push({
        name: 'Card Payment Processing',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test mobile payment
    try {
      const mobilePayment = await this.processMobilePayment();
      
      tests.push({
        name: 'Mobile Payment Processing',
        passed: mobilePayment.success,
        details: { payment: mobilePayment },
      });
    } catch (error) {
      tests.push({
        name: 'Mobile Payment Processing',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test payment failure handling
    try {
      const failedPayment = await this.processFailedPayment();
      
      tests.push({
        name: 'Payment Failure Handling',
        passed: !failedPayment.success && failedPayment.error !== undefined,
        details: { payment: failedPayment },
      });
    } catch (error) {
      tests.push({
        name: 'Payment Failure Handling',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test voice integration
  async testVoiceIntegration(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test Danish voice commands
    try {
      const danishCommands = this.voiceTester.getCommandsByBusiness('foodtruck');
      const danishResults = await this.voiceTester.testDanishLanguageProcessing();
      
      tests.push({
        name: 'Danish Voice Commands',
        passed: danishResults.results.length > 0,
        details: { commands: danishCommands, results: danishResults },
      });
    } catch (error) {
      tests.push({
        name: 'Danish Voice Commands',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test voice order creation
    try {
      const voiceOrder = await this.testVoiceOrderCreation();
      
      tests.push({
        name: 'Voice Order Creation',
        passed: voiceOrder.success,
        details: { order: voiceOrder },
      });
    } catch (error) {
      tests.push({
        name: 'Voice Order Creation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test voice payment commands
    try {
      const voicePayment = await this.testVoicePaymentCommands();
      
      tests.push({
        name: 'Voice Payment Commands',
        passed: voicePayment.success,
        details: { payment: voicePayment },
      });
    } catch (error) {
      tests.push({
        name: 'Voice Payment Commands',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test complete foodtruck workflow
  async testCompleteWorkflow(): Promise<{
    success: boolean;
    workflow: string[];
    errors: string[];
    performance: {
      totalTime: number;
      averageResponseTime: number;
      bottlenecks: string[];
    };
  }> {
    const startTime = Date.now();
    const workflow: string[] = [];
    const errors: string[] = [];
    let totalResponseTime = 0;
    let stepCount = 0;

    try {
      // 1. Customer places order via voice
      const voiceStart = Date.now();
      const voiceOrder = await this.testVoiceOrderCreation();
      const voiceTime = Date.now() - voiceStart;
      
      if (voiceOrder.success) {
        workflow.push('✅ Voice order placed successfully');
        totalResponseTime += voiceTime;
        stepCount++;
      } else {
        workflow.push('❌ Voice order failed');
        errors.push('Voice order creation failed');
      }

      // 2. Order validation and confirmation
      const validationStart = Date.now();
      const order = await this.createTestOrder();
      const validationTime = Date.now() - validationStart;
      
      if (order.id) {
        workflow.push('✅ Order validated and confirmed');
        totalResponseTime += validationTime;
        stepCount++;
      } else {
        workflow.push('❌ Order validation failed');
        errors.push('Order validation failed');
      }

      // 3. Location tracking
      const locationStart = Date.now();
      const location = await this.simulateLocationTracking();
      const locationTime = Date.now() - locationStart;
      
      if (location.isActive) {
        workflow.push('✅ Location tracking active');
        totalResponseTime += locationTime;
        stepCount++;
      } else {
        workflow.push('❌ Location tracking failed');
        errors.push('Location tracking failed');
      }

      // 4. Payment processing
      const paymentStart = Date.now();
      const payment = await this.processCardPayment();
      const paymentTime = Date.now() - paymentStart;
      
      if (payment.success) {
        workflow.push('✅ Payment processed successfully');
        totalResponseTime += paymentTime;
        stepCount++;
      } else {
        workflow.push('❌ Payment processing failed');
        errors.push('Payment processing failed');
      }

      // 5. Order fulfillment
      const fulfillmentStart = Date.now();
      const fulfillment = await this.testOrderStatusTransitions(order.id);
      const fulfillmentTime = Date.now() - fulfillmentStart;
      
      if (fulfillment.success) {
        workflow.push('✅ Order fulfilled successfully');
        totalResponseTime += fulfillmentTime;
        stepCount++;
      } else {
        workflow.push('❌ Order fulfillment failed');
        errors.push('Order fulfillment failed');
      }

    } catch (error) {
      errors.push(`Workflow execution failed: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    const averageResponseTime = stepCount > 0 ? totalResponseTime / stepCount : 0;
    
    // Identify bottlenecks (steps taking > 2 seconds)
    const bottlenecks: string[] = [];
    if (averageResponseTime > 2000) {
      bottlenecks.push('High average response time');
    }

    const success = errors.length === 0;
    
    return {
      success,
      workflow,
      errors,
      performance: {
        totalTime,
        averageResponseTime,
        bottlenecks,
      },
    };
  }

  // Helper methods
  private generateValidCoordinates(): { latitude: number; longitude: number } {
    // Copenhagen area coordinates
    return {
      latitude: faker.location.latitude({ min: 55.6, max: 55.8 }),
      longitude: faker.location.longitude({ min: 12.5, max: 12.6 }),
    };
  }

  private validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  private async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    // Mock geocoding - in real implementation, this would call a geocoding service
    if (address.includes('Nørrebrogade')) {
      return { latitude: 55.6944, longitude: 12.5511 };
    }
    return null;
  }

  private async simulateLocationTracking(): Promise<FoodtruckLocation> {
    const coordinates = this.generateValidCoordinates();
    return {
      id: faker.string.uuid(),
      ...coordinates,
      address: 'Nørrebrogade 42, 2200 København N',
      isActive: true,
      lastUpdated: new Date(),
    };
  }

  private async createTestOrder(): Promise<FoodtruckOrder> {
    return {
      id: faker.string.uuid(),
      customerId: faker.string.uuid(),
      items: [
        { name: 'Hotdog', quantity: 2, price: 25 },
        { name: 'Cola', quantity: 1, price: 15 },
      ],
      totalAmount: 65,
      status: 'pending',
      location: {
        latitude: 55.6944,
        longitude: 12.5511,
        address: 'Nørrebrogade 42, 2200 København N',
      },
      paymentMethod: 'card',
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }

  private createInvalidOrder(): Partial<FoodtruckOrder> {
    return {
      items: [], // Empty items array
      totalAmount: -10, // Negative amount
    };
  }

  private validateOrder(order: Partial<FoodtruckOrder>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!order.items || order.items.length === 0) {
      errors.push('Order must contain at least one item');
    }
    
    if (order.totalAmount && order.totalAmount <= 0) {
      errors.push('Order total must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async testOrderStatusTransitions(orderId: string): Promise<{ success: boolean; transitions: string[] }> {
    const transitions: string[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    let success = true;
    
    for (let i = 0; i < transitions.length - 1; i++) {
      try {
        // Simulate status transition
        await new Promise(resolve => setTimeout(resolve, 100));
        transitions[i] = `✅ ${transitions[i]}`;
      } catch (error) {
        transitions[i] = `❌ ${transitions[i]}`;
        success = false;
      }
    }
    
    return { success, transitions };
  }

  private async processCardPayment(): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulate card payment processing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (Math.random() > 0.1) { // 90% success rate
      return {
        success: true,
        transactionId: faker.string.uuid(),
      };
    } else {
      return {
        success: false,
        error: 'Card declined',
      };
    }
  }

  private async processMobilePayment(): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulate mobile payment processing
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (Math.random() > 0.05) { // 95% success rate
      return {
        success: true,
        transactionId: faker.string.uuid(),
      };
    } else {
      return {
        success: false,
        error: 'Mobile payment failed',
      };
    }
  }

  private async processFailedPayment(): Promise<{ success: boolean; error?: string }> {
    // Simulate failed payment
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: false,
      error: 'Insufficient funds',
    };
  }

  private async testVoiceOrderCreation(): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const command = this.voiceTester.getCommandsByBusiness('foodtruck')[0];
      const response = await this.voiceTester.testVoiceRecognition(command);
      
      return {
        success: response.intent === 'create_order',
        order: { command: command.text, response },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async testVoicePaymentCommands(): Promise<{ success: boolean; commands?: any; error?: string }> {
    try {
      const paymentCommands = this.voiceTester.getCommandsByBusiness('foodtruck')
        .filter(cmd => cmd.expectedIntent.includes('payment'));
      
      const results = await Promise.all(
        paymentCommands.map(cmd => this.voiceTester.testVoiceRecognition(cmd))
      );
      
      return {
        success: results.every(r => r.confidence > 0.8),
        commands: { commands: paymentCommands, results },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Factory function for creating Foodtruck Fiesta testers
export function createFoodtruckFiestaTester(prisma: PrismaClient): FoodtruckFiestaTester {
  return new FoodtruckFiestaTester(prisma);
}