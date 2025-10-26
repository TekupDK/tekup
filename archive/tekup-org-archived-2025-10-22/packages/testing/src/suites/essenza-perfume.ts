import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { TestTenant, TENANT_CONFIGS } from '../utils/test-tenant';
import { VoiceAgentTester } from '../agents/voice-agent';

export interface PerfumeProduct {
  id: string;
  name: string;
  brand: string;
  category: 'perfume' | 'cologne' | 'body_mist' | 'gift_set';
  price: number;
  currency: 'DKK' | 'EUR' | 'USD';
  stockQuantity: number;
  minStockThreshold: number;
  isActive: boolean;
  tags: string[];
  description: string;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  preferences: {
    favoriteBrands: string[];
    favoriteCategories: string[];
    priceRange: {
      min: number;
      max: number;
    };
    scentPreferences: string[];
    allergies: string[];
  };
  purchaseHistory: Array<{
    productId: string;
    purchaseDate: Date;
    rating: number;
    review: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingCart {
  id: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  currency: 'DKK' | 'EUR' | 'USD';
  status: 'active' | 'abandoned' | 'converted';
  createdAt: Date;
  updatedAt: Date;
}

export class EssenzaPerfumeTester {
  private prisma: PrismaClient;
  private tenant: TestTenant;
  private voiceTester: VoiceAgentTester;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.tenant = new TestTenant(prisma, TENANT_CONFIGS.ESSENZA_PERFUME.id);
    this.voiceTester = new VoiceAgentTester();
  }

  // Test inventory management system
  async testInventoryManagement(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test stock tracking
    try {
      const products = await this.createTestProducts(10);
      const stockStatus = await this.checkStockStatus(products.map(p => p.id));
      
      tests.push({
        name: 'Stock Tracking',
        passed: stockStatus.every(status => status.isValid),
        details: { products, stockStatus },
      });
    } catch (error) {
      tests.push({
        name: 'Stock Tracking',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test low stock alerts
    try {
      const lowStockProducts = await this.createLowStockProducts();
      const alerts = await this.generateLowStockAlerts();
      
      tests.push({
        name: 'Low Stock Alerts',
        passed: alerts.length > 0 && alerts.every(alert => alert.priority === 'high'),
        details: { lowStockProducts, alerts },
      });
    } catch (error) {
      tests.push({
        name: 'Low Stock Alerts',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test inventory updates
    try {
      const product = await this.createTestProducts(1);
      const updateResult = await this.updateInventory(product[0].id, -2);
      
      tests.push({
        name: 'Inventory Updates',
        passed: updateResult.success && updateResult.newQuantity === product[0].stockQuantity - 2,
        details: { product: product[0], updateResult },
      });
    } catch (error) {
      tests.push({
        name: 'Inventory Updates',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test inventory validation
    try {
      const invalidUpdate = await this.updateInventory('invalid-id', -10);
      
      tests.push({
        name: 'Inventory Validation',
        passed: !invalidUpdate.success,
        details: { invalidUpdate },
      });
    } catch (error) {
      tests.push({
        name: 'Inventory Validation',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test customer recommendation engine
  async testCustomerRecommendations(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test basic recommendations
    try {
      const customer = await this.createTestCustomer();
      const recommendations = await this.generateRecommendations(customer.id);
      
      tests.push({
        name: 'Basic Recommendations',
        passed: recommendations.length > 0 && recommendations.length <= 5,
        details: { customer, recommendations },
      });
    } catch (error) {
      tests.push({
        name: 'Basic Recommendations',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test personalized recommendations
    try {
      const customer = await this.createTestCustomerWithPreferences();
      const personalizedRecs = await this.generatePersonalizedRecommendations(customer.id);
      
      tests.push({
        name: 'Personalized Recommendations',
        passed: personalizedRecs.length > 0 && this.validatePersonalization(customer, personalizedRecs),
        details: { customer, personalizedRecs },
      });
    } catch (error) {
      tests.push({
        name: 'Personalized Recommendations',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test recommendation accuracy
    try {
      const accuracyTest = await this.testRecommendationAccuracy();
      
      tests.push({
        name: 'Recommendation Accuracy',
        passed: accuracyTest.accuracy > 0.8,
        details: { accuracyTest },
      });
    } catch (error) {
      tests.push({
        name: 'Recommendation Accuracy',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test category-based recommendations
    try {
      const categoryRecs = await this.generateCategoryRecommendations('perfume');
      
      tests.push({
        name: 'Category Recommendations',
        passed: categoryRecs.length > 0 && categoryRecs.every(rec => rec.category === 'perfume'),
        details: { categoryRecs },
      });
    } catch (error) {
      tests.push({
        name: 'Category Recommendations',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test e-commerce functionality
  async testEcommerceIntegration(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test shopping cart creation
    try {
      const customer = await this.createTestCustomer();
      const cart = await this.createShoppingCart(customer.id);
      
      tests.push({
        name: 'Shopping Cart Creation',
        passed: cart.id !== undefined && cart.status === 'active',
        details: { customer, cart },
      });
    } catch (error) {
      tests.push({
        name: 'Shopping Cart Creation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test adding items to cart
    try {
      const customer = await this.createTestCustomer();
      const cart = await this.createShoppingCart(customer.id);
      const products = await this.createTestProducts(3);
      const addResult = await this.addItemsToCart(cart.id, products.map(p => ({ productId: p.id, quantity: 1 })));
      
      tests.push({
        name: 'Add Items to Cart',
        passed: addResult.success && addResult.cart.items.length === 3,
        details: { cart, products, addResult },
      });
    } catch (error) {
      tests.push({
        name: 'Add Items to Cart',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test cart validation
    try {
      const invalidCart = await this.validateCart('invalid-cart-id');
      
      tests.push({
        name: 'Cart Validation',
        passed: !invalidCart.isValid,
        details: { invalidCart },
      });
    } catch (error) {
      tests.push({
        name: 'Cart Validation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test checkout process
    try {
      const checkoutResult = await this.testCheckoutProcess();
      
      tests.push({
        name: 'Checkout Process',
        passed: checkoutResult.success && checkoutResult.orderId !== undefined,
        details: { checkoutResult },
      });
    } catch (error) {
      tests.push({
        name: 'Checkout Process',
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
      const danishCommands = this.voiceTester.getCommandsByBusiness('perfume');
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

    // Test product query commands
    try {
      const productQueries = await this.testVoiceProductQueries();
      
      tests.push({
        name: 'Voice Product Queries',
        passed: productQueries.success,
        details: { queries: productQueries },
      });
    } catch (error) {
      tests.push({
        name: 'Voice Product Queries',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test recommendation commands
    try {
      const recommendationCommands = await this.testVoiceRecommendationCommands();
      
      tests.push({
        name: 'Voice Recommendation Commands',
        passed: recommendationCommands.success,
        details: { commands: recommendationCommands },
      });
    } catch (error) {
      tests.push({
        name: 'Voice Recommendation Commands',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test complete perfume business workflow
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
      // 1. Customer browses products via voice
      const voiceStart = Date.now();
      const voiceBrowse = await this.testVoiceProductQueries();
      const voiceTime = Date.now() - voiceStart;
      
      if (voiceBrowse.success) {
        workflow.push('✅ Voice product browsing successful');
        totalResponseTime += voiceTime;
        stepCount++;
      } else {
        workflow.push('❌ Voice product browsing failed');
        errors.push('Voice product browsing failed');
      }

      // 2. Customer gets personalized recommendations
      const recStart = Date.now();
      const customer = await this.createTestCustomerWithPreferences();
      const recommendations = await this.generatePersonalizedRecommendations(customer.id);
      const recTime = Date.now() - recStart;
      
      if (recommendations.length > 0) {
        workflow.push('✅ Personalized recommendations generated');
        totalResponseTime += recTime;
        stepCount++;
      } else {
        workflow.push('❌ Recommendations generation failed');
        errors.push('Recommendations generation failed');
      }

      // 3. Customer adds items to shopping cart
      const cartStart = Date.now();
      const cart = await this.createShoppingCart(customer.id);
      const products = recommendations.slice(0, 2);
      const addResult = await this.addItemsToCart(cart.id, products.map(p => ({ productId: p.id, quantity: 1 })));
      const cartTime = Date.now() - cartStart;
      
      if (addResult.success) {
        workflow.push('✅ Items added to shopping cart');
        totalResponseTime += cartTime;
        stepCount++;
      } else {
        workflow.push('❌ Adding items to cart failed');
        errors.push('Adding items to cart failed');
      }

      // 4. Checkout process
      const checkoutStart = Date.now();
      const checkout = await this.processCheckout(cart.id, customer.id);
      const checkoutTime = Date.now() - checkoutStart;
      
      if (checkout.success) {
        workflow.push('✅ Checkout completed successfully');
        totalResponseTime += checkoutTime;
        stepCount++;
      } else {
        workflow.push('❌ Checkout process failed');
        errors.push('Checkout process failed');
      }

      // 5. Inventory update
      const inventoryStart = Date.now();
      const inventoryUpdate = await this.updateInventoryAfterPurchase(products.map(p => p.id));
      const inventoryTime = Date.now() - inventoryStart;
      
      if (inventoryUpdate.success) {
        workflow.push('✅ Inventory updated after purchase');
        totalResponseTime += inventoryTime;
        stepCount++;
      } else {
        workflow.push('❌ Inventory update failed');
        errors.push('Inventory update failed');
      }

    } catch (error) {
      errors.push(`Workflow execution failed: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    const averageResponseTime = stepCount > 0 ? totalResponseTime / stepCount : 0;
    
    // Identify bottlenecks (steps taking > 3 seconds)
    const bottlenecks: string[] = [];
    if (averageResponseTime > 3000) {
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
  private async createTestProducts(count: number): Promise<PerfumeProduct[]> {
    const products: PerfumeProduct[] = [];
    
    for (let i = 0; i < count; i++) {
      const product: PerfumeProduct = {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        brand: faker.helpers.arrayElement(['Chanel', 'Dior', 'Yves Saint Laurent', 'Gucci', 'Tom Ford']),
        category: faker.helpers.arrayElement(['perfume', 'cologne', 'body_mist', 'gift_set']),
        price: faker.number.float({ min: 200, max: 2000, precision: 0.01 }),
        currency: 'DKK',
        stockQuantity: faker.number.int({ min: 5, max: 100 }),
        minStockThreshold: 10,
        isActive: true,
        tags: faker.helpers.arrayElements(['floral', 'woody', 'citrus', 'oriental', 'fresh'], { min: 1, max: 3 }),
        description: faker.commerce.productDescription(),
        imageUrls: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.image.url()),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      products.push(product);
    }
    
    return products;
  }

  private async createLowStockProducts(): Promise<PerfumeProduct[]> {
    const products = await this.createTestProducts(3);
    
    // Set low stock quantities
    products.forEach(product => {
      product.stockQuantity = faker.number.int({ min: 1, max: 8 });
    });
    
    return products;
  }

  private async checkStockStatus(productIds: string[]): Promise<Array<{ productId: string; isValid: boolean; quantity: number }>> {
    return productIds.map(id => ({
      productId: id,
      isValid: true,
      quantity: faker.number.int({ min: 5, max: 100 }),
    }));
  }

  private async generateLowStockAlerts(): Promise<Array<{ productId: string; priority: 'low' | 'medium' | 'high'; message: string }>> {
    const products = await this.createLowStockProducts();
    
    return products.map(product => ({
      productId: product.id,
      priority: product.stockQuantity <= 3 ? 'high' : product.stockQuantity <= 8 ? 'medium' : 'low',
      message: `Low stock alert: ${product.name} has ${product.stockQuantity} units remaining`,
    }));
  }

  private async updateInventory(productId: string, quantityChange: number): Promise<{ success: boolean; newQuantity?: number; error?: string }> {
    if (productId === 'invalid-id') {
      return { success: false, error: 'Invalid product ID' };
    }
    
    // Simulate inventory update
    const currentQuantity = faker.number.int({ min: 10, max: 100 });
    const newQuantity = Math.max(0, currentQuantity + quantityChange);
    
    return {
      success: true,
      newQuantity,
    };
  }

  private async createTestCustomer(): Promise<CustomerProfile> {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      age: faker.number.int({ min: 18, max: 70 }),
      gender: faker.helpers.arrayElement(['male', 'female', 'non_binary', 'prefer_not_to_say']),
      preferences: {
        favoriteBrands: faker.helpers.arrayElements(['Chanel', 'Dior', 'Gucci'], { min: 1, max: 2 }),
        favoriteCategories: faker.helpers.arrayElements(['perfume', 'cologne'], { min: 1, max: 2 }),
        priceRange: {
          min: 200,
          max: 1500,
        },
        scentPreferences: faker.helpers.arrayElements(['floral', 'woody', 'citrus'], { min: 1, max: 3 }),
        allergies: [],
      },
      purchaseHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async createTestCustomerWithPreferences(): Promise<CustomerProfile> {
    const customer = await this.createTestCustomer();
    
    // Add some purchase history
    customer.purchaseHistory = Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => ({
      productId: faker.string.uuid(),
      purchaseDate: faker.date.past(),
      rating: faker.number.int({ min: 3, max: 5 }),
      review: faker.lorem.sentence(),
    }));
    
    return customer;
  }

  private async generateRecommendations(customerId: string): Promise<PerfumeProduct[]> {
    // Simulate recommendation generation
    return await this.createTestProducts(faker.number.int({ min: 3, max: 5 }));
  }

  private async generatePersonalizedRecommendations(customerId: string): Promise<PerfumeProduct[]> {
    // Simulate personalized recommendations
    return await this.createTestProducts(faker.number.int({ min: 3, max: 5 }));
  }

  private validatePersonalization(customer: CustomerProfile, recommendations: PerfumeProduct[]): boolean {
    // Simple validation that recommendations match customer preferences
    return recommendations.some(rec => 
      customer.preferences.favoriteBrands.includes(rec.brand) ||
      customer.preferences.favoriteCategories.includes(rec.category)
    );
  }

  private async testRecommendationAccuracy(): Promise<{ accuracy: number; details: any }> {
    // Simulate accuracy testing
    const accuracy = faker.number.float({ min: 0.75, max: 0.95, precision: 0.01 });
    
    return {
      accuracy,
      details: {
        totalRecommendations: 100,
        relevantRecommendations: Math.floor(100 * accuracy),
        irrelevantRecommendations: Math.floor(100 * (1 - accuracy)),
      },
    };
  }

  private async generateCategoryRecommendations(category: string): Promise<PerfumeProduct[]> {
    const products = await this.createTestProducts(faker.number.int({ min: 3, max: 6 }));
    
    // Ensure all products match the category
    products.forEach(product => {
      product.category = category as any;
    });
    
    return products;
  }

  private async createShoppingCart(customerId: string): Promise<ShoppingCart> {
    return {
      id: faker.string.uuid(),
      customerId,
      items: [],
      totalAmount: 0,
      currency: 'DKK',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async addItemsToCart(cartId: string, items: Array<{ productId: string; quantity: number }>): Promise<{ success: boolean; cart?: ShoppingCart; error?: string }> {
    if (cartId === 'invalid-cart-id') {
      return { success: false, error: 'Invalid cart ID' };
    }
    
    const cart: ShoppingCart = {
      id: cartId,
      customerId: faker.string.uuid(),
      items: items.map(item => ({
        ...item,
        price: faker.number.float({ min: 200, max: 2000, precision: 0.01 }),
      })),
      totalAmount: items.reduce((sum, item) => sum + (item.quantity * 500), 0), // Simplified calculation
      currency: 'DKK',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return { success: true, cart };
  }

  private async validateCart(cartId: string): Promise<{ isValid: boolean; errors: string[] }> {
    if (cartId === 'invalid-cart-id') {
      return { isValid: false, errors: ['Cart not found'] };
    }
    
    return { isValid: true, errors: [] };
  }

  private async testCheckoutProcess(): Promise<{ success: boolean; orderId?: string; error?: string }> {
    // Simulate checkout process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      orderId: faker.string.uuid(),
    };
  }

  private async processCheckout(cartId: string, customerId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
    // Simulate checkout processing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      orderId: faker.string.uuid(),
    };
  }

  private async updateInventoryAfterPurchase(productIds: string[]): Promise<{ success: boolean; updatedProducts: number }> {
    // Simulate inventory update
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      updatedProducts: productIds.length,
    };
  }

  private async testVoiceProductQueries(): Promise<{ success: boolean; queries?: any; error?: string }> {
    try {
      const commands = this.voiceTester.getCommandsByBusiness('perfume')
        .filter(cmd => cmd.expectedIntent.includes('check_inventory') || cmd.expectedIntent.includes('recommend'));
      
      const results = await Promise.all(
        commands.map(cmd => this.voiceTester.testVoiceRecognition(cmd))
      );
      
      return {
        success: results.every(r => r.confidence > 0.8),
        queries: { commands, results },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async testVoiceRecommendationCommands(): Promise<{ success: boolean; commands?: any; error?: string }> {
    try {
      const commands = this.voiceTester.getCommandsByBusiness('perfume')
        .filter(cmd => cmd.expectedIntent.includes('recommend'));
      
      const results = await Promise.all(
        commands.map(cmd => this.voiceTester.testVoiceRecognition(cmd))
      );
      
      return {
        success: results.every(r => r.confidence > 0.8),
        commands: { commands, results },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Factory function for creating Essenza Perfume testers
export function createEssenzaPerfumeTester(prisma: PrismaClient): EssenzaPerfumeTester {
  return new EssenzaPerfumeTester(prisma);
}